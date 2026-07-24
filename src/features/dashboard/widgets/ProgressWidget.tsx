import type { WidgetProps } from '../types'
import { WidgetShell } from '../components/WidgetShell'
import { motion } from 'framer-motion'

interface ProgressItem {
  id: string
  label: string
  sublabel?: string
  value: number
  max: number
  color?: string
  valueLabel?: string
}

interface ProgressData {
  items: ProgressItem[]
}

const PLACEHOLDER: ProgressItem[] = [
  { id: '1', label: 'Revenue target', value: 72, max: 100, color: 'var(--primary)' },
  { id: '2', label: 'New customers', value: 45, max: 60, color: '#10b981' },
  { id: '3', label: 'Support tickets', value: 18, max: 50, color: '#f59e0b' },
]

export function ProgressWidget({ config }: WidgetProps) {
  const data = (config.data as ProgressData) || { items: PLACEHOLDER }
  const items = data.items?.length > 0 ? data.items : PLACEHOLDER

  return (
    <WidgetShell title={config.title} subtitle={config.subtitle} variant={config.variant}>
      <div className="space-y-[18px]">
        {items.map((item, index) => {
          const pct = Math.min(100, Math.round((item.value / item.max) * 100))
          return (
            <div key={item.id}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[13px] text-foreground">
                  {item.label}
                  {item.sublabel && (
                    <span className="text-muted-foreground"> {item.sublabel}</span>
                  )}
                </span>
                <span className="text-[11px] font-semibold text-foreground tabular-nums">
                  {item.valueLabel ?? `${pct}%`}
                </span>
              </div>
              <div className="h-[7px] w-full overflow-hidden rounded-full bg-muted/80">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  style={{
                    backgroundColor: item.color || 'var(--primary)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </WidgetShell>
  )
}
