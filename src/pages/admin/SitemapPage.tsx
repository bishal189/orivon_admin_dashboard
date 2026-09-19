import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { CheckCircle2, LoaderCircle, RefreshCw } from 'lucide-react'
import { API_BASE_URL, api, type SitemapOverview } from '../../api/client'
import { Card } from '../../components/ui'
import { Notice, Page, primaryButton } from './shared'

export function SitemapPage() {
  const [status, setStatus] = useState<SitemapOverview | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    void api.getSitemapStatus()
      .then(setStatus)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load sitemap'))
  }, [])

  const generate = async () => {
    setWorking(true)
    try {
      setStatus(await api.generateSitemap())
      setError('')
      toast.success('Sitemap index refreshed')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to generate sitemap'
      setError(message)
      toast.error(message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <Page
      action={(
        <button className={primaryButton} disabled={working} onClick={() => void generate()} type="button">
          {working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh sitemaps
        </button>
      )}
      description="Automatic sitemap index with separate XML files for pages, services, conditions, doctors, locations, and articles."
      title="XML Sitemap"
    >
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Sitemap index', status?.indexUrl ? 'Ready' : '—'],
          ['Total URLs', status?.totalEntries ?? '—'],
          ['Typed sitemaps', status?.sitemaps.length ?? '—'],
        ].map(([label, value]) => (
          <Card className="p-5" key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 break-all text-lg font-semibold text-slate-800">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4 overflow-hidden border-[#dfe3e8] shadow-none">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Sitemap index</h2>
              <p className="mt-1 text-xs text-slate-500">{status?.indexUrl || 'The sitemap index URL will appear after the API responds.'}</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-2">Content type</th>
                <th className="px-5 py-2">URLs</th>
                <th className="px-5 py-2">Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(status?.sitemaps || []).map((item) => (
                <tr key={item.key}>
                  <td className="px-5 py-3 font-medium text-slate-800">{item.label}</td>
                  <td className="px-5 py-3">{item.entries}</td>
                  <td className="px-5 py-3 font-mono text-[11px] text-slate-500">{item.url}</td>
                </tr>
              ))}
              {!status && (
                <tr>
                  <td className="px-5 py-8 text-center text-slate-400" colSpan={3}>Loading typed sitemaps…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  )
}
