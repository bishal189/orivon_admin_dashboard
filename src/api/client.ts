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
}

interface ServerContent {
  id: string
  type?: 'PAGE' | 'ARTICLE' | 'SERVICE' | 'CONDITION' | 'PROVIDER' | 'LOCATION' | 'FAQ'
  title: string
  slug: string
  excerpt?: string | null
  status: 'DRAFT' | 'IN_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
  updatedAt: string
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
    canonicalUrl?: string | null
    robots: string
    excludeFromSitemap: boolean
  } | null
  subtype?: { key: string; data: { h1?: string; schemaDisabled?: boolean } } | null
}

export type ContentType = 'PAGE' | 'ARTICLE' | 'SERVICE' | 'CONDITION' | 'PROVIDER' | 'LOCATION' | 'FAQ'

export interface ContentRecord {
  id: string
  type: ContentType
  title: string
  description: string
  slug: string
  h1: string
  canonical: string
  robots: string
  sitemapExcluded: boolean
  schemaDisabled: boolean
  status?: 'draft' | 'published'
  updatedAt?: string
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

function toContent(item: ServerContent): ContentRecord {
  const robots = (item.seo?.robots || 'index,follow').replace(/\s+/g, '')
  return {
    id: item.id,
    type: item.type || 'PAGE',
    title: item.seo?.metaTitle || item.title,
    description: item.seo?.metaDescription || item.excerpt || '',
    slug: item.slug,
    h1: item.subtype?.data?.h1 || item.title,
    canonical: item.seo?.canonicalUrl || '',
    robots: robots.replace(',', ', '),
    sitemapExcluded: item.seo?.excludeFromSitemap ?? false,
    schemaDisabled: item.subtype?.data?.schemaDisabled ?? false,
    status: item.status === 'PUBLISHED' ? 'published' : 'draft',
    updatedAt: item.updatedAt,
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
    const subtypeKey = record.type.toLowerCase()
    const { data } = await this.request<ServerContent>('/contents', {
      method: 'POST',
      body: {
        type: record.type,
        title: record.title,
        slug: record.slug,
        excerpt: record.description,
        body: { blocks: [] },
        subtype: { key: subtypeKey, data: { h1: record.h1, schemaDisabled: record.schemaDisabled } },
        seo: {
          metaTitle: record.title,
          metaDescription: record.description,
          canonicalUrl: record.canonical || null,
          robots: record.robots.replace(/\s/g, ''),
          excludeFromSitemap: record.sitemapExcluded,
        },
      },
    })
    if (record.status === 'published') {
      const published = await this.syncContentStatus(data.id, 'draft', 'published')
      if (published?.record) return published.record
    }
    return toContent(data)
  }

  async updateContent(id: string, record: Omit<ContentRecord, 'id'>, previousStatus?: ContentRecord['status']) {
    const subtypeKey = record.type.toLowerCase()
    const { data } = await this.request<ServerContent>(`/contents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: {
        type: record.type,
        title: record.title,
        slug: record.slug,
        excerpt: record.description,
        subtype: { key: subtypeKey, data: { h1: record.h1, schemaDisabled: record.schemaDisabled } },
        seo: {
          metaTitle: record.title,
          metaDescription: record.description,
          canonicalUrl: record.canonical || null,
          robots: record.robots.replace(/\s/g, ''),
          excludeFromSitemap: record.sitemapExcluded,
        },
      },
    })
    const synced = await this.syncContentStatus(id, previousStatus || data.status, record.status)
    return synced?.record || toContent(data)
  }

  async deleteContent(id: string) {
    const { message } = await this.request<null>(`/contents/${encodeURIComponent(id)}`, { method: 'DELETE' })
    return message
  }

  async transitionContent(id: string, status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED') {
    const { data, message } = await this.request<ServerContent>(
      `/contents/${encodeURIComponent(id)}/workflow`,
      { method: 'POST', body: { status } },
    )
    return { record: toContent(data), message }
  }

  async syncContentStatus(id: string, current: string | undefined, next: 'draft' | 'published' | undefined) {
    if (!next) return null
    const fromPublished = current === 'published' || current === 'PUBLISHED'
    const toPublished = next === 'published'
    if (fromPublished === toPublished) return null
    if (toPublished) {
      try {
        await this.transitionContent(id, 'IN_REVIEW')
      } catch {
        // Already past draft, continue to publish when allowed.
      }
      return this.transitionContent(id, 'PUBLISHED')
    }
    return this.transitionContent(id, 'DRAFT')
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
