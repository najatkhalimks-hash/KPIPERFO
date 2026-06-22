// Supervision page
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Supervision } from '@/types/database'

const SUPERVISION_TYPES = [
  { value: 'doctorant', label: 'Doctorant' },
  { value: 'master', label: 'Master' },
  { value: 'pfe', label: 'PFE' },
  { value: 'stage', label: 'Stage' },
  { value: 'postdoc', label: 'Post-doctorant' },
]

const STATUS_OPTIONS = [
  { value: 'in_progress', label: 'En cours' },
  { value: 'defended', label: 'Soutenu' },
  { value: 'completed', label: 'Terminé' },
  { value: 'abandoned', label: 'Abandonné' },
]

interface SupervisionModalProps {
  supervision: Supervision | null
  researcherId: string | undefined
  onClose: () => void
  onSaved: () => void
}

function SupervisionModal({ supervision, researcherId, onClose, onSaved }: SupervisionModalProps) {
  const supData = supervision as any

  const [form, setForm] = useState({
    student_name: supData?.student_name ?? '',
    supervision_type: supData?.supervision_type ?? 'doctorant',
    thesis_title: supData?.thesis_title ?? '',
    program: supData?.program ?? '',
    co_supervisor: supData?.co_supervisor ?? '',
    start_date: supData?.start_date ?? '',
    defense_date: supData?.defense_date ?? '',
    status: supData?.status ?? 'in_progress',
    result: supData?.result ?? '',
    comment: supData?.comment ?? '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!researcherId) return
    setLoading(true)

    const payload = {
      student_name: form.student_name,
      supervision_type: form.supervision_type,
      thesis_title: form.thesis_title || null,
      program: form.program || null,
      co_supervisor: form.co_supervisor || null,
      start_date: form.start_date || null,
      defense_date: form.defense_date || null,
      status: form.status,
      result: form.result || null,
      comment: form.comment || null,
      researcher_id: researcherId,
    }

    try {
      if (supervision?.id) { 
        await (supabase.from('supervisions') as any).update(payload).eq('id', supervision.id) 
      } else { 
        await (supabase.from('supervisions') as any).insert([payload]) 
      }
      toast.success('Encadrement enregistré')
      onSaved()
    } catch {
      toast.error('Erreur lors de l’enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-um6p-border">
          <h2 className="text-lg font-semibold">{supervision ? 'Modifier' : 'Ajouter'} un encadrement</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-um6p-gray rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">Nom de l'étudiant *</label>
            <input required className="input-field" value={form.student_name} onChange={(e) => set('student_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.supervision_type} onChange={(e) => set('supervision_type', e.target.value)}>
                {SUPERVISION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Statut</label>
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Titre thèse / sujet</label>
            <input className="input-field" value={form.thesis_title} onChange={(e) => set('thesis_title', e.target.value)} />
          </div>
          <div>
            <label className="label">Programme / Filière</label>
            <input className="input-field" value={form.program} onChange={(e) => set('program', e.target.value)} />
          </div>
          <div>
            <label className="label">Co-encadrant (si applicable)</label>
            <input className="input-field" value={form.co_supervisor} onChange={(e) => set('co_supervisor', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date début</label>
              <input type="date" className="input-field" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Date soutenance / fin</label>
              <input type="date" className="input-field" value={form.defense_date} onChange={(e) => set('defense_date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Résultat / Note / Mention</label>
            <input className="input-field" value={form.result} onChange={(e) => set('result', e.target.value)} />
          </div>
          <div>
            <label className="label">Commentaire ou Remarque</label>
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

export default function SupervisionPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supervision | null>(null)

  const { data: items = [], isLoading } = useQuery<Supervision[]>({
    queryKey: ['supervisions', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => { 
      const { data } = await supabase
        .from('supervisions')
        .select('*')
        .eq('researcher_id', profile!.id)
        .order('start_date', { ascending: false })
      return (data as Supervision[]) ?? [] 
    },
  })

  const del = useMutation({ 
    mutationFn: async (id: string) => { 
      await (supabase.from('supervisions') as any).delete().eq('id', id) 
    }, 
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supervisions'] })
      toast.success('Supprimé avec succès')
    }
  })

  const itemsData = items as any[]

  const stats = { 
    total: itemsData.length, 
    phd: itemsData.filter((i) => i.supervision_type === 'doctorant').length, 
    defended: itemsData.filter((i) => i.status === 'defended').length 
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Encadrement</h1>
          <p className="text-sm text-um6p-gray-dark">Doctorants, masters, PFE, stages et postdoctorants</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total encadrés', value: stats.total, icon: '👥' }, 
          { label: 'Doctorants', value: stats.phd, icon: '🎓' }, 
          { label: 'Soutenus', value: stats.defended, icon: '✅' }
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

      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            <tr>
              <th>Étudiant</th>
              <th>Type</th>
              <th>Sujet</th>
              <th>Programme</th>
              <th>Début</th>
              <th>Soutenance</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-10">Chargement...</td></tr>
            ) : itemsData.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">Aucun encadrement enregistré</td></tr>
            ) : itemsData.map((item) => (
              <tr key={item.id} className="table-row">
                <td className="font-medium text-um6p-navy text-sm">{item.student_name}</td>
                <td><span className="badge-info capitalize">{SUPERVISION_TYPES.find(t => t.value === item.supervision_type)?.label ?? item.supervision_type}</span></td>
                <td className="text-sm text-um6p-gray-dark max-w-xs truncate" title={item.thesis_title}>{item.thesis_title ?? '-'}</td>
                <td className="text-sm">{item.program ?? '-'}</td>
                <td className="text-xs text-um6p-gray-dark">{item.start_date ?? '-'}</td>
                <td className="text-xs text-um6p-gray-dark">{item.defense_date ?? '-'}</td>
                <td><StatusBadge status={item.status ?? 'in_progress'} /></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(item); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-um6p-gray text-um6p-gray-dark"><Edit2 size={14} /></button>
                    <button onClick={() => { if (item.id && confirm('Supprimer cet encadrement ?')) del.mutate(item.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <SupervisionModal 
          supervision={editing} 
          researcherId={profile?.id} 
          onClose={() => { setModalOpen(false); setEditing(null) }} 
          onSaved={() => { qc.invalidateQueries({ queryKey: ['supervisions', 'dashboard'] }); setModalOpen(false); setEditing(null) }} 
        />
      )}
    </div>
  )
}
