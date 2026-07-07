import { useEffect, useRef, useState } from 'react'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function CountUp({ value, decimals = 1, duration = 1400, suffix = '' }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion) {
      setDisplay(value)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        observer.disconnect()
        const start = performance.now()
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - t, 3)
          setDisplay(value * eased)
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}

export default CountUp
