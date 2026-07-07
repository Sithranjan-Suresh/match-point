function Footer() {
  return (
    <footer className="max-w-5xl mx-auto px-8 py-6 text-xs text-slate-400 border-t border-slate-100 mt-10">
      Match event data provided by{' '}
      <a
        href="https://statsbomb.com/what-we-do/hub/free-data/"
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-slate-600"
      >
        StatsBomb
      </a>{' '}
      open data, licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0.
    </footer>
  )
}

export default Footer
