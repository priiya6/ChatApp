import { memo } from 'react'
import Avatar from './Avatar'
import { formatTime } from '../lib/utils'

// memo prevents re-render if props haven't changed
const MessageBubble = memo(function MessageBubble({ message, isMine, otherUser }) {
  const name = otherUser?.full_name || otherUser?.email?.split('@')[0] || '?'

  return (
    <div className={`bubble-row ${isMine ? 'mine' : 'theirs'}`}>
      {!isMine && <Avatar name={name} size={28} />}

      <div className="bubble-group">
        <div className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'} ${message.status === 'sending' ? 'bubble-sending' : ''} ${message.status === 'failed' ? 'bubble-failed' : ''}`}>
          <p className="bubble-text">{message.content}</p>
        </div>
        <div className={`bubble-meta ${isMine ? 'meta-right' : 'meta-left'}`}>
          <span className="bubble-time">{formatTime(message.created_at)}</span>
          {isMine && (
            <span className="bubble-status">
              {message.status === 'sending' && '○'}
              {message.status === 'failed' && '✕'}
              {(message.status === 'sent' || !message.status) && '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

export default MessageBubble
