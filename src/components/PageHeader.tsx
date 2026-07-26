/**
 * Shared fixed page header — same mechanism as TabBar (`position: fixed`,
 * not sticky; sticky was tried and didn't behave the same in practice).
 *
 * Was previously copy-pasted with slightly different padding in each of
 * assistant.tsx / tasks.tsx / settings.tsx, which is how they drifted out
 * of sync. One component now, one place to change it.
 *
 * Its visual height (paddingTop 12px + text line-height 24px + paddingBottom
 * 12px = 48px below the safe area) is captured in `HEADER_H_PX` in
 * `src/lib/layout.ts` — keep them in sync if you resize this.
 */
export function PageHeader({ title }: { title: string }) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 px-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
        paddingBottom: '0.75rem',
        background: 'rgba(20,20,20,0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <h1 className="text-base font-semibold tracking-tight text-white text-center">{title}</h1>
    </header>
  )
}
