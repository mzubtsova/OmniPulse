import { Sparkles, X } from 'lucide-react';

export default function ContextHint({ id, title, children, onDismiss }) {
  return (
    <aside className="context-hint" role="note" aria-label={title}>
      <div className="context-hint-icon" aria-hidden="true">
        <Sparkles size={16} />
      </div>
      <div className="context-hint-copy">
        <span className="context-hint-kicker">OmniPulse coach</span>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="context-hint-close"
          onClick={() => onDismiss(id)}
          aria-label={`Dismiss ${title}`}
        >
          <X size={14} />
        </button>
      )}
    </aside>
  );
}
