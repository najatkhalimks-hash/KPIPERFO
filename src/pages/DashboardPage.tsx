import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/auth'
import KpiCard from '@/components/dashboard/KpiCard'
import ForecastChart from '@/components/dashboard/ForecastChart'
import ActivityTimeline from '@/components/dashboard/ActivityTimeline'
import PublicationsByYear from '@/components/dashboard/PublicationsByYear'
import ProjectsBudgetChart from '@/components/dashboard/ProjectsBudgetChart'
import StatusBadge from '@/components/ui/StatusBadge'
import ExportButton from '@/components/ui/ExportButton'
import { BookOpen, FolderKanban, GraduationCap, Users, Briefcase, Award, TrendingUp, Target } from 'lucide-react'

function useDashboardData(researcherId: string | undefined, yearId: string | null) {
  return useQuery({
    queryKey: ['dashboard', researcherId, yearId],
    enabled: !!researcherId,
    queryFn: async () => {
      if (!researcherId) return null

      // CORRECTION : Cast en any pour éviter les erreurs d'inférence de schémas stricts Supabase
      const [pubs, projects, trainings, supervisions, comms, patents, services, forecasts] = await Promise.all([
        supabase.from('publications').select('*').eq('researcher_id', researcherId) as any,
        supabase.from('projects').select('*').eq('researcher_id', researcherId) as any,
        supabase.from('trainings').select('*').eq('researcher_id', researcherId) as any,
        supabase.from('supervisions').select('*').eq('researcher_id', researcherId) as any,
        supabase.from('communications').select('*').eq('researcher_id', researcherId) as any,
        supabase.from('patents').select('*').eq('researcher_id', researcherId) as any,
        supabase.from('service_missions').select('*').eq('researcher_id', researcherId) as any,
        supabase.from('forecasts').select('*').eq('researcher_id', researcherId).eq('academic_year_id', yearId ?? '') as any,
      ])

      const pubsData = (pubs.data ?? []) as any[]
      const projectsData = (projects.data ?? []) as any[]
      const trainingsData = (trainings.data ?? []) as any[]
      const supervisionsData = (supervisions.data ?? []) as any[]
      const commsData = (comms.data ?? []) as any[]
      const patentsData = (patents.data ?? []) as any[]
      const servicesData = (services.data ?? []) as any[]
      const forecastsData = (forecasts.data ?? []) as any[]

      const kpis = {
        publications_total: pubsData.length,
        publications_published: pubsData.filter((p) => p.publication_stage === 'published').length,
        publications_accepted: pubsData.filter((p) => p.publication_stage === 'accepted').length,
        citations_total: pubsData.reduce((s, p) => s + (p.citation_count ?? 0), 0),
        publications_open_access: pubsData.filter((p) => p.is_open_access).length,
        conferences_international: commsData.filter((c) => c.scope === 'international' || c.is_international === true).length,
        communications_invited: commsData.filter((c) => c.is_invited).length,
        patents_filed: patentsData.filter((p) => ['filed', 'examination', 'granted', 'exploited'].includes(p.status ?? '')).length,
        patents_granted: patentsData.filter((p) => p.status === 'granted').length,
        prototypes_transfers: patentsData.filter((p) => (p.trl_level ?? 0) >= 7).length,
        projects_submitted: projectsData.filter((p) => ['submitted', 'obtained', 'active', 'completed'].includes(p.status ?? '')).length,
        projects_obtained: projectsData.filter((p) => ['obtained', 'active', 'completed'].includes(p.status ?? '')).length,
        projects_success_rate: projectsData.length > 0
          ? Math.round((projectsData.filter((p) => ['obtained', 'active', 'completed'].includes(p.status ?? '')).length / projectsData.length) * 100)
          : 0,
        budget_obtained: projectsData.filter((p) => ['obtained', 'active', 'completed'].includes(p.status ?? '')).reduce((s, p) => s + (p.um6p_budget ?? 0), 0),
        projects_international: projectsData.filter((p) => p.is_international).length,
        hours_initial: trainingsData.filter((t) => t.training_type === 'formation_initiale').reduce((s, t) => s + (t.realized_hours ?? 0), 0),
        hours_executive: trainingsData.filter((t) => t.training_type === 'formation_executive').reduce((s, t) => s + (t.realized_hours ?? 0), 0),
        hours_doctoral: trainingsData.filter((t) => t.training_type === 'formation_doctorale').reduce((s, t) => s + (t.realized_hours ?? 0), 0),
        phd_supervised: supervisionsData.filter((s) => s.supervision_type === 'doctorant').length,
        masters_supervised: supervisionsData.filter((s) => ['master', 'pfe'].includes(s.supervision_type ?? '')).length,
        services_count: servicesData.length,
        services_revenue: servicesData.reduce((s, sv) => s + (sv.amount ?? 0), 0),
        missions_led: servicesData.filter((sv) => sv.role?.toLowerCase().includes('lead') || sv.role?.toLowerCase().includes('pilot')).length,
      }

      return { kpis, pubsData, projectsData, trainingsData, supervisionsData, forecastsData, servicesData }
    },
  })
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { selectedAcademicYear } = useAppStore()
  const { data, isLoading } = useDashboardData(profile?.id, selectedAcademicYear)

  const kpis = data?.kpis
  const forecastMap = Object.fromEntries(
    (data?.forecastsData ?? []).map((f) => [f.kpi_key, f])
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-um6p-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="text-sm text-um6p-gray-dark mt-0.5">
            {profile?.first_name} {profile?.last_name} — {profile?.grade}
          </p>
        </div>
        <ExportButton researcherId={profile?.id} yearId={selectedAcademicYear} />
      </div>

      {/* KPI Overview - Production scientifique */}
      <section>
        <h2 className="section-title flex items-center gap-2">
          <BookOpen size={18} className="text-um6p-green" />
          {t('dashboard.production')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label={t('forecasts.categories.production') + ' — Publications'} value={kpis?.publications_total ?? 0}
            forecast={forecastMap['publications_total']} icon="📄" color="green" />
          <KpiCard label="Publiées (Final)" value={kpis?.publications_published ?? 0}
            forecast={forecastMap['publications_published']} icon="✅" color="green" />
          <KpiCard label="Acceptées / In Press" value={kpis?.publications_accepted ?? 0}
            forecast={forecastMap['publications_accepted']} icon="📋" color="blue" />
          <KpiCard label="Citations totales" value={kpis?.citations_total ?? 0}
            forecast={forecastMap['citations_total']} icon="🔗" color="purple" />
          <KpiCard label="Open Access" value={kpis?.publications_open_access ?? 0}
            forecast={forecastMap['publications_open_access']} icon="🌐" color="teal" />
        </div>
      </section>

      {/* Rayonnement */}
      <section>
        <h2 className="section-title flex items-center gap-2">
          <Award size={18} className="text-um6p-green" />
          {t('dashboard.rayonnement')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="Conférences intl." value={kpis?.conferences_international ?? 0}
            forecast={forecastMap['conferences_international']} icon="🎤" color="blue" />
          <KpiCard label="Comm. invitées" value={kpis?.communications_invited ?? 0}
            forecast={forecastMap['communications_invited']} icon="⭐" color="gold" />
          <KpiCard label="Brevets déposés" value={kpis?.patents_filed ?? 0}
            forecast={forecastMap['patents_filed']} icon="📜" color="green" />
          <KpiCard label="Brevets accordés" value={kpis?.patents_granted ?? 0}
            forecast={forecastMap['patents_granted']} icon="🏆" color="gold" />
          <KpiCard label="Prototypes / TRL" value={kpis?.prototypes_transfers ?? 0}
            forecast={forecastMap['prototypes_transfers']} icon="⚙️" color="purple" />
        </div>
      </section>

      {/* Projets */}
      <section>
        <h2 className="section-title flex items-center gap-2">
          <FolderKanban size={18} className="text-um6p-green" />
          {t('dashboard.projets')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="Projets soumis" value={kpis?.projects_submitted ?? 0}
            forecast={forecastMap['projects_submitted']} icon="📤" color="blue" />
          <KpiCard label="Projets obtenu" value={kpis?.projects_obtained ?? 0}
            forecast={forecastMap['projects_obtained']} icon="✅" color="green" />
          <KpiCard label="Taux de succès" value={kpis?.projects_success_rate ?? 0} unit="%"
            forecast={forecastMap['projects_success_rate']} icon="📈" color="teal" />
          <KpiCard label="Budget UM6P (MAD)" value={(kpis?.budget_obtained ?? 0).toLocaleString()}
            forecast={forecastMap['budget_obtained']} icon="💰" color="gold" />
          <KpiCard label="Projets intl." value={kpis?.projects_international ?? 0}
            forecast={forecastMap['projects_international']} icon="🌍" color="purple" />
        </div>
      </section>

      {/* Formation & Encadrement */}
      <section>
        <h2 className="section-title flex items-center gap-2">
          <GraduationCap size={18} className="text-um6p-green" />
          {t('dashboard.formation')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="H. Formation initiale" value={kpis?.hours_initial ?? 0} unit="h"
            forecast={forecastMap['hours_initial']} icon="📚" color="blue" />
          <KpiCard label="H. Formation exec." value={kpis?.hours_executive ?? 0} unit="h"
            forecast={forecastMap['hours_executive']} icon="💼" color="teal" />
          <KpiCard label="H. Formation doctorale" value={kpis?.hours_doctoral ?? 0} unit="h"
            forecast={forecastMap['hours_doctoral']} icon="🎓" color="purple" />
          <KpiCard label="Doctorants encadrés" value={kpis?.phd_supervised ?? 0}
            forecast={forecastMap['phd_supervised']} icon="👨‍🎓" color="green" />
          <KpiCard label="PFE / Masters" value={kpis?.masters_supervised ?? 0}
            forecast={forecastMap['masters_supervised']} icon="📝" color="gold" />
        </div>
      </section>

      {/* Prestations */}
      <section>
        <h2 className="section-title flex items-center gap-2">
          <Briefcase size={18} className="text-um6p-green" />
          {t('dashboard.prestations')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard label="Nb. de prestations" value={kpis?.services_count ?? 0}
            forecast={forecastMap['services_count']} icon="🤝" color="blue" />
          <KpiCard label="Revenus générés (MAD)" value={(kpis?.services_revenue ?? 0).toLocaleString()}
            forecast={forecastMap['services_revenue']} icon="💵" color="gold" />
          <KpiCard label="Missions pilotées" value={kpis?.missions_led ?? 0}
            forecast={forecastMap['missions_led']} icon="🎯" color="green" />
        </div>
      </section>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="section-title">Publications par année</h3>
          <PublicationsByYear researcherId={profile?.id} />
        </div>
        <div className="card p-5">
          <h3 className="section-title">Prévisions vs Réalisations</h3>
          <ForecastChart forecastsData={data?.forecastsData ?? []} kpis={kpis} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="section-title">Budget projets (MAD)</h3>
          <ProjectsBudgetChart projectsData={data?.projectsData ?? []} />
        </div>
        <div className="card p-5">
          <h3 className="section-title">Activité récente</h3>
          <ActivityTimeline researcherId={profile?.id} />
        </div>
      </div>
    </div>
  )
}
