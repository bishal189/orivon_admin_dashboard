import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'react-toastify'
import { Eye, EyeOff, FileText, LoaderCircle, Lock, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import { API_BASE_URL, api, type MemberBook } from '../../api/client'
import { Card, StatusBadge } from '../../components/ui'
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal'
import { fieldInputClass, FieldError, inputClass, isHttpUrl, Notice, Page, primaryButton, secondaryButton, SLUG_PATTERN } from './shared'

type FormState = {
  title: string
  slug: string
  description: string
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

export function MemberBooksPage() {
  const [books, setBooks] = useState<MemberBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<MemberBook | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [pdf, setPdf] = useState<File | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<MemberBook | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void api.getMemberBooks()
      .then(setBooks)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load books'))
      .finally(() => setLoading(false))
  }, [])

  const isEditing = Boolean(editing)
  const fieldErrors = {
    title: form.title.trim() ? '' : 'Enter a title.',
    slug: form.slug.trim() && !SLUG_PATTERN.test(form.slug.trim()) ? 'Use lowercase letters, numbers and hyphens.' : '',
    coverImageUrl: isHttpUrl(form.coverImageUrl) ? '' : 'Use a full http(s) URL.',
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

  const resetForm = () => {
    setEditing(null)
    setForm(emptyForm())
    setPdf(null)
    setAttempted(false)
    setShowPassword(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const startEdit = (book: MemberBook) => {
    setEditing(book)
    setForm(toForm(book))
    setPdf(null)
    setAttempted(false)
    if (fileRef.current) fileRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      coverImageUrl: form.coverImageUrl.trim() || null,
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
      if (pdf) {
        try {
          book = (await api.uploadMemberBookPdf(book.id, pdf)).book
          upsertBook(book)
        } catch (uploadError) {
          setEditing(book)
          setForm((current) => ({ ...current, slug: book.slug, password: '' }))
          const reason = uploadError instanceof Error ? uploadError.message : 'Upload failed'
          const message = `Book details saved, but the PDF was not uploaded: ${reason}`
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
            <label className="block text-xs font-medium text-slate-700">
              Cover image URL
              <input
                aria-invalid={showError('coverImageUrl')}
                className={fieldInputClass(showError('coverImageUrl'))}
                onChange={(event) => set('coverImageUrl', event.target.value)}
                placeholder="https://…"
                value={form.coverImageUrl}
              />
              {showError('coverImageUrl') && <FieldError message={fieldErrors.coverImageUrl} />}
            </label>
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
                  {book.coverImageUrl
                    ? <img alt="" className="h-full w-full object-cover" src={book.coverImageUrl} />
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
