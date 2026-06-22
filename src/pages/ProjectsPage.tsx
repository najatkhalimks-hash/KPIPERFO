import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, TrendingUp } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import ProjectModal from '@/components/modules/ProjectModal'
import type { Project } from '@/types/database'

export default function ProjectsPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [filter, setFilter] = useState('all')

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*').eq('researcher_id', profile!.id).order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('projects').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Projet supprimé') },
  })

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter)

  const stats = {
    total: projects.length,
    obtained: projects.filter((p) => ['obtained', 'active', 'completed'].includes(p.status ?? '')).length,
    budget: projects.filter((p) => ['obtained', 'active', 'completed'].includes(p.status ?? '')).reduce((s, p) => s + (p.um6p_budget ?? 0), 0),
    intl: projects.filter((p) => p.is_international).length,
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('projects.title')}</h1>
          <p className="text-sm text-um6p-gray-dark">Suivi financement, rôles & indicateurs de succès</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={16} /> {t('projects.add')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total projets', value: stats.total, icon: '📁' },
          { label: 'Projets obtenus', value: stats.obtained, icon: '✅' },
          { label: 'Budget UM6P (MAD)', value: stats.budget.toLocaleString(), icon: '💰' },
          { label: 'Internationaux', value: stats.intl, icon: '🌍' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xl font-bold text-um6p-navy">{s.value}</p>
              <p className="text-xs text-um6p-gray-dark">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex gap-2 flex-wrap">
        {['all', 'idea', 'submitted', 'obtained', 'active', 'completed', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-um6p-green text-white' : 'bg-um6p-gray text-um6p-gray-dark hover:bg-um6p-green-pale'}`}>
            {s === 'all' ? 'Tous' : t(`status.${s}`)}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            <tr>
              <th>Titre</th>
              <th>Type / Rôle</th>
              <th>Statut</th>
              <th>Financeur</th>
              <th>Budget UM6P (MAD)</th>
              <th>Période</th>
              <th>Intl.</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-10">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">
                {filter === 'all' ? 'Aucun projet. Ajoutez votre premier projet.' : 'Aucun projet dans cette catégorie.'}
              </td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="max-w-xs">
                  <p className="font-medium text-um6p-navy text-sm line-clamp-2">{p.title}</p>
                </td>
                <td className="text-sm">
                  <p className="text-um6p-gray-dark">{p.type}</p>
                  <p className="text-xs font-medium">{p.role}</p>
                </td>
                <td><StatusBadge status={p.status ?? 'idea'} /></td>
                <td className="text-sm text-um6p-gray-dark">{p.funder}</td>
                <td className="text-sm font-semibold text-um6p-navy">
                  {p.um6p_budget ? p.um6p_budget.toLocaleString() : '—'}
                </td>
                <td className="text-xs text-um6p-gray-dark">
                  {p.start_date} {p.end_date && `→ ${p.end_date}`}
                </td>
                <td>{p.is_international && <span className="text-lg">🌍</span>}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(p); setModalOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-um6p-gray text-um6p-gray-dark">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => { if (confirm(t('common.confirm_delete'))) deleteMutation.mutate(p.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ProjectModal
          project={editing}
          researcherId={profile?.id}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['projects', 'dashboard'] }); setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
