"""Tests for MatchPoint detection and the counterfactual engine."""
import pytest

from matchpoint import compute_counterfactual, decided_on_penalties, detect_matchpoint
from win_probability import build_match_timeline, prepare_match_events


def make_event(**overrides):
    event = {
        "id": "evt-1",
        "type": "Shot",
        "team": "Home",
        "player": "Player One",
        "minute": 10,
        "second": 0,
        "period": 1,
        "index": 1,
        "shot_statsbomb_xg": 0.1,
        "shot_outcome": "Saved",
    }
    event.update(overrides)
    return event


SYNTHETIC_MATCH = [
    make_event(id="e1", type="Shot", team="Home", player="Striker A", minute=5,
               index=1, shot_statsbomb_xg=0.6, shot_outcome="Goal"),
    make_event(id="e2", type="Shot", team="Away", player="Striker B", minute=50,
               index=2, shot_statsbomb_xg=0.02, shot_outcome="Off T"),
    make_event(id="e3", type="Substitution", team="Away", player="Sub C", minute=70, index=3),
]


class TestDecidedOnPenalties:
    def test_true_when_period_5_present(self):
        events = SYNTHETIC_MATCH + [make_event(id="pen", period=5, minute=120, index=99)]
        assert decided_on_penalties(events) is True

    def test_false_when_no_period_5(self):
        assert decided_on_penalties(SYNTHETIC_MATCH) is False


class TestDetectMatchpoint:
    def test_picks_largest_absolute_delta_excluding_kickoff(self):
        result = build_match_timeline(SYNTHETIC_MATCH, "Home", "Away")
        mp = detect_matchpoint(result["timeline"])
        assert mp["event_id"] != "kickoff"
        # The 5th-minute goal is by far the largest swing in this fixture.
        assert mp["event_id"] == "e1"
        assert mp["event_type"] == "Goal"

    def test_includes_both_sides_of_probability(self):
        result = build_match_timeline(SYNTHETIC_MATCH, "Home", "Away")
        mp = detect_matchpoint(result["timeline"])
        assert "prob_home_before" in mp
        assert "prob_away_before" in mp
        assert "prob_home_after" in mp
        assert "prob_away_after" in mp


class TestCounterfactualGoal:
    def test_goal_flip_reverts_score_and_resimulates(self):
        result = build_match_timeline(SYNTHETIC_MATCH, "Home", "Away")
        mp = detect_matchpoint(result["timeline"])
        cf = compute_counterfactual(
            mp, result["timeline"], result["match_events"], result["events_by_id"],
            "Home", "Away", result["max_minute"],
        )
        assert cf["methodology"] == "xg_state_resimulation"
        # Flipping a home goal to a miss should not leave home better off.
        assert cf["counterfactual_prob_home_at_moment"] <= mp["prob_home_after"]
        assert len(cf["alt_timeline"]) > 0


class TestCounterfactualNonShot:
    def test_substitution_uses_proxy_shift_bounded(self):
        match_events, events_by_id, max_minute = prepare_match_events(SYNTHETIC_MATCH)
        # Force the substitution to be the MatchPoint by building a timeline
        # where it's the only meaningful trigger after the initial goal decays.
        result = build_match_timeline(SYNTHETIC_MATCH, "Home", "Away")
        sub_entry = next(e for e in result["timeline"] if e["event_id"] == "e3")
        fake_mp = {
            "event_id": "e3",
            "timeline_index": result["timeline"].index(sub_entry),
            "minute": sub_entry["minute"],
            "second": sub_entry["second"],
            "event_type": "Substitution",
            "player": sub_entry["player"],
            "team": sub_entry["team"],
            "delta": sub_entry["delta"],
        }
        cf = compute_counterfactual(
            fake_mp, result["timeline"], result["match_events"], result["events_by_id"],
            "Home", "Away", result["max_minute"],
        )
        assert cf["methodology"] == "proxy_shift"
        assert cf["alt_timeline"] == []
        assert 0.0 <= cf["counterfactual_prob_home_at_moment"] <= 100.0
        assert cf["counterfactual_prob_home_at_moment"] == cf["counterfactual_prob_home_final"]

    def test_proxy_shift_direction_depends_on_scoring_team(self):
        """A substitution by the home team and one by the away team should
        shift the proxy probability in opposite directions."""
        result = build_match_timeline(SYNTHETIC_MATCH, "Home", "Away")
        prior = result["timeline"][0]

        home_sub_mp = {
            "event_id": "fake-home-sub", "timeline_index": 1, "minute": 10, "second": 0,
            "event_type": "Substitution", "player": "X", "team": "Home", "delta": 0.0,
        }
        away_sub_mp = {
            "event_id": "fake-away-sub", "timeline_index": 1, "minute": 10, "second": 0,
            "event_type": "Substitution", "player": "X", "team": "Away", "delta": 0.0,
        }
        timeline = [prior, {**prior, "event_id": "fake-home-sub"}]
        cf_home = compute_counterfactual(
            home_sub_mp, timeline, result["match_events"], result["events_by_id"],
            "Home", "Away", result["max_minute"],
        )
        timeline_away = [prior, {**prior, "event_id": "fake-away-sub"}]
        cf_away = compute_counterfactual(
            away_sub_mp, timeline_away, result["match_events"], result["events_by_id"],
            "Home", "Away", result["max_minute"],
        )
        assert cf_home["counterfactual_prob_home_at_moment"] < prior["prob_home"]
        assert cf_away["counterfactual_prob_home_at_moment"] > prior["prob_home"]
