import type { ReactNode } from 'react'

// Widget size presets — each maps to a grid span
export type WidgetSize = 'full' | 'half' | 'square' | 'small' | 'large'

// Widget type identifier — maps to a registered component
export type WidgetType =
  | 'kpi'
  | 'metric'
  | 'chart'
  | 'list'
  | 'progress'
  | 'timeline'
  | 'custom'

// Single widget configuration from the backend
export interface WidgetConfig {
  id: string
  type: WidgetType
  size: WidgetSize
  title?: string
  subtitle?: string
  order?: number
  // Widget-specific data — each widget type defines its own shape
  data?: Record<string, unknown>
  // Future: grid column/row overrides for advanced layouts
  gridCol?: number
  gridRow?: number
  /** Visual material: 'graphite' for important widgets, 'glass' (default) for secondary */
  variant?: 'graphite' | 'glass'
}

// Full dashboard configuration
export interface DashboardConfig {
  title?: string
  widgets: WidgetConfig[]
}

// Props every widget component receives
export interface WidgetProps {
  config: WidgetConfig
}

// Widget component signature
export type WidgetComponent = React.FC<WidgetProps>

// Registry entry
export interface WidgetRegistryEntry {
  component: WidgetComponent
  label: string
  defaultSize: WidgetSize
}
