import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

Deno.serve(async (req: Request) => {
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
  if(req.method!=='POST') return reply({error:'Method not allowed'},405);
  const stripeKey=Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret=Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if(!stripeKey||!webhookSecret) return reply({error:'Billing is not configured'},503);
  const stripe=new Stripe(stripeKey,{apiVersion:'2023-10-16'});
  const signature=req.headers.get('stripe-signature');
  if(!signature) return reply({error:'Missing signature'},400);
  let event: Stripe.Event;
  try { event=await stripe.webhooks.constructEventAsync(await req.text(),signature,webhookSecret); }
  catch { return reply({error:'Invalid signature'},400); }
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const syncSubscription=async(id:string)=>{
    // Fetch current Stripe state so delayed/out-of-order events cannot revive
    // a cancelled subscription or revoke a newer successful payment.
    const subscription=await stripe.subscriptions.retrieve(id);
    const customerId=typeof subscription.customer==='string'?subscription.customer:subscription.customer.id;
    const {data:profile,error}=await db.from('profiles').select('id,stripe_subscription_id').eq('stripe_customer_id',customerId).maybeSingle();
    if(error) throw error;
    if(!profile) return;
    if(profile.stripe_subscription_id && profile.stripe_subscription_id!==id) {
      const newer=await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      if(['active','trialing','past_due','unpaid','incomplete'].includes(newer.status)) return;
    }
    const price=subscription.items.data[0]?.price.id;
    const pro=Deno.env.get('STRIPE_PRO_PRICE_ID');
    const plus=Deno.env.get('STRIPE_PRO_PLUS_PRICE_ID');
    const legacyPlan=subscription.metadata?.plan_type;
    const plan=price&&pro&&price===pro?'pro':price&&plus&&price===plus?'pro_plus'
      :legacyPlan==='pro'||legacyPlan==='pro_plus'?legacyPlan:'none';
    const ended=['canceled','incomplete_expired'].includes(subscription.status);
    const {error:updateError}=await db.from('profiles').update({
      plan_type:ended?'none':plan,subscription_status:subscription.status,
      stripe_subscription_id:ended?null:subscription.id,updated_at:new Date().toISOString(),
      // admin_plan_override is deliberately independent from billing state.
    }).eq('id',profile.id);
    if(updateError) throw updateError;
  };
  try {
    if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type)) {
      await syncSubscription((event.data.object as Stripe.Subscription).id);
    } else if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)) {
      const session=event.data.object as Stripe.Checkout.Session;
      if(['paid','no_payment_required'].includes(session.payment_status) && typeof session.subscription==='string') await syncSubscription(session.subscription);
    } else if(['invoice.payment_succeeded','invoice.payment_failed'].includes(event.type)) {
      const invoice=event.data.object as Stripe.Invoice;
      if(typeof invoice.subscription==='string') await syncSubscription(invoice.subscription);
      if(event.type==='invoice.payment_succeeded' && invoice.id) {
        const customerId=typeof invoice.customer==='string'?invoice.customer:invoice.customer?.id;
        const {data:profile,error}=await db.from('profiles').select('id').eq('stripe_customer_id',customerId).maybeSingle();
        if(error) throw error;
        if(profile) {
          const {error:invoiceError}=await db.from('invoices').upsert({user_id:profile.id,stripe_invoice_id:invoice.id,amount:invoice.amount_paid,status:invoice.status||'paid'},{onConflict:'stripe_invoice_id'});
          if(invoiceError) throw invoiceError;
        }
      }
    }
    return reply({received:true});
  } catch (failure) {
    console.error('Billing webhook processing failed',event.id,failure instanceof Error?failure.message:'Unknown error');
    return reply({error:'Unable to process billing event'},500);
  }
});
