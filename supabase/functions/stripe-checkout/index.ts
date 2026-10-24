/**
 * STRIPE CHECKOUT EDGE FUNCTION
 * 
 * Creates a Stripe checkout session for Pro or Pro Plus subscription.
 * Accepts user_id from signup flow to associate payment with correct user.
 * 
 * Input: { plan: "pro" | "pro_plus", user_id: string }
 * Output: { url: string } - Stripe checkout URL
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
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
    // Validate Stripe configuration
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe API key not configured');
    }

    // Get price IDs from environment
    const proPriceId = Deno.env.get('STRIPE_PRO_PRICE_ID');
    const proPlusPriceId = Deno.env.get('STRIPE_PRO_PLUS_PRICE_ID');
    
    if (!proPriceId || !proPlusPriceId) {
      throw new Error('Stripe price IDs not configured');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { plan, user_id: requestedUserId } = await req.json();
    const authorization = req.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) return new Response(JSON.stringify({error:'Authentication required'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
    if (authError || !user) return new Response(JSON.stringify({error:'Invalid session'}),{status:401,headers:{...corsHeaders,'Content-Type':'application/json'}});
    if (!user.email_confirmed_at || (requestedUserId && requestedUserId !== user.id)) return new Response(JSON.stringify({error:'Not authorized for this account'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    const user_id = user.id;

    if (!plan || !user_id) {
      throw new Error('Missing required fields: plan and user_id');
    }

    if (plan !== 'pro' && plan !== 'pro_plus') {
      throw new Error('Invalid plan type');
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id, stripe_subscription_id, full_name, account_suspended')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }
    if (profile.account_suspended) return new Response(JSON.stringify({error:'Account suspended'}),{status:403,headers:{...corsHeaders,'Content-Type':'application/json'}});
    if (profile.stripe_subscription_id) {
      try {
        const current = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        if (['active','trialing','past_due','unpaid','incomplete'].includes(current.status)) {
          return new Response(JSON.stringify({error:'An existing subscription is linked to this account. Manage it in Account & Billing.'}),{status:409,headers:{...corsHeaders,'Content-Type':'application/json'}});
        }
      } catch (failure: any) { if (failure?.statusCode !== 404) throw failure; }
    }

    // Create or retrieve Stripe customer
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      console.log('Creating new Stripe customer for user:', user_id);
      
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: {
          supabase_user_id: user_id,
        },
      }, { idempotencyKey: `customer:${user.id}` });
      
      customerId = customer.id;
      console.log('Created Stripe customer:', customerId);

      // Save customer ID to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user_id);

      if (updateError) {
        console.error('Error saving customer ID:', updateError);
      }
    } else {
      console.log('Using existing Stripe customer:', customerId);
    }

    // Select price based on plan
    const priceIds = {
      pro: proPriceId,
      pro_plus: proPlusPriceId,
    };

    const priceId = priceIds[plan as keyof typeof priceIds];

    // Get origin for redirect URLs
    const origin = Deno.env.get('APP_URL') || 'https://mailwizard.io';

    // Create checkout session
    console.log('Creating checkout session for plan:', plan);
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,  // Enable coupon code field
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        user_id: user_id,
        plan_type: plan,
      },
      subscription_data: {
        metadata: {
          user_id: user_id,
          plan_type: plan,
        },
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create checkout session',
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
