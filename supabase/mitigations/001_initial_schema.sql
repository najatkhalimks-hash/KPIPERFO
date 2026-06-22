-- ============================================================
-- GSMI Researcher Platform - Initial Schema
-- Version: 1.0.0 | Date: 2024
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  full_name       TEXT,
  phone           TEXT,
  role            TEXT DEFAULT 'researcher' CHECK (role IN ('researcher', 'admin', 'viewer')),
  is_active       BOOLEAN DEFAULT TRUE,
  grade           TEXT,
  specialty       TEXT,
  department      TEXT,
  laboratory      TEXT,
  research_axes   TEXT,
  biography       TEXT,
  orcid_id        TEXT,
  scopus_id       TEXT,
  wos_id          TEXT,
  hindex          INTEGER,
  google_scholar_url  TEXT,
  researchgate_url    TEXT,
  linkedin_url        TEXT,
  personal_website    TEXT,
  phd_date            DATE,
  phd_institution     TEXT,
  hdr_date            DATE,
  hdr_institution     TEXT,
  avatar_url          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACADEMIC YEARS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.academic_years (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label       TEXT NOT NULL UNIQUE,    -- e.g. "2024-2025"
  year_start  INTEGER NOT NULL,
  year_end    INTEGER NOT NULL,
  is_current  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Only one current year at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_years_current ON public.academic_years(is_current) WHERE is_current = TRUE;

-- ============================================================
-- PUBLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.publications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES public.academic_years(id),
  doi               TEXT,
  title             TEXT NOT NULL,
  authors           TEXT,
  pub_type          TEXT CHECK (pub_type IN ('article_revue', 'conference', 'chapitre_livre', 'livre', 'rapport', 'these', 'brevet_pub', 'autre')),
  journal_name      TEXT,
  publisher         TEXT,
  publication_year  INTEGER,
  volume            TEXT,
  issue             TEXT,
  pages             TEXT,
  is_indexed        BOOLEAN DEFAULT FALSE,
  indexing_bases    TEXT[],           -- {'Scopus', 'WoS', 'PubMed', ...}
  impact_factor     DECIMAL(6,3),
  quartile          TEXT CHECK (quartile IN ('Q1','Q2','Q3','Q4')),
  is_open_access    BOOLEAN DEFAULT FALSE,
  citations_count   INTEGER DEFAULT 0,
  is_um6p_affiliated BOOLEAN DEFAULT TRUE,
  url               TEXT,
  document_url      TEXT,
  comment           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publications_researcher ON public.publications(researcher_id);
CREATE INDEX IF NOT EXISTS idx_publications_year ON public.publications(publication_year);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES public.academic_years(id),
  title             TEXT NOT NULL,
  project_type      TEXT CHECK (project_type IN ('national', 'international', 'industriel', 'interne', 'autre')),
  funding_source    TEXT,
  total_budget      DECIMAL(15,2) DEFAULT 0,
  um6p_budget       DECIMAL(15,2) DEFAULT 0,
  start_date        DATE,
  end_date          DATE,
  status            TEXT DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'cancelled', 'suspended')),
  role              TEXT DEFAULT 'PI' CHECK (role IN ('PI', 'Co-PI', 'Partenaire', 'Collaborateur')),
  partners          TEXT,
  team_size         INTEGER DEFAULT 1,
  objectives        TEXT,
  deliverables      TEXT,
  document_url      TEXT,
  comment           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_researcher ON public.projects(researcher_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- ============================================================
-- TRAININGS (Heures d'enseignement)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trainings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES public.academic_years(id),
  semester          TEXT CHECK (semester IN ('S1','S2')),
  training_type     TEXT CHECK (training_type IN ('formation_initiale','formation_executive','formation_doctorale','autre')),
  activity          TEXT,
  program           TEXT,
  planned_hours     DECIMAL(8,2) DEFAULT 0,
  realized_hours    DECIMAL(8,2) DEFAULT 0,
  comment           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainings_researcher ON public.trainings(researcher_id);

-- ============================================================
-- SUPERVISIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.supervisions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES public.academic_years(id),
  student_name      TEXT NOT NULL,
  supervision_type  TEXT CHECK (supervision_type IN ('doctorant','master','pfe','stage','postdoc')),
  thesis_title      TEXT,
  program           TEXT,
  co_supervisor     TEXT,
  start_date        DATE,
  defense_date      DATE,
  status            TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','defended','abandoned','completed')),
  result            TEXT,
  comment           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supervisions_researcher ON public.supervisions(researcher_id);

-- ============================================================
-- COMMUNICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.communications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES public.academic_years(id),
  comm_type         TEXT CHECK (comm_type IN ('conference_internationale','conference_nationale','seminaire','vulgarisation','media','autre')),
  title             TEXT NOT NULL,
  event_name        TEXT,
  location          TEXT,
  country           TEXT,
  comm_date         DATE,
  role              TEXT DEFAULT 'presenter',
  audience_size     INTEGER,
  is_invited        BOOLEAN DEFAULT FALSE,
  is_international  BOOLEAN DEFAULT TRUE,
  status            TEXT DEFAULT 'planned' CHECK (status IN ('planned','completed','cancelled')),
  document_url      TEXT,
  comment           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communications_researcher ON public.communications(researcher_id);

-- ============================================================
-- PATENTS (Propriété intellectuelle)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES public.academic_years(id),
  title             TEXT NOT NULL,
  patent_type       TEXT CHECK (patent_type IN ('brevet','marque','logiciel','modele_utilite','autre')),
  reference_number  TEXT,
  filing_date       DATE,
  grant_date        DATE,
  expiry_date       DATE,
  country           TEXT,
  inventors         TEXT,
  assignee          TEXT DEFAULT 'UM6P',
  status            TEXT DEFAULT 'filed' CHECK (status IN ('draft','filed','pending','granted','rejected','expired')),
  valorization      TEXT,
  licensing_revenue DECIMAL(15,2),
  comment           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patents_researcher ON public.patents(researcher_id);

-- ============================================================
-- SERVICES (Prestations & Contrats)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES public.academic_years(id),
  title             TEXT NOT NULL,
  service_type      TEXT CHECK (service_type IN ('expertise','analyse','formation','etude','audit','autre')),
  client_name       TEXT,
  client_type       TEXT CHECK (client_type IN ('entreprise','public','ngo','international','autre')),
  start_date        DATE,
  end_date          DATE,
  contract_amount   DECIMAL(15,2),
  um6p_share        DECIMAL(15,2),
  status            TEXT DEFAULT 'active' CHECK (status IN ('planned','active','completed','cancelled')),
  deliverables      TEXT,
  team_members      TEXT,
  comment           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_researcher ON public.services(researcher_id);

-- ============================================================
-- COLLABORATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collaborations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES public.academic_years(id),
  partner_name      TEXT NOT NULL,
  partner_type      TEXT CHECK (partner_type IN ('universite','centre_recherche','entreprise','organisme_international','autre')),
  country           TEXT,
  collaboration_type TEXT CHECK (collaboration_type IN ('recherche','co_publication','mobilite','cotutelle','projet_commun','autre')),
  title             TEXT,
  start_date        DATE,
  end_date          DATE,
  has_convention    BOOLEAN DEFAULT FALSE,
  convention_ref    TEXT,
  status            TEXT DEFAULT 'active' CHECK (status IN ('planned','active','completed')),
  outcomes          TEXT,
  comment           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collaborations_researcher ON public.collaborations(researcher_id);

-- ============================================================
-- EXPERTISE ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expertise_activities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID REFERENCES public.academic_years(id),
  expertise_type    TEXT CHECK (expertise_type IN ('jury_these','jury_habilitation','evaluation_projet','comite_scientifique','expertise_revue','commission_nationale','expertise_institutionnelle','prix_distinctions','autre')),
  title             TEXT NOT NULL,
  organization      TEXT,
  country           TEXT,
  expertise_date    DATE,
  role              TEXT,
  is_international  BOOLEAN DEFAULT FALSE,
  nb_reviews        INTEGER DEFAULT 1,
  comment           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expertise_researcher ON public.expertise_activities(researcher_id);

-- ============================================================
-- FORECASTS (Prévisions & Réalisations KPI)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forecasts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  academic_year_id  UUID NOT NULL REFERENCES public.academic_years(id),
  kpi_key           TEXT NOT NULL,
  planned           DECIMAL(12,2) DEFAULT 0,
  revision_s1       DECIMAL(12,2),
  realized          DECIMAL(12,2) DEFAULT 0,  -- calculated from modules
  gap               DECIMAL(12,2),             -- realized - planned
  gap_pct           DECIMAL(8,2),              -- gap / planned * 100
  status            TEXT DEFAULT 'on_track' CHECK (status IN ('on_track','at_risk','exceeded','not_started')),
  justification     TEXT,                       -- required when gap > 20%
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(researcher_id, academic_year_id, kpi_key)
);

CREATE INDEX IF NOT EXISTS idx_forecasts_researcher ON public.forecasts(researcher_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_year ON public.forecasts(academic_year_id);

-- ============================================================
-- DOCUMENTS (Supabase Storage references)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  researcher_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module          TEXT,           -- 'publication', 'project', 'patent', etc.
  record_id       UUID,           -- FK to the related record
  file_name       TEXT NOT NULL,
  file_path       TEXT NOT NULL,  -- Supabase Storage path
  file_size       BIGINT,
  mime_type       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at    BEFORE UPDATE ON public.profiles    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_publications_updated_at BEFORE UPDATE ON public.publications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_projects_updated_at    BEFORE UPDATE ON public.projects    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_forecasts_updated_at   BEFORE UPDATE ON public.forecasts   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expertise_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents            ENABLE ROW LEVEL SECURITY;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- PROFILES: own profile + admin sees all
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- ACADEMIC YEARS: all authenticated users read
CREATE POLICY "years_select" ON public.academic_years FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "years_admin"  ON public.academic_years FOR ALL USING (public.is_admin());

-- DATA TABLES: own records + admin sees all
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['publications','projects','trainings','supervisions','communications','patents','services','collaborations','expertise_activities','forecasts','documents']
  LOOP
    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (researcher_id = auth.uid() OR public.is_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT WITH CHECK (researcher_id = auth.uid())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE USING (researcher_id = auth.uid() OR public.is_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE USING (researcher_id = auth.uid() OR public.is_admin())', tbl, tbl);
  END LOOP;
END;
$$;

-- ============================================================
-- VIEWS (for dashboard aggregates)
-- ============================================================

CREATE OR REPLACE VIEW public.v_researcher_kpis AS
SELECT
  p.id AS researcher_id,
  p.full_name,
  p.department,
  p.grade,
  COUNT(DISTINCT pub.id)  FILTER (WHERE pub.pub_type = 'article_revue') AS publications_revues,
  COUNT(DISTINCT pub.id)  FILTER (WHERE pub.is_indexed = TRUE)          AS publications_indexees,
  COUNT(DISTINCT proj.id) FILTER (WHERE proj.status = 'active')         AS projets_actifs,
  COALESCE(SUM(proj.um6p_budget) FILTER (WHERE proj.status = 'active'), 0) AS budget_projets,
  COUNT(DISTINCT sup.id)  FILTER (WHERE sup.supervision_type = 'doctorant') AS doctorants,
  COUNT(DISTINCT sup.id)  FILTER (WHERE sup.status = 'defended')        AS soutenances,
  COUNT(DISTINCT comm.id) FILTER (WHERE comm.is_international = TRUE)   AS comm_intl,
  COUNT(DISTINCT pat.id)  FILTER (WHERE pat.status = 'granted')         AS brevets_accordes,
  COUNT(DISTINCT col.id)  FILTER (WHERE col.status = 'active')          AS collaborations_actives,
  COALESCE(SUM(DISTINCT tr.realized_hours), 0)                          AS heures_enseignement
FROM public.profiles p
LEFT JOIN public.publications         pub  ON pub.researcher_id = p.id
LEFT JOIN public.projects             proj ON proj.researcher_id = p.id
LEFT JOIN public.supervisions         sup  ON sup.researcher_id = p.id
LEFT JOIN public.communications       comm ON comm.researcher_id = p.id
LEFT JOIN public.patents              pat  ON pat.researcher_id = p.id
LEFT JOIN public.collaborations       col  ON col.researcher_id = p.id
LEFT JOIN public.trainings            tr   ON tr.researcher_id = p.id
GROUP BY p.id, p.full_name, p.department, p.grade;

-- Grant view access to authenticated users
GRANT SELECT ON public.v_researcher_kpis TO authenticated;
