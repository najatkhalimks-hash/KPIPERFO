import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Service } from '@/types/database'

const SERVICE_TYPES = [
  { value: 'expertise', label: 'Expertise / Conseil' },
  { value: 'analyse', label: 'Analyse & Tests' },
  { value: 'formation', label: 'Formation sur mesure' },
  { value: 'etude', label: 'Étude / Recherche contractuelle' },
  { value: 'audit', label: 'Audit technique' },
  { value: 'autre', label: 'Autre prestation' },
]

interface ServiceModalProps {
  item: Service | null
  researcherId: string | undefined
  onClose: () => void
  onSaved: () => void
}

function ServiceModal({ item, researcherId, onClose, onSaved }: ServiceModalProps) {
  const [form, setForm] = useState({
    title: item?.title ?? '',
    service_type: item?.service_type ?? 'expertise',
    client_name: item?.client_name ?? '',
    client_type: item?.client_type ?? 'entreprise',
    start_date: item?.start_date ?? '',
    end_date: item?.end_date ?? '',
    contract_amount: item?.contract_amount ? String(item.contract_amount) : '',
    um6p_share: item?.um6p_share ? String(item.um6p_share) : '',
    status: item?.status ?? 'active',
    deliverables: item?.deliverables ?? '',
    team_members: item?.team_members ?? '',
    comment: item?.comment ?? '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!researcherId) return
    setLoading(true)
    
    const payload = {
      title: form.title,
      service_type: form.service_type,
      client_name: form.client_name,
      client_type: form.client_type,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      contract_amount: form.contract_amount ? Number(form.contract_amount) : null,
      um6p_share: form.um6p_share ? Number(form.um6p_share) : null,
      status: form.status,
      deliverables: form.deliverables || null,
      team_members: form.team_members || null,
      comment: form.comment || null,
      researcher_id: researcherId,
    }

    try {
      if (item?.id) {
        await (supabase.from('services') as any).update(payload).eq('id', item.id)
      } else {
        await (supabase.from('services') as any).insert([payload])
      }
      toast.success('Prestation enregistrée')
      onSaved()
    } catch (error) {
      toast.error('Erreur lors de l’enregistrement') 
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-xl">
        <div className="flex items-center justify-between p-6 border-b border-um6p-border">
          <h2 className="text-lg font-semibold">{item ? 'Modifier' : 'Ajouter'} une prestation</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-um6p-gray rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="label">Intitulé de la prestation *</label>
            <input required className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type de prestation</label>
              <select className="input-field" value={form.service_type} onChange={(e) => set('service_type', e.target.value)}>
                {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Statut</label>
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="proposal">Planifiée</option>
                <option value="active">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Client / Partenaire *</label>
              <input required className="input-field" value={form.client_name} onChange={(e) => set('client_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Type de client</label>
              <select className="input-field" value={form.client_type} onChange={(e) => set('client_type', e.target.value)}>
                <option value="entreprise">Entreprise privée</option>
                <option value="public">Organisme public</option>
                <option value="ngo">ONG / Association</option>
                <option value="international">Organisation internationale</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date début</label>
              <input type="date" className="input-field" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Date fin</label>
              <input type="date" className="input-field" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Montant contrat (MAD)</label>
              <input type="number" min={0} className="input-field" value={form.contract_amount} onChange={(e) => set('contract_amount', e.target.value)} />
            </div>
            <div>
              <label className="label">Part UM6P (MAD)</label>
              <input type="number" min={0} className="input-field" value={form.um6p_share} onChange={(e) => set('um6p_share', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Livrables attendus</label>
            <textarea rows={2} className="input-field resize-none" value={form.deliverables} onChange={(e) => set('deliverables', e.target.value)} />
          </div>
          <div>
            <label className="label">Membres de l'équipe</label>
            <input className="input-field" placeholder="Nom, Prénom, ..." value={form.team_members} onChange={(e) => set('team_members', e.target.value)} />
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

export default function ServicesPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)

  const { data: items = [], isLoading } = useQuery<Service[]>({
    queryKey: ['services', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('researcher_id', profile!.id)
        .order('start_date', { ascending: false })
      return (data as Service[]) ?? []
    },
  })

  const del = useMutation({
    mutationFn: async (id: string) => { 
      await (supabase.from('services') as any).delete().eq('id', id) 
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Supprimé') 
    },
  })

  const itemsData = items as any[]

  const totalRevenue = itemsData.reduce((s, i) => s + (Number(i.contract_amount) || 0), 0)
  const um6pRevenue = itemsData.reduce((s, i) => s + (Number(i.um6p_share) || 0), 0)

  const formatMAD = (v: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Prestations & Contrats</h1>
          <p className="text-sm text-um6p-gray-dark">Expertises, consultances et recherche contractuelle</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total prestations', value: itemsData.length, fmt: false },
          { label: 'En cours', value: itemsData.filter((i) => i.status === 'active').length, fmt: false },
          { label: 'CA total', value: totalRevenue, fmt: true },
          { label: 'Part UM6P', value: um6pRevenue, fmt: true },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-bold text-um6p-navy">{s.fmt ? formatMAD(s.value as number) : s.value}</p>
            <p className="text-xs text-um6p-gray-dark mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            <tr>
              <th>Intitulé</th>
              <th>Type</th>
              <th>Client</th>
              <th>Période</th>
              <th>Montant</th>
              <th>Part UM6P</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-10">Chargement...</td></tr>
            ) : itemsData.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">Aucune prestation enregistrée</td></tr>
            ) : itemsData.map((item) => (
              <tr key={item.id} className="table-row">
                <td className="text-sm font-medium text-um6p-navy max-w-xs truncate">{item.title}</td>
                <td><span className="badge-info capitalize">{SERVICE_TYPES.find(t => t.value === item.service_type)?.label ?? item.service_type}</span></td>
                <td className="text-sm">{item.client_name}</td>
                <td className="text-xs text-um6p-gray-dark whitespace-nowrap">
                  {item.start_date ? new Date(item.start_date).toLocaleDateString('fr-FR') : '-'} → {item.end_date ? new Date(item.end_date).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td className="text-sm font-semibold text-um6p-navy">{item.contract_amount ? formatMAD(Number(item.contract_amount)) : '-'}</td>
                <td className="text-sm text-um6p-green font-semibold">{item.um6p_share ? formatMAD(Number(item.um6p_share)) : '-'}</td>
                <td><StatusBadge status={item.status ?? 'active'} /></td>
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
        <ServiceModal
          item={editing}
          researcherId={profile?.id}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['services', 'dashboard'] }); setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
