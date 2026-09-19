import type { ReactNode } from 'react'
import type { ContentRecord, ContentType } from '../../api/client'
import {
  emptyAttribution,
  emptyCredentials,
  emptyLocationDetails,
  emptyMedicalReview,
  emptyVideo,
} from '../../api/client'

export const emptyContent = (type: ContentType = 'PAGE'): Omit<ContentRecord, 'id'> => ({
  type,
  title: '',
  description: '',
  intro: '',
  slug: '',
  h1: '',
  image: '',
  imageAlt: '',
  imageWidth: '',
  imageHeight: '',
  imageFilename: '',
  imageWebp: '',
  imageAvif: '',
  imageSrcSet: '',
  imageSizes: '',
  imageIsPrimary: true,
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  template: type === 'PROVIDER' ? 'profile' : type === 'ARTICLE' ? 'article' : 'default',
  credentials: emptyCredentials(),
  attribution: emptyAttribution(),
  medicalReview: emptyMedicalReview(),
  locationDetails: emptyLocationDetails(),
  video: emptyVideo(),
  references: [],
  blocks: [],
  relations: [],
  canonical: '',
  robots: 'index, follow',
  sitemapExcluded: false,
  schemaDisabled: false,
  status: 'draft',
})

export const contentTypeLabels: Record<ContentType, string> = {
  PAGE: 'Page',
  SERVICE: 'Service',
  CONDITION: 'Condition',
  PROVIDER: 'Doctor',
  LOCATION: 'Location',
  ARTICLE: 'Article',
  FAQ: 'FAQ',
}

export const contentTypePlurals: Record<ContentType, string> = {
  PAGE: 'Pages',
  SERVICE: 'Services',
  CONDITION: 'Conditions',
  PROVIDER: 'Doctors',
  LOCATION: 'Locations',
  ARTICLE: 'Blog / Articles',
  FAQ: 'FAQs',
}

export const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-100'
export const inputErrorClass = 'mt-1.5 w-full rounded-lg border border-red-400 bg-red-50/40 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-3 focus:ring-red-100'
export const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60'
export const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50'

export function fieldInputClass(invalid?: boolean, extra = '') {
  return `${invalid ? inputErrorClass : inputClass}${extra ? ` ${extra}` : ''}`
}

export function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <span className="mt-1.5 block text-[11px] font-normal text-red-600" id={id}>
      {message}
    </span>
  )
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const TOTP_PATTERN = /^\d{6}$/
export const PATH_PATTERN = /^\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/

export function isHttpUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return true
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isPathOrUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return PATH_PATTERN.test(trimmed)
  return isHttpUrl(trimmed)
}

export function Page({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
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

export function Notice({ message, tone = 'error' }: { message: string; tone?: 'error' | 'success' }) {
  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-xs ${tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
      {message}
    </div>
  )
}
