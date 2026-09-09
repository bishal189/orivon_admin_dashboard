import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section className={`rounded-xl border border-slate-200/80 bg-white shadow-card ${className}`}>
      {children}
    </section>
  )
}

interface SectionHeaderProps {
  children: ReactNode
  action?: string
  onAction?: () => void
}

export function SectionHeader({ children, action, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-slate-800">{children}</h2>
      {action && (
        <button
          className="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-800"
          onClick={onAction}
          type="button"
        >
          {action}
          <ArrowUpRight className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

const statusStyles = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
}

interface StatusBadgeProps {
  children: ReactNode
  tone: keyof typeof statusStyles
}

export function StatusBadge({ children, tone }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ring-1 ring-inset ${statusStyles[tone]}`}>
      {children}
    </span>
  )
}
