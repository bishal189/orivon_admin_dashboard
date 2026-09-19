import { useEffect, useMemo, useState } from 'react'
import { BookOpen, FileText, LoaderCircle, MapPin, Stethoscope, Users } from 'lucide-react'
import { toast } from 'react-toastify'
import { api, type DashboardOverview } from '../api/client'
import { PromoCard, SiteNotesCard } from '../components/dashboard/BottomPanels'
import { QuickActionsCard, RecentContentCard } from '../components/dashboard/ContentPanels'
import {
  AppointmentsSummaryCard,
  ContentReviewCard,
  SeoHealthCard,
  StatCard,
} from '../components/dashboard/OverviewPanels'
import { quickActions, type DashboardStat } from '../data/dashboard'

export function DashboardPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void api.getDashboardOverview()
      .then((data) => {
        if (!cancelled) setOverview(data)
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : 'Unable to load dashboard')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const stats: Array<DashboardStat & { route?: string }> = useMemo(() => {
    const totals = overview?.totals
    return [
      {
        value: String(totals?.pages ?? '—'),
        label: 'Total Pages',
        icon: FileText,
        tone: 'bg-emerald-50 text-emerald-700',
        route: 'content',
      },
      {
        value: String(totals?.services ?? '—'),
        label: 'Services',
        icon: Stethoscope,
        tone: 'bg-teal-50 text-teal-700',
        route: 'services',
      },
      {
        value: String(totals?.articles ?? '—'),
        label: 'Blog Articles',
        icon: BookOpen,
        tone: 'bg-sky-50 text-sky-700',
        route: 'articles',
      },
      {
        value: String(totals?.doctors ?? '—'),
        label: 'Doctors',
        icon: Users,
        tone: 'bg-lime-50 text-lime-800',
        route: 'doctors',
      },
      {
        value: String(totals?.locations ?? '—'),
        label: 'Clinic Locations',
        icon: MapPin,
        tone: 'bg-emerald-50 text-emerald-800',
        route: 'locations',
      },
    ]
  }, [overview])

  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="p-4 md:p-6 xl:p-7">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 md:text-[28px]">
              Dashboard
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Live CMS overview — content, SEO health, review queue, and appointments.
            </p>
          </div>
          <time className="hidden text-[11px] text-slate-400 sm:block" dateTime={new Date().toISOString()}>
            {today}
          </time>
        </header>

        {loading && !overview ? (
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            Loading dashboard…
          </div>
        ) : (
          <>
            <div className="flex gap-3 overflow-x-auto pb-1 xl:grid xl:grid-cols-5">
              {stats.map((stat) => (
                <StatCard
                  key={stat.label}
                  {...stat}
                  onViewAll={stat.route ? () => onNavigate?.(stat.route!) : undefined}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_.8fr_1.05fr]">
              <SeoHealthCard
                health={overview?.seoHealth || {
                  score: 0,
                  indexable: 0,
                  noindex: 0,
                  missingMetaDescriptions: 0,
                  missingH1: 0,
                  redirects: 0,
                  openNotFound: 0,
                  sitemapHealthy: true,
                }}
                onOpen404={() => onNavigate?.('404-monitor')}
                onOpenTitlesMeta={() => onNavigate?.('titles-meta')}
              />
              <ContentReviewCard
                onOpenContent={() => onNavigate?.('content')}
                queue={overview?.reviewQueue || {
                  draft: 0,
                  editorialReview: 0,
                  medicalReview: 0,
                  scheduled: 0,
                  published: 0,
                }}
              />
              <AppointmentsSummaryCard
                appointments={overview?.appointments || {}}
                onOpen={() => onNavigate?.('appointments')}
                totals={overview?.totals || {
                  content: 0,
                  pages: 0,
                  services: 0,
                  articles: 0,
                  doctors: 0,
                  locations: 0,
                  conditions: 0,
                  faqs: 0,
                  redirects: 0,
                  openNotFound: 0,
                  appointments: 0,
                  appointmentsNew: 0,
                }}
              />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.8fr_1fr]">
              <RecentContentCard
                items={overview?.recentContent || []}
                loading={loading}
                onViewAll={() => onNavigate?.('content')}
              />
              <QuickActionsCard
                actions={quickActions}
                onAction={(route) => onNavigate?.(route)}
              />
            </div>

            <div className="mt-4 grid gap-4 pb-2 xl:grid-cols-[1.2fr_1fr]">
              <PromoCard onCreate={() => onNavigate?.('content')} />
              <SiteNotesCard
                health={overview?.seoHealth || {
                  score: 0,
                  indexable: 0,
                  noindex: 0,
                  missingMetaDescriptions: 0,
                  missingH1: 0,
                  redirects: 0,
                  openNotFound: 0,
                  sitemapHealthy: true,
                }}
                reviewQueue={overview?.reviewQueue || {
                  draft: 0,
                  editorialReview: 0,
                  medicalReview: 0,
                  scheduled: 0,
                  published: 0,
                }}
                totals={overview?.totals || {
                  content: 0,
                  pages: 0,
                  services: 0,
                  articles: 0,
                  doctors: 0,
                  locations: 0,
                  conditions: 0,
                  faqs: 0,
                  redirects: 0,
                  openNotFound: 0,
                  appointments: 0,
                  appointmentsNew: 0,
                }}
              />
            </div>
          </>
        )}
      </div>
    </main>
  )
}
