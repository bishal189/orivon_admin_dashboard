import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { FilePenLine, LoaderCircle } from 'lucide-react'
import { API_BASE_URL, api, type UrlPolicy } from '../../api/client'
import { Card } from '../../components/ui'
import { inputClass, Notice, Page, primaryButton } from './shared'

export function UrlPolicyPage() {
  const [policy, setPolicy] = useState<UrlPolicy | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allowedParams, setAllowedParams] = useState('')

  useEffect(() => {
    void api.getUrlPolicy()
      .then((next) => {
        setPolicy(next)
        setAllowedParams((next.allowedQueryParams || []).join(', '))
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load URL policy'))
      .finally(() => setLoading(false))
  }, [])

  const setFlag = (key: keyof UrlPolicy, value: boolean | 'strip' | 'add') => {
    setPolicy((current) => (current ? { ...current, [key]: value } : current))
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!policy) return
    setSaving(true)
    try {
      const result = await api.saveUrlPolicy({
        ...policy,
        allowedQueryParams: allowedParams.split(',').map((item) => item.trim()).filter(Boolean),
      })
      setPolicy(result.policy)
      setAllowedParams((result.policy.allowedQueryParams || []).join(', '))
      setError('')
      toast.success(result.message || 'URL policy saved')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to save URL policy'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key: keyof UrlPolicy, label: string) => (
    <label key={key} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600">
      <input
        checked={Boolean(policy?.[key])}
        className="mt-0.5 h-4 w-4 accent-[#1f4d42]"
        onChange={(event) => setFlag(key, event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )

  return (
    <Page description="Enforce HTTPS/host preference, path conventions, query canonicalization, and archive indexing defaults used by robots.txt." title="URL & Indexing">
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <Card className="max-w-3xl p-5">
        {loading || !policy ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading URL policy…
          </div>
        ) : (
          <form className="space-y-6" onSubmit={(event) => void save(event)}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Host & protocol</p>
              <p className="mt-1 text-xs text-slate-500">Preferred origin from PUBLIC_SITE_URL: <span className="font-mono text-slate-700">{policy.preferredOrigin || '—'}</span></p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {toggle('forceHttps', 'Force HTTPS (HTTP → HTTPS redirect in production)')}
                {toggle('enforcePreferredHost', 'Enforce preferred www / non-www host')}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Path & query conventions</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {toggle('lowercasePaths', 'Lowercase URL paths (prevent case duplicates)')}
                {toggle('stripQueryParams', 'Strip non-allowlisted query parameters')}
                <label className="text-xs font-medium text-slate-700 sm:col-span-2">
                  Trailing slash
                  <select className={inputClass} onChange={(event) => setFlag('trailingSlash', event.target.value as 'strip' | 'add')} value={policy.trailingSlash}>
                    <option value="strip">Strip trailing slash</option>
                    <option value="add">Require trailing slash</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-700 sm:col-span-2">
                  Allowed query params (comma-separated)
                  <input className={inputClass} onChange={(event) => setAllowedParams(event.target.value)} placeholder="utm_source, page" value={allowedParams} />
                </label>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Archive / taxonomy indexing</p>
              <p className="mt-1 text-xs text-slate-500">When disabled, matching patterns are Disallow’d in the default robots.txt. Per-page robots still control CMS content.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {toggle('indexSearch', 'Allow indexing of search-result pages')}
                {toggle('indexTags', 'Allow indexing of tag pages')}
                {toggle('indexCategories', 'Allow indexing of category pages')}
                {toggle('indexAuthorArchives', 'Allow indexing of author archives')}
                {toggle('indexDateArchives', 'Allow indexing of date archives')}
                {toggle('indexThinArchives', 'Allow indexing of thin /page/ archives')}
              </div>
            </div>

            <button className={primaryButton} disabled={saving} type="submit">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FilePenLine className="h-4 w-4" />}
              Save URL policy
            </button>
          </form>
        )}
      </Card>
    </Page>
  )
}
