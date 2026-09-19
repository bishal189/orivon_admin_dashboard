import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { API_BASE_URL, api } from '../../api/client'
import { Card } from '../../components/ui'
import { Notice, Page } from './shared'

type AuditItem = {
  id: string
  action: string
  entityType?: string | null
  summary?: string | null
  createdAt: string
  user?: { email: string; name: string; role: string } | null
}

export function AuditLogsPage() {
  const [items, setItems] = useState<AuditItem[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void api.getAuditLogs({ limit: 100 })
      .then((result) => {
        setItems(result.items)
        setTotal(Number(result.meta?.total || result.items.length))
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load audit logs'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Page description="Security and CMS action history: logins, redirects, content retirements, SEO imports, and 2FA changes." title="Audit logs">
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 text-[11px] text-slate-500">{total} events</div>
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.length === 0 && <p className="p-8 text-center text-xs text-slate-400">No audit events yet.</p>}
            {items.map((item) => (
              <div className="px-4 py-3" key={item.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">{item.action}</span>
                  <span className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-slate-700">{item.summary || '—'}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {item.user ? `${item.user.name} · ${item.user.email}` : 'System / anonymous'}
                  {item.entityType ? ` · ${item.entityType}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  )
}
