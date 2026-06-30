import { Database, FileSpreadsheet, FlaskConical, Sparkles, Wifi } from 'lucide-react';
import { SOURCE_META } from '../utils/campaignMeta';

const ICONS = {
  seed: FlaskConical,
  imported: FileSpreadsheet,
  live: Wifi,
  simulated: FlaskConical,
  inferred: Database,
  ai: Sparkles
};

export default function SourceBadge({ type = 'seed', label, compact = false }) {
  const meta = SOURCE_META[type] || SOURCE_META.seed;
  const Icon = ICONS[type] || FlaskConical;

  return (
    <span
      className={`source-badge source-badge-${meta.tone}`}
      title={meta.description}
      aria-label={`${label || meta.label}: ${meta.description}`}
    >
      <Icon size={compact ? 11 : 12} aria-hidden="true" />
      {!compact && <span>{label || meta.label}</span>}
    </span>
  );
}
