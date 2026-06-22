import { useState } from 'react'
import { Download, FileText, Table } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportButtonProps {
  researcherId?: string
  yearId?: string | null
}

export default function ExportButton({ researcherId, yearId }: ExportButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  // CORRECTION : Spécifier explicitement un retour Promise<any> pour éliminer le type 'never'
  async function fetchAllData(): Promise<any> {
    if (!researcherId) return null
    const [pubs, projects, trainings, supervisions, services] = await Promise.all([
      supabase.from('publications').select('*').eq('researcher_id', researcherId),
      supabase.from('projects').select('*').eq('researcher_id', researcherId),
      supabase.from('trainings').select('*').eq('researcher_id', researcherId),
      supabase.from('supervisions').select('*').eq('researcher_id', researcherId),
      supabase.from('service_missions').select('*').eq('researcher_id', researcherId),
    ])
    return {
      publications: pubs.data ?? [],
      projects: projects.data ?? [],
      trainings: trainings.data ?? [],
      supervisions: supervisions.data ?? [],
      services: services.data ?? [],
    }
  }

  async function exportExcel() {
    setLoading('excel')
    try {
      const data = await fetchAllData()
      if (!data) return

      const wb = XLSX.utils.book_new()

      // Publications sheet
      if (data.publications.length) {
        // CORRECTION TS2339 : Cast explicite (p: any)
        const ws = XLSX.utils.json_to_sheet(data.publications.map((p: any) => ({
          Titre: p.title,
          Auteurs: p.authors,
          Journal: p.journal,
          Année: p.year,
          DOI: p.doi,
          Citations: p.citation_count,
          Quartile: p.quartile,
          Statut: p.publication_stage,
          'Open Access': p.is_open_access ? 'Oui' : 'Non',
        })))
        XLSX.utils.book_append_sheet(wb, ws, 'Publications')
      }

      // Projects sheet
      if (data.projects.length) {
        // CORRECTION TS2339 : Cast explicite (p: any)
        const ws = XLSX.utils.json_to_sheet(data.projects.map((p: any) => ({
          Titre: p.title,
          Type: p.type,
          Rôle: p.role,
          Statut: p.status,
          Financeur: p.funder,
          'Budget UM6P (MAD)': p.um6p_budget,
          'Date début': p.start_date,
          'Date fin': p.end_date,
        })))
        XLSX.utils.book_append_sheet(wb, ws, 'Projets')
      }

      // Training sheet
      if (data.trainings.length) {
        // CORRECTION TS2339 : Cast explicite (t: any)
        const ws = XLSX.utils.json_to_sheet(data.trainings.map((t: any) => ({
          Semestre: t.semester,
          Type: t.training_type,
          Activité: t.activity,
          'H. Prévues': t.planned_hours,
          'H. Réalisées': t.realized_hours,
        })))
        XLSX.utils.book_append_sheet(wb, ws, 'Formation')
      }

      XLSX.writeFile(wb, `CarnetChercheur_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`)
      toast.success('Export Excel généré avec succès')
    } catch {
      toast.error('Erreur lors de l\'export Excel')
    }
    setLoading(null)
    setOpen(false)
  }

  async function exportPDF() {
    setLoading('pdf')
    try {
      const data = await fetchAllData()
      if (!data) return

      const doc = new jsPDF({ orientation: 'portrait', format: 'a4' })

      // Header
      doc.setFillColor(0, 132, 61)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Carnet du Chercheur — GSMI | UM6P', 14, 18)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 26)

      doc.setTextColor(0, 0, 0)
      let y = 40

      // Publications section
      if (data.publications.length) {
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Productions Scientifiques', 14, y)
        y += 6
        autoTable(doc, {
          startY: y,
          head: [['Titre', 'Journal', 'Année', 'Statut', 'Citations']],
          // CORRECTION TS2339 : Cast explicite (p: any)
          body: data.publications.slice(0, 20).map((p: any) => [
            p.title ? (p.title.substring(0, 50) + '...') : '',
            p.journal ? p.journal.substring(0, 30) : '',
            String(p.year ?? ''),
            p.publication_stage ?? '',
            String(p.citation_count ?? 0),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 132, 61] },
        })
        y = (doc as any).lastAutoTable.finalY + 10
      }

      // Projects section
      if (data.projects.length) {
        if (y > 240) { doc.addPage(); y = 20 }
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('Projets de Recherche', 14, y)
        y += 6
        autoTable(doc, {
          startY: y,
          head: [['Titre', 'Rôle', 'Statut', 'Budget UM6P (MAD)']],
          // CORRECTION TS2339 : Cast explicite (p: any)
          body: data.projects.map((p: any) => [
            p.title ? p.title.substring(0, 50) : '',
            p.role ?? '',
            p.status ?? '',
            (p.um6p_budget ?? 0).toLocaleString(),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 132, 61] },
        })
      }

      doc.save(`CarnetChercheur_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`)
      toast.success('Export PDF généré avec succès')
    } catch {
      toast.error('Erreur lors de l\'export PDF')
    }
    setLoading(null)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn-secondary gap-2">
        <Download size={16} />
        {t('common.export')}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-um6p-border rounded-xl shadow-card-hover z-50 overflow-hidden">
            <button
              onClick={exportExcel}
              disabled={loading === 'excel'}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-um6p-gray transition-colors text-um6p-navy"
            >
              <Table size={16} className="text-green-600" />
              {loading === 'excel' ? 'Export...' : t('export.excel')}
            </button>
            <button
              onClick={exportPDF}
              disabled={loading === 'pdf'}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-um6p-gray transition-colors text-um6p-navy border-t border-um6p-border"
            >
              <FileText size={16} className="text-red-500" />
              {loading === 'pdf' ? 'Export...' : t('export.pdf')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
