import { useEffect, useRef, useState } from 'react'

// One list drives the menu. Flip `ready` to true when that form exists.
const LOG_OPTIONS = [
  { label: 'Run',   sport: 'running',  ready: true },
  { label: 'Gym',   sport: 'gym',      ready: true },
  { label: 'Bike',  sport: 'cycling',  ready: false },
  { label: 'Swim',  sport: 'swimming', ready: false },
  { label: 'Other', sport: 'other',    ready: false },
]

export default function LogMenu() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // While the menu is open, close it on an outside click or Escape.
  useEffect(() => {
    if (!open) return

    function onMouseDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="log-menu"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        Log ▾
      </button>

      {open && (
        <ul
          id="log-menu"
          className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {LOG_OPTIONS.map((o) => (
            <li key={o.sport}>
              {o.ready ? (
                <a
                  href={`/log/${o.sport}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                >
                  Log {o.label.toLowerCase()}
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  className="block px-4 py-2 text-sm text-gray-400"
                >
                  Log {o.label.toLowerCase()} (soon)
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}