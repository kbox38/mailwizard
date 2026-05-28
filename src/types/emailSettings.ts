/**
 * Email Settings Types
 *
 * Defines the structure for professional email formatting settings
 * used in campaigns and templates
 */

export interface EmailSettings {
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
  fromEmail?: string;
  subjectLine?: string;
}

export interface MergeField {
  key: string;
  label: string;
  description?: string;
  example?: string;
}

export const DEFAULT_MERGE_FIELDS: MergeField[] = [
  {
    key: 'first_name',
    label: 'First Name',
    description: 'Contact\'s first name',
    example: 'John'
  },
  {
    key: 'last_name',
    label: 'Last Name',
    description: 'Contact\'s last name',
    example: 'Doe'
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Contact\'s email address',
    example: 'john@example.com'
  },
  {
    key: 'company',
    label: 'Company',
    description: 'Contact\'s company name',
    example: 'Acme Corp'
  },
  {
    key: 'role',
    label: 'Role/Title',
    description: 'Contact\'s job title or role',
    example: 'Marketing Manager'
  }
];

export const SYSTEM_MERGE_TAGS: MergeField[] = [
  {
    key: 'UNSUBSCRIBE_URL',
    label: 'Unsubscribe Link',
    description: 'Automatically generated unsubscribe URL',
    example: 'https://example.com/unsubscribe'
  },
  {
    key: 'VIEW_IN_BROWSER_URL',
    label: 'View in Browser Link',
    description: 'Link to view email in web browser',
    example: 'https://example.com/view-email'
  },
  {
    key: 'FROM_EMAIL',
    label: 'Sender Email',
    description: 'Email address of the sender',
    example: 'hello@example.com'
  },
  {
    key: 'SUBJECT_LINE',
    label: 'Subject Line',
    description: 'Email subject line',
    example: 'Welcome to our newsletter'
  },
  {
    key: 'COMPANY_NAME',
    label: 'Company Name',
    description: 'Your company name',
    example: 'Acme Corporation'
  }
];
