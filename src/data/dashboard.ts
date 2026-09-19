import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarClock,
  CircleHelp,
  FileCode2,
  FileText,
  Image,
  Link2,
  ListChecks,
  MapPin,
  Network,
  PanelsTopLeft,
  Route,
  ScanSearch,
  Settings,
  Stethoscope,
  Tags,
  Unlink,
  UserRoundCheck,
  Users,
  Video,
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
}

export const navigation: NavigationSection[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Appointments', icon: CalendarClock, route: 'appointments' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Pages', icon: FileText, route: 'content' },
      { label: 'Services', icon: Stethoscope },
      { label: 'Conditions', icon: Activity },
      { label: 'Doctors', icon: Users },
      { label: 'Locations', icon: MapPin },
      { label: 'Blog / Articles', icon: BookOpen },
      { label: 'FAQs', icon: CircleHelp },
    ],
  },
  {
    label: 'Medical trust',
    items: [
      { label: 'Authors', icon: UserRoundCheck },
      { label: 'Medical Reviewers', icon: Users },
      { label: 'References', icon: BookOpen },
      { label: 'Review Queue', icon: ListChecks },
    ],
  },
  {
    label: 'SEO',
    items: [
      { label: 'SEO Overview', icon: ScanSearch },
      { label: 'Titles & Meta', icon: Tags, route: 'titles-meta' },
      { label: 'Internal Links', icon: Link2 },
      { label: 'Redirects', icon: Route, route: 'redirects' },
      { label: 'XML Sitemap', icon: Network, route: 'sitemap' },
      { label: 'Robots.txt', icon: FileText },
      { label: 'Indexing', icon: PanelsTopLeft, route: 'indexing' },
      { label: 'Schema', icon: FileCode2 },
      { label: '404 Monitor', icon: Unlink, route: '404-monitor' },
    ],
  },
  {
    label: 'Media',
    items: [
      { label: 'Images', icon: Image },
      { label: 'Videos', icon: Video },
    ],
  },
  {
    label: 'Analytics',
    items: [{ label: 'Traffic & Conversions', icon: BarChart3 }],
  },
  {
    label: 'Settings',
    items: [
      { label: 'General Settings', icon: Settings, route: 'settings' },
    ],
  },
]

export const dashboardStats: DashboardStat[] = [
  { value: '128', label: 'Total Pages', icon: FileText, tone: 'bg-emerald-50 text-emerald-700' },
  { value: '46', label: 'Services', icon: Stethoscope, tone: 'bg-teal-50 text-teal-700' },
  { value: '34', label: 'Blog Articles', icon: BookOpen, tone: 'bg-sky-50 text-sky-700' },
  { value: '12', label: 'Doctors', icon: Users, tone: 'bg-lime-50 text-lime-800' },
  { value: '6', label: 'Clinic Locations', icon: MapPin, tone: 'bg-emerald-50 text-emerald-800' },
]

export const recentContent: ContentItem[] = [
  { title: 'IVF Treatment in Dubai', type: 'Service', status: 'Published', seoScore: 96, review: 'Reviewed', updatedAt: 'Aug 30, 2025' },
  { title: 'Male Infertility: Causes & Treatment', type: 'Article', status: 'Published', seoScore: 91, review: 'Reviewed', updatedAt: 'Aug 28, 2025' },
  { title: 'Dr. Sarah Ahmed', type: 'Doctor', status: 'Published', seoScore: 88, review: 'Reviewed', updatedAt: 'Aug 26, 2025' },
  { title: 'PCOS: Symptoms and Management', type: 'Article', status: 'In Review', seoScore: 72, review: 'Pending', updatedAt: 'Aug 24, 2025' },
  { title: 'Fertility Testing for Women', type: 'Service', status: 'Published', seoScore: 89, review: 'Reviewed', updatedAt: 'Aug 22, 2025' },
]

export const quickActions: QuickAction[] = [
  { title: 'Create New Page', description: 'Add a new page to your website', icon: FileText },
  { title: 'Add a Medical Article', description: 'Write and publish a new article', icon: BookOpen },
  { title: 'Add a Service', description: 'Create a new treatment/service', icon: Stethoscope },
  { title: 'Add a Doctor', description: 'Add a new doctor profile', icon: Users },
  { title: 'Manage Redirects', description: 'Set up 301 redirects', icon: Link2 },
  { title: 'View Sitemap', description: 'Check your XML sitemap', icon: Network },
]

export const siteNotes = [
  'Ensure all medical articles have an assigned medical reviewer.',
  'Keep service and location pages unique with local information.',
  'Check and update meta descriptions for low-performing pages.',
  'Maintain accurate review dates for YMYL content.',
  'Monitor 404 errors and fix broken internal links.',
]
