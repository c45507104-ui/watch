import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Packet {
  id: string;
  source_ip: string;
  dest_ip: string;
  source_port: number;
  dest_port: number;
  protocol: string;
  size: number;
  is_malicious: boolean;
  threat_type: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  captured_at: string;
}

export interface Threat {
  id: string;
  ip_address: string;
  threat_types: string[];
  severity: string;
  first_seen: string;
  last_seen: string;
  count: number;
  country: string | null;
  country_code: string | null;
  reports: string[];
  created_at: string;
}

export interface Analytics {
  id: string;
  timestamp: string;
  total_packets: number;
  malicious_packets: number;
  unique_threats: number;
  top_countries: { country: string; count: number }[];
  top_threats: { type: string; count: number }[];
  created_at: string;
}
