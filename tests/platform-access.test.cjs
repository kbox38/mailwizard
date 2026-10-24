const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file) {
  const module = {exports:{}};
  const output = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('module','exports',output)(module,module.exports);
  return module.exports;
}
const {effectivePlan,hasPaidAccess}=load('src/lib/platformAccess.ts');
const {requirePaidAccess,reserveEmailQuota}=load('supabase/functions/_shared/paidAccess.ts');
test('legacy free, inactive, suspended, and explicitly revoked plans have no access',()=>{
  for(const profile of [null,{plan_type:'free',subscription_status:'active'},
    {plan_type:'pro',subscription_status:'past_due'},
    {plan_type:'pro_plus',subscription_status:'active',account_suspended:true},
    {plan_type:'pro_plus',subscription_status:'active',admin_plan_override:'none'}]) assert.equal(hasPaidAccess(profile),false);
  assert.equal(effectivePlan({plan_type:'free'}),'none');
});
test('paid billing and protected admin grants select the effective plan',()=>{
  assert.equal(hasPaidAccess({plan_type:'pro',subscription_status:'active'}),true);
  assert.equal(hasPaidAccess({plan_type:'none',subscription_status:'inactive',admin_plan_override:'pro_plus'}),true);
  assert.equal(effectivePlan({plan_type:'pro',admin_plan_override:'pro_plus'}),'pro_plus');
});
test('server checks fail closed on denied access and database errors',async()=>{
  for(const fn of [client=>requirePaidAccess(client,'owner'),client=>reserveEmailQuota(client,'owner',900)]) {
    await assert.rejects(fn({rpc:async()=>({data:false})}),error=>error.status===403);
    await assert.rejects(fn({rpc:async()=>({error:{message:'offline'}})}),error=>error.status===503);
    await fn({rpc:async()=>({data:true})});
  }
});
const {createRecipientToken,verifyRecipientToken}=load('supabase/functions/_shared/recipientToken.ts');
test('resubscribe requires a signed token scoped to one contact and purpose',async()=>{
  const contactId='11111111-1111-4111-8111-111111111111',campaignId='22222222-2222-4222-8222-222222222222';
  const token=await createRecipientToken(contactId,campaignId,'test-secret');
  assert.equal((await verifyRecipientToken(token,'test-secret')).contactId,contactId);
  assert.equal(await verifyRecipientToken(token,'another-secret'),null);
  assert.equal(await verifyRecipientToken(null,'test-secret'),null);
  const [payload,signature]=token.split('.');const data=JSON.parse(atob(payload));
  data.contactId='33333333-3333-4333-8333-333333333333';
  assert.equal(await verifyRecipientToken(btoa(JSON.stringify(data))+'.'+signature,'test-secret'),null);
  assert.equal(await verifyRecipientToken(token+'.extra','test-secret'),null);
});
test('SendGrid webhook rejects unsigned/forged payloads and accepts a real ECDSA signature',async()=>{
  const nodeCrypto=require('node:crypto');const vm=require('node:vm');
  const keys=nodeCrypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const publicKey=keys.publicKey.export({type:'spki',format:'der'}).toString('base64');
  let handler;let databaseClients=0;
  const source=fs.readFileSync('supabase/functions/sendgrid-webhook/index.ts','utf8');
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(output,{exports:{},require:name=>name.includes('supabase-js')?{createClient:()=>{databaseClients++;return {};}}:{serve:fn=>{handler=fn;}},
    Deno:{env:{get:name=>name==='SENDGRID_WEBHOOK_VERIFICATION_KEY'?publicKey:'configured'}},crypto:globalThis.crypto,TextEncoder,Uint8Array,atob,Response,console:{log(){},warn(){},error(){}}});
  const request=(body,headers={})=>new Request('https://example.test',{method:'POST',headers,body});
  assert.equal((await handler(request('[]'))).status,401);
  assert.equal((await handler(request('[]',{'x-twilio-email-event-webhook-signature':'forged','x-twilio-email-event-webhook-timestamp':'1'}))).status,401);
  assert.equal(databaseClients,0);
  const timestamp=String(Math.floor(Date.now()/1000));const body='[]';
  const signature=nodeCrypto.sign('sha256',Buffer.from(timestamp+body),keys.privateKey).toString('base64');
  const headers={'x-twilio-email-event-webhook-signature':signature,'x-twilio-email-event-webhook-timestamp':timestamp};
  assert.equal((await handler(request('[{}]',headers))).status,401);
  assert.equal((await handler(request(body,headers))).status,200);
  assert.equal(databaseClients,1);
});
