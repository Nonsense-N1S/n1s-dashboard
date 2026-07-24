import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface WidgetShellProps {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  noPadding?: boolean
  variant?: 'graphite' | 'glass'
}

const GRAPHITE_CSS = {
  '--foreground': '0 0% 100%',
  '--muted-foreground': '0 0% 72%',
  '--muted': '0 0% 18%',
  '--card': '0 0% 7%',
  '--card-foreground': '0 0% 100%',
  '--border': '0 0% 18%',
  '--primary': '211 100% 60%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '0 0% 14%',
  '--secondary-foreground': '0 0% 100%',
  '--accent': '211 100% 60%',
  '--accent-foreground': '0 0% 100%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 100%',
  '--ring': '211 100% 60%',
} as React.CSSProperties

export function WidgetShell({
  title,
  subtitle,
  children,
  className = '',
  noPadding = false,
  variant = 'glass',
}: WidgetShellProps) {
  const isGraphite = variant === 'graphite'

  const cardStyle: React.CSSProperties = isGraphite
    ? {
        background: 'rgba(40,40,40,0.35)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)',
      }
    : {
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid rgba(255,255,255,0.20)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
      }

  const hoverShadow = isGraphite
    ? '0 8px 30px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)'
    : '0 2px 6px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.10)'

  const titleClass = isGraphite
    ? 'text-[13px] font-semibold tracking-tight text-white/90'
    : 'text-[13px] font-semibold tracking-tight text-foreground/90'

  const subtitleClass = isGraphite
    ? 'mt-0.5 text-[11px] text-white/45'
    : 'mt-0.5 text-[11px] text-muted-foreground/70'

  const inner = (
    <>
      {(title || subtitle) && (
        <div className="px-4 pt-4 pb-1.5">
          {title && <h3 className={titleClass}>{title}</h3>}
          {subtitle && <p className={subtitleClass}>{subtitle}</p>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-4 pb-4 pt-1'}>
        {isGraphite ? (
          <div style={GRAPHITE_CSS}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={`group/widget rounded-[20px] overflow-hidden transition-shadow duration-300 ${isGraphite ? 'hover:shadow-lg' : 'hover:shadow-md'} ${className}`}
      style={cardStyle}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = hoverShadow
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = cardStyle.boxShadow as string
      }}
    >
      {inner}
    </motion.div>
  )
}
