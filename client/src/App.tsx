import { BrowserRouter, Route, Routes } from 'react-router'
import AuthProvider from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import LogGym from './pages/LogGym'
import LogRun from './pages/LogRun'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/login" element={<AuthPage mode="signin" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/log/running" element={<RequireAuth><LogRun /></RequireAuth>} />
              <Route path="/log/gym" element={<RequireAuth><LogGym /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
