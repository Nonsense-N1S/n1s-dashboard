import { useEffect } from 'react'

/**
 * Fixes a real WebKit bug: in iOS standalone (Home Screen) PWA mode, `100dvh`
 * and `position: fixed; inset: 0` are sized against a viewport height that's
 * a few dozen pixels short of the actual screen — the shortfall lands right
 * at the bottom edge, under the home indicator, and shows through as a black
 * strip (the <body> background) below our fixed page-background layers.
 *
 * This only shows up in standalone display-mode; Safari tabs are unaffected,
 * which is why it wasn't caught until testing the "Add to Home Screen" build.
 *
 * Fix: track the real window height in a CSS custom property and use that
 * instead of dvh for anything that needs to bleed to the true bottom edge.
 */
export function useAppHeight() {
  useEffect(() => {
    const setAppHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${height}px`)
    }

    setAppHeight()

    window.addEventListener('resize', setAppHeight)
    window.addEventListener('orientationchange', setAppHeight)
    window.visualViewport?.addEventListener('resize', setAppHeight)

    return () => {
      window.removeEventListener('resize', setAppHeight)
      window.removeEventListener('orientationchange', setAppHeight)
      window.visualViewport?.removeEventListener('resize', setAppHeight)
    }
  }, [])
}
