const CANDLES = [
  { x: 0, open: 40, close: 30, high: 46, low: 24, bull: true },
  { x: 24, open: 30, close: 34, high: 38, low: 22, bull: false },
  { x: 48, open: 34, close: 20, high: 40, low: 16, bull: true },
  { x: 72, open: 20, close: 26, high: 30, low: 14, bull: false },
  { x: 96, open: 26, close: 10, high: 32, low: 8, bull: true },
  { x: 120, open: 10, close: 18, high: 22, low: 6, bull: false },
  { x: 144, open: 18, close: 6, high: 24, low: 2, bull: true },
  { x: 168, open: 6, close: 16, high: 20, low: 2, bull: false },
  { x: 192, open: 16, close: 2, high: 22, low: -2, bull: true },
  { x: 216, open: 2, close: 12, high: 16, low: -4, bull: false },
];

/** Purely decorative — an ascending candlestick pattern threading behind the hero's signal cards. */
export function CandlestickBackdrop({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 60"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <line
        x1="0"
        y1="35"
        x2="240"
        y2="5"
        stroke="hsl(var(--primary))"
        strokeWidth="0.5"
        strokeDasharray="2 3"
        className="animate-drift opacity-40"
      />
      {CANDLES.map((c, i) => (
        <g key={i} className="opacity-70">
          <line
            x1={c.x + 6}
            y1={60 - c.high}
            x2={c.x + 6}
            y2={60 - c.low}
            stroke={c.bull ? 'hsl(var(--success))' : 'hsl(var(--danger))'}
            strokeWidth="1"
          />
          <rect
            x={c.x + 3}
            y={60 - Math.max(c.open, c.close)}
            width="6"
            height={Math.max(Math.abs(c.open - c.close), 1)}
            fill={c.bull ? 'hsl(var(--success))' : 'hsl(var(--danger))'}
            opacity="0.85"
          />
        </g>
      ))}
    </svg>
  );
}
