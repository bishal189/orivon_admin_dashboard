export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '')

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  meta?: Record<string, unknown>
  errors?: unknown
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'VIEWER'
  totpEnabled?: boolean
}

interface ServerContent {
  id: string
  type?: 'PAGE' | 'ARTICLE' | 'SERVICE' | 'CONDITION' | 'PROVIDER' | 'LOCATION' | 'FAQ'
  title: string
  slug: string
  excerpt?: string | null
  body?: { blocks?: ContentBlock[] } | null
  status: 'DRAFT' | 'IN_REVIEW' | 'MEDICAL_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
  updatedAt: string
  contentChangedAt?: string
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
    canonicalUrl?: string | null
    robots: string
    excludeFromSitemap: boolean
    ogTitle?: string | null
    ogDescription?: string | null
    ogImageUrl?: string | null
  } | null
  subtype?: {
    key: string
    data: {
      h1?: string
      schemaDisabled?: boolean
      image?: string
      imageAlt?: string
      imageWidth?: number | null
      imageHeight?: number | null
      imageFilename?: string
      imageWebp?: string
      imageAvif?: string
      imageSrcSet?: string
      imageSizes?: string
      imageIsPrimary?: boolean
      ogImage?: string
      template?: string
      items?: string[]
      credentials?: Partial<ProviderCredentials>
      attribution?: Partial<ArticleAttribution>
      medicalReview?: Partial<MedicalReview>
      locationDetails?: Partial<LocationDetails>
      video?: Partial<ContentVideo>
    }
  } | null
  references?: Array<{
    id?: string
    label: string
    url: string
    source?: string | null
    accessedAt?: string | null
  }>
  revisions?: Array<{
    id: string
    number: number
    createdAt: string
    snapshot?: Record<string, unknown>
    user?: { id: string; name: string; email: string } | null
  }>
  workflowEvents?: Array<{
    id: string
    from?: string | null
    to: string
    note?: string | null
    createdAt: string
    user?: { id: string; name: string; email: string } | null
  }>
  sourceRelations?: Array<{
    type: string
    order: number
    targetId: string
    anchor?: string | null
    target?: {
      id: string
      title: string
      slug: string
      type: ContentType
      excerpt?: string | null
    } | null
  }>
}

export type ContentType = 'PAGE' | 'ARTICLE' | 'SERVICE' | 'CONDITION' | 'PROVIDER' | 'LOCATION' | 'FAQ'

export type PageTemplate = 'default' | 'landing' | 'guide' | 'profile' | 'location' | 'article'

export type RelationKind =
  | 'related-service'
  | 'related-condition'
  | 'related-provider'
  | 'related-article'
  | 'related-location'
  | 'related-faq'

export const RELATION_KIND_META: Array<{
  kind: RelationKind
  label: string
  targetType: ContentType
  hint: string
}> = [
  { kind: 'related-service', label: 'Relevant services offered', targetType: 'SERVICE', hint: 'Treatments/services this doctor offers, or commercial pages this article should link to.' },
  { kind: 'related-condition', label: 'Related conditions', targetType: 'CONDITION', hint: 'Connect condition guides to this page.' },
  { kind: 'related-provider', label: 'Related doctors', targetType: 'PROVIDER', hint: 'Link doctors from treatment / service pages.' },
  { kind: 'related-article', label: 'Related articles', targetType: 'ARTICLE', hint: 'Supporting editorial content.' },
  { kind: 'related-location', label: 'Practice locations', targetType: 'LOCATION', hint: 'Clinic / city pages where this doctor practices.' },
  { kind: 'related-faq', label: 'Related FAQs', targetType: 'FAQ', hint: 'Shown as an on-page FAQ accordion.' },
]

export type ProviderCredentials = {
  displayName: string
  /** Structured specializations (one concept per entry). */
  specializations: string[]
  /** Structured qualifications / degrees. */
  qualifications: string[]
  /** Clinic / hospital affiliations. */
  affiliations: string[]
  /** Areas of clinical expertise. */
  areasOfExpertise: string[]
  biography: string
  licenses: string
  yearsExperience: string
  languages: string
}

export const emptyCredentials = (): ProviderCredentials => ({
  displayName: '',
  specializations: [],
  qualifications: [],
  affiliations: [],
  areasOfExpertise: [],
  biography: '',
  licenses: '',
  yearsExperience: '',
  languages: '',
})

export type ArticleAttribution = {
  authorName: string
  authorBio: string
  authorProfileUrl: string
  /** Editorial "last genuinely updated" date (YYYY-MM-DD). */
  lastUpdatedAt: string
}

export const emptyAttribution = (): ArticleAttribution => ({
  authorName: '',
  authorBio: '',
  authorProfileUrl: '',
  lastUpdatedAt: '',
})

export type LocationDetails = {
  name: string
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  addressCountry: string
  telephone: string
}

export const emptyLocationDetails = (): LocationDetails => ({
  name: '',
  streetAddress: '',
  addressLocality: '',
  addressRegion: '',
  postalCode: '',
  addressCountry: '',
  telephone: '',
})

export function normalizeLocationDetails(raw?: Partial<LocationDetails> | null): LocationDetails {
  return {
    ...emptyLocationDetails(),
    name: String(raw?.name || ''),
    streetAddress: String(raw?.streetAddress || ''),
    addressLocality: String(raw?.addressLocality || ''),
    addressRegion: String(raw?.addressRegion || ''),
    postalCode: String(raw?.postalCode || ''),
    addressCountry: String(raw?.addressCountry || ''),
    telephone: String(raw?.telephone || ''),
  }
}

export type ContentVideo = {
  name: string
  description: string
  contentUrl: string
  embedUrl: string
  thumbnailUrl: string
  uploadDate: string
  duration: string
}

export const emptyVideo = (): ContentVideo => ({
  name: '',
  description: '',
  contentUrl: '',
  embedUrl: '',
  thumbnailUrl: '',
  uploadDate: '',
  duration: '',
})

export function normalizeVideo(raw?: Partial<ContentVideo> | null): ContentVideo {
  return {
    ...emptyVideo(),
    name: String(raw?.name || ''),
    description: String(raw?.description || ''),
    contentUrl: String(raw?.contentUrl || '').trim(),
    embedUrl: String(raw?.embedUrl || '').trim(),
    thumbnailUrl: String(raw?.thumbnailUrl || '').trim(),
    uploadDate: String(raw?.uploadDate || '').slice(0, 10),
    duration: String(raw?.duration || ''),
  }
}

export function hasVideoContent(video?: Partial<ContentVideo> | null) {
  return Boolean(String(video?.contentUrl || '').trim() || String(video?.embedUrl || '').trim())
}

export type MedicalReview = {
  reviewerName: string
  reviewerCredentials: string
  /** YYYY-MM-DD when a clinician last medically reviewed the content. */
  reviewedAt: string
  statement: string
}

export const emptyMedicalReview = (): MedicalReview => ({
  reviewerName: '',
  reviewerCredentials: '',
  reviewedAt: '',
  statement: '',
})

export function normalizeMedicalReview(raw?: Partial<MedicalReview> | null): MedicalReview {
  return {
    ...emptyMedicalReview(),
    reviewerName: String(raw?.reviewerName || ''),
    reviewerCredentials: String(raw?.reviewerCredentials || ''),
    reviewedAt: String(raw?.reviewedAt || '').slice(0, 10),
    statement: String(raw?.statement || ''),
  }
}

export type ContentReference = {
  id?: string
  label: string
  url: string
  source: string
  accessedAt: string
}

export const emptyReference = (): ContentReference => ({
  label: '',
  url: '',
  source: '',
  accessedAt: '',
})

export function normalizeReferences(raw?: Array<Partial<ContentReference>> | null): ContentReference[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => ({
      id: entry?.id,
      label: String(entry?.label || '').trim(),
      url: String(entry?.url || '').trim(),
      source: String(entry?.source || '').trim(),
      accessedAt: String(entry?.accessedAt || '').slice(0, 10),
    }))
    .filter((entry) => entry.label && entry.url)
}

export type EditorialStatus = 'draft' | 'editorial_review' | 'medical_review' | 'published'

export const EDITORIAL_STATUS_LABELS: Record<EditorialStatus, string> = {
  draft: 'Draft',
  editorial_review: 'Editorial review',
  medical_review: 'Medical review',
  published: 'Published',
}

export function mapServerStatus(status: ServerContent['status'] | string | undefined): EditorialStatus {
  switch (status) {
    case 'PUBLISHED':
    case 'SCHEDULED':
    case 'published':
      return 'published'
    case 'IN_REVIEW':
    case 'editorial_review':
      return 'editorial_review'
    case 'MEDICAL_REVIEW':
    case 'medical_review':
      return 'medical_review'
    default:
      return 'draft'
  }
}

export function isMedicalContentType(type: ContentType | undefined) {
  return type === 'ARTICLE' || type === 'CONDITION'
}

/** Normalize legacy string fields or arrays into clean string lists. */
export function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/\n|;/).map((item) => item.trim()).filter(Boolean)
  }
  return []
}

export function linesToList(text: string): string[] {
  return String(text || '').split('\n').map((item) => item.trim()).filter(Boolean)
}

export function normalizeCredentials(raw?: Partial<ProviderCredentials> | null): ProviderCredentials {
  const base = emptyCredentials()
  if (!raw) return base
  const legacy = raw as Partial<ProviderCredentials> & { specialty?: string }
  return {
    displayName: String(raw.displayName || ''),
    specializations: asStringList(
      raw.specializations?.length ? raw.specializations : legacy.specialty,
    ),
    qualifications: asStringList(raw.qualifications),
    affiliations: asStringList(raw.affiliations),
    areasOfExpertise: asStringList(raw.areasOfExpertise),
    biography: String(raw.biography || ''),
    licenses: String(raw.licenses || ''),
    yearsExperience: String(raw.yearsExperience || ''),
    languages: String(raw.languages || ''),
  }
}

export function normalizeAttribution(raw?: Partial<ArticleAttribution> | null): ArticleAttribution {
  return {
    ...emptyAttribution(),
    ...raw,
    authorName: String(raw?.authorName || ''),
    authorBio: String(raw?.authorBio || ''),
    authorProfileUrl: String(raw?.authorProfileUrl || ''),
    lastUpdatedAt: String(raw?.lastUpdatedAt || '').slice(0, 10),
  }
}

export type ContentBlock =
  | { id: string; type: 'heading'; level: 2 | 3 | 4; text: string }
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'list'; items: string[] }
  | {
      id: string
      type: 'image'
      url: string
      alt: string
      width?: number
      height?: number
      filename?: string
      webpUrl?: string
      avifUrl?: string
      srcSet?: string
      sizes?: string
      isPrimary?: boolean
    }

function sanitizeBlocks(blocks: ContentBlock[] = []): ContentBlock[] {
  return blocks
    .map((block): ContentBlock | null => {
      if (block.type === 'list') {
        return {
          ...block,
          items: (block.items || []).map((item) => item.trim()).filter(Boolean),
        }
      }
      if (block.type === 'heading' || block.type === 'paragraph') {
        return { ...block, text: block.text.trim() }
      }
      if (block.type === 'image') {
        const url = String(block.url || '').trim()
        const alt = String(block.alt || '').trim()
        if (!url || !alt) return null
        return {
          ...block,
          url,
          alt,
          filename: String(block.filename || '').trim() || undefined,
          webpUrl: String(block.webpUrl || '').trim() || undefined,
          avifUrl: String(block.avifUrl || '').trim() || undefined,
          srcSet: String(block.srcSet || '').trim() || undefined,
          sizes: String(block.sizes || '').trim() || undefined,
          width: Number(block.width) > 0 ? Number(block.width) : undefined,
          height: Number(block.height) > 0 ? Number(block.height) : undefined,
          isPrimary: Boolean(block.isPrimary),
        }
      }
      return block
    })
    .filter((block): block is ContentBlock => block != null)
}

export interface ContentRelationRef {
  targetId: string
  type: RelationKind
  order: number
  anchor?: string
  label?: string
  slug?: string
  targetType?: ContentType
}

export interface ContentRevisionSummary {
  id: string
  number: number
  createdAt: string
  title?: string
  userName?: string
}

export interface ContentWorkflowEventSummary {
  id: string
  from?: string | null
  to: string
  note?: string | null
  createdAt: string
  userName?: string
}

export interface ContentRecord {
  id: string
  type: ContentType
  title: string
  description: string
  intro: string
  slug: string
  h1: string
  image: string
  imageAlt: string
  imageWidth: string
  imageHeight: string
  imageFilename: string
  imageWebp: string
  imageAvif: string
  imageSrcSet: string
  imageSizes: string
  imageIsPrimary: boolean
  ogTitle: string
  ogDescription: string
  ogImage: string
  template: PageTemplate
  credentials: ProviderCredentials
  attribution: ArticleAttribution
  medicalReview: MedicalReview
  locationDetails: LocationDetails
  video: ContentVideo
  references: ContentReference[]
  blocks: ContentBlock[]
  relations: ContentRelationRef[]
  canonical: string
  robots: string
  sitemapExcluded: boolean
  schemaDisabled: boolean
  status?: EditorialStatus
  updatedAt?: string
  contentChangedAt?: string
  revisions?: ContentRevisionSummary[]
  workflowEvents?: ContentWorkflowEventSummary[]
}

function toRelations(item: ServerContent): ContentRelationRef[] {
  return (item.sourceRelations || [])
    .filter((relation) => RELATION_KIND_META.some((meta) => meta.kind === relation.type))
    .map((relation, index) => ({
      targetId: relation.targetId,
      type: relation.type as RelationKind,
      order: relation.order ?? index,
      anchor: relation.anchor || '',
      label: relation.target?.title,
      slug: relation.target?.slug,
      targetType: relation.target?.type,
    }))
    .sort((a, b) => a.order - b.order)
}

function toContent(item: ServerContent): ContentRecord {
  const robots = (item.seo?.robots || 'index,follow').replace(/\s+/g, '')
  const blocks = Array.isArray(item.body?.blocks)
    ? item.body.blocks.filter((block): block is ContentBlock => (
      Boolean(
        block?.id && (
          block.type === 'heading'
          || block.type === 'paragraph'
          || block.type === 'list'
          || block.type === 'image'
        ),
      )
    ))
    : []
  const template = (item.subtype?.data?.template || 'default') as PageTemplate
  return {
    id: item.id,
    type: item.type || 'PAGE',
    title: item.seo?.metaTitle || item.title,
    description: item.seo?.metaDescription || '',
    intro: item.excerpt || '',
    slug: item.slug,
    h1: item.subtype?.data?.h1 || item.title,
    image: item.subtype?.data?.image || '',
    imageAlt: item.subtype?.data?.imageAlt || '',
    imageWidth: item.subtype?.data?.imageWidth != null ? String(item.subtype.data.imageWidth) : '',
    imageHeight: item.subtype?.data?.imageHeight != null ? String(item.subtype.data.imageHeight) : '',
    imageFilename: item.subtype?.data?.imageFilename || '',
    imageWebp: item.subtype?.data?.imageWebp || '',
    imageAvif: item.subtype?.data?.imageAvif || '',
    imageSrcSet: item.subtype?.data?.imageSrcSet || '',
    imageSizes: item.subtype?.data?.imageSizes || '',
    imageIsPrimary: item.subtype?.data?.imageIsPrimary !== false,
    ogTitle: item.seo?.ogTitle || '',
    ogDescription: item.seo?.ogDescription || '',
    ogImage: item.seo?.ogImageUrl || item.subtype?.data?.ogImage || '',
    template: ['default', 'landing', 'guide', 'profile', 'location', 'article'].includes(template)
      ? template
      : 'default',
    credentials: normalizeCredentials(item.subtype?.data?.credentials),
    attribution: normalizeAttribution(item.subtype?.data?.attribution),
    medicalReview: normalizeMedicalReview(item.subtype?.data?.medicalReview),
    locationDetails: normalizeLocationDetails(item.subtype?.data?.locationDetails),
    video: normalizeVideo(item.subtype?.data?.video),
    references: normalizeReferences(item.references),
    blocks,
    relations: toRelations(item),
    canonical: item.seo?.canonicalUrl || '',
    robots: robots.replace(',', ', '),
    sitemapExcluded: item.seo?.excludeFromSitemap ?? false,
    schemaDisabled: item.subtype?.data?.schemaDisabled ?? false,
    status: mapServerStatus(item.status),
    updatedAt: item.updatedAt,
    contentChangedAt: item.contentChangedAt,
    revisions: (item.revisions || []).map((revision) => ({
      id: revision.id,
      number: revision.number,
      createdAt: revision.createdAt,
      title: typeof revision.snapshot?.title === 'string' ? revision.snapshot.title : undefined,
      userName: revision.user?.name || revision.user?.email || undefined,
    })),
    workflowEvents: (item.workflowEvents || []).map((event) => ({
      id: event.id,
      from: event.from,
      to: event.to,
      note: event.note,
      createdAt: event.createdAt,
      userName: event.user?.name || event.user?.email || undefined,
    })),
  }
}

function subtypePayload(record: Omit<ContentRecord, 'id'>) {
  const data: Record<string, unknown> = {
    h1: record.h1,
    schemaDisabled: record.schemaDisabled,
    image: record.image.trim(),
    imageAlt: record.imageAlt.trim(),
    imageWidth: Number(record.imageWidth) > 0 ? Number(record.imageWidth) : null,
    imageHeight: Number(record.imageHeight) > 0 ? Number(record.imageHeight) : null,
    imageFilename: record.imageFilename.trim(),
    imageWebp: record.imageWebp.trim(),
    imageAvif: record.imageAvif.trim(),
    imageSrcSet: record.imageSrcSet.trim(),
    imageSizes: record.imageSizes.trim(),
    imageIsPrimary: record.imageIsPrimary,
    template: record.template,
  }
  if (record.type === 'PROVIDER') {
    data.credentials = normalizeCredentials(record.credentials)
  }
  if (record.type === 'ARTICLE') {
    data.attribution = normalizeAttribution(record.attribution)
  }
  if (record.type === 'LOCATION') {
    data.locationDetails = normalizeLocationDetails(record.locationDetails)
  }
  if (isMedicalContentType(record.type)) {
    data.medicalReview = normalizeMedicalReview(record.medicalReview)
  }
  const video = normalizeVideo(record.video)
  if (hasVideoContent(video)) {
    data.video = video
  } else {
    data.video = null
  }
  return {
    key: record.template === 'default' ? record.type.toLowerCase() : record.template,
    data,
  }
}

function contentWriteBody(record: Omit<ContentRecord, 'id'>) {
  return {
    type: record.type,
    title: record.h1 || record.title,
    slug: record.slug,
    excerpt: record.intro,
    body: { blocks: sanitizeBlocks(record.blocks) },
    subtype: subtypePayload(record),
    seo: {
      metaTitle: record.title,
      metaDescription: record.description,
      canonicalUrl: record.canonical || null,
      robots: record.robots.replace(/\s/g, ''),
      excludeFromSitemap: record.sitemapExcluded,
      ogTitle: record.ogTitle.trim() || null,
      ogDescription: record.ogDescription.trim() || null,
      ogImageUrl: record.ogImage.trim() || null,
    },
  }
}

export interface SitemapBucket {
  key: string
  label: string
  types: ContentType[]
  entries: number
  url: string
  lastGeneratedAt?: string | null
}

export interface SitemapOverview {
  indexUrl: string
  totalEntries: number
  sitemaps: SitemapBucket[]
}

export interface RobotsTxtConfig {
  body: string
  isDefault: boolean
  publicUrl: string
}

export interface UrlPolicy {
  forceHttps: boolean
  enforcePreferredHost: boolean
  lowercasePaths: boolean
  trailingSlash: 'strip' | 'add'
  stripQueryParams: boolean
  allowedQueryParams: string[]
  indexSearch: boolean
  indexTags: boolean
  indexCategories: boolean
  indexAuthorArchives: boolean
  indexDateArchives: boolean
  indexThinArchives: boolean
  preferredHost?: string | null
  preferredOrigin?: string | null
}

export interface SiteVerifications {
  googleSiteVerification: string
  bingSiteVerification: string
}

export interface AnalyticsTracking {
  gtmContainerId: string
  ga4MeasurementId: string
}

export interface ConversionEvent {
  id: string
  trigger: 'form_submit' | 'click' | 'page_view'
  formType?: string
  match?: string
  selector?: string
  ga4EventName: string
  gtmEventName: string
  enabled: boolean
}

export interface AnalyticsConversions {
  events: ConversionEvent[]
}

export interface HreflangLocale {
  hreflang: string
  pathPrefix: string
  label: string
}

export interface HreflangSettings {
  enabled: boolean
  defaultLocale: string
  xDefault: boolean
  locales: HreflangLocale[]
}

export interface RedirectRecord {
  id: string
  from: string
  to: string
  statusCode: 301 | 302
  enabled: boolean
  hits?: number
}

interface ServerRedirect {
  id: string
  source: string
  target: string
  status: 301 | 302
  enabled: boolean
  hits?: number
}

export interface IndexingStatus {
  indexed: number
  discovered: number
  blocked: number
  lastSubmittedAt?: string
  available?: boolean
}

export interface NotFoundRecord {
  id: string
  path: string
  hits: number
  referrer?: string | null
  userAgent?: string | null
  firstSeenAt: string
  lastSeenAt: string
  resolvedAt?: string | null
}

export type {
  AppointmentInput,
  AppointmentRecord,
  AppointmentStats,
  AppointmentStatus,
  AppointmentStatusFilter,
} from '../types/appointments'

import type {
  AppointmentInput,
  AppointmentRecord,
  AppointmentStats,
  AppointmentStatus,
} from '../types/appointments'

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export class ApiError extends Error {
  readonly status: number
  readonly errors?: unknown

  constructor(message: string, status: number, errors?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

class ApiClient {
  private readonly baseUrl: string
  private accessToken: string | null = null
  private refreshPromise: Promise<string | null> | null = null
  private unauthorizedHandler: (() => void) | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {},
    retry = true,
  ): Promise<ApiEnvelope<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })

    if (response.status === 401 && retry && path !== '/auth/login' && path !== '/auth/refresh') {
      const token = await this.refreshAccessToken()
      if (token) return this.request<T>(path, options, false)
      this.unauthorizedHandler?.()
    }

    const body = await response.json().catch(() => null) as ApiEnvelope<T> | null
    if (!response.ok) {
      throw new ApiError(body?.message || `Request failed (${response.status})`, response.status, body?.errors)
    }

    if (!body?.success) throw new ApiError(body?.message || 'Invalid API response', response.status, body?.errors)
    return body
  }

  setUnauthorizedHandler(handler: (() => void) | null) {
    this.unauthorizedHandler = handler
  }

  private refreshAccessToken() {
    if (!this.refreshPromise) {
      this.refreshPromise = this.request<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
      }, false)
        .then(({ data }) => {
          this.accessToken = data.accessToken
          return this.accessToken
        })
        .catch(() => {
          this.accessToken = null
          return null
        })
        .finally(() => {
          this.refreshPromise = null
        })
    }
    return this.refreshPromise
  }

  async login(email: string, password: string, totp?: string) {
    const { data, message } = await this.request<{ accessToken: string; user: AuthUser }>(
      '/auth/login',
      { method: 'POST', body: { email, password, ...(totp ? { totp } : {}) } },
      false,
    )
    this.accessToken = data.accessToken
    return { user: data.user, message }
  }

  async restoreSession() {
    const token = await this.refreshAccessToken()
    if (!token) return null
    return this.getMe()
  }

  async getMe() {
    const { data } = await this.request<AuthUser>('/auth/me')
    return data
  }

  async updateProfile(input: { name?: string; email?: string; currentPassword?: string }) {
    const { data, message } = await this.request<AuthUser>('/auth/profile', {
      method: 'PATCH',
      body: input,
    })
    return { user: data, message }
  }

  async changePassword(input: { currentPassword: string; newPassword: string }) {
    const { data, message } = await this.request<{ accessToken: string }>('/auth/change-password', {
      method: 'POST',
      body: input,
    })
    this.accessToken = data.accessToken
    return message
  }

  async logout() {
    try {
      const { message } = await this.request<null>('/auth/logout', { method: 'POST' }, false)
      return message
    } finally {
      this.accessToken = null
    }
  }

  async getContent({
    page = 1,
    pageSize = 10,
    query = '',
    type,
    sortBy = 'updatedAt',
    sortDirection = 'desc',
  }: {
    page?: number
    pageSize?: number
    query?: string
    type?: ContentType
    sortBy?: 'title' | 'status' | 'updatedAt'
    sortDirection?: 'asc' | 'desc'
  } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortDirection,
    })
    if (query.trim()) params.set('q', query.trim())
    if (type) params.set('type', type)

    const { data, meta } = await this.request<ServerContent[]>(`/contents?${params.toString()}`)
    return {
      records: data.map(toContent),
      pagination: {
        page: Number(meta?.page) || page,
        pageSize: Number(meta?.pageSize) || pageSize,
        total: Number(meta?.total) || 0,
        pages: Math.max(1, Number(meta?.pages) || 1),
      },
    }
  }

  async createContent(record: Omit<ContentRecord, 'id'>) {
    const { data } = await this.request<ServerContent>('/contents', {
      method: 'POST',
      body: contentWriteBody(record),
    })
    await this.saveContentRelations(data.id, record.relations || [])
    await this.saveContentReferences(data.id, record.references || [])
    if (record.status && record.status !== 'draft') {
      await this.syncContentStatus(data.id, 'draft', record.status, record.type)
    }
    const refreshed = await this.request<ServerContent>(`/contents/${encodeURIComponent(data.id)}`)
    return toContent(refreshed.data)
  }

  async updateContent(id: string, record: Omit<ContentRecord, 'id'>, previousStatus?: ContentRecord['status']) {
    const { data } = await this.request<ServerContent>(`/contents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: contentWriteBody(record),
    })
    await this.saveContentRelations(id, record.relations || [])
    await this.saveContentReferences(id, record.references || [])
    await this.syncContentStatus(id, previousStatus || mapServerStatus(data.status), record.status, record.type)
    const refreshed = await this.request<ServerContent>(`/contents/${encodeURIComponent(id)}`)
    return toContent(refreshed.data)
  }

  async getContentById(id: string) {
    const { data } = await this.request<ServerContent>(`/contents/${encodeURIComponent(id)}`)
    return toContent(data)
  }

  async saveContentRelations(id: string, relations: ContentRelationRef[]) {
    await this.request(`/contents/${encodeURIComponent(id)}/relations`, {
      method: 'PUT',
      body: relations.map((relation, order) => ({
        targetId: relation.targetId,
        type: relation.type,
        order,
        anchor: relation.anchor?.trim() || null,
      })),
    })
  }

  async saveContentReferences(id: string, references: ContentReference[]) {
    const payload = normalizeReferences(references).map((entry) => ({
      label: entry.label,
      url: entry.url,
      source: entry.source || undefined,
      accessedAt: entry.accessedAt || undefined,
    }))
    await this.request(`/contents/${encodeURIComponent(id)}/references`, {
      method: 'PUT',
      body: payload,
    })
  }

  async deleteContent(id: string) {
    const { message } = await this.request<null>(`/contents/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return message
  }

  async transitionContent(id: string, status: 'DRAFT' | 'IN_REVIEW' | 'MEDICAL_REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED') {
    const { data, message } = await this.request<ServerContent>(
      `/contents/${encodeURIComponent(id)}/workflow`,
      { method: 'POST', body: { status } },
    )
    return { record: toContent(data), message }
  }

  async checkContentUniqueness(id: string, draft?: Partial<{
    title: string
    slug: string
    description: string
    intro: string
    h1: string
    blocks: ContentBlock[]
    robots: string
    type: ContentType
  }>) {
    const body = draft
      ? {
          title: draft.title,
          slug: draft.slug,
          excerpt: draft.intro || draft.description,
          type: draft.type,
          body: { blocks: draft.blocks || [] },
          seo: { robots: (draft.robots || 'index,follow').replace(/\s/g, ''), metaDescription: draft.description },
          subtype: { key: (draft.type || 'PAGE').toLowerCase(), data: { h1: draft.h1 } },
        }
      : {}
    const { data, message } = await this.request<{
      ok: boolean
      skipped?: boolean
      reasons: string[]
      matches: Array<{
        id: string
        slug: string
        type: string
        score: number
        placeNormalizedScore: number
        intentScore: number
      }>
    }>(`/contents/${encodeURIComponent(id)}/uniqueness-check`, {
      method: 'POST',
      body,
    })
    return { result: data, message }
  }

  async syncContentStatus(
    id: string,
    current: string | undefined,
    next: EditorialStatus | undefined,
    type?: ContentType,
  ) {
    if (!next) return null
    const from = mapServerStatus(current)
    const to = mapServerStatus(next)
    if (from === to) return null

    const medical = isMedicalContentType(type)
    const pathFor = (target: EditorialStatus): Array<'DRAFT' | 'IN_REVIEW' | 'MEDICAL_REVIEW' | 'PUBLISHED'> => {
      if (target === 'draft') return ['DRAFT']
      if (target === 'editorial_review') return ['IN_REVIEW']
      if (target === 'medical_review') return medical ? ['IN_REVIEW', 'MEDICAL_REVIEW'] : ['IN_REVIEW']
      if (medical) return ['IN_REVIEW', 'MEDICAL_REVIEW', 'PUBLISHED']
      return ['IN_REVIEW', 'PUBLISHED']
    }

    if (to === 'draft') {
      return this.transitionContent(id, 'DRAFT')
    }

    // Unpublish / move backward into an earlier queue stage.
    if (from === 'published' && to !== 'published') {
      await this.transitionContent(id, 'DRAFT')
    }

    const steps = pathFor(to)
    let last = null
    for (const step of steps) {
      try {
        last = await this.transitionContent(id, step)
      } catch (error) {
        // Skip steps that are invalid from the current server state (already past them).
        if (!(error instanceof ApiError) || error.status !== 422) throw error
      }
    }
    return last
  }

  async getRedirects() {
    const { data } = await this.request<ServerRedirect[]>('/redirects')
    return data.map((item) => ({
      id: item.id,
      from: item.source,
      to: item.target,
      statusCode: item.status,
      enabled: item.enabled,
      hits: item.hits ?? 0,
    }))
  }

  async createRedirect(record: Omit<RedirectRecord, 'id' | 'hits'>) {
    const { data } = await this.request<ServerRedirect>('/redirects', {
      method: 'POST',
      body: {
        source: record.from,
        target: record.to,
        status: record.statusCode,
        enabled: record.enabled,
      },
    })
    return {
      id: data.id,
      from: data.source,
      to: data.target,
      statusCode: data.status,
      enabled: data.enabled,
      hits: data.hits ?? 0,
    }
  }

  async updateRedirect(id: string, record: Partial<Omit<RedirectRecord, 'id' | 'hits'>>) {
    const { data, message } = await this.request<ServerRedirect>(`/redirects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: {
        ...(record.from !== undefined ? { source: record.from } : {}),
        ...(record.to !== undefined ? { target: record.to } : {}),
        ...(record.statusCode !== undefined ? { status: record.statusCode } : {}),
        ...(record.enabled !== undefined ? { enabled: record.enabled } : {}),
      },
    })
    return {
      record: {
        id: data.id,
        from: data.source,
        to: data.target,
        statusCode: data.status,
        enabled: data.enabled,
        hits: data.hits ?? 0,
      },
      message,
    }
  }

  async deleteRedirect(id: string) {
    const { message } = await this.request<null>(`/redirects/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return message
  }

  private async downloadAuthenticated(path: string, filename: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
      headers: {
        Accept: 'text/csv',
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      },
    })
    if (response.status === 401) {
      const token = await this.refreshAccessToken()
      if (!token) {
        this.unauthorizedHandler?.()
        throw new ApiError('Unauthorized', 401)
      }
      await this.downloadAuthenticated(path, filename)
      return
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null
      throw new ApiError(body?.message || `Download failed (${response.status})`, response.status)
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async exportRedirectsCsv() {
    await this.downloadAuthenticated('/redirects/export.csv', 'orivon-redirects.csv')
  }

  async importRedirectsCsv(csv: string, options: { rewriteLinks?: boolean; allowHomepage?: boolean } = {}) {
    const { data, message } = await this.request<{ upserted: number; errors: string[] }>('/redirects/import.csv', {
      method: 'POST',
      body: { csv, ...options },
    })
    return { result: data, message }
  }

  async bulkUpsertRedirects(
    redirects: Array<{ from: string; to: string; statusCode?: 301 | 302; enabled?: boolean; note?: string }>,
    options: { rewriteLinks?: boolean; allowHomepage?: boolean } = {},
  ) {
    const { data, message } = await this.request<{ upserted: number; errors: string[] }>('/redirects/bulk', {
      method: 'POST',
      body: {
        redirects: redirects.map((item) => ({
          source: item.from,
          target: item.to,
          status: item.statusCode,
          enabled: item.enabled,
          note: item.note,
        })),
        ...options,
      },
    })
    return { result: data, message }
  }

  async exportUrlsCsv() {
    await this.downloadAuthenticated('/seo/urls-export.csv', 'orivon-urls-seo.csv')
  }

  async exportMetadataCsv() {
    await this.downloadAuthenticated('/seo/metadata-export.csv', 'orivon-metadata.csv')
  }

  async importMetadataCsv(csv: string) {
    const { data, message } = await this.request<{ updated: number; errors: string[] }>('/seo/metadata-import.csv', {
      method: 'POST',
      body: { csv },
    })
    return { result: data, message }
  }

  async previewContent(id: string) {
    const { data, meta } = await this.request<ServerContent>(`/preview/${encodeURIComponent(id)}`)
    return { record: toContent(data), meta }
  }

  async retireContent(id: string, input: {
    replacementPath: string
    allowHomepageRedirect?: boolean
    rewriteLinks?: boolean
  }) {
    const { data, message } = await this.request<{ redirect: { source: string; target: string }; linksRewritten: number }>(
      `/contents/${encodeURIComponent(id)}/retire`,
      { method: 'POST', body: input },
    )
    return { data, message }
  }

  async setupTotp() {
    const { data } = await this.request<{ secret: string; qrCode: string }>('/auth/totp/setup', { method: 'POST' })
    return data
  }

  async enableTotp(code: string) {
    const { message } = await this.request<{ totpEnabled: boolean }>('/auth/totp/enable', {
      method: 'POST',
      body: { code },
    })
    return message
  }

  async disableTotp(input: { code?: string; currentPassword: string }) {
    const { message } = await this.request<{ totpEnabled: boolean }>('/auth/totp/disable', {
      method: 'POST',
      body: input,
    })
    return message
  }

  async getAuditLogs({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}) {
    const { data, meta } = await this.request<Array<{
      id: string
      action: string
      entityType?: string | null
      entityId?: string | null
      summary?: string | null
      createdAt: string
      user?: { email: string; name: string; role: string } | null
    }>>(`/audit-logs?limit=${limit}&offset=${offset}`)
    return { items: data, meta }
  }

  async getNotFoundEvents({
    page = 1,
    pageSize = 20,
    query = '',
    status = 'open',
  }: {
    page?: number
    pageSize?: number
    query?: string
    status?: 'open' | 'resolved' | 'all'
  } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      status,
    })
    if (query.trim()) params.set('q', query.trim())
    const { data, meta } = await this.request<NotFoundRecord[]>(`/not-found-events?${params}`)
    return {
      records: data,
      pagination: {
        page: Number(meta?.page) || page,
        pageSize: Number(meta?.pageSize) || pageSize,
        total: Number(meta?.total) || 0,
        pages: Math.max(1, Number(meta?.pages) || 1),
      },
    }
  }

  async setNotFoundResolved(id: string, resolved: boolean) {
    const { data, message } = await this.request<NotFoundRecord>(
      `/not-found-events/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: { resolved } },
    )
    return { record: data, message }
  }

  async deleteNotFoundEvent(id: string) {
    const { message } = await this.request<null>(
      `/not-found-events/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    )
    return message
  }

  async getAppointmentStats() {
    const { data } = await this.request<AppointmentStats>('/appointments/stats')
    return data
  }

  async getAppointments({
    page = 1,
    pageSize = 20,
    query = '',
    status = 'ALL',
  }: {
    page?: number
    pageSize?: number
    query?: string
    status?: AppointmentStatus | 'ALL'
  } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      status,
    })
    if (query.trim()) params.set('q', query.trim())
    const { data, meta } = await this.request<AppointmentRecord[]>(`/appointments?${params}`)
    return {
      records: data,
      pagination: {
        page: Number(meta?.page) || page,
        pageSize: Number(meta?.pageSize) || pageSize,
        total: Number(meta?.total) || 0,
        pages: Math.max(1, Number(meta?.pages) || 1),
      },
    }
  }

  async getAppointment(id: string) {
    const { data } = await this.request<AppointmentRecord>(`/appointments/${encodeURIComponent(id)}`)
    return data
  }

  async updateAppointment(id: string, input: Partial<AppointmentInput>) {
    const { data, message } = await this.request<AppointmentRecord>(
      `/appointments/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: input },
    )
    return { record: data, message }
  }

  async deleteAppointment(id: string) {
    const { message } = await this.request<null>(
      `/appointments/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    )
    return message
  }

  async getSitemapStatus() {
    const { data } = await this.request<SitemapOverview>('/sitemaps')
    return data
  }

  generateSitemap() {
    return this.getSitemapStatus()
  }

  async getRobotsTxt() {
    const { data } = await this.request<RobotsTxtConfig>('/robots-txt')
    return data
  }

  async saveRobotsTxt(body: string) {
    const { data, message } = await this.request<RobotsTxtConfig>('/robots-txt', {
      method: 'PUT',
      body: { body },
    })
    return { config: data, message }
  }

  async getUrlPolicy() {
    const { data } = await this.request<UrlPolicy>('/seo/url-policy')
    return data
  }

  async saveUrlPolicy(policy: Partial<UrlPolicy>) {
    const {
      preferredHost: _preferredHost,
      preferredOrigin: _preferredOrigin,
      ...body
    } = policy
    const { data, message } = await this.request<UrlPolicy>('/seo/url-policy', {
      method: 'PUT',
      body,
    })
    return { policy: data, message }
  }

  async getVerifications() {
    const { data } = await this.request<SiteVerifications>('/seo/verifications')
    return data
  }

  async saveVerifications(body: Partial<SiteVerifications>) {
    const { data, message } = await this.request<SiteVerifications>('/seo/verifications', {
      method: 'PUT',
      body,
    })
    return { verifications: data, message }
  }

  async getAnalyticsTracking() {
    const { data } = await this.request<AnalyticsTracking>('/analytics/tracking')
    return data
  }

  async saveAnalyticsTracking(body: Partial<AnalyticsTracking>) {
    const { data, message } = await this.request<AnalyticsTracking>('/analytics/tracking', {
      method: 'PUT',
      body,
    })
    return { tracking: data, message }
  }

  async getAnalyticsConversions() {
    const { data } = await this.request<AnalyticsConversions>('/analytics/conversions')
    return data
  }

  async saveAnalyticsConversions(body: AnalyticsConversions) {
    const { data, message } = await this.request<AnalyticsConversions>('/analytics/conversions', {
      method: 'PUT',
      body,
    })
    return { conversions: data, message }
  }

  async getHreflang() {
    const { data } = await this.request<HreflangSettings>('/seo/hreflang')
    return data
  }

  async saveHreflang(body: Partial<HreflangSettings>) {
    const { data, message } = await this.request<HreflangSettings>('/seo/hreflang', {
      method: 'PUT',
      body,
    })
    return { hreflang: data, message }
  }

  getIndexingStatus() {
    return Promise.resolve<IndexingStatus>({
      indexed: 0,
      discovered: 0,
      blocked: 0,
      available: false,
    })
  }

  requestIndexing(urls: string[]): Promise<{ submitted: number; status: IndexingStatus }> {
    void urls
    return Promise.reject(
      new ApiError('Search Console indexing integration is not configured', 501),
    )
  }
}

export const api = new ApiClient(API_BASE_URL)
