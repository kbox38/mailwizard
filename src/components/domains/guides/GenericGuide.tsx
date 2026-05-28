/**
 * ============================================================================
 * Generic DNS Configuration Guide
 * ============================================================================
 * 
 * Universal instructions for any DNS provider with DMARC support
 * 
 * Works for: Hover, DreamHost, HostGator, Bluehost, Squarespace, and others
 * 
 * ============================================================================
 */

import { DNSInstructions } from '../../../lib/services/domainService';
import { ExternalLink, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import DNSRecordRow from '../DNSRecordRow';

interface GenericGuideProps {
  instructions: DNSInstructions;
}

export default function GenericGuide({ instructions }: GenericGuideProps) {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Universal DNS Configuration</h3>
            <p className="text-sm text-blue-700">
              These instructions work for most DNS providers. Look for similar options 
              in your provider's DNS management interface.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: General navigation */}
      <div className="border-l-4 border-gold pl-4">
        <h4 className="font-semibold text-lg mb-2">Step 1: Access DNS Settings</h4>
        <p className="text-sm text-gray-700 mb-2">
          In your DNS provider's control panel, look for one of these sections:
        </p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside ml-4">
          <li><strong>DNS Management</strong></li>
          <li><strong>DNS Records</strong></li>
          <li><strong>Advanced DNS</strong></li>
          <li><strong>Domain Settings → DNS</strong></li>
          <li><strong>Zone File Editor</strong></li>
          <li><strong>Name Server Records</strong></li>
        </ul>
      </div>

      {/* Field Name Variations */}
      <div className="card bg-amber-50 border border-amber-200">
        <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Common Field Names (Different Providers Use Different Terms)
        </h4>
        <div className="text-sm text-amber-800 space-y-1">
          <p><strong>Record Type:</strong> "Type", "Record Type", "DNS Type"</p>
          <p><strong>Host/Name:</strong> "Host", "Name", "Record Name", "Hostname", "Subdomain"</p>
          <p><strong>Value/Target:</strong> "Value", "Points To", "Target", "Content", "Data", "Answer"</p>
          <p><strong>TTL:</strong> "TTL", "Time to Live" (often in seconds)</p>
        </div>
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
              <p className="text-sm font-medium text-gray-900 mb-3">Add this DNS record:</p>
              
              <div className="space-y-3">
                {/* Record Type */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    Record Type / Type / DNS Type:
                  </div>
                  <code className="bg-white border border-gray-300 px-3 py-2 rounded text-sm block">
                    {record.record.type}
                  </code>
                </div>

                {/* Host/Name */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    Host / Name / Hostname / Subdomain:
                  </div>
                  <code className="bg-white border border-gray-300 px-3 py-2 rounded text-sm block">
                    {record.record.host}
                  </code>
                  <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                    💡 Some providers want just the subdomain part (e.g., "mail"), others want 
                    the full hostname (e.g., "mail.{instructions.domain}"). Try the full version first.
                  </div>
                </div>

                {/* Value/Target */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    Value / Points To / Target / Content / Data:
                  </div>
                  <code className="bg-white border border-gray-300 px-3 py-2 rounded text-sm block break-all">
                    {record.record.value}
                  </code>
                  {isDKIM && (
                    <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                      💡 <strong>Important:</strong> Copy the ENTIRE DKIM key (200+ characters). Don't miss any part!
                    </div>
                  )}
                  {isSPF && (
                    <div className="mt-1 text-xs text-green-700 bg-green-50 p-2 rounded">
                      ✅ This SPF record authorizes SendGrid to send emails from your domain
                    </div>
                  )}
                  {isDMARC && (
                    <div className="mt-1 text-xs text-purple-700 bg-purple-50 p-2 rounded">
                      ⭐ <strong>Highly Recommended!</strong> DMARC record improves email deliverability by 10-20%, 
                      protects against spoofing, and provides authentication reports.
                    </div>
                  )}
                </div>

                {/* MX Priority */}
                {isMX && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                      Priority / Preference:
                    </div>
                    <code className="bg-white border border-gray-300 px-3 py-2 rounded text-sm block">
                      10
                    </code>
                    <div className="mt-1 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                      ⚠️ MX records require a priority value (use 10)
                    </div>
                  </div>
                )}

                {/* TTL */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    TTL / Time to Live:
                  </div>
                  <code className="bg-white border border-gray-300 px-3 py-2 rounded text-sm block">
                    300 (or Automatic / Default)
                  </code>
                  <div className="mt-1 text-xs text-gray-600">
                    Use 300 seconds (5 minutes) or your provider's default setting
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Common Issues */}
      <div className="card bg-red-50 border border-red-200">
        <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          ⚠️ Common Issues Across All Providers
        </h4>
        <ul className="text-sm text-red-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>@ vs subdomain:</strong> Some providers use "@" for root domain, others use the full domain name</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Automatic quotes:</strong> Some providers add quotes to TXT records automatically - don't include them yourself</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Trailing dots:</strong> Some providers require trailing dots (.), others don't - try without first</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Incomplete values:</strong> Make sure to copy the ENTIRE value, especially for long DKIM keys</span>
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
              <li><strong>Minimum:</strong> 15-30 minutes</li>
              <li><strong>Typical:</strong> 1-4 hours</li>
              <li><strong>Maximum:</strong> 24-48 hours (rare)</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="font-medium text-green-900 mb-2">✅ Check DNS Propagation:</p>
            <p className="text-green-800 mb-2">Use this free tool to verify your records are visible:</p>
            <a
              href="https://www.whatsmydns.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 font-medium"
            >
              <ExternalLink size={14} />
              whatsmydns.net - Check Global DNS Propagation
            </a>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <p className="font-medium text-purple-900 mb-1">🔍 Verify in Email Wizard:</p>
            <p className="text-purple-800">
              After DNS propagates, click <strong>"Verify Domain"</strong> in Email Wizard. 
              All records should show as <strong className="text-green-600">"Valid" ✓</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Provider-Specific Help */}
      <div className="card bg-gray-50 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">📚 Need Provider-Specific Help?</h4>
        <p className="text-sm text-gray-700 mb-3">
          Search for "[Your Provider Name] add DNS record" or "[Your Provider Name] add TXT record" 
          to find your provider's specific documentation.
        </p>
        <p className="text-sm text-gray-600">
          <strong>Common providers:</strong> Hover, DreamHost, HostGator, Bluehost, Network Solutions, 
          1&1 IONOS, Wix, Squarespace, Weebly, WordPress.com
        </p>
      </div>
    </div>
  );
}