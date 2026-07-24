import type { WidgetProps } from '../types'
import { WidgetShell } from '../components/WidgetShell'

interface CustomData {
  html?: string
  message?: string
}

export function CustomWidget({ config }: WidgetProps) {
  const data = (config.data as CustomData) || {}

  return (
    <WidgetShell title={config.title} subtitle={config.subtitle} variant={config.variant}>
      <div className="flex min-h-[80px] items-center justify-center">
        {data.message ? (
          <p className="text-[13px] text-muted-foreground">{data.message}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground/50 italic">
            Custom widget placeholder
          </p>
        )}
      </div>
    </WidgetShell>
  )
}
