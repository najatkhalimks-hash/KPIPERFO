// Supervision page
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Supervision } from '@/types/database'

function SupervisionModal({ supervision, researcherId, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    student_name: supervision?.student_name ?? '',
    supervision_type: supervision?.supervision_type ?? 'doctorant',
    thesis_title: supervision?.thesis_title ?? '',
    program: supervision?.program ?? '',
    co_supervisor: supervision?.co_supervisor ?? '',
    start_date: supervision?.start_date ?? '',
    defense_date: supervision?.defense_date ?? '',
    status: supervision?.status ?? 'in_progress',
    result: supervision?.result ?? '',
    comment: supervision?.comment ?? '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, researcher_id: researcherId }
    if (supervision) { await supabase.from('supervisions').update(payload).eq('id', supervision.id) }
    else { await supabase.from('supervisions').insert(payload) }
    toast.success('Enregistré')
    onSaved()
    setLoading(false)
  }
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-um6p-border">
          <h2 className="text-lg font-semibold">{supervision ? 'Modifier' : 'Ajouter'} un encadrement</h2>
          <button onClick={onClose} className="p-2 hover:bg-um6p-gray rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Nom de l'étudiant *</label><input required className="input-field" value={form.student_name} onChange={(e) => set('student_name', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type</label>
              <select className="input-field" value={form.supervision_type} onChange={(e) => set('supervision_type', e.target.value)}>
                {['doctorant', 'master', 'pfe', 'stage', 'postdoc'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Statut</label>
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {['in_progress', 'defended', 'abandoned', 'completed'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Titre thèse / sujet</label><input className="input-field" value={form.thesis_title} onChange={(e) => set('thesis_title', e.target.value)} /></div>
          <div><label className="label">Programme</label><input className="input-field" value={form.program} onChange={(e) => set('program', e.target.value)} /></div>
          <div><label className="label">Co-encadrant</label><input className="input-field" value={form.co_supervisor} onChange={(e) => set('co_supervisor', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date début</label><input type="date" className="input-field" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} /></div>
            <div><label className="label">Date soutenance</label><input type="date" className="input-field" value={form.defense_date} onChange={(e) => set('defense_date', e.target.value)} /></div>
          </div>
          <div><label className="label">Résultat</label><input className="input-field" value={form.result} onChange={(e) => set('result', e.target.value)} /></div>
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
    queryFn: async () => { const { data } = await supabase.from('supervisions').select('*').eq('researcher_id', profile!.id).order('start_date', { ascending: false }); return data ?? [] },
  })
  const del = useMutation({ mutationFn: async (id: string) => { await supabase.from('supervisions').delete().eq('id', id) }, onSuccess: () => qc.invalidateQueries({ queryKey: ['supervisions'] }) })
  const stats = { total: items.length, phd: items.filter((i) => i.supervision_type === 'doctorant').length, defended: items.filter((i) => i.status === 'defended').length }
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Encadrement</h1><p className="text-sm text-um6p-gray-dark">Doctorants, masters, PFE, stages et postdoctorants</p></div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary"><Plus size={16} /> Ajouter</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total encadrés', value: stats.total, icon: '👥' }, { label: 'Doctorants', value: stats.phd, icon: '🎓' }, { label: 'Soutenus', value: stats.defended, icon: '✅' }].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3"><span className="text-2xl">{s.icon}</span><div><p className="text-2xl font-bold text-um6p-navy">{s.value}</p><p className="text-xs text-um6p-gray-dark">{s.label}</p></div></div>
        ))}
      </div>
      <div className="table-container">
        <table className="table-base">
          <thead className="table-head"><tr><th>Étudiant</th><th>Type</th><th>Sujet</th><th>Programme</th><th>Début</th><th>Soutenance</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={8} className="text-center py-10">Chargement...</td></tr>
              : items.length === 0 ? <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">Aucun encadrement enregistré</td></tr>
              : items.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="font-medium text-um6p-navy text-sm">{item.student_name}</td>
                  <td><span className="badge-info capitalize">{item.supervision_type}</span></td>
                  <td className="text-sm text-um6p-gray-dark max-w-xs truncate">{item.thesis_title}</td>
                  <td className="text-sm">{item.program}</td>
                  <td className="text-xs text-um6p-gray-dark">{item.start_date}</td>
                  <td className="text-xs text-um6p-gray-dark">{item.defense_date}</td>
                  <td><StatusBadge status={item.status ?? 'in_progress'} /></td>
                  <td><div className="flex gap-1">
                    <button onClick={() => { setEditing(item); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-um6p-gray text-um6p-gray-dark"><Edit2 size={14} /></button>
                    <button onClick={() => del.mutate(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {modalOpen && <SupervisionModal supervision={editing} researcherId={profile?.id} onClose={() => { setModalOpen(false); setEditing(null) }} onSaved={() => { qc.invalidateQueries({ queryKey: ['supervisions', 'dashboard'] }); setModalOpen(false); setEditing(null) }} />}
    </div>
  )
}
