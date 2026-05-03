import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Avatar from '../components/Avatar'
import MessageBubble from '../components/MessageBubble'
import TypingIndicator from '../components/TypingIndicator'

export default function ChatPage() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const broadcastChannelRef = useRef(null)

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  // Load other participant's profile
  useEffect(() => {
    async function loadOtherUser() {
      const { data } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .limit(1)

      if (data?.[0]) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', data[0].user_id)
          .single()

        setOtherUser(profile)
      }
    }
    loadOtherUser()
  }, [conversationId, user.id])

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!error) setMessages(data ?? [])
      setLoading(false)
      setTimeout(() => scrollToBottom('instant'), 50)
    }
    loadMessages()
  }, [conversationId, scrollToBottom])

  // Subscribe to new messages (Realtime)
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new
          // Avoid duplicates from optimistic UI
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id)
            if (exists) {
              // Replace optimistic message with confirmed one
              return prev.map(m => m.id === newMsg.id ? newMsg : m)
            }
            return [...prev, newMsg]
          })
          setTimeout(scrollToBottom, 50)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [conversationId, scrollToBottom])

  // Typing indicator broadcast channel
  useEffect(() => {
    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setIsOtherTyping(true)
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 2500)
        }
      })
      .subscribe()

    broadcastChannelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      clearTimeout(typingTimeoutRef.current)
    }
  }, [conversationId, user.id])

  function handleTyping(e) {
    setInputText(e.target.value)
    broadcastChannelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id },
    })
  }

  async function handleSend() {
    const text = inputText.trim()
    if (!text || sending) return

    setInputText('')
    inputRef.current?.focus()

    // Optimistic message (instant display)
    const optimisticId = `opt-${Date.now()}`
    const optimisticMsg = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
      status: 'sending',
    }
    setMessages(prev => [...prev, optimisticMsg])
    setTimeout(scrollToBottom, 50)

    setSending(true)
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: text,
      })
      .select()
      .single()

    if (error) {
      // Mark as failed
      setMessages(prev =>
        prev.map(m => m.id === optimisticId ? { ...m, status: 'failed' } : m)
      )
    } else {
      // Replace optimistic with confirmed
      setMessages(prev =>
        prev.map(m => m.id === optimisticId ? { ...data, status: 'sent' } : m)
      )
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const otherName = otherUser?.full_name || otherUser?.email?.split('@')[0] || '...'

  return (
    <div className="page chat-page">
      <header className="topbar">
        <button onClick={() => navigate('/chats')} className="btn-ghost btn-icon" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <Avatar name={otherName} size={34} />
        <div className="topbar-user">
          <span className="topbar-name">{otherName}</span>
          {isOtherTyping && <span className="topbar-status">typing...</span>}
        </div>
      </header>

      <main className="messages-area">
        {loading ? (
          <div className="messages-loading">
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state messages-empty">
            <p className="empty-icon">👋</p>
            <p className="empty-title">Say hello!</p>
            <p className="empty-sub">Start the conversation below.</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
  const isMine = msg.sender_id === user.id; // ✅ DEFINE IT

  return (
    <MessageBubble
      key={msg.id}
      message={msg}
      isMine={isMine}
      showAvatar={
        !isMine && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id)
      }
      otherUser={otherUser}
    />
  );
})}
          </>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="input-bar">
        <input
          ref={inputRef}
          className="message-input"
          placeholder="Type a message..."
          value={inputText}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          maxLength={1000}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </footer>
    </div>
  )
}
