import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error(t('auth.password_mismatch'))
      return
    }
    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.firstName, form.lastName)
    if (error) {
      toast.error(error.message)
    } else {
      setDone(true)
      toast.success(t('auth.register_success'))
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-um6p-gray flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-um6p-navy mb-2">Inscription réussie !</h2>
          <p className="text-um6p-gray-dark text-sm mb-6">
            Vérifiez votre boîte e-mail pour confirmer votre compte. Un administrateur activera ensuite votre accès.
          </p>
          <Link to="/login" className="btn-primary inline-flex">{t('auth.login')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-um6p-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-um6p-green rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
          <h1 className="text-2xl font-bold text-um6p-navy">{t('app.name')}</h1>
          <p className="text-um6p-gray-dark text-sm mt-1">{t('app.subtitle')}</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-um6p-navy mb-6">{t('auth.register')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('auth.first_name')}</label>
                <input type="text" className="input-field" value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="label">{t('auth.last_name')}</label>
                <input type="text" className="input-field" value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">{t('auth.email')}</label>
              <input type="email" className="input-field" value={form.email}
                placeholder="prenom.nom@gsmi.um6p.ma"
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input type="password" className="input-field" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <div>
              <label className="label">{t('auth.confirm_password')}</label>
              <input type="password" className="input-field" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? t('common.loading') : t('auth.register')}
            </button>
          </form>
          <p className="text-center text-sm text-um6p-gray-dark mt-6">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-um6p-green font-medium hover:underline">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
