import type { WidgetProps } from '../types'
import { WidgetShell } from '../components/WidgetShell'

interface TimelineEvent {
  id: string
  title: string
  description?: string
  time: string
  dotColor?: string
}

interface TimelineData {
  events: TimelineEvent[]
}

const PLACEHOLDER: TimelineEvent[] = [
  { id: '1', title: 'Invoice sent', description: 'Invoice #1042 sent to client', time: '2 hours ago', dotColor: 'var(--primary)' },
  { id: '2', title: 'Payment received', description: '$3,200 from Acme Corp', time: 'Yesterday', dotColor: '#10b981' },
  { id: '3', title: 'New task created', description: 'Follow up on proposal', time: '2 days ago', dotColor: '#f59e0b' },
  { id: '4', title: 'Report generated', description: 'Monthly revenue report', time: '3 days ago', dotColor: 'var(--primary)' },
]

export function TimelineWidget({ config }: WidgetProps) {
  const data = (config.data as TimelineData) || { events: PLACEHOLDER }
  const events = data.events?.length > 0 ? data.events : PLACEHOLDER

  return (
    <WidgetShell
      title={config.title}
      subtitle={config.subtitle}
      noPadding
      variant={config.variant}
    >
      <div className="px-4 pb-4 pt-1">
        <div className="relative">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-3.5 pb-5 last:pb-0">
              {/* Vertical line */}
              {index < events.length - 1 && (
                <div className="absolute left-[5.5px] top-[14px] bottom-0 w-px bg-border/60" />
              )}
              {/* Dot with ring */}
              <div className="relative z-10 mt-[5px] shrink-0">
                <div
                  className="h-[12px] w-[12px] rounded-full"
                  style={{
                    backgroundColor: event.dotColor || 'var(--muted-foreground)',
                  }}
                />
                <div
                  className="absolute inset-[-3px] rounded-full opacity-20"
                  style={{
                    backgroundColor: event.dotColor || 'var(--muted-foreground)',
                  }}
                />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 pt-px">
                <p className="text-[13px] font-medium text-foreground leading-tight">
                  {event.title}
                </p>
                {event.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {event.description}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-wide font-medium">
                  {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  )
}
