'use client'
import Link from 'next/link'
import { useSetting } from '@/components/SettingsProvider'
import { Phone, MessageCircle } from 'lucide-react'
import Logo from '@/components/Logo'

export default function Footer() {
  const name = useSetting('business_name', 'Auto Supply')
  const phone = useSetting('business_phone', '')
  const whatsapp = useSetting('business_whatsapp', '')

  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Logo mark={40} textClass="text-base" />
          </div>
          <p className="text-steel text-sm">Genuine parts, lubricants and auto supplies. Nationwide delivery across Ghana.</p>
        </div>
        <div>
          <div className="t-display text-xs tracking-widest text-steel mb-3">Shop</div>
          <div className="flex flex-col gap-1.5 text-sm">
            <Link href="/products" className="text-chrome hover:text-amber">All products</Link>
            <Link href="/cart" className="text-chrome hover:text-amber">Your cart</Link>
          </div>
        </div>
        <div>
          <div className="t-display text-xs tracking-widest text-steel mb-3">Contact</div>
          <div className="flex flex-col gap-2 text-sm">
            {phone && <a href={`tel:${phone}`} className="flex items-center gap-2 text-chrome hover:text-amber"><Phone className="w-4 h-4" /> {phone}</a>}
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} className="flex items-center gap-2 text-chrome hover:text-amber"><MessageCircle className="w-4 h-4" /> WhatsApp</a>}
          </div>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-steel text-xs t-data">
        © {new Date().getFullYear()} {name}
        <h3>Developed by Elinart</h3>
      </div>
    </footer>
  )
}
