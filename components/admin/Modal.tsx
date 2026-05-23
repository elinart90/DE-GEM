'use client'
import { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full lg:max-w-lg bg-panel border border-line rounded-t-xl lg:rounded-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <h2 className="t-display text-lg">{title}</h2>
          <button onClick={onClose} className="text-steel hover:text-chrome p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-line">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-steel text-xs t-display tracking-wide mb-1.5">{label}</span>
      {children}
    </label>
  )
}
