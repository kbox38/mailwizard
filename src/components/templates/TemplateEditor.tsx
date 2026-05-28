/**
 * TemplateEditor — Split-pane email template builder
 *
 * Left panel  : section editor (drag-drop, inline editing)
 * Right panel : live interactive preview (click section → jumps editor)
 *
 * The preview updates in real time as the user edits. Clicking any section
 * in the preview selects it and scrolls the left panel to it.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Check,
  Palette,
  Settings2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import SectionEditor from './SectionEditor';
import type { Section } from './SectionEditor';
import LiveEmailPreview from './LiveEmailPreview';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { EMAIL_TEMPLATES } from '../../data/emailTemplates';

interface TemplateSettings {
  companyName: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  fontFamily: string;
}

const DEFAULT_SETTINGS: TemplateSettings = {
  companyName: 'Your Company',
  backgroundColor: '#ffffff',
  textColor: '#000000',
  linkColor: '#f3ba42',
  fontFamily: "'DM Sans', sans-serif",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m] ?? m)
  );
}

interface TemplateEditorProps {
  mode?: 'create' | 'edit';
  existingTemplate?: any;
  onSave?: (sections: Section[], settings: any, html: string) => void;
  onCancel?: () => void;
}

export default function TemplateEditor({
  mode = 'create',
  existingTemplate,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();

  const returnToCampaign = searchParams.get('returnToCampaign') === 'true';
  const templateId = searchParams.get('templateId');

  const [templateName, setTemplateName] = useState(existingTemplate?.name || 'Untitled Template');
  const [templateCategory, setTemplateCategory] = useState(existingTemplate?.category || 'marketing');
  const [sections, setSections] = useState<Section[]>(existingTemplate?.content?.sections || []);
  const [settings, setSettings] = useState<TemplateSettings>(
    existingTemplate?.content?.settings || DEFAULT_SETTINGS
  );
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // ── Load template if templateId is provided via URL ───────────────────────
  useEffect(() => {
    if (templateId && !existingTemplate) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  // ── Load template from navigation state (from Templates page) ─────────────
  useEffect(() => {
    if (location.state?.template && location.state?.mode === 'edit') {
      const { template, returnUrl } = location.state;
      setTemplateName(template.name);
      setTemplateCategory(template.category || 'marketing');
      setSections(template.content?.sections || []);
      setSettings(template.content?.settings || DEFAULT_SETTINGS);
      if (returnUrl) sessionStorage.setItem('editorReturnUrl', returnUrl);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  async function loadTemplate(id: string) {
    setLoading(true);
    try {
      const system = EMAIL_TEMPLATES.find((t) => t.id === id);
      if (system) {
        setTemplateName(system.name);
        setTemplateCategory(system.category || 'marketing');
        setSections(system.content?.sections || []);
        setSettings(system.content?.settings || DEFAULT_SETTINGS);
        return;
      }
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setTemplateName(data.name);
      setTemplateCategory(data.category || 'marketing');
      setSections(data.content?.sections || []);
      setSettings(data.content?.settings || DEFAULT_SETTINGS);
    } catch (err: any) {
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  }

  // ── HTML generation (same logic as before) ────────────────────────────────
  function generateHTML(): string {
    let sectionsHTML = '';
    sections.forEach((section) => {
      switch (section.type) {
        case 'header':
          sectionsHTML += '<tr><td style="padding: 40px 40px 20px 40px; text-align: center;"><h1 style="margin: 0 0 10px 0; color: ' + settings.textColor + '; font-size: 32px; font-weight: bold; font-family: ' + settings.fontFamily + ';">' + escapeHtml(section.content.title || '') + '</h1>';
          if (section.content.subtitle) sectionsHTML += '<p style="margin: 0; color: #666666; font-size: 18px; font-family: ' + settings.fontFamily + ';">' + escapeHtml(section.content.subtitle) + '</p>';
          sectionsHTML += '</td></tr>';
          break;
        case 'text':
          sectionsHTML += '<tr><td style="padding: 20px 40px;"><div style="color: ' + settings.textColor + '; font-size: 16px; line-height: 1.6; font-family: ' + settings.fontFamily + '; white-space: pre-wrap;">' + escapeHtml(section.content.text || '') + '</div></td></tr>';
          break;
        case 'image':
          if (section.content.imageUrl) {
            const imw = section.content.imageMaxWidth || '100%';
            const ia = section.content.imageAlign || 'center';
            let alignStyle = 'margin: 0 auto;';
            if (ia === 'left') alignStyle = 'margin: 0 auto 0 0;';
            if (ia === 'right') alignStyle = 'margin: 0 0 0 auto;';
            // Always keep the image inside its column so it can't overflow or get
            // clipped on phones. A fixed size (200/400/600px) acts as an upper bound
            // that the fluid width:100% shrinks below on narrow screens; "original"
            // and the default stay at natural size but never exceed the column.
            const sizeStyle = (imw === 'none' || imw === '100%')
              ? 'width: auto; max-width: 100%;'
              : 'width: 100%; max-width: ' + imw + ';';
            let imgStyle = 'height: auto; display: block; border-radius: 8px; border: 0; ' + sizeStyle + ' ' + alignStyle;
            const ca = ia === 'left' ? 'left' : ia === 'right' ? 'right' : 'center';
            sectionsHTML += '<tr><td style="padding: 20px 40px; text-align: ' + ca + ';"><img src="' + escapeHtml(section.content.imageUrl) + '" alt="' + escapeHtml(section.content.imageAlt || 'Image') + '" style="' + imgStyle + '">';
            if (section.content.caption) sectionsHTML += '<p style="margin: 10px 0 0 0; color: #666666; font-size: 14px; text-align: ' + ca + '; font-style: italic; font-family: ' + settings.fontFamily + ';">' + escapeHtml(section.content.caption) + '</p>';
            sectionsHTML += '</td></tr>';
          }
          break;
        case 'button':
          sectionsHTML += '<tr><td style="padding: 30px 40px; text-align: center;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;"><tr><td style="background-color: ' + (section.content.buttonColor || settings.linkColor) + '; border: 2px solid #000000; border-radius: 50px; padding: 14px 32px;"><a href="' + escapeHtml(section.content.buttonUrl || '#') + '" style="display: inline-block; color: #000000; text-decoration: none; font-weight: bold; font-size: 16px; font-family: ' + settings.fontFamily + ';">' + escapeHtml(section.content.buttonText || 'Click Here') + '</a></td></tr></table></td></tr>';
          break;
        case 'divider':
          sectionsHTML += '<tr><td style="padding: 20px 40px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="border-top: 2px solid ' + (section.content.dividerColor || '#E5E7EB') + '; font-size: 0; line-height: 0;">&nbsp;</td></tr></table></td></tr>';
          break;
        case 'footer':
          sectionsHTML += '<tr><td style="padding: 40px; text-align: center; background-color: #f9fafb;"><p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; font-family: ' + settings.fontFamily + ';">' + escapeHtml(section.content.companyName || settings.companyName) + '</p>';
          if (section.content.address) sectionsHTML += '<p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; font-family: ' + settings.fontFamily + ';">' + escapeHtml(section.content.address) + '</p>';
          sectionsHTML += '<p style="margin: 0; color: #999999; font-size: 11px; font-family: ' + settings.fontFamily + ';"><a href="{{UNSUBSCRIBE_URL}}" style="color: #999999; text-decoration: underline;">Unsubscribe</a></p></td></tr>';
          break;
      }
    });
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + escapeHtml(templateName) + '</title></head><body style="margin:0;padding:0;background-color:' + settings.backgroundColor + ';"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:' + settings.backgroundColor + ';"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;">' + sectionsHTML + '</table></td></tr></table></body></html>';
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (returnToCampaign) {
      const html = generateHTML();
      sessionStorage.setItem('editedTemplate', JSON.stringify({
        html,
        content: { sections, settings, html },
        templateId: templateId || existingTemplate?.id,
        name: templateName,
        timestamp: Date.now(),
      }));
      toast.success('Template saved! Returning to campaign...');
      navigate('/app/campaigns?resumeCampaign=true');
      return;
    }
    if (!user) { toast.error('You must be logged in'); return; }
    try {
      setSaving(true);
      const html = generateHTML();
      const payload = {
        user_id: user.id,
        name: templateName,
        category: templateCategory,
        content: { sections, settings, html },
      };
      const isValidEdit =
        mode === 'edit' &&
        existingTemplate?.id &&
        !existingTemplate.is_locked &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingTemplate.id);

      if (isValidEdit) {
        const { error } = await supabase.from('templates').update(payload).eq('id', existingTemplate.id);
        if (error) throw error;
        toast.success('Template updated!');
      } else {
        const { error } = await supabase.from('templates').insert([payload]);
        if (error) throw error;
        toast.success('Template created!');
      }
      if (onSave) onSave(sections, settings, html);
      else navigate('/app/templates');
    } catch (err: any) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (returnToCampaign) { navigate('/app/campaigns'); return; }
    if (onCancel) onCancel();
    else navigate('/app/templates');
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading template…</p>
        </div>
      </div>
    );
  }

  // ── Full layout ───────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* ── Top bar ── */}
      <div className="bg-white border-b-2 border-black flex-shrink-0 z-20">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: back + name */}
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={handleCancel}>
              {returnToCampaign ? 'Cancel' : 'Back'}
            </Button>
            <div className="min-w-0">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-lg font-bold border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-purple rounded px-1 py-0.5 w-64 truncate"
                placeholder="Template name"
              />
              {returnToCampaign && (
                <p className="text-xs text-gray-400 mt-0.5 px-1">For campaign creation</p>
              )}
            </div>
          </div>

          {/* Right: save */}
          <Button
            variant="primary"
            size="sm"
            icon={returnToCampaign ? Check : Save}
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            {returnToCampaign ? 'Use This Template' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* ── Main split-pane ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left panel — editor */}
        <div
          className="flex flex-col border-r-2 border-black bg-white flex-shrink-0 overflow-hidden"
          style={{ width: '420px' }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-gray-50 flex-shrink-0">
            <span className="text-sm font-bold text-gray-700">
              Sections
              {sections.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  ({sections.length})
                </span>
              )}
            </span>
            <button
              onClick={() => setShowSettings((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                showSettings
                  ? 'bg-purple text-white border-purple'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Settings2 size={13} />
              Style
              {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* Settings panel (collapsible) */}
          {showSettings && (
            <div className="border-b-2 border-black bg-white p-4 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Palette size={15} className="text-purple" />
                <span className="text-sm font-semibold text-gray-700">Template Style</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                  <Input
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    placeholder="Your Company"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['Background', 'backgroundColor'],
                    ['Text', 'textColor'],
                    ['Accent', 'linkColor'],
                  ] as const).map(([label, key]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={settings[key]}
                          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                          className="w-8 h-8 border-2 border-black rounded cursor-pointer p-0"
                        />
                        <input
                          type="text"
                          value={settings[key]}
                          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                          className="flex-1 text-xs px-2 py-1.5 border-2 border-black rounded focus:outline-none focus:ring-1 focus:ring-purple font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                    className="w-full text-sm px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
                  >
                    <option value="'DM Sans', sans-serif">DM Sans</option>
                    <option value="'DM Serif Display', serif">DM Serif Display</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full text-sm px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="events">Events</option>
                    <option value="transactional">Transactional</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="promotional">Promotional</option>
                    <option value="basic">Basic</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Sections list */}
          <div className="flex-1 overflow-y-auto p-4">
            <SectionEditor
              sections={sections}
              onChange={setSections}
              activeSectionId={activeSectionId}
              onActiveSectionChange={setActiveSectionId}
            />
          </div>
        </div>

        {/* Right panel — live preview */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <LiveEmailPreview
            sections={sections}
            settings={settings}
            activeSectionId={activeSectionId}
            onSelectSection={setActiveSectionId}
          />
        </div>

      </div>
    </div>
  );
}
