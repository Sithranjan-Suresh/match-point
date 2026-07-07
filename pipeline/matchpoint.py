"""MatchPoint detection and counterfactual simulation."""
from win_probability import _projected_rate, compute_win_probability, walk_events

HIGH_XG_MISS_THRESHOLD = 0.3
NON_SHOT_PROXY_SHIFT = 5.0


def decided_on_penalties(events: list[dict]) -> bool:
    """A period 5 in the raw event stream indicates a penalty shootout."""
    return any((e.get("period") or 0) == 5 for e in events)


def detect_matchpoint(timeline: list[dict]) -> dict:
    """Return the event with the largest absolute win-probability delta.

    The kickoff entry (delta always 0) is excluded from consideration.
    """
    candidates = [(i, e) for i, e in enumerate(timeline) if e.get("event_id") != "kickoff"]
    idx, event = max(candidates, key=lambda pair: abs(pair[1]["delta"]))
    prior = timeline[idx - 1] if idx > 0 else timeline[0]

    return {
        "event_id": event["event_id"],
        "timeline_index": idx,
        "minute": event["minute"],
        "second": event["second"],
        "event_type": event["event_type"],
        "player": event["player"],
        "team": event["team"],
        "prob_home_before": prior["prob_home"],
        "prob_away_before": prior["prob_away"],
        "prob_home_after": event["prob_home"],
        "prob_away_after": event["prob_away"],
        "delta": event["delta"],
    }


def compute_counterfactual(
    matchpoint: dict,
    timeline: list[dict],
    match_events: list[dict],
    events_by_id: dict,
    home_team: str,
    away_team: str,
    max_minute: int,
) -> dict:
    """Flip the MatchPoint event's outcome and re-simulate win probability forward.

    - Goal / Own Goal -> flip to no-goal (revert the score, xG state unchanged)
    - High-xG missed shot (xg > 0.3) -> flip to goal (add to score)
    - Non-shot event (card/substitution) -> documented +/-5% proxy shift, per
      the engineering spec's simplified approximation for non-shot moments
    """
    idx = matchpoint["timeline_index"]
    prior_entry = timeline[idx - 1]
    raw_event = events_by_id.get(matchpoint["event_id"], {})
    scoring_team = matchpoint["team"]
    xg = raw_event.get("shot_statsbomb_xg") or 0.0

    score_home = prior_entry["score_home"]
    score_away = prior_entry["score_away"]
    xg_home = prior_entry["xg_home"]
    xg_away = prior_entry["xg_away"]

    is_goal_type = matchpoint["event_type"] in ("Goal", "Own Goal")
    is_high_xg_miss = matchpoint["event_type"] == "Missed Shot" and xg > HIGH_XG_MISS_THRESHOLD

    if not (is_goal_type or is_high_xg_miss):
        proxy_prob_home = prior_entry["prob_home"]
        if scoring_team == home_team:
            proxy_prob_home = max(proxy_prob_home - NON_SHOT_PROXY_SHIFT, 0.0)
        else:
            proxy_prob_home = min(proxy_prob_home + NON_SHOT_PROXY_SHIFT, 100.0)
        proxy_prob_home = round(proxy_prob_home, 2)
        return {
            "methodology": "proxy_shift",
            "alt_timeline": [],
            "counterfactual_prob_home_at_moment": proxy_prob_home,
            "counterfactual_prob_home_final": proxy_prob_home,
        }

    flipped_score_home, flipped_score_away = score_home, score_away
    if is_goal_type:
        if scoring_team == home_team:
            flipped_score_home = max(score_home - 1, 0)
        else:
            flipped_score_away = max(score_away - 1, 0)
    else:  # high-xG miss flipped to a goal
        if scoring_team == home_team:
            flipped_score_home += 1
        else:
            flipped_score_away += 1

    minute = matchpoint["minute"]
    second = matchpoint["second"]
    remaining = max(max_minute - minute, 0)
    rate_home = _projected_rate(xg_home, minute)
    rate_away = _projected_rate(xg_away, minute)
    at_moment_probs = compute_win_probability(
        flipped_score_home, flipped_score_away, rate_home * remaining, rate_away * remaining
    )

    # Re-run the actual remaining events forward from the flipped state to
    # project how the rest of the match would have unfolded probabilistically.
    remaining_events = [
        e for e in match_events
        if ((e.get("minute") or 0), (e.get("second") or 0)) > (minute, second)
    ]
    alt_timeline = walk_events(
        remaining_events, events_by_id, home_team, away_team, max_minute,
        xg_home=xg_home, xg_away=xg_away,
        score_home=flipped_score_home, score_away=flipped_score_away,
    )

    final_prob_home = alt_timeline[-1]["prob_home"] if alt_timeline else at_moment_probs["prob_home"]

    return {
        "methodology": "xg_state_resimulation",
        "alt_timeline": alt_timeline,
        "counterfactual_prob_home_at_moment": at_moment_probs["prob_home"],
        "counterfactual_prob_home_final": final_prob_home,
    }
