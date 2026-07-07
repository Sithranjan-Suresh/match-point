"""Tests for the model-validation / calibration backtest."""
from calibration import compute_calibration


def make_match(score_home, score_away, prob_homes):
    """A minimal match_detail with one timeline entry per given prob_home."""
    timeline = [{"event_id": "kickoff", "prob_home": 50.0}]
    timeline += [{"event_id": f"e{i}", "prob_home": p} for i, p in enumerate(prob_homes)]
    return {"score_home": score_home, "score_away": score_away, "timeline": timeline}


class TestComputeCalibration:
    def test_kickoff_entries_excluded(self):
        matches = [make_match(1, 0, [95.0])]
        result = compute_calibration(matches)
        assert result["total_data_points"] == 1

    def test_perfectly_calibrated_bucket(self):
        # 10 matches, home always wins, all predictions land in the 90-100% bucket.
        matches = [make_match(1, 0, [95.0]) for _ in range(10)]
        result = compute_calibration(matches)
        bucket = next(c for c in result["curve"] if c["bucket"] == "90-100%")
        assert bucket["actual_home_win_pct"] == 100.0
        assert bucket["count"] == 10

    def test_home_loss_and_draw_do_not_count_as_home_win(self):
        matches = [
            make_match(0, 1, [80.0]),  # home lost despite a confident prediction
            make_match(1, 1, [80.0]),  # draw
        ]
        result = compute_calibration(matches)
        bucket = next(c for c in result["curve"] if c["bucket"] == "80-90%")
        assert bucket["actual_home_win_pct"] == 0.0
        assert bucket["count"] == 2

    def test_mean_absolute_calibration_error_is_zero_when_perfect(self):
        # Half the predictions at ~25% where home loses, half at ~25% where home...
        # construct a bucket where predicted matches actual exactly.
        matches = (
            [make_match(1, 0, [25.0]) for _ in range(1)]
            + [make_match(0, 1, [25.0]) for _ in range(3)]
        )
        result = compute_calibration(matches)
        # 1 win out of 4 at ~25% predicted -> actual 25%, matches predicted almost exactly.
        assert result["mean_absolute_calibration_error"] < 1.0

    def test_no_matches_returns_empty_curve(self):
        result = compute_calibration([])
        assert result["curve"] == []
        assert result["total_data_points"] == 0
        assert result["mean_absolute_calibration_error"] == 0.0

    def test_bucket_boundaries_are_capped_at_90(self):
        # A prob_home of exactly 100 should land in the 90-100% bucket, not overflow.
        matches = [make_match(1, 0, [100.0])]
        result = compute_calibration(matches)
        assert result["curve"][0]["bucket"] == "90-100%"
