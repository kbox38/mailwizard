/**
 * ============================================================================
 * Verification Status Component
 * ============================================================================
 * 
 * Purpose: Display verification status with appropriate badge styling
 * 
 * Features:
 * - Color-coded status badges
 * - Icon indicators
 * - Status message
 * - Last verified timestamp
 * 
 * Props:
 * - status: Verification status ('pending' | 'verified' | 'failed')
 * - lastVerified: Last verification timestamp
 * 
 * ============================================================================
 */

import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface VerificationStatusProps {
  status: 'pending' | 'verified' | 'failed';
  lastVerified: string | null;
}

/**
 * Verification Status Badge Component
 */
export default function VerificationStatus({ status, lastVerified }: VerificationStatusProps) {
  // Get status configuration
  const config = getStatusConfig(status);

  return (
    <div className="inline-flex items-center gap-2">
      {/* Status Badge */}
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <config.Icon className="w-4 h-4" />
        {config.label}
      </span>
    </div>
  );
}

/**
 * Gets configuration for each status type
 */
function getStatusConfig(status: 'pending' | 'verified' | 'failed') {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified',
        Icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border border-green-200'
      };
    
    case 'pending':
      return {
        label: 'Pending Verification',
        Icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      };
    
    case 'failed':
      return {
        label: 'Verification Failed',
        Icon: XCircle,
        className: 'bg-red-100 text-red-800 border border-red-200'
      };
    
    default:
      return {
        label: 'Unknown',
        Icon: AlertTriangle,
        className: 'bg-gray-100 text-gray-800 border border-gray-200'
      };
  }
}
