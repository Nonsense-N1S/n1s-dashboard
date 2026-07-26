import type { ReactNode } from 'react'

/**
 * Shared page background for all app tabs (metrics / assistant / tasks / settings).
 *
 * The image + gradient live on `position: fixed` layers sized to the VIEWPORT,
 * not to the page content. This matters for two real bugs we hit:
 *
 *  1. BLACK SCREEN on long pages (assistant): a scrolling `bg-cover`
 *     background is sized to the CONTAINER, and the container grows with
 *     content. On a long chat the photo gets cover-zoomed to thousands of
 *     pixels tall — a huge dark blob — and with the black gradient on top
 *     the page looks like a black screen.
 *
 *  2. SCROLL LAG: the old `background-attachment: fixed` forces the browser
 *     to repaint the whole image on every scroll frame on mobile.
 *
 * A fixed, viewport-sized layer has neither problem: it is composited once,
 * never resized by content, and never repainted on scroll.
 *
 * NOTE: this used to carry an extra -76px/+76px margin/padding pair as a
 * TabBar-clearance hack. Removed — it's now handled properly by `<main>`'s
 * own `TABBAR_CLEARANCE` padding in `_app.tsx`, and with `<main>` now
 * actually clipped (`overflow-y-auto` inside an `h-dvh`-capped wrapper,
 * instead of letting the whole page grow past the viewport), that extra
 * 76px stopped being invisible — it showed up as a real scrollable black
 * strip past the fixed background layers.
 */
export function PageBackground({
  children,
  column = false,
}: {
  children: ReactNode
  /** Wrap children in a full-height flex column (tasks / settings layout). */
  column?: boolean
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Viewport-sized image layer — painted behind everything on this page */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/dashboard-bg.jpg')" }}
      />
      {/* Viewport-sized gradient for text legibility */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.65) 100%)',
        }}
      />
      <div className={column ? 'relative flex min-h-dvh flex-col' : 'relative'}>
        {children}
      </div>
    </div>
  )
}
