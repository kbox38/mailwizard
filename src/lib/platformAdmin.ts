import { supabase } from './supabase';
import type { AccountPlan } from './platformAccess';
export interface PlatformUser {
  id: string; email: string; full_name: string | null; plan_type: AccountPlan;
  subscription_status: string; admin_plan_override: AccountPlan | null;
  account_suspended: boolean; has_access: boolean; has_billing_subscription: boolean;
  is_admin: boolean; email_verified: boolean; last_sign_in_at: string | null;
  created_at: string; campaigns: number; contacts: number;
}
export interface AdminActivity {
  id: number; action: string; target_id: string | null; actor_email: string | null;
  details: { plan?: string; reason?: string }; created_at: string;
}
export interface PlatformOverview {
  users: number; active_users_30d: number; new_users_30d: number; paid_access: number;
  by_plan: Partial<Record<AccountPlan, number>>; campaigns: number; contacts: number;
  scheduled_campaigns: number; sending_campaigns: number; emails_this_month: number;
  checked_at: string; activity: AdminActivity[];
}
async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}
export const platformAdmin = {
  overview: () => rpc<PlatformOverview>('admin_overview'),
  users: (search: string, plan: string, page: number) => rpc<{ users: PlatformUser[]; total: number; page: number; total_pages: number }>('admin_users', { p_search: search, p_plan: plan, p_page: page }),
  setPlan: (id: string, plan: AccountPlan | 'billing', reason: string) => rpc<void>('admin_set_plan', { p_user_id: id, p_plan: plan, p_reason: reason }),
  setSuspended: (id: string, suspended: boolean, reason: string) => rpc<void>('admin_set_suspended', { p_user_id: id, p_suspended: suspended, p_reason: reason }),
};
