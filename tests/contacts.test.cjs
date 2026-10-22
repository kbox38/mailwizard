const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');
const Papa = require('papaparse');

// Run the actual TypeScript helpers with Node's built-in runner, without a test dependency.
function loadTS(relativePath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(module, module.exports, require);
  return module.exports;
}

const { contactPageQuery, CONTACT_PAGE_SIZE } = loadTS('src/lib/contactQueries.ts');
const { mapContactRows } = loadTS('src/utils/contactImport.ts');

test('CSV retains ignored columns in the file without adding them to contact payloads', () => {
  const { data } = Papa.parse('Email,Name,Unused,\n PERSON@example.com , Ada ,anything,extra\n,Missing email,ignored,extra', { header: true });
  const contacts = mapContactRows(data, { Email: 'email', Name: 'first_name', Unused: '', '': '' }, 'owner');
  assert.deepEqual(contacts, [{ user_id: 'owner', status: 'active', email: 'person@example.com', first_name: 'Ada' }]);
  assert.ok(!Object.hasOwn(contacts[0], ''));
});

test('unknown/unmapped destinations cannot become database columns or override ownership', () => {
  const contacts = mapContactRows([{ Email: 'a@example.com', Unknown: 'value', Owner: 'other', Role: 'Engineer' }],
    { Email: 'email', Unknown: 'nonexistent', Owner: 'user_id', Role: 'role' }, 'owner');
  assert.deepEqual(contacts, [{ email: 'a@example.com', role: 'Engineer', user_id: 'owner', status: 'active' }]);
  assert.deepEqual(mapContactRows([{ Email: '  ' }], { Email: 'email' }, 'owner'), []);
});

const fixture = Array.from({ length: 1505 }, (_, index) => ({
  id: String(index), user_id: 'owner', email: `person${index}@example.com`,
  first_name: index === 1400 ? 'Needle' : 'Person', group: index >= 1200 ? 'group-b' : 'group-a',
}));

function mockDatabase() {
  const requests = [];
  const client = createClient('https://example.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      requests.push(url);
      let rows = fixture.filter(row => url.searchParams.get('user_id') === `eq.${row.user_id}`);
      const groupFilter = url.searchParams.get('contact_group_members.group_id');
      if (groupFilter) rows = rows.filter(row => groupFilter === `eq.${row.group}`);
      const search = url.searchParams.get('or');
      if (search) {
        const value = JSON.parse(search.match(/email\.ilike\.("(?:\\.|[^"\\])*")/)[1]).slice(1, -1).toLowerCase();
        rows = rows.filter(row => [row.email, row.first_name].some(valueInRow => valueInRow.toLowerCase().includes(value)));
      }
      const total = rows.length;
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = Math.min(1000, Number(url.searchParams.get('limit') || 1000));
      rows = rows.slice(offset, offset + limit);
      assert.match(new Headers(init.headers).get('Prefer'), /count=exact/);
      return new Response(JSON.stringify(rows), { status: 200, headers: {
        'Content-Type': 'application/json', 'Content-Range': `${offset}-${offset + rows.length - 1}/${total}`,
      } });
    } },
  });
  return { client, requests };
}

test('search finds contacts beyond the first 1000 before applying pagination', async () => {
  const { client, requests } = mockDatabase();
  const { data, error, count } = await contactPageQuery(client, 'owner', null, 'NEEDLE', 0);
  assert.equal(error, null);
  assert.equal(count, 1);
  assert.equal(data[0].id, '1400');
  assert.equal(requests[0].searchParams.get('order'), 'created_at.desc,id.desc');
});

test('pagination reaches rows after 1000 and reports the full total', async () => {
  const { client } = mockDatabase();
  const { data, error, count } = await contactPageQuery(client, 'owner', null, '', 24);
  assert.equal(error, null);
  assert.equal(count, 1505);
  assert.equal(data.length, CONTACT_PAGE_SIZE);
  assert.equal(data[0].id, '1200');
});

test('group search filters the full group without a truncated membership ID list', async () => {
  const { client, requests } = mockDatabase();
  const result = await contactPageQuery(client, 'owner', 'group-b', 'needle', 0);
  assert.equal(result.error, null);
  assert.equal(result.count, 1);
  assert.equal(result.data[0].id, '1400');
  assert.match(requests[0].searchParams.get('select'), /contact_group_members!inner/);
  const otherGroup = await contactPageQuery(client, 'owner', 'group-a', 'needle', 0);
  assert.equal(otherGroup.count, 0);
});

test('search quotes filter syntax and escapes literal LIKE wildcards', async () => {
  const requests = [];
  const client = createClient('https://example.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async input => {
      requests.push(new URL(String(input)));
      return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    } },
  });
  await contactPageQuery(client, 'owner', null, 'A,B(50%)_"\\', 0);
  const filter = requests[0].searchParams.get('or');
  const pattern = JSON.stringify('%A,B(50\\%)\\_"\\\\%');
  assert.equal(filter, `(${['email', 'first_name', 'last_name', 'company'].map(field => `${field}.ilike.${pattern}`).join(',')})`);
});
