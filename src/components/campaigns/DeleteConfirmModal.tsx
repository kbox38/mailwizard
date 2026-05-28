/**
 * Delete Confirm Modal
 * 
 * Confirmation dialog for deleting scheduled campaigns
 */

import { AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface Campaign {
  id: string;
  name: string;
  subject: string;
}

interface DeleteConfirmModalProps {
  campaign: Campaign;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmModal({ 
  campaign, 
  onClose, 
  onConfirm, 
  isDeleting 
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <h2 className="text-xl font-serif font-bold">Delete Campaign?</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isDeleting}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this scheduled campaign? This action cannot be undone.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <span className="text-sm text-gray-600">Campaign: </span>
              <span className="font-semibold">{campaign.name}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Subject: </span>
              <span className="text-sm">{campaign.subject}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={isDeleting}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            Delete Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}