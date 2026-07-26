import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppHeight } from '@/hooks/useAppHeight'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { TabBar } from '@/components/TabBar'

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
  useAppHeight()

  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

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
        // Padding-bottom removed on purpose: content now scrolls all the way
        // to the physical bottom edge and shows through TabBar's glass/blur,
        // instead of stopping short above it.
        <main className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      )}
      <TabBar currentPath={currentPath} />
    </div>
  )
}
