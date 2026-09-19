import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { LoaderCircle, Send } from 'lucide-react'
import { API_BASE_URL, api, type IndexingStatus } from '../../api/client'
import { Card } from '../../components/ui'
import { inputClass, Notice, Page, primaryButton } from './shared'

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
