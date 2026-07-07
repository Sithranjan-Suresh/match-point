"""StatsBomb data ingestion for the 2022 FIFA World Cup (competition_id=43, season_id=106)."""
import json
import logging
from pathlib import Path

import pandas as pd
from statsbombpy import sb

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

COMPETITION_ID = 43
SEASON_ID = 106
RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"


def get_match_ids() -> list[int]:
    """Return all match IDs for the 2022 World Cup."""
    matches = sb.matches(competition_id=COMPETITION_ID, season_id=SEASON_ID)
    match_ids = matches["match_id"].tolist()
    logger.info("Found %d matches for competition_id=%s season_id=%s", len(match_ids), COMPETITION_ID, SEASON_ID)
    return match_ids


def get_match_metadata() -> pd.DataFrame:
    """Return the full matches dataframe (teams, stage, score, etc.) for the tournament."""
    return sb.matches(competition_id=COMPETITION_ID, season_id=SEASON_ID)


def fetch_match_events(match_id: int) -> list[dict]:
    """Fetch and cache raw event JSON for a single match."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = RAW_DIR / f"events_{match_id}.json"
    if cache_path.exists():
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)

    events_df = sb.events(match_id=match_id)
    events = json.loads(events_df.to_json(orient="records"))
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(events, f)
    logger.info("Cached %d events for match_id=%s", len(events), match_id)
    return events


def fetch_all_matches() -> None:
    """Download and cache event data for all 64 World Cup matches."""
    match_ids = get_match_ids()
    for i, match_id in enumerate(match_ids, start=1):
        try:
            events = fetch_match_events(match_id)
            logger.info("[%d/%d] match_id=%s -> %d events", i, len(match_ids), match_id, len(events))
        except Exception as exc:
            logger.error("[%d/%d] match_id=%s failed: %s", i, len(match_ids), match_id, exc)


if __name__ == "__main__":
    fetch_all_matches()
