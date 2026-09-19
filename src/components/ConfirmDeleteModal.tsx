import { useEffect, useId, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { LoaderCircle, LogOut, Trash2, X } from 'lucide-react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

interface ConfirmModalProps {
  title?: string
  description?: ReactNode
  confirmLabel?: string
  busyLabel?: string
  tone?: 'danger' | 'neutral'
  icon?: IconComponent
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmModal({
  title = 'Are you sure?',
  description = 'Please confirm to continue.',
  confirmLabel = 'Confirm',
  busyLabel = 'Working…',
  tone = 'danger',
  icon: Icon = Trash2,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(busy)

  useEffect(() => {
    busyRef.current = busy
  }, [busy])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector<HTMLElement>('button')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) onCancel()
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [onCancel])

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  const iconWrapClass = tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'
  const confirmButtonClass =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-[#0b1f3a] hover:bg-[#082d70]'

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal-panel w-full max-w-md rounded-t-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] ring-1 ring-black/5 sm:rounded-2xl"
        ref={panelRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900" id={titleId}>
                {title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500" id={descriptionId}>
                {description}
              </p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClass}`}
            disabled={busy}
            onClick={() => void confirm()}
            type="button"
          >
            {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmDeleteModal({
  title = 'Delete this item?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  busyLabel = 'Deleting…',
  onConfirm,
  onCancel,
}: Omit<ConfirmModalProps, 'tone' | 'icon' | 'busyLabel'> & { busyLabel?: string }) {
  return (
    <ConfirmModal
      busyLabel={busyLabel}
      confirmLabel={confirmLabel}
      description={description}
      icon={Trash2}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={title}
      tone="danger"
    />
  )
}

export function ConfirmLogoutModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}) {
  return (
    <ConfirmModal
      busyLabel="Signing out…"
      confirmLabel="Sign out"
      description="Do you want to sign out of the admin panel?"
      icon={LogOut}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Sign out?"
      tone="neutral"
    />
  )
}
