import { getStatusBadgeInfo } from '../../utils/formatters';

export default function Badge({ status, label, variant }) {
  if (status) {
    const info = getStatusBadgeInfo(status);
    return (
      <span className={`badge ${info.bg}`}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor', display: 'inline-block' }} />
        {label || info.label}
      </span>
    );
  }

  let style = 'bg-slate-700/50 text-slate-300 border-slate-600/30';
  if (variant === 'success') style = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (variant === 'warning') style = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (variant === 'danger') style = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  if (variant === 'info') style = 'bg-blue-500/20 text-blue-400 border-blue-500/30';

  return (
    <span className={`badge ${style}`}>
      {label}
    </span>
  );
}
