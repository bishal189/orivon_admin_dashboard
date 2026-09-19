import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { FilePenLine, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import {
  API_BASE_URL,
  api,
  type AnalyticsConversions,
  type AnalyticsTracking,
  type ConversionEvent,
  type SiteVerifications,
} from '../../api/client'
import { Card } from '../../components/ui'
import { inputClass, Notice, Page, primaryButton, secondaryButton } from './shared'

const emptyTracking: AnalyticsTracking = { gtmContainerId: '', ga4MeasurementId: '' }
const emptyVerifications: SiteVerifications = { googleSiteVerification: '', bingSiteVerification: '' }

function newEvent(): ConversionEvent {
  return {
    id: `event_${Date.now()}`,
    trigger: 'form_submit',
    formType: 'consultation',
    ga4EventName: 'generate_lead',
    gtmEventName: 'generate_lead',
    enabled: true,
  }
}

export function TrafficConversionsPage() {
  const [verifications, setVerifications] = useState<SiteVerifications>(emptyVerifications)
  const [tracking, setTracking] = useState<AnalyticsTracking>(emptyTracking)
  const [conversions, setConversions] = useState<AnalyticsConversions>({ events: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void Promise.all([
      api.getVerifications(),
      api.getAnalyticsTracking(),
      api.getAnalyticsConversions(),
    ])
      .then(([nextVerifications, nextTracking, nextConversions]) => {
        setVerifications(nextVerifications)
        setTracking(nextTracking)
        setConversions(nextConversions)
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load analytics settings')
      })
      .finally(() => setLoading(false))
  }, [])

  const updateEvent = (id: string, patch: Partial<ConversionEvent>) => {
    setConversions((current) => ({
      events: current.events.map((event) => (event.id === id ? { ...event, ...patch } : event)),
    }))
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const [verificationResult, trackingResult, conversionResult] = await Promise.all([
        api.saveVerifications(verifications),
        api.saveAnalyticsTracking(tracking),
        api.saveAnalyticsConversions(conversions),
      ])
      setVerifications(verificationResult.verifications)
      setTracking(trackingResult.tracking)
      setConversions(conversionResult.conversions)
      setError('')
      toast.success('Traffic & conversion settings saved')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to save settings'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page
      description="Connect Google Search Console, Bing Webmaster Tools, GTM/GA4, and organic conversion events used by the public site."
      title="Traffic & Conversions"
    >
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <Card className="max-w-3xl p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading analytics settings…
          </div>
        ) : (
          <form className="space-y-8" onSubmit={(event) => void save(event)}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Search engine verification</p>
              <p className="mt-1 text-xs text-slate-500">
                Paste the meta content values from Google Search Console and Bing Webmaster Tools. They are injected as verification meta tags on the public site.
              </p>
              <div className="mt-3 grid gap-3">
                <label className="text-xs font-medium text-slate-700">
                  Google Search Console (`google-site-verification`)
                  <input
                    className={inputClass}
                    onChange={(event) => setVerifications((current) => ({ ...current, googleSiteVerification: event.target.value }))}
                    placeholder="abcdefghijklmnopqrstuvwxyz0123456789"
                    value={verifications.googleSiteVerification}
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  Bing Webmaster Tools (`msvalidate.01`)
                  <input
                    className={inputClass}
                    onChange={(event) => setVerifications((current) => ({ ...current, bingSiteVerification: event.target.value }))}
                    placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    value={verifications.bingSiteVerification}
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Google Analytics / GTM</p>
              <p className="mt-1 text-xs text-slate-500">
                Prefer one primary container. If both are set, GTM is loaded and can own GA4 tags; a standalone GA4 ID is also supported.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-700">
                  GTM container ID
                  <input
                    className={inputClass}
                    onChange={(event) => setTracking((current) => ({ ...current, gtmContainerId: event.target.value }))}
                    placeholder="GTM-XXXXXXX"
                    value={tracking.gtmContainerId}
                  />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  GA4 measurement ID
                  <input
                    className={inputClass}
                    onChange={(event) => setTracking((current) => ({ ...current, ga4MeasurementId: event.target.value }))}
                    placeholder="G-XXXXXXXXXX"
                    value={tracking.ga4MeasurementId}
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Organic conversion events</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Fired from contact forms, newsletter signup, phone, and WhatsApp clicks so organic leads are measurable in GA4/GTM.
                  </p>
                </div>
                <button
                  className={secondaryButton}
                  onClick={() => setConversions((current) => ({ events: [...current.events, newEvent()] }))}
                  type="button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add event
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {conversions.events.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                    No conversion events configured.
                  </p>
                ) : (
                  conversions.events.map((event) => (
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5" key={event.id}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-medium text-slate-700">
                          Event ID
                          <input className={inputClass} onChange={(e) => updateEvent(event.id, { id: e.target.value })} value={event.id} />
                        </label>
                        <label className="text-xs font-medium text-slate-700">
                          Trigger
                          <select
                            className={inputClass}
                            onChange={(e) => updateEvent(event.id, { trigger: e.target.value as ConversionEvent['trigger'] })}
                            value={event.trigger}
                          >
                            <option value="form_submit">Form submit</option>
                            <option value="click">Click</option>
                            <option value="page_view">Page view</option>
                          </select>
                        </label>
                        {event.trigger === 'form_submit' ? (
                          <label className="text-xs font-medium text-slate-700">
                            Form type
                            <input
                              className={inputClass}
                              onChange={(e) => updateEvent(event.id, { formType: e.target.value })}
                              placeholder="consultation | subscribe | footer"
                              value={event.formType || ''}
                            />
                          </label>
                        ) : (
                          <label className="text-xs font-medium text-slate-700">
                            Match key
                            <input
                              className={inputClass}
                              onChange={(e) => updateEvent(event.id, { match: e.target.value })}
                              placeholder="whatsapp | phone"
                              value={event.match || ''}
                            />
                          </label>
                        )}
                        <label className="text-xs font-medium text-slate-700">
                          GA4 event name
                          <input
                            className={inputClass}
                            onChange={(e) => updateEvent(event.id, { ga4EventName: e.target.value })}
                            value={event.ga4EventName}
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-700">
                          GTM dataLayer event
                          <input
                            className={inputClass}
                            onChange={(e) => updateEvent(event.id, { gtmEventName: e.target.value })}
                            value={event.gtmEventName}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                          <input
                            checked={event.enabled}
                            className="h-4 w-4 accent-[#1f4d42]"
                            onChange={(e) => updateEvent(event.id, { enabled: e.target.checked })}
                            type="checkbox"
                          />
                          Enabled
                        </label>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => setConversions((current) => ({ events: current.events.filter((item) => item.id !== event.id) }))}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button className={primaryButton} disabled={saving} type="submit">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FilePenLine className="h-4 w-4" />}
              Save traffic settings
            </button>
          </form>
        )}
      </Card>
    </Page>
  )
}
