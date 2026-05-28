/**
 * Professional Email Template Library
 * Elegant, modern templates for various use cases
 */

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'sales' | 'newsletter' | 'transactional';
  thumbnail: string;
  description: string;
  htmlContent: string;
  supportsPersonalization: boolean;
}

export const PROFESSIONAL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'modern-welcome',
    name: 'Modern Welcome',
    category: 'marketing',
    thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Clean, modern welcome email with bold typography',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8f9fa;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 800; letter-spacing: -1px;">
                Welcome Aboard!
              </h1>
              <p style="margin: 15px 0 0 0; color: #e0e7ff; font-size: 18px; font-weight: 500;">
                We're thrilled to have you with us
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 50px 40px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.7;">
                Hi {{MERGE:first_name}},
              </p>
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.8;">
                {{EDITABLE:welcome_message}}
              </p>

              <div style="text-align: center; margin: 40px 0;">
                <a href="{{EDITABLE:cta_url}}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);">
                  {{EDITABLE:cta_text}}
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                {{COMPANY_NAME}}
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },

  {
    id: 'minimalist-announcement',
    name: 'Minimalist Announcement',
    category: 'marketing',
    thumbnail: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Ultra-clean design with maximum impact',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 500px;">

          <tr>
            <td align="center" style="padding-bottom: 50px;">
              <div style="font-size: 32px; font-weight: 900; color: #000000; letter-spacing: -1px;">
                {{COMPANY_NAME}}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 0 40px 0;">
              <h1 style="margin: 0 0 30px 0; color: #000000; font-size: 48px; font-weight: 700; line-height: 1.2; text-align: center; letter-spacing: -2px;">
                {{EDITABLE:headline}}
              </h1>
              <p style="margin: 0; color: #404040; font-size: 18px; line-height: 1.7; text-align: center;">
                {{EDITABLE:description}}
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom: 60px;">
              <a href="{{EDITABLE:cta_url}}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 18px 50px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px;">
                {{EDITABLE:cta_text}}
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 40px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #999999; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },

  {
    id: 'product-launch',
    name: 'Product Launch',
    category: 'sales',
    thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Bold design for product announcements',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px;">

          <tr>
            <td style="background: linear-gradient(135deg, #f3ba42 0%, #ff6b6b 100%); padding: 80px 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.2); color: #ffffff; padding: 8px 16px; border-radius: 50px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 20px;">
                NEW LAUNCH
              </div>
              <h1 style="margin: 0 0 15px 0; color: #ffffff; font-size: 52px; font-weight: 900; line-height: 1.1; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                {{EDITABLE:product_name}}
              </h1>
              <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 500;">
                {{EDITABLE:tagline}}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #1e293b; padding: 50px 40px;">
              <p style="margin: 0 0 30px 0; color: #cbd5e1; font-size: 16px; line-height: 1.8;">
                {{EDITABLE:description}}
              </p>

              <div style="text-align: center;">
                <a href="{{EDITABLE:cta_url}}" style="display: inline-block; background-color: #f3ba42; color: #000000; text-decoration: none; padding: 18px 45px; border-radius: 50px; font-weight: 700; font-size: 16px;">
                  {{EDITABLE:cta_text}}
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color: #0f172a; padding: 30px 40px; text-align: center; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #64748b; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },

  {
    id: 'elegant-newsletter',
    name: 'Elegant Newsletter',
    category: 'newsletter',
    thumbnail: 'https://images.pexels.com/photos/6457579/pexels-photo-6457579.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Magazine-style layout for newsletters',
    supportsPersonalization: false,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #faf9f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 650px; background-color: #ffffff;">

          <tr>
            <td style="padding: 50px 50px 40px 50px; border-bottom: 3px solid #000000;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 50%;">
                    <div style="font-size: 14px; color: #999999; font-family: Arial, sans-serif; letter-spacing: 2px;">
                      ISSUE #{{EDITABLE:issue_number}}
                    </div>
                  </td>
                  <td style="width: 50%; text-align: right;">
                    <div style="font-size: 14px; color: #999999; font-family: Arial, sans-serif;">
                      {{EDITABLE:date}}
                    </div>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 25px 0 0 0; font-size: 48px; font-weight: 700; color: #000000; line-height: 1.2;">
                {{COMPANY_NAME}}
              </h1>
              <div style="font-size: 16px; color: #666666; font-style: italic; margin-top: 10px;">
                {{EDITABLE:subtitle}}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 50px;">
              <div style="font-size: 12px; color: #f3ba42; font-family: Arial, sans-serif; font-weight: 700; letter-spacing: 2px; margin-bottom: 15px;">
                FEATURED
              </div>
              <h2 style="margin: 0 0 20px 0; font-size: 36px; font-weight: 700; color: #000000; line-height: 1.3;">
                {{EDITABLE:article_title}}
              </h2>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px; line-height: 1.8;">
                {{EDITABLE:article_excerpt}}
              </p>
              <a href="{{EDITABLE:article_url}}" style="display: inline-block; color: #000000; text-decoration: none; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 1px; border-bottom: 2px solid #f3ba42; padding-bottom: 2px;">
                READ MORE →
              </a>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f8f8; padding: 40px 50px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; font-family: Arial, sans-serif; text-align: center;">
                © {{COMPANY_NAME}}. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; text-align: center;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #999999; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },

  {
    id: 'event-invitation',
    name: 'Event Invitation',
    category: 'marketing',
    thumbnail: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Elegant design for event invitations',
    supportsPersonalization: true,
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 2px solid #000000; border-radius: 12px;">

          <tr>
            <td style="padding: 60px 50px; text-align: center; background: linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%);">
              <div style="font-size: 14px; font-weight: 700; color: #f3ba42; letter-spacing: 3px; margin-bottom: 20px;">
                YOU'RE INVITED
              </div>
              <h1 style="margin: 0 0 20px 0; font-size: 42px; font-weight: 800; color: #000000; line-height: 1.2;">
                {{EDITABLE:event_name}}
              </h1>
              <p style="margin: 0 0 30px 0; font-size: 18px; color: #666666; line-height: 1.6;">
                {{EDITABLE:event_description}}
              </p>

              <div style="background-color: #000000; color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">
                  📅 {{EDITABLE:event_date}}
                </div>
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">
                  🕐 {{EDITABLE:event_time}}
                </div>
                <div style="font-size: 16px; font-weight: 600;">
                  📍 {{EDITABLE:event_location}}
                </div>
              </div>

              <a href="{{EDITABLE:rsvp_url}}" style="display: inline-block; background-color: #f3ba42; color: #000000; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-weight: 700; font-size: 16px; border: 2px solid #000000;">
                RSVP NOW
              </a>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #999999; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
];
