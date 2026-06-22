import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/auth'
import toast from 'react-hot-toast'
import { Save, AlertTriangle } from 'lucide-react'
import { KPI_DEFINITIONS } from '@/types/database'
import type { Forecast } from '@/types/database'

type ForecastMap = Record<string, Forecast>

// Auto-calculate realized values from actual data
async function fetchRealizedValues(researcherId: string): Promise<Record<string, number>> {
  const [pubs, projects, trainings, supervisions, comms, patents, services] = await Promise.all([
    supabase.from('publications').select('publication_stage, citation_count, is_open_access').eq('researcher_id', researcherId),
    supabase.from('projects').select('status, um6p_budget, is_international').eq('researcher_id', researcherId),
    supabase.from('trainings').select('training_type, realized_hours').eq('researcher_id', researcherId),
    supabase.from('supervisions').select('supervision_type').eq('researcher_id', researcherId),
    supabase.from('communications').select('scope, is_invited').eq('researcher_id', researcherId),
    supabase.from('patents').select('status, trl_level').eq('researcher_id', researcherId),
    supabase.from('service_missions').select('amount, role').eq('researcher_id', researcherId),
  ])

  const p = pubs.data ?? [], pr = projects.data ?? [], t = trainings.data ?? [], s = supervisions.data ?? []
  const c = comms.data ?? [], pat = patents.data ?? [], sv = services.data ?? []

  return {
    publications_total: p.length,
    publications_published: p.filter((x) => x.publication_stage === 'published').length,
    publications_accepted: p.filter((x) => x.publication_stage === 'accepted').length,
    citations_total: p.reduce((acc, x) => acc + (x.citation_count ?? 0), 0),
    publications_open_access: p.filter((x) => x.is_open_access).length,
    conferences_international: c.filter((x) => x.scope === 'international').length,
    communications_invited: c.filter((x) => x.is_invited).length,
    patents_filed: pat.filter((x) => ['filed', 'examination', 'granted', 'exploited'].includes(x.status ?? '')).length,
    patents_granted: pat.filter((x) => x.status === 'granted').length,
    prototypes_transfers: pat.filter((x) => (x.trl_level ?? 0) >= 7).length,
    projects_submitted: pr.filter((x) => ['submitted', 'obtained', 'active', 'completed'].includes(x.status ?? '')).length,
    projects_obtained: pr.filter((x) => ['obtained', 'active', 'completed'].includes(x.status ?? '')).length,
    projects_success_rate: pr.length > 0 ? Math.round((pr.filter((x) => ['obtained', 'active', 'completed'].includes(x.status ?? '')).length / pr.length) * 100) : 0,
    budget_obtained: pr.filter((x) => ['obtained', 'active', 'completed'].includes(x.status ?? '')).reduce((acc, x) => acc + (x.um6p_budget ?? 0), 0),
    projects_international: pr.filter((x) => x.is_international).length,
    hours_initial: t.filter((x) => x.training_type === 'formation_initiale').reduce((acc, x) => acc + (x.realized_hours ?? 0), 0),
    hours_executive: t.filter((x) => x.training_type === 'formation_executive').reduce((acc, x) => acc + (x.realized_hours ?? 0), 0),
    hours_doctoral: t.filter((x) => x.training_type === 'formation_doctorale').reduce((acc, x) => acc + (x.realized_hours ?? 0), 0),
    phd_supervised: s.filter((x) => x.supervision_type === 'doctorant').length,
    masters_supervised: s.filter((x) => ['master', 'pfe'].includes(x.supervision_type ?? '')).length,
    services_count: sv.length,
    services_revenue: sv.reduce((acc, x) => acc + (x.amount ?? 0), 0),
    missions_led: sv.filter((x) => x.role?.toLowerCase().includes('lead') || x.role?.toLowerCase().includes('pilot')).length,
  }
}

function getStatus(planned: number, realized: number): string {
  if (planned === 0) return 'non_renseigne'
  const pct = (realized / planned) * 100
  if (pct >= 100) return 'atteint'
  if (pct >= 75) return 'en_cours'
  return 'non_atteint'
}

function getStatusClasses(status: string): string {
  if (status === 'atteint') return 'text-green-700 bg-green-50'
  if (status === 'en_cours') return 'text-amber-700 bg-amber-50'
  if (status === 'non_atteint') return 'text-red-700 bg-red-50'
  return 'text-gray-500 bg-gray-50'
}

const CATEGORY_LABELS: Record<string, string> = {
  production: '🔬 Production scientifique',
  rayonnement: '🌍 Rayonnement & Valorisation',
  projets: '💰 Projets de recherche',
  formation: '👥 Formation',
  encadrement: '🎓 Encadrement',
  prestations: '💼 Prestations de service',
}

export default function ForecastsPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { selectedAcademicYear } = useAppStore()
  const qc = useQueryClient()
  const [edits, setEdits] = useState<Record<string, { planned?: number; revision_s1?: number; justification?: string }>>({})
  const [saving, setSaving] = useState(false)

  const { data: forecastsData, isLoading: fLoading } = useQuery<ForecastMap>({
    queryKey: ['forecasts', profile?.id, selectedAcademicYear],
    enabled: !!profile?.id && !!selectedAcademicYear,
    queryFn: async () => {
      const { data } = await supabase.from('forecasts')
        .select('*')
        .eq('researcher_id', profile!.id)
        .eq('academic_year_id', selectedAcademicYear!)
      const map: ForecastMap = {}
      ;(data ?? []).forEach((f: Forecast) => { map[f.kpi_key] = f })
      return map
    },
  })

  const { data: realized } = useQuery<Record<string, number>>({
    queryKey: ['realized-values', profile?.id],
    enabled: !!profile?.id,
    queryFn: () => fetchRealizedValues(profile!.id),
  })

  async function saveAll() {
    if (!profile?.id || !selectedAcademicYear) return
    setSaving(true)
    try {
      const upserts = KPI_DEFINITIONS.map((kpi) => {
        const existing = forecastsData?.[kpi.key]
        const edit = edits[kpi.key] ?? {}
        const planned = edit.planned ?? existing?.planned_value ?? 0
        const revision_s1 = edit.revision_s1 ?? existing?.revision_s1_value ?? null
        const realizedVal = realized?.[kpi.key] ?? 0
        const status = getStatus(planned, realizedVal)
        return {
          ...(existing ? { id: existing.id } : {}),
          researcher_id: profile.id,
          academic_year_id: selectedAcademicYear,
          kpi_key: kpi.key,
          planned_value: planned,
          revision_s1_value: revision_s1,
          realized_value: realizedVal,
          gap: realizedVal - planned,
          gap_justification: edit.justification ?? existing?.gap_justification ?? null,
          status,
        }
      })
      await supabase.from('forecasts').upsert(upserts, { onConflict: 'researcher_id,academic_year_id,kpi_key' })
      qc.invalidateQueries({ queryKey: ['forecasts'] })
      setEdits({})
      toast.success('Prévisions et réalisations enregistrées')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    }
    setSaving(false)
  }

  const categories = ['production', 'rayonnement', 'projets', 'formation', 'encadrement', 'prestations']

  if (!selectedAcademicYear) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle size={40} className="text-amber-500 mx-auto mb-3" />
          <p className="text-um6p-navy font-medium">Sélectionnez une année académique</p>
          <p className="text-sm text-um6p-gray-dark">Utilisez le sélecteur en haut de page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('forecasts.title')}</h1>
          <p className="text-sm text-um6p-gray-dark">Les réalisations sont calculées automatiquement depuis vos données</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="btn-primary">
          <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer tout'}
        </button>
      </div>

      {/* Legend */}
      <div className="card p-4 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> Atteint ≥ 100%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400" /> En cours 75–99%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Non atteint &lt; 75%</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-300" /> Non renseigné</span>
        <span className="text-um6p-gray-dark ml-auto">⚡ Les colonnes "Réalisé" sont calculées automatiquement</span>
      </div>

      {categories.map((cat) => {
        const kpis = KPI_DEFINITIONS.filter((k) => k.category === cat || (cat === 'encadrement' && k.category === 'encadrement'))
        if (!kpis.length) return null
        return (
          <div key={cat} className="card overflow-hidden">
            <div className="bg-um6p-green-pale px-5 py-3 border-b border-um6p-border">
              <h3 className="font-semibold text-um6p-navy text-sm">{CATEGORY_LABELS[cat]}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr className="bg-um6p-gray text-xs text-um6p-gray-dark uppercase">
                    <th className="px-4 py-3 text-left font-medium">Indicateur KPI</th>
                    <th className="px-4 py-3 text-center font-medium">Objectif (Prévision)</th>
                    <th className="px-4 py-3 text-center font-medium">Révision S1</th>
                    <th className="px-4 py-3 text-center font-medium bg-green-50 text-green-700">Réalisé (auto ⚡)</th>
                    <th className="px-4 py-3 text-center font-medium">Écart</th>
                    <th className="px-4 py-3 text-center font-medium">Statut</th>
                    <th className="px-4 py-3 text-left font-medium">Justification écart</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((kpi) => {
                    const existing = forecastsData?.[kpi.key]
                    const edit = edits[kpi.key] ?? {}
                    const planned = edit.planned ?? existing?.planned_value ?? 0
                    const revision = edit.revision_s1 ?? existing?.revision_s1_value ?? null
                    const realizedVal = realized?.[kpi.key] ?? 0
                    const gap = realizedVal - planned
                    const status = getStatus(planned, realizedVal)
                    const pct = planned > 0 ? Math.round((realizedVal / planned) * 100) : null

                    return (
                      <tr key={kpi.key} className="border-b border-um6p-border hover:bg-um6p-gray/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-um6p-navy">{kpi.labelFr}</p>
                          {kpi.unit && <p className="text-xs text-um6p-gray-dark">en {kpi.unit}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            className="w-24 px-2 py-1.5 border border-um6p-border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-um6p-green"
                            value={planned}
                            onChange={(e) => setEdits((prev) => ({ ...prev, [kpi.key]: { ...prev[kpi.key], planned: Number(e.target.value) } }))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            className="w-24 px-2 py-1.5 border border-um6p-border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-um6p-green"
                            value={revision ?? ''}
                            placeholder="—"
                            onChange={(e) => setEdits((prev) => ({ ...prev, [kpi.key]: { ...prev[kpi.key], revision_s1: Number(e.target.value) } }))}
                          />
                        </td>
                        <td className="px-4 py-3 bg-green-50/50 text-center">
                          <div>
                            <span className="text-sm font-bold text-green-700">{realizedVal.toLocaleString()}{kpi.unit ? ` ${kpi.unit}` : ''}</span>
                            {pct !== null && <p className="text-xs text-um6p-gray-dark">{pct}%</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-semibold ${gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gap >= 0 ? '+' : ''}{gap.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(status)}`}>
                            {status === 'atteint' ? '✅ Atteint' : status === 'en_cours' ? '🟡 En cours' : status === 'non_atteint' ? '🔴 Non atteint' : '— N/R'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {(Math.abs(gap / (planned || 1) * 100) >= 20 || planned === 0) && (
                            <input
                              type="text"
                              className="w-full px-2 py-1.5 border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50"
                              placeholder={Math.abs(gap / (planned || 1) * 100) >= 20 ? '⚠️ Justification requise (écart ≥ 20%)' : 'Commentaire optionnel'}
                              value={edit.justification ?? existing?.gap_justification ?? ''}
                              onChange={(e) => setEdits((prev) => ({ ...prev, [kpi.key]: { ...prev[kpi.key], justification: e.target.value } }))}
                            />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
