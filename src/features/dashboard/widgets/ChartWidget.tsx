import type { WidgetProps } from '../types'
import { WidgetShell } from '../components/WidgetShell'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface ChartData {
  chartType?: 'area' | 'bar'
  data: Record<string, unknown>[]
  xKey: string
  yKey: string
  color?: string
}

const PLACEHOLDER_DATA = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 280 },
  { name: 'Fri', value: 590 },
  { name: 'Sat', value: 350 },
  { name: 'Sun', value: 470 },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#1a1a1a]/95 px-3 py-2 shadow-lg">
      <p className="text-[11px] text-white/50 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">
        {payload[0].value}
      </p>
    </div>
  )
}

export function ChartWidget({ config }: WidgetProps) {
  const data = (config.data as ChartData) || {
    chartType: 'area',
    data: PLACEHOLDER_DATA,
    xKey: 'name',
    yKey: 'value',
  }

  const chartData = data.data?.length > 0 ? data.data : PLACEHOLDER_DATA
  const color = data.color || 'var(--primary)'
  const isGraphite = config.variant === 'graphite'

  const gridStroke = isGraphite ? 'rgba(255,255,255,0.08)' : 'var(--border)'
  const gridOpacity = isGraphite ? 1 : 0.5
  const axisTickFill = isGraphite ? 'rgba(255,255,255,0.50)' : 'var(--muted-foreground)'
  const axisTickWeight = 500
  const activeDotStroke = isGraphite ? '#1a1a1a' : 'var(--card)'
  const gradientStartOpacity = isGraphite ? 0.20 : 0.25

  return (
    <WidgetShell title={config.title} subtitle={config.subtitle} variant={config.variant}>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {data.chartType === 'bar' ? (
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridStroke}
                strokeOpacity={gridOpacity}
              />
              <XAxis
                dataKey={data.xKey}
                tick={{ fontSize: 11, fill: axisTickFill, fontWeight: axisTickWeight }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 10, fill: axisTickFill }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar
                dataKey={data.yKey}
                fill={color}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={gradientStartOpacity} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridStroke}
                strokeOpacity={gridOpacity}
              />
              <XAxis
                dataKey={data.xKey}
                tick={{ fontSize: 11, fill: axisTickFill, fontWeight: axisTickWeight }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 10, fill: axisTickFill }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={data.yKey}
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#grad-${config.id})`}
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: activeDotStroke,
                  fill: color,
                }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  )
}
