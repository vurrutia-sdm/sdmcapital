-- ── Travel Guide ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS travel_guide (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lang text NOT NULL DEFAULT 'fr',
  section text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  sort_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE travel_guide ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users"
ON travel_guide FOR ALL TO authenticated
USING (true) WITH CHECK (true);
