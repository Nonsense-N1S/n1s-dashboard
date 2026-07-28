import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { PageBackground } from '@/components/PageBackground'
import { PageHeader } from '@/components/PageHeader'
import { HEADER_CLEARANCE, GAP_PX, TABBAR_CLEARANCE } from '@/lib/layout'
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

function AssistantContent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  const listKey = ['chat-messages', user?.id]

  // OPTIMISTIC: the bubble is painted from cache before the write leaves, so
  // your own message lands the instant you hit send. Previously this awaited
  // the create AND a full list refetch before rendering anything — two network
  // waits before you saw your own text, on top of the assistant's own think
  // time. Standard React Query rollback shape: cancel in-flight refetches so a
  // slow older response can't clobber the optimistic state, snapshot, patch,
  // restore on error, revalidate either way (which swaps the temp id for the
  // real row).
  const addMessageMutation = useMutation({
    mutationFn: ({ role, text }: { role: string; text: string }) =>
      chatTable.create({ userId: user!.id, role, text }),
    onMutate: async ({ role, text }: { role: string; text: string }) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous = queryClient.getQueryData<ChatMessage[]>(listKey)
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        userId: user!.id,
        role,
        text,
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<ChatMessage[]>(listKey, (old = []) => [...old, optimistic])
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(listKey, context?.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
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

  // Autoscroll: scroll the local messages container itself, not window/document.
  const scrollToBottom = (behavior: ScrollBehavior) => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }

  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages])

  // The "Думает…" bubble mounts and unmounts outside the messages array, so the
  // effect above never fires for it — without this it would appear below the
  // fold on a full screen.
  useEffect(() => {
    scrollToBottom('smooth')
  }, [isSending])

  // Re-anchor to bottom whenever the visible viewport's height changes (Safari's
  // address-bar chrome collapsing/expanding, or the keyboard). Without this, the
  // scroll position computed at one viewport size goes stale after a resize —
  // the last message ends up short of the bottom instead of flush against it.
  useEffect(() => {
    const vv = window.visualViewport
    const reanchor = () => scrollToBottom('auto')
    vv?.addEventListener('resize', reanchor)
    window.addEventListener('resize', reanchor)
    return () => {
      vv?.removeEventListener('resize', reanchor)
      window.removeEventListener('resize', reanchor)
    }
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isSending || !user?.email) return

    setInput('')
    setIsSending(true)

    // Fire-and-forget, deliberately NOT awaited: the optimistic cache update
    // above has already rendered the bubble, so blocking the n8n request on
    // this write would only add its latency to the reply time for no visible
    // benefit. Failures roll the bubble back via onError.
    addMessageMutation.mutate({ role: 'user', text })

    try {
      const response = await fetch('https://n1sense.app.n8n.cloud/webhook/assistant-router', {
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
      {/* Back to plain `h-dvh`. The `--app-height` custom property this used
          to read (JS-measured visualViewport.height, written onto <html> by
          useAppHeight) reported SHORT of the real screen in iOS standalone
          mode, and every layer keyed off it inherited that shortfall — that
          was the bottom black strip. The hook and the property are gone. */}
      <div className="flex h-dvh flex-col">
        <PageHeader title="Ассистент" />

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
              top: `calc(${HEADER_CLEARANCE} + ${GAP_PX}px)`,
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

        {/* Local scroll container — owns its own scroll, independent of window/body.
            Bottom padding clears the now-fixed input pill below: TABBAR_CLEARANCE
            (input's own bottom offset) + its own height (~56px) + a gap.
            That last term is GAP_PX MINUS 10px, not the shared GAP_PX: the
            standard 16px reads as too much air between the final bubble and the
            input specifically. Written as an explicit subtraction so it stays
            obvious this is a deliberate local deviation from the spacing scale
            rather than a value that drifted out of sync with lib/layout. */}
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-y-auto px-4"
          style={{ paddingTop: HEADER_CLEARANCE, paddingBottom: `calc(${TABBAR_CLEARANCE} + 56px + ${GAP_PX - 26}px)` }}
        >
          <div className="flex min-h-full flex-col justify-end space-y-4 pb-2">
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

            {/* "Думает…" — shown only while waiting on the assistant's reply.
                Lives outside the message list on purpose: it is transient UI,
                not a row in chat_messages, so it must never be persisted or
                survive a refetch. Sits after the last bubble so the existing
                autoscroll-on-messages effect keeps it in view. */}
            {isSending && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: 'rgba(40,40,40,0.45)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.6)',
                    borderBottomLeftRadius: '6px',
                  }}
                >
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white/70" />
                  Думает…
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input — TRUE position:fixed now, same anchoring mechanism as TabBar
            itself (bottom:0 equivalent, via the shared TABBAR_CLEARANCE
            constant used everywhere else in the app for this exact purpose).
            Chosen over the in-flow/h-dvh approach because dvh recalculates
            unreliably in iOS standalone (home-screen) mode, which was letting
            an anchor-less in-flow input drift/feel draggable. Trade-off,
            accepted deliberately: won't auto-slide above the keyboard the way
            an in-flow element does. */}
        <form
          onSubmit={handleSend}
          className="fixed inset-x-0 z-40 px-3"
          style={{ bottom: TABBAR_CLEARANCE }}
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
      </div>
    </PageBackground>
  )
}
