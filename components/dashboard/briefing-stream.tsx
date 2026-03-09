'use client'

import { useEffect, useState } from 'react'

function getGreeting(): string {
  const hour = parseInt(
    new Date().toLocaleString('en-US', { timeZone: 'America/Denver', hour: 'numeric', hour12: false })
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function BriefingStream({ firstName }: { firstName: string }) {
  const full = `${getGreeting()}, ${firstName}.`
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(full.slice(0, i))
      if (i >= full.length) clearInterval(interval)
    }, 50)
    return () => clearInterval(interval)
  }, [full])

  return (
    <h1 className="text-3xl font-bold tracking-tight min-h-[2.25rem]">
      {displayed}
      {displayed.length < full.length && (
        <span className="inline-block h-7 w-0.5 bg-foreground ml-0.5 align-middle animate-[blink_1s_step-end_infinite]" />
      )}
    </h1>
  )
}
