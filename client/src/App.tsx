import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard' 

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <Dashboard />
    </div>
  )
}