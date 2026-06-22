import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) toast.error(t('auth.login_error'))
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-um6p-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-um6p-green rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
          <h1 className="text-2xl font-bold text-um6p-navy">{t('app.name')}</h1>
          <p className="text-um6p-gray-dark text-sm mt-1">{t('app.subtitle')}</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-um6p-navy mb-6">{t('auth.login')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="prenom.nom@gsmi.um6p.ma"
                required
              />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-um6p-green hover:underline">
                {t('auth.forgot_password')}
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? t('common.loading') : t('auth.login')}
            </button>
          </form>

          <p className="text-center text-sm text-um6p-gray-dark mt-6">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-um6p-green font-medium hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-um6p-gray-dark mt-4 opacity-60">
          © {new Date().getFullYear()} GSMI — Green & Sustainable Mining Institute | UM6P
        </p>
      </div>
    </div>
  )
}
