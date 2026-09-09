import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FilePenLine,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import {
  API_BASE_URL,
  api,
  type ContentRecord,
  type IndexingStatus,
  type RedirectRecord,
  type SitemapStatus,
} from '../api/client'
import { Card } from '../components/ui'

const emptyContent: Omit<ContentRecord, 'id'> = {
  title: '',
  description: '',
  slug: '',
  h1: '',
  canonical: '',
  robots: 'index, follow',
  sitemapExcluded: false,
  schemaDisabled: false,
  status: 'draft',
}

const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-100'
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50'

function paginationItems(current: number, total: number): Array<number | string> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const pages = [1, current - 1, current, current + 1, total]
    .filter((value, index, values) => value > 0 && value <= total && values.indexOf(value) === index)
    .sort((left, right) => left - right)
  const items: Array<number | string> = []
  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) items.push(`ellipsis-${value}`)
    items.push(value)
  })
  return items
}

function Page({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <main className="p-4 md:p-6 xl:p-7">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 md:text-[28px]">{title}</h1>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          {action}
        </header>
        {children}
      </div>
    </main>
  )
}

function Notice({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' }) {
  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-xs ${tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
      {message}
    </div>
  )
}

function ContentForm({ initial, onClose, onSaved }: { initial?: ContentRecord; onClose: () => void; onSaved: (record: ContentRecord) => void }) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<Omit<ContentRecord, 'id'>>(initial ? {
    title: initial.title,
    description: initial.description,
    slug: initial.slug,
    h1: initial.h1,
    canonical: initial.canonical,
    robots: initial.robots,
    sitemapExcluded: initial.sitemapExcluded,
    schemaDisabled: initial.schemaDisabled,
    status: initial.status,
  } : emptyContent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const savingRef = useRef(saving)

  useEffect(() => {
    savingRef.current = saving
  }, [saving])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRef.current) onClose()
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = initial
        ? await api.updateContent(initial.id, form)
        : await api.createContent(form)
      toast.success(initial ? 'Content updated successfully' : 'Content created successfully')
      onSaved(saved)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to save content'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <form
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal-panel max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-black/5 sm:max-h-[88dvh] sm:rounded-2xl"
        onSubmit={submit}
        ref={panelRef}
        role="dialog"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur sm:px-6 sm:py-5">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <FilePenLine className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900" id={titleId}>{initial ? 'Edit content & SEO' : 'Create content record'}</h2>
              <p className="mt-1 text-xs text-slate-500" id={descriptionId}>Configure publishing and search appearance in one place.</p>
            </div>
          </div>
          <button aria-label="Close form" className="rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" disabled={saving} onClick={onClose} type="button"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          {error && <div className="sm:col-span-2"><Notice message={error} /></div>}
          <div className="sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Page essentials</p>
            <p className="mt-1 text-xs text-slate-400">Create a clear identity for this page.</p>
          </div>
          <label className="text-xs font-medium text-slate-700">SEO title<input className={inputClass} maxLength={70} onChange={(event) => setField('title', event.target.value)} placeholder="e.g. IVF Treatment in Dubai | Orivon Health" required value={form.title} /></label>
          <label className="text-xs font-medium text-slate-700">Slug<input className={inputClass} onChange={(event) => setField('slug', event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="ivf-treatment-dubai" required value={form.slug} /></label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">Meta description<textarea className={`${inputClass} min-h-24 resize-y`} maxLength={170} onChange={(event) => setField('description', event.target.value)} placeholder="Summarize the page benefit and intent in one compelling sentence." required value={form.description} /><span className={`mt-1 block text-right text-[10px] ${form.description.length > 155 ? 'font-semibold text-amber-600' : 'text-slate-400'}`}>{form.description.length}/170</span></label>
          <label className="text-xs font-medium text-slate-700">Page H1<input className={inputClass} onChange={(event) => setField('h1', event.target.value)} placeholder="e.g. Personalized IVF Treatment in Dubai" required value={form.h1} /></label>
          <label className="text-xs font-medium text-slate-700">Canonical URL<input className={inputClass} onChange={(event) => setField('canonical', event.target.value)} placeholder="https://orivon.com/page" type="url" value={form.canonical} /></label>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 sm:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Search preview</p>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-600">Live preview</span>
            </div>
            <p className="truncate text-xs text-emerald-700">https://orivon.ae/{form.slug || 'page-url'}</p>
            <p className="mt-1 truncate text-lg font-medium text-[#1a0dab]">{form.title || 'Your SEO title will appear here'}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{form.description || 'Add a helpful meta description to show visitors what this page offers.'}</p>
          </div>

          <div className="border-t border-slate-100 pt-5 sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Publishing controls</p>
          </div>
          <label className="text-xs font-medium text-slate-700">Robots directive<select className={inputClass} onChange={(event) => setField('robots', event.target.value)} value={form.robots}><option>index, follow</option><option>noindex, follow</option><option>index, nofollow</option><option>noindex, nofollow</option></select></label>
          <label className="text-xs font-medium text-slate-700">Publishing status<select className={inputClass} onChange={(event) => setField('status', event.target.value as 'draft' | 'published')} value={form.status}><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <label className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs transition ${form.sitemapExcluded ? 'border-amber-200 bg-amber-50/70 text-amber-800' : 'border-emerald-100 bg-emerald-50/40 text-slate-600'}`}><input checked={form.sitemapExcluded} className="mt-0.5 h-4 w-4 accent-[#1f4d42]" onChange={(event) => setField('sitemapExcluded', event.target.checked)} type="checkbox" /><span><strong className="block font-semibold text-slate-800">Exclude from sitemap</strong>Keep this URL out of generated XML sitemaps.</span></label>
          <label className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs transition ${form.schemaDisabled ? 'border-rose-200 bg-rose-50/70 text-rose-800' : 'border-blue-100 bg-blue-50/40 text-slate-600'}`}><input checked={form.schemaDisabled} className="mt-0.5 h-4 w-4 accent-[#1f4d42]" onChange={(event) => setField('schemaDisabled', event.target.checked)} type="checkbox" /><span><strong className="block font-semibold text-slate-800">Disable schema</strong>Prevent structured data output for this page.</span></label>
        </div>
        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200/80 bg-slate-50/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="hidden text-[11px] text-slate-400 sm:block">Press Esc to close</p>
          <div className="flex justify-end gap-2">
            <button className={secondaryButton} disabled={saving} onClick={onClose} type="button">Cancel</button>
            <button className={`${primaryButton} min-w-32`} disabled={saving} type="submit">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{initial ? 'Save changes' : 'Create record'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}

export function ContentPage({ seoOnly = false }: { seoOnly?: boolean }) {
  const [records, setRecords] = useState<ContentRecord[]>([])
  const [editing, setEditing] = useState<ContentRecord | 'new' | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortKey, setSortKey] = useState<'title' | 'status' | 'updatedAt'>('updatedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      void api.getContent({ page, pageSize, query, sortBy: sortKey, sortDirection })
        .then(({ records: nextRecords, pagination }) => {
          if (cancelled) return
          setRecords(nextRecords)
          setTotal(pagination.total)
          setTotalPages(pagination.pages)
        })
        .catch((requestError: unknown) => {
          if (!cancelled) setError(`${requestError instanceof Error ? requestError.message : 'Unable to load content'}. API: ${API_BASE_URL}`)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, query ? 250 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [page, pageSize, query, reloadKey, sortDirection, sortKey])

  const remove = async (record: ContentRecord) => {
    if (!window.confirm(`Delete “${record.title}”?`)) return
    try {
      await api.deleteContent(record.id)
      if (records.length === 1 && page > 1) setPage((current) => current - 1)
      else setReloadKey((current) => current + 1)
      toast.success('Content moved to trash')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to delete content'
      setError(message)
      toast.error(message)
    }
  }

  const currentPage = Math.min(page, totalPages)
  const visible = records

  const changeSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDirection('asc')
    }
    setPage(1)
  }

  return (
    <Page
      action={<button className={primaryButton} onClick={() => setEditing('new')} type="button"><Plus className="h-4 w-4" />New content</button>}
      description={seoOnly ? 'Review and edit search titles, descriptions, canonicals and directives.' : 'Create, publish, and maintain website content records.'}
      title={seoOnly ? 'Titles & Meta' : 'Content'}
    >
      {error && <Notice message={error} />}
      <div className="mb-3 flex items-center gap-3">
        <label className="relative block min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search by title or URL..." type="search" value={query} />
        </label>
        <p aria-live="polite" className="shrink-0 text-[11px] font-medium text-slate-400">{total} results</p>
      </div>
      <Card className="overflow-hidden rounded-md border-[#dfe3e8] bg-white shadow-none">
        <div aria-label="Pages content table" className="max-h-[580px] overflow-auto focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400" tabIndex={0}>
          <table className="w-full min-w-[900px] text-left text-xs text-[#344054]">
            <caption className="sr-only">Manage website pages, SEO directives, sitemap visibility and schema settings.</caption>
            <thead className="sticky top-0 z-[1] border-b border-[#dfe3e8] bg-[#f4f7fa] text-[11px] font-semibold text-[#667085]">
              <tr>
                {([
                  ['title', 'Page', 'title'],
                  ['status', seoOnly ? 'Meta description' : 'Status', 'status'],
                  ['robots', 'Robots', null],
                  ['sitemap', 'Sitemap', null],
                  ['schema', 'Schema', null],
                  ['updatedAt', 'Updated', 'updatedAt'],
                ] as const).map(([key, label, sortableKey]) => (
                  <th aria-sort={sortableKey ? (sortKey === sortableKey ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none') : undefined} className="px-4 py-2 font-semibold" key={key} scope="col">
                    {sortableKey ? <button className="inline-flex items-center gap-1 hover:text-[#344054]" onClick={() => changeSort(sortableKey)} type="button">{label}<ChevronDown className={`h-2.5 w-2.5 transition ${sortKey === sortableKey ? `text-[#667085] ${sortDirection === 'asc' ? 'rotate-180' : ''}` : 'text-[#b5bdc9]'}`} /></button> : label}
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-semibold" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e7ec]">
              {loading && <tr><td className="px-4 py-10 text-center text-slate-400" colSpan={7}><LoaderCircle className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!loading && visible.length === 0 && <tr><td className="px-4 py-10 text-center text-slate-400" colSpan={7}>No content records found.</td></tr>}
              {visible.map((record) => (
                <tr className="group bg-white text-[#344054] transition-colors hover:bg-[#f8fafc]" key={record.id}>
                  <th className="px-4 py-2 font-normal" scope="row">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f1f4f7] text-[9px] font-semibold text-[#667085]">
                        {record.title.trim().charAt(0).toUpperCase() || 'P'}
                      </span>
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate font-semibold text-[#344054]">{record.title}</p>
                        <p className="truncate text-[10px] font-normal text-[#98a2b3]">/{record.slug}</p>
                      </div>
                    </div>
                  </th>
                  <td className="max-w-xs px-4 py-2">{seoOnly ? <p className="truncate">{record.description}</p> : <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium capitalize ${record.status === 'published' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#e8f1ff] text-[#3b82f6]'}`}>{record.status || 'draft'}</span>}</td>
                  <td className="px-4 py-2 font-mono text-[11px]">{record.robots}</td>
                  <td className="px-4 py-2"><span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${record.sitemapExcluded ? 'bg-[#f2f4f7] text-[#667085]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{record.sitemapExcluded ? 'Excluded' : 'Included'}</span></td>
                  <td className="px-4 py-2"><span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${record.schemaDisabled ? 'bg-[#f2f4f7] text-[#667085]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{record.schemaDisabled ? 'Disabled' : 'Enabled'}</span></td>
                  <td className="whitespace-nowrap px-4 py-2 text-[11px]">{record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2"><div className="flex justify-end gap-1"><button aria-label={`Edit ${record.title}`} className="rounded p-1.5 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700" onClick={() => setEditing(record)} title="Edit page" type="button"><FilePenLine className="h-3.5 w-3.5" /></button><button aria-label={`Delete ${record.title}`} className="rounded p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700" onClick={() => void remove(record)} title="Delete page" type="button"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#dfe3e8] bg-white px-4 py-3">
          <label className="flex items-center gap-2 text-[11px] font-medium text-[#475467]">
            <select className="h-8 rounded-md border border-[#dfe3e8] bg-white px-2.5 text-[11px] font-medium text-[#344054] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} value={pageSize}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            Entries Per Page
          </label>
          <nav aria-label="Table pagination" className="flex items-center gap-1">
            <button aria-label="Previous page" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button"><ChevronLeft className="h-3.5 w-3.5" /></button>
            {paginationItems(currentPage, totalPages).map((item) => typeof item === 'number'
              ? <button aria-current={item === currentPage ? 'page' : undefined} className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition ${item === currentPage ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-900 hover:bg-slate-100'}`} key={item} onClick={() => setPage(item)} type="button">{item}</button>
              : <span className="inline-flex h-8 min-w-6 items-center justify-center text-xs text-slate-500" key={item}>…</span>)}
            <button aria-label="Next page" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button"><ChevronRight className="h-3.5 w-3.5" /></button>
          </nav>
          </div>
      </Card>
      {editing && <ContentForm initial={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={() => {
        const created = editing === 'new'
        setEditing(null)
        if (created && page !== 1) setPage(1)
        else setReloadKey((current) => current + 1)
      }} />}
    </Page>
  )
}

export function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectRecord[]>([])
  const [form, setForm] = useState<Omit<RedirectRecord, 'id'>>({ from: '', to: '', statusCode: 301, enabled: true })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void api.getRedirects().then(setRedirects).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load redirects'))
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await api.createRedirect(form)
      setRedirects((current) => [saved, ...current])
      setForm({ from: '', to: '', statusCode: 301, enabled: true })
      toast.success('Redirect created successfully')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to create redirect'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
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

  return (
    <Page description="Route retired URLs to relevant destinations and protect search equity." title="Redirects">
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit p-5">
          <h2 className="text-sm font-semibold text-slate-800">Add redirect</h2>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <label className="block text-xs font-medium text-slate-700">Source path<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))} placeholder="/old-page" required value={form.from} /></label>
            <label className="block text-xs font-medium text-slate-700">Destination<input className={inputClass} onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))} placeholder="/new-page or https://..." required value={form.to} /></label>
            <label className="block text-xs font-medium text-slate-700">Redirect type<select className={inputClass} onChange={(event) => setForm((current) => ({ ...current, statusCode: Number(event.target.value) as 301 | 302 }))} value={form.statusCode}><option value={301}>301 · Permanent</option><option value={302}>302 · Temporary</option></select></label>
            <button className={`${primaryButton} w-full`} disabled={saving} type="submit">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add redirect</button>
          </form>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-4"><h2 className="text-sm font-semibold text-slate-800">Active redirects</h2><p className="mt-1 text-[11px] text-slate-400">{redirects.length} configured</p></div>
          <div className="divide-y divide-slate-100">
            {redirects.length === 0 && <p className="p-10 text-center text-xs text-slate-400">No redirects configured.</p>}
            {redirects.map((redirect) => <div className="flex items-center gap-3 p-4" key={redirect.id}><span className="rounded-md bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700">{redirect.statusCode}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-700">{redirect.from}</p><p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-400"><ExternalLink className="h-3 w-3" />{redirect.to}</p></div><button aria-label="Delete redirect" className="rounded-md p-2 text-red-500 hover:bg-red-50" onClick={() => void remove(redirect.id)} type="button"><Trash2 className="h-4 w-4" /></button></div>)}
          </div>
        </Card>
      </div>
    </Page>
  )
}

export function SitemapPage() {
  const [status, setStatus] = useState<SitemapStatus | null>(null)
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
      toast.success('Sitemap refreshed')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to generate sitemap'
      setError(message)
      toast.error(message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <Page action={<button className={primaryButton} disabled={working} onClick={() => void generate()} type="button">{working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Generate sitemap</button>} description="Monitor sitemap coverage and publish a fresh XML index." title="XML Sitemap">
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Included URLs', status?.entries ?? '—'], ['Excluded URLs', status?.excluded ?? '—'], ['Last generated', status?.lastGeneratedAt ? new Date(status.lastGeneratedAt).toLocaleString() : 'Never']].map(([label, value]) => <Card className="p-5" key={label}><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold text-slate-800">{value}</p></Card>)}
      </div>
      <Card className="mt-4 p-5">
        <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div><h2 className="text-sm font-semibold text-slate-800">Sitemap endpoint</h2><p className="mt-1 text-xs text-slate-500">{status?.url || 'The sitemap URL will appear after the API responds.'}</p></div></div>
      </Card>
    </Page>
  )
}

export function IndexingPage() {
  const [status, setStatus] = useState<IndexingStatus | null>(null)
  const [urls, setUrls] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    void api.getIndexingStatus().then(setStatus).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load indexing status'))
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const entries = urls.split('\n').map((url) => url.trim()).filter(Boolean)
    setWorking(true)
    setMessage('')
    try {
      const result = await api.requestIndexing(entries)
      setStatus(result.status)
      setUrls('')
      setError('')
      setMessage(`${result.submitted} URL${result.submitted === 1 ? '' : 's'} submitted for indexing.`)
      toast.success('Indexing request recorded')
    } catch (requestError) {
      const errorMessage = requestError instanceof Error ? requestError.message : 'Unable to request indexing'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setWorking(false)
    }
  }

  return (
    <Page description="Inspect coverage and submit important URLs to the indexing queue." title="Indexing">
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      {message && <Notice message={message} tone="success" />}
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Indexed', status?.indexed ?? '—'], ['Discovered', status?.discovered ?? '—'], ['Blocked', status?.blocked ?? '—']].map(([label, value]) => <Card className="p-5" key={label}><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p></Card>)}
      </div>
      <Card className="mt-4 max-w-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-800">Request indexing</h2>
        <p className="mt-1 text-[11px] text-slate-500">Enter one absolute URL per line.</p>
        <form className="mt-4" onSubmit={submit}><textarea className={`${inputClass} min-h-36`} onChange={(event) => setUrls(event.target.value)} placeholder={'https://orivon.com/services/ivf\nhttps://orivon.com/blog/fertility-care'} required value={urls} /><button className={`${primaryButton} mt-3`} disabled={working} type="submit">{working ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Submit URLs</button></form>
      </Card>
    </Page>
  )
}
