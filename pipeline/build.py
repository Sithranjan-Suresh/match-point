"""Pipeline orchestration: ingest -> win probability -> MatchPoint -> counterfactual -> narrative -> JSON."""
import json
import logging
from pathlib import Path

from ingest import fetch_match_events, get_match_metadata
from matchpoint import compute_counterfactual, decided_on_penalties, detect_matchpoint
from narrative import generate_narrative
from tournament import compute_tournament_summary
from win_probability import build_match_timeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

COMPUTED_DIR = Path(__file__).resolve().parent.parent / "api" / "data" / "computed"

STAGE_ABBR = {
    "Group Stage": "Group",
    "Round of 16": "R16",
    "Quarter-finals": "QF",
    "Semi-finals": "SF",
    "3rd Place Final": "3rd Place",
    "Final": "Final",
}


def build_match(match_id: int, match_row: dict, generate_ai_narrative: bool = True) -> dict:
    """Run the full pipeline for a single match and write match_{id}.json.

    Returns the match_summary dict for inclusion in matches_index.json.
    """
    home_team = match_row["home_team"]
    away_team = match_row["away_team"]
    stage = STAGE_ABBR.get(match_row["competition_stage"], match_row["competition_stage"])
    score_home = int(match_row["home_score"])
    score_away = int(match_row["away_score"])

    events = fetch_match_events(match_id)
    penalties = decided_on_penalties(events)

    result = build_match_timeline(events, home_team, away_team)
    timeline = result["timeline"]

    matchpoint = detect_matchpoint(timeline)
    counterfactual = compute_counterfactual(
        matchpoint, timeline, result["match_events"], result["events_by_id"],
        home_team, away_team, result["max_minute"],
    )

    narrative = ""
    if generate_ai_narrative:
        context = {
            **matchpoint,
            "home_team": home_team,
            "away_team": away_team,
            "stage": stage,
            "score_home": score_home,
            "score_away": score_away,
        }
        try:
            narrative = generate_narrative(context)
        except Exception as exc:
            logger.error("Narrative generation failed for match_id=%s: %s", match_id, exc)

    match_detail = {
        "match_id": match_id,
        "home_team": home_team,
        "away_team": away_team,
        "stage": stage,
        "score_home": score_home,
        "score_away": score_away,
        "decided_on_penalties": penalties,
        "narrative": narrative,
        "matchpoint": {
            **matchpoint,
            "counterfactual_methodology": counterfactual["methodology"],
            "counterfactual_prob_home_at_moment": counterfactual["counterfactual_prob_home_at_moment"],
            "counterfactual_prob_home_final": counterfactual["counterfactual_prob_home_final"],
        },
        "timeline": timeline,
        "counterfactual_timeline": counterfactual["alt_timeline"],
    }

    COMPUTED_DIR.mkdir(parents=True, exist_ok=True)
    with open(COMPUTED_DIR / f"match_{match_id}.json", "w", encoding="utf-8") as f:
        json.dump(match_detail, f, ensure_ascii=False)

    logger.info(
        "Built match_id=%s (%s vs %s): MatchPoint=%s %s at minute %s (delta %.1f)",
        match_id, home_team, away_team, matchpoint["event_type"], matchpoint["player"],
        matchpoint["minute"], matchpoint["delta"],
    )

    return {
        "match_id": match_id,
        "home_team": home_team,
        "away_team": away_team,
        "stage": stage,
        "score_home": score_home,
        "score_away": score_away,
        "decided_on_penalties": penalties,
        "matchpoint_minute": matchpoint["minute"],
        "matchpoint_event_type": matchpoint["event_type"],
        "matchpoint_player": matchpoint["player"],
        "matchpoint_team": matchpoint["team"],
        "matchpoint_delta": matchpoint["delta"],
    }


def build_all() -> list[dict]:
    """Run the pipeline for all 64 World Cup matches and write matches_index.json."""
    metadata = get_match_metadata()
    match_ids = metadata["match_id"].tolist()

    summaries = []
    for i, match_id in enumerate(match_ids, start=1):
        row = metadata[metadata.match_id == match_id].iloc[0].to_dict()
        try:
            summary = build_match(match_id, row)
            summaries.append(summary)
            logger.info("[%d/%d] done", i, len(match_ids))
        except Exception as exc:
            logger.error("[%d/%d] match_id=%s failed: %s", i, len(match_ids), match_id, exc)

    COMPUTED_DIR.mkdir(parents=True, exist_ok=True)
    with open(COMPUTED_DIR / "matches_index.json", "w", encoding="utf-8") as f:
        json.dump(summaries, f, ensure_ascii=False)
    logger.info("Wrote matches_index.json with %d matches", len(summaries))

    tournament_summary = compute_tournament_summary(summaries)
    with open(COMPUTED_DIR / "tournament_summary.json", "w", encoding="utf-8") as f:
        json.dump(tournament_summary, f, ensure_ascii=False)
    logger.info("Wrote tournament_summary.json")

    return summaries


if __name__ == "__main__":
    build_all()
