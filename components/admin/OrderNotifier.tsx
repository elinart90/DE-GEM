'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// Mounted once in the dashboard layout. Listens for new orders via Supabase
// Realtime (respects RLS — only staff receive these) and alerts the admin.
export default function OrderNotifier() {
  const router = useRouter()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    const sb = createClient()
    const channel = sb
      .channel('admin-orders-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: any) => {
          const o = payload.new || {}
          const num = o.order_number ?? 'New order'
          const total = o.total != null ? `GH₵${Number(o.total).toFixed(2)}` : ''
          toast.success(`New order — ${num}  ${total}`, { duration: 8000, icon: '🛒' })
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const n = new Notification('New order received', { body: `${num} — ${total}` })
              n.onclick = () => { window.focus(); router.push('/dashboard/orders') }
            } catch {}
          }
        }
      )
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [router])

  return null
}
