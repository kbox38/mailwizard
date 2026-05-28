/**
 * ============================================================================
 * Google Domains DNS Configuration Guide
 * ============================================================================
 * 
 * Google Domains-specific instructions with DMARC support
 * 
 * Note: Google Domains is now part of Squarespace (2023)
 * 
 * ============================================================================
 */

import { DNSInstructions } from '../../../lib/services/domainService';
import { ExternalLink, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import DNSRecordRow from '../DNSRecordRow';

interface GoogleDomainsGuideProps {
  instructions: DNSInstructions;
}

export default function GoogleDomainsGuide({ instructions }: GoogleDomainsGuideProps) {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Google Domains Configuration</h3>
        <p className="text-sm text-blue-700 mb-2">
          Follow these steps to configure DNS records in Google Domains.
        </p>
        <p className="text-xs text-blue-600">
          <strong>Note:</strong> Google Domains is now operated by Squarespace. If your domain has been migrated, 
          the interface may look different but the concepts remain the same.
        </p>
      </div>

      {/* Step 1: Access DNS Management */}
      <div className="border-l-4 border-gold pl-4">
        <h4 className="font-semibold text-lg mb-2">Step 1: Access DNS Settings</h4>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Log in to Google Domains at <strong>domains.google.com</strong></li>
          <li>Click on <strong>{instructions.domain}</strong></li>
          <li>Click <strong>DNS</strong> in the left menu</li>
          <li>Scroll to <strong>Custom resource records</strong></li>
        </ol>
      </div>

      {/* DNS Records */}
      {instructions.records.map((record, index) => {
        const isDKIM = record.record.host.includes('_domainkey');
        const isSPF = record.record.type === 'TXT' && record.record.host.includes('mail');
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
              <p className="text-sm font-medium text-gray-900 mb-3">In Google Domains DNS:</p>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>
                  Under <strong>Custom resource records</strong>, find the <strong>Create new record</strong> section
                </li>
                <li>
                  Set <strong>"Name"</strong> (or "Host name") to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                    {record.record.host}
                  </code>
                  <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                    💡 Google Domains uses the full hostname (including domain)
                  </div>
                </li>
                <li>
                  Set <strong>"Type"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                    {record.record.type}
                  </code>
                </li>
                <li>
                  Set <strong>"TTL"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">300</code> (or 1 hour)
                </li>
                <li>
                  Set <strong>"Data"</strong> to:
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
                  Click <strong>"Add"</strong>
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
          ⚠️ Common Google Domains Mistakes
        </h4>
        <ul className="text-sm text-amber-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Using @ symbol:</strong> Google Domains requires full hostname, not @ (use full subdomain + domain)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Quotes around TXT values:</strong> Google Domains automatically adds quotes - don't include them yourself</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Incomplete DKIM key:</strong> Make sure to copy the entire key</span>
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
              <li><strong>Maximum:</strong> Up to 48 hours</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <p className="font-medium text-purple-900 mb-1">🔍 Verify in Email Wizard:</p>
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
        <a
          href="https://support.google.com/domains/answer/3290350"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-purple hover:text-gold transition-colors"
        >
          <ExternalLink size={14} />
          Google Domains: Managing DNS Records
        </a>
      </div>
    </div>
  );
}