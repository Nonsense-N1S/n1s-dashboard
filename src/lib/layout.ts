// Shared layout geometry — single source of truth so pages never drift out
// of sync with the real dimensions of TabBar / PageHeader (which is exactly
// how the input-position bugs kept recurring: every page had its own
// hand-typed copy of these numbers).
//
// If you resize the header (PageHeader.tsx) or the tab bar (TabBar.tsx),
// update the matching constant here and every page picks it up automatically.

/** Visual height of the fixed page header, below the safe area:
 *  paddingTop(12px) + text-base line-height(24px) + paddingBottom(12px). */
export const HEADER_H_PX = 48

/** Standard gap between stacked chrome elements (header → accessory,
 *  accessory → content, etc). Keep every page on this one value. */
export const GAP_PX = 16

/** Distance from the top of the viewport to just below the fixed header. */
export const HEADER_CLEARANCE = `calc(env(safe-area-inset-top) + ${HEADER_H_PX}px)`

/** TabBar's own visual footprint — must match TabBar.tsx's `h-[62px]` nav
 *  pill and its `pb-[max(env(safe-area-inset-bottom,0px),16px)]` exactly. */
export const TABBAR_NAV_H_PX = 62
export const TABBAR_BOTTOM_PAD = 'max(env(safe-area-inset-bottom, 0px), 16px)'

/** Padding-bottom needed so content/inputs clear the floating TabBar with
 *  one standard gap to spare. */
export const TABBAR_CLEARANCE = `calc(${TABBAR_NAV_H_PX}px + ${TABBAR_BOTTOM_PAD} + ${GAP_PX}px)`
