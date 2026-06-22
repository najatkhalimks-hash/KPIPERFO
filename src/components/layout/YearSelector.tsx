import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/auth'
import { useEffect } from 'react'
import type { AcademicYear } from '@/types/database'

export default function YearSelector() {
  const { t } = useTranslation()
  const { selectedAcademicYear, setSelectedAcademicYear } = useAppStore()

  const { data: years = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false })
      return data ?? []
    },
  })

  useEffect(() => {
    if (!selectedAcademicYear && years.length > 0) {
      const current = years.find((y) => y.is_current)
      setSelectedAcademicYear(current?.id ?? years[0].id)
    }
  }, [years])

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-um6p-gray-dark font-medium">{t('common.academic_year')}</span>
      <select
        value={selectedAcademicYear ?? ''}
        onChange={(e) => setSelectedAcademicYear(e.target.value)}
        className="text-sm border border-um6p-border rounded-lg px-3 py-1.5 bg-white
                   focus:outline-none focus:ring-2 focus:ring-um6p-green text-um6p-navy font-medium"
      >
        {years.map((y) => (
          <option key={y.id} value={y.id}>
            {y.label} {y.is_current ? '(En cours)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
