# MatchPoint — engineering_spec.md

---

## Architecture Overview

MatchPoint is a pre-computation-first architecture. All heavy analytics (win probability curves, MatchPoint detection, counterfactual simulation) run offline as a one-time data pipeline before deployment. The live application serves pre-computed JSON — there is no live ML inference in the request path. The only live API call is the Claude narrative generation, which is triggered once per match and cached.

```
┌─────────────────────────────────────────┐
│           DATA PIPELINE (offline)        │
│                                         │
│  StatsBomb Open Data (raw JSON)          │
│          ↓                              │
│  statsbombpy + mplsoccer                │
│  (event parsing, xG calculation)         │
│          ↓                              │
│  Monte Carlo Win Probability Engine      │
│  (per-event rolling probability)         │
│          ↓                              │
│  MatchPoint Detector                    │
│  (argmax of abs delta per match)         │
│          ↓                              │
│  Counterfactual Engine                  │
│  (flip event outcome, re-simulate)       │
│          ↓                              │
│  Claude API (narrative generation)       │
│          ↓                              │
│  matches.json (64 pre-computed matches)  │
│  tournament_summary.json                │
└─────────────────────────────────────────┘
           ↓ (static files served)
┌─────────────────────────────────────────┐
│           BACKEND (FastAPI)              │
│                                         │
│  GET /api/tournament                    │
│  GET /api/matches                       │
│  GET /api/matches/{match_id}            │
│  GET /api/matches/{match_id}/narrative  │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│           FRONTEND (React)              │
│                                         │
│  TournamentView                         │
│  MatchView                              │
│    ├── ProbabilityTimeline (Recharts)   │
│    ├── MatchPointPanel                  │
│    │     ├── NarrativeCard              │
│    │     └── CounterfactualOverlay      │
│    └── EventDetailPanel                │
└─────────────────────────────────────────┘
```

---

## Data Pipeline

### Step 1 — Data Ingestion
- Use `statsbombpy` to load all 64 matches from the 2022 FIFA World Cup competition
- `sb.competitions()` → filter for competition_id=43, season_id=106 (2022 World Cup)
- `sb.matches(competition_id=43, season_id=106)` → list of all 64 match IDs
- `sb.events(match_id=X)` → full event stream for each match

### Step 2 — xG Calculation
- StatsBomb event data includes `shot.statsbomb_xg` on shot events natively — use this directly, do not train a separate xG model
- For non-shot events (cards, substitutions, fouls), xG delta is 0; the probability shift is computed from the cumulative xG state change
- Accumulate xG for home and away teams across the match timeline

### Step 3 — Win Probability Model
- At each event, compute the current xG state: `(home_xg_accumulated, away_xg_accumulated, minute, score_home, score_away)`
- Run Monte Carlo simulation (N=10,000 iterations) over remaining match time, sampling from a Poisson distribution calibrated to the remaining xG expected
- Output: `P(home_win)` at each event timestamp
- Store as array of `{minute, second, event_id, event_type, player, team, prob_home, prob_away, prob_draw, delta}`

**Note on draws:** For simplicity, compute `P(home_win)` and `P(away_win)`. The Y-axis of the chart represents `P(home_win)`. Draw probability is implicit (1 - P(home_win) - P(away_win)) but not displayed on the primary chart to avoid visual complexity.

### Step 4 — MatchPoint Detection
- For each match: `matchpoint_event = argmax(abs(delta))` across all events
- Store the event_id, minute, player, team, event_type, delta, prob_before, prob_after

### Step 5 — Counterfactual Simulation
- Identify the MatchPoint event
- If it is a goal: flip to no-goal (remove the xG realization from score state, treat as a miss)
- If it is a missed shot with high xG: flip to goal (add the xG realization to score state)
- For non-shot MatchPoint events (cards, substitutions): counterfactual is "event does not occur" — re-run from that state without the event's implied momentum shift (use a simplified ±5% probability adjustment as a reasonable proxy, documented in the methodology note)
- Re-run Monte Carlo simulation from the MatchPoint event state forward with the flipped outcome
- Store: `counterfactual_prob_home` at the MatchPoint moment and at final whistle

### Step 6 — Claude Narrative Generation
- Call Claude claude-sonnet-4-6 once per match at pipeline time (not at user request time)
- Prompt structure:

```
System: You are a sports analytics journalist. Write a 3-4 sentence narrative explaining the decisive moment of a football match. Be specific, analytical, and conversational. Do not use filler phrases. State what happened, why the win probability shifted so dramatically, and what it means for how we understand the match result.

User: Match: [Home Team] vs [Away Team], [Stage], 2022 World Cup
Final Score: [Score]
MatchPoint Moment: Minute [X], [Event Type], [Player], [Team]
Win Probability Before: [Home]% / [Away]%
Win Probability After: [Home]% / [Away]%
Delta: [Team]'s probability changed by [Delta]%
```

- Store response as `narrative` string in the match JSON
- Cap at 200 tokens

### Step 7 — Tournament Summary
- Compute across all 64 matches:
  - Distribution of MatchPoint moment minutes (histogram buckets: 0–30, 31–60, 61–90, 90+)
  - Distribution of MatchPoint event types (goal, missed shot, card, substitution, foul)
  - Average win probability delta of MatchPoint moments
  - % of MatchPoint moments that were NOT goals
  - % that occurred before the 60th minute
- Store as `tournament_summary.json`

---

## Data Models

### `match_summary` (stored in `matches_index.json`)
```json
{
  "match_id": 3869685,
  "home_team": "France",
  "away_team": "Morocco",
  "stage": "Semi-Final",
  "score_home": 2,
  "score_away": 0,
  "matchpoint_minute": 5,
  "matchpoint_event_type": "Goal",
  "matchpoint_player": "Theo Hernandez",
  "matchpoint_team": "France",
  "matchpoint_delta": 28.4
}
```

### `match_detail` (stored as `match_{id}.json`)
```json
{
  "match_id": 3869685,
  "home_team": "France",
  "away_team": "Morocco",
  "stage": "Semi-Final",
  "score_home": 2,
  "score_away": 0,
  "narrative": "...",
  "matchpoint": {
    "event_id": "abc123",
    "minute": 5,
    "event_type": "Goal",
    "player": "Theo Hernandez",
    "team": "France",
    "prob_home_before": 42.1,
    "prob_home_after": 70.5,
    "delta": 28.4,
    "counterfactual_prob_home_at_moment": 42.1,
    "counterfactual_prob_home_final": 38.7
  },
  "timeline": [
    {
      "minute": 0,
      "second": 0,
      "event_id": "...",
      "event_type": "Kick Off",
      "player": null,
      "team": "France",
      "prob_home": 51.2,
      "delta": 0.0,
      "annotate": false
    }
    // ... one entry per significant event
  ]
}
```

### `tournament_summary.json`
```json
{
  "total_matches": 64,
  "pct_matchpoints_not_goals": 71.2,
  "pct_matchpoints_before_60": 58.4,
  "avg_delta": 22.7,
  "minute_distribution": {
    "0-30": 18,
    "31-60": 19,
    "61-90": 21,
    "90+": 6
  },
  "event_type_distribution": {
    "Goal": 19,
    "Missed Shot": 24,
    "Yellow Card": 8,
    "Substitution": 7,
    "Foul": 4,
    "Other": 2
  },
  "top_delta_matches": [...]
}
```

---

## API Design

The backend is a thin FastAPI layer serving pre-computed static JSON. No live computation.

### Endpoints

**GET /api/tournament**
- Returns `tournament_summary.json`
- Response: tournament summary object

**GET /api/matches**
- Returns `matches_index.json` (array of all 64 match summaries)
- Query params: `?stage=Semi-Final` (optional filter)
- Response: array of `match_summary` objects

**GET /api/matches/{match_id}**
- Returns full `match_detail` object for the given match
- Response: `match_detail` object

All endpoints return `Content-Type: application/json` and include `Cache-Control: public, max-age=86400` headers (data is static).

No authentication required.

---

## Frontend Architecture

### Stack
- React 18 (Vite)
- Recharts (probability timeline chart)
- Tailwind CSS (styling)
- React Router v6 (routing)

### Routes
```
/                    → TournamentView
/match/:match_id     → MatchView
```

### Component Hierarchy
```
App
├── TournamentView
│   ├── HeroFinding          (headline stat, e.g., "71% of matches decided before 60 min")
│   ├── TournamentStats      (3 aggregate finding cards)
│   └── MatchGrid            (64 match cards, colored by MatchPoint event type)
│         └── MatchCard      (team names, stage, MatchPoint minute badge)
│
└── MatchView
    ├── MatchHeader          (team names, score, stage)
    ├── ProbabilityTimeline  (Recharts LineChart)
    │   ├── ProbabilityLine  (rolling home win probability)
    │   ├── CounterfactualLine (dashed, shown when counterfactual is active)
    │   └── EventDots        (annotated events, MatchPoint highlighted)
    ├── MatchPointPanel
    │   ├── EventSummary     (minute, player, event type, delta badge)
    │   ├── NarrativeCard    (AI-generated text, skeleton while loading)
    │   └── CounterfactualPanel (alternate probability display)
    └── EventDetailPanel     (drawer/tooltip on event click)
```

### State Management
- Use React `useState` and `useEffect` — no Redux or Zustand needed
- `TournamentView`: fetch `/api/matches` on mount, store in local state
- `MatchView`: fetch `/api/matches/:id` on mount, store full match detail in local state
- `selectedEvent`: local state in MatchView, set on timeline dot click
- `counterfactualActive`: boolean, toggled when user engages with counterfactual panel
- No global state required — views are independent

### Chart Implementation (ProbabilityTimeline)
- `Recharts` `LineChart` with `ComposedChart` to support both the probability line and event dot scatter
- X-axis: match minute (0 to max_minute, typically 90–120)
- Y-axis: 0–100 (home win probability %), with reference line at 50
- Primary line: `prob_home` across all timeline entries
- Counterfactual line: rendered only when `counterfactualActive === true`, using a pre-computed alternate probability array (from match detail JSON)
- Event dots: `Scatter` layer on top, colored by event type. MatchPoint dot is larger with a pulsing CSS animation.
- Custom `Tooltip` renders event context on hover

---

## Backend Architecture

### Stack
- Python 3.11
- FastAPI
- `statsbombpy` (data ingestion)
- `numpy` (Monte Carlo simulation)
- `anthropic` Python SDK (narrative generation at pipeline time)

### File Structure
```
/pipeline
  ingest.py          # Download and parse StatsBomb data
  win_probability.py # Monte Carlo simulation engine
  matchpoint.py      # MatchPoint detection + counterfactual
  narrative.py       # Claude API calls
  build.py           # Orchestrates full pipeline, writes JSON output

/api
  main.py            # FastAPI app
  routes/
    tournament.py
    matches.py

/data
  raw/               # StatsBomb raw event JSONs (gitignored, downloaded by pipeline)
  computed/          # Pre-computed match JSONs (committed to repo)
    matches_index.json
    tournament_summary.json
    match_3869685.json
    match_XXXXXXX.json
    ...
```

### Win Probability Engine (win_probability.py)

```
function compute_win_probability(events, current_minute, current_score, remaining_xg_home, remaining_xg_away, N=10000):
  results = []
  for i in range(N):
    sim_goals_home = poisson.rvs(remaining_xg_home)
    sim_goals_away = poisson.rvs(remaining_xg_away)
    final_home = current_score_home + sim_goals_home
    final_away = current_score_away + sim_goals_away
    if final_home > final_away: results.append('home')
    elif final_away > final_home: results.append('away')
    else: results.append('draw')
  return {
    prob_home: count('home') / N,
    prob_away: count('away') / N,
    prob_draw: count('draw') / N
  }
```

Run this function at every shot event (xG changes) and at every score change, card, and substitution to produce the rolling probability timeline.

### Counterfactual Engine (matchpoint.py)

```
function compute_counterfactual(matchpoint_event, timeline_after_matchpoint):
  if matchpoint_event.type == 'Goal':
    # Flip: treat as missed. Revert score, keep xG state as-is
    flipped_score = original_score_before_goal
    re-run win_probability from matchpoint_event.minute forward
      with flipped_score and original remaining_xg
  
  elif matchpoint_event.type in ['Shot', 'Missed Shot'] and xg > 0.3:
    # Flip: treat as goal. Add to score, remove xG from remaining
    flipped_score = score + 1 for shooting team
    re-run win_probability from matchpoint_event.minute forward
      with flipped_score and remaining_xg minus this shot's xg
  
  else:
    # Non-shot event: apply ±5% probability shift proxy
    # Document this clearly as an approximation
    return prob_before ± 0.05
```

---

## External Integrations

### StatsBomb Open Data
- Source: `statsbombpy` Python library (pip install)
- No API key required
- Data downloaded at pipeline run time
- License: Creative Commons — must include attribution in README and UI footer

### Anthropic API (Claude claude-sonnet-4-6)
- Used once per match at pipeline time (64 total calls)
- API key stored as environment variable `ANTHROPIC_API_KEY`
- Results stored in pre-computed JSON — no live API calls from the deployed app
- Estimated cost: 64 matches × ~500 tokens avg = ~32,000 tokens ≈ <$0.10 total

---

## Deployment Strategy

### Frontend
- Build: `vite build` → `/dist`
- Deploy: Vercel (free tier, connect GitHub repo, auto-deploy on push)

### Backend
- Deploy: Railway or Render (free tier)
- FastAPI serves pre-computed JSON from `/data/computed/`
- No database required — all data is flat JSON files

### Pre-computed Data
- Run the full pipeline locally before submission
- Commit all 64 `match_XXXXX.json` files, `matches_index.json`, and `tournament_summary.json` to the repo under `/api/data/computed/`
- Pipeline is committed and documented so judges can re-run it

### Environment Variables
```
ANTHROPIC_API_KEY=sk-...   # Only needed to re-run pipeline, not for deployed app
```

### Submission Checklist
- [ ] Public GitHub repo with MIT license and StatsBomb attribution
- [ ] README includes: what it is, how to run pipeline, how to run locally, live URL
- [ ] Live URL is accessible without login
- [ ] All 64 matches load correctly
- [ ] Claude narrative displays for at least the demo match (France vs Morocco)
- [ ] Counterfactual simulation renders correctly
- [ ] StatsBomb attribution visible in UI footer
