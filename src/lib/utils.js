/**
 * Format an ISO timestamp as a short time string (e.g. "2:34 PM")
 */
export function formatTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a timestamp relative to now (e.g. "just now", "5m", "Mon")
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
