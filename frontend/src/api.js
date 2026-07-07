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

export async function askMatch(matchId, question) {
  const res = await fetch(`${API_URL}/api/matches/${matchId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || `Request failed (${res.status})`)
  }
  return res.json()
}
