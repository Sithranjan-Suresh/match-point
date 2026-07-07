import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TournamentView from './pages/TournamentView'
import MatchView from './pages/MatchView'
import Footer from './components/Footer'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TournamentView />} />
        <Route path="/match/:matchId" element={<MatchView />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
