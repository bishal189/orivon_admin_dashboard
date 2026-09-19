import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FilePenLine,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { api, type ContentRecord, type ContentType } from '../../api/client'
import { EDITORIAL_STATUS_LABELS } from '../../api/client'
import { Card } from '../../components/ui'
import { paginationItems } from '../../lib/pagination'
import { ContentForm } from './ContentForm'
import {
  contentTypeLabels,
  contentTypePlurals,
  Notice,
  Page,
  primaryButton,
  secondaryButton,
} from './shared'

export function ContentPage({
  seoOnly = false,
  contentType = 'PAGE',
}: {
  seoOnly?: boolean
  contentType?: ContentType
}) {
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
  const metaImportRef = useRef<HTMLInputElement>(null)
  const typeLabel = contentTypeLabels[contentType]
  const typePlural = contentTypePlurals[contentType]

  useEffect(() => {
    setPage(1)
  }, [contentType, seoOnly])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      void api.getContent({
        page,
        pageSize,
        query,
        type: seoOnly ? undefined : contentType,
        sortBy: sortKey,
        sortDirection,
      })
        .then(({ records: nextRecords, pagination }) => {
          if (cancelled) return
          setRecords(nextRecords)
          setTotal(pagination.total)
          setTotalPages(pagination.pages)
        })
        .catch((requestError: unknown) => {
          if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load content')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, query ? 250 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [contentType, page, pageSize, query, reloadKey, seoOnly, sortDirection, sortKey])

  const remove = async (record: ContentRecord) => {
    const published = record.status === 'published'
    if (published) {
      const replacement = window.prompt(
        `“${record.title}” is published. Enter the closest relevant replacement path (not homepage unless intentional):\n\ne.g. /services/doctor-nurse-licensing`,
        '',
      )
      if (replacement == null) return
      const path = replacement.trim()
      if (!path) {
        toast.error('A replacement path is required to protect established URLs')
        return
      }
      const allowHomepage = path === '/' && window.confirm('Really redirect this URL to the homepage? Prefer a closer replacement page.')
      if (path === '/' && !allowHomepage) return
      try {
        const result = await api.retireContent(record.id, {
          replacementPath: path,
          allowHomepageRedirect: path === '/',
          rewriteLinks: true,
        })
        toast.success(result.message)
        if (records.length === 1 && page > 1) setPage((current) => current - 1)
        else setReloadKey((current) => current + 1)
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Unable to retire content'
        setError(message)
        toast.error(message)
      }
      return
    }

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

  const openEditor = async (record: ContentRecord) => {
    try {
      const full = await api.getContentById(record.id)
      setEditing(full)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to open content'
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
      action={seoOnly ? (
        <div className="flex flex-wrap gap-2">
          <button
            className={secondaryButton}
            onClick={() => void api.exportUrlsCsv().then(() => toast.success('URL export downloaded')).catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Export failed'))}
            type="button"
          >
            <Download className="h-3.5 w-3.5" />
            Export URLs
          </button>
          <button
            className={secondaryButton}
            onClick={() => void api.exportMetadataCsv().then(() => toast.success('Metadata CSV downloaded')).catch((err: unknown) => toast.error(err instanceof Error ? err.message : 'Export failed'))}
            type="button"
          >
            <Download className="h-3.5 w-3.5" />
            Export metadata
          </button>
          <button className={secondaryButton} onClick={() => metaImportRef.current?.click()} type="button">
            <Upload className="h-3.5 w-3.5" />
            Import metadata
          </button>
          <input
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              void file.text().then(async (csv) => {
                try {
                  const { result, message } = await api.importMetadataCsv(csv)
                  toast.success(`${message} · ${result.updated} updated`)
                  setReloadKey((current) => current + 1)
                  if (result.errors?.length) toast.warn(result.errors[0])
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Import failed')
                } finally {
                  if (metaImportRef.current) metaImportRef.current.value = ''
                }
              })
            }}
            ref={metaImportRef}
            type="file"
          />
        </div>
      ) : (
        <button className={primaryButton} onClick={() => setEditing('new')} type="button"><Plus className="h-4 w-4" />New {typeLabel.toLowerCase()}</button>
      )}
      description={seoOnly ? 'Review and edit search titles, descriptions, canonicals and robots. Export URLs/metadata before migrations; import CSV for bulk SEO updates.' : `Create and manage ${typePlural.toLowerCase()} records with SEO title, meta description, slug, canonical, and index controls.`}
      title={seoOnly ? 'Titles & Meta' : typePlural}
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
        <div aria-label={`${typePlural} content table`} className="max-h-[580px] overflow-auto focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400" tabIndex={0}>
          <table className="w-full min-w-[900px] text-left text-xs text-[#344054]">
            <caption className="sr-only">Manage {typePlural.toLowerCase()}, SEO directives, sitemap visibility and schema settings.</caption>
            <thead className="sticky top-0 z-[1] border-b border-[#dfe3e8] bg-[#f4f7fa] text-[11px] font-semibold text-[#667085]">
              <tr>
                {([
                  ['title', seoOnly ? 'Title' : typeLabel, 'title'],
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
                  <td className="max-w-xs px-4 py-2">{seoOnly ? <p className="truncate">{record.description}</p> : <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                    record.status === 'published'
                      ? 'bg-[#dcfce7] text-[#16a34a]'
                      : record.status === 'medical_review'
                        ? 'bg-[#fef3c7] text-[#b45309]'
                        : record.status === 'editorial_review'
                          ? 'bg-[#ede9fe] text-[#6d28d9]'
                          : 'bg-[#e8f1ff] text-[#3b82f6]'
                  }`}>{EDITORIAL_STATUS_LABELS[record.status || 'draft']}</span>}</td>
                  <td className="px-4 py-2 font-mono text-[11px]">{record.robots}</td>
                  <td className="px-4 py-2"><span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${record.sitemapExcluded ? 'bg-[#f2f4f7] text-[#667085]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{record.sitemapExcluded ? 'Excluded' : 'Included'}</span></td>
                  <td className="px-4 py-2"><span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${record.schemaDisabled ? 'bg-[#f2f4f7] text-[#667085]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{record.schemaDisabled ? 'Disabled' : 'Enabled'}</span></td>
                  <td className="whitespace-nowrap px-4 py-2 text-[11px]">{record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2"><div className="flex justify-end gap-1"><button aria-label={`Edit ${record.title}`} className="rounded p-1.5 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700" onClick={() => void openEditor(record)} title="Edit page" type="button"><FilePenLine className="h-3.5 w-3.5" /></button><button aria-label={`Delete ${record.title}`} className="rounded p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700" onClick={() => void remove(record)} title="Delete page" type="button"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
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
      {editing && (
        <ContentForm
          defaultType={contentType}
          initial={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            const created = editing === 'new'
            setEditing(null)
            if (created && page !== 1) setPage(1)
            else setReloadKey((current) => current + 1)
          }}
        />
      )}
    </Page>
  )
}
