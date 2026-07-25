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

/**
 * Static layout constants — no runtime measuring, nothing to race.
 * FORM_BOTTOM_OFFSET (92) = the input form's `bottom` offset (see <form>).
 * INPUT_HEIGHT (44)       = the input pill's rendered height.
 * TABBAR_PAD (76)         = PageBackground's own bottom padding, which
 *                           already sits below our spacer in the document.
 * The spacer therefore reserves (92 + 44) - 76 = 60px, so at max scroll the
 * last message rests right above the input (space-y-4 adds ~16px of air).
 * Tune BOTTOM_SPACER_PX directly if the gap ever needs adjusting.
 */
const BOTTOM_SPACER_PX = 60
const HEADER_HEIGHT_PX = 52
const MAX_MESSAGES = 200

function AssistantContent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  // Keep history bounded: once it grows past MAX_MESSAGES, silently delete
  // the oldest overflow (messages are fetched oldest-first, so the extras
  // are always at the START of the array). After deleting, invalidating the
  // query refetches with the count back under the limit, so this doesn't
  // loop — it just quietly trims one batch whenever the 201st message lands.
  useEffect(() => {
    if (messages.length <= MAX_MESSAGES) return
    const overflow = messages.slice(0, messages.length - MAX_MESSAGES)
    Promise.all(overflow.map((m) => chatTable.delete(m.id))).then(() => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', user?.id] })
    })
  }, [messages])

  useEffect(() => {
    // Scroll the real scroll container to its true bottom: resting position
    // == max scroll, so the last message sits above the fixed input and
    // there is nothing extra left to scroll. On the assistant route _app.tsx
    // renders no <main> wrapper, so this falls back to window scrolling.
    const el = messagesEndRef.current
    if (!el) return
    const scroller = el.closest('main') as HTMLElement | null
    if (scroller && scroller.scrollHeight > scroller.clientHeight) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isSending || !user?.email) return

    setInput('')
    setIsSending(true)

    // Save user message to DB
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
      {/* Header */}
      <header
        className="sticky top-0 z-10 relative px-4"
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
        {messages.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Удалить всю историю переписки? Это действие нельзя отменить.')) {
                clearMutation.mutate()
              }
            }}
            disabled={clearMutation.isPending}
            aria-label="Очистить историю"
            className="absolute right-4 flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-30"
            style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </header>

      {/* Messages: bottom-anchored; the static spacer at the end (plus
          PageBackground's 76px padding below it) keeps the last message
          above the fixed input at max scroll. */}
      <div
        className="flex flex-col justify-end space-y-4 px-4 pt-4"
        style={{ minHeight: `calc(100dvh - ${HEADER_HEIGHT_PX}px - env(safe-area-inset-top))` }}
      >
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
        {/* Static bottom spacer — see constants above. */}
        <div
          ref={messagesEndRef}
          aria-hidden="true"
          style={{ height: BOTTOM_SPACER_PX, flexShrink: 0 }}
        />
      </div>

      {/* Input — pinned to viewport bottom, above TabBar */}
      <form
        onSubmit={handleSend}
        className="fixed inset-x-0 z-40 px-3"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)',
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
