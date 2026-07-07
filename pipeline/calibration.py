"""Model validation: is the win-probability engine actually calibrated?

A model that says "70% chance to win" is only trustworthy if teams given a
70% chance actually win about 70% of the time. This checks that directly
against real outcomes, across every annotated event of all 64 matches —
the closest thing to a backtest this project has room for.

Ground truth is the regulation + extra-time scoreline (score_home vs
score_away), not the post-penalty result — the model is explicitly blind to
penalty shootouts (see decided_on_penalties), so that's the correct target
to validate against, not "who lifted the trophy."
"""

BUCKET_WIDTH = 10


def _outcome(detail: dict) -> str:
    if detail["score_home"] > detail["score_away"]:
        return "home"
    if detail["score_home"] < detail["score_away"]:
        return "away"
    return "draw"


def compute_calibration(match_details: list[dict]) -> dict:
    buckets: dict[int, dict] = {
        b: {"count": 0, "sum_predicted": 0.0, "home_wins": 0}
        for b in range(0, 100, BUCKET_WIDTH)
    }

    for detail in match_details:
        outcome = _outcome(detail)
        for entry in detail["timeline"]:
            if entry.get("event_id") == "kickoff":
                continue
            prob_home = entry["prob_home"]
            bucket = min(int(prob_home // BUCKET_WIDTH) * BUCKET_WIDTH, 90)
            b = buckets[bucket]
            b["count"] += 1
            b["sum_predicted"] += prob_home
            if outcome == "home":
                b["home_wins"] += 1

    curve = []
    for bucket_start, b in sorted(buckets.items()):
        if b["count"] == 0:
            continue
        curve.append({
            "bucket": f"{bucket_start}-{bucket_start + BUCKET_WIDTH}%",
            "count": b["count"],
            "mean_predicted": round(b["sum_predicted"] / b["count"], 1),
            "actual_home_win_pct": round(100 * b["home_wins"] / b["count"], 1),
        })

    total_points = sum(b["count"] for b in buckets.values())
    mean_abs_error = (
        sum(abs(c["mean_predicted"] - c["actual_home_win_pct"]) * c["count"] for c in curve) / total_points
        if total_points else 0.0
    )

    return {
        "curve": curve,
        "total_data_points": total_points,
        "mean_absolute_calibration_error": round(mean_abs_error, 1),
    }
