import LogMenu from './LogMenu'

export default function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="flex items-center justify-between gap-4 px-6 py-3">
        <a href="/" className="text-xl font-bold text-indigo-600">
          AthleteOS
        </a>

        <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <LogMenu />
          <a href="/profile" className="transition-colors hover:text-indigo-600">
            View profile
          </a>
          <a href="/settings" className="transition-colors hover:text-indigo-600">
            Settings
          </a>
        </div>
      </nav>
    </header>
  )
}