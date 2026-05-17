import type { BodyPart, Exercise } from '@fitforge/core';
import { cn } from '@/lib/cn';

/**
 * ExerciseThumb — 動作縮圖佔位
 *
 * V1 用 SVG glyph + 漸層背景（之後接 Lottie 後替換）。
 * Glyph 依 bodyPart 變色與形狀。
 */

type Props = {
  exercise: Pick<Exercise, 'bodyPart' | 'slug'>;
  size?: number;
  animated?: boolean;
  className?: string;
};

const BODY_PART_HUE: Record<BodyPart, number> = {
  chest: 8,
  back: 200,
  shoulders: 38,
  arms: 280,
  legs: 150,
  core: 320,
  full_body: 16,
};

export function ExerciseThumb({ exercise, size = 76, animated, className }: Props) {
  const hue = BODY_PART_HUE[exercise.bodyPart];
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        animated && 'transition-transform hover:scale-[1.02]',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 35% 92%), hsl(${hue} 25% 88%))`,
      }}
      aria-hidden
    >
      <BarbellGlyph color={`hsl(${hue} 60% 35%)`} size={size * 0.6} />
    </div>
  );
}

function BarbellGlyph({ color, size }: { color: string; size: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" y1="20" x2="34" y2="20" />
      <rect x="2" y="14" width="4" height="12" rx="1" fill={color} opacity="0.95" />
      <rect x="34" y="14" width="4" height="12" rx="1" fill={color} opacity="0.95" />
      <rect x="8" y="17" width="3" height="6" rx="0.7" fill={color} opacity="0.55" />
      <rect x="29" y="17" width="3" height="6" rx="0.7" fill={color} opacity="0.55" />
    </svg>
  );
}
