import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Navbar />
      <div className="flex-1">
        <Dashboard />
      </div>
      <Footer />
    </div>
  )
}