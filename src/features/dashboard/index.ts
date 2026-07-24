// Dashboard framework
export { DashboardRenderer } from './DashboardRenderer'
export { resolveWidget } from './resolve-widget'
export { sizeToClasses } from './grid-utils'

// Types
export type {
  WidgetSize,
  WidgetType,
  WidgetConfig,
  DashboardConfig,
  WidgetProps,
  WidgetComponent,
  WidgetRegistryEntry,
} from './types'

// Widget components
export { KpiWidget } from './widgets/KpiWidget'
export { MetricWidget } from './widgets/MetricWidget'
export { ChartWidget } from './widgets/ChartWidget'
export { ListWidget } from './widgets/ListWidget'
export { ProgressWidget } from './widgets/ProgressWidget'
export { TimelineWidget } from './widgets/TimelineWidget'
export { CustomWidget } from './widgets/CustomWidget'

// Shared
export { WidgetShell } from './components/WidgetShell'
