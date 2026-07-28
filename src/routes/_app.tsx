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

  // `h-dvh`, matching assistant.tsx's own shell — this is what makes <main>'s
  // `flex-1 min-h-0 overflow-y-auto` an actual scroll container instead of
  // decoration. With the previous `min-h-dvh` the shell grew with its content,
  // so nothing ever overflowed <main> and the document scrolled instead:
  // same visual result, different element, and the fixed header/accessories
  // had no bounded region to sit against. Now all four tabs scroll the same
  // way — an inner container under fixed chrome.
  //
  // Deliberately NO `overflow-hidden` here. An earlier revision paired that
  // with a JS-measured `--app-height`, and the combination is what produced
  // the bottom black strip; assistant.tsx has run plain `h-dvh` without
  // `overflow-hidden` and no strip, which is the pattern being copied.
  return (
    <div className={isAssistant ? 'contents' : 'flex h-dvh flex-col bg-background'}>
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
