const KEY = 'matchpoint:tournamentScrollY'

export function saveScrollPosition() {
  sessionStorage.setItem(KEY, String(window.scrollY))
}

export function popScrollPosition() {
  const value = sessionStorage.getItem(KEY)
  sessionStorage.removeItem(KEY)
  return value ? Number(value) : null
}
