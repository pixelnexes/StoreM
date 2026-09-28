/**
 * A single figure on a card. Used across dashboards and detail screens so the
 * numeric hierarchy stays identical everywhere: quiet label, large tabular
 * figure, optional context line.
 */
export function Stat({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="card">
      <div className="eyebrow">{label}</div>
      <div
        className={`mt-2 text-[26px] font-semibold leading-none tabular-nums ${
          warn ? 'text-warn' : ''
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-2 text-[12px] text-muted">{hint}</div>}
    </div>
  );
}
