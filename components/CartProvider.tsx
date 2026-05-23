'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type CartItem = {
  id: string
  name: string
  sku: string
  price: number
  image: string | null
  qty: number
}

type CartCtx = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  count: number
  subtotal: number
}

const Ctx = createContext<CartCtx | null>(null)
const KEY = 'autosupply_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(KEY, JSON.stringify(items)) } catch {}
    }
  }, [items, ready])

  function add(item: Omit<CartItem, 'qty'>, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i))
      return [...prev, { ...item, qty }]
    })
  }
  function setQty(id: string, qty: number) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)))
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }
  function clear() { setItems([]) }

  const count = items.reduce((n, i) => n + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <Ctx.Provider value={{ items, add, setQty, remove, clear, count, subtotal }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart must be used inside CartProvider')
  return c
}
