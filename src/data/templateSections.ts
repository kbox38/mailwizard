/**
 * Template Section Presets
 *
 * These define the visual sections for each template ID.
 * When a user selects a template, these sections are loaded
 * into the drag-and-drop editor for customization.
 */

import type { Section } from '../components/templates/SectionEditor';

export interface TemplateSectionPreset {
  id: string;
  name: string;
  sections: Section[];
  settings?: {
    companyName?: string;
    backgroundColor?: string;
    textColor?: string;
    linkColor?: string;
  };
}

export const TEMPLATE_SECTION_PRESETS: TemplateSectionPreset[] = [
  {
    id: 'product-launch-hero',
    name: 'Product Launch',
    settings: {
      companyName: 'Your Company',
      backgroundColor: '#F5F5F5',
      textColor: '#333333',
      linkColor: '#f3ba42',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'LAUNCHING NOW',
          subtitle: 'Introducing Our Revolutionary New Product'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Hi {{MERGE:first_name}},\n\nAfter months of development, we\'re thrilled to announce the launch of our groundbreaking new solution. This is what you\'ve been waiting for.'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'Key Features:\n\n- Lightning Fast Performance: 10x faster than traditional solutions\n- Precision Targeting: Advanced AI-powered recommendations\n- Enterprise Security: Bank-level encryption and compliance'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Get Early Access',
          buttonUrl: 'https://example.com',
          buttonColor: '#f3ba42'
        }
      },
      {
        id: 'divider-1',
        type: 'divider',
        content: {
          dividerColor: '#E5E7EB'
        }
      },
      {
        id: 'text-3',
        type: 'text',
        content: {
          text: 'Questions? Reply to this email or reach out to our support team.'
        }
      }
    ]
  },
  {
    id: 'flash-sale-urgency',
    name: 'Flash Sale',
    settings: {
      companyName: 'Your Store',
      backgroundColor: '#F5F5F5',
      textColor: '#333333',
      linkColor: '#f3ba42',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: '24-HOUR FLASH SALE',
          subtitle: 'Up to 50% off everything!'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Don\'t miss out on our biggest sale of the season! For the next 24 hours only, enjoy incredible discounts on all our products.'
        }
      },
      {
        id: 'image-1',
        type: 'image',
        content: {
          imageUrl: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=600',
          imageAlt: 'Flash Sale Products',
          caption: 'Shop our best sellers at unbeatable prices'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Shop Now - 50% Off',
          buttonUrl: 'https://example.com/sale',
          buttonColor: '#f3ba42'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'Use code FLASH50 at checkout. Offer ends at midnight!'
        }
      }
    ]
  },
  {
    id: 'seasonal-promo',
    name: 'Seasonal Promotion',
    settings: {
      companyName: 'Your Brand',
      backgroundColor: '#F5F5F5',
      textColor: '#333333',
      linkColor: '#f3ba42',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'Seasonal Special',
          subtitle: 'Limited Time Offers Just for You'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Hi {{MERGE:first_name}},\n\nThe season is changing, and so are our deals! Check out these exclusive offers curated just for you.'
        }
      },
      {
        id: 'image-1',
        type: 'image',
        content: {
          imageUrl: 'https://images.pexels.com/photos/5632386/pexels-photo-5632386.jpeg?auto=compress&cs=tinysrgb&w=600',
          imageAlt: 'Seasonal Products',
          caption: 'Fresh arrivals for the new season'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'View Collection',
          buttonUrl: 'https://example.com/seasonal',
          buttonColor: '#f3ba42'
        }
      },
      {
        id: 'divider-1',
        type: 'divider',
        content: {
          dividerColor: '#E5E7EB'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'Free shipping on orders over $50. Shop now!'
        }
      }
    ]
  },
  {
    id: 'follow-up-sequence',
    name: 'Sales Follow-Up',
    settings: {
      companyName: 'Your Company',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      linkColor: '#57377d',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'Just Checking In',
          subtitle: 'We hope you\'re finding value in our solution'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Hi {{MERGE:first_name}},\n\nI wanted to follow up on our recent conversation and see if you had any questions about our solution.'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'I noticed you were interested in:\n\n- Feature A: Helps you save time\n- Feature B: Increases productivity\n- Feature C: Reduces costs'
        }
      },
      {
        id: 'text-3',
        type: 'text',
        content: {
          text: 'Would you be available for a quick 15-minute call this week to discuss how we can help you achieve your goals?'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Schedule a Call',
          buttonUrl: 'https://calendly.com/example',
          buttonColor: '#57377d'
        }
      },
      {
        id: 'divider-1',
        type: 'divider',
        content: {
          dividerColor: '#E5E7EB'
        }
      },
      {
        id: 'text-4',
        type: 'text',
        content: {
          text: 'Best regards,\nYour Sales Team'
        }
      }
    ]
  },
  {
    id: 'demo-request',
    name: 'Demo Request',
    settings: {
      companyName: 'Your Company',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      linkColor: '#f3ba42',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'See It In Action',
          subtitle: 'Book your personalized demo today'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Hi {{MERGE:first_name}},\n\nReady to see how our platform can transform your business? Book a free demo and discover the possibilities.'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'In your personalized demo, you\'ll learn:\n\n1. How to get started in minutes\n2. Key features that save you time\n3. Real-world success stories\n4. Pricing options for your needs'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Book Your Free Demo',
          buttonUrl: 'https://example.com/demo',
          buttonColor: '#f3ba42'
        }
      },
      {
        id: 'text-3',
        type: 'text',
        content: {
          text: 'No commitment required. See you soon!'
        }
      }
    ]
  },
  {
    id: 'case-study',
    name: 'Case Study',
    settings: {
      companyName: 'Your Company',
      backgroundColor: '#F5F5F5',
      textColor: '#333333',
      linkColor: '#57377d',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'Success Story',
          subtitle: 'How [Company] achieved 300% growth'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Hi {{MERGE:first_name}},\n\nWe wanted to share an inspiring success story with you. See how one of our clients transformed their business with our solution.'
        }
      },
      {
        id: 'image-1',
        type: 'image',
        content: {
          imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
          imageAlt: 'Team collaboration',
          caption: 'The team celebrating their success'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'Key Results:\n\n- 300% increase in revenue\n- 50% reduction in operational costs\n- 10x improvement in team efficiency\n- ROI achieved in just 3 months'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Read Full Case Study',
          buttonUrl: 'https://example.com/case-study',
          buttonColor: '#57377d'
        }
      }
    ]
  },
  {
    id: 'weekly-digest',
    name: 'Weekly Digest',
    settings: {
      companyName: 'Your Newsletter',
      backgroundColor: '#F5F5F5',
      textColor: '#333333',
      linkColor: '#f3ba42',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'This Week\'s Highlights',
          subtitle: 'Your weekly dose of insights and updates'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Hi {{MERGE:first_name}},\n\nWelcome to this week\'s newsletter! Here\'s what you need to know:'
        }
      },
      {
        id: 'divider-1',
        type: 'divider',
        content: {
          dividerColor: '#f3ba42'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'TOP STORY\n\n[Article Title Here]\n\nBrief description of the article that hooks the reader and makes them want to learn more...'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Read More',
          buttonUrl: 'https://example.com/article',
          buttonColor: '#f3ba42'
        }
      },
      {
        id: 'divider-2',
        type: 'divider',
        content: {
          dividerColor: '#E5E7EB'
        }
      },
      {
        id: 'text-3',
        type: 'text',
        content: {
          text: 'MORE FROM THIS WEEK\n\n- Article 2: Brief description\n- Article 3: Brief description\n- Article 4: Brief description'
        }
      },
      {
        id: 'text-4',
        type: 'text',
        content: {
          text: 'Thanks for reading!\nThe Newsletter Team'
        }
      }
    ]
  },
  {
    id: 'company-news',
    name: 'Company News',
    settings: {
      companyName: 'Your Company',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      linkColor: '#57377d',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'Company Update',
          subtitle: 'Important news from our team'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Dear {{MERGE:first_name}},\n\nWe have exciting news to share with you! Here\'s what\'s been happening at [Company Name].'
        }
      },
      {
        id: 'image-1',
        type: 'image',
        content: {
          imageUrl: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=600',
          imageAlt: 'Team photo',
          caption: 'Our team is growing!'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'What\'s New:\n\n1. We\'ve expanded our team with 5 new members\n2. Launched 3 new product features\n3. Opened our second office location\n4. Celebrated 1000+ happy customers'
        }
      },
      {
        id: 'text-3',
        type: 'text',
        content: {
          text: 'Thank you for being part of our journey. We couldn\'t do it without customers like you!'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Learn More',
          buttonUrl: 'https://example.com/news',
          buttonColor: '#57377d'
        }
      }
    ]
  },
  {
    id: 'tips-tricks',
    name: 'Tips & Tricks',
    settings: {
      companyName: 'Your Company',
      backgroundColor: '#F5F5F5',
      textColor: '#333333',
      linkColor: '#f3ba42',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'Pro Tips',
          subtitle: 'Get more out of your experience'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Hi {{MERGE:first_name}},\n\nWant to become a power user? Here are our top tips to help you succeed:'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'TIP #1: Keyboard Shortcuts\n\nSave time by using keyboard shortcuts. Press Cmd/Ctrl + K to open the command palette.'
        }
      },
      {
        id: 'divider-1',
        type: 'divider',
        content: {
          dividerColor: '#f3ba42'
        }
      },
      {
        id: 'text-3',
        type: 'text',
        content: {
          text: 'TIP #2: Automation\n\nSet up automated workflows to handle repetitive tasks automatically.'
        }
      },
      {
        id: 'divider-2',
        type: 'divider',
        content: {
          dividerColor: '#f3ba42'
        }
      },
      {
        id: 'text-4',
        type: 'text',
        content: {
          text: 'TIP #3: Templates\n\nCreate templates for your most common tasks to save hours every week.'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'View All Tips',
          buttonUrl: 'https://example.com/tips',
          buttonColor: '#f3ba42'
        }
      }
    ]
  },
  {
    id: 'feature-update',
    name: 'Feature Update',
    settings: {
      companyName: 'Your Product',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      linkColor: '#f3ba42',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'New Features Alert!',
          subtitle: 'Exciting updates you don\'t want to miss'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Hi {{MERGE:first_name}},\n\nWe\'ve been busy building new features based on your feedback. Here\'s what\'s new:'
        }
      },
      {
        id: 'image-1',
        type: 'image',
        content: {
          imageUrl: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600',
          imageAlt: 'New feature preview',
          caption: 'Preview of our new dashboard'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'What\'s New:\n\n- Dark Mode: Easy on the eyes, beautiful design\n- Advanced Search: Find anything in seconds\n- Mobile App: Now available on iOS and Android\n- Integrations: Connect with 50+ new tools'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Try New Features',
          buttonUrl: 'https://example.com/features',
          buttonColor: '#f3ba42'
        }
      },
      {
        id: 'text-3',
        type: 'text',
        content: {
          text: 'Have feedback? Reply to this email - we\'d love to hear from you!'
        }
      }
    ]
  },
  {
    id: 'service-update',
    name: 'Service Update',
    settings: {
      companyName: 'Your Company',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      linkColor: '#57377d',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'Service Update',
          subtitle: 'Important information about your account'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Hi {{MERGE:first_name}},\n\nWe\'re writing to inform you about an upcoming change to our service.'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'What\'s Changing:\n\nWe will be performing scheduled maintenance on [Date]. During this time, some services may be temporarily unavailable.'
        }
      },
      {
        id: 'text-3',
        type: 'text',
        content: {
          text: 'What You Need to Do:\n\n- Save any work in progress before the maintenance window\n- Expect brief service interruptions\n- Check our status page for updates'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'View Status Page',
          buttonUrl: 'https://status.example.com',
          buttonColor: '#57377d'
        }
      },
      {
        id: 'text-4',
        type: 'text',
        content: {
          text: 'We apologize for any inconvenience. Thank you for your patience!'
        }
      }
    ]
  },
  {
    id: 'policy-change',
    name: 'Policy Change',
    settings: {
      companyName: 'Your Company',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      linkColor: '#57377d',
    },
    sections: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          title: 'Policy Update',
          subtitle: 'Changes to our terms of service'
        }
      },
      {
        id: 'text-1',
        type: 'text',
        content: {
          text: 'Dear {{MERGE:first_name}},\n\nWe\'re updating our policies to better serve you. Here\'s a summary of the key changes:'
        }
      },
      {
        id: 'text-2',
        type: 'text',
        content: {
          text: 'Summary of Changes:\n\n1. Updated privacy policy with clearer language\n2. New data retention guidelines\n3. Enhanced security measures\n4. Improved user rights section'
        }
      },
      {
        id: 'text-3',
        type: 'text',
        content: {
          text: 'These changes will take effect on [Date]. By continuing to use our service after this date, you agree to the updated terms.'
        }
      },
      {
        id: 'button-1',
        type: 'button',
        content: {
          buttonText: 'Read Full Policy',
          buttonUrl: 'https://example.com/policy',
          buttonColor: '#57377d'
        }
      },
      {
        id: 'text-4',
        type: 'text',
        content: {
          text: 'Questions? Contact our support team at support@example.com'
        }
      }
    ]
  }
];

export function getTemplateSections(templateId: string): Section[] | null {
  const preset = TEMPLATE_SECTION_PRESETS.find(p => p.id === templateId);
  if (preset) {
    return JSON.parse(JSON.stringify(preset.sections));
  }
  return null;
}

export function getTemplateSettings(templateId: string): TemplateSectionPreset['settings'] | null {
  const preset = TEMPLATE_SECTION_PRESETS.find(p => p.id === templateId);
  return preset?.settings || null;
}
