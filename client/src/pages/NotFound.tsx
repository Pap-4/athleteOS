import { Link } from 'react-router'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-gray-500">That page doesn't exist (yet).</p>
      <Link to="/" className="mt-4 inline-block font-medium text-indigo-600 hover:text-indigo-500">
        Back to the dashboard
      </Link>
    </main>
  )
}
