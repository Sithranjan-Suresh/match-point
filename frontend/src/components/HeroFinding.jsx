function HeroFinding({ summary }) {
  if (!summary) return null

  return (
    <div className="mb-10">
      <p className="text-sm font-medium uppercase tracking-wide text-purple-600">
        2022 FIFA World Cup — {summary.total_matches} matches analyzed
      </p>
      <h1 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
        {summary.pct_matchpoints_before_60}% of decisive moments happened before the 60th
        minute — and only {(100 - summary.pct_matchpoints_not_goals).toFixed(1)}% of them
        were goals.
      </h1>
      <p className="mt-3 text-slate-500 max-w-2xl">
        Most matches are won or lost long before the scoreline reflects it. MatchPoint finds
        the exact moment — averaging a {summary.avg_delta}-point swing in win probability.
      </p>
    </div>
  )
}

export default HeroFinding
