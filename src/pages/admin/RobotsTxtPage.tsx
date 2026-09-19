import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { ExternalLink, FilePenLine, LoaderCircle } from 'lucide-react'
import { API_BASE_URL, api, type RobotsTxtConfig } from '../../api/client'
import { Card } from '../../components/ui'
import { inputClass, Notice, Page, primaryButton } from './shared'

export function RobotsTxtPage() {
  const [config, setConfig] = useState<RobotsTxtConfig | null>(null)
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void api.getRobotsTxt()
      .then((next) => {
        setConfig(next)
        setBody(next.body)
      })
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load robots.txt'))
      .finally(() => setLoading(false))
  }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const result = await api.saveRobotsTxt(body)
      setConfig(result.config)
      setBody(result.config.body)
      setError('')
      toast.success(result.message || 'robots.txt saved')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to save robots.txt'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page
      action={config?.publicUrl ? (
        <a className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 hover:text-brand-800" href={config.publicUrl} rel="noreferrer" target="_blank">
          <ExternalLink className="h-4 w-4" />
          View live file
        </a>
      ) : undefined}
      description="Edit the public robots.txt served at the site root. Changes go live immediately for crawlers."
      title="Robots.txt"
    >
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <Card className="max-w-3xl p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading robots.txt…
          </div>
        ) : (
          <form onSubmit={(event) => void save(event)}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {config?.isDefault ? 'Using the default template.' : 'Custom robots.txt is active.'}
              </p>
              {config?.publicUrl && (
                <span className="font-mono text-[11px] text-slate-400">{config.publicUrl}</span>
              )}
            </div>
            <textarea
              className={`${inputClass} min-h-72 font-mono text-xs leading-relaxed`}
              onChange={(event) => setBody(event.target.value)}
              required
              spellCheck={false}
              value={body}
            />
            <button className={`${primaryButton} mt-4`} disabled={saving || !body.trim()} type="submit">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FilePenLine className="h-4 w-4" />}
              Save robots.txt
            </button>
          </form>
        )}
      </Card>
    </Page>
  )
}
