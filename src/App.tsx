import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ProfilePage from '@/pages/ProfilePage'
import PublicationsPage from '@/pages/PublicationsPage'
import ProjectsPage from '@/pages/ProjectsPage'
import TrainingPage from '@/pages/TrainingPage'
import SupervisionPage from '@/pages/SupervisionPage'
import CommunicationsPage from '@/pages/CommunicationsPage'
import PatentsPage from '@/pages/PatentsPage'
import ServicesPage from '@/pages/ServicesPage'
import CollaborationsPage from '@/pages/CollaborationsPage'
import ExpertisePage from '@/pages/ExpertisePage'
import ForecastsPage from '@/pages/ForecastsPage'
import AdminPage from '@/pages/AdminPage'
import LoadingScreen from '@/components/ui/LoadingScreen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (role !== 'admin' && role !== 'direction') return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Private routes */}
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="publications" element={<PublicationsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="supervision" element={<SupervisionPage />} />
            <Route path="communications" element={<CommunicationsPage />} />
            <Route path="patents" element={<PatentsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="collaborations" element={<CollaborationsPage />} />
            <Route path="expertise" element={<ExpertisePage />} />
            <Route path="forecasts" element={<ForecastsPage />} />
            <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm font-medium',
          success: { duration: 3000 },
          error: { duration: 5000 },
        }}
      />
    </QueryClientProvider>
  )
}
