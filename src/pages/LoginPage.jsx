import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(friendlyError(error.message))
    }
    // On success, AuthContext updates user → App redirects to /chats automatically
    setLoading(false)
  }

  function friendlyError(msg) {
    if (msg.includes('Invalid login')) return 'Incorrect email or password.'
    if (msg.includes('Email not confirmed')) return 'Please confirm your email first.'
    if (msg.includes('rate limit')) return 'Too many attempts. Wait a moment and try again.'
    return msg
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="var(--accent)" />
            <path d="M8 10h20v12a4 4 0 01-4 4H12a4 4 0 01-4-4V10z" fill="white" fillOpacity="0.9"/>
            <circle cx="13" cy="16" r="1.5" fill="var(--accent)"/>
            <circle cx="18" cy="16" r="1.5" fill="var(--accent)"/>
            <circle cx="23" cy="16" r="1.5" fill="var(--accent)"/>
          </svg>
          <span className="auth-brand">Convo</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue chatting</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
