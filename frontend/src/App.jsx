import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TournamentView from './pages/TournamentView'
import MatchView from './pages/MatchView'
import NotFound from './pages/NotFound'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<TournamentView />} />
          <Route path="/match/:matchId" element={<MatchView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
      <Footer />
    </BrowserRouter>
  )
}

export default App
