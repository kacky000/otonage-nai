'use client';

import { COLORS, type CategoryDef } from '@/lib/types';

interface SliderInputProps {
  cat: CategoryDef;
  value: number;
  onChange: (value: number) => void;
}

export default function SliderInput({ cat, value, onChange }: SliderInputProps) {
  const valueColor = value >= 8 ? COLORS.accent : value >= 5 ? COLORS.gold : COLORS.success;

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span className="text-text-main text-sm font-semibold">
          {cat.emoji} {cat.label}
        </span>
        <span
          className="font-extrabold text-lg font-mono min-w-[30px] text-right"
          style={{ color: valueColor }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
      <div className="flex justify-between text-[10px] text-text-dim mt-0.5">
        <span>大人</span>
        <span>大人げない</span>
      </div>
    </div>
  );
}
