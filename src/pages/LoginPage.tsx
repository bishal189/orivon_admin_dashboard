import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import { api, ApiError, type AuthUser } from '../api/client'

interface LoginPageProps {
  onAuthenticated: (user: AuthUser) => void
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [totp, setTotp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [attempted, setAttempted] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const passwordValid = password.length >= 10
  const totpValid = !totp || /^\d{6}$/.test(totp)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setAttempted(true)
    if (!emailValid || !passwordValid || !totpValid) return

    setSubmitting(true)
    try {
      const result = await api.login(email.trim(), password, totp.trim() || undefined)
      toast.success(result.message)
      onAuthenticated(result.user)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in'
      toast.error(message)
      if (error instanceof ApiError && error.status === 401) setTotp('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f7faf8_0%,#edf4f0_48%,#f8faf9_100%)] px-4 py-10">
      <div className="pointer-events-none absolute -left-36 -top-36 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-100/35 blur-3xl" />
      <section className="relative w-full max-w-md rounded-2xl border border-white/80 bg-white/95 p-7 shadow-[0_24px_70px_rgba(15,54,44,0.13)] ring-1 ring-slate-900/5 backdrop-blur sm:p-9">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-[#0b1f3a]">
            Administrator <span className="text-[#00a8ab]">sign in</span>
          </h1>
          <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-[#082d70] to-[#00a8ab]" />
        </div>

        <form className="space-y-5" noValidate onSubmit={submit}>
          <label className="block text-xs font-medium text-slate-700">
            Email
            <span className="relative mt-1.5 block">
              <Mail className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${attempted && !emailValid ? 'text-red-500' : 'text-slate-400'}`} />
              <input
                aria-describedby={attempted && !emailValid ? 'email-error' : undefined}
                aria-invalid={attempted && !emailValid}
                autoComplete="email"
                className={`w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none transition ${attempted && !emailValid ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-3 focus:ring-red-100' : 'border-slate-200 focus:border-brand-500 focus:ring-3 focus:ring-brand-100'}`}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@orivon.ae"
                required
                type="email"
                value={email}
              />
            </span>
            {attempted && !emailValid && <span className="mt-1.5 block text-[11px] font-normal text-red-600" id="email-error">Enter a valid email address.</span>}
          </label>

          <label className="block text-xs font-medium text-slate-700">
            Password
            <span className="relative mt-1.5 block">
              <LockKeyhole className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${attempted && !passwordValid ? 'text-red-500' : 'text-slate-400'}`} />
              <input
                aria-describedby={attempted && !passwordValid ? 'password-error' : undefined}
                aria-invalid={attempted && !passwordValid}
                autoComplete="current-password"
                className={`w-full rounded-lg border py-2.5 pl-10 pr-11 text-sm outline-none transition ${attempted && !passwordValid ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-3 focus:ring-red-100' : 'border-slate-200 focus:border-brand-500 focus:ring-3 focus:ring-brand-100'}`}
                minLength={10}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
            {attempted && !passwordValid && <span className="mt-1.5 block text-[11px] font-normal text-red-600" id="password-error">Password must contain at least 10 characters.</span>}
          </label>

          <label className="block text-xs font-medium text-slate-700">
            Two-factor code <span className="font-normal text-slate-400">(if enabled)</span>
            <input
              aria-describedby={attempted && !totpValid ? 'totp-error' : undefined}
              aria-invalid={attempted && !totpValid}
              autoComplete="one-time-code"
              className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm tracking-[0.25em] outline-none transition ${attempted && !totpValid ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-3 focus:ring-red-100' : 'border-slate-200 focus:border-brand-500 focus:ring-3 focus:ring-brand-100'}`}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setTotp(event.target.value.replace(/\D/g, ''))}
              pattern="\d{6}"
              placeholder="000000"
              value={totp}
            />
            {attempted && !totpValid && <span className="mt-1.5 block text-[11px] font-normal tracking-normal text-red-600" id="totp-error">Enter the complete 6-digit code.</span>}
          </label>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#082d70] to-[#00a8ab] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#00a8ab] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Protected by secure authentication
        </div>
      </section>
    </main>
  )
}
