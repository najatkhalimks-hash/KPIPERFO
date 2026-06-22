import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Search, RefreshCw, ExternalLink, Trash2, Edit2, Upload } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import PublicationModal from '@/components/modules/PublicationModal'
import type { Publication } from '@/types/database'

export default function PublicationsPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Publication | null>(null)

  const { data: publications = [], isLoading } = useQuery<Publication[]>({
    queryKey: ['publications', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('researcher_id', profile!.id)
        .order('year', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('publications').delete().eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publications'] })
      toast.success('Publication supprimée')
    },
  })

  const filtered = publications.filter((p) => {
    const matchSearch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.authors?.toLowerCase().includes(search.toLowerCase()) ||
      p.journal?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.publication_stage === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total: publications.length,
    published: publications.filter((p) => p.publication_stage === 'published').length,
    citations: publications.reduce((s, p) => s + (p.citation_count ?? 0), 0),
    q1q2: publications.filter((p) => p.quartile === 'Q1' || p.quartile === 'Q2').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('publications.title')}</h1>
          <p className="text-sm text-um6p-gray-dark">Format Scopus — Import CSV disponible</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus size={16} /> {t('publications.add')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: '📄' },
          { label: 'Publiées', value: stats.published, icon: '✅' },
          { label: 'Citations', value: stats.citations, icon: '🔗' },
          { label: 'Q1/Q2', value: stats.q1q2, icon: '⭐' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold text-um6p-navy">{s.value}</p>
              <p className="text-xs text-um6p-gray-dark">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-um6p-gray-dark" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, revue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-auto">
          <option value="all">Tous les statuts</option>
          <option value="published">Publiées</option>
          <option value="accepted">Acceptées</option>
          <option value="submitted">Soumises</option>
          <option value="draft">Brouillon</option>
        </select>
        <span className="text-sm text-um6p-gray-dark">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            <tr>
              <th>Titre</th>
              <th>Journal</th>
              <th>Année</th>
              <th>Statut</th>
              <th>Q.</th>
              <th>Citations</th>
              <th>OA</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">
                {search ? 'Aucun résultat' : 'Aucune publication. Cliquez sur "Ajouter" pour commencer.'}
              </td></tr>
            ) : filtered.map((pub) => (
              <tr key={pub.id} className="table-row">
                <td className="max-w-xs">
                  <div>
                    <p className="font-medium text-um6p-navy line-clamp-2 text-sm">{pub.title}</p>
                    <p className="text-xs text-um6p-gray-dark truncate">{pub.authors}</p>
                  </div>
                </td>
                <td className="text-sm text-um6p-gray-dark max-w-32 truncate">{pub.journal}</td>
                <td className="text-sm font-medium">{pub.year}</td>
                <td><StatusBadge status={pub.publication_stage ?? 'draft'} /></td>
                <td>
                  {pub.quartile && (
                    <span className={`badge-${pub.quartile === 'Q1' || pub.quartile === 'Q2' ? 'success' : 'info'}`}>
                      {pub.quartile}
                    </span>
                  )}
                </td>
                <td className="text-sm font-semibold text-um6p-navy">{pub.citation_count ?? 0}</td>
                <td>{pub.is_open_access && <span className="text-green-600 text-xs font-medium">OA</span>}</td>
                <td>
                  <div className="flex items-center gap-1">
                    {pub.doi && (
                      <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-um6p-gray text-um6p-gray-dark" title="Voir DOI">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button onClick={() => { setEditing(pub); setModalOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-um6p-gray text-um6p-gray-dark">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => {
                      if (confirm(t('common.confirm_delete'))) deleteMutation.mutate(pub.id)
                    }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <PublicationModal
          publication={editing}
          researcherId={profile?.id}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['publications'] })
            qc.invalidateQueries({ queryKey: ['dashboard'] })
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
