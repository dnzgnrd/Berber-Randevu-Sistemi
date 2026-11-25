import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AdminNotifications } from './AdminNotifications'
import { CustomerNotifications } from './CustomerNotifications'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `min-h-11 inline-flex items-center rounded-full px-3 text-[0.95rem] font-bold ${
    isActive ? 'bg-ink text-bg' : 'text-ink hover:bg-pop/80'
  }`

export function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const hideCustomerBooking = isAdmin

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="font-display text-2xl font-bold italic tracking-tight text-ink md:text-[1.75rem]"
          >
            Bre <span className="text-accent">Berber</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1">
            <NavLink to="/galeri" className={linkClass}>
              Galeri
            </NavLink>
            {!hideCustomerBooking && (
              <NavLink to="/randevu" className={linkClass}>
                Randevu
              </NavLink>
            )}
            {user ? (
              <>
                {!isAdmin && (
                  <NavLink to="/hesabim" className={linkClass}>
                    Randevularım
                  </NavLink>
                )}
                {isAdmin ? <AdminNotifications /> : null}
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="min-h-11 rounded-full px-3 text-[0.95rem] font-bold text-ink-soft hover:bg-white/70 hover:text-ink"
                >
                  Çıkış
                </button>
              </>
            ) : (
              <NavLink to="/giris" className={linkClass}>
                Giriş
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <CustomerNotifications />

      <main key={location.pathname}>
        <Outlet />
      </main>

      <footer className="mt-16 border-t-2 border-ink bg-ink text-bg">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="font-display text-3xl font-bold italic">
            Bre <span className="text-pop">Berber</span>
          </p>
          <p className="mt-3 max-w-md text-bg/75">
            Atatürk Mah. 13. Cad. (Tunceli–Elazığ Yolu), Ender Yapı No: 4, Merkez / Tunceli
          </p>
          <p className="mt-2">
            <a href="tel:+905412136262" className="text-xl font-bold text-pop hover:underline">
              0541 213 62 62
            </a>
          </p>
          <p className="mt-1 text-sm text-bg/60">Pzt–Cmt 09:00–19:00 · Pazar kapalı</p>
        </div>
      </footer>
    </div>
  )
}
