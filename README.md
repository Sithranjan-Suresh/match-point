# MatchPoint

**The match was decided before you knew it.**

MatchPoint re-simulates every shot, card, and substitution of all 64 matches of the 2022 FIFA
World Cup — 10,000 Monte Carlo futures at a time — to find the single moment each match could
not come back from. Then it flips that moment and shows you the timeline that never happened.

## Findings

Across all 64 matches of Qatar 2022:

- **73.4% of decisive moments arrived before the 60th minute.** Only 2 of 64 matches were
  decided after the 90th.
- **1 in 6 matches turned on a chance that was missed** — the decisive moment never touched
  the scoreboard.
- The average MatchPoint swung win probability by **38.3 points** in a single moment.
- The biggest swing of the tournament: **86.5 points**, South Korea v Portugal, Hee-Chan
  Hwang's 90th-minute winner. The Final makes the top three — Mbappé's 117th-minute
  equaliser swung it **79.6 points**.

## What it does

- **Tournament view** — headline findings, and the *Decisive Minute Strip*: all 64 MatchPoints
  plotted on a 0'–120' axis, tick height encoding swing size, gold for goals, rose for
  everything else
- **Match view** — the full rolling win-probability curve with every significant event
  annotated, the MatchPoint highlighted with a pulsing gold marker
- **Counterfactual** — flip the MatchPoint (goal → miss, miss → goal) and watch the
  re-simulated alternate timeline diverge on the chart
- **AI narrative** — a plain-language explanation of why the moment mattered, generated per
  match at pipeline time
- **Ask the analyst** — live Q&A about any match, grounded strictly in that match's
  simulation data

## How it works

```
StatsBomb open data (all 64 matches, full event streams)
        │
        ▼
xG state tracking ── at every shot, card, and substitution:
        │             10,000 Poisson-sampled futures of the remaining match,
        ▼             rates blended with a league-average prior for stability
rolling win-probability timeline
        │
        ▼
MatchPoint detection ── argmax |Δ win probability| across all events
        │
        ▼
counterfactual ── flip the outcome, re-simulate the rest of the match
        │
        ▼
AI narrative (Groq / Llama 3.3 70B) → pre-computed JSON, served statically
```

All heavy computation happens offline in the pipeline; the deployed app serves pre-computed
JSON. The only live inference is the "Ask the analyst" endpoint. Every number is traceable to
public event data — no black box.

## Repository layout

- `/pipeline` — offline pipeline: ingestion, Monte Carlo win-probability engine, MatchPoint
  detection, counterfactual simulation, narrative generation
- `/api` — FastAPI backend: three static-JSON endpoints plus the live `/ask` endpoint
- `/frontend` — React + Vite + Tailwind + Recharts

## Running it

**Pipeline** (only needed to regenerate data — output is committed):

```
pip install -r requirements.txt
cp .env.example .env   # add your GROQ_API_KEY
cd pipeline && python build.py
```

**Backend:**

```
pip install -r requirements.txt
cd api && uvicorn main:app --reload
```

`GROQ_API_KEY` is only required for the "Ask the analyst" endpoint; everything else serves
pre-computed data and works without it.

**Frontend:**

```
cd frontend
npm install
npm run dev
```

## Methodology notes

- Shot quality uses StatsBomb's native `shot_statsbomb_xg` — no re-trained xG model
- Win probability at each event: Poisson-sampled goals over the remaining minutes, with the
  observed scoring rate shrunk toward a league-average prior (~30 equivalent minutes) so a
  single early shot can't distort the projection
- Penalty shootouts are excluded from the model; affected matches are flagged and the
  MatchPoint reflects regulation + extra time
- Counterfactuals for non-shot moments (no score to flip) use a documented ±5-point
  adjustment instead of re-simulation, and the UI says so

## Data attribution

Match event data provided by [StatsBomb](https://statsbomb.com/what-we-do/hub/free-data/)
open data, licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0.

## License

MIT
