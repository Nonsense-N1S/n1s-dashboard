/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import type { ReactNode } from 'react'
import indexCss from '../index.css?url'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' },
      { title: 'N1S — Personal Business Dashboard' },
      { name: 'description', content: 'Your essential dashboard for small business owners.' },
      { name: 'theme-color', content: '#000000' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'N1S — Personal Business Dashboard' },
      { property: 'og:description', content: 'Your essential dashboard for small business owners.' },
      { property: 'og:site_name', content: 'N1S' },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'N1S' },
      { name: 'mobile-web-app-capable', content: 'yes' },
    ],
    links: [
      { rel: 'stylesheet', href: indexCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                { '@type': 'WebSite', name: 'N1S', url: '/' },
                { '@type': 'Organization', name: 'N1S', url: '/', sameAs: [] },
              ],
            }),
          }}
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <BlinkUIProvider theme="linear" darkMode="system">
            <Toaster />
            {children}
          </BlinkUIProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
