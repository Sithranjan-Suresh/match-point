"""AI narrative generation for MatchPoint moments, via the Groq API (free tier)."""
import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
MAX_TOKENS = 200

SYSTEM_PROMPT = (
    "You are a sports analytics journalist. Write a 3-4 sentence narrative "
    "explaining the decisive moment of a football match. Be specific, "
    "analytical, and conversational. Do not use filler phrases. State what "
    "happened, why the win probability shifted so dramatically, and what it "
    "means for how we understand the match result."
)


def _client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Copy .env.example to .env and fill it in.")
    return Groq(api_key=api_key)


def build_user_prompt(match_context: dict) -> str:
    # `delta` is the change in the HOME team's win probability; flip the sign
    # when reporting it relative to the impacted team if that team is away.
    team_relative_delta = (
        match_context["delta"] if match_context["team"] == match_context["home_team"]
        else -match_context["delta"]
    )
    return (
        f"Match: {match_context['home_team']} vs {match_context['away_team']}, "
        f"{match_context['stage']}, 2022 World Cup\n"
        f"Final Score: {match_context['score_home']}-{match_context['score_away']}\n"
        f"MatchPoint Moment: Minute {match_context['minute']}, {match_context['event_type']}, "
        f"{match_context['player']}, {match_context['team']}\n"
        f"Win Probability Before: {match_context['prob_home_before']}% / {match_context['prob_away_before']}%\n"
        f"Win Probability After: {match_context['prob_home_after']}% / {match_context['prob_away_after']}%\n"
        f"Delta: {match_context['team']}'s probability changed by {team_relative_delta:+.1f}%"
    )


def generate_narrative(match_context: dict) -> str:
    """Call Groq to produce a 3-4 sentence plain-language narrative for the MatchPoint moment."""
    client = _client()
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=MAX_TOKENS,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(match_context)},
        ],
    )
    return response.choices[0].message.content.strip()
