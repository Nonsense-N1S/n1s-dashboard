import { KpiWidget } from './widgets/KpiWidget'
import { MetricWidget } from './widgets/MetricWidget'
import { ChartWidget } from './widgets/ChartWidget'
import { ListWidget } from './widgets/ListWidget'
import { ProgressWidget } from './widgets/ProgressWidget'
import { TimelineWidget } from './widgets/TimelineWidget'
import { CustomWidget } from './widgets/CustomWidget'
import type { WidgetType, WidgetComponent } from './types'

const WIDGET_MAP: Record<WidgetType, WidgetComponent> = {
  kpi: KpiWidget,
  metric: MetricWidget,
  chart: ChartWidget,
  list: ListWidget,
  progress: ProgressWidget,
  timeline: TimelineWidget,
  custom: CustomWidget,
}

export function resolveWidget(type: WidgetType): WidgetComponent {
  return WIDGET_MAP[type] ?? CustomWidget
}
