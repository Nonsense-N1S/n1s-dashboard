import { createFileRoute } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { PageBackground } from '@/components/PageBackground'
import { DashboardRenderer } from '@/features/dashboard'
import type { DashboardConfig } from '@/features/dashboard/types'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/_app/metrics')({
  head: () => ({
    meta: [
      { title: 'Metrics — N1S' },
    ],
  }),
  component: MetricsPage,
})

function MetricsPage() {
  return (
    <BlinkClientBoundary fallback={<PageSkeleton />}>
      <MetricsContent />
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

interface DashboardData {
  finance: Record<string, string | number>
  production: Record<string, string | number>
  masters: Array<Record<string, string | number>>
  orders_at_risk: Array<Record<string, string | number>>
}

function buildConfig(data: DashboardData): DashboardConfig {
  const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.-]/g, ''))
    return isNaN(n) ? 0 : n
  }
  const round1 = (v: number) => Math.round(v * 10) / 10

  const revenue = num(data.finance['Приход по продажам, ₽'])
  const financeIncome = num(data.finance['Приход (Финансы), ₽'])
  const financeExpense = num(data.finance['Расход (Финансы), ₽'])
  const ordersInWork = num(data.production['Заказов в работе, шт'])
  const burning = num(data.production['Горит дедлайн (<7 дн), шт'])
  const burningPct = ordersInWork > 0 ? Math.round((burning / ordersInWork) * 100) : 0
  const hoursLeft = num(data.production['Остаток часов по всем заказам'])
  const salesThisMonth = num(data.production['Продаж за текущий месяц, шт'])

  const sortedOrders = [...data.orders_at_risk].sort(
    (a, b) => num(a['Дней']) - num(b['Дней'])
  )

  return {
    title: 'Дашборд',
    widgets: [
      {
        id: 'kpi-revenue',
        type: 'kpi',
        size: 'half',
        title: 'Выручка',
        order: 1,
        variant: 'graphite',
        data: {
          value: `${revenue.toLocaleString('ru-RU')} ₽`,
          changeLabel: 'приход по продажам',
        },
      },
      {
        id: 'kpi-orders',
        type: 'kpi',
        size: 'half',
        title: 'Заказов в работе',
        order: 2,
        variant: 'graphite',
        data: {
          value: String(ordersInWork),
          change: -burningPct,
          changeLabel: `${burning} из ${ordersInWork} горят дедлайном`,
        },
      },
      {
        id: 'metric-hours',
        type: 'metric',
        size: 'small',
        title: 'Остаток часов',
        order: 3,
        variant: 'graphite',
        data: {
          value: `${round1(hoursLeft)} ч`,
          label: 'по всем заказам',
        },
      },
      {
        id: 'metric-sales',
        type: 'metric',
        size: 'small',
        title: 'Продаж за месяц',
        order: 4,
        variant: 'graphite',
        data: {
          value: String(salesThisMonth),
          label: 'шт',
        },
      },
      {
        id: 'progress-finance',
        type: 'progress',
        size: 'full',
        title: 'Финансы',
        order: 5,
        variant: 'graphite',
        data: {
          items: [
            {
              id: 'income',
              label: 'Приход',
              value: financeIncome,
              max: Math.max(financeIncome, financeExpense, 1),
              color: '#10b981',
              valueLabel: `${financeIncome.toLocaleString('ru-RU')} ₽`,
            },
            {
              id: 'expense',
              label: 'Расход',
              value: financeExpense,
              max: Math.max(financeIncome, financeExpense, 1),
              color: '#ef4444',
              valueLabel: `${financeExpense.toLocaleString('ru-RU')} ₽`,
            },
          ],
        },
      },
      {
        id: 'list-masters',
        type: 'list',
        size: 'full',
        title: 'Загрузка мастеров',
        order: 6,
        variant: 'graphite',
        data: {
          items: data.masters.map((m, i) => ({
            id: String(i),
            primary: String(m['Мастер']),
            secondary: `Заказов: ${m['Заказов в работе']}`,
            trailing: `${round1(num(m['Остаток часов']))} ч`,
            status: num(m['Горит (<7дн)']) > 0 ? 'warning' : 'default',
          })),
        },
      },
      {
        id: 'list-orders-at-risk',
        type: 'list',
        size: 'full',
        title: 'Заказы на контроле',
        order: 7,
        variant: 'graphite',
        data: {
          items: sortedOrders.map((o, i) => {
            const days = num(o['Дней'])
            return {
              id: String(i),
              primary: `${o['Клиент']} — ${o['Изделие']}`,
              secondary: `${o['Стадия']} · дедлайн ${o['Дедлайн']}`,
              trailing: `${days} дн.`,
              status: days < 0 ? 'error' : days <= 7 ? 'warning' : 'default',
            }
          }),
        },
      },
    ],
  }
}

function MetricsContent() {
  const { user } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-data', user?.email],
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch(
        `https://n1sense2.app.n8n.cloud/webhook/dashboard-router?email=${encodeURIComponent(user!.email)}`
      )
      if (!response.ok) throw new Error(`Dashboard error: ${response.status}`)
      return response.json()
    },
    enabled: !!user?.email,
  })

  if (isLoading) {
    return (
      <PageBackground>
        <div className="flex min-h-dvh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      </PageBackground>
    )
  }

  if (isError || !data) {
    return (
      <PageBackground>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm text-white/60">Не удалось загрузить данные дашборда</p>
        </div>
      </PageBackground>
    )
  }

  return (
    <PageBackground>
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} className="pb-4">
        <DashboardRenderer config={buildConfig(data)} />
      </div>
    </PageBackground>
  )
}
