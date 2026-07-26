import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { blink } from '@/blink/client'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { PageBackground } from '@/components/PageBackground'
import { PageHeader } from '@/components/PageHeader'
import { HEADER_CLEARANCE, GAP_PX } from '@/lib/layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, Trash2 } from 'lucide-react'
import { toast } from '@blinkdotnew/ui'

interface Task {
  id: string
  userId: string
  title: string
  isCompleted: string
  createdAt: string
}

export const Route = createFileRoute('/_app/tasks')({
  head: () => ({
    meta: [
      { title: 'Tasks — N1S' },
    ],
  }),
  component: TasksPage,
})

function TasksPage() {
  return (
    <BlinkClientBoundary fallback={<PageSkeleton />}>
      <TasksContent />
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

function TasksContent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const tasksTable = blink.db.table<Task>('tasks')

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () =>
      tasksTable.list({
        where: { userId: user!.id },
        orderBy: { createdAt: 'desc' },
      }),
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      tasksTable.create({ title, userId: user!.id, isCompleted: '0' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
      setNewTitle('')
      setAdding(false)
      toast.success('Задача добавлена')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Не удалось добавить задачу')
      setAdding(false)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, current }: { id: string; current: string }) =>
      tasksTable.update(id, { isCompleted: current === '1' ? '0' : '1' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] }),
    onError: () => toast.error('Не удалось обновить задачу'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksTable.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
      toast.success('Задача удалена')
    },
    onError: () => toast.error('Не удалось удалить задачу'),
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    setAdding(true)
    createMutation.mutate(title)
  }

  const completed = tasks.filter((t) => Number(t.isCompleted) > 0)
  const pending = tasks.filter((t) => Number(t.isCompleted) === 0)

  return (
    <PageBackground column>
      <PageHeader title="Задачи" />

      {/* Add-task input — its own SEPARATE floating fixed element, one standard gap below the header */}
      <form
        onSubmit={handleAdd}
        className="fixed inset-x-0 z-40 px-4"
        style={{ top: `calc(${HEADER_CLEARANCE} + ${GAP_PX}px)` }}
      >
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all"
          style={{
            background: 'rgba(40,40,40,0.55)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
          }}
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Добавить задачу..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
          >
            <Plus size={16} />
          </button>
        </div>
      </form>

      {/* Task list — clears header + add-task pill + gap. The +74px is this
          page's own floating input pill height + gap (not shared chrome,
          so it's a local constant, not one from lib/layout). */}
      <div className="flex-1 px-4 pb-4" style={{ paddingTop: `calc(${HEADER_CLEARANCE} + ${GAP_PX}px + 74px)` }}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <Check className="h-8 w-8 text-white/70" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Пока нет задач</h2>
            <p className="mt-1 text-sm text-white/45">Добавьте первую задачу выше.</p>
          </div>
        ) : (
          <div
            className="space-y-1 rounded-xl p-2"
            style={{
              background: 'rgba(40,40,40,0.25)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Pending tasks */}
            {pending.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleMutation.mutate({ id: task.id, current: task.isCompleted })}
                onDelete={() => deleteMutation.mutate(task.id)}
              />
            ))}

            {/* Completed tasks */}
            {completed.length > 0 && (
              <>
                <div className="py-2 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                    Завершено ({completed.length})
                  </p>
                </div>
                {completed.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleMutation.mutate({ id: task.id, current: task.isCompleted })}
                    onDelete={() => deleteMutation.mutate(task.id)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </PageBackground>
  )
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task
  onToggle: () => void
  onDelete: () => void
}) {
  const done = Number(task.isCompleted) > 0

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06]">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          done
            ? 'border-white bg-white text-black'
            : 'border-white/25 hover:border-white/60'
        }`}
      >
        {done && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Title */}
      <span
        className={`min-w-0 flex-1 break-words text-sm ${
          done ? 'text-white/35 line-through' : 'text-white/90'
        }`}
      >
        {task.title}
      </span>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/40 opacity-0 transition-all hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
