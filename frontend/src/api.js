const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function getJSON(path) {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Request failed: ${path} (${res.status})`)
  }
  return res.json()
}

export function getTournamentSummary() {
  return getJSON('/api/tournament')
}

export function getMatches(stage) {
  const query = stage ? `?stage=${encodeURIComponent(stage)}` : ''
  return getJSON(`/api/matches${query}`)
}

export function getMatch(matchId) {
  return getJSON(`/api/matches/${matchId}`)
}
