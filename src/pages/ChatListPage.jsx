import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Avatar from '../components/Avatar'
import { formatRelativeTime } from '../lib/utils'

export default function ChatListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    setError('')
    try {
      // 1. Get all conversation IDs for the logged-in user
      const { data: participantRows, error: pErr } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (pErr) throw pErr

      const convIds = participantRows.map(r => r.conversation_id)
      if (convIds.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // 2. For each conversation, get the other participant + last message
      const results = await Promise.all(
        convIds.map(async (convId) => {
          // Other participant
          const { data: others } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', convId)
            .neq('user_id', user.id)
            .limit(1)

          const otherUserId = others?.[0]?.user_id

          // Other participant's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', otherUserId)
            .single()

          // Last message
          const { data: msgs } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1)

          const lastMessage = msgs?.[0] ?? null

          return {
            id: convId,
            otherUser: profile,
            lastMessage,
          }
        })
      )

      // Sort by most recent message
      results.sort((a, b) => {
        const aTime = a.lastMessage?.created_at ?? '0'
        const bTime = b.lastMessage?.created_at ?? '0'
        return bTime.localeCompare(aTime)
      })

      setConversations(results)
    } catch (err) {
      setError('Failed to load chats. Pull to refresh.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const displayName = (conv) =>
    conv.otherUser?.full_name || conv.otherUser?.email?.split('@')[0] || 'Unknown'

  const previewText = (conv) => {
    if (!conv.lastMessage) return 'No messages yet'
    const prefix = conv.lastMessage.sender_id === user.id ? 'You: ' : ''
    return prefix + conv.lastMessage.content
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">
            <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="var(--accent)" />
              <path d="M8 10h20v12a4 4 0 01-4 4H12a4 4 0 01-4-4V10z" fill="white" fillOpacity="0.9"/>
              <circle cx="13" cy="16" r="1.5" fill="var(--accent)"/>
              <circle cx="18" cy="16" r="1.5" fill="var(--accent)"/>
              <circle cx="23" cy="16" r="1.5" fill="var(--accent)"/>
            </svg>
          </div>
          <h1 className="topbar-title">Chats</h1>
        </div>
        <button onClick={handleLogout} className="btn-ghost btn-sm" aria-label="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </header>

      <main className="list-content">
        {loading ? (
          <div className="list-skeleton">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-row">
                <div className="skeleton-avatar" />
                <div className="skeleton-lines">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line long" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">
            <p className="empty-icon">⚠️</p>
            <p className="empty-title">Something went wrong</p>
            <p className="empty-sub">{error}</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={loadConversations}>
              Try Again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">💬</p>
            <p className="empty-title">No conversations yet</p>
            <p className="empty-sub">You'll see your chats here once someone messages you.</p>
          </div>
        ) : (
          <ul className="convo-list">
            {conversations.map(conv => (
              <li key={conv.id}>
                <button
                  className="convo-row"
                  onClick={() => navigate(`/chat/${conv.id}`)}
                >
                  <Avatar name={displayName(conv)} size={46} />
                  <div className="convo-info">
                    <div className="convo-top">
                      <span className="convo-name">{displayName(conv)}</span>
                      {conv.lastMessage && (
                        <span className="convo-time">
                          {formatRelativeTime(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="convo-preview">{previewText(conv)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
