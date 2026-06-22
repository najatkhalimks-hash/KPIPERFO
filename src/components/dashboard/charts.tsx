import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database, Forecast, Publication, Project } from '@/types/database'

interface TimelineEvent {
  id: string
  title: string
  created_at: string
  type: 'publication' | 'project' | 'communication'
  icon: string
}

// 1. Chart: Publications by year
export function PublicationsByYear({ researcherId }: { researcherId?: string }) {
  const { data } = useQuery({
    queryKey: ['publications-by-year', researcherId],
    enabled: !!researcherId,
    queryFn: async () => {
      const { data: fetchDocs } = await supabase
        .from('publications')
        .select('year, publication_stage')
        .eq('researcher_id', researcherId!)

      const byYear: Record<number, { published: number; accepted: number }> = {}
      
      ;(fetchDocs ?? []).forEach((p) => {
        if (!p.year) return
        if (!byYear[p.year]) byYear[p.year] = { published: 0, accepted: 0 }
        if (p.publication_stage === 'published') byYear[p.year].published++
        else if (p.publication_stage === 'accepted') byYear[p.year].accepted++
      })

      return Object.entries(byYear)
        .map(([year, v]) => ({ year: Number(year), ...v }))
        .sort((a, b) => a.year - b.year)
        .slice(-6)
    },
  })

  if (!data?.length) return <p className="text-sm text-um6p-gray-dark text-center py-8">Aucune donnée</p>

  return (
    // CORRECTION RECHARTS TS : Cast de width et height pour éviter l'erreur d'affectation string/number
    <ResponsiveContainer width={"100%" as any} height={200 as any}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="year" tick={{ fontSize: 11 } as any} />
        <YAxis tick={{ fontSize: 11 } as any} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 } as any} />
        <Legend wrapperStyle={{ fontSize: 11 } as any} />
        <Bar dataKey="published" name="Publiées" fill="#00843D" radius={[4, 4, 0, 0]} />
        <Bar dataKey="accepted" name="Acceptées" fill="#4CAF7A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// 2. Chart: Forecast vs realized
export function ForecastChart({ forecastsData, kpis }: { forecastsData: Forecast[]; kpis?: Record<string, number | string> }) {
  const keyLabels: Record<string, string> = {
    publications_total: 'Publications',
    projects_obtained: 'Projets',
    hours_initial: 'H. Initial',
    phd_supervised: 'Doctorants',
    services_count: 'Prestations',
  }

  const chartData = forecastsData
    .filter((f) => Object.keys(keyLabels).includes(f.kpi_key) && f.planned_value > 0)
    .map((f) => ({
      name: keyLabels[f.kpi_key] ?? f.kpi_key,
      Objectif: f.planned_value,
      Réalisé: typeof kpis?.[f.kpi_key] === 'number' ? (kpis[f.kpi_key] as number) : 0,
    }))

  if (!chartData.length) return <p className="text-sm text-um6p-gray-dark text-center py-8">Définissez vos objectifs dans Prévisions</p>

  return (
    // CORRECTION RECHARTS TS : Cast de width et height
    <ResponsiveContainer width={"100%" as any} height={200 as any}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fontSize: 10 } as any} />
        <YAxis tick={{ fontSize: 11 } as any} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 } as any} />
        <Legend wrapperStyle={{ fontSize: 11 } as any} />
        <Bar dataKey="Objectif" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Réalisé" fill="#00843D" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// 3. Chart: Projects budget
export function ProjectsBudgetChart({ projectsData }: { projectsData: Project[] }) {
  const byStatus = [
    { name: 'Obtenus', value: projectsData.filter((p) => ['obtained', 'active', 'completed'].includes(p.status ?? '')).reduce((s, p) => s + (p.um6p_budget ?? 0), 0) },
    { name: 'Soumis', value: projectsData.filter((p) => p.status === 'submitted').reduce((s, p) => s + (p.um6p_budget ?? 0), 0) },
  ].filter((d) => d.value > 0)

  if (!byStatus.length) return <p className="text-sm text-um6p-gray-dark text-center py-8">Aucun projet enregistré</p>

  const formatMAD = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
  const maxVal = Math.max(...byStatus.map((b) => b.value))

  return (
    <div className="space-y-3">
      {byStatus.map((item) => (
        <div key={item.name} className="flex items-center justify-between">
          <span className="text-sm text-um6p-gray-dark w-24">{item.name}</span>
          <div className="flex-1 mx-3">
            <div className="progress-bar">
              <div
                className="progress-fill bg-um6p-green"
                style={{ width: `${Math.round((item.value / (maxVal || 1)) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-semibold text-um6p-navy w-20 text-right">{formatMAD(item.value)} MAD</span>
        </div>
      ))}
      <div className="text-xs text-um6p-gray-dark pt-2 border-t border-gray-100 mt-2">
        Total obtenu: <strong className="text-um6p-navy">{projectsData.filter((p) => ['obtained', 'active', 'completed'].includes(p.status ?? '')).reduce((s, p) => s + (p.um6p_budget ?? 0), 0).toLocaleString('fr-FR')} MAD</strong>
      </div>
    </div>
  )
}

// 4. Component: Activity timeline
export function ActivityTimeline({ researcherId }: { researcherId?: string }) {
  const { data } = useQuery<TimelineEvent[]>({
    queryKey: ['activity-timeline', researcherId],
    enabled: !!researcherId,
    queryFn: async () => {
      const [pubs, projects, comms] = await Promise.all([
        supabase.from('publications').select('id, title, created_at').eq('researcher_id', researcherId!).order('created_at', { ascending: false }).limit(3).catch(() => ({ data: [] })),
        supabase.from('projects').select('id, title, created_at').eq('researcher_id', researcherId!).order('created_at', { ascending: false }).limit(2).catch(() => ({ data: [] })),
        supabase.from('communications').select('id, title, created_at').eq('researcher_id', researcherId!).order('created_at', { ascending: false }).limit(2).catch(() => ({ data: [] })),
      ])

      const events: TimelineEvent[] = [
        ...(pubs.data ?? []).filter((p) => p?.created_at).map((p) => ({ id: p.id, title: p.title, created_at: p.created_at, type: 'publication' as const, icon: '📄' })),
        ...(projects.data ?? []).filter((p) => p?.created_at).map((p) => ({ id: p.id, title: p.title, created_at: p.created_at, type: 'project' as const, icon: '📁' })),
        ...(comms.data ?? []).filter((c) => c?.created_at).map((c) => ({ id: c.id, title: c.title, created_at: c.created_at, type: 'communication' as const, icon: '🎤' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6)

      return events
    },
  })

  if (!data?.length) return <p className="text-sm text-um6p-gray-dark text-center py-8">Aucune activité récente</p>

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? '
