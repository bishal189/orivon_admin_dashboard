import { ArrowUpRight, LoaderCircle } from 'lucide-react'
import type { DashboardOverview, QuickAction } from '../../data/dashboard'
import { EDITORIAL_STATUS_LABELS, mapServerStatus } from '../../api/client'
import { Card, SectionHeader, StatusBadge } from '../ui'

const tableColumns = ['Title', 'Type', 'Status', 'SEO', 'Review', 'Updated']

const typeLabels: Record<string, string> = {
  PAGE: 'Page',
  ARTICLE: 'Article',
  SERVICE: 'Service',
  CONDITION: 'Condition',
  PROVIDER: 'Doctor',
  LOCATION: 'Location',
  FAQ: 'FAQ',
}

function formatStatus(status: string) {
  return EDITORIAL_STATUS_LABELS[mapServerStatus(status)]
}

export function RecentContentCard({
  items,
  loading,
  onViewAll,
}: {
  items: DashboardOverview['recentContent']
  loading?: boolean
  onViewAll?: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 pb-2">
        <SectionHeader action={onViewAll ? 'View all' : undefined} onAction={onViewAll}>
          Recent Content
        </SectionHeader>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[10px]">
          <thead className="border-y border-slate-100 bg-slate-50/70 text-slate-400">
            <tr>
              {tableColumns.map((column) => (
                <th className="px-4 py-2 font-medium" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={6}>
                  <LoaderCircle className="mx-auto h-4 w-4 animate-spin" />
                </td>
              </tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={6}>
                  No content yet. Create your first page to get started.
                </td>
              </tr>
            ) : null}
            {!loading && items.map((item) => (
              <tr className="text-slate-600 hover:bg-slate-50/60" key={item.id}>
                <td className="px-4 py-2 font-medium text-slate-700">{item.title}</td>
                <td className="px-4 py-2">{typeLabels[item.type] || item.type}</td>
                <td className="px-4 py-2">
                  <StatusBadge tone={item.status === 'PUBLISHED' ? 'green' : 'blue'}>
                    {formatStatus(item.status)}
                  </StatusBadge>
                </td>
                <td className={`px-4 py-2 font-semibold ${item.seoScore < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {item.seoScore}/100
                </td>
                <td className="px-4 py-2">
                  <StatusBadge tone={item.review === 'Reviewed' ? 'green' : 'amber'}>{item.review}</StatusBadge>
                </td>
                <td className="px-4 py-2 text-slate-400">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function QuickActionsCard({
  actions,
  onAction,
}: {
  actions: Array<QuickAction & { route?: string }>
  onAction?: (route: string) => void
}) {
  return (
    <Card className="p-4">
      <SectionHeader>Quick Actions</SectionHeader>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {actions.map(({ title, description, icon: Icon, route }) => (
          <button
            className="flex items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-slate-50"
            key={title}
            onClick={() => route && onAction?.(route)}
            type="button"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold text-slate-700">{title}</span>
              <span className="block truncate text-[8px] text-slate-400">{description}</span>
            </span>
            <ArrowUpRight className="ml-auto h-3 w-3 shrink-0 text-slate-300" />
          </button>
        ))}
      </div>
    </Card>
  )
}
