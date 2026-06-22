import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Save, User, BookOpen, Award, Globe } from 'lucide-react'

const GRADES = ['Professeur', 'Professeur Habilité', 'Professeur Assistant', 'Chercheur', 'Chercheur Senior', 'Ingénieur de Recherche', 'Post-doctorant', 'Doctorant', 'Expert Affilié']
const SPECIALTIES = ['Sciences Mathématiques', 'Informatique & IA', 'Sciences Physiques', 'Chimie', 'Biologie', 'Agronomie', 'Géosciences', 'Sciences de l\'Ingénieur', 'Sciences Sociales', 'Management', 'Économie', 'Droit', 'Médecine', 'Autre']

export default function ProfilePage() {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    grade: '',
    specialty: '',
    department: '',
    laboratory: '',
    research_axes: '',
    orcid_id: '',
    google_scholar_url: '',
    researchgate_url: '',
    linkedin_url: '',
    personal_website: '',
    hindex: '',
    scopus_id: '',
    wos_id: '',
    phd_date: '',
    phd_institution: '',
    hdr_date: '',
    hdr_institution: '',
    biography: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        grade: profile.grade ?? '',
        specialty: profile.specialty ?? '',
        department: profile.department ?? '',
        laboratory: profile.laboratory ?? '',
        research_axes: (profile.research_axes as string) ?? '',
        orcid_id: profile.orcid_id ?? '',
        google_scholar_url: profile.google_scholar_url ?? '',
        researchgate_url: profile.researchgate_url ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        personal_website: profile.personal_website ?? '',
        hindex: profile.hindex ? String(profile.hindex) : '',
        scopus_id: profile.scopus_id ?? '',
        wos_id: profile.wos_id ?? '',
        phd_date: profile.phd_date ?? '',
        phd_institution: profile.phd_institution ?? '',
        hdr_date: profile.hdr_date ?? '',
        hdr_institution: profile.hdr_institution ?? '',
        biography: profile.biography ?? '',
      })
    }
  }, [profile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) return
    setLoading(true)

    const payload = {
      ...form,
      hindex: form.hindex ? Number(form.hindex) : null,
    }

    try {
      await supabase.from('profiles').update(payload).eq('id', profile.id)
      toast.success('Profil mis à jour avec succès')
      // Actualise en douceur l'interface pour recharger le profil mis à jour
      setTimeout(() => window.location.reload(), 800)
    } catch { 
      toast.error('Erreur lors de la mise à jour') 
    } finally {
      setLoading(false)
    }
  }

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-um6p-border">
        <Icon size={18} className="text-um6p-green" />
        <h2 className="text-sm font-semibold text-um6p-navy uppercase tracking-wide">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className="label">{label}</label>{children}</div>
  )

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mon Profil</h1>
          <p className="text-sm text-um6p-gray-dark">Informations personnelles et académiques</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          <Save size={16} /> {loading ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Informations personnelles" icon={User}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom complet *"><input required className="input-field" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} /></Field>
            <Field label="Email institutionnel"><input type="email" className="input-field" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Téléphone"><input className="input-field" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Grade / Titre">
              <select className="input-field" value={form.grade} onChange={(e) => set('grade', e.target.value)}>
                <option value="">Sélectionner</option>
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Affiliation académique" icon={BookOpen}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Département"><input className="input-field" value={form.department} onChange={(e) => set('department', e.target.value)} /></Field>
            <Field label="Laboratoire / Centre"><input className="input-field" value={form.laboratory} onChange={(e) => set('laboratory', e.target.value)} /></Field>
          </div>
          <Field label="Spécialité">
            <select className="input-field" value={form.specialty} onChange={(e) => set('specialty', e.target.value)}>
              <option value="">Sélectionner</option>
              {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Axes de recherche (thèmes principaux)">
            <textarea rows={3} className="input-field resize-none" placeholder="Ex: Machine Learning, NLP, Vision par ordinateur..." value={form.research_axes} onChange={(e) => set('research_axes', e.target.value)} />
          </Field>
          <Field label="Biographie / Résumé">
            <textarea rows={4} className="input-field resize-none" value={form.biography} onChange={(e) => set('biography', e.target.value)} />
          </Field>
        </Section>

        <Section title="Diplômes" icon={Award}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date soutenance doctorat"><input type="date" className="input-field" value={form.phd_date} onChange={(e) => set('phd_date', e.target.value)} /></Field>
            <Field label="Établissement doctorat"><input className="input-field" value={form.phd_institution} onChange={(e) => set('phd_institution', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date HDR"><input type="date" className="input-field" value={form.hdr_date} onChange={(e) => set('hdr_date', e.target.value)} /></Field>
            <Field label="Établissement HDR"><input className="input-field" value={form.hdr_institution} onChange={(e) => set('hdr_institution', e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Identifiants & Profils en ligne" icon={Globe}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ORCID iD"><input className="input-field font-mono" placeholder="0000-0000-0000-0000" value={form.orcid_id} onChange={(e) => set('orcid_id', e.target.value)} /></Field>
            <Field label="Scopus ID"><input className="input-field font-mono" value={form.scopus_id} onChange={(e) => set('scopus_id', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Web of Science ID"><input className="input-field font-mono" value={form.wos_id} onChange={(e) => set('wos_id', e.target.value)} /></Field>
            <Field label="H-index (auto-déclaré)"><input type="number" min={0} className="input-field" value={form.hindex} onChange={(e) => set('hindex', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Google Scholar URL"><input type="url" className="input-field" placeholder="https://scholar.google.com/..." value={form.google_scholar_url} onChange={(e) => set('google_scholar_url', e.target.value)} /></Field>
            <Field label="ResearchGate URL"><input type="url" className="input-field" placeholder="https://researchgate.net/..." value={form.researchgate_url} onChange={(e) => set('researchgate_url', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="LinkedIn"><input type="url" className="input-field" value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} /></Field>
            <Field label="Site personnel"><input type="url" className="input-field" value={form.personal_website} onChange={(e) => set('personal_website', e.target.value)} /></Field>
          </div>
        </Section>
      </form>
    </div>
  )
}
