import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { Eye, FilePenLine, LoaderCircle, Search, X } from 'lucide-react'
import {
  ApiError,
  api,
  type ContentRecord,
  type ContentType,
  type ContentVideo,
  type EditorialStatus,
  type LocationDetails,
  type PageTemplate,
  type ProviderCredentials,
} from '../../api/client'
import {
  EDITORIAL_STATUS_LABELS,
  emptyAttribution,
  emptyCredentials,
  emptyLocationDetails,
  emptyMedicalReview,
  emptyReference,
  emptyVideo,
  isMedicalContentType,
  linesToList,
} from '../../api/client'
import { BodyBlocksEditor } from '../../components/BodyBlocksEditor'
import { RelatedContentPickers } from '../../components/RelatedContentPickers'
import { contentTypeLabels, emptyContent, inputClass, Notice, primaryButton, secondaryButton } from './shared'

export function ContentForm({
  initial,
  defaultType = 'PAGE',
  onClose,
  onSaved,
}: {
  initial?: ContentRecord
  defaultType?: ContentType
  onClose: () => void
  onSaved: (record: ContentRecord) => void
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLFormElement>(null)
  const [form, setForm] = useState<Omit<ContentRecord, 'id'>>(initial ? {
    type: initial.type,
    title: initial.title,
    description: initial.description,
    intro: initial.intro || '',
    slug: initial.slug,
    h1: initial.h1,
    image: initial.image || '',
    imageAlt: initial.imageAlt || '',
    imageWidth: initial.imageWidth || '',
    imageHeight: initial.imageHeight || '',
    imageFilename: initial.imageFilename || '',
    imageWebp: initial.imageWebp || '',
    imageAvif: initial.imageAvif || '',
    imageSrcSet: initial.imageSrcSet || '',
    imageSizes: initial.imageSizes || '',
    imageIsPrimary: initial.imageIsPrimary !== false,
    ogTitle: initial.ogTitle || '',
    ogDescription: initial.ogDescription || '',
    ogImage: initial.ogImage || '',
    template: initial.template || 'default',
    credentials: initial.credentials || emptyCredentials(),
    attribution: initial.attribution || emptyAttribution(),
    medicalReview: initial.medicalReview || emptyMedicalReview(),
    locationDetails: initial.locationDetails || emptyLocationDetails(),
    video: initial.video || emptyVideo(),
    references: initial.references || [],
    blocks: initial.blocks || [],
    relations: initial.relations || [],
    canonical: initial.canonical,
    robots: initial.robots,
    sitemapExcluded: initial.sitemapExcluded,
    schemaDisabled: initial.schemaDisabled,
    status: initial.status,
    revisions: initial.revisions || [],
    workflowEvents: initial.workflowEvents || [],
  } : emptyContent(defaultType))
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [error, setError] = useState('')
  const [uniquenessNote, setUniquenessNote] = useState('')
  const [checkingUniqueness, setCheckingUniqueness] = useState(false)
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

  const formatUniquenessError = (requestError: unknown) => {
    if (!(requestError instanceof ApiError)) {
      return requestError instanceof Error ? requestError.message : 'Unable to save content'
    }
    const details = requestError.errors as {
      reasons?: string[]
      matches?: Array<{ slug: string; score: number; placeNormalizedScore?: number }>
    } | undefined
    const parts = [requestError.message]
    if (details?.reasons?.length) {
      parts.push(...details.reasons.filter((reason) => reason !== requestError.message))
    }
    if (details?.matches?.length) {
      const top = details.matches
        .slice(0, 3)
        .map((match) => `/${match.slug} (${Math.round((match.placeNormalizedScore || match.score) * 100)}%)`)
        .join(', ')
      parts.push(`Closest matches: ${top}`)
    }
    return parts.join(' ')
  }

  const runUniquenessCheck = async () => {
    if (!initial?.id) {
      setUniquenessNote('Save a draft first, then run the uniqueness check before publishing.')
      return
    }
    setCheckingUniqueness(true)
    setUniquenessNote('')
    try {
      const { result, message } = await api.checkContentUniqueness(initial.id, form)
      if (result.ok) {
        setUniquenessNote(message || 'Content looks unique enough to index.')
        toast.success(message || 'Uniqueness check passed')
      } else {
        const detail = [
          ...(result.reasons || []),
          ...(result.matches || []).slice(0, 3).map((match) => `Similar to /${match.slug}`),
        ].join(' ')
        setUniquenessNote(detail || message)
        toast.error(message || 'Uniqueness check failed')
      }
    } catch (requestError) {
      const message = formatUniquenessError(requestError)
      setUniquenessNote(message)
      toast.error(message)
    } finally {
      setCheckingUniqueness(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = initial
        ? await api.updateContent(initial.id, form, initial.status)
        : await api.createContent(form)
      toast.success(initial ? 'Content updated successfully' : 'Content created successfully')
      onSaved(saved)
    } catch (requestError) {
      const message = formatUniquenessError(requestError)
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const doorwaySensitive = form.type === 'LOCATION' || form.type === 'SERVICE' || form.type === 'CONDITION'

  const openPreview = async () => {
    if (!initial?.id) {
      toast.info('Save the record first to preview the CMS draft.')
      return
    }
    setPreviewing(true)
    try {
      const { record } = await api.previewContent(initial.id)
      const blocks = (record.blocks || [])
        .map((block) => {
          if (block.type === 'heading') return `<h${block.level || 2}>${escapeHtml(block.text || '')}</h${block.level || 2}>`
          if (block.type === 'paragraph') return `<p>${escapeHtml(block.text || '')}</p>`
          if (block.type === 'list') return `<ul>${(block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
          return ''
        })
        .join('')
      setPreviewHtml(`
        <article style="font-family:system-ui,sans-serif;max-width:42rem;margin:0 auto;padding:1.5rem;line-height:1.55;color:#0b2a4a">
          <p style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#1aa6a0;font-weight:700">CMS preview · ${escapeHtml(record.status || 'draft')}</p>
          <h1 style="font-size:1.75rem;margin:.5rem 0 0.75rem">${escapeHtml(record.h1 || record.title)}</h1>
          <p style="color:#5a6b7a">${escapeHtml(record.description || record.intro || '')}</p>
          <hr style="border:none;border-top:1px solid #e2e8ee;margin:1.25rem 0" />
          <p style="font-size:12px;color:#667085"><strong>Title:</strong> ${escapeHtml(record.title)}<br/><strong>Slug:</strong> /${escapeHtml(record.slug)}<br/><strong>Robots:</strong> ${escapeHtml(record.robots || 'index,follow')}<br/><strong>Canonical:</strong> ${escapeHtml(record.canonical || '(self)')}</p>
          <div style="margin-top:1.25rem">${blocks || '<p style="color:#98a2b3">No body blocks yet.</p>'}</div>
        </article>
      `)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to load preview')
    } finally {
      setPreviewing(false)
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
              <h2 className="text-base font-semibold text-slate-900" id={titleId}>{initial ? `Edit ${contentTypeLabels[form.type]}` : `Create ${contentTypeLabels[form.type]}`}</h2>
              <p className="mt-1 text-xs text-slate-500" id={descriptionId}>Configure SEO title, description, slug, canonical, and robots in one place.</p>
            </div>
          </div>
          <button aria-label="Close form" className="rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" disabled={saving} onClick={onClose} type="button"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          {error && <div className="sm:col-span-2"><Notice message={error} /></div>}
          {doorwaySensitive && (
            <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Unique search intent</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                Do not publish near-identical location pages or service×location doorway variants.
                Each indexable URL needs its own purpose, H1, and substantial unique copy. Use noindex for drafts that are not ready.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
                  disabled={checkingUniqueness || saving}
                  onClick={() => void runUniquenessCheck()}
                  type="button"
                >
                  {checkingUniqueness ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  Check uniqueness
                </button>
                {uniquenessNote ? <span className="text-[11px] text-amber-900/80">{uniquenessNote}</span> : null}
              </div>
            </div>
          )}
          <div className="sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Page essentials</p>
            <p className="mt-1 text-xs text-slate-400">One H1 for the page template. SEO title is independent and used in search results.</p>
          </div>
          <label className="text-xs font-medium text-slate-700">
            Page H1
            <input className={inputClass} onChange={(event) => setField('h1', event.target.value)} placeholder="e.g. Personalized IVF Treatment in Dubai" required value={form.h1} />
            <span className="mt-1 block text-[10px] text-slate-400">Visible on-page heading. Exactly one H1 per page.</span>
          </label>
          <label className="text-xs font-medium text-slate-700">Slug<input className={inputClass} onChange={(event) => setField('slug', event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="ivf-treatment-dubai" required value={form.slug} /></label>
          <label className="text-xs font-medium text-slate-700">
            SEO title
            <input className={inputClass} maxLength={70} onChange={(event) => setField('title', event.target.value)} placeholder="e.g. IVF Treatment in Dubai | Orivon Health" required value={form.title} />
            <span className="mt-1 block text-[10px] text-slate-400">Document title / SERP title. Not the page H1.</span>
          </label>
          <label className="text-xs font-medium text-slate-700">
            Page template
            <select
              className={inputClass}
              onChange={(event) => setField('template', event.target.value as PageTemplate)}
              value={form.template}
            >
              <option value="default">Default</option>
              <option value="landing">Landing</option>
              <option value="guide">Guide</option>
              <option value="profile">Profile</option>
              <option value="location">Location</option>
              <option value="article">Article</option>
            </select>
            <span className="mt-1 block text-[10px] text-slate-400">Layout only—does not copy content from other pages.</span>
          </label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">Meta description<textarea className={`${inputClass} min-h-24 resize-y`} maxLength={170} onChange={(event) => setField('description', event.target.value)} placeholder="Summarize the page benefit and intent in one compelling sentence." required value={form.description} /><span className={`mt-1 block text-right text-[10px] ${form.description.length > 155 ? 'font-semibold text-amber-600' : 'text-slate-400'}`}>{form.description.length}/170</span></label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            Introductory content
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              onChange={(event) => setField('intro', event.target.value)}
              placeholder="Unique intro shown under the H1. Keep this distinct from other pages."
              required
              value={form.intro}
            />
          </label>
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Primary page image</p>
              <p className="mt-1 text-xs text-slate-400">
                Identifies the LCP/feature image. Store an independent alt, optional dimensions, WebP/AVIF URLs, and a descriptive filename.
                Unsplash URLs auto-build responsive srcset + WebP/AVIF where practical.
              </p>
            </div>
            <label className="block text-xs font-medium text-slate-700">
              Image URL
              <input className={inputClass} onChange={(event) => setField('image', event.target.value)} placeholder="https://…/doctor-licensing-dubai.webp" type="url" value={form.image} />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Image alt text
              <input className={inputClass} onChange={(event) => setField('imageAlt', event.target.value)} placeholder="Describe this specific image for accessibility and SEO" value={form.imageAlt} />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Descriptive filename (optional)
              <input className={inputClass} onChange={(event) => setField('imageFilename', event.target.value)} placeholder="doctor-licensing-guidance-dubai.jpg" value={form.imageFilename} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-700">
                Width (px)
                <input className={inputClass} onChange={(event) => setField('imageWidth', event.target.value)} inputMode="numeric" placeholder="1200" value={form.imageWidth} />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Height (px)
                <input className={inputClass} onChange={(event) => setField('imageHeight', event.target.value)} inputMode="numeric" placeholder="800" value={form.imageHeight} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-700">
                WebP URL (optional)
                <input className={inputClass} onChange={(event) => setField('imageWebp', event.target.value)} placeholder="https://…/image.webp" type="url" value={form.imageWebp} />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                AVIF URL (optional)
                <input className={inputClass} onChange={(event) => setField('imageAvif', event.target.value)} placeholder="https://…/image.avif" type="url" value={form.imageAvif} />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-700">
              Manual srcset (optional)
              <input className={inputClass} onChange={(event) => setField('imageSrcSet', event.target.value)} placeholder="url 480w, url 960w" value={form.imageSrcSet} />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Sizes attribute
              <input className={inputClass} onChange={(event) => setField('imageSizes', event.target.value)} placeholder="(max-width: 768px) 100vw, 640px" value={form.imageSizes} />
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
              <input
                checked={form.imageIsPrimary}
                className="mt-0.5 h-4 w-4 accent-[#1f4d42]"
                onChange={(event) => setField('imageIsPrimary', event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong className="block font-semibold text-slate-800">Primary / LCP image</strong>
                Eager-load this image (no lazy loading). Uncheck only if another above-the-fold image is the true LCP.
              </span>
            </label>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Open Graph</p>
              <p className="mt-1 text-xs text-slate-400">
                Editable social preview fields. Leave blank to fall back to SEO title, meta description, and the primary image.
              </p>
            </div>
            <label className="block text-xs font-medium text-slate-700">
              og:title
              <input className={inputClass} maxLength={70} onChange={(event) => setField('ogTitle', event.target.value)} placeholder="Defaults to SEO title" value={form.ogTitle} />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              og:description
              <textarea className={`${inputClass} min-h-20 resize-y`} maxLength={200} onChange={(event) => setField('ogDescription', event.target.value)} placeholder="Defaults to meta description" value={form.ogDescription} />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              og:image URL
              <input className={inputClass} onChange={(event) => setField('ogImage', event.target.value)} placeholder="Defaults to primary page image" type="url" value={form.ogImage} />
            </label>
          </div>

          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            Canonical URL
            <input className={inputClass} onChange={(event) => setField('canonical', event.target.value)} placeholder="Leave blank for self-referencing canonical" type="url" value={form.canonical} />
            <span className="mt-1 block text-[10px] text-slate-400">
              {form.canonical.trim()
                ? 'Manual override in use.'
                : `Self-referencing: https://orivon.ae/${form.slug || 'page-url'}`}
            </span>
          </label>

          <BodyBlocksEditor
            blocks={form.blocks || []}
            onChange={(blocks) => setForm((current) => ({ ...current, blocks }))}
          />

          <RelatedContentPickers
            excludeId={initial?.id}
            onChange={(relations) => setForm((current) => ({ ...current, relations }))}
            sourceType={form.type}
            value={form.relations || []}
          />

          {form.type === 'PROVIDER' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Doctor profile fields</p>
                <p className="mt-1 text-xs text-slate-400">
                  Structured specialization, qualifications, affiliations, biography, and expertise.
                  Use the link pickers above for services offered and practice locations.
                </p>
              </div>
              <label className="block text-xs font-medium text-slate-700">
                Display name
                <input
                  className={inputClass}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    credentials: { ...current.credentials, displayName: event.target.value },
                  }))}
                  value={form.credentials.displayName}
                />
              </label>
              {(
                [
                  ['specializations', 'Specializations', 'One specialization per line'],
                  ['qualifications', 'Qualifications', 'One qualification / degree per line'],
                  ['affiliations', 'Clinic / hospital affiliations', 'One affiliation per line'],
                  ['areasOfExpertise', 'Areas of expertise', 'One expertise area per line'],
                ] as Array<[keyof ProviderCredentials, string, string]>
              ).map(([key, label, hint]) => (
                <label className="block text-xs font-medium text-slate-700" key={key}>
                  {label}
                  <textarea
                    className={`${inputClass} min-h-20 resize-y`}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      credentials: {
                        ...current.credentials,
                        [key]: linesToList(event.target.value),
                      },
                    }))}
                    placeholder={hint}
                    value={(form.credentials[key] as string[]).join('\n')}
                  />
                  <span className="mt-1 block text-[10px] text-slate-400">{hint}</span>
                </label>
              ))}
              <label className="block text-xs font-medium text-slate-700">
                Doctor biography
                <textarea
                  className={`${inputClass} min-h-28 resize-y`}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    credentials: { ...current.credentials, biography: event.target.value },
                  }))}
                  placeholder="Unique biography for this doctor profile"
                  value={form.credentials.biography}
                />
              </label>
              {(
                [
                  ['licenses', 'Licenses / registrations'],
                  ['yearsExperience', 'Years of experience'],
                  ['languages', 'Languages'],
                ] as Array<[keyof ProviderCredentials, string]>
              ).map(([key, label]) => (
                <label className="block text-xs font-medium text-slate-700" key={key}>
                  {label}
                  <input
                    className={inputClass}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      credentials: { ...current.credentials, [key]: event.target.value },
                    }))}
                    value={String(form.credentials[key] || '')}
                  />
                </label>
              ))}
            </div>
          )}

          {form.type === 'ARTICLE' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Medical article author</p>
                <p className="mt-1 text-xs text-slate-400">Author attribution, biography, profile URL, and last genuinely updated date.</p>
              </div>
              <label className="block text-xs font-medium text-slate-700">
                Author name
                <input
                  className={inputClass}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    attribution: { ...current.attribution, authorName: event.target.value },
                  }))}
                  required
                  value={form.attribution.authorName}
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Author biography
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    attribution: { ...current.attribution, authorBio: event.target.value },
                  }))}
                  placeholder="Short author bio shown on the article"
                  value={form.attribution.authorBio}
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Author profile URL
                <input
                  className={inputClass}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    attribution: { ...current.attribution, authorProfileUrl: event.target.value },
                  }))}
                  placeholder="https://…"
                  type="url"
                  value={form.attribution.authorProfileUrl}
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Last genuinely updated
                <input
                  className={inputClass}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    attribution: { ...current.attribution, lastUpdatedAt: event.target.value },
                  }))}
                  type="date"
                  value={form.attribution.lastUpdatedAt}
                />
                <span className="mt-1 block text-[10px] text-slate-400">
                  Editorial date for dateModified / sitemap lastmod. Do not bump this just to appear fresh—only after substantive content changes.
                </span>
              </label>
            </div>
          )}

          {form.type === 'LOCATION' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Clinic / location details</p>
                <p className="mt-1 text-xs text-slate-400">
                  Shown on the page and used for MedicalClinic / MedicalOrganization structured data. Leave blank fields empty—do not invent an address.
                </p>
              </div>
              {(
                [
                  ['name', 'Clinic / location name'],
                  ['streetAddress', 'Street address'],
                  ['addressLocality', 'City / locality'],
                  ['addressRegion', 'Region / emirate'],
                  ['postalCode', 'Postal code'],
                  ['addressCountry', 'Country code (e.g. AE)'],
                  ['telephone', 'Telephone'],
                ] as Array<[keyof LocationDetails, string]>
              ).map(([key, label]) => (
                <label className="block text-xs font-medium text-slate-700" key={key}>
                  {label}
                  <input
                    className={inputClass}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      locationDetails: { ...current.locationDetails, [key]: event.target.value },
                    }))}
                    value={form.locationDetails[key]}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Video (optional)</p>
              <p className="mt-1 text-xs text-slate-400">
                Add VideoObject structured data only when a real video exists on this page. Requires a content URL or embed URL.
              </p>
            </div>
            {(
              [
                ['name', 'Video title', 'text'],
                ['description', 'Video description', 'text'],
                ['contentUrl', 'Video file URL', 'url'],
                ['embedUrl', 'Embed URL (YouTube/Vimeo iframe src)', 'url'],
                ['thumbnailUrl', 'Thumbnail URL', 'url'],
                ['uploadDate', 'Upload date', 'date'],
                ['duration', 'Duration (ISO-8601, e.g. PT2M30S)', 'text'],
              ] as Array<[keyof ContentVideo, string, string]>
            ).map(([key, label, inputType]) => (
              <label className="block text-xs font-medium text-slate-700" key={key}>
                {label}
                <input
                  className={inputClass}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    video: { ...current.video, [key]: event.target.value },
                  }))}
                  type={inputType}
                  value={form.video[key]}
                />
              </label>
            ))}
          </div>

          {isMedicalContentType(form.type) && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Medical review</p>
                <p className="mt-1 text-xs text-slate-400">
                  Record who medically reviewed this content and when. Required before publishing articles and conditions.
                  Review dates do not change dateModified or sitemap freshness.
                </p>
              </div>
              <label className="block text-xs font-medium text-slate-700">
                Medical reviewer name
                <input
                  className={inputClass}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    medicalReview: { ...current.medicalReview, reviewerName: event.target.value },
                  }))}
                  placeholder="Clinician who reviewed this page"
                  value={form.medicalReview.reviewerName}
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Reviewer credentials
                <input
                  className={inputClass}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    medicalReview: { ...current.medicalReview, reviewerCredentials: event.target.value },
                  }))}
                  placeholder="e.g. MD, DHA license, specialty"
                  value={form.medicalReview.reviewerCredentials}
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Medically reviewed on
                <input
                  className={inputClass}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    medicalReview: { ...current.medicalReview, reviewedAt: event.target.value },
                  }))}
                  type="date"
                  value={form.medicalReview.reviewedAt}
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Review statement
                <textarea
                  className={`${inputClass} min-h-20 resize-y`}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    medicalReview: { ...current.medicalReview, statement: event.target.value },
                  }))}
                  placeholder="Optional note shown with the medical review badge"
                  value={form.medicalReview.statement}
                />
              </label>
            </div>
          )}

          {isMedicalContentType(form.type) && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">References & citations</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Link only to authoritative primary or reputable sources you have verified. Sources are never auto-generated.
                  </p>
                </div>
                <button
                  className={secondaryButton}
                  onClick={() => setForm((current) => ({
                    ...current,
                    references: [...current.references, emptyReference()],
                  }))}
                  type="button"
                >
                  Add reference
                </button>
              </div>
              {form.references.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-400">
                  No citations added. Leave empty rather than inventing sources.
                </p>
              ) : (
                <ul className="space-y-3">
                  {form.references.map((reference, index) => (
                    <li className="rounded-lg border border-slate-100 bg-slate-50 p-3" key={`ref-${index}`}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Reference {index + 1}</p>
                        <button
                          className="text-[11px] text-red-500 hover:text-red-700"
                          onClick={() => setForm((current) => ({
                            ...current,
                            references: current.references.filter((_, row) => row !== index),
                          }))}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="block text-xs font-medium text-slate-700 sm:col-span-2">
                          Citation label
                          <input
                            className={inputClass}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              references: current.references.map((row, rowIndex) => (
                                rowIndex === index ? { ...row, label: event.target.value } : row
                              )),
                            }))}
                            placeholder="Title or short citation text"
                            value={reference.label}
                          />
                        </label>
                        <label className="block text-xs font-medium text-slate-700 sm:col-span-2">
                          Source URL
                          <input
                            className={inputClass}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              references: current.references.map((row, rowIndex) => (
                                rowIndex === index ? { ...row, url: event.target.value } : row
                              )),
                            }))}
                            placeholder="https://… (authoritative source)"
                            type="url"
                            value={reference.url}
                          />
                        </label>
                        <label className="block text-xs font-medium text-slate-700">
                          Publisher / source
                          <input
                            className={inputClass}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              references: current.references.map((row, rowIndex) => (
                                rowIndex === index ? { ...row, source: event.target.value } : row
                              )),
                            }))}
                            placeholder="Journal, ministry, guideline body"
                            value={reference.source}
                          />
                        </label>
                        <label className="block text-xs font-medium text-slate-700">
                          Accessed on
                          <input
                            className={inputClass}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              references: current.references.map((row, rowIndex) => (
                                rowIndex === index ? { ...row, accessedAt: event.target.value } : row
                              )),
                            }))}
                            type="date"
                            value={reference.accessedAt}
                          />
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(form.revisions?.length || form.workflowEvents?.length) ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Revision & workflow history</p>
                <p className="mt-1 text-xs text-slate-400">Saved snapshots and editorial / medical review transitions for this record.</p>
              </div>
              {form.workflowEvents && form.workflowEvents.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Workflow</p>
                  <ul className="space-y-1.5">
                    {form.workflowEvents.slice(0, 8).map((event) => (
                      <li className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600" key={event.id}>
                        <span className="font-semibold text-slate-800">{event.from || '—'} → {event.to}</span>
                        {event.userName ? <span className="text-slate-400"> · {event.userName}</span> : null}
                        <span className="text-slate-400"> · {new Date(event.createdAt).toLocaleString()}</span>
                        {event.note ? <p className="mt-1 text-slate-500">{event.note}</p> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {form.revisions && form.revisions.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Revisions</p>
                  <ul className="space-y-1.5">
                    {form.revisions.slice(0, 10).map((revision) => (
                      <li className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600" key={revision.id}>
                        <span className="font-semibold text-slate-800">#{revision.number}</span>
                        {revision.title ? <span> · {revision.title}</span> : null}
                        {revision.userName ? <span className="text-slate-400"> · {revision.userName}</span> : null}
                        <span className="text-slate-400"> · {new Date(revision.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 sm:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Search preview</p>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-600">Live preview</span>
            </div>
            <p className="truncate text-xs text-emerald-700">https://orivon.ae/{form.slug || 'page-url'}</p>
            <p className="mt-1 truncate text-lg font-medium text-[#1a0dab]">{form.title || 'Your SEO title will appear here'}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{form.description || 'Add a helpful meta description to show visitors what this page offers.'}</p>
            <p className="mt-3 text-[10px] text-slate-400">On-page H1: <span className="font-medium text-slate-600">{form.h1 || '—'}</span></p>
          </div>

          <div className="border-t border-slate-100 pt-5 sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Publishing controls</p>
          </div>
          <label className="text-xs font-medium text-slate-700">
            Robots directive
            <select
              className={inputClass}
              onChange={(event) => setField('robots', event.target.value)}
              value={form.robots}
            >
              <option value="index, follow">index, follow</option>
              <option value="noindex, follow">noindex, follow</option>
              <option value="index, nofollow">index, nofollow</option>
              <option value="noindex, nofollow">noindex, nofollow</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-700">
            Workflow status
            <select
              className={inputClass}
              onChange={(event) => setField('status', event.target.value as EditorialStatus)}
              value={form.status || 'draft'}
            >
              {(Object.keys(EDITORIAL_STATUS_LABELS) as EditorialStatus[])
                .filter((status) => isMedicalContentType(form.type) || status !== 'medical_review')
                .map((status) => (
                  <option key={status} value={status}>{EDITORIAL_STATUS_LABELS[status]}</option>
                ))}
            </select>
            <span className="mt-1 block text-[10px] text-slate-400">
              {isMedicalContentType(form.type)
                ? 'Draft → editorial review → medical review → publish.'
                : 'Draft → editorial review → publish.'}
            </span>
          </label>
          <label className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs transition ${form.sitemapExcluded ? 'border-amber-200 bg-amber-50/70 text-amber-800' : 'border-emerald-100 bg-emerald-50/40 text-slate-600'}`}><input checked={form.sitemapExcluded} className="mt-0.5 h-4 w-4 accent-[#1f4d42]" onChange={(event) => setField('sitemapExcluded', event.target.checked)} type="checkbox" /><span><strong className="block font-semibold text-slate-800">Exclude from sitemap</strong>Keep this URL out of generated XML sitemaps.</span></label>
          <label className={`flex items-start gap-3 rounded-xl border p-3.5 text-xs transition ${form.schemaDisabled ? 'border-rose-200 bg-rose-50/70 text-rose-800' : 'border-blue-100 bg-blue-50/40 text-slate-600'}`}><input checked={form.schemaDisabled} className="mt-0.5 h-4 w-4 accent-[#1f4d42]" onChange={(event) => setField('schemaDisabled', event.target.checked)} type="checkbox" /><span><strong className="block font-semibold text-slate-800">Disable schema</strong>Turn off all JSON-LD structured data for this page (Organization, article, physician, breadcrumbs, etc.).</span></label>
        </div>
        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200/80 bg-slate-50/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="hidden text-[11px] text-slate-400 sm:block">Press Esc to close</p>
          <div className="flex justify-end gap-2">
            {initial?.id ? (
              <button className={secondaryButton} disabled={saving || previewing} onClick={() => void openPreview()} type="button">
                {previewing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Preview
              </button>
            ) : null}
            <button className={secondaryButton} disabled={saving} onClick={onClose} type="button">Cancel</button>
            <button className={`${primaryButton} min-w-32`} disabled={saving} type="submit">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{initial ? 'Save changes' : 'Create record'}</button>
          </div>
        </div>
      </form>
      {previewHtml ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewHtml('') }}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Content preview</p>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50" onClick={() => setPreviewHtml('')} type="button"><X className="h-4 w-4" /></button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
