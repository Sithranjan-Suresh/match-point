export const EVENT_FILL_COLORS = {
  Goal: '#e8b54a',
  'Own Goal': '#d97742',
  'Missed Shot': '#c08a9b',
  'Yellow Card': '#e6c94f',
  'Second Yellow': '#d97742',
  'Red Card': '#e4553f',
  Substitution: '#9cd3c4',
}

export const DEFAULT_FILL_COLOR = '#8d6b77'

export function eventFillColor(eventType) {
  return EVENT_FILL_COLORS[eventType] || DEFAULT_FILL_COLOR
}
