/**
 * Template Preview Component
 *
 * Renders exact HTML that will be sent, isolated in iframe
 * Replaces merge tags with sample data
 * Shows mobile/desktop preview toggle
 */

import { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { extractEditableFields, extractMergeFields } from '../../data/emailTemplates';
import { injectResponsiveStyles } from '../../utils/emailResponsive';
import { Button } from '../ui/Button';

interface TemplatePreviewProps {
  htmlContent: string;
  editableValues?: Record<string, string>;
  showDeviceToggle?: boolean;
}

// Sample data for merge fields
const SAMPLE_MERGE_DATA: Record<string, string> = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  company: 'Acme Corporation',
  role: 'Marketing Manager'
};

// Sample system values
const SAMPLE_SYSTEM_DATA: Record<string, string> = {
  UNSUBSCRIBE_URL: '#unsubscribe',
  VIEW_IN_BROWSER_URL: '#view-in-browser',
  FROM_EMAIL: 'hello@yourcompany.com',
  SUBJECT_LINE: 'Your Email Subject',
  COMPANY_NAME: 'Your Company'
};

export default function TemplatePreview({
  htmlContent,
  editableValues = {},
  showDeviceToggle = true
}: TemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  /**
   * Processes the HTML template with all merge tags and editable values
   */
  function processTemplate(): string {
    let processed = htmlContent;

    // Replace editable fields {{EDITABLE:field_name}}
    const editableFields = extractEditableFields(htmlContent);
    editableFields.forEach(field => {
      const value = editableValues[field] || `[${field}]`;
      const regex = new RegExp(`\\{\\{EDITABLE:${field}\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    });

    // Replace merge fields {{MERGE:field_name}}
    const mergeFields = extractMergeFields(htmlContent);
    mergeFields.forEach(field => {
      const value = SAMPLE_MERGE_DATA[field] || `{{${field}}}`;
      const regex = new RegExp(`\\{\\{MERGE:${field}\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    });

    // Replace system tags
    Object.keys(SAMPLE_SYSTEM_DATA).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, SAMPLE_SYSTEM_DATA[key]);
    });

    // Replace old format merge tags for backward compatibility
    processed = processed
      .replace(/\{\{firstname\}\}/gi, SAMPLE_MERGE_DATA.first_name)
      .replace(/\{\{lastname\}\}/gi, SAMPLE_MERGE_DATA.last_name)
      .replace(/\{\{company\}\}/gi, SAMPLE_MERGE_DATA.company)
      .replace(/\{\{role\}\}/gi, SAMPLE_MERGE_DATA.role)
      .replace(/\{\{email\}\}/gi, SAMPLE_MERGE_DATA.email);

    return processed;
  }

  // Inject the same responsive styles recipients get, so the mobile preview is faithful.
  const processedHtml = injectResponsiveStyles(processTemplate());

  // Iframe container width based on view mode
  const iframeWidth = viewMode === 'desktop' ? '100%' : '375px';

  return (
    <div className="card">
      {/* Header with device toggle */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-serif font-bold">Preview</h3>
        {showDeviceToggle && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'desktop' ? 'primary' : 'secondary'}
              size="sm"
              icon={Monitor}
              onClick={() => setViewMode('desktop')}
            >
              Desktop
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'primary' : 'secondary'}
              size="sm"
              icon={Smartphone}
              onClick={() => setViewMode('mobile')}
            >
              Mobile
            </Button>
          </div>
        )}
      </div>

      {/* Preview container */}
      <div className="bg-gray-100 rounded-lg p-4">
        <div
          className="mx-auto transition-all duration-300"
          style={{
            width: iframeWidth,
            maxWidth: '100%'
          }}
        >
          <iframe
            srcDoc={processedHtml}
            style={{
              width: '100%',
              height: '600px',
              border: '2px solid #000000',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}
            title="Email Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* Preview info */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-medium mb-2">Preview Info:</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Merge fields are shown with sample data (e.g., "John Doe")</li>
          <li>• Actual recipient data will be used when sending</li>
          <li>• Links are placeholders in preview mode</li>
          <li>• Some email clients may render slightly differently</li>
        </ul>
      </div>
    </div>
  );
}
