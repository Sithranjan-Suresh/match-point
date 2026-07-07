import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TournamentView from './pages/TournamentView'
import MatchView from './pages/MatchView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TournamentView />} />
        <Route path="/match/:matchId" element={<MatchView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
