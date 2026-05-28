/**
 * ============================================================================
 * TERMS OF SERVICE CONTENT
 * ============================================================================
 * 
 * This file contains the structured content for the Terms of Service page.
 * Edit this file to update the terms of service content without touching
 * the page component.
 * 
 * Last Updated: [Insert Date]
 * ============================================================================
 */

export interface TermsSection {
  title: string;
  content: string[];
}

export interface TermsOfServiceData {
  lastUpdated: string;
  sections: TermsSection[];
}

export const termsOfServiceContent: TermsOfServiceData = {
  lastUpdated: '[Insert Date]',
  sections: [
    {
      title: 'Introduction',
      content: [
        'These Terms of Service ("Terms") govern your access to and use of the MailWizard web application (the "Service"), operated by Synergós, LLC, a Texas limited liability company ("MailWizard," "we," "us," or "our").',
        '',
        'By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.'
      ]
    },
    {
      title: '1. Eligibility',
      content: [
        'You must be at least 18 years old to use the Service. By using MailWizard, you represent that you meet this requirement and have the authority to enter into these Terms.'
      ]
    },
    {
      title: '2. Account Registration',
      content: [
        'To use certain features, you must create an account. You agree to:',
        '',
        '• Provide accurate and complete information',
        '• Maintain the security of your account credentials',
        '• Accept responsibility for all activity under your account',
        '',
        'You are responsible for keeping your login credentials confidential.'
      ]
    },
    {
      title: '3. Use of the Service',
      content: [
        'You may use MailWizard only for lawful purposes.',
        '',
        'You agree not to:',
        '• Send spam or unsolicited bulk email',
        '• Violate applicable email, privacy, or anti-spam laws',
        '• Upload or distribute malicious code or harmful content',
        '• Interfere with or disrupt the Service',
        '• Use the Service to infringe on intellectual property or privacy rights',
        '',
        'We reserve the right to suspend or terminate accounts that violate these Terms.'
      ]
    },
    {
      title: '4. Email Compliance',
      content: [
        'You are solely responsible for ensuring that your use of MailWizard complies with all applicable laws, including but not limited to:',
        '',
        '• CAN-SPAM Act',
        '• CASL',
        '• GDPR',
        '• Other international email and data protection regulations',
        '',
        'MailWizard does not provide legal advice or guarantee compliance.'
      ]
    },
    {
      title: '5. Subscriptions and Payments',
      content: [
        'Some features require a paid subscription.',
        '',
        '• Payments are processed through Stripe',
        '• Fees are billed in advance according to your selected plan',
        '• All fees are non-refundable unless required by law',
        '• We may change pricing with reasonable notice',
        '• Failure to pay may result in suspension or termination of access'
      ]
    },
    {
      title: '6. Data and Content Ownership',
      content: [
        'You retain ownership of all content you upload or create using the Service.',
        '',
        'By using MailWizard, you grant us a limited, non-exclusive license to store, process, and transmit your content solely to operate and improve the Service.',
        '',
        'We do not claim ownership of your email lists or campaign content.'
      ]
    },
    {
      title: '7. Account Termination',
      content: [
        'You may stop using the Service at any time.',
        '',
        'We may suspend or terminate your account if:',
        '• You violate these Terms',
        '• Your use creates legal or operational risk',
        '• Required by law or regulation',
        '',
        'Data deletion is handled by manual request only and must be submitted via email.'
      ]
    },
    {
      title: '8. Service Availability',
      content: [
        'We strive to maintain reliable service but do not guarantee uninterrupted access.',
        '',
        'The Service may be unavailable due to:',
        '• Maintenance',
        '• Technical issues',
        '• Factors outside our control',
        '',
        'MailWizard is provided "as is" and "as available."'
      ]
    },
    {
      title: '9. Intellectual Property',
      content: [
        'All trademarks, logos, software, and platform features not owned by users are the property of Synergós, LLC.',
        '',
        'You may not copy, modify, distribute, or reverse engineer any part of the Service without written permission.'
      ]
    },
    {
      title: '10. Disclaimer of Warranties',
      content: [
        'MailWizard is provided without warranties of any kind, express or implied, including but not limited to:',
        '',
        '• Fitness for a particular purpose',
        '• Merchantability',
        '• Accuracy or reliability of results',
        '',
        'Use of the Service is at your own risk.'
      ]
    },
    {
      title: '11. Limitation of Liability',
      content: [
        'To the maximum extent permitted by law, Synergós, LLC shall not be liable for:',
        '',
        '• Indirect or consequential damages',
        '• Loss of data, revenue, or profits',
        '• Business interruption',
        '',
        'Our total liability shall not exceed the amount paid by you in the twelve months prior to the claim.'
      ]
    },
    {
      title: '12. Indemnification',
      content: [
        'You agree to indemnify and hold harmless Synergós, LLC from any claims, damages, or liabilities arising from:',
        '',
        '• Your use of the Service',
        '• Your email content or campaigns',
        '• Violations of law or third-party rights'
      ]
    },
    {
      title: '13. Governing Law',
      content: [
        'These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law principles.'
      ]
    },
    {
      title: '14. Changes to These Terms',
      content: [
        'We may update these Terms from time to time. Continued use of the Service after changes become effective constitutes acceptance of the updated Terms.'
      ]
    },
    {
      title: '15. Contact Information',
      content: [
        'For questions regarding these Terms, contact:',
        '',
        'info@mailwizard.io'
      ]
    }
  ]
};
