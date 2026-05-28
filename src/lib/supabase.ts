import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  plan_type: 'free' | 'pro' | 'pro_plus';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};
