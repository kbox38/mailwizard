/**
 * ============================================================================
 * PRIVACY POLICY CONTENT
 * ============================================================================
 * 
 * This file contains the structured content for the Privacy Policy page.
 * Edit this file to update the privacy policy content without touching
 * the page component.
 * 
 * Last Updated: [Insert Date]
 * ============================================================================
 */

export interface PolicySection {
  title: string;
  content: string[];
}

export interface PrivacyPolicyData {
  lastUpdated: string;
  sections: PolicySection[];
}

export const privacyPolicyContent: PrivacyPolicyData = {
  lastUpdated: '[Insert Date]',
  sections: [
    {
      title: 'Introduction',
      content: [
        'MailWizard ("we," "us," or "our") is operated by Synergós, LLC, a company registered in the State of Texas, United States. This Privacy Policy explains how we collect, use, disclose, and protect information when you use the MailWizard web application (the "Service").'
      ]
    },
    {
      title: '1. Information We Collect',
      content: [
        'We collect information in the following categories:'
      ]
    },
    {
      title: 'Information You Provide',
      content: [
        '• Name',
        '• Email address',
        '• Account credentials',
        '• Billing and subscription information',
        '• Email content, templates, and campaign data you upload or create within the Service',
        '• Communications sent to us directly'
      ]
    },
    {
      title: 'Automatically Collected Information',
      content: [
        '• IP address',
        '• Browser type and device information',
        '• Operating system',
        '• Usage data such as pages viewed, features used, and timestamps',
        '• Cookies and similar technologies'
      ]
    },
    {
      title: 'Third Party Integrations',
      content: [
        'If you connect MailWizard to third party services, we may receive limited data necessary to provide the Service. The scope of data depends on the integration you enable.'
      ]
    },
    {
      title: '2. How We Use Information',
      content: [
        'We use collected information to:',
        '• Provide, operate, and maintain the Service',
        '• Create and manage user accounts',
        '• Process payments and subscriptions through our payment processor',
        '• Send transactional, service, and account related communications',
        '• Improve performance, functionality, and user experience',
        '• Monitor usage, security, and prevent fraud or abuse',
        '• Comply with legal and regulatory obligations'
      ]
    },
    {
      title: '3. Payments',
      content: [
        'Payments are processed by Stripe. MailWizard does not store full payment card details. Stripe\'s use of personal information is governed by their own privacy policy.'
      ]
    },
    {
      title: '4. How We Share Information',
      content: [
        'We do not sell personal data.',
        '',
        'We may share information with:',
        '• Infrastructure and hosting providers',
        '• Payment processors',
        '• Service providers that support application functionality',
        '• Legal or regulatory authorities when required by law',
        '',
        'All third parties are permitted to use data only to perform services on our behalf and must protect it appropriately.'
      ]
    },
    {
      title: '5. Data Retention',
      content: [
        'We retain personal data only as long as necessary to provide the Service or meet legal requirements.',
        '',
        'Account deletion and data removal are handled by manual request only. Users may request deletion by contacting us at the email listed below.'
      ]
    },
    {
      title: '6. Cookies and Tracking Technologies',
      content: [
        'MailWizard uses cookies and similar technologies to:',
        '• Maintain secure sessions',
        '• Enable core functionality',
        '• Analyze usage and performance',
        '• Improve reliability and security',
        '',
        'You may disable cookies through your browser settings. Some features may not function correctly as a result.'
      ]
    },
    {
      title: '7. Data Security',
      content: [
        'We use reasonable administrative, technical, and organizational safeguards to protect information. However, no system can guarantee absolute security.'
      ]
    },
    {
      title: '8. International Users and Data Transfers',
      content: [
        'MailWizard is a global service. By using the Service, you acknowledge that your information may be transferred to and processed in the United States or other jurisdictions where our service providers operate.'
      ]
    },
    {
      title: '9. Your Privacy Rights',
      content: [
        'Depending on your location, including the United States, Canada, and the European Union, you may have rights to:',
        '• Access your personal information',
        '• Request correction or deletion',
        '• Object to or restrict certain processing',
        '• Request data portability where applicable',
        '',
        'Requests must be submitted manually via email.'
      ]
    },
    {
      title: '10. Children\'s Privacy',
      content: [
        'MailWizard is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children.'
      ]
    },
    {
      title: '11. Changes to This Policy',
      content: [
        'We may update this Privacy Policy periodically. Changes will be posted on this page with an updated effective date.'
      ]
    },
    {
      title: '12. Contact Information',
      content: [
        'For privacy related questions or data requests, contact:',
        '',
        'info@mailwizard.io'
      ]
    }
  ]
};
