import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { Download, ExternalLink, LoaderCircle, Plus, Trash2, Upload } from 'lucide-react'
import { API_BASE_URL, api, type RedirectRecord } from '../../api/client'
import { Card } from '../../components/ui'
import { inputClass, Notice, Page, primaryButton, secondaryButton } from './shared'

export function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectRecord[]>([])
  const [form, setForm] = useState<Omit<RedirectRecord, 'id' | 'hits'>>({ from: '', to: '', statusCode: 301, enabled: true })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = () => api.getRedirects().then(setRedirects)

  useEffect(() => {
    void reload().catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load redirects'))
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await api.createRedirect(form)
      setRedirects((current) => [saved, ...current])
      setForm({ from: '', to: '', statusCode: 301, enabled: true })
      toast.success('Redirect created (internal links rewritten when permanent)')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to create redirect'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (redirect: RedirectRecord) => {
    try {
      const { record } = await api.updateRedirect(redirect.id, { enabled: !redirect.enabled })
      setRedirects((current) => current.map((item) => (item.id === record.id ? record : item)))
      toast.success(record.enabled ? 'Redirect enabled' : 'Redirect disabled')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to update redirect'
      setError(message)
      toast.error(message)
    }
  }

  const remove = async (id: string) => {
    try {
      await api.deleteRedirect(id)
      setRedirects((current) => current.filter((redirect) => redirect.id !== id))
      toast.success('Redirect deleted')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to delete redirect'
      setError(message)
      toast.error(message)
    }
  }

  const onImportFile = async (file: File) => {
    setImporting(true)
    try {
      const csv = await file.text()
      const { result, message } = await api.importRedirectsCsv(csv)
      await reload()
      toast.success(`${message} · ${result.upserted} rows`)
      if (result.errors?.length) toast.warn(`${result.errors.length} row error(s) — check first: ${result.errors[0]}`)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Import failed'
      setError(message)
      toast.error(message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Page description="Bulk and long-term 301/302 management. Homepage redirects are blocked unless explicitly allowed. Slug changes auto-create permanent redirects." title="Redirects">
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={secondaryButton}
          onClick={() => void api.exportRedirectsCsv().then(() => toast.success('Redirects CSV downloaded')).catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Export failed'))}
          type="button"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
        <button className={secondaryButton} disabled={importing} onClick={() => fileRef.current?.click()} type="button">
          {importing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Import CSV
        </button>
        <input
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onImportFile(file)
          }}
          ref={fileRef}
          type="file"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit p-5">
          <h2 className="text-sm font-semibold text-slate-800">Add redirect</h2>
          <p className="mt-1 text-[11px] text-slate-400">Point removed URLs to the closest relevant replacement — never mass-redirect to `/`.</p>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <label className="block text-xs font-medium text-slate-700">Source path<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))} placeholder="/old-page" required value={form.from} /></label>
            <label className="block text-xs font-medium text-slate-700">Destination<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))} placeholder="/new-page" required value={form.to} /></label>
            <label className="block text-xs font-medium text-slate-700">Redirect type<select className={inputClass} onChange={(event) => setForm((current) => ({ ...current, statusCode: Number(event.target.value) as 301 | 302 }))} value={form.statusCode}><option value={301}>301 · Permanent</option><option value={302}>302 · Temporary</option></select></label>
            <button className={`${primaryButton} w-full`} disabled={saving} type="submit">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add redirect</button>
          </form>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Active redirects</h2>
            <p className="mt-1 text-[11px] text-slate-400">{redirects.length} configured · includes auto slug-change 301s · stored long-term in CMS</p>
          </div>
          <div className="divide-y divide-slate-100">
            {redirects.length === 0 && <p className="p-10 text-center text-xs text-slate-400">No redirects configured.</p>}
            {redirects.map((redirect) => (
              <div className="flex items-center gap-3 p-4" key={redirect.id}>
                <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${redirect.enabled ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{redirect.statusCode}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{redirect.from}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-400"><ExternalLink className="h-3 w-3" />{redirect.to}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{redirect.hits ?? 0} hits · {redirect.enabled ? 'Enabled' : 'Disabled'}</p>
                </div>
                <button className="rounded-md px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50" onClick={() => void toggle(redirect)} type="button">
                  {redirect.enabled ? 'Disable' : 'Enable'}
                </button>
                <button aria-label="Delete redirect" className="rounded-md p-2 text-red-500 hover:bg-red-50" onClick={() => void remove(redirect.id)} type="button"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  )
}
