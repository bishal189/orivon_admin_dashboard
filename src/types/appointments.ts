export type AppointmentStatus = 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export type AppointmentStatusFilter = AppointmentStatus | 'ALL'

export interface AppointmentRecord {
  id: string
  reference: string
  name: string
  email: string
  phone?: string | null
  country?: string | null
  role?: string | null
  service?: string | null
  destination?: string | null
  message?: string | null
  preferredDate?: string | null
  status: AppointmentStatus
  notes?: string | null
  source: string
  createdAt: string
  updatedAt: string
  contactedAt?: string | null
  confirmedAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
}

export interface AppointmentStats {
  total: number
  NEW: number
  CONTACTED: number
  CONFIRMED: number
  COMPLETED: number
  CANCELLED: number
}

export type AppointmentInput = {
  name: string
  email: string
  phone?: string | null
  country?: string | null
  role?: string | null
  service?: string | null
  destination?: string | null
  message?: string | null
  preferredDate?: string | null
  status?: AppointmentStatus
  notes?: string | null
  source?: 'website' | 'consultation' | 'admin'
}

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const appointmentStatusStyles: Record<AppointmentStatus, string> = {
  NEW: 'bg-sky-50 text-sky-700',
  CONTACTED: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-rose-50 text-rose-700',
}
