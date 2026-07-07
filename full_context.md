# MatchPoint — full_context.md

## Vision

**One sentence:** MatchPoint reveals the exact moment every World Cup match was decided — and proves that most matches are won or lost before anyone realizes it.

**One paragraph:** MatchPoint is a sports analytics platform that ingests StatsBomb open event data for all 64 matches of the 2022 FIFA World Cup, computes rolling win probability using xG-based Monte Carlo simulation, identifies the single highest-impact event in each match (the "MatchPoint moment"), and surfaces both match-level narratives and tournament-wide findings. It is built for sports journalists and post-match analysts who need data-backed storytelling — not just statistics, but a defensible answer to the question every fan asks after a loss: "Where did it slip away?"

---

## Problem

Sports coverage is dominated by outcome statistics. Goals scored. Possession percentage. Shots on target. These metrics describe what happened but never explain *when* the match was actually decided — and by how much.

Analysts and journalists currently rely on manual review, intuition, and highlight reels to identify turning points. This is slow, subjective, and almost always focuses on the goal rather than the event that made the goal inevitable.

MatchPoint quantifies what analysts already know intuitively: the decisive moment is rarely the goal. It is the missed sitter in minute 23. The yellow card in minute 41. The substitution that shifted momentum. The data exists. Nobody has made it this accessible or this clear.

---

## Target Users

**Primary: Sports journalists** writing post-match analysis, tournament retrospectives, or long-form narratives. They currently spend hours rewatching footage and parsing stat sheets to find a coherent story. MatchPoint gives them a data-backed narrative in seconds.

**Secondary: Coaching analysts** preparing post-match debrief reports. They understand the data but lack a fast, visual tool to surface pivotal events across a full 90+ minutes.

**Tertiary: Fans** who want to understand a match beyond the scoreline — especially for matches they didn't watch.

---

## User Journey

1. User lands on the MatchPoint homepage and sees the headline tournament finding: *"Across 64 World Cup 2022 matches, 71% of decisive moments occurred before the 60th minute — and only 18% were goals."*
2. User sees a tournament heatmap of all 64 matches, each coded by the minute and type of their MatchPoint moment.
3. User selects a match (e.g., France vs Morocco, SF).
4. A full-match timeline loads showing rolling win probability across all 90+ minutes, with events annotated on the curve.
5. The MatchPoint moment is highlighted — the single event with the largest win probability delta.
6. An AI-generated narrative card explains the moment in plain language: what happened, why it mattered, and what the numbers say.
7. A counterfactual panel shows: "If this event had gone the other way, Morocco's win probability would have been X% instead of Y%."
8. User can scrub the timeline, click any event, and see its individual win probability delta.

---

## Core Features (at submission)

- **Tournament overview screen** — aggregate findings across all 64 World Cup 2022 matches, heatmap of MatchPoint moments by minute and event type
- **Match timeline view** — rolling xG-based win probability curve for any selected match, all events annotated
- **MatchPoint moment detection** — algorithmic identification of the single highest win-probability-delta event per match
- **AI narrative card** — Claude-generated plain-language explanation of the MatchPoint moment and its significance
- **Counterfactual simulator** — flips the outcome of the MatchPoint moment and recalculates win probability from that state forward
- **Event explorer** — click any event on the timeline to see its delta, type, player, and minute

---

## Key Differentiators

- **Not a dashboard — a discovery.** Most sports analytics projects present statistics. MatchPoint presents a finding: most matches are decided before fans realize it, and rarely by goals.
- **Statistically defensible.** xG-based Monte Carlo simulation is established methodology, not a black box. Every number is traceable to StatsBomb event data.
- **Counterfactual is calculated, not assumed.** Win probability after a hypothetical is derived by re-running the simulation from the new state — not by manually adjusting a number.
- **Tournament-wide insight layer.** Not one match analyzed deeply — 64 matches analyzed consistently, surfacing aggregate patterns no highlight reel can show.

---

## Technical Overview

- **Data source:** StatsBomb open data — 2022 FIFA World Cup, full event-level data for all 64 matches (free, no API key required)
- **Win probability model:** xG accumulation model with Monte Carlo simulation (Python, `statsbombpy`, `mplsoccer`)
- **Counterfactual engine:** State-based re-simulation — flips the shot outcome (goal vs. no-goal or vice versa) and re-runs the probability model from that game state
- **MatchPoint detection:** Argmax of absolute win probability delta across all events in a match
- **AI narrative:** Claude claude-sonnet-4-6 via Anthropic API, given structured event context, produces a 3–4 sentence plain-language narrative card
- **Frontend:** React + Recharts (probability timeline), Tailwind CSS
- **Backend:** FastAPI (Python), serves pre-computed match data as JSON
- **Deployment:** Frontend on Vercel, backend on Railway or Render (free tier)

---

## Demo Flow

See Phase 4 demo script. Key beats:
1. Open with the tournament-wide finding (hook)
2. Zoom into France vs Morocco SF
3. Show the timeline loading and the probability curve
4. Reveal the MatchPoint moment with AI narrative
5. Flip the counterfactual
6. Return to tournament view to show scale

---

## Success Metrics

- All 64 World Cup 2022 matches have pre-computed MatchPoint moments
- Win probability curve renders for any match within 2 seconds (pre-computed, not live)
- Counterfactual simulation produces a result within 3 seconds
- AI narrative card is contextually accurate and reads naturally
- Tournament overview surfaces at least 3 non-obvious aggregate findings
- Demo runs end-to-end without errors in under 90 seconds

---

## Future Expansion

1. **Multi-tournament analysis** — Extend to 2018 World Cup, Champions League seasons (all in StatsBomb free data) to validate findings across different competition contexts
2. **Event-type breakdown** — Which types of events (missed shots, cards, substitutions) produce the largest average win probability swings? Aggregated across all matches.
3. **Manager decision scoring** — Score each manager's in-match decisions (substitution timing, tactical shifts) by their win probability impact across the tournament
