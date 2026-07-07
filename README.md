# MatchPoint

MatchPoint reveals the exact moment every 2022 FIFA World Cup match was decided — and shows that most matches are won or lost before anyone realizes it.

It ingests StatsBomb open event data for all 64 matches of the 2022 World Cup, computes rolling win probability using an xG-based Monte Carlo simulation, identifies the single highest-impact event in each match (the "MatchPoint moment"), generates a plain-language AI narrative for it, and simulates the counterfactual outcome had that event gone the other way.

## Architecture

- `/pipeline` — offline data pipeline (ingestion, win probability, MatchPoint detection, counterfactual simulation, AI narrative generation)
- `/api` — FastAPI backend serving pre-computed JSON (`/api/data/computed/`)
- `/frontend` — React + Vite + Tailwind + Recharts frontend

All heavy computation happens offline in the pipeline. The deployed app only serves static pre-computed JSON.

## Running the pipeline

```
cd pipeline
pip install -r ../requirements.txt
cp ../.env.example ../.env   # fill in GROQ_API_KEY
python build.py
```

This downloads StatsBomb data, runs the win-probability/MatchPoint/counterfactual computations, generates narratives via the Groq API, and writes JSON output to `api/data/computed/`.

## Running the backend locally

```
cd api
pip install -r ../requirements.txt
uvicorn main:app --reload
```

## Running the frontend locally

```
cd frontend
npm install
npm run dev
```

## Data attribution

Match event data provided by [StatsBomb](https://statsbomb.com/what-we-do/hub/free-data/) open data, licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0.

## License

MIT
