'use client'
import { useSetting } from '@/components/SettingsProvider'

export default function PriceTag({ amount, className }: { amount: number; className?: string }) {
  const currency = useSetting('payment_currency', 'GH₵')
  return <span className={className}>{currency}{Number(amount).toFixed(2)}</span>
}
