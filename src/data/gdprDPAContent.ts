/**
 * ============================================================================
 * GDPR DATA PROCESSING ADDENDUM CONTENT
 * ============================================================================
 * 
 * This file contains the structured content for the GDPR DPA page.
 * Edit this file to update the content without touching the page component.
 * 
 * Last Updated: [Insert Date]
 * ============================================================================
 */

export interface DPASection {
  title: string;
  content: string[];
}

export interface GDPRDPAData {
  lastUpdated: string;
  sections: DPASection[];
}

export const gdprDPAContent: GDPRDPAData = {
  lastUpdated: '[Insert Date]',
  sections: [
    {
      title: 'Introduction',
      content: [
        'This Data Processing Addendum ("Addendum") forms part of the Terms of Service between Synergós, LLC, a Texas limited liability company ("MailWizard," "Processor," "we"), and the customer using the MailWizard Service ("Customer," "Controller").',
        '',
        'This Addendum applies where MailWizard processes Personal Data on behalf of the Customer that is subject to the General Data Protection Regulation (EU) 2016/679 ("GDPR").'
      ]
    },
    {
      title: '1. Definitions',
      content: [
        'Capitalized terms not defined in this Addendum have the meanings set forth in the GDPR.',
        '',
        'Personal Data means any information relating to an identified or identifiable natural person.',
        '',
        'Processing means any operation performed on Personal Data.',
        '',
        'Controller means the entity that determines the purposes and means of Processing.',
        '',
        'Processor means the entity that processes Personal Data on behalf of the Controller.',
        '',
        'Subprocessor means any third party engaged by MailWizard to process Personal Data.'
      ]
    },
    {
      title: '2. Roles of the Parties',
      content: [
        'The Customer acts as the Controller of Personal Data.',
        '',
        'MailWizard acts as the Processor.',
        '',
        'Each party agrees to comply with its obligations under GDPR.'
      ]
    },
    {
      title: '3. Scope and Purpose of Processing',
      content: [
        'MailWizard processes Personal Data solely for the purpose of providing the Service, including:',
        '',
        '• Hosting and storing Customer content',
        '• Sending email communications as directed by Customer',
        '• Maintaining account functionality',
        '• Providing customer support',
        '• Improving service performance and security',
        '',
        'Processing is performed only in accordance with documented instructions from the Customer.'
      ]
    },
    {
      title: '4. Types of Personal Data and Data Subjects',
      content: []
    },
    {
      title: 'Types of Personal Data',
      content: [
        '• Names',
        '• Email addresses',
        '• IP addresses',
        '• Usage data',
        '• Campaign-related metadata'
      ]
    },
    {
      title: 'Categories of Data Subjects',
      content: [
        '• Customer users',
        '• Email recipients',
        '• Account administrators'
      ]
    },
    {
      title: '5. Confidentiality',
      content: [
        'MailWizard ensures that persons authorized to process Personal Data are subject to confidentiality obligations, whether contractual or statutory.'
      ]
    },
    {
      title: '6. Security Measures',
      content: [
        'MailWizard implements appropriate technical and organizational measures to protect Personal Data against:',
        '',
        '• Unauthorized access',
        '• Accidental loss',
        '• Destruction or alteration',
        '',
        'Security measures are designed to ensure a level of security appropriate to the risk.'
      ]
    },
    {
      title: '7. Subprocessing',
      content: [
        'Customer authorizes MailWizard to engage Subprocessors to support the Service.',
        '',
        'MailWizard shall:',
        '• Ensure Subprocessors are bound by data protection obligations consistent with this Addendum',
        '• Remain responsible for Subprocessor performance',
        '',
        'A current list of Subprocessors will be made available upon request.'
      ]
    },
    {
      title: '8. International Data Transfers',
      content: [
        'Personal Data may be processed in countries outside the European Economic Area.',
        '',
        'Where required, MailWizard relies on:',
        '• Standard Contractual Clauses',
        '• Other lawful transfer mechanisms permitted under GDPR'
      ]
    },
    {
      title: '9. Assistance with Data Subject Requests',
      content: [
        'MailWizard will reasonably assist the Customer in fulfilling GDPR obligations related to:',
        '',
        '• Access requests',
        '• Rectification',
        '• Erasure',
        '• Restriction or objection',
        '• Data portability',
        '',
        'Requests must be submitted in writing.'
      ]
    },
    {
      title: '10. Personal Data Breach Notification',
      content: [
        'MailWizard will notify the Customer without undue delay upon becoming aware of a Personal Data Breach involving Customer data and provide information reasonably required for compliance.'
      ]
    },
    {
      title: '11. Data Retention and Deletion',
      content: [
        'Personal Data will be retained only as necessary to provide the Service or meet legal obligations.',
        '',
        'Data deletion requests are handled by manual request only. Upon termination of the Service and receipt of a valid request, MailWizard will delete or return Personal Data unless retention is required by law.'
      ]
    },
    {
      title: '12. Audits',
      content: [
        'Upon reasonable notice and subject to confidentiality, MailWizard will make available information necessary to demonstrate compliance with this Addendum.'
      ]
    },
    {
      title: '13. Liability',
      content: [
        'Each party\'s liability under this Addendum is subject to the limitations set forth in the Terms of Service.'
      ]
    },
    {
      title: '14. Governing Law',
      content: [
        'This Addendum shall be governed by the laws specified in the Terms of Service, without prejudice to mandatory data protection laws.'
      ]
    },
    {
      title: '15. Contact Information',
      content: [
        'All data protection requests or inquiries should be directed to:',
        '',
        'info@mailwizard.io'
      ]
    }
  ]
};
