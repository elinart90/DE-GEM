'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import { useSetting } from '@/components/SettingsProvider'
import { Search, ShoppingCart } from 'lucide-react'
import Logo from '@/components/Logo'

export default function Header() {
  const { count } = useCart()
  const router = useRouter()
  const name = useSetting('business_name', 'Auto Supply')
  const [q, setQ] = useState('')

  function search() {
    router.push(`/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
  }

  return (
    <header className="sticky top-0 z-30 bg-ink/90 backdrop-blur border-b border-line">
      <div className="hazard h-1" />
      <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-3 lg:gap-5">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo mark={32} textClass="text-lg hidden sm:block" />
        </Link>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-steel absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search parts, brands, your car…"
            className="w-full rounded-full pl-9 pr-3 py-2 text-sm bg-panel"
          />
        </div>

        <Link href="/products" className="t-display text-sm text-steel hover:text-chrome hidden lg:block">Shop</Link>

        <Link href="/cart" className="relative shrink-0 p-2 text-chrome hover:text-amber transition-colors">
          <ShoppingCart className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-amber text-ink text-[10px] t-data font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
