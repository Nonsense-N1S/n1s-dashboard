import type { ReactNode } from 'react'
import { TABBAR_CLEARANCE } from '@/lib/layout'

/**
 * Shared page background for all app tabs (metrics / assistant / tasks / settings).
 *
 * The image + gradient live on `position: fixed` layers sized to the VIEWPORT,
 * not to the page content. This matters for four real bugs we hit:
 *
 *  1. BLACK SCREEN on long pages: a scrolling `bg-cover` background sized to
 *     the CONTAINER grows with content — on a long chat the photo gets
 *     cover-zoomed to thousands of pixels tall.
 *
 *  2. SCROLL LAG: `background-attachment: fixed` repaints the whole image
 *     on every scroll frame on mobile.
 *
 *  3/4. BLACK STRIP at the bottom, ROOT CAUSE: these fixed layers used to be
 *     rendered as DESCENDANTS of `<main>`'s `overflow-y-auto` in _app.tsx —
 *     every metrics/tasks/settings page wraps its content in
 *     <PageBackground>, nested inside that scrolling ancestor. WebKit has a
 *     long-standing bug where `position: fixed` elements nested inside a
 *     scrolling ancestor get clipped to that ancestor's own box instead of
 *     the true viewport — pronounced in iOS standalone mode. No amount of
 *     height tweaking on the fixed layers could fix this: they were never
 *     too short, they were being clipped before reaching the real edge.
 *
 *     Fix: scrolling now happens INSIDE PageBackground's own content
 *     wrapper (`scroll` prop, on by default) instead of on `<main>`. The
 *     fixed image/gradient layers stay siblings of the scroll container,
 *     never descendants of it — exactly the structure assistant.tsx already
 *     used successfully (its message list scrolls in a dedicated inner div;
 *     the fixed layers sit above it, untouched by that scroll container).
 */
export function PageBackground({
  children,
  column = false,
  scroll = true,
}: {
  children: ReactNode
  /** Wrap children in a full-height flex column (tasks / settings layout). */
  column?: boolean
  /** Pages that manage their own internal scroll region (currently just
   *  assistant.tsx) pass `scroll={false}` so PageBackground doesn't add a
   *  second, redundant scroll container + bottom padding around them. */
  scroll?: boolean
}) {
  const innerClasses = scroll
    ? `relative h-full overflow-y-auto ${column ? 'flex flex-col' : ''}`
    : `relative min-h-dvh ${column ? 'flex flex-col' : ''}`

  return (
    <div className={`relative overflow-x-hidden ${scroll ? 'h-full' : 'min-h-dvh'}`}>
      {/* Viewport-sized image layer — painted behind everything on this page */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/dashboard-bg.jpg')", height: 'var(--app-height, 100dvh)' }}
      />
      {/* Viewport-sized gradient for text legibility */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.65) 100%)',
          height: 'var(--app-height, 100dvh)',
        }}
      />
      <div className={innerClasses} style={scroll ? { paddingBottom: TABBAR_CLEARANCE } : undefined}>
        {children}
      </div>
    </div>
  )
}
