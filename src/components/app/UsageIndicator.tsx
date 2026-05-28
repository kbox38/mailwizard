/**
 * USAGE INDICATOR COMPONENT
 * 
 * Displays user's email usage for the current month with a visual progress bar.
 * Shows quota limits and warns when approaching limit.
 */

import React from 'react';
import { usePlanLimits, useUsageMetrics } from '../../hooks/usePlanLimits';
import { AlertTriangle } from 'lucide-react';

export const UsageIndicator: React.FC = () => {
  const { limits, currentPlan, isUnlimited } = usePlanLimits();
  const { usage, isLoading } = useUsageMetrics();

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const emailLimit = limits.emails_per_month;
  const emailsSent = usage.emails_sent;
  const isUnlimitedPlan = emailLimit === -1;

  // Calculate percentage
  const percentage = isUnlimitedPlan ? 0 : Math.min((emailsSent / emailLimit) * 100, 100);

  // Determine color based on usage
  const getProgressColor = () => {
    if (isUnlimitedPlan) return 'bg-gold';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-gold';
  };

  const getTextColor = () => {
    if (isUnlimitedPlan) return 'text-gold';
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-gray-700';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Email Usage This Month</h3>
        {!isUnlimitedPlan && percentage >= 90 && (
          <AlertTriangle size={16} className="text-red-500" />
        )}
      </div>

      {/* Progress Bar */}
      {!isUnlimitedPlan && (
        <div className="mb-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Usage Text */}
      <div className={`text-sm ${getTextColor()}`}>
        {isUnlimitedPlan ? (
          <div className="flex items-center gap-2">
            <span className="font-bold">Unlimited</span>
            <span className="text-gray-500">• {emailsSent.toLocaleString()} sent this month</span>
          </div>
        ) : (
          <div>
            <span className="font-bold">{emailsSent.toLocaleString()}</span>
            <span className="text-gray-600"> / {emailLimit.toLocaleString()} emails</span>
            <span className="text-gray-500 ml-2">({percentage.toFixed(0)}% used)</span>
          </div>
        )}
      </div>

      {/* Warning Messages */}
      {!isUnlimitedPlan && percentage >= 90 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>Warning:</strong> You're approaching your monthly limit.{' '}
          <a href="/app/settings?tab=billing" className="underline font-medium">
            Upgrade your plan
          </a>{' '}
          to send more emails.
        </div>
      )}

      {!isUnlimitedPlan && percentage >= 75 && percentage < 90 && (
        <div className="mt-3 text-xs text-gray-600">
          Consider{' '}
          <a href="/app/settings?tab=billing" className="text-gold underline font-medium">
            upgrading your plan
          </a>{' '}
          to avoid hitting your limit.
        </div>
      )}
    </div>
  );
};
