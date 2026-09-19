import { useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { api, ApiError } from '../api/client'
import { Card } from '../components/ui'
import { paginationItems } from '../lib/pagination'
import {
  appointmentStatusLabels,
  appointmentStatusStyles,
  type AppointmentRecord,
  type AppointmentStats,
  type AppointmentStatus,
  type AppointmentStatusFilter,
} from '../types/appointments'

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function formatDay(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export function AppointmentsPage() {
  const [records, setRecords] = useState<AppointmentRecord[]>([])
  const [stats, setStats] = useState<AppointmentStats | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<AppointmentStatusFilter>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<AppointmentRecord | null>(null)
  const [detailNotes, setDetailNotes] = useState('')
  const [detailStatus, setDetailStatus] = useState<AppointmentStatus>('NEW')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      void Promise.all([
        api.getAppointments({ page, pageSize, query, status }),
        api.getAppointmentStats(),
      ])
        .then(([list, nextStats]) => {
          if (cancelled) return
          setRecords(list.records)
          setTotal(list.pagination.total)
          setTotalPages(list.pagination.pages)
          setStats(nextStats)
        })
        .catch((requestError: unknown) => {
          if (cancelled) return
          if (requestError instanceof ApiError && requestError.status === 404) {
            setRecords([])
            setTotal(0)
            setTotalPages(1)
            return
          }
          setError(requestError instanceof Error ? requestError.message : 'Unable to load appointments')
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

  useEffect(() => {
    if (!selected) return
    setDetailNotes(selected.notes || '')
    setDetailStatus(selected.status)
  }, [selected])

  const refresh = () => setReloadKey((current) => current + 1)

  const statusFilters = useMemo(() => ([
    { key: 'ALL' as const, label: 'All', count: stats?.total ?? 0 },
    { key: 'NEW' as const, label: 'New', count: stats?.NEW ?? 0 },
    { key: 'CONTACTED' as const, label: 'Contacted', count: stats?.CONTACTED ?? 0 },
    { key: 'CONFIRMED' as const, label: 'Confirmed', count: stats?.CONFIRMED ?? 0 },
    { key: 'COMPLETED' as const, label: 'Completed', count: stats?.COMPLETED ?? 0 },
    { key: 'CANCELLED' as const, label: 'Cancelled', count: stats?.CANCELLED ?? 0 },
  ]), [stats])

  const saveDetail = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const result = await api.updateAppointment(selected.id, {
        status: detailStatus,
        notes: detailNotes.trim() || null,
      })
      toast.success(result.message)
      setSelected(result.record)
      refresh()
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to update appointment')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (record: AppointmentRecord) => {
    if (!window.confirm(`Delete appointment ${record.reference}?`)) return
    try {
      toast.success(await api.deleteAppointment(record.id))
      if (selected?.id === record.id) setSelected(null)
      if (records.length === 1 && page > 1) setPage((current) => current - 1)
      else refresh()
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to delete appointment')
    }
  }

  return (
    <main className="p-4 md:p-6 xl:p-7">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 md:text-[28px]">Appointments</h1>
          <p className="mt-1 text-xs text-slate-500">
            Analyse booking requests submitted from the client website and track them through completion.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[11px] font-semibold transition ${
                status === item.key
                  ? 'border-[#0b1f3a] bg-[#0b1f3a] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
              key={item.key}
              onClick={() => {
                setStatus(item.key)
                setPage(1)
              }}
              type="button"
            >
              {item.label}
              <span className={`rounded px-1.5 py-0.5 text-[10px] ${status === item.key ? 'bg-white/15' : 'bg-slate-100 text-slate-500'}`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        {error && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{error}</div>}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Search name, email, phone, reference..."
                  type="search"
                  value={query}
                />
              </label>
              <p aria-live="polite" className="self-center text-[11px] font-medium text-slate-400">{total} results</p>
            </div>

            <Card className="overflow-hidden rounded-md border-[#dfe3e8] bg-white shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-xs text-[#344054]">
                  <caption className="sr-only">Appointment booking requests from the website</caption>
                  <thead className="border-b border-[#dfe3e8] bg-[#f4f7fa] text-[11px] font-semibold text-[#667085]">
                    <tr>
                      <th className="px-4 py-2">Reference</th>
                      <th className="px-4 py-2">Patient</th>
                      <th className="px-4 py-2">Service</th>
                      <th className="px-4 py-2">Preferred</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Received</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4e7ec]">
                    {loading && (
                      <tr>
                        <td className="px-4 py-10 text-center text-slate-400" colSpan={7}>
                          <LoaderCircle className="mx-auto h-5 w-5 animate-spin" />
                        </td>
                      </tr>
                    )}
                    {!loading && records.length === 0 && (
                      <tr>
                        <td className="px-4 py-10 text-center text-slate-400" colSpan={7}>No appointments found.</td>
                      </tr>
                    )}
                    {!loading && records.map((record) => (
                      <tr
                        className={`cursor-pointer hover:bg-slate-50 ${selected?.id === record.id ? 'bg-sky-50/60' : ''}`}
                        key={record.id}
                        onClick={() => setSelected(record)}
                      >
                        <th className="px-4 py-3 font-mono text-[11px] font-medium text-slate-800" scope="row">
                          {record.reference}
                        </th>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{record.name}</p>
                          <p className="text-[11px] text-slate-500">{record.email}</p>
                        </td>
                        <td className="max-w-[160px] px-4 py-3 text-[11px] text-slate-600">
                          <p className="truncate">{record.service || '—'}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                          {formatDay(record.preferredDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-sm px-2 py-1 text-[10px] font-medium ${appointmentStatusStyles[record.status]}`}>
                            {appointmentStatusLabels[record.status]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              aria-label={`Delete ${record.reference}`}
                              className="rounded p-1.5 text-red-500 hover:bg-red-50"
                              onClick={(event) => {
                                event.stopPropagation()
                                void remove(record)
                              }}
                              title="Delete"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-[#dfe3e8] px-4 py-3">
                <label className="flex items-center gap-2 text-[11px] font-medium text-[#475467]">
                  <select
                    className="h-8 rounded-md border border-[#dfe3e8] bg-white px-2.5"
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                    value={pageSize}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  Entries Per Page
                </label>
                <nav aria-label="Appointments pagination" className="flex items-center gap-1">
                  <button
                    aria-label="Previous page"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    disabled={page === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    type="button"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  {paginationItems(page, totalPages).map((item) => (
                    typeof item === 'number'
                      ? (
                        <button
                          aria-current={item === page ? 'page' : undefined}
                          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold ${item === page ? 'bg-blue-500 text-white' : 'text-slate-900 hover:bg-slate-100'}`}
                          key={item}
                          onClick={() => setPage(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      )
                      : <span className="inline-flex h-8 min-w-6 items-center justify-center text-xs text-slate-500" key={item}>…</span>
                  ))}
                  <button
                    aria-label="Next page"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                    disabled={page === totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    type="button"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </nav>
              </div>
            </Card>
          </div>

          <aside>
            {!selected && (
              <Card className="flex min-h-[320px] flex-col items-center justify-center border-[#dfe3e8] p-6 text-center shadow-none">
                <CalendarClock className="mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">Select an appointment</p>
                <p className="mt-1 max-w-[220px] text-[11px] text-slate-500">
                  Open a website submission to review details, update status, and add notes.
                </p>
              </Card>
            )}

            {selected && (
              <Card className="border-[#dfe3e8] p-4 shadow-none">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] font-semibold text-slate-500">{selected.reference}</p>
                    <h2 className="mt-1 text-base font-semibold text-slate-900">{selected.name}</h2>
                    <p className="text-[11px] text-slate-500">{selected.email}{selected.phone ? ` · ${selected.phone}` : ''}</p>
                  </div>
                  <button
                    aria-label="Close details"
                    className="rounded p-1 text-slate-400 hover:bg-slate-100"
                    onClick={() => setSelected(null)}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <dl className="mb-4 grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    ['Service', selected.service || '—'],
                    ['Destination', selected.destination || '—'],
                    ['Country', selected.country || '—'],
                    ['Role', selected.role || '—'],
                    ['Preferred', formatDay(selected.preferredDate)],
                    ['Source', selected.source],
                  ].map(([label, value]) => (
                    <div className="rounded-md bg-slate-50 px-2.5 py-2" key={label}>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</dt>
                      <dd className="mt-0.5 font-medium text-slate-700">{value}</dd>
                    </div>
                  ))}
                </dl>

                {selected.message && (
                  <div className="mb-4 rounded-md border border-slate-100 bg-white px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Message</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">{selected.message}</p>
                  </div>
                )}

                <label className="mb-2.5 block text-[11px] font-medium text-slate-600">
                  Status
                  <select
                    className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500"
                    onChange={(event) => setDetailStatus(event.target.value as AppointmentStatus)}
                    value={detailStatus}
                  >
                    {(Object.keys(appointmentStatusLabels) as AppointmentStatus[]).map((key) => (
                      <option key={key} value={key}>{appointmentStatusLabels[key]}</option>
                    ))}
                  </select>
                </label>

                <label className="mb-3 block text-[11px] font-medium text-slate-600">
                  Internal notes
                  <textarea
                    className="mt-1 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    onChange={(event) => setDetailNotes(event.target.value)}
                    placeholder="Call notes, follow-ups, coordinator comments..."
                    value={detailNotes}
                  />
                </label>

                <button
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  disabled={saving}
                  onClick={() => void saveDetail()}
                  type="button"
                >
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save updates
                </button>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
