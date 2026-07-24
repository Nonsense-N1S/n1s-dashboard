import { useNavigate } from '@tanstack/react-router'
import { ChartBar, MessageCircle, CheckSquare, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'

type Tab = 'metrics' | 'assistant' | 'tasks' | 'settings'

const tabs: { id: Tab; label: string; icon: typeof ChartBar; path: string }[] = [
  { id: 'metrics', label: 'Метрики', icon: ChartBar, path: '/metrics' },
  { id: 'assistant', label: 'Ассистент', icon: MessageCircle, path: '/assistant' },
  { id: 'tasks', label: 'Задачи', icon: CheckSquare, path: '/tasks' },
  { id: 'settings', label: 'Настройки', icon: Settings, path: '/settings' },
]

export function TabBar({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate()
  const navRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [capsule, setCapsule] = useState({ left: 0, width: 0 })

  const activeIndex = tabs.findIndex((t) => currentPath === t.path)
  const safeIndex = activeIndex === -1 ? 0 : activeIndex

  const measureCapsule = useCallback(() => {
    const activeButton = buttonRefs.current[safeIndex]
    const nav = navRef.current
    if (!activeButton || !nav) return

    const btnRect = activeButton.getBoundingClientRect()
    const navRect = nav.getBoundingClientRect()
    const btnCenterX = btnRect.left + btnRect.width / 2
    const capsuleWidth = btnRect.width - 8

    setCapsule({
      left: btnCenterX - navRect.left - capsuleWidth / 2,
      width: capsuleWidth,
    })
  }, [safeIndex])

  useEffect(() => {
    // rAF ensures layout is settled before measuring
    const raf = requestAnimationFrame(measureCapsule)
    window.addEventListener('resize', measureCapsule)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measureCapsule)
    }
  }, [measureCapsule])

  const setButtonRef = useCallback(
    (index: number) => (el: HTMLButtonElement | null) => {
      buttonRefs.current[index] = el
    },
    [],
  )

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[max(env(safe-area-inset-bottom,0px),16px)]">
      <nav
        ref={navRef}
        className="pointer-events-auto relative flex h-[62px] w-full max-w-[340px] items-center gap-1 rounded-[31px] border border-white/[0.08] bg-[rgba(80,80,80,0.28)] px-2 backdrop-blur-xl"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Sliding active indicator.
            Animates `x` (a GPU-composited transform) instead of `left`/`width`
            (layout properties recalculated on the main thread every frame) —
            this is what makes the slide smooth even while a heavy page is
            mounting. Width is applied instantly from measurement; it only
            changes on viewport resize. initial={false} = no slide-from-zero
            on first mount. */}
        <motion.div
          className="absolute top-2 bottom-2 left-0 rounded-[22px] bg-[#111111]"
          style={{
            width: capsule.width,
            boxShadow: '0 2px 8px rgba(0,0,0,0.24), 0 1px 3px rgba(0,0,0,0.18)',
          }}
          initial={false}
          animate={{ x: capsule.left }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 32,
            mass: 0.8,
          }}
        />

        {tabs.map((tab, index) => {
          const isActive = index === safeIndex
          const Icon = tab.icon

          return (
            <button
              key={tab.id}
              ref={setButtonRef(index)}
              onClick={() => navigate({ to: tab.path })}
              className="relative z-10 flex flex-1 h-11 flex-col items-center justify-center gap-0.5"
            >
              <motion.div
                animate={{ scale: isActive ? 1 : 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={isActive ? 'text-white' : 'text-white/45'}
                />
              </motion.div>
              <span
                className={`text-[10px] leading-tight transition-colors duration-200 ${
                  isActive ? 'text-white font-medium' : 'text-white/40 font-normal'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
