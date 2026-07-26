import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppHeight } from '@/hooks/useAppHeight'
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
  // Keeps --app-height in sync with the real window height — see the hook's
  // own comment for why dvh alone isn't enough in iOS standalone mode.
  useAppHeight()

  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  // Assistant manages its own full h-dvh layout + scroll container (its input
  // is a normal in-flow flex child, not fixed, so it doesn't need <main>'s
  // TabBar-clearance padding the way the other three pages do).
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

  return (
    <div
      className={isAssistant ? 'contents' : 'flex flex-col overflow-hidden bg-background'}
      style={isAssistant ? undefined : { height: 'var(--app-height, 100dvh)' }}
    >
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
