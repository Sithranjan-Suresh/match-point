"""xG-based Monte Carlo win probability engine."""
import numpy as np

RNG = np.random.default_rng()


def compute_win_probability(
    score_home: int,
    score_away: int,
    remaining_xg_home: float,
    remaining_xg_away: float,
    n: int = 10000,
) -> dict:
    """Simulate the remainder of a match N times via Poisson-sampled goals.

    remaining_xg_home/away is the expected additional goals for each team
    from the current state to full time, used as the Poisson rate parameter.
    """
    remaining_xg_home = max(remaining_xg_home, 0.0)
    remaining_xg_away = max(remaining_xg_away, 0.0)

    sim_goals_home = RNG.poisson(remaining_xg_home, size=n)
    sim_goals_away = RNG.poisson(remaining_xg_away, size=n)

    final_home = score_home + sim_goals_home
    final_away = score_away + sim_goals_away

    home_wins = int(np.sum(final_home > final_away))
    away_wins = int(np.sum(final_away > final_home))
    draws = n - home_wins - away_wins

    return {
        "prob_home": round(100 * home_wins / n, 2),
        "prob_away": round(100 * away_wins / n, 2),
        "prob_draw": round(100 * draws / n, 2),
    }


# League-average expected goals per team for a full 90 minutes, used as the
# kickoff prior before any shot data exists for the match.
AVG_XG_PER_TEAM_90 = 1.3


def _event_label(event: dict) -> str:
    if event.get("type") == "Shot":
        return "Goal" if event.get("shot_outcome") == "Goal" else "Missed Shot"
    if event.get("type") == "Own Goal For":
        return "Own Goal"
    card = event.get("bad_behaviour_card") or event.get("foul_committed_card")
    if card:
        return card
    if event.get("type") == "Substitution":
        return "Substitution"
    return event.get("type", "Other")


def build_match_timeline(events: list[dict], home_team: str, away_team: str) -> dict:
    """Walk a match's events and produce the rolling win-probability timeline.

    Returns a dict with `timeline` (list of per-event probability snapshots)
    and `max_minute` (last minute of regulation/extra time, excluding penalties).
    """
    # Exclude the penalty shootout (period 5) — win probability is modeled on
    # regulation + extra time only, per the product spec's penalty edge case.
    match_events = [e for e in events if (e.get("period") or 1) <= 4]
    match_events.sort(key=lambda e: (e.get("period") or 0, e.get("minute") or 0, e.get("second") or 0, e.get("index") or 0))

    max_minute = max((e.get("minute") or 0 for e in match_events), default=90)

    events_by_id = {e.get("id"): e for e in match_events}

    xg_home = 0.0
    xg_away = 0.0
    score_home = 0
    score_away = 0

    timeline = []

    # Kickoff prior: no shot data yet, use league-average expected goals.
    kickoff_probs = compute_win_probability(0, 0, AVG_XG_PER_TEAM_90, AVG_XG_PER_TEAM_90)
    timeline.append({
        "minute": 0,
        "second": 0,
        "event_id": "kickoff",
        "event_type": "Kick Off",
        "player": None,
        "team": home_team,
        "prob_home": kickoff_probs["prob_home"],
        "prob_away": kickoff_probs["prob_away"],
        "prob_draw": kickoff_probs["prob_draw"],
        "score_home": 0,
        "score_away": 0,
        "annotate": False,
    })

    for event in match_events:
        etype = event.get("type")
        card = event.get("bad_behaviour_card") or event.get("foul_committed_card")
        is_trigger = etype in ("Shot", "Own Goal For", "Substitution") or bool(card)
        if not is_trigger:
            continue

        team = event.get("team")
        minute = event.get("minute") or 0
        second = event.get("second") or 0
        xg = event.get("shot_statsbomb_xg") or 0.0

        annotate = True

        if etype == "Shot":
            if team == home_team:
                xg_home += xg
            else:
                xg_away += xg
            if event.get("shot_outcome") == "Goal":
                if team == home_team:
                    score_home += 1
                else:
                    score_away += 1
            elif xg < 0.01:
                # Low-danger misses are excluded from annotation to avoid chart noise.
                annotate = False
        elif etype == "Own Goal For":
            if team == home_team:
                score_home += 1
            else:
                score_away += 1

        elapsed = max(minute, 1)
        remaining = max(max_minute - minute, 0)
        rate_home = max(xg_home / elapsed, AVG_XG_PER_TEAM_90 / 90)
        rate_away = max(xg_away / elapsed, AVG_XG_PER_TEAM_90 / 90)

        probs = compute_win_probability(
            score_home, score_away, rate_home * remaining, rate_away * remaining
        )

        player = event.get("player") or "Unknown"
        if etype == "Own Goal For":
            # The scoring credit goes to `team`, but the own-goal was committed
            # by a player on the opposing side (linked via related_events) —
            # label them per the edge-case spec.
            related_ids = event.get("related_events") or []
            scorer = next(
                (events_by_id[rid].get("player") for rid in related_ids
                 if rid in events_by_id and events_by_id[rid].get("type") == "Own Goal Against"),
                None,
            )
            player = f"{scorer or 'Unknown'} (OG)"

        timeline.append({
            "minute": minute,
            "second": second,
            "event_id": event.get("id"),
            "event_type": _event_label(event),
            "player": player,
            "team": team,
            "prob_home": probs["prob_home"],
            "prob_away": probs["prob_away"],
            "prob_draw": probs["prob_draw"],
            "score_home": score_home,
            "score_away": score_away,
            "annotate": annotate,
        })

    prev_prob_home = timeline[0]["prob_home"]
    for entry in timeline:
        entry["delta"] = round(entry["prob_home"] - prev_prob_home, 2)
        prev_prob_home = entry["prob_home"]

    return {"timeline": timeline, "max_minute": max_minute}
