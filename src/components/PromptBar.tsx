import { useStore } from '../store'

/**
 * Persistent AI prompt bar, fixed above the page content on every screen.
 * Forest-green on most screens; inverted to cream on the Ranger AI screen so
 * it stays legible against the dark chat background.
 */
export function PromptBar() {
  const { draft, setDraft, submitPrompt, route, setRoute } = useStore()
  const onRanger = route === 'ranger'

  const submit = () => submitPrompt()

  return (
    <div className={`promptbar ${onRanger ? 'promptbar--cream' : ''}`}>
      <span className="livedot" aria-hidden />
      <input
        className="promptbar__input"
        value={draft}
        placeholder="Log work or ask anything…"
        aria-label="Log work or ask the assistant anything"
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => {
          if (!onRanger) setRoute('ranger')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
      />
      <button
        className="promptbar__send"
        aria-label="Send"
        onClick={submit}
        disabled={!draft.trim()}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path
            d="M9 15V4M9 4 4 9M9 4l5 5"
            stroke="#fff"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
