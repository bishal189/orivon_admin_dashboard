import { useEffect, useState, type FormEvent } from 'react'
import { KeyRound, LoaderCircle, Save, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'react-toastify'
import { api, ApiError, type AuthUser } from '../api/client'
import { Card } from '../components/ui'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-100'
const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50'

export function SettingsPage({
  user,
  onUserUpdated,
}: {
  user: AuthUser
  onUserUpdated: (user: AuthUser) => void
}) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [profilePassword, setProfilePassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [totpEnabled, setTotpEnabled] = useState(Boolean(user.totpEnabled))
  const [totpSetup, setTotpSetup] = useState<{ secret: string; qrCode: string } | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [totpPassword, setTotpPassword] = useState('')
  const [savingTotp, setSavingTotp] = useState(false)

  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
    setTotpEnabled(Boolean(user.totpEnabled))
  }, [user])

  const emailChanged = email.trim().toLowerCase() !== user.email.toLowerCase()

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setSavingProfile(true)
    try {
      const result = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        ...(emailChanged ? { currentPassword: profilePassword } : {}),
      })
      onUserUpdated(result.user)
      setProfilePassword('')
      toast.success(result.message)
    } catch (requestError) {
      toast.error(requestError instanceof ApiError || requestError instanceof Error
        ? requestError.message
        : 'Unable to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }
    setSavingPassword(true)
    try {
      toast.success(await api.changePassword({
        currentPassword,
        newPassword,
      }))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      toast.error(requestError instanceof ApiError || requestError instanceof Error
        ? requestError.message
        : 'Unable to update password')
    } finally {
      setSavingPassword(false)
    }
  }

  const startTotp = async () => {
    setSavingTotp(true)
    try {
      setTotpSetup(await api.setupTotp())
      toast.success('Scan the QR code, then enter a 6-digit code to enable 2FA')
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to start 2FA setup')
    } finally {
      setSavingTotp(false)
    }
  }

  const enableTotp = async (event: FormEvent) => {
    event.preventDefault()
    setSavingTotp(true)
    try {
      toast.success(await api.enableTotp(totpCode))
      setTotpEnabled(true)
      setTotpSetup(null)
      setTotpCode('')
      const me = await api.getMe()
      onUserUpdated(me)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to enable 2FA')
    } finally {
      setSavingTotp(false)
    }
  }

  const disableTotp = async (event: FormEvent) => {
    event.preventDefault()
    setSavingTotp(true)
    try {
      toast.success(await api.disableTotp({
        currentPassword: totpPassword,
        code: totpCode || undefined,
      }))
      setTotpEnabled(false)
      setTotpCode('')
      setTotpPassword('')
      const me = await api.getMe()
      onUserUpdated(me)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to disable 2FA')
    } finally {
      setSavingTotp(false)
    }
  }

  return (
    <main className="p-4 md:p-6 xl:p-7">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 md:text-[28px]">General Settings</h1>
          <p className="mt-1 text-xs text-slate-500">
            Update your account, password, and two-factor authentication.
          </p>
        </header>

        <form onSubmit={saveProfile}>
          <Card className="overflow-hidden border-[#dfe3e8] shadow-none">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Your display name and sign-in email.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:p-6">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Role</p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-800">{user.role.toLowerCase()}</p>
              </div>

              <label className="text-xs font-medium text-slate-700">
                Full name
                <input className={inputClass} onChange={(event) => setName(event.target.value)} required value={name} />
              </label>

              <label className="text-xs font-medium text-slate-700">
                Email
                <input className={inputClass} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
              </label>

              {emailChanged && (
                <label className="text-xs font-medium text-slate-700">
                  Current password
                  <input autoComplete="current-password" className={inputClass} onChange={(event) => setProfilePassword(event.target.value)} placeholder="Required to change email" required type="password" value={profilePassword} />
                </label>
              )}

              <div className="flex justify-end pt-1">
                <button className={`${primaryButton} min-w-32`} disabled={savingProfile} type="submit">
                  {savingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save profile
                </button>
              </div>
            </div>
          </Card>
        </form>

        <form className="mt-4" onSubmit={savePassword}>
          <Card className="overflow-hidden border-[#dfe3e8] shadow-none">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Password</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Use at least 10 characters for a new password.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:p-6">
              <label className="text-xs font-medium text-slate-700">
                Current password
                <input autoComplete="current-password" className={inputClass} onChange={(event) => setCurrentPassword(event.target.value)} required type="password" value={currentPassword} />
              </label>
              <label className="text-xs font-medium text-slate-700">
                New password
                <input autoComplete="new-password" className={inputClass} minLength={10} onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Confirm new password
                <input autoComplete="new-password" className={inputClass} minLength={10} onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} />
              </label>

              <div className="flex justify-end pt-1">
                <button className={`${primaryButton} min-w-36`} disabled={savingPassword} type="submit">
                  {savingPassword ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Update password
                </button>
              </div>
            </div>
          </Card>
        </form>

        <Card className="mt-4 overflow-hidden border-[#dfe3e8] shadow-none">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Two-factor authentication</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {totpEnabled ? 'Enabled — required at sign-in.' : 'Recommended for all administrators.'}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:p-6">
            {!totpEnabled && !totpSetup ? (
              <button className={primaryButton} disabled={savingTotp} onClick={() => void startTotp()} type="button">
                {savingTotp ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Set up authenticator app
              </button>
            ) : null}

            {totpSetup ? (
              <form className="space-y-4" onSubmit={(event) => void enableTotp(event)}>
                <img alt="2FA QR code" className="mx-auto h-44 w-44 rounded-xl border border-slate-200 bg-white p-2" src={totpSetup.qrCode} />
                <p className="text-center text-[11px] text-slate-500">Secret: <span className="font-mono text-slate-700">{totpSetup.secret}</span></p>
                <label className="text-xs font-medium text-slate-700">
                  6-digit code
                  <input className={inputClass} inputMode="numeric" maxLength={6} onChange={(event) => setTotpCode(event.target.value)} pattern="[0-9]{6}" required value={totpCode} />
                </label>
                <div className="flex justify-end gap-2">
                  <button className={secondaryButton} onClick={() => setTotpSetup(null)} type="button">Cancel</button>
                  <button className={primaryButton} disabled={savingTotp} type="submit">
                    {savingTotp ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Enable 2FA
                  </button>
                </div>
              </form>
            ) : null}

            {totpEnabled ? (
              <form className="space-y-4" onSubmit={(event) => void disableTotp(event)}>
                <label className="text-xs font-medium text-slate-700">
                  Current password
                  <input className={inputClass} onChange={(event) => setTotpPassword(event.target.value)} required type="password" value={totpPassword} />
                </label>
                <label className="text-xs font-medium text-slate-700">
                  Current 2FA code
                  <input className={inputClass} inputMode="numeric" maxLength={6} onChange={(event) => setTotpCode(event.target.value)} pattern="[0-9]{6}" required value={totpCode} />
                </label>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100" disabled={savingTotp} type="submit">
                  {savingTotp ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Disable 2FA
                </button>
              </form>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  )
}
