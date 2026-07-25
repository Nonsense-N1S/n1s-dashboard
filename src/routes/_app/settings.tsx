import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { PageBackground } from '@/components/PageBackground'
import { LogOut, ChevronRight } from 'lucide-react'
import { blink } from '@/blink/client'

export const Route = createFileRoute('/_app/settings')({
  head: () => ({
    meta: [{ title: 'Settings — N1S' }],
  }),
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <BlinkClientBoundary fallback={<PageSkeleton />}>
      <SettingsContent />
    </BlinkClientBoundary>
  )
}

function PageSkeleton() {
  return (
    <PageBackground column>
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    </PageBackground>
  )
}

function SettingsContent() {
  const { user } = useAuth()

  const handleSignOut = async () => {
    await blink.auth.signOut()
  }

  return (
    <PageBackground column>
      {/* Header — true position:fixed, same mechanism as TabBar, not sticky */}
      <header className="fixed inset-x-0 top-0 z-40 px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)', paddingBottom: '0.75rem', background: 'rgba(20,20,20,0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 className="text-base font-semibold tracking-tight text-white text-center">
          Настройки
        </h1>
      </header>

      {/* Content — top padding clears the now-fixed header */}
      <div className="px-4 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4rem)' }}>
        {/* Profile section */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white" style={{ background: 'rgba(255,255,255,0.12)' }}>
            {user?.email?.charAt(0).toUpperCase() || 'N'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-white/45">{user?.email || ''}</p>
          </div>
        </div>

        {/* Settings groups */}
        <div className="space-y-6">
          <div>
            <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
              Аккаунт
            </p>
            <div
              className="overflow-hidden rounded-xl"
              style={{ background: 'rgba(40,40,40,0.35)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <SettingRow label="Профиль" value="Редактировать профиль" />
              <SettingDivider />
              <SettingRow label="Уведомления" value="Вкл" />
              <SettingDivider />
              <SettingRow label="Безопасность" value="Пароль, 2FA" />
            </div>
          </div>

          <div>
            <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
              Предпочтения
            </p>
            <div
              className="overflow-hidden rounded-xl"
              style={{ background: 'rgba(40,40,40,0.35)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <SettingRow label="Оформление" value="Системное" />
              <SettingDivider />
              <SettingRow label="Язык" value="Русский" />
            </div>
          </div>

          <div>
            <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
              О приложении
            </p>
            <div
              className="overflow-hidden rounded-xl"
              style={{ background: 'rgba(40,40,40,0.35)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <SettingRow label="Версия" value="1.0.0" />
              <SettingDivider />
              <SettingRow label="Поддержка" value="Связаться с нами" />
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 active:scale-[0.98]"
            style={{ background: 'rgba(40,40,40,0.35)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </div>
    </PageBackground>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <button className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.06]">
      <span className="text-sm text-white/90">{label}</span>
      <span className="flex items-center gap-1 text-xs text-white/40">
        {value}
        <ChevronRight size={14} className="text-white/30" />
      </span>
    </button>
  )
}

function SettingDivider() {
  return <div className="h-px bg-white/[0.08] ml-4" />
}
