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

# Equivalent "prior minutes" of league-average play blended into the observed
# scoring rate. Without this, a single early shot (e.g. one shot's worth of xG
# at minute 7) makes the observed rate (xg / elapsed) wildly noisy when
# extrapolated over the remaining match — a small denominator amplifies any
# single shot into an implausible full-match pace. Shrinking toward the prior
# keeps early-match probability estimates stable until enough shots accumulate
# for the observed rate to be trustworthy.
PRIOR_MINUTES = 30


def _projected_rate(xg: float, elapsed_minutes: int) -> float:
    prior_xg = AVG_XG_PER_TEAM_90 / 90 * PRIOR_MINUTES
    return (xg + prior_xg) / (elapsed_minutes + PRIOR_MINUTES)


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


def is_trigger_event(event: dict) -> bool:
    card = event.get("bad_behaviour_card") or event.get("foul_committed_card")
    return event.get("type") in ("Shot", "Own Goal For", "Substitution") or bool(card)


def prepare_match_events(events: list[dict]) -> tuple[list[dict], dict, int]:
    """Filter to regulation + extra time (exclude penalty shootout), sort, and index by id."""
    match_events = [e for e in events if (e.get("period") or 1) <= 4]
    match_events.sort(key=lambda e: (e.get("period") or 0, e.get("minute") or 0, e.get("second") or 0, e.get("index") or 0))
    max_minute = max((e.get("minute") or 0 for e in match_events), default=90)
    events_by_id = {e.get("id"): e for e in match_events}
    return match_events, events_by_id, max_minute


def _own_goal_scorer(event: dict, events_by_id: dict) -> str:
    related_ids = event.get("related_events") or []
    scorer = next(
        (events_by_id[rid].get("player") for rid in related_ids
         if rid in events_by_id and events_by_id[rid].get("type") == "Own Goal Against"),
        None,
    )
    return scorer or "Unknown"


def walk_events(
    match_events: list[dict],
    events_by_id: dict,
    home_team: str,
    away_team: str,
    max_minute: int,
    xg_home: float = 0.0,
    xg_away: float = 0.0,
    score_home: int = 0,
    score_away: int = 0,
) -> list[dict]:
    """Walk a (sub)sequence of match events, recomputing win probability at each
    trigger event, starting from the given xG/score state.
    """
    entries = []

    for event in match_events:
        if not is_trigger_event(event):
            continue

        etype = event.get("type")
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

        remaining = max(max_minute - minute, 0)
        rate_home = _projected_rate(xg_home, minute)
        rate_away = _projected_rate(xg_away, minute)

        probs = compute_win_probability(
            score_home, score_away, rate_home * remaining, rate_away * remaining
        )

        player = event.get("player") or "Unknown"
        if etype == "Own Goal For":
            # The scoring credit goes to `team`, but the own-goal was committed
            # by a player on the opposing side (linked via related_events) —
            # label them per the edge-case spec.
            player = f"{_own_goal_scorer(event, events_by_id)} (OG)"

        entries.append({
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
            "xg_home": round(xg_home, 3),
            "xg_away": round(xg_away, 3),
            "annotate": annotate,
        })

    return entries


def build_match_timeline(events: list[dict], home_team: str, away_team: str) -> dict:
    """Walk a match's events and produce the rolling win-probability timeline.

    Returns a dict with `timeline` (list of per-event probability snapshots)
    and `max_minute` (last minute of regulation/extra time, excluding penalties).
    """
    match_events, events_by_id, max_minute = prepare_match_events(events)

    # Kickoff prior: no shot data yet, use league-average expected goals.
    kickoff_probs = compute_win_probability(0, 0, AVG_XG_PER_TEAM_90, AVG_XG_PER_TEAM_90)
    timeline = [{
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
        "xg_home": 0.0,
        "xg_away": 0.0,
        "annotate": False,
    }]

    timeline.extend(walk_events(match_events, events_by_id, home_team, away_team, max_minute))

    prev_prob_home = timeline[0]["prob_home"]
    for entry in timeline:
        entry["delta"] = round(entry["prob_home"] - prev_prob_home, 2)
        prev_prob_home = entry["prob_home"]

    return {"timeline": timeline, "max_minute": max_minute, "match_events": match_events, "events_by_id": events_by_id}
