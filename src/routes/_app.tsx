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

  // Assistant manages its own scroll container + bottom spacing (fixed input above TabBar).
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

  // Assistant route is fully self-contained: owns its own background image,
  // flex layout, scroll container, and bottom spacing. Don't wrap it in
  // min-h-dvh + pb-[76px] which causes a double bottom gap and black bar.
  if (isAssistant) {
    return (
      <>
        <Outlet />
        <TabBar currentPath={currentPath} />
      </>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Page content */}
      <main className="flex flex-col flex-1 min-h-0 overflow-y-auto pb-[76px]">
        <Outlet />
      </main>

      {/* Bottom tab bar — iOS style */}
      <TabBar currentPath={currentPath} />
    </div>
  )
}
