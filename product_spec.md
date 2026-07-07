# MatchPoint — product_spec.md

---

## Product Requirements

At submission, MatchPoint must:

1. Display tournament-wide aggregate findings derived from all 64 World Cup 2022 matches
2. Allow a user to select any of the 64 matches and view its full rolling win probability timeline
3. Identify and highlight the MatchPoint moment (highest win probability delta event) for each match
4. Display an AI-generated narrative card explaining the MatchPoint moment in plain language
5. Run a counterfactual simulation for the MatchPoint moment and display the alternate probability
6. Allow a user to click any annotated event on the timeline and see its individual delta and context
7. Be accessible via a public URL (deployed, not localhost)
8. Load and render correctly without requiring user authentication

---

## User Stories & Acceptance Criteria

---

### STORY 1 — Tournament Overview
**As a** sports journalist arriving at MatchPoint for the first time,
**I want to** immediately see a compelling data-backed finding about the 2022 World Cup,
**so that** I understand the tool's value before interacting with any match.

**Acceptance Criteria:**
- [ ] Homepage displays at minimum 2 aggregate tournament findings (e.g., "X% of MatchPoint moments occurred before the 60th minute")
- [ ] A visual summary (heatmap, scatter plot, or grid) shows all 64 matches coded by MatchPoint moment minute and event type
- [ ] Each match in the overview is selectable and navigates to the match detail view
- [ ] Findings are stated as declarative claims, not just labeled charts

---

### STORY 2 — Match Selection
**As a** user on the tournament overview,
**I want to** select a specific match by name or bracket position,
**so that** I can explore that match's MatchPoint moment in detail.

**Acceptance Criteria:**
- [ ] All 64 matches are accessible from the overview (search, filter, or visual selection)
- [ ] Match names display as "[Team A] vs [Team B] — [Stage]" (e.g., "France vs Morocco — SF")
- [ ] Selected match navigates to the match detail view within 2 seconds
- [ ] Back navigation returns user to the tournament overview at the same scroll position

---

### STORY 3 — Match Timeline
**As a** user viewing a specific match,
**I want to** see the full rolling win probability curve across 90+ minutes with all events annotated,
**so that** I can understand how the match evolved moment by moment.

**Acceptance Criteria:**
- [ ] Win probability curve is displayed as a line chart across full match duration (including extra time if applicable)
- [ ] Y-axis represents Home win probability (0–100%)
- [ ] Vertical reference line marks 50% (even match)
- [ ] All significant events are annotated on the curve (shots, goals, cards, substitutions)
- [ ] Hovering or tapping an event shows: minute, event type, player name, team, and win probability delta
- [ ] MatchPoint moment is visually distinct (highlighted dot, pulsing ring, or distinct color)
- [ ] Chart renders from pre-computed data within 2 seconds

---

### STORY 4 — MatchPoint Moment Reveal
**As a** user viewing the match timeline,
**I want to** see the single most decisive event clearly identified with an explanation,
**so that** I can understand exactly when and why this match was decided.

**Acceptance Criteria:**
- [ ] MatchPoint moment panel appears below or beside the timeline
- [ ] Panel displays: minute, event type, player name, team, and win probability delta (e.g., "−19% for France")
- [ ] AI narrative card displays a 3–4 sentence plain-language explanation of why this moment mattered
- [ ] Narrative is factually consistent with the event data (correct player, team, minute, context)
- [ ] Panel loads within 3 seconds of match selection (narrative may load async with skeleton state)

---

### STORY 5 — Counterfactual Simulator
**As a** user viewing the MatchPoint moment,
**I want to** see what would have happened if that event had gone the other way,
**so that** I can understand the magnitude of that moment.

**Acceptance Criteria:**
- [ ] Counterfactual panel shows alternate win probability for both teams from the MatchPoint moment forward
- [ ] Alternate probability curve is overlaid on the original timeline (dashed line, distinct color)
- [ ] A summary statement is displayed: "If [event] had gone the other way, [Team]'s win probability at that moment would have been X% instead of Y%"
- [ ] Counterfactual is computed by re-running the simulation with the event outcome flipped (goal → no-goal or vice versa), not manually adjusted
- [ ] Methodology note is visible (tooltip or footnote): "Based on xG-state Monte Carlo simulation using StatsBomb open data"

---

### STORY 6 — Event Explorer
**As a** user curious about other events in the match,
**I want to** click any annotated event on the timeline and see its individual impact,
**so that** I can explore the full probability story beyond just the MatchPoint moment.

**Acceptance Criteria:**
- [ ] Clicking any annotated event on the timeline opens an event detail panel
- [ ] Panel shows: minute, event type, player, team, win probability before event, win probability after event, delta
- [ ] Panel closes on click-away or pressing Escape
- [ ] Selecting a non-MatchPoint event does not trigger counterfactual simulation (to avoid confusion)

---

## Edge Cases to Handle

- **Draws / matches decided on penalties:** MatchPoint moment is identified within regulation + extra time. If match went to penalties, a note is displayed: "This match was decided on penalties — MatchPoint reflects the highest-impact event in regulation/extra time."
- **Own goals:** Treated as a goal for the opposing team; player name is displayed with "(OG)" suffix
- **Events with zero delta:** If a shot has xG < 0.01, it may be excluded from annotation to avoid chart noise
- **Missing player names:** StatsBomb data occasionally has null player fields; display "Unknown" gracefully
- **Mobile viewport:** Timeline chart must be horizontally scrollable on mobile; touch events must work for event selection

---

## Feature Priority

### P0 — Demo Blocking (must work at submission)
- Tournament overview with aggregate findings
- Match selection for all 64 matches
- Win probability timeline with event annotations
- MatchPoint moment identification and display
- AI narrative card
- Counterfactual simulation with alternate curve overlay

### P1 — High Value (implement after P0s are stable)
- Event explorer (click any event for detail panel)
- Mobile-responsive layout
- Smooth transitions between tournament view and match view
- Loading skeletons for async data

### P2 — Nice to Have (only if time permits)
- Match search by team name
- Share link to a specific match's MatchPoint moment
- Export narrative card as an image
- Dark mode
