import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import OrderNotifier from '@/components/admin/OrderNotifier'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load role/name; if the app_users row is missing, fall back gracefully.
  const { data: profile } = await supabase
    .from('app_users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  const name = profile?.name || user.email || 'User'
  const role = profile?.role || 'sales_rep'

  return (
    <div className="lg:flex min-h-screen">
      <OrderNotifier />
      <Sidebar name={name} role={role} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
