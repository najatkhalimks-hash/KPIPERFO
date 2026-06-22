-- ============================================================
-- GSMI Researcher Platform - Seed Data
-- Version: 1.0.0
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Academic years (2022 to 2027)
INSERT INTO public.academic_years (label, year_start, year_end, is_current) VALUES
  ('2022-2023', 2022, 2023, FALSE),
  ('2023-2024', 2023, 2024, FALSE),
  ('2024-2025', 2024, 2025, TRUE),
  ('2025-2026', 2025, 2026, FALSE),
  ('2026-2027', 2026, 2027, FALSE)
ON CONFLICT (label) DO NOTHING;

-- ============================================================
-- Storage bucket for researcher documents
-- Note: Run this in Supabase Dashboard > Storage or via CLI
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('researcher-docs', 'researcher-docs', FALSE)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their own folder
-- CREATE POLICY "docs_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
--   bucket_id = 'researcher-docs' AND (storage.foldername(name))[1] = auth.uid()::text
-- );
-- CREATE POLICY "docs_select" ON storage.objects FOR SELECT TO authenticated USING (
--   bucket_id = 'researcher-docs' AND (storage.foldername(name))[1] = auth.uid()::text
-- );
-- CREATE POLICY "docs_delete" ON storage.objects FOR DELETE TO authenticated USING (
--   bucket_id = 'researcher-docs' AND (storage.foldername(name))[1] = auth.uid()::text
-- );
