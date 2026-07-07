"""MatchPoint FastAPI backend: serves pre-computed JSON, no live computation."""
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

DATA_DIR = Path(__file__).resolve().parent / "data" / "computed"

app = FastAPI(title="MatchPoint API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

_tournament_summary: dict = {}
_matches_index: list[dict] = []
_match_details: dict[int, dict] = {}


def _load_data() -> None:
    global _tournament_summary, _matches_index, _match_details

    with open(DATA_DIR / "tournament_summary.json", "r", encoding="utf-8") as f:
        _tournament_summary = json.load(f)

    with open(DATA_DIR / "matches_index.json", "r", encoding="utf-8") as f:
        _matches_index = json.load(f)

    _match_details = {}
    for match_file in DATA_DIR.glob("match_*.json"):
        with open(match_file, "r", encoding="utf-8") as f:
            detail = json.load(f)
        _match_details[detail["match_id"]] = detail


@app.on_event("startup")
def startup() -> None:
    _load_data()


@app.get("/api/tournament")
def get_tournament() -> dict:
    """Return tournament-wide aggregate findings across all 64 matches."""
    return _tournament_summary
