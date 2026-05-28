/**
 * PLAN LIMITS HOOK
 * 
 * Custom React hook for checking user's plan limits and feature access.
 * Provides utilities for plan gating and upgrade prompting.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PLAN_LIMITS, PlanFeatures, planHasFeature, getMinimumPlanForFeature } from '../config/planLimits';

export type PlanType = 'free' | 'pro' | 'pro_plus';

interface Profile {
  id: string;
  plan_type: PlanType;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

/**
 * Custom hook for plan limits and feature access
 */
export function usePlanLimits() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, plan_type, subscription_status, stripe_customer_id, stripe_subscription_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const currentPlan: PlanType = profile?.plan_type || 'free';
  const limits = PLAN_LIMITS[currentPlan];

  /**
   * Check if user has access to a specific feature
   */
  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    return planHasFeature(currentPlan, feature);
  };

  /**
   * Get the limit value for a specific feature
   */
  const getLimit = (feature: keyof PlanFeatures): number | boolean => {
    return limits[feature];
  };

  /**
   * Check if a limit is unlimited (-1)
   */
  const isUnlimited = (feature: keyof PlanFeatures): boolean => {
    const limit = limits[feature];
    return typeof limit === 'number' && limit === -1;
  };

  /**
   * Get minimum plan required for a feature
   */
  const getRequiredPlan = (feature: keyof PlanFeatures): 'pro' | 'pro_plus' => {
    return getMinimumPlanForFeature(feature);
  };

  /**
   * Check if user can perform an action based on current usage
   */
  const canPerformAction = (
    feature: keyof PlanFeatures,
    currentUsage: number
  ): { allowed: boolean; reason?: string } => {
    const limit = limits[feature];

    // Boolean features
    if (typeof limit === 'boolean') {
      return {
        allowed: limit,
        reason: limit ? undefined : `This feature requires ${getRequiredPlan(feature)} plan`,
      };
    }

    // Numeric limits
    if (limit === -1) {
      return { allowed: true }; // Unlimited
    }

    if (currentUsage >= limit) {
      return {
        allowed: false,
        reason: `You've reached your limit of ${limit}. Upgrade to increase your limit.`,
      };
    }

    return { allowed: true };
  };

  /**
   * Check if user is on a paid plan
   */
  const isPaidPlan = currentPlan !== 'free';

  /**
   * Check if subscription is active
   */
  const isSubscriptionActive = profile?.subscription_status === 'active';

  return {
    profile,
    currentPlan,
    limits,
    isLoading,
    hasFeature,
    getLimit,
    isUnlimited,
    getRequiredPlan,
    canPerformAction,
    isPaidPlan,
    isSubscriptionActive,
  };
}

/**
 * Hook for fetching usage metrics
 */
export function useUsageMetrics() {
  const [usage, setUsage] = useState({ emails_sent: 0, storage_used: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const { data, error } = await supabase
        .from('usage_metrics')
        .select('emails_sent, storage_used')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching usage:', error);
      } else {
        setUsage(data || { emails_sent: 0, storage_used: 0 });
      }
    } catch (error) {
      console.error('Error in fetchUsage:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    usage,
    isLoading,
  };
}