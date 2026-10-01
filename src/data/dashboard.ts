import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarClock,
  CircleHelp,
  FileText,
  Languages,
  LibraryBig,
  Link2,
  MapPin,
  Network,
  PanelsTopLeft,
  Route,
  ScanSearch,
  ScrollText,
  Settings,
  Stethoscope,
  Tags,
  Unlink,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationSection {
  label: string
  items: Array<{ label: string; icon: LucideIcon; route?: string }>
}

export interface DashboardStat {
  value: string
  label: string
  icon: LucideIcon
  tone: string
}

export type { DashboardOverview } from '../api/client'

export interface ContentItem {
  title: string
  type: string
  status: 'Published' | 'In Review'
  seoScore: number
  review: 'Reviewed' | 'Pending'
  updatedAt: string
}

export interface QuickAction {
  title: string
  description: string
  icon: LucideIcon
  route?: string
}

export const navigation: NavigationSection[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Appointments', icon: CalendarClock, route: 'appointments' },
      { label: 'Member Books', icon: LibraryBig, route: 'member-books' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Pages', icon: FileText, route: 'content' },
      { label: 'Services', icon: Stethoscope, route: 'services' },
      { label: 'Conditions', icon: Activity, route: 'conditions' },
      { label: 'Doctors', icon: Users, route: 'doctors' },
      { label: 'Locations', icon: MapPin, route: 'locations' },
      { label: 'Blog / Articles', icon: BookOpen, route: 'articles' },
      { label: 'FAQs', icon: CircleHelp, route: 'faqs' },
    ],
  },
  {
    label: 'SEO',
    items: [
      { label: 'Titles & Meta', icon: Tags, route: 'titles-meta' },
      { label: 'Redirects', icon: Route, route: 'redirects' },
      { label: 'XML Sitemap', icon: Network, route: 'sitemap' },
      { label: 'Robots.txt', icon: FileText, route: 'robots' },
      { label: 'URL & Indexing', icon: ScanSearch, route: 'url-policy' },
      { label: 'Hreflang', icon: Languages, route: 'hreflang' },
      { label: 'Indexing', icon: PanelsTopLeft, route: 'indexing' },
      { label: '404 Monitor', icon: Unlink, route: '404-monitor' },
    ],
  },
  {
    label: 'Analytics',
    items: [{ label: 'Traffic & Conversions', icon: BarChart3, route: 'traffic-conversions' }],
  },
  {
    label: 'Settings',
    items: [
      { label: 'General Settings', icon: Settings, route: 'settings' },
      { label: 'Audit logs', icon: ScrollText, route: 'audit-logs' },
    ],
  },
]

export const quickActions: QuickAction[] = [
  { title: 'Create New Page', description: 'Add a new page to your website', icon: FileText, route: 'content' },
  { title: 'Add a Medical Article', description: 'Write and publish a new article', icon: BookOpen, route: 'articles' },
  { title: 'Add a Service', description: 'Create a new treatment/service', icon: Stethoscope, route: 'services' },
  { title: 'Add a Doctor', description: 'Add a new doctor profile', icon: Users, route: 'doctors' },
  { title: 'Manage Redirects', description: 'Set up 301 redirects', icon: Link2, route: 'redirects' },
  { title: 'View Sitemap', description: 'Check your XML sitemap', icon: Network, route: 'sitemap' },
]

export const siteNotes = [
  'Ensure all medical articles have an assigned medical reviewer.',
  'Never publish near-identical location or service×location doorway pages—each indexable URL needs unique intent.',
  'Check and update meta descriptions for low-performing pages.',
  'Maintain accurate review dates for YMYL content.',
  'Monitor 404 errors and fix broken internal links.',
]
