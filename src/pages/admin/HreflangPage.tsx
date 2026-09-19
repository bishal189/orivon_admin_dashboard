import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { FilePenLine, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { API_BASE_URL, api, type HreflangLocale, type HreflangSettings } from '../../api/client'
import { Card } from '../../components/ui'
import { inputClass, Notice, Page, primaryButton, secondaryButton } from './shared'

const empty: HreflangSettings = {
  enabled: false,
  defaultLocale: 'en',
  xDefault: true,
  locales: [{ hreflang: 'en', pathPrefix: '', label: 'English' }],
}

export function HreflangPage() {
  const [settings, setSettings] = useState<HreflangSettings>(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void api.getHreflang()
      .then(setSettings)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load hreflang settings'))
      .finally(() => setLoading(false))
  }, [])

  const updateLocale = (index: number, patch: Partial<HreflangLocale>) => {
    setSettings((current) => ({
      ...current,
      locales: current.locales.map((locale, localeIndex) => (localeIndex === index ? { ...locale, ...patch } : locale)),
    }))
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const result = await api.saveHreflang(settings)
      setSettings(result.hreflang)
      setError('')
      toast.success(result.message || 'Hreflang settings saved')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to save hreflang settings'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page
      description="Publish alternate language/region URLs with hreflang and x-default. Leave disabled for a single-language English site."
      title="Hreflang & Locales"
    >
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <Card className="max-w-3xl p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading hreflang settings…
          </div>
        ) : (
          <form className="space-y-6" onSubmit={(event) => void save(event)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600">
                <input
                  checked={settings.enabled}
                  className="mt-0.5 h-4 w-4 accent-[#1f4d42]"
                  onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
                  type="checkbox"
                />
                <span>Enable hreflang link tags on the public site</span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600">
                <input
                  checked={settings.xDefault}
                  className="mt-0.5 h-4 w-4 accent-[#1f4d42]"
                  onChange={(event) => setSettings((current) => ({ ...current, xDefault: event.target.checked }))}
                  type="checkbox"
                />
                <span>Emit `x-default` pointing at the default locale</span>
              </label>
            </div>

            <label className="text-xs font-medium text-slate-700">
              Default locale (x-default target)
              <input
                className={inputClass}
                onChange={(event) => setSettings((current) => ({ ...current, defaultLocale: event.target.value }))}
                placeholder="en"
                value={settings.defaultLocale}
              />
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Locales</p>
                <button
                  className={secondaryButton}
                  onClick={() => setSettings((current) => ({
                    ...current,
                    locales: [...current.locales, { hreflang: '', pathPrefix: '', label: '' }],
                  }))}
                  type="button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add locale
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {settings.locales.map((locale, index) => (
                  <div className="grid gap-3 rounded-xl border border-slate-200 p-3.5 sm:grid-cols-3" key={`${locale.hreflang}-${index}`}>
                    <label className="text-xs font-medium text-slate-700">
                      Hreflang
                      <input className={inputClass} onChange={(e) => updateLocale(index, { hreflang: e.target.value })} placeholder="en | ar-AE" value={locale.hreflang} />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Path prefix
                      <input className={inputClass} onChange={(e) => updateLocale(index, { pathPrefix: e.target.value })} placeholder="/ar or empty" value={locale.pathPrefix} />
                    </label>
                    <label className="text-xs font-medium text-slate-700">
                      Label
                      <div className="flex gap-2">
                        <input className={inputClass} onChange={(e) => updateLocale(index, { label: e.target.value })} value={locale.label} />
                        <button
                          className="rounded-lg border border-slate-200 p-2 text-red-500 hover:bg-red-50"
                          disabled={settings.locales.length <= 1}
                          onClick={() => setSettings((current) => ({
                            ...current,
                            locales: current.locales.filter((_, localeIndex) => localeIndex !== index),
                          }))}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button className={primaryButton} disabled={saving} type="submit">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FilePenLine className="h-4 w-4" />}
              Save hreflang
            </button>
          </form>
        )}
      </Card>
    </Page>
  )
}
