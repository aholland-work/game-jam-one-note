import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import './ThemeToggle.css'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'one-note:theme'

function savedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** Follows the system until the player chooses a theme, then remembers that choice. */
export function ThemeToggle() {
  const manual = useRef(savedTheme() !== null)
  const [theme, setTheme] = useState<Theme>(() =>
    savedTheme() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const followSystem = () => {
      if (!manual.current) setTheme(media.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', followSystem)
    return () => media.removeEventListener('change', followSystem)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    manual.current = true
    setTheme(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The switch still works when browser storage is unavailable.
    }
  }

  return (
    <button type="button" className="theme-toggle" role="switch" aria-checked={theme === 'dark'} onClick={toggle}>
      <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
      <span>Dark mode</span>
      <span className="theme-toggle-track" aria-hidden="true"><span /></span>
    </button>
  )
}
