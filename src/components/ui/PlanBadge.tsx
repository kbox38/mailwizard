/**
 * PLAN BADGE COMPONENT
 * 
 * Displays the user's current subscription plan as a badge.
 * Used in headers, settings, and other UI locations to show plan status.
 */

import React from 'react';
import { usePlanLimits } from '../../hooks/usePlanLimits';

interface PlanBadgeProps {
  className?: string;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ className = '' }) => {
  const { currentPlan, isLoading } = usePlanLimits();

  if (isLoading) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-400 ${className}`}>
        Loading...
      </div>
    );
  }

  const badgeStyles = {
    free: 'bg-gray-100 text-gray-700 border border-gray-300',
    pro: 'bg-gold/10 text-gold border border-gold/30',
    pro_plus: 'bg-black text-white border border-black',
  };

  const badgeText = {
    free: 'FREE',
    pro: 'PRO',
    pro_plus: 'PRO+',
  };

  return (
    <div 
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${badgeStyles[currentPlan]} ${className}`}
    >
      {badgeText[currentPlan]}
    </div>
  );
};
