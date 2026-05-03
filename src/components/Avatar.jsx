import { useMemo } from 'react'

// A deterministic color from a name string
function nameToColor(name = '') {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ name = '', size = 40 }) {
  const color = useMemo(() => nameToColor(name), [name])
  const initials = useMemo(() => getInitials(name), [name])
  const fontSize = Math.round(size * 0.38)

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        minWidth: size,
        backgroundColor: color,
        fontSize,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
