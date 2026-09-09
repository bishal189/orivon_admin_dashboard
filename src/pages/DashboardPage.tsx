import { PromoCard, SiteNotesCard } from '../components/dashboard/BottomPanels'
import { QuickActionsCard, RecentContentCard } from '../components/dashboard/ContentPanels'
import {
  ContentReviewCard,
  SeoHealthCard,
  StatCard,
  TrafficChartCard,
} from '../components/dashboard/OverviewPanels'
import { dashboardStats } from '../data/dashboard'

export function DashboardPage() {
  return (
    <main className="p-4 md:p-6 xl:p-7">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 md:text-[28px]">
              Dashboard
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Welcome to Orivon CMS. Manage your content, SEO, and medical information.
            </p>
          </div>
          <time className="hidden text-[11px] text-slate-400 sm:block" dateTime="2025-08-31">
            August 31, 2025
          </time>
        </header>

        <div className="flex gap-3 overflow-x-auto pb-1 xl:grid xl:grid-cols-5">
          {dashboardStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_.8fr_1.25fr]">
          <SeoHealthCard />
          <ContentReviewCard />
          <TrafficChartCard />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.8fr_1fr]">
          <RecentContentCard />
          <QuickActionsCard />
        </div>

        <div className="mt-4 grid gap-4 pb-2 xl:grid-cols-[1.2fr_1fr]">
          <PromoCard />
          <SiteNotesCard />
        </div>
      </div>
    </main>
  )
}
