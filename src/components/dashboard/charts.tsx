import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Forecast, Publication, Project } from '@/types/database'

// Publications by year chart
export function PublicationsByYear({ researcherId }: { researcherId?: string }) {
  const { data } = useQuery({
    queryKey: ['publications-by-year', researcherId],
    enabled: !!researcherId,
    queryFn: async () => {
      const { data } = await supabase
        .from('publications')
        .select('publication_year, pub_type')
        .eq('researcher_id', researcherId!)
      const byYear: Record<number, { revues: number; conferences: number }> = {}
      ;(data ?? [] as Publication[]).forEach((p) => {
        const y = p.publication_year
        if (!y) return
        if (!byYear[y]) byYear[y] = { revues: 0, conferences: 0 }
        if (p.pub_type === 'article_revue') byYear[y].revues++
        else if (p.pub_type === 'conference') byYear[y].conferences++
      })
      return Object.entries(byYear)
        .map(([year, v]) => ({ year, ...v }))
        .sort((a, b) => Number(a.year) - Number(b.year))
        .slice(-6)
    },
  })

  if (!data?.length) return <p className="text-sm text-um6p-gray-dark text-center py-8">Aucune publication enregistrée</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="revues" name="Articles revues" fill="#00843D" radius={[4, 4, 0, 0]} />
        <Bar dataKey="conferences" name="Conférences" fill="#4CAF7A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Forecast vs realized chart
export function ForecastChart({ forecastsData, kpis }: { forecastsData: Forecast[]; kpis?: Record<string, number | string> }) {
  const keyLabels: Record<string, string> = {
    publications_total: 'Publications',
    projects_active: 'Projets',
    hours_initial: 'H. Initial',
    phd_supervised: 'Doctorants',
    services_count: 'Prestations',
  }

  const chartData = forecastsData
    .filter((f) => Object.keys(keyLabels).includes(f.kpi_key) && (f.planned ?? 0) > 0)
    .map((f) => ({
      name: keyLabels[f.kpi_key] ?? f.kpi_key,
      Objectif: f.planned ?? 0,
      Réalisé: typeof kpis?.[f.kpi_key] === 'number' ? kpis[f.kpi_key] : 0,
    }))

  if (!chartData.length) return <p className="text-sm text-um6p-gray-dark text-center py-8">Définissez vos objectifs dans Prévisions</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Objectif" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Réalisé" fill="#00843D" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Projects budget chart
export function ProjectsBudgetChart({ projectsData }: { projectsData: Project[] }) {
  const active = projectsData.filter((p) => ['active', 'completed'].includes(p.status ?? ''))
  const planned = projectsData.filter((p) => p.status === 'planned')

  const byStatus = [
    { name: 'Actifs / Terminés', value: active.reduce((s, p) => s + (p.um6p_budget ?? 0), 0) },
    { name: 'Planifiés', value: planned.reduce((s, p) => s + (p.um6p_budget ?? 0), 0) },
  ].filter((d) => d.value > 0)

  if (!byStatus.length) return <p className="text-sm text-um6p-gray-dark text-center py-8">Aucun projet enregistré</p>

  const max = Math.max(...byStatus.map((b) => b.value), 1)
  const formatMAD = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

  return (
    <div className="space-y-3">
      {byStatus.map((item) => (
        <div key={item.name} className="flex items-center justify-between">
          <span className="text-sm text-um6p-gray-dark w-28">{item.name}</span>
          <div className="flex-1 mx-3">
            <div className="progress-bar">
              <div className="progress-fill bg-um6p-green" style={{ width: `${Math.round((item.value / max) * 100)}%` }} />
            </div>
          </div>
          <span className="text-sm font-semibold text-um6p-navy w-20 text-right">{formatMAD(item.value)} MAD</span>
        </div>
      ))}
    </div>
  )
}

// Activity timeline
export function ActivityTimeline({ researcherId }: { researcherId?: string }) {
  const { data } = useQuery({
    queryKey: ['activity-timeline', researcherId],
    enabled: !!researcherId,
    queryFn: async () => {
      const [pubs, projects, comms] = await Promise.all([
        supabase.from('publications').select('id, title, created_at').eq('researcher_id', researcherId!).order('created_at', { ascending: false }).limit(3),
        supabase.from('projects').select('id, title, created_at').eq('researcher_id', researcherId!).order('created_at', { ascending: false }).limit(2),
        supabase.from('communications').select('id, title, created_at').eq('researcher_id', researcherId!).order('created_at', { ascending: false }).limit(2),
      ])
      return [
        ...(pubs.data ?? []).map((p) => ({ ...p, icon: '📄' })),
        ...(projects.data ?? []).map((p) => ({ ...p, icon: '📁' })),
        ...(comms.data ?? []).map((c) => ({ ...c, icon: '🎤' })),
      ].sort((a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime()).slice(0, 6)
    },
  })

  if (!data?.length) return <p className="text-sm text-um6p-gray-dark text-center py-8">Aucune activité récente</p>

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="text-lg mt-0.5">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-um6p-navy truncate">{item.title}</p>
            <p className="text-xs text-um6p-gray-dark">{new Date(item.created_at ?? '').toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PublicationsByYear
