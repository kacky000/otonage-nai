'use client';

import { CATEGORIES, COLORS } from '@/lib/types';

interface RadarChartProps {
  data: { [key: string]: number };
  size?: number;
  label?: string;
}

export default function RadarChart({ data, size = 280, label }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const levels = 5;

  const angleStep = (Math.PI * 2) / 6;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, value: number, maxVal: number = 10) => {
    const angle = startAngle + angleStep * index;
    const dist = (value / maxVal) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const lv = ((i + 1) / levels) * 10;
    return Array.from({ length: 6 }, (_, j) => getPoint(j, lv))
      .map((p) => `${p.x},${p.y}`)
      .join(' ');
  });

  const axes = Array.from({ length: 6 }, (_, i) => getPoint(i, 10));

  const dataPoints = CATEGORIES.map((_, i) => {
    const val = data[CATEGORIES[i].key] || 0;
    return getPoint(i, val);
  });
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const labelPoints = CATEGORIES.map((_, i) => getPoint(i, 12.8));

  const avg = CATEGORIES.reduce((s, c) => s + (data[c.key] || 0), 0) / 6;

  return (
    <div className="text-center">
      {label && (
        <div className="text-lg font-extrabold text-text-main mb-2">
          {label}
          <span className="ml-2.5 text-sm font-semibold text-accent">
            平均 {avg.toFixed(1)}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto">
        {gridLevels.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke={COLORS.border}
            strokeWidth={i === levels - 1 ? 1.5 : 0.5}
            opacity={0.6}
          />
        ))}
        {axes.map((p, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke={COLORS.border}
            strokeWidth={0.5}
            opacity={0.4}
          />
        ))}
        <polygon
          points={dataPath}
          fill={COLORS.accentGlow}
          stroke={COLORS.accent}
          strokeWidth={2.5}
          opacity={0.85}
        />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={COLORS.chart[i]} />
        ))}
        {labelPoints.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={COLORS.textDim}
            fontSize={10}
            fontFamily="'Noto Sans JP', sans-serif"
            fontWeight={600}
          >
            {CATEGORIES[i].emoji} {CATEGORIES[i].label}
          </text>
        ))}
        {dataPoints.map((p, i) => (
          <text
            key={`v${i}`}
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            fill={COLORS.chart[i]}
            fontSize={11}
            fontWeight={800}
            fontFamily="monospace"
          >
            {(data[CATEGORIES[i].key] || 0).toFixed(1)}
          </text>
        ))}
      </svg>
    </div>
  );
}
