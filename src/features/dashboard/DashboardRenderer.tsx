import type { DashboardConfig, WidgetConfig } from './types'
import { resolveWidget } from './resolve-widget'
import { sizeToClasses } from './grid-utils'
import { motion, AnimatePresence } from 'framer-motion'

interface DashboardRendererProps {
  config: DashboardConfig
}

export function DashboardRenderer({ config }: DashboardRendererProps) {
  // Sort by order, stable for equal orders
  const sorted = [...config.widgets].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  )

  return (
    <div className="w-full px-4 pt-2 pb-4">
      {config.title && (
        <motion.h2
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-3 text-[20px] font-bold tracking-tight text-white"
        >
          {config.title}
        </motion.h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px] auto-rows-auto">
        <AnimatePresence mode="popLayout">
          {sorted.map((widget, index) => (
            <WidgetSlot key={widget.id} widget={widget} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function WidgetSlot({ widget, index }: { widget: WidgetConfig; index: number }) {
  const Component = resolveWidget(widget.type)
  const spanClasses = sizeToClasses(widget.size)

  return (
    <motion.div
      layout
      className={spanClasses}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Component config={widget} />
    </motion.div>
  )
}
