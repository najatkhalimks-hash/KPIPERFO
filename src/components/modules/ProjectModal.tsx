import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { Database, Project } from '@/types/database'

// Utilisation du type de Supabase pour l'insertion
type ProjectInsert = Database['public']['Tables']['projects']['Insert']

interface Props { 
  project?: Project | null
  researcherId?: string
  onClose: () => void
  onSaved: () => void 
}

export default function ProjectModal({ project, researcherId, onClose, onSaved }: Props) {
  // Initialisation avec des valeurs compatibles avec les types attendus
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
        total_budget: project.total_budget ? String(project.total_budget) : '',
        um6p_share_pct: project.um6p_share_pct ?? 100,
        um6p_budget: project.um6p_budget ? String(project.um6p_budget) : '',
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
        is_international: project.is_international ?? false,
        comment: project.comment ?? '',
      })
    }
  }, [project])

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  const calcBudget = (total: string, pct: number) => {
    const t = parseFloat(total)
    if (!isNaN(t)) {
      set('um6p_budget', String(Math.round((t * pct) / 100)))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Création du payload avec des ternaires pour forcer le null si vide
    const payload: ProjectInsert = {
      title: form.title,
      type: form.type || null,
      role: form.role,
      status: form.status,
      funder: form.funder || null,
      um6p_share_pct: form.um6p_share_pct,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_international: form.is_international,
      comment: form.comment || null,
      researcher_id: researcherId || null,
      total_budget: form.total_budget ? parseFloat(form.total_budget) : null,
      um6p_budget: form.um6p_budget ? parseFloat(form.um6p_budget) : null,
    }

    try {
      if (project?.id) {
        // Cast 'as any' nécessaire pour contourner le typage strict parfois erroné du SDK Supabase sur le update
        const { error } = await supabase
          .from('projects')
          .update(payload as any)
          .eq('id', project.id)
        if (error) throw error
        toast.success('Projet mis à jour')
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([payload])
        if (error) throw error
        toast.success('Projet ajouté')
      }
      onSaved()
    } catch (err) { 
      toast.error("Erreur lors de l'enregistrement") 
    } finally {
      setLoading(false)
    }
  }

  // ... (votre JSX reste identique)
}
