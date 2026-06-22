import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Globe, Mic, BookOpen, Radio } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Communication } from '@/types/database'

const TYPES = [
  { value: 'conference_internationale', label: 'Conférence internationale', icon: Globe },
  { value: 'conference_nationale', label: 'Conférence nationale', icon: Globe },
  { value: 'seminaire', label: 'Séminaire / Webinaire', icon: Mic },
  { value: 'vulgarisation', label: 'Vulgarisation scientifique', icon: BookOpen },
  { value: 'media', label: 'Médias / Presse', icon: Radio },
  { value: 'autre', label: 'Autre', icon: Mic },
]

function CommunicationModal({ item, researcherId, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    comm_type: item?.comm_type ?? 'conference_internationale',
    title: item?.title ?? '',
    event_name: item?.event_name ?? '',
    location: item?.location ?? '',
    country: item?.country ?? '',
    comm_date: item?.comm_date ?? '',
    role: item?.role ?? 'presenter',
    audience_size: item?.audience_size ?? '',
    is_invited: item?.is_invited ?? false,
    is_international: item?.is_international ?? true,
    status: item?.status ?? 'planned',
    document_url: item?.document_url ?? '',
    comment: item?.comment ?? '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, researcher_id: researcherId }
    try {
      if (item) await supabase.from('communications').update(payload).eq('id', item.id)
      else await supabase.from('communications').insert(payload)
      toast.success('Communication enregistrée')
      onSaved()
    } catch { toast.error('Erreur') }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-xl">
        <div className="flex items-center justify-between p-6 border-b border-um6p-border">
          <h2 className="text-lg font-semibold">{item ? 'Modifier' : 'Ajouter'} une communication</h2>
          <button onClick={onClose} className="p-2 hover:bg-um6p-gray rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">Type *</label>
            <select className="input-field" value={form.comm_type} onChange={(e) => set('comm_type', e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Titre de la communication *</label>
            <input required className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label">Nom de l'événement / Conférence</label>
            <input className="input-field" value={form.event_name} onChange={(e) => set('event_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Lieu</label>
              <input className="input-field" value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
            <div>
              <label className="label">Pays</label>
              <input className="input-field" value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.comm_date} onChange={(e) => set('comm_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Rôle</label>
              <select className="input-field" value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="presenter">Présentateur</option>
                <option value="keynote">Keynote speaker</option>
                <option value="panelist">Panéliste</option>
                <option value="chair">Président de session</option>
                <option value="organizer">Organisateur</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Statut</label>
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="planned">Planifié</option>
                <option value="completed">Réalisé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <div>
              <label className="label">Audience estimée</label>
              <input type="number" min={0} className="input-field" value={form.audience_size} onChange={(e) => set('audience_size', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_invited} onChange={(e) => set('is_invited', e.target.checked)} className="w-4 h-4 accent-um6p-green" />
              <span className="text-sm">Communication invitée</span>
            </label>
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
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CommunicationsPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Communication | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: items = [], isLoading } = useQuery<Communication[]>({
    queryKey: ['communications', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('communications').select('*').eq('researcher_id', profile!.id).order('comm_date', { ascending: false })
      return data ?? []
    },
  })

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from('communications').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['communications'] }); toast.success('Supprimé') },
  })

  const filtered = typeFilter === 'all' ? items : items.filter((i) => i.comm_type === typeFilter)

  const stats = {
    total: items.length,
    international: items.filter((i) => i.is_international).length,
    invited: items.filter((i) => i.is_invited).length,
    completed: items.filter((i) => i.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Communications & Rayonnement</h1>
          <p className="text-sm text-um6p-gray-dark">Conférences, séminaires, vulgarisation et médias</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-um6p-navy' },
          { label: 'Internationales', value: stats.international, color: 'text-um6p-green' },
          { label: 'Invitées', value: stats.invited, color: 'text-um6p-gold' },
          { label: 'Réalisées', value: stats.completed, color: 'text-um6p-green' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-um6p-gray-dark mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'all' ? 'bg-um6p-green text-white' : 'bg-um6p-gray text-um6p-gray-dark hover:bg-um6p-green-pale'}`}>
          Tous
        </button>
        {TYPES.map((t) => (
          <button key={t.value} onClick={() => setTypeFilter(t.value)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === t.value ? 'bg-um6p-green text-white' : 'bg-um6p-gray text-um6p-gray-dark hover:bg-um6p-green-pale'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Titre</th>
              <th>Événement</th>
              <th>Pays</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-10">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">Aucune communication enregistrée</td></tr>
            ) : filtered.map((item) => (
              <tr key={item.id} className="table-row">
                <td className="text-xs text-um6p-gray-dark whitespace-nowrap">{item.comm_date}</td>
                <td>
                  <div className="flex items-center gap-1">
                    {item.is_invited && <span className="badge-warning text-xs">Invité</span>}
                    {item.is_international && <span className="badge-info text-xs">Intl.</span>}
                  </div>
                </td>
                <td className="text-sm font-medium text-um6p-navy max-w-xs truncate">{item.title}</td>
                <td className="text-sm text-um6p-gray-dark">{item.event_name}</td>
                <td className="text-sm">{item.country}</td>
                <td><span className="badge-info capitalize">{item.role}</span></td>
                <td><StatusBadge status={item.status ?? 'planned'} /></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(item); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-um6p-gray text-um6p-gray-dark"><Edit2 size={14} /></button>
                    <button onClick={() => { if (confirm('Supprimer ?')) del.mutate(item.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <CommunicationModal
          item={editing}
          researcherId={profile?.id}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['communications', 'dashboard'] }); setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
