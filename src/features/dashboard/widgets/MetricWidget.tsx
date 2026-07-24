import type { WidgetProps } from '../types'
import { WidgetShell } from '../components/WidgetShell'

interface MetricData {
  value: string
  label: string
  subMetrics?: { label: string; value: string }[]
}

export function MetricWidget({ config }: WidgetProps) {
  const data = (config.data as MetricData) || { value: '—', label: '' }

  return (
    <WidgetShell title={config.title} subtitle={config.subtitle} variant={config.variant}>
      <p className="text-[28px] font-bold tracking-tight text-foreground leading-none">
        {data.value}
      </p>
      <p className="mt-1.5 text-[12px] text-muted-foreground">{data.label}</p>
      {data.subMetrics && data.subMetrics.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {data.subMetrics.map((m) => (
            <div key={m.label}>
              <p className="text-[15px] font-semibold text-foreground tabular-nums">{m.value}</p>
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}
