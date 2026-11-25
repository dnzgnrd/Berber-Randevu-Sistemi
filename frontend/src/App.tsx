import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AccountPage } from './pages/AccountPage'
import { BookPage } from './pages/BookPage'
import { GalleryPage } from './pages/GalleryPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { DayPage } from './pages/admin/DayPage'
import { GalleryAdminPage } from './pages/admin/GalleryAdminPage'
import { HoursPage } from './pages/admin/HoursPage'
import { AllAppointmentsPage } from './pages/admin/AllAppointmentsPage'
import { PendingPage } from './pages/admin/PendingPage'
import { ServicesPage } from './pages/admin/ServicesPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="galeri" element={<GalleryPage />} />
              <Route path="randevu" element={<BookPage />} />
              <Route path="giris" element={<LoginPage />} />
              <Route path="kayit" element={<RegisterPage />} />
              <Route path="hesabim" element={<AccountPage />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<PendingPage />} />
                <Route path="tumu" element={<AllAppointmentsPage />} />
                <Route path="gun" element={<DayPage />} />
                <Route path="saatler" element={<HoursPage />} />
                <Route path="hizmetler" element={<ServicesPage />} />
                <Route path="galeri" element={<GalleryAdminPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
