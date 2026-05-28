/**
 * ============================================================================
 * AWS Route 53 DNS Configuration Guide
 * ============================================================================
 * 
 * AWS Route 53-specific instructions with DMARC support
 * 
 * For technical users comfortable with AWS
 * 
 * ============================================================================
 */

import { DNSInstructions } from '../../../lib/services/domainService';
import { ExternalLink, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import DNSRecordRow from '../DNSRecordRow';

interface Route53GuideProps {
  instructions: DNSInstructions;
}

export default function Route53Guide({ instructions }: Route53GuideProps) {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">AWS Route 53 Configuration</h3>
        <p className="text-sm text-blue-700">
          Follow these steps to configure DNS records in AWS Route 53 console.
        </p>
      </div>

      {/* Step 1: Access Route 53 */}
      <div className="border-l-4 border-gold pl-4">
        <h4 className="font-semibold text-lg mb-2">Step 1: Access Route 53 Console</h4>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Log in to AWS Console at <strong>console.aws.amazon.com</strong></li>
          <li>Navigate to <strong>Route 53</strong> service</li>
          <li>Click <strong>Hosted zones</strong> in the left sidebar</li>
          <li>Select your hosted zone: <strong>{instructions.domain}</strong></li>
          <li>You'll see the list of existing records</li>
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
              <p className="text-sm font-medium text-gray-900 mb-3">In Route 53 Console:</p>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>
                  Click <strong>"Create record"</strong> button
                </li>
                <li>
                  Set <strong>"Record name"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                    {record.record.host}
                  </code>
                  <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                    💡 Route 53 automatically appends the domain name
                  </div>
                </li>
                <li>
                  Set <strong>"Record type"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">
                    {record.record.type}
                  </code>
                </li>
                <li>
                  Set <strong>"TTL (seconds)"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">300</code>
                </li>
                <li>
                  Set <strong>"Value"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1 text-xs break-all block mt-1">
                    {isMX ? `10 ${record.record.value}` : record.record.value}
                  </code>
                  {isMX && (
                    <div className="mt-1 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                      ⚠️ For MX records, include priority (10) before the mail server
                    </div>
                  )}
                  {isDKIM && (
                    <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                      💡 For TXT records, Route 53 may require splitting long values into 255-character chunks
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
                <li>
                  Set <strong>"Routing policy"</strong> to:
                  <code className="bg-gray-200 px-2 py-0.5 rounded ml-1">Simple routing</code>
                </li>
                <li>
                  Click <strong>"Create records"</strong>
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
          ⚠️ Common Route 53 Mistakes
        </h4>
        <ul className="text-sm text-amber-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>MX record format:</strong> Include priority in the value field (e.g., "10 mx.sendgrid.net")</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Long TXT values:</strong> Values over 255 chars need to be split into chunks with quotes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span><strong>Trailing dots:</strong> Route 53 automatically handles trailing dots - don't add them</span>
          </li>
        </ul>
      </div>

      {/* Advanced: CLI/CloudFormation */}
      <div className="card bg-gray-50 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5 text-gray-600" />
          Advanced: CLI/Infrastructure as Code
        </h4>
        <p className="text-sm text-gray-700 mb-2">
          For automated deployment, you can use AWS CLI or CloudFormation:
        </p>
        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
          aws route53 change-resource-record-sets \<br/>
          &nbsp;&nbsp;--hosted-zone-id YOUR_ZONE_ID \<br/>
          &nbsp;&nbsp;--change-batch file://dns-records.json
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
            <p className="font-medium text-green-900 mb-1">⚡ Route 53 Propagation is Fast!</p>
            <p className="text-green-800">
              Route 53 typically propagates DNS changes within <strong>60 seconds</strong>. 
              You can verify almost immediately.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded p-3">
            <p className="font-medium text-purple-900 mb-1">🔍 Verify in Email Wizard:</p>
            <p className="text-purple-800">
              Wait 2-3 minutes, then click <strong>"Verify Domain"</strong> in Email Wizard. 
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
            href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple hover:text-gold transition-colors"
          >
            <ExternalLink size={14} />
            AWS Route 53: Creating Records
          </a>
          <br />
          <a
            href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple hover:text-gold transition-colors"
          >
            <ExternalLink size={14} />
            AWS Route 53: Supported Record Types
          </a>
        </div>
      </div>
    </div>
  );
}