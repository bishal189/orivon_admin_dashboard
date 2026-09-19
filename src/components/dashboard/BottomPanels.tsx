import { ArrowUpRight, Check, FileText, HeartPulse } from 'lucide-react'
import type { DashboardOverview } from '../../data/dashboard'
import { Card } from '../ui'

export function PromoCard({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="relative min-h-[170px] overflow-hidden rounded-xl bg-gradient-to-r from-[#f4e8de] to-[#f0ddd1] p-6">
      <div className="relative z-10 max-w-[260px]">
        <p className="text-[22px] font-semibold leading-[1.05] text-slate-800">
          Helping dreams
          <br />
          of parenthood come true
        </p>
        <p className="mt-3 text-[10px] leading-relaxed text-slate-600">
          Manage trusted, accurate and SEO-friendly content for a healthier tomorrow.
        </p>
        <button
          className="mt-4 flex items-center gap-2 rounded-md bg-brand-700 px-3 py-2 text-[10px] font-medium text-white hover:bg-brand-800"
          onClick={onCreate}
          type="button"
        >
          Create Content
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
      <div className="absolute -bottom-16 right-[-30px] h-60 w-60 rounded-full bg-[#ddbca9]/80 sm:right-5" />
      <div className="absolute -bottom-14 right-[80px] h-44 w-32 rotate-12 rounded-[50%] bg-[#c78f78]/50 sm:right-[135px]" />
      <HeartPulse className="absolute bottom-10 right-16 h-20 w-20 text-white/65 sm:right-24" strokeWidth={1.2} />
    </div>
  )
}

export function SiteNotesCard({
  health,
  reviewQueue,
  totals,
}: {
  health: DashboardOverview['seoHealth']
  reviewQueue: DashboardOverview['reviewQueue']
  totals: DashboardOverview['totals']
}) {
  const notes = [
    reviewQueue.medicalReview > 0
      ? `${reviewQueue.medicalReview} item(s) waiting in medical review.`
      : 'No medical reviews currently pending.',
    health.missingMetaDescriptions > 0
      ? `${health.missingMetaDescriptions} page(s) are missing meta descriptions.`
      : 'Meta descriptions look complete on reviewed content.',
    totals.openNotFound > 0
      ? `${totals.openNotFound} open 404 URL(s) need redirects or fixes.`
      : 'No unresolved 404 URLs in the monitor.',
    'Never publish near-identical location or service×location doorway pages.',
    'Keep review dates current for YMYL medical articles.',
  ]

  return (
    <Card className="border-emerald-100 bg-emerald-50/60 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <FileText className="h-4 w-4 text-brand-600" />
        Site Notes
      </div>
      <ul className="mt-3 space-y-2">
        {notes.map((note) => (
          <li className="flex gap-2 text-[10px] leading-relaxed text-slate-600" key={note}>
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
            {note}
          </li>
        ))}
      </ul>
    </Card>
  )
}
