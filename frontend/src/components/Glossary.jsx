import { useState } from 'react'

const TERMS = {
  xG: 'Expected Goals — the quality of a chance, from 0 to 1. A tap-in from a yard out might be 0.9; a speculative shot from 30 yards might be 0.03.',
  'win probability': "A team's chance of winning from the current score and time left, estimated by simulating the rest of the match thousands of times.",
  'Monte Carlo simulation': 'Instead of guessing, the computer plays out the rest of the match 10,000 times with randomized outcomes and counts how often each team wins.',
}

/* A small inline glossary so "xG," "win probability," and "Monte Carlo"
   never appear unexplained to a reader without an analytics background —
   the whole point of the product is to be readable by a non-technical fan. */
function Glossary({ term }) {
  const [open, setOpen] = useState(false)
  const definition = TERMS[term]
  if (!definition) return <>{term}</>

  return (
    <span className="relative inline-block border-b border-dotted border-gold/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="cursor-help text-gold"
      >
        {term}
      </button>
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 border border-maroon bg-surface p-3 text-left font-mono text-[11px] font-normal leading-relaxed normal-case tracking-normal text-chalk"
        >
          {definition}
        </span>
      )}
    </span>
  )
}

export default Glossary
