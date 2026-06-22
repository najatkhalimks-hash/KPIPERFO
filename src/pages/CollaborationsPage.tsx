// CollaborationsPage
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Globe2, Link2 } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Collaboration } from '@/types/database'

function CollaborationModal({ item, researcherId, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    partner_name: item?.partner_name ?? '',
    partner_type: item?.partner_type ?? 'universite',
    country: item?.country ?? '',
    collaboration_type: item?.collaboration_type ?? 'recherche',
    title: item?.title ?? '',
    start_date: item?.start_date ?? '',
    end_date: item?.end_date ?? '',
    has_convention: item?.has_convention ?? false,
    convention_ref: item?.convention_ref ?? '',
    status: item?.status ?? 'active',
    outcomes: item?.outcomes ?? '',
    comment: item?.comment ?? '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, researcher_id: researcherId }
    try {
      // CORRECTION : Cast as any de la table Supabase pour contourner l'erreur d'assignation 'never'
      const table = supabase.from('collaborations') as any;

      if (item) {
        await table.update(payload).eq('id', item.id)
      } else {
        await table.insert([payload])
      }
      toast.success('Collaboration enregistrée')
      onSaved()
    } catch { 
      toast.error('Erreur lors de l\'enregistrement') 
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-um6p-border">
          <h2 className="text-lg font-semibold">{item ? 'Modifier' : 'Ajouter'} une collaboration</h2>
          <button onClick={onClose} className="p-2 hover:bg-um6p-gray rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">Institution partenaire *</label>
            <input required className="input-field" value={form.partner_name} onChange={(e) => set('partner_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type de partenaire</label>
              <select className="input-field" value={form.partner_type} onChange={(e) => set('partner_type', e.target.value)}>
                {['universite', 'centre_recherche', 'entreprise', 'organisme_international', 'autre'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pays</label>
              <input className="input-field" value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Titre / Objet de la collaboration</label>
            <input className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.collaboration_type} onChange={(e) => set('collaboration_type', e.target.value)}>
                {['recherche', 'co_publication', 'mobilite', 'cotutelle', 'projet_commun', 'autre'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Statut</label>
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="completed">Terminée</option>
                <option value="planned">Planifiée</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date début</label><input type="date" className="input-field" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} /></div>
            <div><label className="label">Date fin</label><input type="date" className="input-field" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} /></div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.has_convention} onChange={(e) => set('has_convention', e.target.checked)} className="w-4 h-4 accent-um6p-green" />
              <span className="text-sm font-medium">Convention signée</span>
            </label>
          </div>
          {form.has_convention && (
            <div><label className="label">Référence convention</label><input className="input-field" value={form.convention_ref} onChange={(e) => set('convention_ref', e.target.value)} /></div>
          )}
          <div><label className="label">Résultats / Outputs</label><textarea rows={2} className="input-field resize-none" value={form.outcomes} onChange={(e) => set('outcomes', e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-2 border-t border-um6p-border">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? '...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CollaborationsPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Collaboration | null>(null)

  const { data: items = [], isLoading } = useQuery<Collaboration[]>({
    queryKey: ['collaborations', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('collaborations').select('*').eq('researcher_id', profile!.id).order('start_date', { ascending: false })
      return (data as Collaboration[]) ?? []
    },
  })

  const del = useMutation({
    mutationFn: async (id: string) => { 
      await (supabase.from('collaborations') as any).delete().eq('id', id) 
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collaborations'] }); toast.success('Supprimé') },
  })

  // CORRECTION : Cast as any[] pour sécuriser le filtrage des KPIs et éviter le plantage en cas d'inférence instable
  const itemsData = items as any[];
  const stats = {
    total: itemsData.length,
    international: itemsData.filter((i) => i.country && i.country.toLowerCase() !== 'maroc' && i.country.toLowerCase() !== 'morocco').length,
    active: itemsData.filter((i) => i.status === 'active').length,
    withConvention: itemsData.filter((i) => i.has_convention).length,
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Collaborations & Partenariats</h1>
          <p className="text-sm text-um6p-gray-dark">Coopérations nationales et internationales</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Actives', value: stats.active },
          { label: 'Internationales', value: stats.international },
          { label: 'Avec convention', value: stats.withConvention },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-bold text-um6p-navy">{s.value}</p>
            <p className="text-xs text-um6p-gray-dark mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            <tr><th>Partenaire</th><th>Type</th><th>Pays</th><th>Objet</th><th>Période</th><th>Convention</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={8} className="text-center py-10">Chargement...</td></tr>
              : items.length === 0 ? <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">Aucune collaboration enregistrée</td></tr>
              : items.map((item) => (
                <tr key={item.id} className="table-row">
                  <td className="text-sm font-medium text-um6p-navy">{item.partner_name}</td>
                  <td><span className="badge-info capitalize">{item.partner_type}</span></td>
                  <td className="text-sm">{item.country}</td>
                  <td className="text-sm text-um6p-gray-dark max-w-xs truncate">{item.title}</td>
                  <td className="text-xs text-um6p-gray-dark">{item.start_date} → {item.end_date}</td>
                  <td>{item.has_convention ? <span className="text-um6p-green text-xs font-semibold">✓ Oui</span> : <span className="text-um6p-gray-dark text-xs">Non</span>}</td>
                  <td><StatusBadge status={item.status ?? 'active'} /></td>
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
        <CollaborationModal item={editing} researcherId={profile?.id} onClose={() => { setModalOpen(false); setEditing(null) }} onSaved={() => { qc.invalidateQueries({ queryKey: ['collaborations', 'dashboard'] }); setModalOpen(false); setEditing(null) }} />
      )}
    </div>
  )
}

export default CollaborationsPage
