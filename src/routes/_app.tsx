import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { TabBar } from '@/components/TabBar'

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

  // Assistant builds its own full-height column (its message list and fixed
  // input are page-specific), so it opts out of the shared <main> below.
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

  // `h-full`, NOT `h-dvh`. Both cap the shell to one screen so that <main>'s
  // `flex-1 min-h-0 overflow-y-auto` becomes a real scroll container — but in
  // iOS standalone `100dvh` measures SHORT of the physical screen, so capping
  // by it leaves the black strip at the bottom. Same regression twice now:
  // strip appeared under `h-dvh`, vanished under `min-h-dvh` (free to grow
  // past the bad number), returned the moment `h-dvh` came back.
  // `100%` chains from html/body instead, off the initial containing block,
  // which with `viewport-fit=cover` really is the full screen.
  //
  // <main> carries no bottom padding. It used to reserve TABBAR_CLEARANCE so
  // content stopped above the floating TabBar, but once <main> became a real
  // scroll container that reserved band read as a dead panel cutting the
  // dashboard off short of the nav. Content now reaches the physical bottom
  // edge and passes under TabBar's glass — which is the point of the bar being
  // translucent. Trade-off, deliberate: the last row of a list sits behind the
  // bar at full scroll; if that ever matters, add the clearance as padding on
  // the page's own content rather than re-clipping the whole scroll region.
  return (
    <div className={isAssistant ? 'contents' : 'flex h-full flex-col bg-background'}>
      {isAssistant ? (
        <Outlet />
      ) : (
        <main className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      )}
      <TabBar currentPath={currentPath} />
    </div>
  )
}
