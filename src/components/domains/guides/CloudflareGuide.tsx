/**
 * ============================================================================
 * Cloudflare DNS Configuration Guide
 * ============================================================================
 * 
 * Cloudflare-specific instructions with critical proxy warning
 * 
 * CRITICAL: Cloudflare proxy (orange cloud) MUST be disabled for email records
 * 
 * ============================================================================
 */

import { DNSInstructions } from '../../../lib/services/domainService';
import { ExternalLink, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import DNSRecordRow from '../DNSRecordRow';

interface CloudflareGuideProps {
  instructions: DNSInstructions;
}

export default function CloudflareGuide({ instructions }: CloudflareGuideProps) {
  return (
    <div className="space-y-6">
      {/* Critical Cloudflare Warning */}
      <div className="card bg-red-50 border-2 border-red-400">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-2">🚨 CRITICAL: Disable Cloudflare Proxy!</h3>
            <p className="text-sm text-red-800 mb-2">
              You <strong>MUST</strong> disable the Cloudflare proxy (turn orange cloud to gray) for ALL email DNS records!
            </p>
            <p className="text-sm text-red-800 font-medium">
              Orange cloud = Proxied = ❌ Email authentication will FAIL<br/>
              Gray cloud = DNS only = ✅ Email authentication will WORK
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Access DNS Management */}
      <div className="border-l-4 border-gold pl-4">
        <h4 className="font-semibold text-lg mb-2">Step 1: Access DNS Management</h4>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Log in to Cloudflare at <strong>dash.cloudflare.com</strong></li>
          <li>Select your domain: <strong>{instructions.domain}</strong></li>
          <li>Click <strong>DNS</strong> in the left sidebar</li>
          <li>You'll see the DNS records list</li>
        </ol>
      </div>

      {/* DNS Records */}
      {instructions.records.map((record, index) => {
        const isDKIM = record.record.host.includes('_domainkey');
        const isSPF = record.record.type === 'TXT' && record.record.host.includes('mail');
        const isDMARC = record.record.host.includes('_dmarc');
        
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
              <p className="text-sm font-medium text-gray-900 mb-3">In Cloudflare DNS:</p>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>
                  Click <strong>"Add record"</strong> button
                </li>
                <li>
                  Set <strong>"Type"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                    {record.record.type}
                  </code>
                </li>
                <li>
                  Set <strong>"Name"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                    {record.record.host}
                  </code>
                </li>
                <li>
                  Set <strong>"Content"</strong> (or "Target") to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1 text-xs break-all block mt-1">
                    {record.record.value}
                  </code>
                  {isDKIM && (
                    <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                      💡 <strong>Tip:</strong> Copy the entire DKIM key (200+ characters)
                    </div>
                  )}
                  {isSPF && (
                    <div className="mt-1 text-xs text-green-700 bg-green-50 p-2 rounded">
                      ✅ This authorizes SendGrid to send emails from your domain
                    </div>
                  )}
                  {isDMARC && (
                    <div className="mt-1 text-xs text-purple-700 bg-purple-50 p-2 rounded">
                      ⭐ <strong>Highly Recommended!</strong> DMARC improves deliverability by 10-20% and protects your domain from spoofing.
                    </div>
                  )}
                </li>
                <li>
                  Set <strong>"TTL"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">Auto</code> (or 300 seconds)
                </li>
                <li className="bg-yellow-50 p-3 rounded border-2 border-yellow-400">
                  <strong className="text-red-700">⚠️ CRITICAL:</strong> Set <strong>"Proxy status"</strong> to:
                  <div className="mt-2 flex items-center gap-2">
                    <span className="bg-gray-400 text-white px-3 py-1 rounded font-medium">DNS only</span>
                    <span className="text-gray-600">(Gray cloud)</span>
                  </div>
                  <div className="mt-2 text-xs text-red-700">
                    <strong>DO NOT</strong> use "Proxied" (orange cloud) - this will break email authentication!
                  </div>
                </li>
                <li>
                  Click <strong>"Save"</strong>
                </li>
              </ol>
            </div>
          </div>
        );
      })}

      {/* Proxy Verification */}
      <div className="card bg-orange-50 border-2 border-orange-400">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-orange-900 mb-2">Double-Check: All Records Should Have Gray Cloud</h4>
            <p className="text-sm text-orange-800 mb-2">
              After adding all records, verify that <strong>every email record</strong> shows a <strong>gray cloud icon</strong> (not orange).
            </p>
            <p className="text-sm text-orange-800">
              If you see an orange cloud next to any email record, <strong>click it</strong> to turn it gray (DNS only mode).
            </p>
          </div>
        </div>
      </div>

      {/* Verification */}
      <div className="border-l-4 border-gold pl-4">
        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-gold" />
          Final Step: Verify Configuration
        </h4>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="font-medium text-green-900 mb-1">✅ Cloudflare DNS is INSTANT!</p>
            <p className="text-green-800">
              Cloudflare updates DNS records in real-time. You can verify your domain in Email Wizard immediately after adding all records.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <p className="font-medium text-purple-900 mb-1">🔍 Verify in Email Wizard:</p>
            <p className="text-purple-800">
              Click <strong>"Verify Domain"</strong> in Email Wizard right away. All records should show as <strong className="text-green-600">"Valid" ✓</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="card bg-red-50 border border-red-200">
        <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          ⚠️ Troubleshooting
        </h4>
        <ul className="text-sm text-red-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-bold">❌</span>
            <span><strong>Verification failing?</strong> → Check that ALL email records have GRAY cloud (not orange)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">❌</span>
            <span><strong>Still failing after turning cloud gray?</strong> → Temporarily pause Cloudflare: Overview → Pause Cloudflare, then verify</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">✅</span>
            <span><strong>After verification succeeds:</strong> You can re-enable Cloudflare (but keep email records on gray cloud)</span>
          </li>
        </ul>
      </div>

      {/* Additional Resources */}
      <div className="card bg-gray-50 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">📚 Additional Resources</h4>
        <a
          href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-purple hover:text-gold transition-colors"
        >
          <ExternalLink size={14} />
          Cloudflare: Managing DNS Records
        </a>
      </div>
    </div>
  );
}