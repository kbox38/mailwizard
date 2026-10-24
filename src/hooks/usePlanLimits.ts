import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_LIMITS, PlanFeatures, planHasFeature, getMinimumPlanForFeature } from '../config/planLimits';
import { AccountPlan, effectivePlan } from '../lib/platformAccess';

export type PlanType = AccountPlan;
export function usePlanLimits() {
  const { profile, loading: isLoading, hasAccess } = useAuth();
  const currentPlan = effectivePlan(profile);
  const limits = PLAN_LIMITS[hasAccess ? currentPlan : 'none'];
  const getRequiredPlan = (feature: keyof PlanFeatures) => getMinimumPlanForFeature(feature);
  return {
    profile, currentPlan, limits, isLoading,
    hasFeature: (feature: keyof PlanFeatures) => hasAccess && planHasFeature(currentPlan, feature),
    getLimit: (feature: keyof PlanFeatures) => limits[feature],
    isUnlimited: (feature: keyof PlanFeatures) => limits[feature] === -1,
    getRequiredPlan,
    canPerformAction: (feature: keyof PlanFeatures, usage: number): { allowed: boolean; reason?: string } => {
      if (!hasAccess) return { allowed: false, reason: 'An active subscription is required.' };
      const limit = limits[feature];
      if (typeof limit === 'boolean') return { allowed: limit, reason: limit ? undefined : `This feature requires the ${getRequiredPlan(feature)} plan.` };
      return limit === -1 || usage < limit ? { allowed: true } : { allowed: false, reason: `You have reached your limit of ${limit}.` };
    },
    isPaidPlan: currentPlan !== 'none',
    isSubscriptionActive: hasAccess,
  };
}
export function useUsageMetrics() {
  const { user } = useAuth();
  const [usage,setUsage]=useState({ emails_sent:0,storage_used:0 });
  const [isLoading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    if (!user) {setUsage({emails_sent:0,storage_used:0});setLoading(false);return;}
    setLoading(true);
    const now=new Date();
    supabase.from('usage_metrics').select('emails_sent,storage_used').eq('user_id',user.id)
      .eq('month',now.getMonth()+1).eq('year',now.getFullYear()).maybeSingle().then(({data,error})=>{
        if(active){if(error)console.error('Unable to load usage',error);setUsage(data||{emails_sent:0,storage_used:0});setLoading(false);}
      });
    return()=>{active=false;};
  },[user?.id]);
  return {usage,isLoading};
}
