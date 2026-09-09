import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
} from 'lucide-react'
import type { DashboardStat } from '../../data/dashboard'
import { Card, SectionHeader } from '../ui'

export function StatCard({ value, label, icon: Icon, tone }: DashboardStat) {
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
      <button className="mt-3 flex items-center gap-1 text-[10px] font-medium text-brand-600" type="button">
        View all
        <ArrowUpRight className="h-3 w-3" />
      </button>
    </Card>
  )
}

export function SeoHealthCard() {
  return (
    <Card className="p-4">
      <SectionHeader action="View report">SEO Health</SectionHeader>
      <div className="mt-4 flex items-center gap-5">
        <div className="h-28 w-28 shrink-0 rounded-full bg-[conic-gradient(#26775e_0_92%,#e5eee9_92%)] p-2.5">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
            <span className="text-2xl font-bold text-slate-800">92%</span>
          </div>
        </div>
        <ul className="min-w-0 space-y-2 text-[11px] text-slate-600">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />136 Indexable pages</li>
          <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" />8 Missing meta descriptions</li>
          <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" />3 Missing H1 tags</li>
          <li className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-orange-500" />5 Broken internal links</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />Sitemap is healthy</li>
        </ul>
      </div>
      <p className="mt-3 text-[10px] font-medium text-emerald-700">Great! Your site is in good shape.</p>
    </Card>
  )
}

const reviewRows = [
  { label: 'Draft', count: 8 },
  { label: 'Editorial Review', count: 4 },
  { label: 'Medical Review', count: 6 },
  { label: 'Ready to Publish', count: 12, complete: true },
]

export function ContentReviewCard() {
  return (
    <Card className="p-4">
      <SectionHeader>Content Review</SectionHeader>
      <div className="mt-3 divide-y divide-slate-100">
        {reviewRows.map(({ label, count, complete }) => (
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

const chartPath = 'M0 119 L22 110 L43 118 L64 92 L85 78 L106 89 L127 106 L148 97 L169 71 L190 61 L211 70 L232 89 L253 68 L274 55 L295 66 L316 42 L337 29 L358 53 L379 43 L400 21 L420 12'

export function TrafficChartCard() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <SectionHeader>Organic Traffic</SectionHeader>
        <button className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[9px] text-slate-500" type="button">
          Last 30 days
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-3 h-[138px]">
        <svg aria-label="Organic traffic trend" className="h-full w-full" preserveAspectRatio="none" role="img" viewBox="0 0 420 140">
          <defs>
            <linearGradient id="traffic-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#62aa8d" stopOpacity=".35" />
              <stop offset="100%" stopColor="#62aa8d" stopOpacity=".02" />
            </linearGradient>
          </defs>
          {[25, 65, 105].map((y) => <line key={y} x1="0" x2="420" y1={y} y2={y} stroke="#e9eeeb" strokeDasharray="4 4" />)}
          <path d={`${chartPath} L420 140 L0 140 Z`} fill="url(#traffic-fill)" />
          <path d={chartPath} fill="none" stroke="#2d7960" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        </svg>
      </div>
      <div className="flex justify-between text-[9px] text-slate-400">
        <span>1 Aug</span><span>8 Aug</span><span>15 Aug</span><span>22 Aug</span><span>31 Aug</span>
      </div>
    </Card>
  )
}
