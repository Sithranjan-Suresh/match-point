# MatchPoint — 90-second demo script

Structure: claim → prove it → let the viewer explore the counterfactual → show the practical
angle. Written for the AQX Data Bowl rubric (Analytical Insight, Practical Application, Data
Presentation) — every beat maps to one of the three.

---

**[0:00–0:12] The claim.**
Open on the homepage hero. Read it straight: *"The match was decided before you knew it."*
Point at the headline stat: **73.4% of decisive moments happened before the 60th minute — and
17.2% of them weren't goals at all.**
> "Everyone thinks a match is decided by the goal. Our data says it's usually decided way
> before that — and the moment is often a miss, not a goal."

**[0:12–0:25] Prove it — the signature visualization.**
Scroll to the Decisive Minute Strip. *"This is all 64 matches of the World Cup, one tick each,
plotted by the minute they were actually decided."* Hover two or three ticks to show the
readout. Point at the cluster before minute 60.

**[0:25–0:50] One match, in depth.**
Click into France vs Morocco (the semifinal). *"Theo Hernández scores in minute 4. Win
probability jumps from 43% to 74% — instantly."* Point at the pulsing gold dot. Read one line
of the AI narrative aloud.

**[0:50–1:05] The counterfactual — the "wow" moment.**
Click "Show the other timeline." *"Here's what almost happened. If that goal doesn't go in,
France is still only a coin flip. This isn't a guess — it's the same simulation, re-run 10,000
times from the flipped state."* Point at the ice-colored dashed line diverging from the actual
curve.

**[1:05–1:20] Ask it something live.**
Scroll to "Ask the analyst." Type a real question — *"When was the match still winnable?"* —
and let the answer stream in on camera. This is the one moment that's live, not pre-computed;
say so.

**[1:20–1:30] The practical angle — close on "so what."**
Scroll to "For the Dugout." *"Same model, sliced differently: which substitutions actually
paid off, which backfired, and — Messi and Mbappé lead the tournament in total impact, goals
or not. This isn't just a highlight generator. It's a lens a coaching staff could actually use."*

---

## Backup talking points (if time allows or judges ask)

- **Why is this trustworthy, not a black box?** Every event is public StatsBomb data; the win
  probability model is a Poisson Monte Carlo simulation with a documented prior-shrinkage fix
  for early-match noise (explained in the README, tested in `tests/`).
- **How do you know the model is actually calibrated, not just a nice curve?** Scroll to "Is
  this actually reliable?" — every one of the 2,267 predictions the model ever made, bucketed
  and checked against real outcomes. It's not perfect (6.7-point mean error, slightly
  conservative in the 40–60% range) and the page says so — that honesty is the point.
- **Why isn't every non-goal counterfactual a full re-simulation?** Cards and subs don't have a
  score to flip — the UI says so explicitly rather than pretending otherwise.
- **What's next?** Multi-tournament validation (2018 World Cup, Champions League — same free
  StatsBomb data), and scoring individual manager decisions across a season.
