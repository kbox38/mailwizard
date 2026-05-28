/**
 * ============================================================================
 * DNS Record Row Component - UPDATED
 * ============================================================================
 * 
 * Displays a single DNS record with copy functionality
 * 
 * Updates:
 * - DMARC record highlighting with "Highly Recommended" badge
 * - Gold text color for DMARC (not white)
 * - No emoji in DMARC badge
 * - No verification status shown for DMARC
 * - Visual emphasis for optional but important records
 * - Improved copy-to-clipboard UI
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';

interface DNSRecord {
  type: string;
  host: string;
  value: string;
  ttl: number;
  valid?: boolean;
}

interface DNSInstruction {
  step: number;
  title: string;
  description: string;
  required: boolean;
  record: DNSRecord;
}

interface DNSRecordRowProps {
  instruction: DNSInstruction;
}

export default function DNSRecordRow({ instruction }: DNSRecordRowProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const { record } = instruction;
  const isDMARC = record.host.includes('_dmarc');
  const isDKIM = record.host.includes('_domainkey');
  const isSPF = record.type === 'TXT' && (record.host.includes('mail') || record.value.includes('spf'));

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return (
    <div className={`rounded-lg border-2 p-4 ${
      isDMARC 
        ? 'border-purple-300 bg-purple-50' 
        : instruction.required 
          ? 'border-red-200 bg-red-50' 
          : 'border-gray-200 bg-gray-50'
    }`}>
      {/* DMARC Badge - Gold text, no emoji */}
      {isDMARC && (
        <div className="mb-3 flex items-start gap-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-gold" />
          <div className="flex-1">
            <div className="font-bold text-sm mb-1 text-gold">Recommended: DMARC</div>
            <div className="text-xs text-gold opacity-90">
              Adding this record helps protect your domain from email spoofing.
            </div>
          </div>
        </div>
      )}

      {/* Record Details */}
      <div className="space-y-3">
        {/* Type */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">Type</label>
            <button
              onClick={() => copyToClipboard(record.type, 'type')}
              className="text-xs text-purple hover:text-gold flex items-center gap-1"
            >
              {copiedField === 'type' ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
          <code className="block bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono">
            {record.type}
          </code>
        </div>

        {/* Host */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">Host / Name</label>
            <button
              onClick={() => copyToClipboard(record.host, 'host')}
              className="text-xs text-purple hover:text-gold flex items-center gap-1"
            >
              {copiedField === 'host' ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
          <code className="block bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono break-all">
            {record.host}
          </code>
        </div>

        {/* Value */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">Value / Points To</label>
            <button
              onClick={() => copyToClipboard(record.value, 'value')}
              className="text-xs text-purple hover:text-gold flex items-center gap-1"
            >
              {copiedField === 'value' ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
          <code className="block bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono break-all max-h-32 overflow-y-auto">
            {record.value}
          </code>
          {isDKIM && (
            <p className="text-xs text-blue-700 mt-1">
              💡 Make sure to copy the entire key (200+ characters)
            </p>
          )}
          {isSPF && (
            <p className="text-xs text-green-700 mt-1">
              ✅ This authorizes SendGrid to send emails on your behalf
            </p>
          )}
          {isDMARC && (
            <p className="text-xs text-purple-700 mt-1">
              ⭐ This protects your domain from spoofing
            </p>
          )}
        </div>

        {/* TTL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">TTL</label>
            <button
              onClick={() => copyToClipboard(record.ttl.toString(), 'ttl')}
              className="text-xs text-purple hover:text-gold flex items-center gap-1"
            >
              {copiedField === 'ttl' ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
          <code className="block bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono">
            {record.ttl} seconds (or Automatic)
          </code>
        </div>
      </div>

      {/* Validation Status - Hidden for DMARC */}
      {!isDMARC && record.valid !== undefined && (
        <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${
          record.valid ? 'text-green-600' : 'text-red-600'
        }`}>
          {record.valid ? (
            <>
              <Check className="w-4 h-4" />
              Verified ✓
            </>
          ) : (
            <>
              <span className="w-4 h-4">⚠️</span>
              Not yet verified
            </>
          )}
        </div>
      )}
    </div>
  );
}