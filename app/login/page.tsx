'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    if (!email || !password) {
      toast.error('Enter email and password')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* hazard strip */}
        <div className="hazard h-1.5 rounded-t mb-0" />
        <div className="bg-panel border border-line border-t-0 rounded-b-lg p-7">
          <div className="flex items-center gap-2.5 mb-7">
            <Logo mark={36} textClass="text-xl" />
          </div>

          <label className="block text-steel text-xs t-display mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && signIn()}
            className="w-full rounded px-3 py-2.5 mb-4 text-sm"
            placeholder="you@example.com"
          />

          <label className="block text-steel text-xs t-display mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && signIn()}
            className="w-full rounded px-3 py-2.5 mb-6 text-sm"
            placeholder="••••••••"
          />

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-amber hover:bg-amber/90 disabled:opacity-60 text-ink t-display py-2.5 rounded flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Sign in
          </button>
        </div>
        <p className="text-steel text-xs text-center mt-4 font-mono">
          Authorized personnel only
        </p>
      </div>
    </main>
  )
}
