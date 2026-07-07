function Footer() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl border-t border-maroon-soft px-6 py-10 md:px-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <span className="display text-xl text-chalk">
          Match<span className="text-gold">Point</span>
        </span>
        <p className="font-mono text-[11px] leading-relaxed tracking-wide text-rose">
          Match event data by{' '}
          <a
            href="https://statsbomb.com/what-we-do/hub/free-data/"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-maroon underline-offset-4 transition-colors hover:text-gold"
          >
            StatsBomb
          </a>{' '}
          open data · CC BY-NC-SA 4.0
        </p>
      </div>
    </footer>
  )
}

export default Footer
