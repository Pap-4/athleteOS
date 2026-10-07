export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="flex flex-col items-center justify-between gap-2 px-6 py-4 text-sm text-gray-500 sm:flex-row">
        <p>
          <span className="font-semibold text-indigo-600">AthleteOS</span> © {year}
        </p>

        <div className="flex items-center gap-4">
          <p>Built by Michael Papanikolaou</p>
          <a
            href="https://github.com/Pap-4/athleteOS"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-indigo-600"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}