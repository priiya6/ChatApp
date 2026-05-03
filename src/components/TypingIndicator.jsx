export default function TypingIndicator({ name }) {
  return (
    <div className="bubble-row theirs">
      <div className="typing-indicator" aria-label={`${name} is typing`}>
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
