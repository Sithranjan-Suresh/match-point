import { useState } from 'react'
import { Link } from 'react-router-dom'

function MatchHeader({ match }) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
      .catch(() => window.prompt('Copy this link:', window.location.href))
      .finally(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-purple-600 hover:underline">
          ← All matches
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="text-sm text-slate-400 hover:text-purple-600"
        >
          {copied ? 'Link copied!' : 'Share this MatchPoint'}
        </button>
      </div>
      <div className="mt-2 flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          {match.home_team} {match.score_home} — {match.score_away} {match.away_team}
        </h1>
        <span className="text-sm font-medium text-slate-400">{match.stage}</span>
      </div>
      {match.decided_on_penalties && (
        <p className="mt-1 text-sm text-slate-500">
          This match was decided on penalties — MatchPoint reflects the highest-impact event in
          regulation/extra time.
        </p>
      )}
    </div>
  )
}

export default MatchHeader
