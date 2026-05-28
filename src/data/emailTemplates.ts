/**
 * Email Templates — 12 professional system templates
 */

import type { Section } from '../components/templates/SectionEditor';

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  thumbnail?: string;
  is_locked: boolean;
  content: {
    sections: Section[];
    settings: {
      companyName: string;
      backgroundColor: string;
      textColor: string;
      linkColor: string;
      fontFamily: string;
    };
    html?: string;
  };
}

const footer = (id: string): Section => ({
  id,
  type: 'footer',
  content: {
    companyName: '',
    address: '',
    showUnsubscribe: true,
  },
});

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ── 1. Welcome ─────────────────────────────────────────────────────────────
  {
    id: 'welcome',
    name: 'Welcome Email',
    category: 'onboarding',
    description: 'Warm onboarding email for new subscribers or sign-ups',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'Welcome aboard, {{MERGE:first_name}}! 🎉', subtitle: 'We\'re so glad you\'re here' } },
        { id: 't1', type: 'text', content: { text: 'Hi {{MERGE:first_name}},\n\nThank you for joining us. You\'ve just taken the first step toward something great — and we\'re here every step of the way.\n\nHere\'s what you can look forward to:' } },
        { id: 't2', type: 'text', content: { text: '✅  Weekly tips curated just for you\n✅  Exclusive content before anyone else\n✅  A community of like-minded people\n✅  Priority support whenever you need it' } },
        { id: 'b1', type: 'button', content: { buttonText: 'Get Started →', buttonUrl: 'https://example.com/start', buttonColor: '#4F46E5' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#E0E7FF' } },
        { id: 't3', type: 'text', content: { text: '💬  Got questions? Just hit reply — we read every email and respond within 24 hours.\n\nWelcome to the family,\nThe Team' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#EEF2FF', textColor: '#1E1B4B', linkColor: '#4F46E5', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 2. Product Launch ──────────────────────────────────────────────────────
  {
    id: 'product-launch',
    name: 'Product Launch',
    category: 'marketing',
    description: 'Announce a new product or feature with excitement',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'Something new is here.', subtitle: 'Introducing the product you\'ve been waiting for' } },
        { id: 't1', type: 'text', content: { text: 'Hi {{MERGE:first_name}},\n\nToday is a big day. After months of building, testing, and refining — we\'re finally ready to share what we\'ve been working on.\n\nMeet [Product Name]: the smarter, faster way to [main benefit].' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#FEF3C7' } },
        { id: 't2', type: 'text', content: { text: '⚡  Built for speed — everything happens instantly\n🎯  Precision tools — no more guesswork\n🔒  Enterprise-grade security baked in\n🌍  Works anywhere, on any device' } },
        { id: 'b1', type: 'button', content: { buttonText: 'See It in Action', buttonUrl: 'https://example.com/product', buttonColor: '#F59E0B' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#FEF3C7' } },
        { id: 't3', type: 'text', content: { text: '🕐  Early access pricing ends in 48 hours. Lock in your spot before the price increases.' } },
        { id: 'b2', type: 'button', content: { buttonText: 'Claim Early Access', buttonUrl: 'https://example.com/early-access', buttonColor: '#10B981' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#FFFBEB', textColor: '#1C1917', linkColor: '#F59E0B', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 3. Flash Sale ──────────────────────────────────────────────────────────
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    category: 'promotional',
    description: 'Urgent limited-time sale with discount code',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: '⚡ FLASH SALE — 40% OFF', subtitle: 'Ends in 24 hours. No extensions.' } },
        { id: 't1', type: 'text', content: { text: 'Hi {{MERGE:first_name}},\n\nThis is not a drill. For the next 24 hours only, everything in our store is 40% off.\n\nNo minimum order. No exclusions. Just the biggest discount we\'ve ever offered.' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#FEE2E2' } },
        { id: 't2', type: 'text', content: { text: '🏷️  Your exclusive code:\n\n             FLASH40\n\nApply it at checkout. Works on everything.' } },
        { id: 'b1', type: 'button', content: { buttonText: 'Shop Now — 40% Off', buttonUrl: 'https://example.com/sale', buttonColor: '#DC2626' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#FEE2E2' } },
        { id: 't3', type: 'text', content: { text: '⏰  Offer expires: [INSERT DATE/TIME]\n\nOnce the timer hits zero, the discount disappears. We won\'t be able to apply it after the sale ends.\n\nHappy shopping!' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#FFF1F2', textColor: '#881337', linkColor: '#DC2626', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 4. Monthly Newsletter ──────────────────────────────────────────────────
  {
    id: 'newsletter',
    name: 'Monthly Newsletter',
    category: 'newsletter',
    description: 'Curated content newsletter with multiple sections',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'The Monthly Digest', subtitle: 'Issue #12 · May 2025' } },
        { id: 't1', type: 'text', content: { text: 'Hey {{MERGE:first_name}},\n\nWelcome to another edition. This month has been busy — here\'s everything worth knowing.' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#DBEAFE' } },
        { id: 't2', type: 'text', content: { text: '📌  FEATURED STORY\n\n[Headline of your main story goes here]\n\nA 2-3 sentence teaser that makes readers want to click through and read the full piece. Keep it punchy and relevant to your audience.' } },
        { id: 'b1', type: 'button', content: { buttonText: 'Read the Full Story', buttonUrl: 'https://example.com/story', buttonColor: '#2563EB' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#DBEAFE' } },
        { id: 't3', type: 'text', content: { text: '🔗  QUICK LINKS\n\n• [Article 1] — one-line summary\n• [Article 2] — one-line summary\n• [Article 3] — one-line summary\n• [Article 4] — one-line summary' } },
        { id: 'd3', type: 'divider', content: { dividerColor: '#DBEAFE' } },
        { id: 't4', type: 'text', content: { text: '💡  TIP OF THE MONTH\n\n[Your actionable tip here — make it specific, practical, and immediately useful to your reader.]' } },
        { id: 'd4', type: 'divider', content: { dividerColor: '#DBEAFE' } },
        { id: 't5', type: 'text', content: { text: 'That\'s a wrap for this month. Hit reply and let us know what you thought — we read every response.\n\nSee you next month,\nThe Team' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#EFF6FF', textColor: '#1E3A5F', linkColor: '#2563EB', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 5. Re-engagement ──────────────────────────────────────────────────────
  {
    id: 're-engagement',
    name: 'Re-engagement',
    category: 'marketing',
    description: 'Win back inactive subscribers with a personal tone',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'We miss you, {{MERGE:first_name}} 👋', subtitle: 'A lot has changed since you last visited' } },
        { id: 't1', type: 'text', content: { text: 'Hey {{MERGE:first_name}},\n\nWe noticed it\'s been a while since you\'ve been around. That\'s okay — life gets busy.\n\nBut we wanted to reach out personally and share what\'s new, in case it brings you back.' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#D1FAE5' } },
        { id: 't2', type: 'text', content: { text: '🆕  What\'s new since you left:\n\n→  [New feature / product / update #1]\n→  [New feature / product / update #2]\n→  [New feature / product / update #3]\n\nWe\'ve been working hard to make things better — and we think you\'ll notice.' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#D1FAE5' } },
        { id: 't3', type: 'text', content: { text: '🎁  As a thank-you for sticking around (even quietly), here\'s something just for you:\n\n             WELCOME20\n\n20% off your next order or subscription — no strings attached.' } },
        { id: 'b1', type: 'button', content: { buttonText: 'Come Back & Save 20%', buttonUrl: 'https://example.com/return', buttonColor: '#059669' } },
        { id: 'd3', type: 'divider', content: { dividerColor: '#D1FAE5' } },
        { id: 't4', type: 'text', content: { text: 'If you\'d rather we stop emailing you, just click unsubscribe below. No hard feelings.\n\nBut if there\'s anything we can do better, hit reply — we\'re listening.' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#ECFDF5', textColor: '#064E3B', linkColor: '#059669', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 6. Thank You ──────────────────────────────────────────────────────────
  {
    id: 'thank-you',
    name: 'Thank You',
    category: 'transactional',
    description: 'Post-purchase or post-action appreciation email',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'Thank you, {{MERGE:first_name}}! 🙏', subtitle: 'Your support means everything to us' } },
        { id: 't1', type: 'text', content: { text: 'Hi {{MERGE:first_name}},\n\nWe just wanted to take a moment to say: thank you.\n\nYour [purchase / sign-up / support] genuinely makes a difference to us, and we don\'t take it for granted.' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#FEF9C3' } },
        { id: 't2', type: 'text', content: { text: '📦  What happens next:\n\n1.  [Step one — e.g., You\'ll receive a confirmation]\n2.  [Step two — e.g., We\'ll ship within 2 business days]\n3.  [Step three — e.g., Tracking info will be emailed]\n\nIf anything seems off, just reply to this email.' } },
        { id: 'b1', type: 'button', content: { buttonText: 'View Your Order', buttonUrl: 'https://example.com/order', buttonColor: '#D97706' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#FEF9C3' } },
        { id: 't3', type: 'text', content: { text: '⭐  Enjoying your experience?\n\nWe\'d love a review — it takes under a minute and helps others discover us. Every single one is read by our team.' } },
        { id: 'b2', type: 'button', content: { buttonText: 'Leave a Review', buttonUrl: 'https://example.com/review', buttonColor: '#F59E0B' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#FEFCE8', textColor: '#1C1917', linkColor: '#D97706', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 7. Event Invitation ────────────────────────────────────────────────────
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    category: 'events',
    description: 'Elegant invitation for live or virtual events',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'You\'re Invited ✨', subtitle: '[Event Name] · [Date] · [Location]' } },
        { id: 't1', type: 'text', content: { text: 'Dear {{MERGE:first_name}},\n\nWe would be honoured to have you join us for [Event Name] — an evening of [brief description: networking / innovation / celebration / etc.].\n\nThis is a gathering of [target audience description], and your presence would make it even more special.' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#EDE9FE' } },
        { id: 't2', type: 'text', content: { text: '📅  EVENT DETAILS\n\nDate:      [Day, Month Date, Year]\nTime:      [Start Time] – [End Time]\nVenue:     [Venue Name]\nAddress:   [Full Address]\nDress:     [Smart Casual / Black Tie / etc.]\n\nA light reception and refreshments will be provided.' } },
        { id: 'b1', type: 'button', content: { buttonText: 'RSVP — Secure My Spot', buttonUrl: 'https://example.com/rsvp', buttonColor: '#7C3AED' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#EDE9FE' } },
        { id: 't3', type: 'text', content: { text: '🎤  HIGHLIGHTS\n\n→  Keynote by [Speaker Name, Title]\n→  Panel discussion: [Topic]\n→  Exclusive networking session\n→  [Any other highlights]\n\nPlaces are limited — please RSVP by [RSVP deadline].' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#F5F3FF', textColor: '#1E1B4B', linkColor: '#7C3AED', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 8. Survey / Feedback ──────────────────────────────────────────────────
  {
    id: 'survey-feedback',
    name: 'Survey & Feedback',
    category: 'transactional',
    description: 'Request a review, NPS score, or feedback survey',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'Your opinion matters 💬', subtitle: 'It only takes 2 minutes' } },
        { id: 't1', type: 'text', content: { text: 'Hi {{MERGE:first_name}},\n\nYou\'ve been using [Product/Service] for [timeframe], and we\'d love to know what you think.\n\nYour honest feedback directly shapes what we build next. Every response is read by our team.' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#DBEAFE' } },
        { id: 't2', type: 'text', content: { text: '📊  How would you rate your experience?\n\n[ 😞 1 ]  [ 😕 2 ]  [ 😐 3 ]  [ 😊 4 ]  [ 😍 5 ]\n\n(Click the button below to open the full survey — it\'s just 3 questions.)' } },
        { id: 'b1', type: 'button', content: { buttonText: 'Share My Feedback', buttonUrl: 'https://example.com/survey', buttonColor: '#3B82F6' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#DBEAFE' } },
        { id: 't3', type: 'text', content: { text: '🔒  Your responses are completely anonymous and will never be shared outside our team.\n\nThank you for taking the time — it genuinely helps us serve you better.' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#EFF6FF', textColor: '#1E3A5F', linkColor: '#3B82F6', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 9. Announcement ───────────────────────────────────────────────────────
  {
    id: 'announcement',
    name: 'Announcement',
    category: 'marketing',
    description: 'Company update, news, or important announcement',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'Big news from [Company]', subtitle: 'We\'re excited to share something important' } },
        { id: 't1', type: 'text', content: { text: 'Hi {{MERGE:first_name}},\n\nWe have an important update to share with you.\n\n[Main announcement headline in one bold sentence.]\n\nHere\'s what this means and what you need to know:' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#BAE6FD' } },
        { id: 't2', type: 'text', content: { text: '📋  THE DETAILS\n\n[Paragraph 1: What is changing or happening]\n\n[Paragraph 2: Why we\'re making this change]\n\n[Paragraph 3: When this takes effect]' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#BAE6FD' } },
        { id: 't3', type: 'text', content: { text: '✅  WHAT THIS MEANS FOR YOU\n\n→  [Impact point 1]\n→  [Impact point 2]\n→  [Impact point 3]\n\nIf you have questions or concerns, we\'re here to help.' } },
        { id: 'b1', type: 'button', content: { buttonText: 'Learn More', buttonUrl: 'https://example.com/announcement', buttonColor: '#0EA5E9' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#F0F9FF', textColor: '#0C4A6E', linkColor: '#0EA5E9', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 10. Content Digest ────────────────────────────────────────────────────
  {
    id: 'content-digest',
    name: 'Content Digest',
    category: 'newsletter',
    description: 'Weekly curated reading list with article summaries',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'This Week\'s Best Reads 📚', subtitle: '5 things worth your attention' } },
        { id: 't1', type: 'text', content: { text: 'Hey {{MERGE:first_name}},\n\nHere\'s your weekly roundup — hand-picked, no filler.' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#FED7AA' } },
        { id: 't2', type: 'text', content: { text: '🔥  1.  [Article Title One]\n[One to two sentence summary of what this piece is about and why it\'s worth reading. Be specific and intriguing.]\n\n💡  2.  [Article Title Two]\n[One to two sentence summary. Focus on the key takeaway or surprising insight.]\n\n📈  3.  [Article Title Three]\n[Summary. What will the reader learn or gain from reading this?]\n\n🧠  4.  [Article Title Four]\n[Summary. Why is this relevant right now?]\n\n🎧  5.  [Podcast / Video / Tool]\n[Summary. What makes this worth 20 minutes of someone\'s time?]' } },
        { id: 'b1', type: 'button', content: { buttonText: 'Read This Week\'s Full Digest', buttonUrl: 'https://example.com/digest', buttonColor: '#EA580C' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#FED7AA' } },
        { id: 't3', type: 'text', content: { text: '💬  Got something you think we should feature next week? Hit reply and send it over — the best submissions get shared with the whole community.' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#FFF7ED', textColor: '#431407', linkColor: '#EA580C', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 11. Seasonal / Holiday ────────────────────────────────────────────────
  {
    id: 'seasonal',
    name: 'Seasonal Campaign',
    category: 'promotional',
    description: 'Holiday greetings with a seasonal promotional offer',
    is_locked: true,
    content: {
      sections: [
        { id: 'h1', type: 'header', content: { title: 'Happy [Holiday], {{MERGE:first_name}}! 🎄', subtitle: 'A special gift from us to you' } },
        { id: 't1', type: 'text', content: { text: 'Hi {{MERGE:first_name}},\n\nThis time of year is all about connection, gratitude, and new beginnings.\n\nWe\'re so grateful to have you as part of our community — and we wanted to celebrate the season with something special.' } },
        { id: 'd1', type: 'divider', content: { dividerColor: '#BBF7D0' } },
        { id: 't2', type: 'text', content: { text: '🎁  YOUR HOLIDAY GIFT:\n\n             HOLIDAY25\n\n25% off everything — valid through [End Date].\n\nNo minimum spend. Treat yourself or someone you love.' } },
        { id: 'b1', type: 'button', content: { buttonText: '🎁 Redeem My Gift', buttonUrl: 'https://example.com/holiday', buttonColor: '#16A34A' } },
        { id: 'd2', type: 'divider', content: { dividerColor: '#BBF7D0' } },
        { id: 't3', type: 'text', content: { text: '✨  From everyone on our team:\n\nWishing you a joyful [holiday], surrounded by the people and things you love most.\n\nThank you for being here. Here\'s to an amazing year ahead. 🥂' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#F0FDF4', textColor: '#14532D', linkColor: '#16A34A', fontFamily: "'DM Sans', sans-serif" },
    },
  },

  // ── 12. Blank ─────────────────────────────────────────────────────────────
  {
    id: 'blank',
    name: 'Blank Template',
    category: 'basic',
    description: 'Clean starting point — build your email from scratch',
    is_locked: true,
    content: {
      sections: [
        { id: 't1', type: 'text', content: { text: 'Start writing your email here...\n\nUse the section panel on the left to add headers, images, buttons, and more.' } },
        footer('f1'),
      ],
      settings: { companyName: '', backgroundColor: '#FFFFFF', textColor: '#333333', linkColor: '#f3ba42', fontFamily: "'DM Sans', sans-serif" },
    },
  },
];

export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter((t) => t.category === category);
}

export function extractEditableFields(html: string): string[] {
  const regex = /\{\{EDITABLE:(\w+)\}\}/g;
  const fields: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) fields.push(match[1]);
  return fields;
}

export function extractMergeFields(html: string): string[] {
  const regex = /\{\{MERGE:(\w+)\}\}/g;
  const fields: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (!fields.includes(match[1])) fields.push(match[1]);
  }
  return fields;
}
