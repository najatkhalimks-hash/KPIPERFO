import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Users, Shield, Activity, BarChart2, CheckCircle, XCircle, Edit2 } from 'lucide-react'
import type { Profile } from '@/types/database'

type Tab = 'users' | 'stats' | 'years'

export default function AdminPage() {
  const { profile: currentUser } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('users')
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('full_name')
      return data ?? []
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [pubs, projs, trainings, supervisions, comms, patents, collabs] = await Promise.all([
        supabase.from('publications').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('trainings').select('id', { count: 'exact', head: true }),
        supabase.from('supervisions').select('id', { count: 'exact', head: true }),
        supabase.from('communications').select('id', { count: 'exact', head: true }),
        supabase.from('patents').select('id', { count: 'exact', head: true }),
        supabase.from('collaborations').select('id', { count: 'exact', head: true }),
      ])
      return {
        publications: pubs.count ?? 0,
        projects: projs.count ?? 0,
        trainings: trainings.count ?? 0,
        supervisions: supervisions.count ?? 0,
        communications: comms.count ?? 0,
        patents: patents.count ?? 0,
        collaborations: collabs.count ?? 0,
      }
    },
  })

  const updateUserRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await supabase.from('profiles').update({ role }).eq('id', id)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Rôle mis à jour') },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from('profiles').update({ is_active }).eq('id', id)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Statut mis à jour') },
  })

  const tabs = [
    { id: 'users' as Tab, label: 'Utilisateurs', icon: Users },
    { id: 'stats' as Tab, label: 'Statistiques', icon: BarChart2 },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="text-sm text-um6p-gray-dark">Gestion des utilisateurs et supervision de la plateforme</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-um6p-green-pale rounded-lg">
          <Shield size={14} className="text-um6p-green" />
          <span className="text-xs font-semibold text-um6p-green">Accès Administrateur</span>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-um6p-border">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-um6p-green text-um6p-green' : 'border-transparent text-um6p-gray-dark hover:text-um6p-navy'}`}>
              <t.icon size={15} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <Users size={20} className="text-um6p-green" />
              <div><p className="text-2xl font-bold text-um6p-navy">{users.length}</p><p className="text-xs text-um6p-gray-dark">Utilisateurs total</p></div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-um6p-green" />
              <div><p className="text-2xl font-bold text-um6p-navy">{users.filter((u) => u.is_active !== false).length}</p><p className="text-xs text-um6p-gray-dark">Actifs</p></div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <Shield size={20} className="text-um6p-gold" />
              <div><p className="text-2xl font-bold text-um6p-navy">{users.filter((u) => u.role === 'admin').length}</p><p className="text-xs text-um6p-gray-dark">Administrateurs</p></div>
            </div>
          </div>

          <div className="table-container">
            <table className="table-base">
              <thead className="table-head">
                <tr><th>Nom</th><th>Email</th><th>Grade</th><th>Département</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-10">Chargement...</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="text-sm font-medium text-um6p-navy">{u.full_name}</td>
                    <td className="text-sm text-um6p-gray-dark">{u.email}</td>
                    <td className="text-xs text-um6p-gray-dark">{u.grade}</td>
                    <td className="text-xs text-um6p-gray-dark">{u.department}</td>
                    <td>
                      <select
                        value={u.role ?? 'researcher'}
                        onChange={(e) => updateUserRole.mutate({ id: u.id, role: e.target.value })}
                        disabled={u.id === currentUser?.id}
                        className="text-xs border border-um6p-border rounded px-2 py-1 bg-white"
                      >
                        <option value="researcher">Chercheur</option>
                        <option value="admin">Administrateur</option>
                        <option value="viewer">Observateur</option>
                      </select>
                    </td>
                    <td>
                      {u.is_active !== false
                        ? <span className="flex items-center gap-1 text-xs text-um6p-green"><CheckCircle size={12} /> Actif</span>
                        : <span className="flex items-center gap-1 text-xs text-red-500"><XCircle size={12} /> Inactif</span>
                      }
                    </td>
                    <td>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => toggleActive.mutate({ id: u.id, is_active: u.is_active === false })}
                          className={`text-xs px-2 py-1 rounded-lg ${u.is_active !== false ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        >
                          {u.is_active !== false ? 'Désactiver' : 'Activer'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-um6p-navy uppercase tracking-wide">Données globales de la plateforme</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Publications', value: stats.publications, icon: '📄', color: 'text-um6p-navy' },
              { label: 'Projets', value: stats.projects, icon: '🔬', color: 'text-um6p-green' },
              { label: 'Heures formation', value: stats.trainings, icon: '📚', color: 'text-um6p-gold' },
              { label: 'Encadrements', value: stats.supervisions, icon: '🎓', color: 'text-um6p-navy' },
              { label: 'Communications', value: stats.communications, icon: '🎤', color: 'text-um6p-green' },
              { label: 'Brevets', value: stats.patents, icon: '🛡️', color: 'text-um6p-gold' },
              { label: 'Collaborations', value: stats.collaborations, icon: '🤝', color: 'text-um6p-navy' },
            ].map((s) => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-um6p-gray-dark">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-um6p-navy mb-4">Répartition par rôle</h3>
            <div className="space-y-3">
              {(['admin', 'researcher', 'viewer'] as const).map((role) => {
                const count = users.filter((u) => u.role === role || (!u.role && role === 'researcher')).length
                const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0
                return (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-um6p-gray-dark capitalize">{role}</span>
                      <span className="font-medium text-um6p-navy">{count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill bg-um6p-green" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
