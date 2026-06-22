import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { Project } from '@/types/database'

interface Props { 
  project?: Project | null
  researcherId?: string
  onClose: () => void
  onSaved: () => void 
}

export default function ProjectModal({ project, researcherId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    title: '', 
    type: '', 
    role: 'PI', 
    status: 'submitted', 
    funder: '',
    total_budget: '', 
    um6p_share_pct: 100, 
    um6p_budget: '',
    start_date: '', 
    end_date: '', 
    is_international: false, 
    comment: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title ?? '',
        type: project.type ?? '',
        role: project.role ?? 'PI',
        status: project.status ?? 'submitted',
        funder: project.funder ?? '',
        total_budget: String(project.total_budget ?? ''),
        um6p_share_pct: project.um6p_share_pct ?? 100,
        um6p_budget: String(project.um6p_budget ?? ''),
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
        is_international: project.is_international ?? false,
        comment: project.comment ?? '',
      })
    }
  }, [project])

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  // Auto-calculate UM6P budget
  const calcBudget = (total: string, pct: number) => {
    const t = parseFloat(total)
    if (!isNaN(t)) {
      set('um6p_budget', String(Math.round((t * pct) / 100)))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      ...form,
      researcher_id: researcherId,
      total_budget: form.total_budget ? parseFloat(form.total_budget) : null,
      um6p_budget: form.um6p_budget ? parseFloat(form.um6p_budget) : null,
    }

    try {
      // CORRECTION TS2345 : Cast as any de la table pour éliminer le blocage strict sur le payload (never/never[])
      const table = supabase.from('projects') as any

      if (project?.id) {
        await table.update(payload).eq('id', project.id)
        toast.success('Projet mis à jour')
      } else {
        await table.insert([payload])
        toast.success('Projet ajouté')
      }
      onSaved()
    } catch { 
      toast.error('Erreur lors de l\'enregistrement') 
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-xl">
        <div className="flex items-center justify-between p-6 border-b border-um6p-border">
          <h2 className="text-lg font-semibold text-um6p-navy">
            {project ? 'Modifier le projet' : 'Ajouter un projet'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-um6p-gray">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="label">Intitulé du projet *</label>
            <input required className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="">Sélectionner</option>
                {['ANR', 'H2020', 'Horizon Europe', 'Bilatéral', 'Contrat industriel', 'National', 'Interne UM6P', 'Autre'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Rôle</label>
              <select className="input-field" value={form.role} onChange={(e) => set('role', e.target.value)}>
                {['PI', 'Co-PI', 'Co-investigateur', 'Partenaire', 'Participant'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Statut</label>
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {['idea', 'submitted', 'obtained', 'active', 'completed', 'cancelled'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Financeur</label>
              <input className="input-field" value={form.funder} onChange={(e) => set('funder', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Budget total (MAD)</label>
              <input 
                type="number" 
                className="input-field" 
                value={form.total_budget}
                onChange={(e) => { set('total_budget', e.target.value); calcBudget(e.target.value, form.um6p_share_pct) }} 
              />
            </div>
            <div>
              <label className="label">Part UM6P (%)</label>
              <input 
                type="number" 
                min={0} 
                max={100} 
                className="input-field" 
                value={form.um6p_share_pct}
                onChange={(e) => { set('um6p_share_pct', Number(e.target.value)); calcBudget(form.total_budget, Number(e.target.value)) }} 
              />
            </div>
            <div>
              <label className="label">Budget UM6P (MAD)</label>
              <input type="number" className="input-field" value={form.um6p_budget} onChange={(e) => set('um6p_budget', e.target.value)} />
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
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-um6p-green" 
              checked={form.is_international} 
              onChange={(e) => set('is_international', e.target.checked)} 
            />
            <span className="text-sm text-um6p-navy font-medium">Projet international</span>
          </label>
          <div>
            <label className="label">Commentaire</label>
            <textarea rows={2} className="input-field resize-none" value={form.comment} onChange={(e) => set('comment', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-um6p-border">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
