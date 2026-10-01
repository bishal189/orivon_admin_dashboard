import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { Eye, EyeOff, FileText, ImagePlus, Link2, LoaderCircle, Lock, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import { API_BASE_URL, api, memberBookCoverSrc, type MemberBook } from '../../api/client'
import { Card, StatusBadge } from '../../components/ui'
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal'
import { fieldInputClass, FieldError, inputClass, isHttpUrl, Notice, Page, primaryButton, secondaryButton, SLUG_PATTERN } from './shared'

type CoverMode = 'upload' | 'url'

type FormState = {
  title: string
  slug: string
  description: string
  coverMode: CoverMode
  coverImageUrl: string
  pages: string
  topics: string
  sortOrder: string
  published: boolean
  password: string
}

const emptyForm = (): FormState => ({
  title: '',
  slug: '',
  description: '',
  coverMode: 'upload',
  coverImageUrl: '',
  pages: '',
  topics: '',
  sortOrder: '0',
  published: false,
  password: '',
})

const toForm = (book: MemberBook): FormState => ({
  title: book.title,
  slug: book.slug,
  description: book.description || '',
  coverMode: book.coverImageUrl && !book.hasUploadedCover ? 'url' : 'upload',
  coverImageUrl: book.coverImageUrl || '',
  pages: book.pages ? String(book.pages) : '',
  topics: book.topics.join(', '),
  sortOrder: String(book.sortOrder),
  published: book.published,
  password: '',
})

const formatSize = (bytes: number | null) => {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const MAX_PDF_BYTES = 50 * 1024 * 1024
const MAX_COVER_BYTES = 5 * 1024 * 1024
const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function MemberBooksPage() {
  const [books, setBooks] = useState<MemberBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<MemberBook | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [pdf, setPdf] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<MemberBook | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const coverFileUrl = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : ''), [coverFile])
  useEffect(() => () => {
    if (coverFileUrl) URL.revokeObjectURL(coverFileUrl)
  }, [coverFileUrl])

  useEffect(() => {
    void api.getMemberBooks()
      .then(setBooks)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load books'))
      .finally(() => setLoading(false))
  }, [])

  const isEditing = Boolean(editing)
  const keepsUploadedCover = Boolean(editing?.hasUploadedCover) && !removeCover
  const coverPreview = form.coverMode === 'upload'
    ? coverFileUrl || (keepsUploadedCover && editing ? memberBookCoverSrc(editing) : '')
    : form.coverImageUrl.trim() && isHttpUrl(form.coverImageUrl) ? form.coverImageUrl.trim() : ''
  const fieldErrors = {
    title: form.title.trim() ? '' : 'Enter a title.',
    slug: form.slug.trim() && !SLUG_PATTERN.test(form.slug.trim()) ? 'Use lowercase letters, numbers and hyphens.' : '',
    coverImageUrl: form.coverMode === 'url' && !isHttpUrl(form.coverImageUrl) ? 'Use a full http(s) URL.' : '',
    cover: !coverFile || form.coverMode !== 'upload'
      ? ''
      : !COVER_TYPES.includes(coverFile.type)
        ? 'Use a JPG, PNG or WebP image.'
        : coverFile.size > MAX_COVER_BYTES ? 'Image must be 5 MB or smaller.' : '',
    pages: form.pages.trim() && !(Number(form.pages) >= 1) ? 'Enter a positive number.' : '',
    password: !isEditing && form.password.length < 4
      ? 'Set a password of at least 4 characters.'
      : isEditing && form.password && form.password.length < 4
        ? 'Password must be at least 4 characters.'
        : '',
    pdf: pdf && pdf.size > MAX_PDF_BYTES ? 'PDF must be 50 MB or smaller.' : '',
  }
  const showError = (key: keyof typeof fieldErrors) => attempted && Boolean(fieldErrors[key])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const clearFiles = () => {
    setPdf(null)
    setCoverFile(null)
    setRemoveCover(false)
    if (fileRef.current) fileRef.current.value = ''
    if (coverRef.current) coverRef.current.value = ''
  }

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm())
    clearFiles()
    setAttempted(false)
    setShowPassword(false)
  }

  const startEdit = (book: MemberBook) => {
    setEditing(book)
    setForm(toForm(book))
    clearFiles()
    setAttempted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearCoverPhoto = () => {
    if (coverFile) {
      setCoverFile(null)
      if (coverRef.current) coverRef.current.value = ''
    } else {
      setRemoveCover(true)
    }
  }

  const upsertBook = (book: MemberBook) =>
    setBooks((current) => {
      const exists = current.some((item) => item.id === book.id)
      const next = exists ? current.map((item) => (item.id === book.id ? book : item)) : [book, ...current]
      return next.sort((a, b) => a.sortOrder - b.sortOrder)
    })

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setAttempted(true)
    if (Object.values(fieldErrors).some(Boolean)) {
      toast.error('Fix the highlighted fields before saving.')
      return
    }

    const payload = {
      title: form.title.trim(),
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      description: form.description.trim() || null,
      coverImageUrl: form.coverMode === 'url' ? form.coverImageUrl.trim() || null : null,
      pages: form.pages.trim() ? Number(form.pages) : null,
      topics: form.topics.split(',').map((topic) => topic.trim()).filter(Boolean),
      sortOrder: Number(form.sortOrder) || 0,
      published: form.published,
      ...(form.password ? { password: form.password } : {}),
    }

    setSaving(true)
    setError('')
    try {
      let { book } = editing
        ? await api.updateMemberBook(editing.id, payload)
        : await api.createMemberBook(payload)
      upsertBook(book)

      const dropsUploadedCover = form.coverMode === 'upload' ? removeCover : !form.coverImageUrl.trim()
      const steps: Array<{ label: string; run: (id: string) => Promise<{ book: MemberBook }>; done: () => void }> = []
      if (form.coverMode === 'upload' && coverFile) {
        steps.push({ label: 'cover photo', run: (id) => api.uploadMemberBookCover(id, coverFile), done: () => setCoverFile(null) })
      } else if (book.hasUploadedCover && dropsUploadedCover) {
        steps.push({ label: 'cover photo', run: (id) => api.removeMemberBookCover(id), done: () => setRemoveCover(false) })
      }
      if (pdf) {
        steps.push({ label: 'PDF', run: (id) => api.uploadMemberBookPdf(id, pdf), done: () => setPdf(null) })
      }

      for (const step of steps) {
        try {
          book = (await step.run(book.id)).book
          upsertBook(book)
          step.done()
        } catch (uploadError) {
          const saved = book
          setEditing(saved)
          setForm((current) => ({ ...current, slug: saved.slug, password: '' }))
          const reason = uploadError instanceof Error ? uploadError.message : 'Upload failed'
          const message = `Book details saved, but the ${step.label} was not saved: ${reason}`
          setError(message)
          toast.error(message)
          return
        }
      }
      toast.success(editing ? 'Book updated' : 'Book created')
      resetForm()
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to save book'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (book: MemberBook) => {
    try {
      const { book: saved } = await api.updateMemberBook(book.id, { published: !book.published })
      upsertBook(saved)
      toast.success(saved.published ? 'Book published' : 'Book hidden from the website')
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to update book')
    }
  }

  const removePdf = async (book: MemberBook) => {
    try {
      const { book: saved } = await api.removeMemberBookPdf(book.id)
      upsertBook(saved)
      if (editing?.id === saved.id) setEditing(saved)
      toast.success('PDF removed')
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to remove PDF')
    }
  }

  const remove = async (book: MemberBook) => {
    try {
      await api.deleteMemberBook(book.id)
      setBooks((current) => current.filter((item) => item.id !== book.id))
      if (editing?.id === book.id) resetForm()
      toast.success('Book deleted')
      setPendingDelete(null)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to delete book')
    }
  }

  return (
    <Page
      description="Password-protected PDF books shown on the website's Membership page. Each book has its own password."
      title="Member Books"
    >
      {error && <Notice message={`${error}. API: ${API_BASE_URL}`} />}
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card className="h-fit p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">{isEditing ? 'Edit book' : 'Add book'}</h2>
            {isEditing && (
              <button className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800" onClick={resetForm} type="button">
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            )}
          </div>
          <form className="mt-4 space-y-4" noValidate onSubmit={submit}>
            <label className="block text-xs font-medium text-slate-700">
              Title
              <input
                aria-invalid={showError('title')}
                className={fieldInputClass(showError('title'))}
                onChange={(event) => set('title', event.target.value)}
                placeholder="Licensing Pathway Handbook"
                value={form.title}
              />
              {showError('title') && <FieldError message={fieldErrors.title} />}
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Slug <span className="font-normal text-slate-400">(optional, generated from title)</span>
              <input
                aria-invalid={showError('slug')}
                className={fieldInputClass(showError('slug'))}
                onChange={(event) => set('slug', event.target.value.toLowerCase())}
                placeholder="licensing-handbook"
                value={form.slug}
              />
              {showError('slug') && <FieldError message={fieldErrors.slug} />}
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Description
              <textarea
                className={`${inputClass} min-h-20`}
                onChange={(event) => set('description', event.target.value)}
                placeholder="Short summary shown on the book card"
                value={form.description}
              />
            </label>
            <div className="text-xs font-medium text-slate-700">
              Cover image <span className="font-normal text-slate-400">(optional)</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
                {([
                  { mode: 'upload', label: 'Upload photo', Icon: ImagePlus },
                  { mode: 'url', label: 'Image URL', Icon: Link2 },
                ] as const).map(({ mode, label, Icon }) => (
                  <button
                    aria-selected={form.coverMode === mode}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition ${form.coverMode === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    key={mode}
                    onClick={() => set('coverMode', mode)}
                    role="tab"
                    type="button"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {coverPreview && (
                <div className="relative mt-2 aspect-[16/10] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <img alt="Cover preview" className="h-full w-full object-cover" src={coverPreview} />
                  {form.coverMode === 'upload' && (
                    <button
                      aria-label="Remove cover photo"
                      className="absolute top-2 right-2 rounded-full bg-white/95 p-1.5 text-slate-600 shadow-sm hover:text-red-600"
                      onClick={clearCoverPhoto}
                      type="button"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {form.coverMode === 'upload' ? (
                <>
                  <button className={`${secondaryButton} mt-2 w-full`} onClick={() => coverRef.current?.click()} type="button">
                    <Upload className="h-3.5 w-3.5" />
                    {coverFile ? coverFile.name : keepsUploadedCover ? 'Replace photo' : 'Choose photo'}
                  </button>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      setCoverFile(event.target.files?.[0] ?? null)
                      setRemoveCover(false)
                    }}
                    ref={coverRef}
                    type="file"
                  />
                  {showError('cover') && <FieldError message={fieldErrors.cover} />}
                  <p className="mt-1 text-[10px] font-normal text-slate-400">JPG, PNG or WebP, up to 5 MB.</p>
                </>
              ) : (
                <>
                  <input
                    aria-invalid={showError('coverImageUrl')}
                    className={fieldInputClass(showError('coverImageUrl'))}
                    onChange={(event) => set('coverImageUrl', event.target.value)}
                    placeholder="https://…"
                    value={form.coverImageUrl}
                  />
                  {showError('coverImageUrl') && <FieldError message={fieldErrors.coverImageUrl} />}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-slate-700">
                Pages
                <input
                  aria-invalid={showError('pages')}
                  className={fieldInputClass(showError('pages'))}
                  inputMode="numeric"
                  onChange={(event) => set('pages', event.target.value.replace(/\D/g, ''))}
                  placeholder="24"
                  value={form.pages}
                />
                {showError('pages') && <FieldError message={fieldErrors.pages} />}
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Display order
                <input
                  className={inputClass}
                  inputMode="numeric"
                  onChange={(event) => set('sortOrder', event.target.value.replace(/\D/g, ''))}
                  value={form.sortOrder}
                />
              </label>
            </div>
            <label className="block text-xs font-medium text-slate-700">
              Topics <span className="font-normal text-slate-400">(comma separated)</span>
              <input
                className={inputClass}
                onChange={(event) => set('topics', event.target.value)}
                placeholder="DHA licensing, Exam readiness"
                value={form.topics}
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              {isEditing ? 'New password' : 'Password'}
              {isEditing && <span className="font-normal text-slate-400"> (leave blank to keep current)</span>}
              <span className="relative block">
                <input
                  aria-invalid={showError('password')}
                  autoComplete="new-password"
                  className={fieldInputClass(showError('password'), 'pr-10')}
                  onChange={(event) => set('password', event.target.value)}
                  placeholder={isEditing ? '••••••••' : 'Readers enter this to open the book'}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-2 mt-0.75 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              {showError('password') && <FieldError message={fieldErrors.password} />}
            </label>
            <div className="text-xs font-medium text-slate-700">
              PDF file
              {editing?.hasPdf && !pdf && (
                <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-brand-700" />
                  <span className="min-w-0 flex-1 truncate font-normal">{editing.pdfFilename}</span>
                  <span className="text-[10px] font-normal text-slate-400">{formatSize(editing.pdfSize)}</span>
                </div>
              )}
              <button
                className={`${secondaryButton} mt-1.5 w-full`}
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                <Upload className="h-3.5 w-3.5" />
                {pdf ? pdf.name : editing?.hasPdf ? 'Replace PDF' : 'Choose PDF'}
              </button>
              <input
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => setPdf(event.target.files?.[0] ?? null)}
                ref={fileRef}
                type="file"
              />
              {showError('pdf') && <FieldError message={fieldErrors.pdf} />}
              <p className="mt-1 text-[10px] font-normal text-slate-400">PDF only, up to 50 MB.</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                checked={form.published}
                className="h-4 w-4 accent-brand-700"
                onChange={(event) => set('published', event.target.checked)}
                type="checkbox"
              />
              Show on website
            </label>
            <button className={`${primaryButton} w-full`} disabled={saving} type="submit">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isEditing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEditing ? 'Save changes' : 'Add book'}
            </button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">Books</h2>
            <p className="mt-1 text-[11px] text-slate-400">{books.length} total · {books.filter((book) => book.published).length} on website</p>
          </div>
          <div className="divide-y divide-slate-100">
            {loading && <p className="flex items-center justify-center gap-2 p-10 text-xs text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" />Loading books…</p>}
            {!loading && books.length === 0 && <p className="p-10 text-center text-xs text-slate-400">No books yet. Add the first one.</p>}
            {books.map((book) => (
              <div className={`flex items-center gap-4 p-4 ${editing?.id === book.id ? 'bg-brand-50/40' : ''}`} key={book.id}>
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  {memberBookCoverSrc(book)
                    ? <img alt="" className="h-full w-full object-cover" src={memberBookCoverSrc(book) ?? undefined} />
                    : <div className="flex h-full w-full items-center justify-center text-slate-300"><Lock className="h-5 w-5" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">{book.title}</p>
                    <StatusBadge tone={book.published ? 'green' : 'amber'}>{book.published ? 'Published' : 'Hidden'}</StatusBadge>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-400">/member-resources/{book.slug}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <FileText className="h-3 w-3" />
                    {book.hasPdf ? `${book.pdfFilename} · ${formatSize(book.pdfSize)}` : <span className="text-amber-600">No PDF uploaded</span>}
                    {book.hasPdf && (
                      <button className="ml-1 text-red-500 hover:underline" onClick={() => void removePdf(book)} type="button">Remove</button>
                    )}
                  </p>
                </div>
                <button className="rounded-md px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50" onClick={() => void togglePublished(book)} type="button">
                  {book.published ? 'Hide' : 'Publish'}
                </button>
                <button aria-label="Edit book" className="rounded-md p-2 text-slate-500 hover:bg-slate-50" onClick={() => startEdit(book)} type="button"><Pencil className="h-4 w-4" /></button>
                <button aria-label="Delete book" className="rounded-md p-2 text-red-500 hover:bg-red-50" onClick={() => setPendingDelete(book)} type="button"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {pendingDelete && (
        <ConfirmDeleteModal
          title="Delete this book?"
          description={
            <>
              Delete <span className="font-semibold text-slate-700">{pendingDelete.title}</span> and its PDF? This cannot be undone.
            </>
          }
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => remove(pendingDelete)}
        />
      )}
    </Page>
  )
}
