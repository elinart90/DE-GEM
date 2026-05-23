import { Construction } from 'lucide-react'

export default function ComingNext({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="hazard h-1 w-16 rounded mb-4" />
      <h1 className="t-display text-2xl mb-6">{title}</h1>
      <div className="bg-panel border border-line rounded-lg p-8 flex flex-col items-center text-center">
        <Construction className="w-8 h-8 text-amber mb-3" />
        <div className="t-display text-sm tracking-widest text-chrome mb-1">{phase}</div>
        <p className="text-steel text-sm max-w-sm">
          This module is scaffolded in the build plan and comes next. The shell, auth, and
          settings are live now.
        </p>
      </div>
    </div>
  )
}
