interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function BrandMark({ size = 'md', showText = false, className = '' }: BrandMarkProps) {
  const sizes = {
    sm: { dot: 6, gap: 16, stroke: 1.5, text: 'text-sm' },
    md: { dot: 8, gap: 24, stroke: 2, text: 'text-base' },
    lg: { dot: 10, gap: 32, stroke: 2.5, text: 'text-lg' },
  };
  const s = sizes[size];
  const width = s.gap + s.dot * 2;
  const height = s.dot;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx={s.dot / 2} cy={s.dot / 2} r={s.dot / 2} fill="#171717" />
        <line
          x1={s.dot}
          y1={s.dot / 2}
          x2={width - s.dot}
          y2={s.dot / 2}
          stroke="#171717"
          strokeWidth={s.stroke}
        />
        <circle cx={width - s.dot / 2} cy={s.dot / 2} r={s.dot / 2} fill="#D92F2F" />
      </svg>
      {showText && (
        <span
          className={`font-technical uppercase ${s.text} tracking-widest`}
          style={{ color: '#171717' }}
        >
          Пройти
        </span>
      )}
    </div>
  );
}
