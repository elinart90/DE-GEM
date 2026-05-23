'use client'
import { useSetting } from '@/components/SettingsProvider'
import { Wrench } from 'lucide-react'

// One logo, read from the `business_logo_url` setting. Set it once in
// admin Settings → Business and it updates everywhere this renders.
// `mark` size is the height in px. When a logo URL exists, the separate
// text label is hidden (your logo already contains the name).
export default function Logo({
  mark = 32,
  showName = true,
  textClass = 'text-lg',
}: {
  mark?: number
  showName?: boolean
  textClass?: string
}) {
  const url = useSetting('business_logo_url', '')
  const name = useSetting('business_name', 'Auto Supply')

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ height: mark }} className="w-auto object-contain rounded" />
    )
  }

  return (
    <span className="flex items-center gap-2">
      <span className="rounded bg-amber flex items-center justify-center shrink-0" style={{ width: mark, height: mark }}>
        <Wrench className="text-ink" style={{ width: mark * 0.5, height: mark * 0.5 }} strokeWidth={2.5} />
      </span>
      {showName && <span className={`t-display ${textClass}`}>{name}</span>}
    </span>
  )
}
