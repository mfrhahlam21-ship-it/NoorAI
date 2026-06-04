import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'https://your-project.supabase.co' &&
  SUPABASE_ANON_KEY !== 'your_anon_key_here');

if (!isConfigured) {
  console.warn('⚠️ Supabase credentials not properly configured. Auth features will be limited.');
}

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export const isSupabaseConfigured = isConfigured;

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_name: string;
  plan_type: 'trial' | 'monthly' | 'yearly' | 'free';
  start_date: string;
  end_date?: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type Device = {
  id: string;
  user_id: string;
  device_name?: string;
  device_os?: string;
  device_id?: string;
  last_login: string;
  created_at: string;
  is_active: boolean;
};

export type Payment = {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  payment_method?: string;
  payment_status: 'pending' | 'success' | 'failed' | 'refunded';
  transaction_id?: string;
  payment_date: string;
  created_at: string;
};
