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
