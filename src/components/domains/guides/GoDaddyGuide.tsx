/**
 * ============================================================================
 * GoDaddy DNS Configuration Guide - UPDATED
 * ============================================================================
 * 
 * GoDaddy-specific instructions with DMARC support
 * 
 * Key Points:
 * - GoDaddy DNS Manager uses "Host", "Points to", "TTL"
 * - Use "@" for root domain records
 * - DNS propagation: 1-2 hours typically
 * 
 * ============================================================================
 */

import { DNSInstructions } from '../../../lib/services/domainService';
import { ExternalLink, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import DNSRecordRow from '../DNSRecordRow';

interface GoDaddyGuideProps {
  instructions: DNSInstructions;
}

export default function GoDaddyGuide({ instructions }: GoDaddyGuideProps) {
  // Helper to extract subdomain from host
  const getSubdomain = (host: string) => {
    const domain = instructions.domain;
    return host.replace(`.${domain}`, '').replace(domain, '@');
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">GoDaddy Configuration</h3>
        <p className="text-sm text-blue-700">
          Follow these steps to configure DNS records in GoDaddy DNS Manager.
        </p>
      </div>

      {/* Step 1: Access DNS */}
      <div className="border-l-4 border-gold pl-4">
        <h4 className="font-semibold text-lg mb-2">Step 1: Access DNS Management</h4>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Log in to GoDaddy at <strong>godaddy.com</strong></li>
          <li>Click your profile icon → <strong>My Products</strong></li>
          <li>Find <strong>{instructions.domain}</strong> and click <strong>DNS</strong></li>
          <li>Scroll to the <strong>Records</strong> section</li>
        </ol>
      </div>

      {/* DNS Records */}
      {instructions.records.map((record, index) => {
        const subdomain = getSubdomain(record.record.host);
        const isDKIM = record.record.host.includes('_domainkey');
        const isSPF = record.record.type === 'TXT' && (record.record.host.includes('mail') || record.record.value.includes('spf'));
        const isDMARC = record.record.host.includes('_dmarc');
        const isMX = record.record.type === 'MX';
        
        return (
          <div key={index} className="border-l-4 border-purple pl-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-semibold text-lg">
                Step {index + 2}: {record.title}
              </h4>
              {record.required && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Required</span>}
              {!record.required && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Recommended</span>}
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{record.description}</p>
            
            <DNSRecordRow instruction={record} />
            
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                📍 In GoDaddy DNS Records:
              </p>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>
                  Click <strong>"Add"</strong> button
                </li>
                <li>
                  Select Type: 
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                    {record.record.type}
                  </code>
                </li>
                <li>
                  Set <strong>"Host"</strong> or <strong>"Name"</strong> to:
                  <code className="bg-yellow-100 px-2 py-0.5 rounded ml-1 font-bold">
                    {subdomain === '@' ? '@' : subdomain}
                  </code>
                  <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                    💡 GoDaddy uses "@" for root domain. For subdomains, enter only the subdomain part.
                  </div>
                </li>
                <li>
                  Set <strong>"Points to"</strong> or <strong>"Value"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1 text-xs break-all block mt-1">
                    {record.record.value}
                  </code>
                  {isDKIM && (
                    <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                      💡 Copy the ENTIRE DKIM key (200+ characters)
                    </div>
                  )}
                  {isSPF && (
                    <div className="mt-1 text-xs text-green-700 bg-green-50 p-2 rounded">
                      ✅ This authorizes SendGrid to send emails on your behalf
                    </div>
                  )}
                  {isDMARC && (
                    <div className="mt-1 text-xs text-purple-700 bg-purple-50 p-2 rounded">
                      ⭐ <strong>Highly Recommended!</strong> DMARC improves deliverability by 10-20% and protects against spoofing.
                    </div>
                  )}
                </li>
                {isMX && (
                  <li>
                    Set <strong>"Priority"</strong> to:
                    <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">10</code>
                  </li>
                )}
                <li>
                  Set <strong>"TTL"</strong> to: 
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">600 (or Custom: 300)</code>
                </li>
                <li>
                  Click <strong>"Save"</strong>
                </li>
              </ol>
            </div>
          </div>
        );
      })}

      {/* Common Mistakes */}
      <div className="card bg-amber-50 border border-amber-200">
        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          ⚠️ Common GoDaddy Mistakes
        </h4>
        <ul className="text-sm text-amber-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Using full domain in Host:</strong> Enter only subdomain (e.g., "mail", not "mail.{instructions.domain}")</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Email forwarding conflicts:</strong> If you have GoDaddy email forwarding, it may conflict with SPF - disable it first</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Incomplete DKIM key:</strong> Make sure to copy the entire key (200+ characters)</span>
          </li>
        </ul>
      </div>

      {/* Verification */}
      <div className="border-l-4 border-gold pl-4">
        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-gold" />
          Final Step: Verify Configuration
        </h4>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="font-medium text-blue-900 mb-1">⏱️ Wait for DNS Propagation:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>Typical:</strong> 1-2 hours</li>
              <li><strong>Some users report:</strong> Up to 24 hours</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              Check status at <a href="https://www.whatsmydns.net/" target="_blank" rel="noopener noreferrer" className="underline">whatsmydns.net</a>
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <p className="font-medium text-purple-900 mb-1">🔍 Then Verify in Email Wizard:</p>
            <p className="text-purple-800">
              After propagation, click <strong>"Verify Domain"</strong> in Email Wizard. 
              All records should show as <strong className="text-green-600">"Valid" ✓</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="card bg-gray-50 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">📚 Additional Resources</h4>
        <div className="space-y-2">
          <a
            href="https://www.godaddy.com/help/add-a-cname-record-19236"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple hover:text-gold transition-colors"
          >
            <ExternalLink size={14} />
            GoDaddy: How to Add DNS Records
          </a>
        </div>
      </div>
    </div>
  );
}