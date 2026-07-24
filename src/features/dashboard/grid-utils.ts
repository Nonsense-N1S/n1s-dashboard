import type { WidgetSize } from './types'

// Maps widget size to Tailwind grid span classes.
// Grid: 2 columns on mobile, 4 on desktop.
export function sizeToClasses(size: WidgetSize): string {
  switch (size) {
    case 'full':
      return 'col-span-2 md:col-span-4'
    case 'large':
      return 'col-span-2 md:col-span-3'
    case 'half':
      return 'col-span-1 md:col-span-2'
    case 'square':
      return 'col-span-1 aspect-square'
    case 'small':
      return 'col-span-1'
    default:
      return 'col-span-1 md:col-span-2'
  }
}
