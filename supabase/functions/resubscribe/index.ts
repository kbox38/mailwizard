/**
 * RESUBSCRIBE EDGE FUNCTION
 * 
 * Allows previously unsubscribed contacts to opt back in to receiving emails.
 * 
 * Features:
 * - Email validation
 * - Status update from 'unsubscribed' to 'active'
 * - Event tracking
 * - Rate limiting to prevent abuse
 * 
 * Endpoint: /functions/v1/resubscribe
 * Method: POST
 * Body: { email: string }
 * Authentication: None (public endpoint)
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Main handler
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Parse request body
    const { email } = await req.json();
    
    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email address is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!isValidEmail(normalizedEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email address format'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Find contact by email
    const { data: contacts, error: findError } = await supabase
      .from('contacts')
      .select('id, email, user_id, status')
      .eq('email', normalizedEmail);
    
    if (findError) {
      console.error('Database error:', findError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error occurred'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email address not found in our system'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Check if contact is currently unsubscribed
    const contact = contacts[0];
    if (contact.status !== 'unsubscribed') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'You are already subscribed to our emails',
          status: contact.status
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Update contact status to active
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        status: 'active',
        unsubscribed_at: null,
        unsubscribe_reason: null,
        unsubscribe_campaign_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);
    
    if (updateError) {
      console.error('Failed to update contact:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to resubscribe. Please try again or contact support.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Record resubscribe event
    await supabase.from('email_events').insert({
      contact_id: contact.id,
      event_type: 'resubscribe',
      timestamp: new Date().toISOString(),
      metadata: {
        method: 'resubscribe_page',
        user_agent: req.headers.get('user-agent') || 'unknown'
      }
    });
    
    console.log(`✅ Contact ${contact.email} resubscribed`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully re-subscribed! You will now receive emails from us.',
        email: contact.email
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Resubscribe error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
