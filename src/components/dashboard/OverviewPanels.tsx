import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
} from 'lucide-react'
import type { DashboardOverview, DashboardStat } from '../../data/dashboard'
import { Card, SectionHeader } from '../ui'

export function StatCard({
  value,
  label,
  icon: Icon,
  tone,
  onViewAll,
}: DashboardStat & { onViewAll?: () => void }) {
  return (
    <Card className="min-w-[170px] flex-1 p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-xl font-semibold leading-none text-slate-900">{value}</p>
          <p className="mt-1 text-[11px] text-slate-500">{label}</p>
        </div>
      </div>
      {onViewAll ? (
        <button className="mt-3 flex items-center gap-1 text-[10px] font-medium text-brand-600" onClick={onViewAll} type="button">
          View all
          <ArrowUpRight className="h-3 w-3" />
        </button>
      ) : null}
    </Card>
  )
}

export function SeoHealthCard({
  health,
  onOpenTitlesMeta,
  onOpen404,
}: {
  health: DashboardOverview['seoHealth']
  onOpenTitlesMeta?: () => void
  onOpen404?: () => void
}) {
  const score = health.score
  const fill = Math.max(0, Math.min(100, score))
  return (
    <Card className="p-4">
      <SectionHeader action={onOpenTitlesMeta ? 'Fix SEO issues' : undefined} onAction={onOpenTitlesMeta}>
        SEO Health
      </SectionHeader>
      <div className="mt-4 flex items-center gap-5">
        <div
          className="h-28 w-28 shrink-0 rounded-full p-2.5"
          style={{ background: `conic-gradient(#26775e 0 ${fill}%, #e5eee9 ${fill}% 100%)` }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
            <span className="text-2xl font-bold text-slate-800">{score}%</span>
          </div>
        </div>
        <ul className="min-w-0 space-y-2 text-[11px] text-slate-600">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            {health.indexable} Indexable pages
          </li>
          <li className="flex items-center gap-2">
            {health.missingMetaDescriptions > 0
              ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
            {health.missingMetaDescriptions} Missing meta descriptions
          </li>
          <li className="flex items-center gap-2">
            {health.missingH1 > 0
              ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
            {health.missingH1} Missing H1 tags
          </li>
          <li className="flex items-center gap-2">
            {health.openNotFound > 0
              ? <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
            <button className="text-left hover:underline" onClick={onOpen404} type="button">
              {health.openNotFound} Open 404 URLs
            </button>
          </li>
          <li className="flex items-center gap-2">
            {health.sitemapHealthy
              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            {health.sitemapHealthy ? 'Sitemap is healthy' : 'Review 404s before sitemap growth'}
          </li>
        </ul>
      </div>
      <p className={`mt-3 text-[10px] font-medium ${score >= 85 ? 'text-emerald-700' : score >= 70 ? 'text-amber-700' : 'text-orange-700'}`}>
        {score >= 85 ? 'Great! Your site is in good shape.' : score >= 70 ? 'Decent — a few SEO gaps to close.' : 'Needs attention — fix missing meta/H1 and 404s.'}
      </p>
    </Card>
  )
}

export function ContentReviewCard({
  queue,
  onOpenContent,
}: {
  queue: DashboardOverview['reviewQueue']
  onOpenContent?: () => void
}) {
  const rows = [
    { label: 'Draft', count: queue.draft },
    { label: 'Editorial Review', count: queue.editorialReview },
    { label: 'Medical Review', count: queue.medicalReview },
    { label: 'Scheduled', count: queue.scheduled },
    { label: 'Published', count: queue.published, complete: true },
  ]

  return (
    <Card className="p-4">
      <SectionHeader action={onOpenContent ? 'View pages' : undefined} onAction={onOpenContent}>
        Content Review
      </SectionHeader>
      <div className="mt-3 divide-y divide-slate-100">
        {rows.map(({ label, count, complete }) => (
          <div className="flex items-center py-2.5" key={label}>
            {complete
              ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
              : <Clock3 className="mr-2 h-4 w-4 text-slate-400" />}
            <span className="text-[11px] text-slate-600">{label}</span>
            <span className="ml-auto text-xs font-semibold text-slate-800">{count}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function AppointmentsSummaryCard({
  totals,
  appointments,
  onOpen,
}: {
  totals: DashboardOverview['totals']
  appointments: DashboardOverview['appointments']
  onOpen?: () => void
}) {
  const rows = [
    { label: 'New', count: appointments.NEW || 0 },
    { label: 'Contacted', count: appointments.CONTACTED || 0 },
    { label: 'Confirmed', count: appointments.CONFIRMED || 0 },
    { label: 'Completed', count: appointments.COMPLETED || 0 },
  ]
  return (
    <Card className="p-4">
      <SectionHeader action={onOpen ? 'Open inbox' : undefined} onAction={onOpen}>
        Appointments
      </SectionHeader>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{totals.appointments}</p>
      <p className="text-[11px] text-slate-500">{totals.appointmentsNew} new · needs follow-up</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div className="rounded-lg bg-slate-50 px-2.5 py-2" key={row.label}>
            <p className="text-[10px] text-slate-500">{row.label}</p>
            <p className="text-sm font-semibold text-slate-800">{row.count}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
