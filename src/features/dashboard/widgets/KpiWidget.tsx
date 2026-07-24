import type { WidgetProps } from '../types'
import { WidgetShell } from '../components/WidgetShell'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiData {
  value: string
  change?: number
  changeLabel?: string
  icon?: string
}

export function KpiWidget({ config }: WidgetProps) {
  const data = (config.data as KpiData) || { value: '—' }
  const change = data.change ?? 0
  const isPositive = change > 0
  const isNeutral = change === 0

  return (
    <WidgetShell title={config.title} subtitle={config.subtitle} variant={config.variant}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[26px] font-bold tracking-tight text-foreground leading-none">
            {data.value}
          </p>
        </div>
        {data.change !== undefined && (
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isPositive
                ? 'bg-emerald-500/15 text-emerald-400 backdrop-blur-sm'
                : isNeutral
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-red-500/15 text-red-400 backdrop-blur-sm'
            }`}
          >
            {isPositive ? (
              <TrendingUp size={12} strokeWidth={2.5} />
            ) : isNeutral ? (
              <Minus size={12} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={12} strokeWidth={2.5} />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      {data.changeLabel && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {data.changeLabel}
        </p>
      )}
    </WidgetShell>
  )
}
