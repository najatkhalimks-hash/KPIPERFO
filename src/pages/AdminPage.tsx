import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Users, Shield, BarChart2, CheckCircle, XCircle } from 'lucide-react'
import type { Profile } from '@/types/database'

type Tab = 'users' | 'stats'

export default function AdminPage() {
  const { profile: currentUser } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('users')

  const { data: users = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name')
      if (error) throw error
      return data ?? []
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const tables = ['publications', 'projects', 'trainings', 'supervisions', 'communications', 'patents', 'collaborations'] as const
      const results = await Promise.all(
        tables.map(table => supabase.from(table).select('id', { count: 'exact', head: true }))
      )
      
      return {
        publications: results[0].count ?? 0,
        projects: results[1].count ?? 0,
        trainings: results[2].count ?? 0,
        supervisions: results[3].count ?? 0,
        communications: results[4].count ?? 0,
        patents: results[5].count ?? 0,
        collaborations: results[6].count ?? 0,
      }
    },
  })

  const updateUserRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Rôle mis à jour') 
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Statut mis à jour') 
    },
  })

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

      <div className="border-b border-um6p-border">
        <div className="flex gap-1">
          {[
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'stats', label: 'Statistiques', icon: BarChart2 }
          ].map((t) => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-um6p-green text-um6p-green' : 'border-transparent text-um6p-gray-dark hover:text-um6p-navy'}`}
            >
              <t.icon size={15} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-2xl font-bold text-um6p-navy">{users.length}</p>
              <p className="text-xs text-um6p-gray-dark">Utilisateurs total</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold text-um6p-navy">{users.filter((u) => u.is_active).length}</p>
              <p className="text-xs text-um6p-gray-dark">Actifs</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold text-um6p-navy">{users.filter((u) => u.role === 'admin').length}</p>
              <p className="text-xs text-um6p-gray-dark">Administrateurs</p>
            </div>
          </div>

          <table className="table-base w-full">
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role ?? 'researcher'} onChange={(e) => updateUserRole.mutate({ id: u.id, role: e.target.value })}>
                      <option value="researcher">Chercheur</option>
                      <option value="admin">Administrateur</option>
                      <option value="viewer">Observateur</option>
                    </select>
                  </td>
                  <td>{u.is_active ? 'Actif' : 'Inactif'}</td>
                  <td>
                    <button onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}>
                      {u.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
