const { chromium }=require('playwright-core');
const { spawn }=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5174','--strictPort'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
server.stderr.pipe(process.stderr);
const base='http://127.0.0.1:5174';
const account={id:'0913d024-937a-42ef-beec-3d2c8fdb97fe',email:'kevinbox@fuelyourgrowth.net',email_confirmed_at:'2026-10-23T10:00:00Z',aud:'authenticated',role:'authenticated',user_metadata:{},app_metadata:{}};
const overview={users:6,new_users_30d:1,paid_access:6,emails_this_month:142,active_users_30d:3,by_plan:{pro:1,pro_plus:5},campaigns:9,contacts:150,scheduled_campaigns:0,sending_campaigns:0,checked_at:new Date().toISOString(),activity:[]};
const profile={...account,full_name:'Kevin',plan_type:'pro_plus',subscription_status:'active',admin_plan_override:null,account_suspended:false};
const listed={...profile,email_verified:true,has_access:true,is_admin:true,last_sign_in_at:new Date().toISOString(),contacts:150,campaigns:9,has_billing_subscription:false};
async function context(browser,{admin=true,paid=true,authenticated=true}={}) {
  const ctx=await browser.newContext(); const mutations=[]; const failures=[];
  await ctx.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await ctx.route('https://dmgrxgtcmcurjvmxlfvw.supabase.co/**',async route=>{
    const url=new URL(route.request().url()); let data=null;
    if(url.pathname==='/auth/v1/user') data=account;
    else if(url.pathname.includes('/profiles')) data={...profile,plan_type:paid?'pro_plus':'none',subscription_status:paid?'active':'inactive'};
    else if(url.pathname.endsWith('/is_platform_admin')) data=admin;
    else if(url.pathname.endsWith('/has_platform_access')) data=paid;
    else if(url.pathname.endsWith('/admin_overview')) data=overview;
    else if(url.pathname.endsWith('/admin_users')) data={users:[listed],total:1,page:1,total_pages:1};
    else if(url.pathname.endsWith('/admin_set_plan')) {mutations.push(route.request().postDataJSON());data=null;}
    else if(url.pathname.endsWith('/logout')) data={};
    else {failures.push(url.pathname); return route.fulfill({status:500,json:{message:'Unexpected fixture request'}});}
    await route.fulfill({status:200,json:data});
  });
  await ctx.addInitScript(({authenticated,account})=>{
    localStorage.setItem('adminToken','forged-legacy-token');
    if(authenticated) localStorage.setItem('sb-dmgrxgtcmcurjvmxlfvw-auth-token',JSON.stringify({access_token:'header.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600,sub:account.id,role:'authenticated'}))+'.signature',refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:account}));
  },{authenticated,account});
  const page=await ctx.newPage(); page.on('pageerror',error=>failures.push(error.message));
  return {ctx,page,mutations,failures};
}
(async()=>{
 let browser;
 try {
  let ready=false;
  for(let i=0;i<240;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{} if(server.exitCode!==null)break;await new Promise(resolve=>setTimeout(resolve,250));}
  if(!ready)throw new Error('UI verification server failed to start');
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  fs.mkdirSync('.qa',{recursive:true});
  const admin=await context(browser);
  await admin.page.goto(base+'/admin/dashboard',{waitUntil:'domcontentloaded'}); await admin.page.getByRole('heading',{name:'Platform Overview'}).waitFor();
  await admin.page.getByText('Accounts with access',{exact:true}).waitFor();
  await admin.page.screenshot({path:'.qa/admin-desktop.png',fullPage:true});
  await admin.page.goto(base+'/admin/users'); await admin.page.getByRole('button',{name:'Manage plan'}).click();
  await admin.page.getByRole('dialog').waitFor(); assert.equal(await admin.page.getByRole('button',{name:'Save changes'}).isDisabled(),true);
  await admin.page.getByLabel('Access plan',{exact:true}).selectOption('pro');
  await admin.page.getByLabel('Reason',{exact:true}).fill('Browser verification grant');
  await admin.page.getByRole('button',{name:'Save changes'}).click(); await admin.page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(admin.mutations[0].p_plan,'pro'); assert.equal(admin.mutations[0].p_reason,'Browser verification grant');
  await admin.page.setViewportSize({width:390,height:844}); await admin.page.goto(base+'/admin/dashboard'); await admin.page.getByText('Accounts with access',{exact:true}).waitFor();
  await admin.page.screenshot({path:'.qa/admin-mobile.png',fullPage:true});
  assert.ok(await admin.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const unpaid=await context(browser,{admin:false,paid:false}); await unpaid.page.goto(base+'/app/dashboard'); await unpaid.page.waitForURL('**/subscribe');
  assert.equal(await unpaid.page.getByText(/free forever|free plan|start free trial/i).count(),0);
  const forbidden=await context(browser,{admin:false}); await forbidden.page.goto(base+'/admin/users'); await forbidden.page.waitForURL('**/admin/login');
  const anonymous=await context(browser,{admin:false,authenticated:false}); await anonymous.page.goto(base+'/admin/users'); await anonymous.page.waitForURL('**/admin/login');
  for(const c of [admin,unpaid,forbidden,anonymous]) assert.deepEqual(c.failures,[]);
  console.log('PASS: admin dashboard, audited plan dialog, mobile layout, unpaid paywall, non-admin and anonymous guards, forged legacy token denial');
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
