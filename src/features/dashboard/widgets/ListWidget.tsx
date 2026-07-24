import type { WidgetProps } from '../types'
import { WidgetShell } from '../components/WidgetShell'

interface ListItem {
  id: string
  primary: string
  secondary?: string
  trailing?: string
  status?: 'default' | 'success' | 'warning' | 'error'
}

interface ListData {
  items: ListItem[]
  emptyMessage?: string
}

const STATUS_COLORS = {
  default: '',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
}

export function ListWidget({ config }: WidgetProps) {
  const data = (config.data as ListData) || { items: [] }
  const items = data.items || []

  return (
    <WidgetShell
      title={config.title}
      subtitle={config.subtitle}
      noPadding
      variant={config.variant}
    >
      {items.length === 0 ? (
        <div className="px-4 pb-4 pt-2">
          <p className="text-[13px] text-muted-foreground">
            {data.emptyMessage || 'No items'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-[14px] transition-colors hover:bg-muted/30"
            >
              {item.status && item.status !== 'default' && (
                <span
                  className={`h-[7px] w-[7px] shrink-0 rounded-full ${STATUS_COLORS[item.status]}`}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {item.primary}
                </p>
                {item.secondary && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {item.secondary}
                  </p>
                )}
              </div>
              {item.trailing && (
                <span className="shrink-0 text-[12px] font-semibold text-foreground/70 tabular-nums">
                  {item.trailing}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}
