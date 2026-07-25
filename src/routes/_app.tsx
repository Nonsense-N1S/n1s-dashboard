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

  // Single, stable tree shape across ALL routes (Assistant included) so
  // TabBar never unmounts/remounts on navigation. TabBar always sits as the
  // second child of the same wrapping element — only the first child (the
  // page content) and that wrapper's className change. A remount used to
  // reset TabBar's measured slider position back to 0, so the capsule
  // visibly slid in from the left edge every time you switched into/out of
  // Assistant. `contents` makes the wrapper invisible to layout on the
  // Assistant route (equivalent to no wrapper at all — avoids the old
  // double-bottom-gap/black-bar issue), while still being the same DOM node
  // React reconciles across renders.
  return (
    <div className={isAssistant ? 'contents' : 'flex min-h-dvh flex-col bg-background'}>
      {isAssistant ? (
        <Outlet />
      ) : (
        <main className="flex flex-col flex-1 min-h-0 overflow-y-auto pb-[76px] pt-[env(safe-area-inset-top)]">
          <Outlet />
        </main>
      )}
      <TabBar currentPath={currentPath} />
    </div>
  )
}
