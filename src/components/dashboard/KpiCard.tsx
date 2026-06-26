import type { Forecast } from '@/types/database'

interface KpiCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: string
  color?: 'green' | 'blue' | 'gold' | 'purple' | 'teal' | 'red'
  forecast?: Forecast
}

const colorMap = {
  green: 'bg-green-50 border-green-100',
  blue: 'bg-blue-50 border-blue-100',
  gold: 'bg-amber-50 border-amber-100',
  purple: 'bg-purple-50 border-purple-100',
  teal: 'bg-teal-50 border-teal-100',
  red: 'bg-red-50 border-red-100',
}

const textColorMap = {
  green: 'text-green-700',
  blue: 'text-blue-700',
  gold: 'text-amber-700',
  purple: 'text-purple-700',
  teal: 'text-teal-700',
  red: 'text-red-700',
}

function getStatusInfo(forecast?: Forecast, realized?: number) {
  if (!forecast || !forecast.planned) return null
  const planned = forecast.planned ?? 0
  const actual = realized ?? 0
  const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0
  if (pct >= 100) return { label: `${pct}% ✅`, className: 'text-green-600' }
  if (pct >= 75) return { label: `${pct}% 🟡`, className: 'text-amber-600' }
  return { label: `${pct}% 🔴`, className: 'text-red-600' }
}

export default function KpiCard({ label, value, unit, icon, color = 'green', forecast }: KpiCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string) || 0
  const status = getStatusInfo(forecast, numericValue)

  return (
    <div className={`kpi-card border ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <span className="text-xl">{icon}</span>
        {status && (
          <span className={`text-xs font-semibold ${status.className}`}>{status.label}</span>
        )}
      </div>
      <div>
        <p className={`text-2xl font-bold ${textColorMap[color]}`}>
          {value}{unit && <span className="text-sm ml-1 font-normal">{unit}</span>}
        </p>
        <p className="text-xs text-um6p-gray-dark leading-tight mt-0.5">{label}</p>
      </div>
      {forecast && (forecast.planned ?? 0) > 0 && (
        <div className="mt-1">
          <div className="flex justify-between text-xs text-um6p-gray-dark mb-1">
            <span>Objectif: {forecast.planned ?? 0}{unit}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-um6p-green"
              style={{ width: `${Math.min(100, Math.round((numericValue / (forecast.planned ?? 1)) * 100))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
