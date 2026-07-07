"""Tests for the Monte Carlo win-probability engine, including a regression
test for the early-match rate-projection bug (a single early shot used to
get extrapolated into an implausible full-match scoring pace)."""
import pytest

from win_probability import (
    AVG_XG_PER_TEAM_90,
    _projected_rate,
    build_match_timeline,
    compute_win_probability,
    is_trigger_event,
)


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


class TestComputeWinProbability:
    def test_probabilities_sum_to_100(self):
        probs = compute_win_probability(1, 0, 0.8, 0.6, n=5000)
        total = probs["prob_home"] + probs["prob_away"] + probs["prob_draw"]
        assert total == pytest.approx(100, abs=0.5)

    def test_bounded_between_0_and_100(self):
        probs = compute_win_probability(2, 0, 1.5, 1.2)
        for value in probs.values():
            assert 0 <= value <= 100

    def test_insurmountable_lead_with_no_time_left(self):
        # Home is up 3-0 with nothing left to simulate: home must win.
        probs = compute_win_probability(3, 0, 0.0, 0.0)
        assert probs["prob_home"] == 100.0
        assert probs["prob_away"] == 0.0
        assert probs["prob_draw"] == 0.0

    def test_negative_remaining_xg_is_clamped(self):
        # Should not raise even if a caller passes a negative rate*time product.
        probs = compute_win_probability(0, 0, -5.0, -5.0)
        assert probs["prob_draw"] == 100.0


class TestProjectedRate:
    def test_zero_elapsed_returns_prior_rate(self):
        rate = _projected_rate(xg=0.0, elapsed_minutes=0)
        assert rate == pytest.approx(AVG_XG_PER_TEAM_90 / 90, rel=1e-6)

    def test_single_early_shot_does_not_blow_up_the_rate(self):
        """Regression test: before the prior-shrinkage fix, a single 0.23 xG
        shot at minute 7 produced rate = 0.23 / 7 ≈ 0.033/min, i.e. ~2.8
        expected goals over the remaining 83 minutes from ONE shot — enough
        to swing win probability by 30+ points on pure extrapolation noise.
        The shrunk rate must stay far below that naive value."""
        naive_rate = 0.233 / 7
        shrunk_rate = _projected_rate(xg=0.233, elapsed_minutes=7)
        assert shrunk_rate < naive_rate * 0.6

    def test_rate_converges_to_observed_as_match_progresses(self):
        # With a lot of elapsed time, the prior's influence should shrink
        # and the rate should approach the observed average.
        observed_rate = 0.02  # xg per minute
        elapsed = 80
        xg = observed_rate * elapsed
        rate = _projected_rate(xg, elapsed)
        assert rate == pytest.approx(observed_rate, rel=0.25)


class TestIsTriggerEvent:
    def test_shot_is_trigger(self):
        assert is_trigger_event(make_event(type="Shot"))

    def test_own_goal_for_is_trigger(self):
        assert is_trigger_event(make_event(type="Own Goal For"))

    def test_substitution_is_trigger(self):
        assert is_trigger_event(make_event(type="Substitution"))

    def test_uncarded_foul_is_not_trigger(self):
        # This was the source of chart noise before the fix: every foul used
        # to trigger a recompute even when no card was shown.
        event = make_event(type="Foul Committed", foul_committed_card=None)
        assert not is_trigger_event(event)

    def test_carded_foul_is_trigger(self):
        event = make_event(type="Foul Committed", foul_committed_card="Yellow Card")
        assert is_trigger_event(event)

    def test_pass_is_not_trigger(self):
        assert not is_trigger_event(make_event(type="Pass"))


class TestBuildMatchTimeline:
    def _synthetic_events(self):
        return [
            make_event(id="e1", type="Shot", team="Home", player="A", minute=5,
                       second=0, index=1, shot_statsbomb_xg=0.4, shot_outcome="Goal"),
            make_event(id="e2", type="Shot", team="Away", player="B", minute=40,
                       second=0, index=2, shot_statsbomb_xg=0.005, shot_outcome="Off T"),
            make_event(id="e3", type="Shot", team="Away", player="C", minute=70,
                       second=0, index=3, shot_statsbomb_xg=0.5, shot_outcome="Goal"),
            # Penalty shootout events must be excluded from the model entirely.
            make_event(id="e4", type="Shot", team="Home", player="D", minute=120,
                       second=0, index=4, period=5, shot_statsbomb_xg=0.76, shot_outcome="Goal"),
        ]

    def test_kickoff_entry_present_with_zero_delta(self):
        result = build_match_timeline(self._synthetic_events(), "Home", "Away")
        assert result["timeline"][0]["event_id"] == "kickoff"
        assert result["timeline"][0]["delta"] == 0.0

    def test_penalty_shootout_excluded_from_max_minute(self):
        result = build_match_timeline(self._synthetic_events(), "Home", "Away")
        assert result["max_minute"] == 70

    def test_low_xg_miss_not_annotated(self):
        result = build_match_timeline(self._synthetic_events(), "Home", "Away")
        low_xg_entry = next(e for e in result["timeline"] if e.get("event_id") == "e2")
        assert low_xg_entry["annotate"] is False

    def test_goal_increments_score(self):
        result = build_match_timeline(self._synthetic_events(), "Home", "Away")
        home_goal_entry = next(e for e in result["timeline"] if e.get("event_id") == "e1")
        assert home_goal_entry["score_home"] == 1
        assert home_goal_entry["score_away"] == 0

    def test_own_goal_scorer_resolved_via_related_events(self):
        events = [
            make_event(id="og-for", type="Own Goal For", team="Away", player=None,
                       minute=30, index=1, related_events=["og-against"]),
            make_event(id="og-against", type="Own Goal Against", team="Home",
                       player="Defender X", minute=30, index=2, related_events=["og-for"]),
        ]
        result = build_match_timeline(events, "Home", "Away")
        entry = next(e for e in result["timeline"] if e.get("event_id") == "og-for")
        assert entry["player"] == "Defender X (OG)"
        assert entry["score_away"] == 1
