/**
 * ============================================================================
 * ACCEPTABLE USE POLICY CONTENT
 * ============================================================================
 * 
 * This file contains the structured content for the Acceptable Use Policy page.
 * Edit this file to update the policy content without touching the page component.
 * 
 * Last Updated: [Insert Date]
 * ============================================================================
 */

export interface PolicySection {
  title: string;
  content: string[];
}

export interface AcceptableUsePolicyData {
  lastUpdated: string;
  sections: PolicySection[];
  appendixTitle: string;
  appendixSections: PolicySection[];
}

export const acceptableUsePolicyContent: AcceptableUsePolicyData = {
  lastUpdated: '[Insert Date]',
  sections: [
    {
      title: 'Introduction',
      content: [
        'This Acceptable Use Policy ("Policy") governs your use of the MailWizard web application (the "Service"), operated by Synergós, LLC ("MailWizard," "we," "us," or "our"). This Policy is incorporated by reference into our Terms of Service.',
        '',
        'By using the Service, you agree to comply with this Policy.'
      ]
    },
    {
      title: '1. Purpose of the Service',
      content: [
        'MailWizard is designed to help users create, manage, and send legitimate email communications. The Service may not be used for unlawful, deceptive, or abusive activities.'
      ]
    },
    {
      title: '2. Prohibited Activities',
      content: [
        'You may not use MailWizard to engage in any of the following:'
      ]
    },
    {
      title: 'Email and Messaging Abuse',
      content: [
        '• Sending spam or unsolicited bulk email',
        '• Sending email to purchased, rented, or scraped lists',
        '• Failing to include required sender identification or unsubscribe mechanisms',
        '• Sending deceptive, misleading, or fraudulent messages'
      ]
    },
    {
      title: 'Illegal or Harmful Content',
      content: [
        '• Content that violates applicable laws or regulations',
        '• Phishing, impersonation, or social engineering',
        '• Malware, ransomware, or malicious code',
        '• Promotion of illegal goods or services'
      ]
    },
    {
      title: 'Abuse and Misuse',
      content: [
        '• Harassment, threats, or intimidation',
        '• Hate speech or discriminatory content',
        '• Exploitation or abuse of minors',
        '• Content that infringes intellectual property or privacy rights'
      ]
    },
    {
      title: 'Platform Abuse',
      content: [
        '• Attempting to bypass safeguards or usage limits',
        '• Interfering with system integrity or performance',
        '• Reverse engineering or unauthorized access',
        '• Using automation to manipulate or overload the Service'
      ]
    },
    {
      title: '3. Compliance with Laws',
      content: [
        'You are responsible for complying with all applicable laws, including but not limited to:',
        '',
        '• CAN-SPAM Act',
        '• CASL',
        '• GDPR',
        '• Other international privacy and email regulations',
        '',
        'MailWizard does not monitor or validate legal compliance for your campaigns.'
      ]
    },
    {
      title: '4. Monitoring and Enforcement',
      content: [
        'We reserve the right to:',
        '',
        '• Monitor usage for compliance with this Policy',
        '• Investigate suspected violations',
        '• Suspend or terminate accounts without notice for violations',
        '• Remove or restrict content that violates this Policy'
      ]
    },
    {
      title: '5. Reporting Violations',
      content: [
        'If you believe someone is violating this Policy, you may report it by contacting:',
        '',
        'info@mailwizard.io'
      ]
    },
    {
      title: '6. Consequences of Violations',
      content: [
        'Violations may result in:',
        '',
        '• Warning or request for corrective action',
        '• Temporary suspension',
        '• Permanent account termination',
        '• Loss of access to data',
        '• Legal action where required'
      ]
    },
    {
      title: '7. Changes to This Policy',
      content: [
        'We may update this Acceptable Use Policy periodically. Changes will be posted with an updated effective date.'
      ]
    },
    {
      title: '8. Contact Information',
      content: [
        'For questions regarding this Policy, contact:',
        '',
        'info@mailwizard.io'
      ]
    }
  ],
  appendixTitle: 'Appendix A: High-Risk Content',
  appendixSections: [
    {
      title: 'Introduction',
      content: [
        'The following categories of content are considered high-risk due to legal, regulatory, reputational, or deliverability concerns. Use of the MailWizard Service to send or promote this content may result in review, restriction, suspension, or termination.',
        '',
        'MailWizard reserves the right to determine whether content falls into these categories.'
      ]
    },
    {
      title: '1. Financial and Investment Content',
      content: [
        'Includes, but is not limited to:',
        '• Investment opportunities or guarantees of financial returns',
        '• Cryptocurrency, NFTs, token offerings, or trading advice',
        '• Forex trading, day trading, or speculative investments',
        '• Get-rich-quick schemes or income claims without substantiation',
        '',
        'Additional restrictions may apply.'
      ]
    },
    {
      title: '2. Health and Medical Content',
      content: [
        'Includes:',
        '• Medical advice, diagnoses, or treatment claims',
        '• Supplements, weight loss products, or wellness cures',
        '• Claims that guarantee health outcomes',
        '• Content requiring medical disclaimers',
        '',
        'Use of such content may require proof of compliance with applicable regulations.'
      ]
    },
    {
      title: '3. Gambling and Gaming',
      content: [
        'Includes:',
        '• Online gambling or betting services',
        '• Casinos, sports betting, or lotteries',
        '• Sweepstakes that do not clearly disclose rules and eligibility',
        '',
        'Some gambling-related content may be prohibited depending on jurisdiction.'
      ]
    },
    {
      title: '4. Adult Content',
      content: [
        'Includes:',
        '• Sexually explicit material',
        '• Pornographic content',
        '• Escort or adult services',
        '• Content intended to arouse or exploit',
        '',
        'This content is strictly prohibited.'
      ]
    },
    {
      title: '5. Alcohol, Tobacco, and Controlled Substances',
      content: [
        'Includes:',
        '• Promotion or sale of alcohol',
        '• Tobacco, vaping, or nicotine products',
        '• Cannabis or controlled substances',
        '• Drug paraphernalia',
        '',
        'Such content may be restricted or prohibited depending on applicable laws.'
      ]
    },
    {
      title: '6. Political and Advocacy Content',
      content: [
        'Includes:',
        '• Political campaigns or fundraising',
        '• Voter engagement or election-related messaging',
        '• Issue-based advocacy',
        '',
        'Political content may require additional review and compliance verification.'
      ]
    },
    {
      title: '7. Affiliate and Lead Generation Content',
      content: [
        'Includes:',
        '• Affiliate marketing campaigns',
        '• Lead generation funnels',
        '• CPA or arbitrage traffic schemes',
        '• Third-party offers where consent cannot be verified',
        '',
        'Proof of opt-in and consent may be required.'
      ]
    },
    {
      title: '8. Legal, Immigration, and Tax Content',
      content: [
        'Includes:',
        '• Legal advice or representation claims',
        '• Immigration services or visa assistance',
        '• Tax preparation or tax avoidance strategies',
        '',
        'Such content may require licensing or regulatory disclosures.'
      ]
    },
    {
      title: '9. Sweepstakes, Contests, and Promotions',
      content: [
        'Includes:',
        '• Giveaways and contests',
        '• Referral programs',
        '• Promotions requiring user action or entry',
        '',
        'Clear terms, eligibility rules, and compliance with local laws are required.'
      ]
    },
    {
      title: '10. Deceptive or Misleading Practices',
      content: [
        'Includes:',
        '• False claims or misrepresentation',
        '• Impersonation of brands or individuals',
        '• Misleading subject lines or sender identities',
        '• Obscured unsubscribe mechanisms',
        '',
        'This content is strictly prohibited.'
      ]
    },
    {
      title: '11. Enforcement',
      content: [
        'MailWizard may:',
        '• Require additional documentation or proof of compliance',
        '• Temporarily restrict sending privileges',
        '• Suspend or terminate accounts for repeated or severe violations',
        '',
        'Failure to comply with review requests may result in account termination.'
      ]
    },
    {
      title: '12. Contact Information',
      content: [
        'Questions regarding high-risk content or compliance should be directed to:',
        '',
        'info@mailwizard.io'
      ]
    }
  ]
};
