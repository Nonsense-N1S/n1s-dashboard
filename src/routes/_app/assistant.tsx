import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { PageBackground } from '@/components/PageBackground'
import { Send, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { blink } from '@/blink/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@blinkdotnew/ui'

export const Route = createFileRoute('/_app/assistant')({
  head: () => ({
    meta: [
      { title: 'Assistant — N1S' },
    ],
  }),
  component: AssistantPage,
})

function AssistantPage() {
  return (
    <BlinkClientBoundary fallback={<PageSkeleton />}>
      <AssistantContent />
    </BlinkClientBoundary>
  )
}

function PageSkeleton() {
  return (
    <PageBackground>
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    </PageBackground>
  )
}

interface ChatMessage {
  id: string
  userId: string
  role: string
  text: string
  createdAt: string
}

const MAX_MESSAGES = 200
const REST_GAP_PX = 8 // ~2mm — desired gap between last message and top of input pill

function AssistantContent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputFormRef = useRef<HTMLFormElement>(null)
  const [bottomClearance, setBottomClearance] = useState(160) // fallback until first measurement

  const chatTable = blink.db.table<ChatMessage>('chat_messages')

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', user?.id],
    queryFn: () =>
      chatTable.list({
        where: { userId: user!.id },
        orderBy: { createdAt: 'asc' },
      }),
    enabled: !!user,
  })

  const addMessageMutation = useMutation({
    mutationFn: ({ role, text }: { role: string; text: string }) =>
      chatTable.create({ userId: user!.id, role, text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', user?.id] })
    },
  })

  const clearMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(messages.map((m) => chatTable.delete(m.id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', user?.id] })
      toast.success('История очищена')
    },
    onError: () => toast.error('Не удалось очистить историю'),
  })

  useEffect(() => {
    if (messages.length <= MAX_MESSAGES) return
    const overflow = messages.slice(0, messages.length - MAX_MESSAGES)
    Promise.all(overflow.map((m) => chatTable.delete(m.id))).then(() => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', user?.id] })
    })
  }, [messages])

  // Measure the real on-screen distance from viewport bottom to the top of the
  // input pill, so the messages area's bottom padding always matches it exactly
  // (plus a small rest gap) — no guessed pixel constant that can drift out of
  // sync if the input's own size/position ever changes.
  useEffect(() => {
    const formEl = inputFormRef.current
    if (!formEl) return
    const measure = () => {
      const rect = formEl.getBoundingClientRect()
      const viewportH = window.visualViewport?.height ?? window.innerHeight
      const distanceFromBottom = viewportH - rect.top
      setBottomClearance(Math.max(0, distanceFromBottom + REST_GAP_PX))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(formEl)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [])

  // Autoscroll: scroll the local messages container itself, not window/document.
  // This is deterministic regardless of any fixed-positioning elsewhere on the
  // page (which can silently break window.scrollTo / scrollIntoView). Re-runs
  // whenever the measured clearance changes too, so the rest point stays pinned
  // to the input even right after a keyboard show/hide remeasure.
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, bottomClearance])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isSending || !user?.email) return

    setInput('')
    setIsSending(true)

    await addMessageMutation.mutateAsync({ role: 'user', text })

    try {
      const response = await fetch('https://n1sense2.app.n8n.cloud/webhook/assistant-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, message: text }),
      })

      if (!response.ok) throw new Error(`Router error: ${response.status}`)

      const replyText = await response.text()
      await addMessageMutation.mutateAsync({ role: 'ai', text: replyText || 'No response text received.' })
    } catch (err) {
      await addMessageMutation.mutateAsync({ role: 'ai', text: 'Something went wrong reaching the assistant. Please try again.' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <PageBackground>
      <div className="flex h-dvh flex-col">
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
          <h1 className="text-base font-semibold tracking-tight text-white text-center">Ассистент</h1>
        </header>

        {messages.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Удалить всю историю переписки? Это действие нельзя отменить.')) {
                clearMutation.mutate()
              }
            }}
            disabled={clearMutation.isPending}
            aria-label="Очистить историю"
            className="fixed z-40 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:text-red-400 disabled:opacity-30"
            style={{
              top: 'calc(env(safe-area-inset-top) + 4.75rem)',
              right: '1.1rem',
              background: 'rgba(70,70,70,0.65)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
            }}
          >
            <Trash2 size={15} />
          </button>
        )}

        {/* Local scroll container — owns its own scroll, independent of window/body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem)',
            paddingBottom: `${bottomClearance}px`,
          }}
        >
          <div className="flex min-h-full flex-col justify-end space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center text-center px-4">
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <svg className="h-8 w-8 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-white">AI Бизнес-ассистент</h2>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/45">
                  Задайте вопрос о бизнесе — ассистент ответит здесь.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={
                      msg.role === 'user'
                        ? {
                            background: 'rgba(255,255,255,0.92)',
                            color: '#111',
                            borderBottomRightRadius: '6px',
                          }
                        : {
                            background: 'rgba(40,40,40,0.45)',
                            backdropFilter: 'blur(18px)',
                            WebkitBackdropFilter: 'blur(18px)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            color: 'rgba(255,255,255,0.92)',
                            borderBottomLeftRadius: '6px',
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <form
        ref={inputFormRef}
        onSubmit={handleSend}
        className="fixed inset-x-0 z-40 px-3"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 86px)',
        }}
      >
        <div
          className="mx-auto flex max-w-[560px] items-center gap-2 rounded-2xl px-3 py-1.5"
          style={{
            background: 'rgba(40,40,40,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent py-1.5 text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </PageBackground>
  )
}
