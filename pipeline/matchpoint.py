"""MatchPoint detection: find the single highest win-probability-delta event in a match."""


def detect_matchpoint(timeline: list[dict]) -> dict:
    """Return the event with the largest absolute win-probability delta.

    The kickoff entry (delta always 0) is excluded from consideration.
    """
    candidates = [(i, e) for i, e in enumerate(timeline) if e.get("event_id") != "kickoff"]
    idx, event = max(candidates, key=lambda pair: abs(pair[1]["delta"]))
    prob_home_before = timeline[idx - 1]["prob_home"] if idx > 0 else timeline[0]["prob_home"]

    return {
        "event_id": event["event_id"],
        "timeline_index": idx,
        "minute": event["minute"],
        "second": event["second"],
        "event_type": event["event_type"],
        "player": event["player"],
        "team": event["team"],
        "prob_home_before": prob_home_before,
        "prob_home_after": event["prob_home"],
        "delta": event["delta"],
    }
