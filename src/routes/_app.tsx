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

  // Assistant builds its own h-dvh column (its message list and fixed input
  // are page-specific), so it opts out of the shared <main> below.
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

  // `h-dvh` makes <main>'s `flex-1 min-h-0 overflow-y-auto` an actual scroll
  // container rather than decoration — all four tabs now scroll the same way,
  // an inner container under fixed chrome.
  // Deliberately NO `overflow-hidden`: an earlier revision paired that with a
  // JS-measured `--app-height`, and that combination produced the bottom black
  // strip. Plain `h-dvh` alone is fine — assistant.tsx has run it strip-free.
  //
  // <main> also carries NO bottom padding. It used to reserve TABBAR_CLEARANCE
  // so content stopped above the floating TabBar, but once <main> became a real
  // scroll container that reserved band read as a dead panel cutting the
  // dashboard off short of the nav. Content now scrolls to the physical bottom
  // edge and passes under TabBar's glass/blur, which is the point of the bar
  // being translucent in the first place.
  // Trade-off, deliberate: the very last row of a list ends up behind the bar
  // at full scroll. If that becomes a problem, add the clearance as padding on
  // the page's own content instead of re-clipping the whole scroll region.
  return (
    <div className={isAssistant ? 'contents' : 'flex h-dvh flex-col bg-background'}>
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
