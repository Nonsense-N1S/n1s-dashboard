import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'n1s-business-app-c5q4aqdi',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_KUX_zrvbk2x4NqFCgO3X2M7CMlvnIOea',
  authRequired: false,
  auth: { mode: 'headless' },
})
