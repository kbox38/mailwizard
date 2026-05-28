/**
 * LiveEmailPreview
 *
 * Renders email sections as interactive React elements (not an iframe).
 * Clicking a section in the preview selects it and jumps the editor panel
 * to that section. Supports desktop/mobile width toggle and fullscreen.
 */

import { useState, type ReactNode } from 'react';
import { Maximize2, Minimize2, Monitor, Smartphone } from 'lucide-react';

export interface PreviewSection {
  id: string;
  type: string;
  content: Record<string, any>;
}

export interface PreviewSettings {
  companyName: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  fontFamily: string;
}

interface LiveEmailPreviewProps {
  sections: PreviewSection[];
  settings: PreviewSettings;
  activeSectionId: string | null;
  onSelectSection: (id: string) => void;
}

// ─── Section renderers ────────────────────────────────────────────────────────

function renderSection(
  section: PreviewSection,
  settings: PreviewSettings
): ReactNode {
  const fontFamily = settings.fontFamily || 'DM Sans, sans-serif';
  const textColor = settings.textColor || '#333333';

  switch (section.type) {
    case 'header':
      return (
        <div style={{ padding: '40px 40px 24px', textAlign: 'center' }}>
          <h1 style={{
            margin: '0 0 10px',
            color: textColor,
            fontSize: '28px',
            fontWeight: '800',
            fontFamily,
            lineHeight: 1.25,
          }}>
            {section.content.title || 'Your Heading Here'}
          </h1>
          {section.content.subtitle && (
            <p style={{ margin: 0, color: '#666', fontSize: '16px', fontFamily }}>
              {section.content.subtitle}
            </p>
          )}
        </div>
      );

    case 'text':
      return (
        <div style={{ padding: '16px 40px' }}>
          <div style={{
            color: textColor,
            fontSize: '15px',
            lineHeight: 1.75,
            fontFamily,
            whiteSpace: 'pre-wrap',
          }}>
            {section.content.text || ''}
          </div>
        </div>
      );

    case 'image':
      if (!section.content.imageUrl) {
        return (
          <div style={{ padding: '20px 40px', textAlign: 'center' }}>
            <div style={{
              background: '#f3f4f6',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '40px 20px',
              color: '#9ca3af',
              fontSize: '14px',
              fontFamily,
            }}>
              📷 No image — click to add one
            </div>
          </div>
        );
      }
      // Keep the image inside its column so the right edge is never clipped in the
      // narrow mobile canvas. A fixed display size (e.g. 600px) becomes an upper
      // bound the image shrinks below on small screens — matching how the sent
      // email's responsive <style> behaves. width:100% is safe here (preview runs
      // in a browser, not an email client).
      const imw = section.content.imageMaxWidth || '100%';
      const sizedToContainer = imw !== 'none' && imw !== '100%';
      return (
        <div style={{
          padding: '16px 40px',
          textAlign: (section.content.imageAlign || 'center') as any,
        }}>
          <img
            src={section.content.imageUrl}
            alt={section.content.imageAlt || ''}
            style={{
              width: sizedToContainer ? '100%' : 'auto',
              maxWidth: sizedToContainer ? imw : '100%',
              height: 'auto',
              borderRadius: '8px',
              display: 'inline-block',
            }}
          />
          {section.content.caption && (
            <p style={{
              color: '#6b7280',
              fontSize: '13px',
              fontStyle: 'italic',
              margin: '8px 0 0',
              fontFamily,
              textAlign: 'center',
            }}>
              {section.content.caption}
            </p>
          )}
        </div>
      );

    case 'button':
      return (
        <div style={{ padding: '28px 40px', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block',
            backgroundColor: section.content.buttonColor || settings.linkColor || '#f3ba42',
            color: '#000',
            padding: '14px 36px',
            borderRadius: '50px',
            border: '2px solid #000',
            fontWeight: '700',
            fontSize: '15px',
            fontFamily,
            userSelect: 'none',
          }}>
            {section.content.buttonText || 'Click Here'}
          </span>
        </div>
      );

    case 'divider':
      return (
        <div style={{ padding: '12px 40px' }}>
          <div style={{
            borderTop: `2px solid ${section.content.dividerColor || '#e5e7eb'}`,
          }} />
        </div>
      );

    case 'footer':
      return (
        <div style={{
          padding: '28px 40px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
        }}>
          {(section.content.companyName || settings.companyName) && (
            <p style={{ margin: '0 0 6px', color: '#6b7280', fontSize: '13px', fontFamily }}>
              {section.content.companyName || settings.companyName}
            </p>
          )}
          {section.content.address && (
            <p style={{ margin: '0 0 6px', color: '#9ca3af', fontSize: '11px', fontFamily }}>
              {section.content.address}
            </p>
          )}
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '11px', fontFamily }}>
            <span style={{ textDecoration: 'underline' }}>Unsubscribe</span>
            {' · '}
            <span style={{ textDecoration: 'underline' }}>View in browser</span>
          </p>
        </div>
      );

    default:
      return (
        <div style={{ padding: '12px 40px', color: '#9ca3af', fontFamily, fontSize: '13px' }}>
          [{section.type} section]
        </div>
      );
  }
}

// ─── Section label used in hover badge ───────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  header: 'Header',
  text: 'Text',
  image: 'Image',
  button: 'Button',
  divider: 'Divider',
  footer: 'Footer',
};

// ─── EmailCanvas ─────────────────────────────────────────────────────────────

function EmailCanvas({
  sections,
  settings,
  activeSectionId,
  onSelectSection,
  isMobileView,
  padded,
}: {
  sections: PreviewSection[];
  settings: PreviewSettings;
  activeSectionId: string | null;
  onSelectSection: (id: string) => void;
  isMobileView: boolean;
  padded: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const emailWidth = isMobileView ? 375 : 600;

  return (
    <div
      style={{
        backgroundColor: settings.backgroundColor || '#ffffff',
        minHeight: '100%',
        padding: padded ? '32px 16px' : '0',
      }}
    >
      <div
        style={{
          maxWidth: `${emailWidth}px`,
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: padded ? '8px' : '0',
          overflow: 'hidden',
          boxShadow: padded ? '0 8px 40px rgba(0,0,0,0.14)' : 'none',
        }}
      >
        {sections.length === 0 ? (
          <div style={{
            padding: '60px 32px',
            textAlign: 'center',
            color: '#9ca3af',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✉️</div>
            <p style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 6px', color: '#6b7280' }}>
              Your email preview appears here
            </p>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Add sections from the left panel to get started
            </p>
          </div>
        ) : (
          sections.map((section) => {
            const isActive = activeSectionId === section.id;
            const isHovered = hoveredId === section.id;
            const highlight = isActive || isHovered;

            return (
              <div
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                onMouseEnter={() => setHoveredId(section.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  outline: isActive
                    ? '2.5px solid #7c3aed'
                    : isHovered
                    ? '2.5px solid #a78bfa'
                    : '2.5px solid transparent',
                  outlineOffset: '-2px',
                  transition: 'outline-color 0.12s ease',
                }}
              >
                {renderSection(section, settings)}

                {/* Hover / active badge */}
                {highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      backgroundColor: isActive ? '#7c3aed' : '#8b5cf6',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      pointerEvents: 'none',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    {isActive
                      ? `✏️ Editing — ${SECTION_LABELS[section.type] ?? section.type}`
                      : `Click to edit ${SECTION_LABELS[section.type] ?? section.type}`}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LiveEmailPreview({
  sections,
  settings,
  activeSectionId,
  onSelectSection,
}: LiveEmailPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // ── Fullscreen overlay ──────────────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col" style={{ fontFamily: 'DM Sans, sans-serif' }}>
        {/* Fullscreen toolbar */}
        <div className="bg-white border-b-2 border-black px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700 mr-2">Preview</span>
            <button
              onClick={() => setIsMobileView(false)}
              title="Desktop view"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                !isMobileView
                  ? 'bg-purple text-white border-purple'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Monitor size={15} /> Desktop
            </button>
            <button
              onClick={() => setIsMobileView(true)}
              title="Mobile view"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                isMobileView
                  ? 'bg-purple text-white border-purple'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Smartphone size={15} /> Mobile
            </button>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-300"
          >
            <Minimize2 size={15} /> Exit Fullscreen
          </button>
        </div>

        {/* Scrollable preview area */}
        <div className="flex-1 overflow-auto">
          <EmailCanvas
            sections={sections}
            settings={settings}
            activeSectionId={activeSectionId}
            onSelectSection={onSelectSection}
            isMobileView={isMobileView}
            padded
          />
        </div>
      </div>
    );
  }

  // ── Normal embedded panel ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 bg-white border-b-2 border-black"
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-semibold text-gray-700">Live Preview</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMobileView(false)}
            title="Desktop view"
            className={`p-1.5 rounded-lg transition-colors ${
              !isMobileView ? 'bg-purple text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Monitor size={15} />
          </button>
          <button
            onClick={() => setIsMobileView(true)}
            title="Mobile view"
            className={`p-1.5 rounded-lg transition-colors ${
              isMobileView ? 'bg-purple text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Smartphone size={15} />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            onClick={() => setIsFullscreen(true)}
            title="Fullscreen preview"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* Preview scroll area */}
      <div className="flex-1 overflow-auto bg-gray-200">
        <EmailCanvas
          sections={sections}
          settings={settings}
          activeSectionId={activeSectionId}
          onSelectSection={onSelectSection}
          isMobileView={isMobileView}
          padded
        />
      </div>
    </div>
  );
}
