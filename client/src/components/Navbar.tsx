import { Link } from 'react-router'
import { useAuth } from '../auth/auth-context'
import LogMenu from './LogMenu'

export default function Navbar() {
  const { user, status, signOut } = useAuth()

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="flex items-center justify-between gap-4 px-6 py-3">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          AthleteOS
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
          {status === 'authed' ? (
            <>
              <LogMenu />
              <a href="/profile" className="transition-colors hover:text-indigo-600">
                View profile
              </a>
              <a href="/settings" className="transition-colors hover:text-indigo-600">
                Settings
              </a>
              <span className="hidden text-gray-400 sm:inline">{user?.displayName}</span>
              <button type="button" onClick={signOut} className="transition-colors hover:text-indigo-600">
                Sign out
              </button>
            </>
          ) : status === 'anon' ? (
            <>
              <Link to="/login" className="transition-colors hover:text-indigo-600">
                Sign in
              </Link>
              <Link to="/signup" className="transition-colors hover:text-indigo-600">
                Sign up
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  )
}
