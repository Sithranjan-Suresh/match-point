"""Tournament-wide aggregate findings computed across all 64 MatchPoint summaries."""

GOAL_TYPES = {"Goal", "Own Goal"}

MINUTE_BUCKETS = [
    ("0-30", 0, 30),
    ("31-60", 31, 60),
    ("61-90", 61, 90),
    ("90+", 91, 10_000),
]


def _minute_bucket(minute: int) -> str:
    for label, lo, hi in MINUTE_BUCKETS:
        if lo <= minute <= hi:
            return label
    return "90+"


def compute_tournament_summary(summaries: list[dict]) -> dict:
    total = len(summaries)
    not_goals = sum(1 for s in summaries if s["matchpoint_event_type"] not in GOAL_TYPES)
    before_60 = sum(1 for s in summaries if s["matchpoint_minute"] < 60)
    avg_delta = sum(abs(s["matchpoint_delta"]) for s in summaries) / total if total else 0

    minute_distribution = {label: 0 for label, _, _ in MINUTE_BUCKETS}
    for s in summaries:
        minute_distribution[_minute_bucket(s["matchpoint_minute"])] += 1

    event_type_distribution: dict[str, int] = {}
    for s in summaries:
        etype = s["matchpoint_event_type"]
        event_type_distribution[etype] = event_type_distribution.get(etype, 0) + 1

    top_delta_matches = sorted(summaries, key=lambda s: abs(s["matchpoint_delta"]), reverse=True)[:5]
    top_delta_matches = [
        {
            "match_id": s["match_id"],
            "home_team": s["home_team"],
            "away_team": s["away_team"],
            "stage": s["stage"],
            "matchpoint_delta": s["matchpoint_delta"],
        }
        for s in top_delta_matches
    ]

    return {
        "total_matches": total,
        "pct_matchpoints_not_goals": round(100 * not_goals / total, 1) if total else 0,
        "pct_matchpoints_before_60": round(100 * before_60 / total, 1) if total else 0,
        "avg_delta": round(avg_delta, 1),
        "minute_distribution": minute_distribution,
        "event_type_distribution": event_type_distribution,
        "top_delta_matches": top_delta_matches,
    }
