import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, Shield, FileText, Award } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Patent } from '@/types/database'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'filed', label: 'Déposé' },
  { value: 'pending', label: 'En examen' },
  { value: 'granted', label: 'Accordé' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'expired', label: 'Expiré' },
]

const TYPE_OPTIONS = [
  { value: 'brevet', label: 'Brevet d\'invention' },
  { value: 'marque', label: 'Marque déposée' },
  { value: 'logiciel', label: 'Logiciel / Copyright' },
  { value: 'modele_utilite', label: 'Modèle d\'utilité' },
  { value: 'autre', label: 'Autre PI' },
]

interface PatentModalProps {
  item: Patent | null
  researcherId: string | undefined
  onClose: () => void
  onSaved: () => void
}

function PatentModal({ item, researcherId, onClose, onSaved }: PatentModalProps) {
  // Cast temporaire en any pour éviter les frictions sur les propriétés de l'objet
  const itemData = item as any

  const [form, setForm] = useState({
    title: itemData?.title ?? '',
    patent_type: itemData?.patent_type ?? 'brevet',
    reference_number: itemData?.reference_number ?? '',
    filing_date: itemData?.filing_date ?? '',
    grant_date: itemData?.grant_date ?? '',
    expiry_date: itemData?.expiry_date ?? '',
    country: itemData?.country ?? '',
    inventors: itemData?.inventors ?? '',
    assignee: itemData?.assignee ?? 'UM6P',
    status: itemData?.status ?? 'filed',
    valorization: itemData?.valorization ?? '',
    licensing_revenue: itemData?.licensing_revenue ? String(itemData.licensing_revenue) : '',
    comment: itemData?.comment ?? '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!researcherId) return
    setLoading(true)

    const payload = {
      ...form,
      licensing_revenue: form.licensing_revenue ? Number(form.licensing_revenue) : null,
      researcher_id: researcherId,
    }

    try {
      // Cast explicite de la table pour briser l'erreur d'inférence stricte 'never' de Supabase
      const table = supabase.from('patents') as any
      if (item?.id) {
        await table.update(payload).eq('id', item.id)
      } else {
        await table.insert([payload])
      }
      toast.success('PI enregistrée avec succès')
      onSaved()
    } catch { 
      toast.error('Erreur lors de l’enregistrement') 
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-xl">
        <div className="flex items-center justify-between p-6 border-b border-um6p-border">
          <h2 className="text-lg font-semibold">{item ? 'Modifier' : 'Ajouter'} un titre de PI</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-um6p-gray rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type *</label>
              <select className="input-field" value={form.patent_type} onChange={(e) => set('patent_type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
            <label className="label">Titre de l'invention *</label>
            <input required className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Numéro de référence</label>
              <input className="input-field" placeholder="ex: MA12345" value={form.reference_number} onChange={(e) => set('reference_number', e.target.value)} />
            </div>
            <div>
              <label className="label">Pays / Juridiction</label>
              <input className="input-field" value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Date dépôt</label>
              <input type="date" className="input-field" value={form.filing_date} onChange={(e) => set('filing_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Date accord</label>
              <input type="date" className="input-field" value={form.grant_date} onChange={(e) => set('grant_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Date expiration</label>
              <input type="date" className="input-field" value={form.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Inventeurs (séparés par virgule)</label>
            <input className="input-field" placeholder="Nom Prénom, Nom Prénom..." value={form.inventors} onChange={(e) => set('inventors', e.target.value)} />
          </div>
          <div>
            <label className="label">Titulaire</label>
            <input className="input-field" value={form.assignee} onChange={(e) => set('assignee', e.target.value)} />
          </div>
          <div>
            <label className="label">Valorisation / Applications industrielles</label>
            <textarea rows={2} className="input-field resize-none" value={form.valorization} onChange={(e) => set('valorization', e.target.value)} />
          </div>
          <div>
            <label className="label">Revenus de licences (MAD)</label>
            <input type="number" min={0} className="input-field" value={form.licensing_revenue} onChange={(e) => set('licensing_revenue', e.target.value)} />
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

export default function PatentsPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Patent | null>(null)

  const { data: items = [], isLoading } = useQuery<Patent[]>({
    queryKey: ['patents', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('patents')
        .select('*')
        .eq('researcher_id', profile!.id)
        .order('filing_date', { ascending: false })
      return (data as Patent[]) ?? []
    },
  })

  const del = useMutation({
    mutationFn: async (id: string) => { 
      // CORRECTION : Cast de la table en any pour court-circuiter les types stricts de Supabase sur le delete
      await (supabase.from('patents') as any).delete().eq('id', id) 
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['patents'] })
      toast.success('Supprimé') 
    },
  })

  // CORRECTION : Cast systématique des objets de la liste en any pour fluidifier le filtrage et l'affichage des métriques
  const itemsData = items as any[]
  
  const stats = {
    total: itemsData.length,
    granted: itemsData.filter((i) => i.status === 'granted').length,
    pending: itemsData.filter((i) => ['filed', 'pending'].includes(i.status ?? '')).length,
    brevets: itemsData.filter((i) => i.patent_type === 'brevet').length,
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Propriété Intellectuelle</h1>
          <p className="text-sm text-um6p-gray-dark">Brevets, marques, logiciels et droits de propriété</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total PI', value: stats.total, icon: Shield, color: 'text-um6p-navy' },
          { label: 'Accordés', value: stats.granted, icon: Award, color: 'text-um6p-green' },
          { label: 'En cours', value: stats.pending, icon: FileText, color: 'text-um6p-gold' },
          { label: 'Brevets', value: stats.brevets, icon: Shield, color: 'text-um6p-navy' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-um6p-gray ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-um6p-gray-dark">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            <tr>
              <th>Type</th>
              <th>Titre</th>
              <th>Référence</th>
              <th>Pays</th>
              <th>Date dépôt</th>
              <th>Titulaire</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-10">Chargement...</td></tr>
            ) : itemsData.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">Aucun titre de PI enregistré</td></tr>
            ) : itemsData.map((item) => (
              <tr key={item.id} className="table-row">
                <td><span className="badge-info capitalize">{TYPE_OPTIONS.find(t => t.value === item.patent_type)?.label ?? item.patent_type}</span></td>
                <td className="text-sm font-medium text-um6p-navy max-w-xs truncate">{item.title}</td>
                <td className="text-xs font-mono text-um6p-gray-dark">{item.reference_number}</td>
                <td className="text-sm">{item.country}</td>
                <td className="text-xs text-um6p-gray-dark">{item.filing_date}</td>
                <td className="text-sm">{item.assignee}</td>
                <td><StatusBadge status={item.status ?? 'filed'} /></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(item); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-um6p-gray text-um6p-gray-dark"><Edit2 size={14} /></button>
                    <button onClick={() => { if (item.id && confirm('Supprimer ?')) del.mutate(item.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <PatentModal
          item={editing}
          researcherId={profile?.id}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['patents', 'dashboard'] }); setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
