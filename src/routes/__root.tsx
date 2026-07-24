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

/**
 * Root route — owns the HTML document (SSR), global <head> (SEO-ready),
 * and the app-wide providers.
 *
 * NO app chrome (sidebar/top bar) is applied here by default, so every app —
 * landing pages, marketing sites, content, games — renders FULL-BLEED.
 * Building a SaaS / dashboard app? Opt into the sidebar shell by ADDING a
 * `src/routes/_app.tsx` pathless layout route with pages under `src/routes/_app/`
 * (a `_app.tsx` with no children conflicts with this index route). Keep this
 * root bare — don't add chrome here.
 *
 * SEO/AEO: <HeadContent /> renders the merged head() output (title, meta,
 * Open Graph, links) on the server, so crawlers and AI bots receive a
 * fully-rendered, indexable document on the first request. Per-page routes
 * override title/description via their own head().
 *
 * SSR: this document (and every route) is server-rendered/prerendered. A child
 * that reads browser-only state at render — `blink.auth`/`onAuthStateChanged`,
 * `localStorage`, `window` — must be wrapped in `<BlinkClientBoundary>`
 * (`src/components/BlinkClientBoundary.tsx`) or use the route's `ssr: false`,
 * or the page ships blank / hydration-mismatched. Do NOT read SDK/auth here.
 */
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { title: 'N1S — Personal Business Dashboard' },
      { name: 'description', content: 'Your essential dashboard for small business owners.' },
      { name: 'theme-color', content: '#007AFF' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'N1S — Personal Business Dashboard' },
      { property: 'og:description', content: 'Your essential dashboard for small business owners.' },
      // Shared-shell SEO defaults — set these to the real brand/locale per app.
      { property: 'og:site_name', content: 'N1S' },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [
      { rel: 'stylesheet', href: indexCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
        {/*
          WebSite + Organization entity (rendered on every page, once at the root).
          Gives Google's Knowledge Graph + AI answer engines explicit, machine-
          readable identity. Replace name/url and add the brand's real profile
          links to `sameAs` (LinkedIn, GitHub, X, Crunchbase) per app.
        */}
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
        {/*
          NOTE: the original source here also had Blink's injected IDE-only
          visual-editor "picker" runtime (an obfuscated base64 script tag) and
          a <script src="https://blink.new/widget.js?projectId=..."> tag.
          Both are Blink-generated boilerplate, not app code — and per earlier
          work in this project they were already identified as the cause of a
          cross-account rendering bug and removed once before. They are left
          out here for the same reason. If Blink's own tooling needs them
          re-injected for its in-app editor to work, Blink will add them back
          automatically — no need to hand-restore this block.
        */}
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <BlinkUIProvider theme="linear" darkMode="system">
            <Toaster />
            {/*
              Full-bleed by default — NO app chrome. Child routes render directly.
              SaaS / dashboard app? Opt in by adding a `src/routes/_app.tsx` layout
              route with pages under `src/routes/_app/`. Landing pages, marketing
              sites, content, and games stay full-bleed.
            */}
            {children}
          </BlinkUIProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
