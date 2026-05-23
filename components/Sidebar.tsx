'use client'
import Logo from '@/components/Logo'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package, Boxes, ClipboardList, Building2,
  Settings, LogOut, Menu, X,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',           label: 'Overview',  icon: LayoutDashboard },
  { href: '/dashboard/products',  label: 'Products',  icon: Package },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Boxes },
  { href: '/dashboard/orders',    label: 'Orders',    icon: ClipboardList },
  { href: '/dashboard/branches',  label: 'Branches',  icon: Building2 },
  { href: '/dashboard/settings',  label: 'Settings',  icon: Settings },
]

export default function Sidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLinks = () => (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors',
              active
                ? 'bg-panel2 text-chrome border-l-2 border-amber'
                : 'text-steel hover:text-chrome hover:bg-panel2/60 border-l-2 border-transparent',
            ].join(' ')}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="t-display tracking-wide">{label}</span>
          </Link>
        )
      })}
    </nav>
  )

  const Brand = () => (
    <div className="flex items-center gap-2.5 px-3 mb-6">
      <Logo mark={32} textClass="text-lg leading-none" />
    </div>
  )

  const Footer = () => (
    <div className="mt-auto pt-4 border-t border-line">
      <div className="px-3 mb-3">
        <div className="text-chrome text-sm truncate">{name}</div>
        <div className="text-amber text-[10px] t-display tracking-widest">{role}</div>
      </div>
      <button
        onClick={signOut}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm text-steel hover:text-bad hover:bg-panel2/60 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="t-display tracking-wide">Sign out</span>
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-panel border-b border-line">
        <div className="flex items-center gap-2">
          <Logo mark={28} textClass="text-base" />
        </div>
        <button onClick={() => setOpen(true)} className="text-chrome p-1">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-panel border-r border-line p-4 flex flex-col">
            <div className="flex justify-between items-start">
              <Brand />
              <button onClick={() => setOpen(false)} className="text-steel p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks />
            <Footer />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-panel border-r border-line p-4 flex-col h-screen sticky top-0">
        <Brand />
        <NavLinks />
        <Footer />
      </aside>
    </>
  )
}
