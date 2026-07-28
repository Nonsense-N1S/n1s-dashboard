import type { ReactNode } from 'react'

/**
 * Shared page background for all app tabs (metrics / assistant / tasks / settings).
 *
 * The image + gradient live on `position: fixed` layers sized to the VIEWPORT,
 * not to the page content. This matters for two real bugs we hit:
 *
 *  1. BLACK SCREEN on long pages: a scrolling `bg-cover` background is sized
 *     to the CONTAINER, and the container grows with content. On a long chat
 *     the photo gets cover-zoomed to thousands of pixels tall — a huge dark
 *     blob — and with the black gradient on top the page looks black.
 *
 *  2. SCROLL LAG: `background-attachment: fixed` forces the browser to
 *     repaint the whole image on every scroll frame on mobile.
 *
 * `inset-0` is correct and needs no height arithmetic. An earlier revision
 * replaced it with `calc(var(--app-height) + 200px)` while chasing the bottom
 * black strip; that never helped, because the strip came from a JS-measured
 * `--app-height` capping the document, not from these layers being short.
 */
export function PageBackground({
  children,
  column = false,
}: {
  children: ReactNode
  /** Wrap children in a full-height flex column (tasks / settings layout). */
  column?: boolean
}) {
  // `min-h-full`, not `min-h-dvh`: these now sit inside <main>, which is a
  // bounded scroll container whose content box is one viewport MINUS the
  // TabBar clearance. Demanding a full `dvh` in there overflowed by exactly
  // that clearance and gave short pages — Settings especially — a pointless
  // ~100px of scroll. `100%` resolves against <main> instead, so a page that
  // fits simply doesn't scroll.
  return (
    <div className="relative min-h-full overflow-x-hidden">
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
      <div className={column ? 'relative flex min-h-full flex-col' : 'relative'}>
        {children}
      </div>
    </div>
  )
}
