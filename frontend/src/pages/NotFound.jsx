import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-6 text-4xl text-chalk">No match here.</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-rose">
        That fixture doesn't exist in the 2022 World Cup dataset.
      </p>
      <Link
        to="/"
        className="mt-8 border border-gold/60 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold/10"
      >
        Back to all fixtures
      </Link>
    </div>
  )
}

export default NotFound
