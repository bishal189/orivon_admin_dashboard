import { useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, LoaderCircle, Lock, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'react-toastify'
import { api, ApiError, type AuthUser } from '../api/client'
import { Card } from '../components/ui'
import {
  EMAIL_PATTERN,
  fieldInputClass,
  FieldError,
  TOTP_PATTERN,
} from './admin/shared'

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
  const [passwordEmail, setPasswordEmail] = useState(user.email)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [totpEnabled, setTotpEnabled] = useState(Boolean(user.totpEnabled))
  const [totpSetup, setTotpSetup] = useState<{ secret: string; qrCode: string } | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [totpPassword, setTotpPassword] = useState('')
  const [savingTotp, setSavingTotp] = useState(false)
  const [profileAttempted, setProfileAttempted] = useState(false)
  const [passwordAttempted, setPasswordAttempted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [totpAttempted, setTotpAttempted] = useState(false)

  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
    setPasswordEmail(user.email)
    setTotpEnabled(Boolean(user.totpEnabled))
  }, [user])

  const emailChanged = email.trim().toLowerCase() !== user.email.toLowerCase()

  const profileErrors = {
    name: !name.trim() ? 'Enter your full name.' : '',
    email: !email.trim()
      ? 'Enter an email address.'
      : !EMAIL_PATTERN.test(email.trim())
        ? 'Enter a valid email address.'
        : '',
    profilePassword: emailChanged && !profilePassword
      ? 'Enter your current password to change email.'
      : '',
  }
  const passwordErrors = {
    passwordEmail: !passwordEmail.trim()
      ? 'Enter an email address.'
      : !EMAIL_PATTERN.test(passwordEmail.trim())
        ? 'Enter a valid email address.'
        : '',
    newPassword: !newPassword
      ? 'Enter a password.'
      : newPassword.length < 10
        ? 'Password must contain at least 10 characters.'
        : '',
    confirmPassword: !confirmPassword
      ? 'Confirm your new password.'
      : newPassword !== confirmPassword
        ? 'New password and confirmation do not match.'
        : '',
  }
  const enableTotpError = !TOTP_PATTERN.test(totpCode.trim())
    ? 'Enter the complete 6-digit code.'
    : ''
  const disableTotpErrors = {
    totpPassword: !totpPassword ? 'Enter your current password.' : '',
    totpCode: !TOTP_PATTERN.test(totpCode.trim()) ? 'Enter the complete 6-digit code.' : '',
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setProfileAttempted(true)
    if (Object.values(profileErrors).some(Boolean)) return
    setSavingProfile(true)
    try {
      const result = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        ...(emailChanged ? { currentPassword: profilePassword } : {}),
      })
      onUserUpdated(result.user)
      setProfilePassword('')
      setProfileAttempted(false)
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
    setPasswordAttempted(true)
    if (Object.values(passwordErrors).some(Boolean)) return
    setSavingPassword(true)
    try {
      toast.success(await api.changePassword({
        email: passwordEmail.trim(),
        password: newPassword,
      }))
      setNewPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirm(false)
      setPasswordAttempted(false)
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
    setTotpAttempted(true)
    if (enableTotpError) return
    setSavingTotp(true)
    try {
      toast.success(await api.enableTotp(totpCode))
      setTotpEnabled(true)
      setTotpSetup(null)
      setTotpCode('')
      setTotpAttempted(false)
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
    setTotpAttempted(true)
    if (Object.values(disableTotpErrors).some(Boolean)) return
    setSavingTotp(true)
    try {
      toast.success(await api.disableTotp({ currentPassword: totpPassword, code: totpCode }))
      setTotpEnabled(false)
      setTotpPassword('')
      setTotpCode('')
      setTotpAttempted(false)
      const me = await api.getMe()
      onUserUpdated(me)
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Unable to disable 2FA')
    } finally {
      setSavingTotp(false)
    }
  }

  const showProfile = (key: keyof typeof profileErrors) => profileAttempted && Boolean(profileErrors[key])
  const showPasswordError = (key: keyof typeof passwordErrors) => passwordAttempted && Boolean(passwordErrors[key])
  const showDisableTotp = (key: keyof typeof disableTotpErrors) => totpAttempted && Boolean(disableTotpErrors[key])

  return (
    <main className="p-4 md:p-6 xl:p-7">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900 md:text-[28px]">Settings</h1>
          <p className="mt-1 text-xs text-slate-500">Manage your profile, password, and two-factor authentication.</p>
        </header>

        <form noValidate onSubmit={saveProfile}>
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
                <input
                  aria-describedby={showProfile('name') ? 'settings-name-error' : undefined}
                  aria-invalid={showProfile('name')}
                  className={fieldInputClass(showProfile('name'))}
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
                {showProfile('name') && <FieldError id="settings-name-error" message={profileErrors.name} />}
              </label>

              <label className="text-xs font-medium text-slate-700">
                Email
                <input
                  aria-describedby={showProfile('email') ? 'settings-email-error' : undefined}
                  aria-invalid={showProfile('email')}
                  className={fieldInputClass(showProfile('email'))}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
                {showProfile('email') && <FieldError id="settings-email-error" message={profileErrors.email} />}
              </label>

              {emailChanged && (
                <label className="text-xs font-medium text-slate-700">
                  Current password
                  <input
                    aria-describedby={showProfile('profilePassword') ? 'settings-profile-password-error' : undefined}
                    aria-invalid={showProfile('profilePassword')}
                    autoComplete="current-password"
                    className={fieldInputClass(showProfile('profilePassword'))}
                    onChange={(event) => setProfilePassword(event.target.value)}
                    placeholder="Required to change email"
                    type="password"
                    value={profilePassword}
                  />
                  {showProfile('profilePassword') && (
                    <FieldError id="settings-profile-password-error" message={profileErrors.profilePassword} />
                  )}
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

        <form className="mt-4" noValidate onSubmit={savePassword}>
          <Card className="overflow-hidden border-[#dfe3e8] px-5 py-8 shadow-none sm:px-8">
            <div className="mx-auto max-w-md text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Lock className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">Change Password</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Enter the account email and a password of at least 10 characters. Admins can update any account.
              </p>
            </div>

            <div className="mx-auto mt-6 grid max-w-md gap-4">
              <label className="text-sm font-medium text-slate-800">
                Email
                <span className="relative mt-1.5 block">
                  <Mail className={`pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 ${showPasswordError('passwordEmail') ? 'text-red-500' : 'text-slate-400'}`} />
                  <input
                    aria-describedby={showPasswordError('passwordEmail') ? 'settings-password-email-error' : undefined}
                    aria-invalid={showPasswordError('passwordEmail')}
                    autoComplete="email"
                    className={fieldInputClass(showPasswordError('passwordEmail'), 'mt-0 pl-10')}
                    onChange={(event) => setPasswordEmail(event.target.value)}
                    placeholder="admin@orivon.ae"
                    type="email"
                    value={passwordEmail}
                  />
                </span>
                {showPasswordError('passwordEmail') && (
                  <FieldError id="settings-password-email-error" message={passwordErrors.passwordEmail} />
                )}
              </label>

              <label className="text-sm font-medium text-slate-800">
                Password
                <span className="relative mt-1.5 block">
                  <Lock className={`pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 ${showPasswordError('newPassword') ? 'text-red-500' : 'text-slate-400'}`} />
                  <input
                    aria-describedby={showPasswordError('newPassword') ? 'settings-new-password-error' : undefined}
                    aria-invalid={showPasswordError('newPassword')}
                    autoComplete="new-password"
                    className={fieldInputClass(showPasswordError('newPassword'), 'mt-0 px-10')}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="New password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
                {showPasswordError('newPassword') && (
                  <FieldError id="settings-new-password-error" message={passwordErrors.newPassword} />
                )}
              </label>

              <label className="text-sm font-medium text-slate-800">
                Confirm password
                <span className="relative mt-1.5 block">
                  <Lock className={`pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 ${showPasswordError('confirmPassword') ? 'text-red-500' : 'text-slate-400'}`} />
                  <input
                    aria-describedby={showPasswordError('confirmPassword') ? 'settings-confirm-password-error' : undefined}
                    aria-invalid={showPasswordError('confirmPassword')}
                    autoComplete="new-password"
                    className={fieldInputClass(showPasswordError('confirmPassword'), 'mt-0 px-10')}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                  />
                  <button
                    aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                    onClick={() => setShowConfirm((current) => !current)}
                    type="button"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
                {showPasswordError('confirmPassword') && (
                  <FieldError id="settings-confirm-password-error" message={passwordErrors.confirmPassword} />
                )}
              </label>

              <button className={`${primaryButton} mt-2 w-full py-3 text-sm`} disabled={savingPassword} type="submit">
                {savingPassword ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Change Password
              </button>
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
              <form className="space-y-4" noValidate onSubmit={(event) => void enableTotp(event)}>
                <img alt="2FA QR code" className="mx-auto h-44 w-44 rounded-xl border border-slate-200 bg-white p-2" src={totpSetup.qrCode} />
                <p className="text-center text-[11px] text-slate-500">Secret: <span className="font-mono text-slate-700">{totpSetup.secret}</span></p>
                <label className="text-xs font-medium text-slate-700">
                  6-digit code
                  <input
                    aria-describedby={totpAttempted && enableTotpError ? 'settings-enable-totp-error' : undefined}
                    aria-invalid={totpAttempted && Boolean(enableTotpError)}
                    className={fieldInputClass(totpAttempted && Boolean(enableTotpError))}
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))}
                    value={totpCode}
                  />
                  {totpAttempted && enableTotpError && (
                    <FieldError id="settings-enable-totp-error" message={enableTotpError} />
                  )}
                </label>
                <div className="flex justify-end gap-2">
                  <button className={secondaryButton} onClick={() => { setTotpSetup(null); setTotpAttempted(false) }} type="button">Cancel</button>
                  <button className={primaryButton} disabled={savingTotp} type="submit">
                    {savingTotp ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Enable 2FA
                  </button>
                </div>
              </form>
            ) : null}

            {totpEnabled ? (
              <form className="space-y-5" noValidate onSubmit={(event) => void disableTotp(event)}>
                <label className="flex flex-col gap-2 text-xs font-medium text-slate-700">
                  Current password
                  <input
                    aria-describedby={showDisableTotp('totpPassword') ? 'settings-disable-password-error' : undefined}
                    aria-invalid={showDisableTotp('totpPassword')}
                    className={fieldInputClass(showDisableTotp('totpPassword'), 'mt-0')}
                    onChange={(event) => setTotpPassword(event.target.value)}
                    placeholder="Enter your current password"
                    type="password"
                    value={totpPassword}
                  />
                  {showDisableTotp('totpPassword') && (
                    <FieldError id="settings-disable-password-error" message={disableTotpErrors.totpPassword} />
                  )}
                </label>
                <label className="flex flex-col gap-2 text-xs font-medium text-slate-700">
                  Current 2FA code
                  <input
                    aria-describedby={showDisableTotp('totpCode') ? 'settings-disable-totp-error' : undefined}
                    aria-invalid={showDisableTotp('totpCode')}
                    className={fieldInputClass(showDisableTotp('totpCode'), 'mt-0')}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter your 2FA code"
                    onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))}
                    value={totpCode}
                  />
                  {showDisableTotp('totpCode') && (
                    <FieldError id="settings-disable-totp-error" message={disableTotpErrors.totpCode} />
                  )}
                </label>
                <button className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100" disabled={savingTotp} type="submit">
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
