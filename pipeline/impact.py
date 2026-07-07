"""Tournament-wide practical-application leaderboards: which substitutions and
which players moved win probability most, aggregated across all 64 matches.

This is the "for the dugout" angle — not just "when was the match decided"
(MatchPoint) but "which specific decisions and players produced value,"
aggregated the way a coach or scout would actually want it sliced.
"""

MIN_EVENTS_FOR_PLAYER_LEADERBOARD = 1


def _team_relative_delta(entry: dict, home_team: str) -> float:
    """entry['delta'] is the change in the HOME team's win probability;
    flip the sign so it reads as the impact for the team that acted."""
    return entry["delta"] if entry["team"] == home_team else -entry["delta"]


def compute_impact_leaderboards(match_details: list[dict]) -> dict:
    substitutions = []
    player_totals: dict[str, dict] = {}

    for detail in match_details:
        home_team = detail["home_team"]
        for entry in detail["timeline"]:
            if entry.get("event_id") == "kickoff" or not entry.get("annotate"):
                continue

            impact = _team_relative_delta(entry, home_team)
            player = entry.get("player") or "Unknown"

            if entry["event_type"] == "Substitution":
                substitutions.append({
                    "match_id": detail["match_id"],
                    "home_team": home_team,
                    "away_team": detail["away_team"],
                    "stage": detail["stage"],
                    "player": player,
                    "team": entry["team"],
                    "minute": entry["minute"],
                    "impact": round(impact, 1),
                })

            if player == "Unknown" or "(OG)" in player:
                continue
            bucket = player_totals.setdefault(player, {
                "player": player,
                "team": entry["team"],
                "total_abs_impact": 0.0,
                "event_count": 0,
                "matches": set(),
            })
            bucket["total_abs_impact"] += abs(impact)
            bucket["event_count"] += 1
            bucket["matches"].add(detail["match_id"])

    substitutions.sort(key=lambda s: s["impact"], reverse=True)
    best_subs = substitutions[:5]
    worst_subs = sorted(substitutions, key=lambda s: s["impact"])[:5]

    players = [
        {
            "player": b["player"],
            "team": b["team"],
            "total_abs_impact": round(b["total_abs_impact"], 1),
            "event_count": b["event_count"],
            "match_count": len(b["matches"]),
        }
        for b in player_totals.values()
        if b["event_count"] >= MIN_EVENTS_FOR_PLAYER_LEADERBOARD
    ]
    players.sort(key=lambda p: p["total_abs_impact"], reverse=True)

    return {
        "best_substitutions": best_subs,
        "worst_substitutions": worst_subs,
        "top_impact_players": players[:10],
    }
