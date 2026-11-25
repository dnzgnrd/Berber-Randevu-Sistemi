export type User = {
  id: number
  name: string
  phone: string
  email: string
  role: 'customer' | 'admin'
  created_at?: string
}

export type Service = {
  id: number
  name: string
  duration_min: number
  price: number
  is_active?: boolean
  sort_order?: number
}

export type Slot = {
  start: string
  end: string
  status: 'available' | 'booked' | 'past'
}

export type Appointment = {
  id: number
  appt_date: string
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  created_at?: string
  service_name: string
  duration_min: number
  price: number
  can_cancel?: boolean
  customer_name?: string
  customer_phone?: string
  customer_email?: string
}

export type ShopSettings = Record<string, string>

export type WorkingHour = {
  weekday: number
  open_time: string
  close_time: string
  is_closed: boolean
}

export type DayOff = {
  id: number
  off_date: string
  note: string | null
}

export type GalleryItem = {
  id: number
  file_path: string
  alt_text: string
  sort_order: number
}

export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = { ok: false; error: string }
