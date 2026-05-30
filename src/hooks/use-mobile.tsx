import * as React from "react"

// Raised from 768 → 1024 on 260530 so iPad portrait (768) and iPad Pro (1024)
// both collapse the shadcn Sidebar to a Sheet drawer.
// See .planning/quick/260530-responsive-app-shell/PLAN.md and
// MEMORY: [[sidebar-collapsible-none-dead-drawer]].
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
