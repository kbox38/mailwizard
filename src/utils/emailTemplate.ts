/**
 * Professional Email Template Generator
 *
 * Creates production-ready HTML email templates with:
 * - Table-based layout for maximum compatibility
 * - Inline CSS (Gmail-compatible)
 * - Responsive design
 * - Professional structure matching industry standards
 * - CAN-SPAM compliant unsubscribe links
 */

export interface EmailTemplateSettings {
  companyLogoUrl?: string;
  bannerImageUrl?: string;
  companyName: string;
  greeting?: string;
  ctaText?: string;
  ctaUrl?: string;
  additionalLinkText?: string;
  additionalLinkUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  companyAddress?: string;
  subjectLine?: string;
  fromEmail?: string;
}

/**
 * Generates a professional HTML email template
 */
export function generateEmailTemplate(
  bodyContent: string,
  settings: EmailTemplateSettings
): string {
  const {
    companyLogoUrl,
    bannerImageUrl,
    companyName,
    greeting = 'Dear Valued Customer,',
    ctaText,
    ctaUrl,
    additionalLinkText,
    additionalLinkUrl,
    facebookUrl,
    linkedinUrl,
    websiteUrl,
    companyAddress,
    subjectLine = 'Email from ' + companyName,
    fromEmail = ''
  } = settings;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(subjectLine)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

  <!-- Full-width wrapper table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">

        <!-- Main email content container (max-width: 600px) -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- HEADER WITH LOGO -->
          <tr>
            <td align="center" style="background-color: #ffffff; padding: 30px 20px; border-bottom: 1px solid #e5e5e5;">
              ${companyLogoUrl ? `
              <img src="${escapeHtml(companyLogoUrl)}" alt="${escapeHtml(companyName)}" style="max-width: 200px; height: auto; display: block; margin: 0 auto;">
              ` : `
              <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(companyName)}</h1>
              `}
            </td>
          </tr>

          <!-- HERO/BANNER IMAGE (Optional) -->
          ${bannerImageUrl ? `
          <tr>
            <td style="padding: 0;">
              <img src="${escapeHtml(bannerImageUrl)}" alt="Banner" style="width: 100%; max-width: 600px; height: auto; display: block; border: 0;">
            </td>
          </tr>
          ` : ''}

          <!-- BODY CONTENT (Centered, with margins) -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <!-- Greeting -->
              ${greeting ? `
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                ${escapeHtml(greeting)}
              </p>
              ` : ''}

              <!-- Main Body Content -->
              <div style="color: #333333; font-size: 16px; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">
                ${bodyContent}
              </div>
            </td>
          </tr>

          <!-- CTA BUTTON (Optional, centered) -->
          ${ctaText && ctaUrl ? `
          <tr>
            <td align="center" style="padding: 20px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="background-color: #f3ba42; border-radius: 25px;">
                    <a href="${escapeHtml(ctaUrl)}" target="_blank" style="display: inline-block; background-color: #f3ba42; color: #000000; text-decoration: none; padding: 14px 35px; border-radius: 25px; font-weight: bold; font-size: 16px; font-family: Arial, Helvetica, sans-serif; border: 2px solid #000000;">${escapeHtml(ctaText)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- ADDITIONAL LINKS (Optional) -->
          ${additionalLinkText && additionalLinkUrl ? `
          <tr>
            <td align="center" style="padding: 10px 40px 30px 40px;">
              <a href="${escapeHtml(additionalLinkUrl)}" target="_blank" style="color: #0066cc; text-decoration: underline; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">${escapeHtml(additionalLinkText)}</a>
            </td>
          </tr>
          ` : ''}

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #dddddd;">

              <!-- Social Icons -->
              ${(facebookUrl || linkedinUrl || websiteUrl) ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 20px auto;">
                <tr>
                  ${facebookUrl ? `
                  <td style="padding: 0 10px;">
                    <a href="${escapeHtml(facebookUrl)}" target="_blank" style="color: #0066cc; text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="24" height="24" style="display: block; border: 0;">
                    </a>
                  </td>
                  ` : ''}
                  ${linkedinUrl ? `
                  <td style="padding: 0 10px;">
                    <a href="${escapeHtml(linkedinUrl)}" target="_blank" style="color: #0066cc; text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="24" height="24" style="display: block; border: 0;">
                    </a>
                  </td>
                  ` : ''}
                  ${websiteUrl ? `
                  <td style="padding: 0 10px;">
                    <a href="${escapeHtml(websiteUrl)}" target="_blank" style="color: #0066cc; text-decoration: none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Website" width="24" height="24" style="display: block; border: 0;">
                    </a>
                  </td>
                  ` : ''}
                </tr>
              </table>
              ` : ''}

              <!-- Company Address -->
              ${companyAddress ? `
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
                ${escapeHtml(companyAddress)}
              </p>
              ` : ''}

              <!-- Unsubscribe Link (CAN-SPAM Compliant) -->
              <p style="margin: 10px 0 0 0; color: #666666; font-size: 12px; line-height: 1.5; font-family: Arial, Helvetica, sans-serif;">
                If you no longer wish to receive emails from us, 
                <a href="{{UNSUBSCRIBE_URL}}" style="color: #f3ba42; text-decoration: underline;">click here to unsubscribe</a>.
              </p>

              <!-- Copyright -->
              <p style="margin: 15px 0 0 0; color: #999999; font-size: 11px; font-family: Arial, Helvetica, sans-serif;">
                © ${new Date().getFullYear()} ${escapeHtml(companyName)}. All rights reserved.
              </p>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Processes merge tags in email content
 */
export function processMergeTags(
  html: string,
  mergeData: Record<string, string>
): string {
  let processed = html;

  // Replace custom merge tags {{MERGE:field_name}}
  Object.keys(mergeData).forEach(key => {
    const regex = new RegExp(`{{MERGE:${key}}}`, 'g');
    processed = processed.replace(regex, mergeData[key] || '');
  });

  return processed;
}

/**
 * Injects system links (unsubscribe, view in browser)
 */
export function injectSystemLinks(
  html: string,
  links: {
    unsubscribeUrl: string;
    viewInBrowserUrl: string;
    fromEmail: string;
  }
): string {
  return html
    .replace(/{{UNSUBSCRIBE_URL}}/g, links.unsubscribeUrl)
    .replace(/{{VIEW_IN_BROWSER_URL}}/g, links.viewInBrowserUrl)
    .replace(/{{FROM_EMAIL}}/g, links.fromEmail);
}

/**
 * Validates email HTML structure
 */
export function validateEmailHtml(html: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!html.includes('<!DOCTYPE html>')) {
    errors.push('Missing DOCTYPE declaration');
  }

  if (!html.includes('<table')) {
    errors.push('Email should use table-based layout');
  }

  if (html.includes('<style>') || html.includes('<link')) {
    errors.push('Email should use inline CSS only (no <style> or <link> tags)');
  }

  if (!html.includes('{{UNSUBSCRIBE_URL}}')) {
    errors.push('Missing unsubscribe link placeholder');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}