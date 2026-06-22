export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole = 'chercheur' | 'admin' | 'direction' | 'affilie'
export type PublicationStatus = 'draft' | 'submitted' | 'accepted' | 'published' | 'rejected'
export type ProjectStatus = 'idea' | 'submitted' | 'obtained' | 'active' | 'completed' | 'cancelled'
export type PatentStatus = 'idea' | 'filed' | 'examination' | 'granted' | 'exploited' | 'abandoned'
export type TrainingType = 'formation_initiale' | 'formation_executive' | 'formation_doctorale' | 'autre'
export type SupervisionType = 'doctorant' | 'master' | 'pfe' | 'stage' | 'postdoc'
export type SupervisionStatus = 'in_progress' | 'defended' | 'abandoned' | 'completed'
export type ServiceStatus = 'proposal' | 'signed' | 'active' | 'completed' | 'cancelled'
export type CommunicationType = 'oral' | 'poster' | 'keynote' | 'invited' | 'workshop' | 'seminar'
export type ExpertiseType = 'reviewer' | 'editor' | 'committee' | 'institutional' | 'other'
export type KpiStatus = 'atteint' | 'en_cours' | 'non_atteint' | 'non_renseigne'

export interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  grade?: string
  pole?: string
  entity: string
  office?: string
  orcid?: string
  scopus_id?: string
  google_scholar_id?: string
  linkedin_url?: string
  expertise_domains?: string[]
  keywords?: string[]
  research_axes?: string[]
  start_date?: string
  role: UserRole
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface AcademicYear {
  id: string
  label: string
  start_date: string
  end_date: string
  is_current: boolean
}

export interface Publication {
  id: string
  researcher_id: string
  academic_year_id?: string
  title: string
  authors: string
  journal?: string
  year: number
  doi?: string
  eid?: string
  volume?: string
  issue?: string
  pages?: string
  citation_count: number
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  impact_factor?: number
  source_type?: string
  document_type?: string
  publication_stage: PublicationStatus
  is_open_access: boolean
  is_first_author: boolean
  is_corresponding_author: boolean
  um6p_affiliation: boolean
  affiliations?: string
  gsmi_comment?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  researcher_id: string
  academic_year_id?: string
  project_id_code?: string
  title: string
  type?: string
  role: string
  status: ProjectStatus
  funder?: string
  total_budget?: number
  um6p_share_pct?: number
  um6p_budget?: number
  start_date?: string
  end_date?: string
  duration_months?: number
  is_international: boolean
  partners?: string[]
  comment?: string
  created_at: string
  updated_at: string
}

export interface Training {
  id: string
  researcher_id: string
  academic_year_id?: string
  semester: 'S1' | 'S2'
  training_type: TrainingType
  activity: string
  program?: string
  planned_hours: number
  realized_hours: number
  comment?: string
  created_at: string
  updated_at: string
}

export interface Supervision {
  id: string
  researcher_id: string
  academic_year_id?: string
  student_name: string
  supervision_type: SupervisionType
  thesis_title?: string
  program?: string
  co_supervisor?: string
  start_date?: string
  defense_date?: string
  status: SupervisionStatus
  result?: string
  comment?: string
  created_at: string
  updated_at: string
}

export interface Communication {
  id: string
  researcher_id: string
  academic_year_id?: string
  title: string
  communication_type: CommunicationType
  event_name?: string
  location?: string
  country?: string
  date?: string
  scope: 'national' | 'international'
  is_invited: boolean
  partners?: string[]
  doi?: string
  url?: string
  comment?: string
  created_at: string
  updated_at: string
}

export interface Patent {
  id: string
  researcher_id: string
  academic_year_id?: string
  title: string
  inventors?: string
  status: PatentStatus
  filing_date?: string
  grant_date?: string
  patent_number?: string
  office?: string
  countries?: string[]
  trl_level?: number
  revenue?: number
  licensee?: string
  comment?: string
  created_at: string
  updated_at: string
}

export interface ServiceMission {
  id: string
  researcher_id: string
  academic_year_id?: string
  title: string
  service_type?: string
  client?: string
  associated_project_id?: string
  role?: string
  man_days: number
  daily_rate?: number
  amount?: number
  status: ServiceStatus
  start_date?: string
  end_date?: string
  impact?: string
  comment?: string
  created_at: string
  updated_at: string
}

export interface Collaboration {
  id: string
  researcher_id: string
  academic_year_id?: string
  partner_institution: string
  country?: string
  scope: 'national' | 'international'
  contact_person?: string
  type?: string
  start_date?: string
  end_date?: string
  associated_publications?: string[]
  associated_projects?: string[]
  comment?: string
  created_at: string
  updated_at: string
}

export interface ExpertiseActivity {
  id: string
  researcher_id: string
  academic_year_id?: string
  expertise_type: ExpertiseType
  organization?: string
  role_description?: string
  journal_or_event?: string
  year?: number
  count?: number
  comment?: string
  created_at: string
  updated_at: string
}

export interface Forecast {
  id: string
  researcher_id: string
  academic_year_id: string
  kpi_key: string
  planned_value: number
  revision_s1_value?: number
  realized_value?: number
  gap?: number
  gap_justification?: string
  status?: KpiStatus
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name?: string
  record_id?: string
  old_values?: Json
  new_values?: Json
  ip_address?: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      academic_years: { Row: AcademicYear; Insert: Partial<AcademicYear>; Update: Partial<AcademicYear> }
      publications: { Row: Publication; Insert: Partial<Publication>; Update: Partial<Publication> }
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> }
      trainings: { Row: Training; Insert: Partial<Training>; Update: Partial<Training> }
      supervisions: { Row: Supervision; Insert: Partial<Supervision>; Update: Partial<Supervision> }
      communications: { Row: Communication; Insert: Partial<Communication>; Update: Partial<Communication> }
      patents: { Row: Patent; Insert: Partial<Patent>; Update: Partial<Patent> }
      service_missions: { Row: ServiceMission; Insert: Partial<ServiceMission>; Update: Partial<ServiceMission> }
      collaborations: { Row: Collaboration; Insert: Partial<Collaboration>; Update: Partial<Collaboration> }
      expertise_activities: { Row: ExpertiseActivity; Insert: Partial<ExpertiseActivity>; Update: Partial<ExpertiseActivity> }
      forecasts: { Row: Forecast; Insert: Partial<Forecast>; Update: Partial<Forecast> }
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> }
    }
  }
}

// KPI definitions
export interface KpiDefinition {
  key: string
  labelFr: string
  labelEn: string
  unit?: string
  category: 'production' | 'rayonnement' | 'projets' | 'formation' | 'encadrement' | 'prestations'
}

export const KPI_DEFINITIONS: KpiDefinition[] = [
  { key: 'publications_total', labelFr: 'Publications totales', labelEn: 'Total publications', category: 'production' },
  { key: 'publications_published', labelFr: 'Publications publiées (Final)', labelEn: 'Published articles (Final)', category: 'production' },
  { key: 'publications_accepted', labelFr: 'Accepté / Article in Press', labelEn: 'Accepted / Article in Press', category: 'production' },
  { key: 'citations_total', labelFr: 'Citations totales', labelEn: 'Total citations', category: 'production' },
  { key: 'publications_open_access', labelFr: 'Publications Open Access', labelEn: 'Open Access publications', category: 'production' },
  { key: 'conferences_international', labelFr: 'Conférences internationales', labelEn: 'International conferences', category: 'rayonnement' },
  { key: 'communications_invited', labelFr: 'Communications invitées', labelEn: 'Invited communications', category: 'rayonnement' },
  { key: 'patents_filed', labelFr: 'Brevets déposés', labelEn: 'Patents filed', category: 'rayonnement' },
  { key: 'patents_granted', labelFr: 'Brevets acceptés', labelEn: 'Patents granted', category: 'rayonnement' },
  { key: 'prototypes_transfers', labelFr: 'Prototypes / Transferts TRL', labelEn: 'Prototypes / TRL transfers', category: 'rayonnement' },
  { key: 'projects_submitted', labelFr: 'Projets soumis', labelEn: 'Projects submitted', category: 'projets' },
  { key: 'projects_obtained', labelFr: 'Projets obtenus', labelEn: 'Projects obtained', category: 'projets' },
  { key: 'projects_success_rate', labelFr: 'Taux de succès (%)', labelEn: 'Success rate (%)', unit: '%', category: 'projets' },
  { key: 'budget_obtained', labelFr: 'Budget total obtenu (MAD)', labelEn: 'Total budget obtained (MAD)', unit: 'MAD', category: 'projets' },
  { key: 'projects_international', labelFr: 'Projets internationaux', labelEn: 'International projects', category: 'projets' },
  { key: 'hours_initial', labelFr: 'H. Formation initiale (S1+S2)', labelEn: 'Initial training hours (S1+S2)', unit: 'h', category: 'formation' },
  { key: 'hours_executive', labelFr: 'H. Formation exécutive (S1+S2)', labelEn: 'Executive training hours (S1+S2)', unit: 'h', category: 'formation' },
  { key: 'hours_doctoral', labelFr: 'H. Formation doctorale (S1+S2)', labelEn: 'Doctoral training hours (S1+S2)', unit: 'h', category: 'formation' },
  { key: 'phd_supervised', labelFr: 'Doctorants encadrés', labelEn: 'PhD students supervised', category: 'encadrement' },
  { key: 'masters_supervised', labelFr: 'PFE / Masters encadrés', labelEn: 'PFE / Masters supervised', category: 'encadrement' },
  { key: 'services_count', labelFr: 'Nombre de prestations', labelEn: 'Number of services', category: 'prestations' },
  { key: 'services_revenue', labelFr: 'Revenus générés (MAD)', labelEn: 'Revenue generated (MAD)', unit: 'MAD', category: 'prestations' },
  { key: 'missions_led', labelFr: 'Missions pilotées', labelEn: 'Missions led', category: 'prestations' },
]
// --- Tes types existants (Json, UserRole, etc.) ---
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]
export type UserRole = 'chercheur' | 'admin' | 'direction' | 'affilie'
// ... (le reste de tes types)

// --- INTERFACES À AJOUTER / COMPLÉTER ---

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  grade?: string;
  specialty?: string;
  department?: string;
  laboratory?: string;
  research_axes?: string;
  orcid_id?: string;
  // Les champs manquants qui causaient l'erreur TS2551 & TS2339 :
  google_scholar_id?: string; 
  google_scholar_url?: string;
  researchgate_url?: string;
  personal_website?: string;
  hindex?: number;
  wos_id?: string;
  phd_date?: string;
  phd_institution?: string;
  hdr_date?: string;
  hdr_institution?: string;
  biography?: string;
}

export interface Service {
  id?: string;
  researcher_id: string;
  title: string;
  service_type: string;
  client_name: string;
  client_type: string;
  start_date: string;
  end_date?: string;
  contract_amount?: number;
  um6p_share?: number;
  status: ServiceStatus; // Utilise ton type ServiceStatus ici !
  deliverables?: string;
  team_members?: string;
  comment?: string;
}

export interface Supervision {
  id?: string;
  researcher_id: string;
  student_name: string;
  supervision_type: SupervisionType; // Utilise ton type SupervisionType
  thesis_title: string;
  program?: string;
  co_supervisor?: string;
  start_date: string;
  defense_date?: string;
  status: SupervisionStatus; // Utilise ton type SupervisionStatus
  result?: string;
  comment?: string;
}

export interface Training {
  id?: string;
  researcher_id: string | undefined;
  semester: string;
  training_type: TrainingType; // Utilise ton type TrainingType
  activity: string;
  program: string;
  planned_hours: number;
  realized_hours: number;
  comment?: string;
}
