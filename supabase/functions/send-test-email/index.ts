import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SendTestEmailRequest {
  to_email: string;
  subject: string;
  html_body: string;
  from_email?: string;
  from_name?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check rate limit for test emails
    const { data: rateLimitResult } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'send-test-email',
      p_max_requests: 20,
      p_window_minutes: 60
    });

    if (rateLimitResult && !rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many test email requests. Please try again later.',
          limit: rateLimitResult.limit,
          current: rateLimitResult.current_count,
          reset_at: rateLimitResult.reset_at
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': rateLimitResult.reset_at,
            'Retry-After': String(60 * 60)
          }
        }
      );
    }

    const requestData: SendTestEmailRequest = await req.json();
    const {
      to_email,
      subject,
      html_body,
      from_email = user.email || 'hello@mailwizard.com',
      from_name = user.user_metadata?.full_name || 'Mail Wizard'
    } = requestData;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Sending test email to ${to_email}`);

    // Send email via SendGrid with retry logic
    let sendGridResponse: Response | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    while (retryCount <= maxRetries) {
      try {
        sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: to_email }],
              subject: `[TEST] ${subject}`
            }],
            from: { email: from_email, name: from_name },
            content: [
              { type: 'text/html', value: html_body },
              { type: 'text/plain', value: html_body.replace(/<[^>]*>/g, '') }
            ],
            tracking_settings: {
              click_tracking: { enable: true },
              open_tracking: { enable: true }
            }
          })
        });

        if (sendGridResponse.ok) {
          break;
        }

        // Retry on rate limit or server errors
        if (sendGridResponse.status === 429 || sendGridResponse.status >= 500) {
          retryCount++;
          if (retryCount <= maxRetries) {
            const delay = retryDelay * Math.pow(2, retryCount - 1);
            console.log(`Retry ${retryCount}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        const error = await sendGridResponse.text();
        throw new Error(`SendGrid error: ${error}`);
      } catch (error) {
        retryCount++;
        if (retryCount <= maxRetries) {
          const delay = retryDelay * Math.pow(2, retryCount - 1);
          console.log(`Network error, retry ${retryCount}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }

    if (!sendGridResponse || !sendGridResponse.ok) {
      throw new Error('Failed to send test email after retries');
    }

    console.log('Test email sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test email sent to ${to_email}`,
        to: to_email,
        subject: `[TEST] ${subject}`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send test email'
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
