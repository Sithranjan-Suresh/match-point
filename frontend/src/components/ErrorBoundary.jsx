import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('MatchPoint crashed:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow">Something tore the timeline</p>
        <h1 className="display mt-6 text-4xl text-chalk">This moment didn't render.</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-rose">
          An unexpected error broke this page. It's isolated to what you were viewing — the rest
          of MatchPoint is fine.
        </p>
        <button
          type="button"
          onClick={() => {
            this.setState({ hasError: false })
            window.location.href = '/'
          }}
          className="mt-8 cursor-pointer border border-gold/60 px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-gold transition-colors hover:bg-gold/10"
        >
          Back to all fixtures
        </button>
      </div>
    )
  }
}

export default ErrorBoundary
