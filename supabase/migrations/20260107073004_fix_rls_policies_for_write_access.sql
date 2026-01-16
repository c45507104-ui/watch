/*
  # Fix RLS Policies for Write Access

  1. Changes
    - Drop existing RLS policies that only allow SELECT
    - Create new policies allowing INSERT and UPDATE for public monitoring
    - Keep SELECT open for all users

  2. Security Note
    - This is a public monitoring dashboard
    - Any user can add monitoring data (packets/threats/analytics)
    - All data is readable by anyone
*/

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read access to packets" ON packets;
  DROP POLICY IF EXISTS "Public read access to threats" ON threats;
  DROP POLICY IF EXISTS "Public read access to analytics" ON analytics;
END $$;

CREATE POLICY "Allow all select on packets"
  ON packets FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert on packets"
  ON packets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update on packets"
  ON packets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all select on threats"
  ON threats FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert on threats"
  ON threats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update on threats"
  ON threats FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all select on analytics"
  ON analytics FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert on analytics"
  ON analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update on analytics"
  ON analytics FOR UPDATE
  USING (true)
  WITH CHECK (true);
