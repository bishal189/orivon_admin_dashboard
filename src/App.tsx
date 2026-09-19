import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify'
import { api, type AuthUser } from './api/client'
import { AppShell } from './components/layout/AppShell'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { ContentPage, IndexingPage, RedirectsPage, RobotsTxtPage, SitemapPage, UrlPolicyPage } from './pages/AdminPages'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundMonitorPage } from './pages/NotFoundMonitorPage'
import { SettingsPage } from './pages/SettingsPage'

const routePaths: Record<string, string> = {
  dashboard: '/',
  appointments: '/appointments',
  content: '/pages',
  services: '/services',
  conditions: '/conditions',
  doctors: '/doctors',
  locations: '/locations',
  articles: '/articles',
  faqs: '/faqs',
  'titles-meta': '/seo/titles-meta',
  redirects: '/seo/redirects',
  sitemap: '/seo/sitemap',
  robots: '/seo/robots',
  'url-policy': '/seo/url-policy',
  indexing: '/seo/indexing',
  '404-monitor': '/seo/404-monitor',
  settings: '/settings',
}

function routeFromPath() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  return Object.entries(routePaths).find(([, path]) => path === pathname)?.[0] ?? 'dashboard'
}

function App() {
  const [route, setRoute] = useState(routeFromPath)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [restoringSession, setRestoringSession] = useState(true)

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    void api.restoreSession()
      .then(setUser)
      .finally(() => setRestoringSession(false))
  }, [])

  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      setUser(null)
      toast.info('Your session expired. Please sign in again.')
    })
    return () => api.setUnauthorizedHandler(null)
  }, [])

  const navigate = (nextRoute: string) => {
    const path = routePaths[nextRoute] ?? '/'
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setRoute(nextRoute)
  }

  const logout = async () => {
    try {
      toast.success(await api.logout())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign out')
    } finally {
      setUser(null)
      window.history.replaceState({}, '', '/')
      setRoute('dashboard')
    }
  }

  if (restoringSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f7]">
        <LoaderCircle className="h-7 w-7 animate-spin text-brand-600" aria-label="Restoring session" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <LoginPage onAuthenticated={setUser} />
        <ToastContainer position="top-right" />
      </>
    )
  }

  const page = (() => {
    switch (route) {
      case 'appointments': return <AppointmentsPage />
      case 'content': return <ContentPage contentType="PAGE" />
      case 'services': return <ContentPage contentType="SERVICE" />
      case 'conditions': return <ContentPage contentType="CONDITION" />
      case 'doctors': return <ContentPage contentType="PROVIDER" />
      case 'locations': return <ContentPage contentType="LOCATION" />
      case 'articles': return <ContentPage contentType="ARTICLE" />
      case 'faqs': return <ContentPage contentType="FAQ" />
      case 'titles-meta': return <ContentPage seoOnly />
      case 'redirects': return <RedirectsPage />
      case 'sitemap': return <SitemapPage />
      case 'robots': return <RobotsTxtPage />
      case 'url-policy': return <UrlPolicyPage />
      case 'indexing': return <IndexingPage />
      case '404-monitor': return <NotFoundMonitorPage />
      case 'settings': return <SettingsPage onUserUpdated={setUser} user={user} />
      default: return <DashboardPage />
    }
  })()

  return (
    <>
      <AppShell activeRoute={route} onLogout={() => void logout()} onNavigate={navigate} user={user}>
        {page}
      </AppShell>
      <ToastContainer position="top-right" />
    </>
  )
}

export default App
