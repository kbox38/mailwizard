/**
 * Edit Campaign Modal
 * 
 * Allows editing scheduled campaign details before send time
 */

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  preview_text: string;
  scheduled_at: string | null;
}

interface EditCampaignModalProps {
  campaign: Campaign;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCampaignModal({ campaign, onClose, onSuccess }: EditCampaignModalProps) {
  const [formData, setFormData] = useState({
    name: campaign.name,
    subject: campaign.subject,
    preview_text: campaign.preview_text || '',
    scheduled_date: '',
    scheduled_time: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (campaign.scheduled_at) {
      const date = new Date(campaign.scheduled_at);
      setFormData(prev => ({
        ...prev,
        scheduled_date: date.toISOString().split('T')[0],
        scheduled_time: date.toTimeString().slice(0, 5),
      }));
    }
  }, [campaign.scheduled_at]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject line is required';
    }
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Schedule date is required';
    }
    if (!formData.scheduled_time) {
      newErrors.scheduled_time = 'Schedule time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const scheduled_at = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);

      const { error } = await supabase
        .from('campaigns')
        .update({
          name: formData.name,
          subject: formData.subject,
          preview_text: formData.preview_text,
          scheduled_at: scheduled_at.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      if (error) throw error;

      toast.success('Campaign updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update campaign:', error);
      toast.error(error.message || 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold">Edit Campaign</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={saving}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              placeholder="Enter campaign name"
            />
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-sm font-medium mb-2">Subject Line</label>
            <Input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              error={errors.subject}
              placeholder="Enter subject line"
            />
          </div>

          {/* Preview Text */}
          <div>
            <label className="block text-sm font-medium mb-2">Preview Text (Optional)</label>
            <Input
              type="text"
              value={formData.preview_text}
              onChange={(e) => setFormData({ ...formData, preview_text: e.target.value })}
              placeholder="Enter preview text"
            />
          </div>

          {/* Schedule Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Schedule Date</label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                min={minDate}
                error={errors.scheduled_date}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Schedule Time</label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                error={errors.scheduled_time}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
            icon={Save}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}