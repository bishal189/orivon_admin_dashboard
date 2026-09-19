import { useEffect, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RotateCcw,
  Route,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { api, ApiError, type NotFoundRecord } from '../api/client'
import { Card } from '../components/ui'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { fieldInputClass, FieldError, isPathOrUrl } from './admin/shared'
import { paginationItems } from '../lib/pagination'

type MonitorStatus = 'open' | 'resolved' | 'all'

function referrerLabel(value?: string | null) {
  if (!value) return 'Direct / unknown'
  try {
    return new URL(value).hostname
  } catch {
    return value
  }
}

export function NotFoundMonitorPage() {
  const [records, setRecords] = useState<NotFoundRecord[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<MonitorStatus>('open')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState('')
  const [redirecting, setRedirecting] = useState<NotFoundRecord | null>(null)
  const [redirectTarget, setRedirectTarget] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<NotFoundRecord | null>(null)
  const [redirectAttempted, setRedirectAttempted] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      void api.getNotFoundEvents({ page, pageSize, query, status })
        .then(({ records: nextRecords, pagination }) => {
          if (cancelled) return
          setRecords(nextRecords)
          setTotal(pagination.total)
          setTotalPages(pagination.pages)
        })
        .catch((requestError: unknown) => {
          if (cancelled) return
          if (requestError instanceof ApiError && requestError.status === 404) {
            setRecords([])
            setTotal(0)
            setTotalPages(1)
            return
          }
          setError(requestError instanceof Error ? requestError.message : 'Unable to load 404 records')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, query ? 250 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [page, pageSize, query, reloadKey, status])

  const refresh = () => setReloadKey((current) => current + 1)

  const setResolved = async (record: NotFoundRecord, resolved: boolean) => {
    try {
      const result = await api.setNotFoundResolved(record.id, resolved)
      toast.success(result.message)
      refresh()
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to update 404 record')
    }
  }

  const remove = async (record: NotFoundRecord) => {
    try {
      toast.success(await api.deleteNotFoundEvent(record.id))
      if (records.length === 1 && page > 1) setPage((current) => current - 1)
      else refresh()
      setPendingDelete(null)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to delete 404 record')
    }
  }

  const redirectTargetError = !redirectTarget.trim()
    ? 'Enter a destination path.'
    : !isPathOrUrl(redirectTarget)
      ? 'Use a path starting with / or a full http(s) URL.'
      : ''

  const createRedirect = async (event: FormEvent) => {
    event.preventDefault()
    if (!redirecting) return
    setRedirectAttempted(true)
    if (redirectTargetError) return
    setSaving(true)
    try {
      await api.createRedirect({
        from: redirecting.path,
        to: redirectTarget.trim(),
        statusCode: 301,
        enabled: true,
      })
      await api.setNotFoundResolved(redirecting.id, true)
      toast.success('301 redirect created and 404 resolved')
      setRedirecting(null)
      setRedirectTarget('')
      setRedirectAttempted(false)
      refresh()
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to create redirect')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 md:p-6 xl:p-7">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 md:text-[28px]">404 Monitor</h1>
          <p className="mt-1 text-xs text-slate-500">Find broken URLs, resolve them, or create a relevant permanent redirect.</p>
        </header>

        {redirecting && (
          <Card className="mb-4 border-blue-200 bg-blue-50/40 p-4">
            <form className="flex flex-col gap-3 md:flex-row md:items-end" noValidate onSubmit={createRedirect}>
              <label className="min-w-0 flex-1 text-xs font-medium text-slate-700">
                Redirect from
                <input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500" disabled value={redirecting.path} />
              </label>
              <label className="min-w-0 flex-1 text-xs font-medium text-slate-700">
                Redirect to
                <input
                  aria-describedby={redirectAttempted && redirectTargetError ? 'nf-redirect-to-error' : undefined}
                  aria-invalid={redirectAttempted && Boolean(redirectTargetError)}
                  autoFocus
                  className={fieldInputClass(redirectAttempted && Boolean(redirectTargetError), 'h-10 !py-0')}
                  onChange={(event) => setRedirectTarget(event.target.value)}
                  placeholder="/closest-relevant-page"
                  value={redirectTarget}
                />
                {redirectAttempted && redirectTargetError && (
                  <FieldError id="nf-redirect-to-error" message={redirectTargetError} />
                )}
              </label>
              <div className="flex gap-2">
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={saving} type="submit">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}Create 301</button>
                <button aria-label="Cancel redirect" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" disabled={saving} onClick={() => { setRedirecting(null); setRedirectAttempted(false) }} type="button"><X className="h-4 w-4" /></button>
              </div>
            </form>
          </Card>
        )}

        {error && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{error}</div>}

        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search missing URL..." type="search" value={query} />
          </label>
          <select aria-label="404 status" className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500" onChange={(event) => { setStatus(event.target.value as MonitorStatus); setPage(1) }} value={status}>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="all">All records</option>
          </select>
          <p aria-live="polite" className="self-center text-[11px] font-medium text-slate-400">{total} results</p>
        </div>

        <Card className="overflow-hidden rounded-md border-[#dfe3e8] bg-white shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs text-[#344054]">
              <caption className="sr-only">Missing URLs recorded by the public website.</caption>
              <thead className="border-b border-[#dfe3e8] bg-[#f4f7fa] text-[11px] font-semibold text-[#667085]">
                <tr>
                  <th className="px-4 py-2">Missing URL</th>
                  <th className="px-4 py-2">Hits</th>
                  <th className="px-4 py-2">Referrer</th>
                  <th className="px-4 py-2">Last seen</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e7ec]">
                {loading && <tr><td className="px-4 py-10 text-center text-slate-400" colSpan={6}><LoaderCircle className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
                {!loading && records.length === 0 && <tr><td className="px-4 py-10 text-center text-slate-400" colSpan={6}>No 404 records found.</td></tr>}
                {!loading && records.map((record) => (
                  <tr className="hover:bg-slate-50" key={record.id}>
                    <th className="max-w-sm px-4 py-3 font-mono text-[11px] font-medium text-slate-800" scope="row"><p className="truncate">{record.path}</p></th>
                    <td className="px-4 py-3 font-semibold">{record.hits}</td>
                    <td className="max-w-48 px-4 py-3 text-[11px] text-slate-500"><p className="truncate" title={record.referrer || undefined}>{referrerLabel(record.referrer)}</p></td>
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">{new Date(record.lastSeenAt).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`rounded-sm px-2 py-1 text-[10px] font-medium ${record.resolvedAt ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{record.resolvedAt ? 'Resolved' : 'Open'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {!record.resolvedAt && <button aria-label={`Create redirect for ${record.path}`} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" onClick={() => { setRedirecting(record); setRedirectTarget('') }} title="Create 301 redirect" type="button"><Route className="h-4 w-4" /></button>}
                        <button aria-label={record.resolvedAt ? `Reopen ${record.path}` : `Resolve ${record.path}`} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50" onClick={() => void setResolved(record, !record.resolvedAt)} title={record.resolvedAt ? 'Reopen' : 'Mark resolved'} type="button">{record.resolvedAt ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</button>
                        <button aria-label={`Delete ${record.path}`} className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => setPendingDelete(record)} title="Delete record" type="button"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#dfe3e8] px-4 py-3">
            <label className="flex items-center gap-2 text-[11px] font-medium text-[#475467]">
              <select className="h-8 rounded-md border border-[#dfe3e8] bg-white px-2.5" onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} value={pageSize}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              Entries Per Page
            </label>
            <nav aria-label="404 pagination" className="flex items-center gap-1">
              <button aria-label="Previous page" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button"><ChevronLeft className="h-3.5 w-3.5" /></button>
              {paginationItems(page, totalPages).map((item) => typeof item === 'number'
                ? <button aria-current={item === page ? 'page' : undefined} className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold ${item === page ? 'bg-blue-500 text-white' : 'text-slate-900 hover:bg-slate-100'}`} key={item} onClick={() => setPage(item)} type="button">{item}</button>
                : <span className="inline-flex h-8 min-w-6 items-center justify-center text-xs text-slate-500" key={item}>…</span>)}
              <button aria-label="Next page" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button"><ChevronRight className="h-3.5 w-3.5" /></button>
            </nav>
          </div>
        </Card>
      </div>

      {pendingDelete && (
        <ConfirmDeleteModal
          title="Delete this 404 record?"
          description={
            <>
              Do you want to delete the record for{' '}
              <span className="font-semibold text-slate-700">“{pendingDelete.path}”</span>?
              This cannot be undone.
            </>
          }
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => remove(pendingDelete)}
        />
      )}
    </main>
  )
}
