// Training page
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import type { Training } from '@/types/database'

type TrainingForm = { 
  semester: string; 
  training_type: string; 
  activity: string; 
  program: string; 
  planned_hours: number; 
  realized_hours: number; 
  comment: string 
}

const ACTIVITIES: Record<string, string[]> = {
  formation_initiale: ['Animation cours', 'Conception cours', 'Préparation examens', 'Encadrement PFE', 'Encadrement stages'],
  formation_executive: ['Conception programmes', 'Animation cours'],
  formation_doctorale: ['Cours doctoraux', 'Encadrement thèses'],
  autre: ['Autre activité'],
}

interface TrainingModalProps {
  training: Training | null
  researcherId: string | undefined
  onClose: () => void
  onSaved: () => void
}

function TrainingModal({ training, researcherId, onClose, onSaved }: TrainingModalProps) {
  const trData = training as any

  const [form, setForm] = useState<TrainingForm>({
    semester: trData?.semester ?? 'S1',
    training_type: trData?.training_type ?? 'formation_initiale',
    activity: trData?.activity ?? '',
    program: trData?.program ?? '',
    planned_hours: trData?.planned_hours ?? 0,
    realized_hours: trData?.realized_hours ?? 0,
    comment: trData?.comment ?? '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!researcherId) return
    setLoading(true)

    const payload = { ...form, researcher_id: researcherId }
    try {
      if (training?.id) {
        await supabase.from('trainings').update(payload).eq('id', training.id)
        toast.success('Activité mise à jour')
      } else {
        await supabase.from('trainings').insert([payload])
        toast.success('Activité ajoutée')
      }
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
          <h2 className="text-lg font-semibold">{training ? 'Modifier' : 'Ajouter'} une activité</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-um6p-gray rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Semestre</label>
              <select className="input-field" value={form.semester} onChange={(e) => set('semester', e.target.value)}>
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
              </select>
            </div>
            <div>
              <label className="label">Type de formation</label>
              <select className="input-field" value={form.training_type} onChange={(e) => { set('training_type', e.target.value); set('activity', '') }}>
                <option value="formation_initiale">Formation initiale</option>
                <option value="formation_executive">Formation exécutive</option>
                <option value="formation_doctorale">Formation doctorale</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Activité</label>
            <select className="input-field" value={form.activity} onChange={(e) => set('activity', e.target.value)}>
              <option value="">Sélectionner</option>
              {(ACTIVITIES[form.training_type] ?? []).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Filière / Programme</label>
            <input className="input-field" value={form.program} onChange={(e) => set('program', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">H. Prévues</label>
              <input type="number" min={0} className="input-field" value={form.planned_hours} onChange={(e) => set('planned_hours', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">H. Réalisées</label>
              <input type="number" min={0} className="input-field" value={form.realized_hours} onChange={(e) => set('realized_hours', Number(e.target.value))} />
            </div>
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

export default function TrainingPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Training | null>(null)
  const [semFilter, setSemFilter] = useState('all')

  const { data: trainings = [], isLoading } = useQuery<Training[]>({
    queryKey: ['trainings', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('trainings').select('*').eq('researcher_id', profile!.id).order('training_type')
      return (data as Training[]) ?? []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { 
      await supabase.from('trainings').delete().eq('id', id) 
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['trainings'] })
      toast.success('Activité supprimée') 
    },
  })

  const filtered = semFilter === 'all' ? trainings : trainings.filter((t: any) => t.semester === semFilter)

  const totals = {
    initiale_planned: trainings.filter((t: any) => t.training_type === 'formation_initiale').reduce((s, t: any) => s + (t.planned_hours ?? 0), 0),
    initiale_realized: trainings.filter((t: any) => t.training_type === 'formation_initiale').reduce((s, t: any) => s + (t.realized_hours ?? 0), 0),
    executive_planned: trainings.filter((t: any) => t.training_type === 'formation_executive').reduce((s, t: any) => s + (t.planned_hours ?? 0), 0),
    executive_realized: trainings.filter((t: any) => t.training_type === 'formation_executive').reduce((s, t: any) => s + (t.realized_hours ?? 0), 0),
    doctorale_planned: trainings.filter((t: any) => t.training_type === 'formation_doctorale').reduce((s, t: any) => s + (t.planned_hours ?? 0), 0),
    doctorale_realized: trainings.filter((t: any) => t.training_type === 'formation_doctorale').reduce((s, t: any) => s + (t.realized_hours ?? 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('training.title')}</h1>
          <p className="text-sm text-um6p-gray-dark">Heures prévisionnelles & réalisées par semestre</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
          <Plus size={16} /> {t('training.add')}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { type: 'Formation initiale', planned: totals.initiale_planned, realized: totals.initiale_realized, icon: '📚' },
          { type: 'Formation exécutive', planned: totals.executive_planned, realized: totals.executive_realized, icon: '💼' },
          { type: 'Formation doctorale', planned: totals.doctorale_planned, realized: totals.doctorale_realized, icon: '🎓' },
        ].map((s) => (
          <div key={s.type} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{s.icon}</span>
              <p className="text-sm font-medium text-um6p-navy">{s.type}</p>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-um6p-gray-dark">Prévu: <strong>{s.planned}h</strong></span>
              <span className="text-um6p-green font-semibold">Réalisé: {s.realized}h</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill bg-um6p-green" style={{ width: `${s.planned > 0 ? Math.min(100, Math.round((s.realized / s.planned) * 100)) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex gap-2">
        {['all', 'S1', 'S2'].map((s) => (
          <button key={s} onClick={() => setSemFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${semFilter === s ? 'bg-um6p-green text-white' : 'bg-um6p-gray text-um6p-gray-dark hover:bg-um6p-green-pale'}`}>
            {s === 'all' ? 'Tous semestres' : s}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-head">
            <tr>
              <th>Sem.</th>
              <th>Type</th>
              <th>Activité</th>
              <th>Programme</th>
              <th>H. Prévues</th>
              <th>H. Réalisées</th>
              <th>Avancement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-10">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-um6p-gray-dark">Aucune activité enregistrée</td></tr>
            ) : filtered.map((tr) => {
              const trData = tr as any
              const planned = trData.planned_hours ?? 0
              const realized = trData.realized_hours ?? 0
              const pct = planned > 0 ? Math.round((realized / planned) * 100) : null

              return (
                <tr key={tr.id} className="table-row">
                  <td><span className="badge-info">{trData.semester}</span></td>
                  <td className="text-xs text-um6p-gray-dark">{trData.training_type?.replace('_', ' ')}</td>
                  <td className="text-sm font-medium text-um6p-navy">{trData.activity}</td>
                  <td className="text-sm text-um6p-gray-dark">{trData.program}</td>
                  <td className="text-sm text-center">{planned}h</td>
                  <td className="text-sm font-semibold text-center text-um6p-green">{realized}h</td>
                  <td>
                    {pct !== null && (
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-16">
                          <div className="progress-fill bg-um6p-green" style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className="text-xs text-um6p-gray-dark">{pct}%</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(tr); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-um6p-gray text-um6p-gray-dark"><Edit2 size={14} /></button>
                      <button onClick={() => { if (tr.id && confirm(t('common.confirm_delete'))) deleteMutation.mutate(tr.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <TrainingModal
          training={editing}
          researcherId={profile?.id}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['trainings', 'dashboard'] }); setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
