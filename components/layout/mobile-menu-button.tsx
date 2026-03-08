'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from './sidebar-context'

export function MobileMenuButton() {
  const { toggle } = useSidebar()
  return (
    <button
      onClick={toggle}
      className="mr-2 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
