import { ArrowUpRight } from 'lucide-react'
import { quickActions, recentContent } from '../../data/dashboard'
import { Card, SectionHeader, StatusBadge } from '../ui'

const tableColumns = ['Title', 'Type', 'Status', 'SEO', 'Review', 'Updated']

export function RecentContentCard() {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 pb-2">
        <SectionHeader action="View all">Recent Content</SectionHeader>
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
            {recentContent.map((item) => (
              <tr className="text-slate-600 hover:bg-slate-50/60" key={item.title}>
                <td className="px-4 py-2 font-medium text-slate-700">{item.title}</td>
                <td className="px-4 py-2">{item.type}</td>
                <td className="px-4 py-2">
                  <StatusBadge tone={item.status === 'Published' ? 'green' : 'blue'}>{item.status}</StatusBadge>
                </td>
                <td className={`px-4 py-2 font-semibold ${item.seoScore < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {item.seoScore}/100
                </td>
                <td className="px-4 py-2">
                  <StatusBadge tone={item.review === 'Reviewed' ? 'green' : 'amber'}>{item.review}</StatusBadge>
                </td>
                <td className="px-4 py-2 text-slate-400">{item.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function QuickActionsCard() {
  return (
    <Card className="p-4">
      <SectionHeader>Quick Actions</SectionHeader>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {quickActions.map(({ title, description, icon: Icon }) => (
          <button className="flex items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-slate-50" key={title} type="button">
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
