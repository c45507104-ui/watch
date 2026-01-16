/*
  # Threat Intelligence Platform Schema

  1. New Tables
    - `packets`
      - `id` (uuid, primary key)
      - `source_ip` (text) - Source IP address
      - `dest_ip` (text) - Destination IP address
      - `source_port` (integer) - Source port
      - `dest_port` (integer) - Destination port
      - `protocol` (text) - Protocol type (TCP, UDP, ICMP, etc)
      - `size` (integer) - Packet size in bytes
      - `is_malicious` (boolean) - Whether packet is malicious
      - `threat_type` (text) - Type of threat if malicious
      - `country` (text) - Country of origin
      - `country_code` (text) - ISO country code
      - `latitude` (numeric) - Latitude for mapping
      - `longitude` (numeric) - Longitude for mapping
      - `captured_at` (timestamptz) - Capture timestamp

    - `threats`
      - `id` (uuid, primary key)
      - `ip_address` (text, unique) - Malicious IP address
      - `threat_types` (text[]) - Array of threat types
      - `severity` (text) - Threat severity level
      - `first_seen` (timestamptz) - First detection time
      - `last_seen` (timestamptz) - Last detection time
      - `count` (integer) - Number of detections
      - `country` (text) - Country location
      - `country_code` (text) - ISO country code
      - `reports` (text[]) - Threat intelligence sources
      - `created_at` (timestamptz)

    - `analytics`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz) - Analytics snapshot time
      - `total_packets` (integer) - Total packets processed
      - `malicious_packets` (integer) - Malicious packets found
      - `unique_threats` (integer) - Unique threat IPs
      - `top_countries` (jsonb) - Top threat countries
      - `top_threats` (jsonb) - Top threat types
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (this is a monitoring dashboard)
*/

CREATE TABLE IF NOT EXISTS packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ip text NOT NULL,
  dest_ip text NOT NULL,
  source_port integer NOT NULL,
  dest_port integer NOT NULL,
  protocol text NOT NULL,
  size integer NOT NULL DEFAULT 0,
  is_malicious boolean DEFAULT false,
  threat_type text,
  country text,
  country_code text,
  latitude numeric,
  longitude numeric,
  captured_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS threats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text UNIQUE NOT NULL,
  threat_types text[] DEFAULT '{}',
  severity text NOT NULL,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  count integer DEFAULT 1,
  country text,
  country_code text,
  reports text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  total_packets integer DEFAULT 0,
  malicious_packets integer DEFAULT 0,
  unique_threats integer DEFAULT 0,
  top_countries jsonb DEFAULT '[]',
  top_threats jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to packets"
  ON packets FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access to threats"
  ON threats FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access to analytics"
  ON analytics FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_packets_captured_at ON packets(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_packets_is_malicious ON packets(is_malicious);
CREATE INDEX IF NOT EXISTS idx_threats_ip_address ON threats(ip_address);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp DESC);