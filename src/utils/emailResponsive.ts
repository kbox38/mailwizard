/**
 * Email responsive helper (frontend / preview side)
 *
 * Injects a mobile-friendly <style> block (and a viewport meta if missing) into
 * an email's HTML so previews render the way real recipients see them on a phone.
 *
 * This MUST stay in sync with the server-side `injectResponsiveStyles` in
 * supabase/functions/_shared/campaignSender.ts — the same rules are added to
 * outgoing emails at send time.
 */

const RESPONSIVE_STYLE = `<style>
@media only screen and (max-width:600px){
  table[role="presentation"]{width:100%!important;}
  img{max-width:100%!important;height:auto!important;}
  td[style*="padding: 60px 40px"],td[style*="padding:60px 40px"],
  td[style*="padding: 50px 40px"],td[style*="padding:50px 40px"],
  td[style*="padding: 40px 40px"],td[style*="padding:40px 40px"],
  td[style*="padding: 40px"],td[style*="padding:40px"],
  td[style*="padding: 30px 40px"],td[style*="padding:30px 40px"],
  td[style*="padding: 20px 40px"],td[style*="padding:20px 40px"]{
    padding-left:22px!important;padding-right:22px!important;
    padding-top:28px!important;padding-bottom:28px!important;
  }
  h1{font-size:26px!important;line-height:1.25!important;}
  h2{font-size:21px!important;line-height:1.3!important;}
}
</style>`;

export function injectResponsiveStyles(html: string): string {
  if (!html) return html;
  let out = html;

  if (!/name=["']viewport["']/i.test(out)) {
    const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    out = /<head[^>]*>/i.test(out)
      ? out.replace(/<head[^>]*>/i, (m) => `${m}\n${viewport}`)
      : `${viewport}\n${out}`;
  }

  if (/<\/head>/i.test(out)) {
    return out.replace(/<\/head>/i, `${RESPONSIVE_STYLE}\n</head>`);
  }
  return `${RESPONSIVE_STYLE}\n${out}`;
}
