import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { TabBar } from '@/components/TabBar'
import { TABBAR_CLEARANCE } from '@/lib/layout'

/**
 * Pathless layout route — wraps /app/* pages.
 * Auth gate: unauthenticated users are redirected to /.
 */

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <BlinkClientBoundary fallback={
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <AppLayoutInner />
    </BlinkClientBoundary>
  )
}

function AppLayoutInner() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  // Assistant manages its own full h-dvh layout + scroll container (its input
  // is fixed-positioned, so it doesn't need <main>'s TabBar-clearance padding
  // the way the other three pages do).
  const isAssistant = currentPath === '/assistant'

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/' })
    }
  }, [isLoading, user, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  // `min-h-dvh`, deliberately NOT `h-dvh` + `overflow-hidden`.
  // The hard cap was added to stop the whole page being draggable, but it is
  // what introduced the bottom black strip: it pins the shell to a height that
  // stops short of the physical screen edge, and <html>'s #000 shows through
  // below it. Everything layered on afterwards to compensate (the --app-height
  // custom property fed by useAppHeight, a +200px background overshoot) was
  // patching that cap rather than removing it. Removed.
  // Known trade-off, accepted: the page may feel draggable again. That is the
  // lesser problem and needs solving WITHOUT capping the shell's height.
  return (
    <div className={isAssistant ? 'contents' : 'flex min-h-dvh flex-col bg-background'}>
      {isAssistant ? (
        <Outlet />
      ) : (
        <main className="flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ paddingBottom: TABBAR_CLEARANCE }}>
          <Outlet />
        </main>
      )}
      <TabBar currentPath={currentPath} />
    </div>
  )
}
