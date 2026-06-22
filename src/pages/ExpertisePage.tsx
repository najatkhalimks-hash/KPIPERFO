import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Star } from 'lucide-react'
import type { Expertise } from '@/types/database'

const EXPERTISE_TYPES = [
  { value: 'jury_these', label: 'Jury de thèse' },
  { value: 'jury_habilitation', label: 'Jury HDR' },
  { value: 'evaluation_projet', label: 'Évaluation de projet' },
  { value: 'comite_scientifique', label: 'Comité scientifique' },
  { value: 'expertise_revue', label: 'Expertise revue / peer-review' },
  { value: 'commission_nationale', label: 'Commission nationale' },
  { value: 'expertise_institutionnelle', label: 'Expertise institutionnelle' },
  { value: 'prix_distinctions', label: 'Prix & Distinctions' },
  { value: 'autre', label: 'Autre' },
]

function ExpertiseModal({ item, researcherId, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    expertise_type: item?.expertise_type ?? 'expertise_revue',
    title: item?.title ?? '',
    organization: item?.organization ?? '',
    country: item?.country ?? '',
    expertise_date: item?.expertise_date ?? '',
    role: item?.role ?? '',
    is_international: item?.is_international ?? false,
    nb_reviews: item?.nb_reviews ?? 1,
    comment: item?.comment ?? '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, researcher_id: researcherId }
    try {
      if (item) await supabase.from('expertise_activities').update(payload).eq('id', item.id)
      else await supabase.from('expertise_activities').insert(payload)
      toast.success('Expertise enregistrée')
      onSaved()
    } catch { toast.error('Erreur') }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-um6p-border">
          <h2 className="text-lg font-semibold">{item ? 'Modifier' : 'Ajouter'} une activité d'expertise</h2>
          <button onClick={onClose} className="p-2 hover:bg-um6p-gray rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">Type d'expertise *</label>
            <select className="input-field" value={form.expertise_type} onChange={(e) => set('expertise_type', e.target.value)}>
              {EXPERTISE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Intitulé / Description *</label>
            <input required className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Organisation / Revue</label>
              <input className="input-field" value={form.organization} onChange={(e) => set('organization', e.target.value)} />
            </div>
            <div>
              <label className="label">Pays</label>
              <input className="input-field" value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.expertise_date} onChange={(e) => set('expertise_date', e.target.value)} />
            </div>
            {form.expertise_type === 'expertise_revue' && (
              <div>
                <label className="label">Nb. d'articles évalués</label>
                <input type="number" min={1} className="input-field" value={form.nb_reviews} onChange={(e) => set('nb_reviews', Number(e.target.value))} />
              </div>
            )}
          </div>
          <div>
            <label className="label">Rôle / Fonction</label>
            <input className="input-field" placeholder="ex: Membre jury, Rapporteur..." value={form.role} onChange={(e) => set('role', e.target.value)} />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_international} onChange={(e) => set('is_international', e.target.checked)} className="w-4 h-4 accent-um6p-green" />
              <span className="text-sm">Internationale</span>
            </label>
          </div>
          <div>
            <label className="label">Commentaire</label>
            <textarea rows={2} className="input-field resize-none" value={form.comment} onChange={(e) => set('comment', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-um6p-border">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? '...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ExpertisePage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expertise | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: items = [], isLoading } = useQuery<Expertise[]>({
    queryKey: ['expertise_activities', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('expertise_activities').select('*').eq('researcher_id', profile!.id).order('expertise_date', { ascending: false })
      return data ?? []
    },
  })

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from('expertise_activities').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expertise_activities'] }); toast.success('Supprimé') },
  })

  const filtered = typeFilter === 'all' ? items : items.filter((i) => i.expertise_type === typeFilter)

  const stats = {
    total: items.length,
    international: items.filter((i) => i.is_international).length,
    reviews: items.filter((i) => i.expertise_type === 'expertise_revue').reduce((s, i) => s + (i.nb_reviews ?? 1), 0),
    jurys: items.filter((i) => ['jury_these', 'jury_habilitation'].includes(i.expertise_type ?? '')).length,
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expertise & Responsabilités</h1>
          <p className="text-sm text-um6p-gray-dark">Jurys, comités scientifiques, peer-review et distinctions</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total activités', value: stats.total },
          { label: 'Internationales', value: stats.international },
          { label: 'Articles évalués', value: stats.reviews },
          { label: 'Jurys', value: stats.jurys },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-bold text-um6p-navy">{s.value}</p>
            <p className="text-xs text-um6p-gray-dark mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'all' ? 'bg-um6p-green text-white' : 'bg-um6p-gray text-um6p-gray-dark hover:bg-um6p-green-pale'}`}>Tous</button>
        {EXPERTISE_TYPES.map((t) => (
          <button key={t.value} onClick={() => setTypeFilter(t.value)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === t.value ? 'bg-um6p-green text-white' : 'bg-um6p-gray text-um6p-gray-dark hover:bg-um6p-green-pale'}`}>{t.label}</button>
        ))}
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            <tr><th>Date</th><th>Type</th><th>Intitulé</th><th>Organisation</th><th>Pays</th><th>Rôle</th><th>Intl.</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={8} className="text-center py-10">Chargement...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">Aucune activité d'expertise enregistrée</td></tr>
              : filtered.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="text-xs text-um6p-gray-dark whitespace-nowrap">{item.expertise_date}</td>
                  <td><span className="badge-info">{EXPERTISE_TYPES.find(t => t.value === item.expertise_type)?.label ?? item.expertise_type}</span></td>
                  <td className="text-sm font-medium text-um6p-navy max-w-xs truncate">{item.title}</td>
                  <td className="text-sm text-um6p-gray-dark">{item.organization}</td>
                  <td className="text-sm">{item.country}</td>
                  <td className="text-xs text-um6p-gray-dark">{item.role}</td>
                  <td>{item.is_international ? <Star size={14} className="text-um6p-gold fill-um6p-gold" /> : null}</td>
                  <td><div className="flex gap-1">
                    <button onClick={() => { setEditing(item); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-um6p-gray text-um6p-gray-dark"><Edit2 size={14} /></button>
                    <button onClick={() => { if (confirm('Supprimer ?')) del.mutate(item.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ExpertiseModal item={editing} researcherId={profile?.id} onClose={() => { setModalOpen(false); setEditing(null) }} onSaved={() => { qc.invalidateQueries({ queryKey: ['expertise_activities', 'dashboard'] }); setModalOpen(false); setEditing(null) }} />
      )}
    </div>
  )
}
