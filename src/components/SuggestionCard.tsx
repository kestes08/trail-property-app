interface Props {
  label: string
  body: string
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
}

/** Warm cream/tan bordered proactive-suggestion card (never forest). */
export function SuggestionCard({
  label,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: Props) {
  return (
    <div className="suggestion">
      <div className="suggestion__head">
        <span className="livedot" />
        <span className="label" style={{ color: 'var(--accent)' }}>
          {label}
        </span>
      </div>
      <p className="suggestion__body">{body}</p>
      <div className="suggestion__actions">
        <button className="btn btn--filled" onClick={onPrimary}>
          {primaryLabel}
        </button>
        <button className="btn btn--outline" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      </div>
    </div>
  )
}
