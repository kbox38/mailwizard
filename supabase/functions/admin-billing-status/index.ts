import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info', 'Access-Control-Allow-Methods':'POST,OPTIONS' };
Deno.serve(async (req: Request) => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers:{...cors,'Content-Type':'application/json'} });
  if (req.method==='OPTIONS') return new Response(null,{headers:cors});
  if (req.method!=='POST') return reply({error:'Method not allowed'},405);
  try {
    const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const url=Deno.env.get('SUPABASE_URL') || '';
    const authorization=req.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ') || !serviceKey) return reply({error:'Authentication required'},401);
    if (authorization!==`Bearer ${serviceKey}`) {
      const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY') || '',{global:{headers:{Authorization:authorization}}});
      const {data:{user},error}=await caller.auth.getUser();
      if(error||!user) return reply({error:'Invalid session'},401);
      const access=await caller.rpc('is_platform_admin');
      if(access.error||access.data!==true) return reply({error:'Administrator access required'},403);
    }
    const {user_id}=await req.json();
    if(typeof user_id!=='string'||!/^[0-9a-f-]{36}$/i.test(user_id)) return reply({error:'Invalid account'},400);
    const service=createClient(url,serviceKey);
    const {data:profile,error}=await service.from('profiles').select('stripe_subscription_id').eq('id',user_id).single();
    if(error||!profile) return reply({error:'Account not found'},404);
    if(!profile.stripe_subscription_id) return reply({status:'none',plan:null});
    const stripeKey=Deno.env.get('STRIPE_SECRET_KEY');
    if(!stripeKey) return reply({error:'Billing is not configured'},503);
    const response=await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(profile.stripe_subscription_id)}`,{
      headers:{Authorization:`Bearer ${stripeKey}`,'Stripe-Version':'2023-10-16'},signal:AbortSignal.timeout(15000),
    });
    if(response.status===404) return reply({status:'not_found',plan:null});
    if(!response.ok) return reply({error:'Unable to verify billing status'},502);
    const subscription=await response.json();
    const price=subscription.items?.data?.[0]?.price?.id;
    const plan=price&&price===Deno.env.get('STRIPE_PRO_PRICE_ID')?'pro':price&&price===Deno.env.get('STRIPE_PRO_PLUS_PRICE_ID')?'pro_plus':null;
    return reply({status:subscription.status,plan,metadata_plan:subscription.metadata?.plan_type||null,
      amount:subscription.items?.data?.[0]?.price?.unit_amount,currency:subscription.items?.data?.[0]?.price?.currency,
      cancel_at_period_end:subscription.cancel_at_period_end,current_period_end:subscription.current_period_end});
  } catch { return reply({error:'Unable to verify billing status'},500); }
});
