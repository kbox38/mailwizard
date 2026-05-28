/**
 * STRIPE WEBHOOK EDGE FUNCTION
 * 
 * Handles Stripe webhook events for subscription lifecycle:
 * - checkout.session.completed: Upgrade user to paid plan
 * - customer.subscription.updated: Update subscription status
 * - customer.subscription.deleted: Downgrade to free plan
 * - invoice.payment_succeeded: Record successful payment
 * - invoice.payment_failed: Handle payment failure
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get Stripe configuration
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey || !webhookSecret) {
      throw new Error('Stripe configuration missing');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const body = await req.text();
    
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Received webhook event:', event.type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;

        console.log('Checkout completed:', { userId, planType, sessionId: session.id });

        if (!userId || !planType) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Update user profile with subscription details
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan_type: planType,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        } else {
          console.log('Successfully upgraded user to plan:', planType);
        }

        // TODO: Send welcome email for paid plan
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Subscription created:', subscription.id);

        // Find user by stripe_customer_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

          console.log('Subscription linked to user:', profile.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);

        // Find user by stripe_customer_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          // Get the price ID from the subscription to determine plan type
          const priceId = subscription.items.data[0]?.price.id;
          const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID');
          const proPlusPriceId = Deno.env.get('STRIPE_PRO_PLUS_PRICE_ID');

          // Determine plan type based on price ID
          let planType: 'free' | 'pro' | 'pro_plus' = 'free';
          
          if (priceId === proPriceId) {
            planType = 'pro';
          } else if (priceId === proPlusPriceId) {
            planType = 'pro_plus';
          }

          console.log('Detected plan change to:', planType, 'from price:', priceId);

          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              plan_type: planType, // Update plan type based on new price
              subscription_status: subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
          } else {
            console.log('Updated subscription for user:', profile.id, 'New plan:', planType);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Subscription deleted:', subscription.id);

        // Find user and downgrade to free plan
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const { error: downgradeError } = await supabase
            .from('profiles')
            .update({
              plan_type: 'free',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

          if (downgradeError) {
            console.error('Error downgrading user:', downgradeError);
          } else {
            console.log('Downgraded user to free plan:', profile.id);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log('Payment succeeded:', invoice.id, 'Amount:', invoice.amount_paid);

        // Find user and record invoice
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile && invoice.id) {
          // Insert invoice record
          const { error: invoiceError } = await supabase
            .from('invoices')
            .insert({
              user_id: profile.id,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid,
              status: invoice.status || 'paid',
            });

          if (invoiceError) {
            console.error('Error recording invoice:', invoiceError);
          } else {
            console.log('Invoice recorded for user:', profile.id);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log('Payment failed:', invoice.id);

        // Find user and update subscription status
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);

          if (updateError) {
            console.error('Error updating payment status:', updateError);
          } else {
            console.log('Marked subscription as past_due for user:', profile.id);
          }
        }

        // TODO: Send payment failed notification email
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});