const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

function loadTS(file, resolve = require) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(module, module.exports, resolve);
  return module.exports;
}
const helpers = loadTS('src/lib/emailVerification.ts');
const { loadDailyEngagement } = loadTS('src/lib/engagementQueries.ts');
const user = { id: 'owner', email: 'owner@example.com', email_confirmed_at: '2026-10-23T10:00:00Z' };

function mockClient(response, status = 200) {
  const requests = [];
  const client = createClient('https://example.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      requests.push({ url: new URL(String(input)), body: init.body && JSON.parse(init.body) });
      return new Response(JSON.stringify(response), { status, headers: { 'Content-Type': 'application/json' } });
    } },
  });
  return { client, requests };
}

test('resend preserves signup semantics, normalizes email and includes callback', async () => {
  const { client, requests } = mockClient({});
  await helpers.resendVerification(client, ' Owner@Example.com ', 'https://mailwizard.io');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url.pathname, '/auth/v1/resend');
  assert.equal(requests[0].url.searchParams.get('redirect_to'), 'https://mailwizard.io/auth/callback');
  assert.equal(requests[0].body.email, 'owner@example.com');
  assert.equal(requests[0].body.type, 'signup');
});

test('provider failure is propagated and never treated as a sent code', async () => {
  const { client } = mockClient({ code: 'unexpected_failure', msg: 'Error sending confirmation email' }, 500);
  await assert.rejects(helpers.resendVerification(client, user.email, 'https://mailwizard.io'), /Error sending confirmation email/);
  assert.match(helpers.authErrorMessage({ message: 'Error sending confirmation email' }), /could not send/);
  assert.match(helpers.authErrorMessage({ code: 'over_email_send_rate_limit', status: 429 }), /wait/);
  assert.match(helpers.authErrorMessage({ code: 'invalid_credentials' }), /Incorrect email or password/);
});

test('repeated confirmed signup cannot be reported as a newly sent confirmation', async () => {
  const { client } = mockClient({ ...user, identities: [] });
  await assert.rejects(helpers.signUpWithEmail(client, user.email, 'test-password', 'Owner', 'https://mailwizard.io'), /sign in or reset your password/);
});

test('new unconfirmed signup is accepted with a normalized email and callback', async () => {
  const { client, requests } = mockClient({ ...user, email_confirmed_at: null, identities: [{ id: 'identity' }] });
  const result = await helpers.signUpWithEmail(client, ' Owner@Example.com ', 'test-password', ' Owner ', 'https://mailwizard.io');
  assert.equal(result.user.id, 'owner');
  assert.equal(result.session, null);
  assert.equal(requests[0].body.email, user.email);
  assert.equal(requests[0].body.data.full_name, 'Owner');
  assert.equal(requests[0].url.searchParams.get('redirect_to'), 'https://mailwizard.io/auth/callback');
});

test('code verification uses the email OTP type and returns an authenticated session', async () => {
  const { client, requests } = mockClient({ user, access_token: 'access', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 });
  const result = await helpers.verifyEmailCode(client, ' Owner@Example.com ', '123456');
  assert.equal(result.user.id, 'owner');
  assert.ok(result.session);
  assert.equal(requests[0].body.type, 'email');
  assert.equal(requests[0].body.email, 'owner@example.com');
  await client.auth.signOut({ scope: 'local' });
});

test('malformed code is rejected without a request and missing session cannot verify', async () => {
  const { client, requests } = mockClient({ user });
  await assert.rejects(helpers.verifyEmailCode(client, user.email, '12a456'), /6-digit/);
  assert.equal(requests.length, 0);
  await assert.rejects(helpers.verifyEmailCode(client, user.email, '123456'), /session/);
});

test('pending address and cooldown survive reload and are cleared after verification', () => {
  const values = new Map();
  global.sessionStorage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  helpers.savePendingVerification(' Owner@Example.com ', 123456789);
  assert.deepEqual(helpers.readPendingVerification(), { email: 'owner@example.com', resendAfter: 123456789 });
  helpers.clearPendingVerification();
  assert.deepEqual(helpers.readPendingVerification(), { email: '', resendAfter: 0 });
  global.sessionStorage.getItem = () => '{invalid';
  assert.equal(helpers.readPendingVerification().email, '');
  global.sessionStorage.getItem = () => { throw new Error('blocked'); };
  assert.equal(helpers.readPendingVerification().email, '');
  delete global.sessionStorage;
});

test('engagement chart scopes by owner and reads beyond 1000 rows', async () => {
  const urls = [];
  const rows = Array.from({ length: 1505 }, (_, id) => ({ id, event_type: id % 2 ? 'click' : 'open', timestamp: '2026-10-23T10:00:00Z' }));
  const client = createClient('https://example.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async input => {
      const url = new URL(String(input)); urls.push(url);
      const offset = Number(url.searchParams.get('offset'));
      assert.equal(url.searchParams.get('campaigns.user_id'), 'eq.owner');
      assert.equal(url.searchParams.get('event_type'), 'in.(open,click)');
      assert.equal(url.searchParams.get('campaign_id'), null);
      return new Response(JSON.stringify(rows.slice(offset, offset + 1000)), { headers: { 'Content-Type': 'application/json' } });
    } },
  });
  const result = await loadDailyEngagement(client, 'owner', '2026-10-01', '2026-10-24');
  assert.deepEqual(result.get('2026-10-23'), { opens: 753, clicks: 752 });
  assert.equal(urls.length, 2);
});

test('analytics database errors propagate instead of becoming empty charts', async () => {
  const { client } = mockClient({ message: 'statement timeout', code: '57014' }, 500);
  await assert.rejects(loadDailyEngagement(client, 'owner', '2026-10-01', '2026-10-24'), error => error.code === '57014');
});

function backendFixture(currentUser = user, campaignOwner = 'owner', paid = true) {
  let auth; let send; let job;
  const router = { use: handler => { auth = handler; }, post: (_path, handler) => { send = handler; }, get() {} };
  loadTS('backend/src/routes/campaigns.ts', name => {
    if (name === '@supabase/supabase-js') return { createClient: () => ({ rpc: async () => ({ data: paid }) }) };
    if (name === 'express') return { Router: () => router };
    if (name.includes('emailQueue')) return { queueEmailCampaign: async value => { job = value; return { id: 'job' }; } };
    if (name.includes('cacheService')) return { CacheService: {
      checkRateLimit: async () => ({ allowed: true }),
      getCampaign: async () => ({ id: 'campaign', user_id: campaignOwner, subject: 'Subject', content: { html: 'Hello' } }),
      getContacts: async () => [{ email: 'contact@example.com' }],
    } };
    if (name.includes('supabase')) return { default: { auth: { getUser: async () => ({ data: { user: currentUser }, error: null }) } } };
    throw new Error(name);
  });
  const res = { locals: {}, statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  return { auth, send, res, get job() { return job; } };
}

test('campaign backend rejects unauthenticated and unverified callers', async () => {
  const missing = backendFixture();
  await missing.auth({ headers: {} }, missing.res, () => assert.fail('must not continue'));
  assert.equal(missing.res.statusCode, 401);
  const unverified = backendFixture({ ...user, email_confirmed_at: null });
  await unverified.auth({ headers: { authorization: 'Bearer token' } }, unverified.res, () => assert.fail('must not continue'));
  assert.equal(unverified.res.statusCode, 403);
});

test('campaign backend refuses another user campaign and ignores forged body userId', async () => {
  const other = backendFixture(user, 'someone-else');
  const req = { headers: { authorization: 'Bearer token' }, params: { campaignId: 'campaign' }, body: { userId: 'someone-else' } };
  await other.auth(req, other.res, () => {});
  await other.send(req, other.res);
  assert.equal(other.res.statusCode, 404);
  assert.equal(other.job, undefined);
  const own = backendFixture();
  await own.auth(req, own.res, () => {});
  await own.send(req, own.res);
  assert.equal(own.res.statusCode, 200);
  assert.equal(own.job.userId, 'owner');
});

async function runTestEmail({ recipient = user.email, verified = true, paid = true, rateError = null, domain = null, from = 'noreply@mail.mailwizard.io' } = {}) {
  const vm = require('node:vm');
  let handler; let deliveries = 0;
  const client = {
    auth: { getUser: async () => ({ data: { user: { ...user, email_confirmed_at: verified ? user.email_confirmed_at : null } } }) },
    rpc: async name => name==='has_platform_access' ? { data: paid } : { data: { allowed: true }, error: rateError },
    from: () => {
      const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: domain }) };
      return query;
    },
  };
  const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/send-test-email/index.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  vm.runInNewContext(outputText, {
    exports: {}, require: name => name.includes('supabase-js') ? { createClient: () => client } : name.includes('paidAccess') ? loadTS('supabase/functions/_shared/paidAccess.ts') : {},
    Deno: { env: { get: () => 'configured' }, serve: value => { handler = value; } },
    Request, Response, console: { log() {}, warn() {}, error() {} }, setTimeout,
    fetch: async () => { deliveries++; return new Response(null, { status: 202 }); },
  });
  const response = await handler(new Request('https://example.com', {
    method: 'POST', headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_email: recipient, from_email: from, subject: 'Test', html_body: '<p>Hello</p>' }),
  }));
  return { response, deliveries };
}

test('test-mail endpoint blocks unverified callers and arbitrary recipients before delivery', async () => {
  for (const options of [{ verified: false }, { recipient: 'stranger@example.com' }]) {
    const { response, deliveries } = await runTestEmail(options);
    assert.equal(response.status, 403);
    assert.equal(deliveries, 0);
  }
});

test('test-mail endpoint fails closed on a broken rate limiter and unowned sender domain', async () => {
  const limited = await runTestEmail({ rateError: { message: 'RPC failed' } });
  assert.equal(limited.response.status, 500);
  assert.equal(limited.deliveries, 0);
  const unowned = await runTestEmail({ from: 'owner@another-tenant.example' });
  assert.equal(unowned.response.status, 403);
  assert.equal(unowned.deliveries, 0);
});

test('test-mail endpoint accepts a verified caller sending to their own mailbox', async () => {
  const { response, deliveries } = await runTestEmail();
  assert.equal(response.status, 200);
  assert.equal(deliveries, 1);
});
test('test-mail and campaign endpoints reject unpaid callers before delivery',async()=>{
  const {response,deliveries}=await runTestEmail({paid:false});
  assert.equal(response.status,403);assert.equal(deliveries,0);
  const fixture=backendFixture(user,'owner',false);
  await fixture.auth({headers:{authorization:'Bearer token'}},fixture.res,()=>assert.fail('Unpaid request advanced'));
  assert.equal(fixture.res.statusCode,403);assert.equal(fixture.job,undefined);
});
