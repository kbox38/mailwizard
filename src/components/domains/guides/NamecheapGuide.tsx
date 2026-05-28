/**
 * ============================================================================
 * Namecheap DNS Configuration Guide - UPDATED
 * ============================================================================
 * 
 * Namecheap-specific instructions (Advanced DNS interface)
 * 
 * CRITICAL Namecheap Difference:
 * - DNS records are split into TWO sections:
 *   1. HOST RECORDS (for TXT and CNAME)
 *   2. MAIL SETTINGS (for MX records)
 * 
 * Key Points:
 * - Host field: Use subdomain ONLY (not full domain)
 * - Namecheap automatically appends domain name
 * - "@" is ONLY for root domain records
 * - Remove trailing dots from values
 * 
 * ============================================================================
 */

import { DNSInstructions } from '../../../lib/services/domainService';
import { ExternalLink, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import DNSRecordRow from '../DNSRecordRow';

interface NamecheapGuideProps {
  instructions: DNSInstructions;
}

export default function NamecheapGuide({ instructions }: NamecheapGuideProps) {
  // Separate records by type
  const txtCnameRecords = instructions.records.filter(r => 
    r.record.type === 'TXT' || r.record.type === 'CNAME'
  );
  const mxRecords = instructions.records.filter(r => 
    r.record.type === 'MX'
  );
  
  // Helper to extract subdomain from host
  const getSubdomain = (host: string) => {
    const domain = instructions.domain;
    return host.replace(`.${domain}`, '').replace(domain, '@');
  };

  return (
    <div className="space-y-6">
      {/* Critical Warning */}
      <div className="card bg-amber-50 border-2 border-amber-400">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">⚠️ Important: Namecheap Has Two Sections!</h3>
            <p className="text-sm text-amber-800 mb-2">
              Unlike other DNS providers, Namecheap splits DNS records into <strong>two separate sections</strong>:
            </p>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li><strong>HOST RECORDS</strong> - Add TXT and CNAME records here</li>
              <li><strong>MAIL SETTINGS</strong> - Add MX records here (if needed)</li>
            </ul>
            <p className="text-sm text-amber-800 mt-2">
              You must add records in BOTH sections for email to work!
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Access Advanced DNS */}
      <div className="border-l-4 border-gold pl-4">
        <h4 className="font-semibold text-lg mb-2">Step 1: Access Advanced DNS</h4>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Log in to Namecheap at <strong>namecheap.com</strong></li>
          <li>Go to <strong>Domain List</strong></li>
          <li>Click <strong>Manage</strong> next to <strong>{instructions.domain}</strong></li>
          <li>Click the <strong>Advanced DNS</strong> tab</li>
          <li>You will see two sections: <strong>HOST RECORDS</strong> and <strong>MAIL SETTINGS</strong></li>
        </ol>
      </div>

      {/* Section Divider - HOST RECORDS */}
      <div className="card bg-blue-50 border-2 border-blue-400">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">
            PART 1: HOST RECORDS Section
          </h3>
        </div>
        <p className="text-sm text-blue-700 mt-2">
          Add the following records in the <strong>HOST RECORDS</strong> section of Advanced DNS:
        </p>
      </div>

      {/* TXT and CNAME Records */}
      {txtCnameRecords.map((record, index) => {
        const subdomain = getSubdomain(record.record.host);
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
              <p className="text-sm font-medium text-gray-900 mb-3">
                📍 In <strong>HOST RECORDS</strong> section:
              </p>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>
                  Click <strong>"+ Add New Record"</strong>
                </li>
                <li>
                  From dropdown, select: 
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                    {record.record.type} Record
                  </code>
                </li>
                <li className="flex items-start gap-2">
                  <span>Set <strong>"Host"</strong> to:</span>
                  <div className="flex-1">
                    <code className="bg-yellow-100 px-2 py-0.5 rounded font-bold">
                      {subdomain}
                    </code>
                    <div className="mt-1 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                      ⚠️ <strong>CRITICAL:</strong> Enter <strong>ONLY</strong> the subdomain part shown above.
                      <br/>❌ Do NOT enter: <code>{record.record.host}</code>
                      <br/>✅ Namecheap automatically adds <code>.{instructions.domain}</code>
                    </div>
                  </div>
                </li>
                <li>
                  Set <strong>"Value"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1 text-xs break-all block mt-1">
                    {record.record.value}
                  </code>
                  {isDKIM && (
                    <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                      💡 <strong>Tip:</strong> This is a long key. Copy the ENTIRE value - it starts with <code>k=rsa;</code> and is 200+ characters.
                    </div>
                  )}
                  {isSPF && (
                    <div className="mt-1 text-xs text-green-700 bg-green-50 p-2 rounded">
                      ✅ This authorizes SendGrid to send emails from <code>mail.{instructions.domain}</code>
                    </div>
                  )}
                  {isDMARC && (
                    <div className="mt-1 text-xs text-purple-700 bg-purple-50 p-2 rounded">
                      ⭐ <strong>Optional but highly recommended!</strong> This protects your domain and improves deliverability by 10-20%.
                    </div>
                  )}
                </li>
                <li>
                  Set <strong>"TTL"</strong> to: 
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">Automatic</code>
                </li>
                <li>
                  Click the <strong>green checkmark ✓</strong> to save
                </li>
              </ol>
            </div>
          </div>
        );
      })}

      {/* MX Records Section (if any) */}
      {mxRecords.length > 0 && (
        <>
          <div className="card bg-orange-50 border-2 border-orange-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">
                PART 2: MAIL SETTINGS Section
              </h3>
            </div>
            <p className="text-sm text-orange-700 mt-2">
              <strong>IMPORTANT:</strong> MX records go in a <strong>DIFFERENT SECTION</strong> than the records above!
              <br />
              Scroll down to find <strong>MAIL SETTINGS</strong> and add the following:
            </p>
          </div>

          {mxRecords.map((record, index) => {
            const subdomain = getSubdomain(record.record.host);
            
            return (
              <div key={index} className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-lg mb-3">
                  Step {txtCnameRecords.length + index + 2}: {record.title}
                </h4>
                
                <p className="text-sm text-gray-600 mb-3">{record.description}</p>
                
                <DNSRecordRow instruction={record} />
                
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    📍 In <strong>MAIL SETTINGS</strong> section:
                  </p>
                  <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                    <li>
                      Scroll down in Advanced DNS to find <strong>MAIL SETTINGS</strong>
                    </li>
                    <li>
                      Click on <strong>"Custom MX"</strong> (you may need to expand this section)
                    </li>
                    <li>
                      Click <strong>"+ Add New Record"</strong>
                    </li>
                    <li>
                      Set <strong>"Host"</strong> to:
                      <code className="bg-yellow-100 px-2 py-0.5 rounded ml-1 font-bold">
                        {subdomain}
                      </code>
                    </li>
                    <li>
                      Set <strong>"Value"</strong> (or "Mail Server") to:
                      <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                        {record.record.value}
                      </code>
                    </li>
                    <li>
                      Set <strong>"Priority"</strong> to:
                      <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">10</code>
                    </li>
                    <li>
                      Click <strong>"Save"</strong> or the green checkmark ✓
                    </li>
                  </ol>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Common Mistakes */}
      <div className="card bg-red-50 border border-red-200">
        <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          ❌ Common Mistakes to Avoid
        </h4>
        <ul className="text-sm text-red-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-bold">❌</span>
            <span><strong>Using full domain in Host field:</strong> Enter only subdomain (e.g., <code>m1._domainkey</code>), NOT <code>m1._domainkey.{instructions.domain}</code></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">❌</span>
            <span><strong>Using "@" for DKIM:</strong> "@" is ONLY for root domain records (like root SPF), not for subdomains</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">❌</span>
            <span><strong>Adding MX in HOST RECORDS:</strong> MX records must go in MAIL SETTINGS section</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">❌</span>
            <span><strong>Incomplete DKIM key:</strong> Copy the ENTIRE key (200+ characters)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">❌</span>
            <span><strong>Extra trailing dots:</strong> Remove any trailing dots from values</span>
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
              <li><strong>Minimum:</strong> 30 minutes</li>
              <li><strong>Typical:</strong> 1-2 hours</li>
              <li><strong>Maximum:</strong> 24-48 hours (rare)</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="font-medium text-green-900 mb-2">✅ Check Propagation Status:</p>
            <p className="text-green-800 mb-2">Use this free tool to verify your records are visible globally:</p>
            <a
              href="https://www.whatsmydns.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 font-medium"
            >
              <ExternalLink size={14} />
              whatsmydns.net
            </a>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <p className="font-medium text-purple-900 mb-1">🔍 Then Verify in Email Wizard:</p>
            <p className="text-purple-800">
              Once propagation is complete, click <strong>"Verify Domain"</strong> in Email Wizard. 
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
            href="https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple hover:text-gold transition-colors"
          >
            <ExternalLink size={14} />
            Namecheap: How to Create a CNAME Record
          </a>
          <br />
          <a
            href="https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple hover:text-gold transition-colors"
          >
            <ExternalLink size={14} />
            Namecheap: How to Add TXT/SPF/DKIM/DMARC Records
          </a>
        </div>
      </div>
    </div>
  );
}