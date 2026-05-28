/**
 * ============================================================================
 * SendGrid Domain API Wrapper
 * ============================================================================
 * 
 * Purpose: Type definitions and helper functions for SendGrid domain operations
 * 
 * NOTE: Most domain operations go through edge functions (manage-domain).
 * This file provides types and formatting utilities for SendGrid responses.
 * 
 * ============================================================================
 */

/**
 * SendGrid domain authentication response structure
 */
export interface SendGridDomain {
  id: number;
  domain: string;
  subdomain: string;
  username: string;
  user_id: number;
  ips: string[];
  custom_spf: boolean;
  default: boolean;
  legacy: boolean;
  automatic_security: boolean;
  valid: boolean;
  dns: {
    mail_cname?: {
      host: string;
      type: string;
      data: string;
      valid: boolean;
    };
    dkim1: {
      host: string;
      type: string;
      data: string;
      valid: boolean;
    };
    dkim2: {
      host: string;
      type: string;
      data: string;
      valid: boolean;
    };
  };
}

/**
 * SendGrid validation response structure
 */
export interface SendGridValidationResult {
  id: number;
  valid: boolean;
  validation_results: {
    mail_cname?: {
      valid: boolean;
      reason: string | null;
    };
    dkim1: {
      valid: boolean;
      reason: string | null;
    };
    dkim2: {
      valid: boolean;
      reason: string | null;
    };
    spf?: {
      valid: boolean;
      reason: string | null;
    };
  };
}

/**
 * Formatted DNS record for application use
 */
export interface FormattedDNSRecord {
  type: 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl: number;
  purpose: string;
  required: boolean;
  valid?: boolean;
}

/**
 * Parses SendGrid DNS records into application format
 */
export function parseDNSRecords(sendgridDomain: SendGridDomain): FormattedDNSRecord[] {
  const records: FormattedDNSRecord[] = [];
  
  // Mail CNAME
  if (sendgridDomain.dns.mail_cname) {
    records.push({
      type: 'CNAME',
      host: sendgridDomain.dns.mail_cname.host,
      value: sendgridDomain.dns.mail_cname.data,
      ttl: 300,
      purpose: 'Links your domain to SendGrid mail servers',
      required: true,
      valid: sendgridDomain.dns.mail_cname.valid
    });
  }
  
  // DKIM1
  records.push({
    type: 'CNAME',
    host: sendgridDomain.dns.dkim1.host,
    value: sendgridDomain.dns.dkim1.data,
    ttl: 300,
    purpose: 'First DKIM signature for email authentication',
    required: true,
    valid: sendgridDomain.dns.dkim1.valid
  });
  
  // DKIM2
  records.push({
    type: 'CNAME',
    host: sendgridDomain.dns.dkim2.host,
    value: sendgridDomain.dns.dkim2.data,
    ttl: 300,
    purpose: 'Second DKIM signature for email authentication',
    required: true,
    valid: sendgridDomain.dns.dkim2.valid
  });
  
  return records;
}

/**
 * Checks if a domain is fully verified
 */
export function isDomainFullyVerified(sendgridDomain: SendGridDomain): boolean {
  const dns = sendgridDomain.dns;
  const dkim1Valid = dns.dkim1?.valid || false;
  const dkim2Valid = dns.dkim2?.valid || false;
  const mailCnameValid = dns.mail_cname ? dns.mail_cname.valid : true;
  
  return dkim1Valid && dkim2Valid && mailCnameValid;
}

/**
 * Gets list of invalid DNS records
 */
export function getInvalidRecords(sendgridDomain: SendGridDomain): string[] {
  const invalid: string[] = [];
  const dns = sendgridDomain.dns;
  
  if (dns.mail_cname && !dns.mail_cname.valid) invalid.push('Mail CNAME');
  if (!dns.dkim1.valid) invalid.push('DKIM1');
  if (!dns.dkim2.valid) invalid.push('DKIM2');
  
  return invalid;
}

/**
 * Maps SendGrid error codes to user-friendly messages
 */
export function getSendGridErrorMessage(errorCode: string | number): string {
  const errorMessages: Record<string, string> = {
    '400': 'Invalid request. Please check your domain name.',
    '401': 'Authentication failed. Please contact support.',
    '403': 'Access denied. Please verify your account permissions.',
    '404': 'Domain not found in SendGrid.',
    '409': 'Domain already exists in SendGrid.',
    '429': 'Too many requests. Please try again in a few minutes.',
    '500': 'SendGrid server error. Please try again later.',
    '503': 'SendGrid service temporarily unavailable.'
  };
  
  return errorMessages[errorCode.toString()] || 'An unexpected error occurred with SendGrid.';
}

/**
 * DNS propagation time estimates
 */
export const DNS_PROPAGATION = {
  MINIMUM_MINUTES: 5,
  TYPICAL_MINUTES: 30,
  MAXIMUM_HOURS: 48
} as const;

export const sendGridDomainAPI = {
  parseDNSRecords,
  isDomainFullyVerified,
  getInvalidRecords,
  getSendGridErrorMessage,
  PROPAGATION: DNS_PROPAGATION
};

export default sendGridDomainAPI;
