interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  published: { label: 'Publié', className: 'badge-success' },
  accepted: { label: 'Accepté', className: 'badge-info' },
  submitted: { label: 'Soumis', className: 'badge-warning' },
  draft: { label: 'Brouillon', className: 'badge-info' },
  rejected: { label: 'Refusé', className: 'badge-danger' },
  active: { label: 'Actif', className: 'badge-success' },
  obtained: { label: 'Obtenu', className: 'badge-success' },
  completed: { label: 'Terminé', className: 'badge-info' },
  cancelled: { label: 'Annulé', className: 'badge-danger' },
  in_progress: { label: 'En cours', className: 'badge-warning' },
  defended: { label: 'Soutenu', className: 'badge-success' },
  abandoned: { label: 'Abandonné', className: 'badge-danger' },
  signed: { label: 'Signé', className: 'badge-success' },
  granted: { label: 'Accordé', className: 'badge-success' },
  filed: { label: 'Déposé', className: 'badge-info' },
  idea: { label: 'Idée', className: 'badge-info' },
  atteint: { label: 'Atteint ✅', className: 'badge-success' },
  en_cours: { label: 'En cours 🟡', className: 'badge-warning' },
  non_atteint: { label: 'Non atteint 🔴', className: 'badge-danger' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'badge-info' }
  return <span className={config.className}>{config.label}</span>
}
