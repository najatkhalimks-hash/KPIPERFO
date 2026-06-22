import { useState, useEffect } from 'react'
import { X, Search, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { Publication } from '@/types/database'

interface Props {
  publication?: Publication | null
  researcherId?: string
  onClose: () => void
  onSaved: () => void
}

const STAGES = ['draft', 'submitted', 'accepted', 'published', 'rejected']
const QUARTILES = ['Q1', 'Q2', 'Q3', 'Q4']

export default function PublicationModal({ publication, researcherId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    title: '', authors: '', journal: '', year: new Date().getFullYear(),
    doi: '', eid: '', volume: '', issue: '', pages: '',
    citation_count: 0, quartile: '', impact_factor: '',
    source_type: '', document_type: '', publication_stage: 'draft',
    is_open_access: false, is_first_author: false, is_corresponding_author: false,
    um6p_affiliation: true, affiliations: '', gsmi_comment: '',
  })
  const [loading, setLoading] = useState(false)
  const [doiFetching, setDoiFetching] = useState(false)

  useEffect(() => {
    if (publication) {
      setForm({
        title: publication.title ?? '',
        authors: publication.authors ?? '',
        journal: publication.journal ?? '',
        year: publication.year ?? new Date().getFullYear(),
        doi: publication.doi ?? '',
        eid: publication.eid ?? '',
        volume: publication.volume ?? '',
        issue: publication.issue ?? '',
        pages: publication.pages ?? '',
        citation_count: publication.citation_count ?? 0,
        quartile: publication.quartile ?? '',
        impact_factor: String(publication.impact_factor ?? ''),
        source_type: publication.source_type ?? '',
        document_type: publication.document_type ?? '',
        publication_stage: publication.publication_stage ?? 'draft',
        is_open_access: publication.is_open_access ?? false,
        is_first_author: publication.is_first_author ?? false,
        is_corresponding_author: publication.is_corresponding_author ?? false,
        um6p_affiliation: publication.um6p_affiliation ?? true,
        affiliations: publication.affiliations ?? '',
        gsmi_comment: publication.gsmi_comment ?? '',
      })
    }
  }, [publication])

  async function fetchFromDOI() {
    if (!form.doi) return
    setDoiFetching(true)
    try {
      const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(form.doi)}`)
      const json = await res.json()
      const work = json.message
      if (work) {
        setForm((prev) => ({
          ...prev,
          title: work.title?.[0] ?? prev.title,
          authors: work.author?.map((a: any) => `${a.family} ${a.given}`).join(', ') ?? prev.authors,
          journal: work['container-title']?.[0] ?? prev.journal,
          year: work.issued?.['date-parts']?.[0]?.[0] ?? prev.year,
          volume: work.volume ?? prev.volume,
          issue: work.issue ?? prev.issue,
          pages: work.page ?? prev.pages,
          citation_count: work['is-referenced-by-count'] ?? prev.citation_count,
          is_open_access: work.license?.some((l: any) => l.URL?.includes('creativecommons')) ?? prev.is_open_access,
        }))
        toast.success('Métadonnées récupérées via Crossref')
      }
    } catch {
      toast.error('Impossible de récupérer les métadonnées. Vérifiez le DOI.')
    }
    setDoiFetching(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      researcher_id: researcherId,
      impact_factor: form.impact_factor ? parseFloat(form.impact_factor) : null,
    }
    try {
      if (publication) {
        await supabase.from('publications').update(payload).eq('id', publication.id)
        toast.success('Publication mise à jour')
      } else {
        await supabase.from('publications').insert(payload)
        toast.success('Publication ajoutée')
      }
      onSaved()
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement')
    }
    setLoading(false)
  }

  const set = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-um6p-border">
          <h2 className="text-lg font-semibold text-um6p-navy">
            {publication ? 'Modifier la publication' : 'Ajouter une publication'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-um6p-gray"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* DOI fetch */}
          <div className="form-section">
            <p className="form-section-title">🔍 Récupération automatique par DOI</p>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field"
                placeholder="ex: 10.1016/j.minpro.2023.107893"
                value={form.doi}
                onChange={(e) => set('doi', e.target.value)}
              />
              <button type="button" onClick={fetchFromDOI} disabled={doiFetching || !form.doi}
                className="btn-secondary flex-shrink-0">
                {doiFetching ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
                Crossref
              </button>
            </div>
          </div>

          {/* Core fields */}
          <div>
            <label className="label">Titre <span className="text-red-500">*</span></label>
            <input required className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label">Auteurs <span className="text-red-500">*</span></label>
            <input required className="input-field" placeholder="Nom1, Nom2, ..." value={form.authors} onChange={(e) => set('authors', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Revue / Journal</label>
              <input className="input-field" value={form.journal} onChange={(e) => set('journal', e.target.value)} />
            </div>
            <div>
              <label className="label">Année <span className="text-red-500">*</span></label>
              <input required type="number" className="input-field" min={1990} max={2030} value={form.year} onChange={(e) => set('year', Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Volume</label>
              <input className="input-field" value={form.volume} onChange={(e) => set('volume', e.target.value)} />
            </div>
            <div>
              <label className="label">Numéro</label>
              <input className="input-field" value={form.issue} onChange={(e) => set('issue', e.target.value)} />
            </div>
            <div>
              <label className="label">Pages</label>
              <input className="input-field" value={form.pages} onChange={(e) => set('pages', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Statut</label>
              <select className="input-field" value={form.publication_stage} onChange={(e) => set('publication_stage', e.target.value)}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quartile</label>
              <select className="input-field" value={form.quartile} onChange={(e) => set('quartile', e.target.value)}>
                <option value="">—</option>
                {QUARTILES.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Impact Factor</label>
              <input type="number" step="0.01" className="input-field" value={form.impact_factor} onChange={(e) => set('impact_factor', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Citations</label>
              <input type="number" className="input-field" value={form.citation_count} onChange={(e) => set('citation_count', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">EID Scopus</label>
              <input className="input-field" value={form.eid} onChange={(e) => set('eid', e.target.value)} />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'is_open_access', label: 'Open Access' },
              { key: 'is_first_author', label: 'Premier auteur' },
              { key: 'is_corresponding_author', label: 'Auteur correspondant' },
              { key: 'um6p_affiliation', label: 'Affiliation UM6P' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-um6p-green"
                  checked={(form as any)[key]} onChange={(e) => set(key, e.target.checked)} />
                <span className="text-sm text-um6p-navy">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="label">Affiliations complètes</label>
            <textarea rows={2} className="input-field resize-none" value={form.affiliations} onChange={(e) => set('affiliations', e.target.value)} />
          </div>
          <div>
            <label className="label">Commentaire GSMI</label>
            <textarea rows={2} className="input-field resize-none" value={form.gsmi_comment} onChange={(e) => set('gsmi_comment', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-um6p-border">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Enregistrement...' : publication ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
