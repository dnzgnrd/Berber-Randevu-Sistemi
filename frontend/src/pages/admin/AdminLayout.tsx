import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const tab = ({ isActive }: { isActive: boolean }) =>
  `min-h-11 whitespace-nowrap px-3 py-2 text-sm ${
    isActive ? 'border-b-2 border-accent font-semibold text-ink' : 'text-ink-soft hover:text-ink'
  }`

export function AdminLayout() {
  const { user, loading } = useAuth()

  if (!loading && (!user || user.role !== 'admin')) {
    return <Navigate to="/giris?next=/admin" replace />
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl text-ink">Admin</h1>
      <p className="mt-1 text-sm text-ink-soft">Randevu onayı, takvim ve dükkan ayarları.</p>
      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        <NavLink to="/admin" end className={tab}>
          Bekleyenler
        </NavLink>
        <NavLink to="/admin/tumu" className={tab}>
          Tüm randevular
        </NavLink>
        <NavLink to="/admin/gun" className={tab}>
          Günlük
        </NavLink>
        <NavLink to="/admin/saatler" className={tab}>
          Saatler
        </NavLink>
        <NavLink to="/admin/hizmetler" className={tab}>
          Hizmetler
        </NavLink>
        <NavLink to="/admin/galeri" className={tab}>
          Galeri
        </NavLink>
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  )
}
