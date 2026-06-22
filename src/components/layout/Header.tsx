import { Bell, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'
import YearSelector from './YearSelector'

export default function Header() {
  const { t } = useTranslation()
  const currentLang = i18n.language

  const toggleLang = () => {
    const next = currentLang === 'fr' ? 'en' : 'fr'
    i18n.changeLanguage(next)
  }

  return (
    <header className="h-16 bg-white border-b border-um6p-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <YearSelector />
      </div>

      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                     text-um6p-gray-dark hover:bg-um6p-gray transition-colors border border-um6p-border"
        >
          <Globe size={14} />
          <span>{currentLang.toUpperCase()}</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-um6p-gray transition-colors text-um6p-gray-dark">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-um6p-green rounded-full" />
        </button>
      </div>
    </header>
  )
}
