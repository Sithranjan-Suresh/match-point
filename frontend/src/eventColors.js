export const EVENT_FILL_COLORS = {
  Goal: '#10b981',
  'Own Goal': '#14b8a6',
  'Missed Shot': '#f59e0b',
  'Yellow Card': '#eab308',
  'Second Yellow': '#f97316',
  'Red Card': '#ef4444',
  Substitution: '#3b82f6',
}

export const DEFAULT_FILL_COLOR = '#94a3b8'

export function eventFillColor(eventType) {
  return EVENT_FILL_COLORS[eventType] || DEFAULT_FILL_COLOR
}
