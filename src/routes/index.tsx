import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { blink } from '@/blink/client'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'N1S — Business Intelligence' },
      { name: 'description', content: 'Видеть цифры. Понимать бизнес. Знать следующий шаг.' },
    ],
  }),
  component: LandingPage,
})

function LandingPage() {
  return (
    <BlinkClientBoundary fallback={<LandingSkeleton />}>
      <LandingContent />
    </BlinkClientBoundary>
  )
}

function LandingSkeleton() {
  return (
    <div className="fixed inset-0 bg-black" />
  )
}

const easing = [0.19, 1, 0.22, 1] as const

function LandingContent() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await blink.auth.signUp({ email, password })
        await blink.auth.signInWithEmail(email, password)
      } else {
        await blink.auth.signInWithEmail(email, password)
      }
      navigate({ to: '/metrics' })
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Fullscreen hero image — CSS background instead of an <img> tag. */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-statue.jpg')" }}
        initial={{ scale: 1.05 }}
        animate={ready ? { scale: 1 } : {}}
        transition={{ duration: 0.9, ease: easing }}
      />

      {/* Overlay — gradient from top to bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/30" />

      {/* Editorial content — bottom-anchored, scrollable */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex max-h-full flex-col overflow-y-auto">

        {/* ─── EDITORIAL TEXT BLOCK ─── */}
        <div className="shrink-0 px-5 pb-6 sm:px-8">

          {/* Metadata + paragraph block */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1 } : {}}
            transition={{ duration: 1.2, ease: easing, delay: 0.15 }}
          >
            {/* Row 1: 3 columns — edges aligned to divider */}
            <div className="flex items-baseline justify-between py-[5px]">
              <span className="text-[9px] uppercase tracking-[0.30em] text-left" style={{ fontWeight: 600, color: '#ffffff' }}>System</span>
              <span className="text-[9px] uppercase tracking-[0.28em] text-white/[0.62]" style={{ fontWeight: 500 }}>Business Assistant</span>
              <span className="text-[9px] uppercase tracking-[0.30em] text-left" style={{ fontWeight: 600, color: '#ffffff' }}>N1S</span>
            </div>

            {/* Divider — symmetric equal margins */}
            <div className="h-px bg-white/[0.20]" style={{ opacity: 0.8 }} />

            {/* Row 2: 3 columns — edges aligned to divider */}
            <div className="flex items-baseline justify-between py-[5px]">
              <span className="text-[9px] uppercase tracking-[0.30em] text-white/[0.38]" style={{ fontWeight: 400 }}>Product</span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-white/[0.62]" style={{ fontWeight: 500 }}>Dashboard</span>
              <span className="text-[9px] uppercase tracking-[0.30em] text-white/[0.38]" style={{ fontWeight: 400 }}>v1.0</span>
            </div>

            {/* Divider — symmetric equal margins */}
            <div className="h-px bg-white/[0.20]" style={{ opacity: 0.8 }} />

            {/* Paragraph — single dense block */}
            <p
              className="pt-[10px] text-[13px] leading-[1.48] text-white/[0.52] text-center"
              style={{ fontWeight: 400, fontFamily: 'sans-serif' }}
            >
              Видеть цифры. Понимать бизнес. Знать следующий шаг.
            </p>
          </motion.div>
        </div>

        {/* ─── GLASS RIBBON — Login ─── */}
        <motion.form
          onSubmit={handleSubmit}
          className="shrink-0 border-t border-white/[0.06] bg-[rgba(50,50,50,0.25)] backdrop-blur-2xl p-3"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, ease: easing, delay: 0.55 }}
        >
          <div className="flex flex-col justify-center px-5 sm:px-8 py-3" style={{ height: 135 }}>
            {/* Email */}
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-white/[0.40]" htmlFor="email">
                Почта
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full bg-transparent py-2.5 text-[15px] text-white placeholder:text-white/[0.18] outline-none"
                style={{ fontWeight: 400 }}
              />
            </div>

            {/* Separator */}
            <div className="h-px bg-white/[0.05]" />

            {/* Password */}
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-white/[0.40]" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                className="w-full bg-transparent py-2.5 text-[15px] text-white placeholder:text-white/[0.18] outline-none"
                style={{ fontWeight: 400 }}
              />
            </div>
          </div>
        </motion.form>

        {/* Error message */}
        {error && (
          <motion.div
            className="shrink-0 px-5 sm:px-8 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-[13px] text-red-400/90">{error}</p>
          </motion.div>
        )}

        {/* Sign In button */}
        <motion.div
          className="shrink-0 px-5 sm:px-8 pt-3"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, ease: easing, delay: 0.65 }}
        >
          <button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#1a1a1a] text-[15px] text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-40"
            style={{ fontWeight: 500 }}
          >
            {submitting ? 'Пожалуйста, подождите...' : mode === 'signin' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </motion.div>

        {/* Toggle sign in / sign up */}
        <motion.div
          className="shrink-0 px-5 sm:px-8 pb-[max(env(safe-area-inset-bottom,0px),28px)] pt-4 text-left"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, ease: easing, delay: 0.7 }}
        >
          <p className="text-[12px] text-white/[0.40]">
            {mode === 'signin' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
              className="text-white/[0.65] hover:text-white transition-colors"
              style={{ fontWeight: 400 }}
            >
              {mode === 'signin' ? 'Создать' : 'Войти'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
