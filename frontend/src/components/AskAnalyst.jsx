import { useState } from 'react'
import { askMatch } from '../api'
import Reveal from './Reveal'

const SUGGESTIONS = [
  'Why was this the turning point?',
  'When was the match still winnable?',
  'What does the counterfactual say?',
]

function AskAnalyst({ matchId }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [asked, setAsked] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function submit(q) {
    const text = (q ?? question).trim()
    if (!text || loading) return
    setLoading(true)
    setError(null)
    setAnswer(null)
    setAsked(text)
    askMatch(matchId, text)
      .then((data) => setAnswer(data.answer))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  return (
    <Reveal>
      <section className="mt-10 border border-maroon-soft bg-night-2/60 p-6 md:p-10">
        <p className="eyebrow eyebrow-rule mb-3">Ask the analyst · live</p>
        <p className="mb-6 max-w-[58ch] text-sm leading-relaxed text-rose">
          Every answer is generated live, grounded only in this match's simulation data — the
          probability timeline, the MatchPoint, and its counterfactual.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={question}
            maxLength={300}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Ask anything about this match"
            className="flex-1 border border-maroon-soft bg-surface px-4 py-3 font-mono text-sm text-chalk placeholder:text-rose/60 focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={() => submit()}
            disabled={loading || !question.trim()}
            className="cursor-pointer border border-gold/60 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold/10 disabled:cursor-default disabled:opacity-40"
          >
            {loading ? 'Consulting…' : 'Ask'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuestion(s)
                submit(s)
              }}
              disabled={loading}
              className="cursor-pointer border border-maroon-soft px-3 py-1.5 font-mono text-[11px] text-rose transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-gold">
            Consulting 10,000 futures…
          </p>
        )}
        {error && (
          <p className="mt-6 font-mono text-sm text-rose">
            {error}
          </p>
        )}
        {answer && (
          <div className="mt-6 border-l-2 border-gold pl-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-rose">“{asked}”</p>
            <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-chalk/90">{answer}</p>
          </div>
        )}
      </section>
    </Reveal>
  )
}

export default AskAnalyst
