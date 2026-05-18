import { useMemo } from 'react';
import type { BodyPart, Exercise } from '@fitforge/core';
import { cn } from '@/lib/cn';

/**
 * ExerciseAnimation — §20 動作動畫
 *
 * 對應 docs/design/screens/20-lottie-style-guide.html。設計稿用 CSS-animated
 * inline SVG (而非 Lottie JSON)、保留同樣的 spec：3-4s loop、cubic-bezier
 * (0.45, 0, 0.55, 1) ease、prefers-reduced-motion 停止動畫。
 *
 * 30 個動作以 bodyPart 為單位分 7 種動作 family、共用一個抽象 stick
 * figure、用顏色 + 動作幅度差異化。bodyPart 對應：
 *
 * | bodyPart   | motion           | duration |
 * | ---------- | ---------------- | -------- |
 * | chest      | press 推       | 3.0s     |
 * | back       | pull 拉        | 3.0s     |
 * | shoulders  | lateral raise   | 2.6s     |
 * | arms       | curl 彎舉      | 2.4s     |
 * | legs       | squat 蹲       | 3.5s     |
 * | core       | hold / breath   | 4.0s     |
 * | full_body  | swing 擺盪     | 2.8s     |
 *
 * V2 可以替換成真正的 Lottie 檔案 (個別動作專屬)、保留 prop API 一致。
 */

type Props = {
  exercise: Pick<Exercise, 'bodyPart' | 'slug'>;
  size?: number;
  /** false 時凍住第一幀 (例如卡片預覽不要動)。預設 true。 */
  animate?: boolean;
  className?: string;
};

const MOTION_BY_BODY_PART: Record<BodyPart, MotionKey> = {
  chest: 'press',
  back: 'pull',
  shoulders: 'raise',
  arms: 'curl',
  legs: 'squat',
  core: 'hold',
  full_body: 'swing',
};

type MotionKey = 'press' | 'pull' | 'raise' | 'curl' | 'squat' | 'hold' | 'swing';

const BG_HUE_BY_BODY_PART: Record<BodyPart, number> = {
  chest: 8,
  back: 200,
  shoulders: 38,
  arms: 280,
  legs: 150,
  core: 320,
  full_body: 16,
};

export function ExerciseAnimation({ exercise, size = 120, animate = true, className }: Props) {
  const motion = MOTION_BY_BODY_PART[exercise.bodyPart];
  const hue = BG_HUE_BY_BODY_PART[exercise.bodyPart];
  // unique animation prefix per instance avoids :scope conflicts when multiple
  // animations are visible at once (e.g. exercise library grid)
  const id = useMemo(() => `anim-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <div
      className={cn('relative overflow-hidden rounded-lg', className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 35% 95%), hsl(${hue} 28% 90%))`,
      }}
      aria-hidden
    >
      <Figure motion={motion} animate={animate} id={id} accentHue={hue} />
    </div>
  );
}

// ===== Figure (200x200 viewBox 抽象 stick figure) ===========================

function Figure({
  motion,
  animate,
  id,
  accentHue,
}: {
  motion: MotionKey;
  animate: boolean;
  id: string;
  accentHue: number;
}) {
  const accent = `hsl(${accentHue} 70% 32%)`;
  const stroke = `hsl(${accentHue} 60% 30%)`;
  // motion → JSX 由 switch 分流、共享 head / torso 基底
  const parts = renderMotion(motion, id, accent);

  return (
    <svg
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke={stroke}
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style>{styleForMotion(motion, id, animate)}</style>
      {/* ground line */}
      <line x1="20" y1="178" x2="180" y2="178" opacity="0.25" strokeWidth={1.5} />
      {parts}
    </svg>
  );
}

function renderMotion(motion: MotionKey, id: string, accent: string): JSX.Element {
  switch (motion) {
    case 'press':
      // chest press — torso static, arms extend up
      return (
        <g>
          <circle cx="100" cy="48" r="14" />
          <line x1="100" y1="62" x2="100" y2="120" />
          <line x1="100" y1="120" x2="78" y2="172" />
          <line x1="100" y1="120" x2="122" y2="172" />
          {/* dumbbells */}
          <g className={`${id}-arm-l`} style={{ transformOrigin: '100px 80px' }}>
            <line x1="100" y1="80" x2="58" y2="100" />
            <circle cx="50" cy="103" r="9" fill={accent} stroke="none" />
          </g>
          <g className={`${id}-arm-r`} style={{ transformOrigin: '100px 80px' }}>
            <line x1="100" y1="80" x2="142" y2="100" />
            <circle cx="150" cy="103" r="9" fill={accent} stroke="none" />
          </g>
        </g>
      );
    case 'pull':
      // back row — arms pull back toward torso
      return (
        <g>
          <circle cx="100" cy="48" r="14" />
          <line x1="100" y1="62" x2="100" y2="120" />
          <line x1="100" y1="120" x2="78" y2="172" />
          <line x1="100" y1="120" x2="122" y2="172" />
          <g className={`${id}-arm-l`} style={{ transformOrigin: '100px 80px' }}>
            <line x1="100" y1="80" x2="42" y2="92" />
            <rect x="32" y="86" width="6" height="14" rx="1.5" fill={accent} stroke="none" />
          </g>
          <g className={`${id}-arm-r`} style={{ transformOrigin: '100px 80px' }}>
            <line x1="100" y1="80" x2="158" y2="92" />
            <rect x="162" y="86" width="6" height="14" rx="1.5" fill={accent} stroke="none" />
          </g>
        </g>
      );
    case 'raise':
      // lateral raise — arms swing up to shoulder height
      return (
        <g>
          <circle cx="100" cy="48" r="14" />
          <line x1="100" y1="62" x2="100" y2="130" />
          <line x1="100" y1="130" x2="82" y2="172" />
          <line x1="100" y1="130" x2="118" y2="172" />
          <g className={`${id}-arm-l`} style={{ transformOrigin: '100px 78px' }}>
            <line x1="100" y1="78" x2="74" y2="124" />
            <circle cx="68" cy="128" r="8" fill={accent} stroke="none" />
          </g>
          <g className={`${id}-arm-r`} style={{ transformOrigin: '100px 78px' }}>
            <line x1="100" y1="78" x2="126" y2="124" />
            <circle cx="132" cy="128" r="8" fill={accent} stroke="none" />
          </g>
        </g>
      );
    case 'curl':
      // biceps curl — forearm rotates around elbow
      return (
        <g>
          <circle cx="100" cy="48" r="14" />
          <line x1="100" y1="62" x2="100" y2="140" />
          <line x1="100" y1="140" x2="82" y2="172" />
          <line x1="100" y1="140" x2="118" y2="172" />
          {/* upper arms */}
          <line x1="100" y1="76" x2="76" y2="120" />
          <line x1="100" y1="76" x2="124" y2="120" />
          {/* forearms (rotate) */}
          <g className={`${id}-fore-l`} style={{ transformOrigin: '76px 120px' }}>
            <line x1="76" y1="120" x2="58" y2="156" />
            <rect x="52" y="156" width="14" height="6" rx="1.5" fill={accent} stroke="none" />
          </g>
          <g className={`${id}-fore-r`} style={{ transformOrigin: '124px 120px' }}>
            <line x1="124" y1="120" x2="142" y2="156" />
            <rect x="134" y="156" width="14" height="6" rx="1.5" fill={accent} stroke="none" />
          </g>
        </g>
      );
    case 'squat': {
      // whole figure rises/falls
      return (
        <g className={`${id}-body`}>
          <circle cx="100" cy="48" r="14" />
          <line x1="100" y1="62" x2="100" y2="120" />
          <line x1="100" y1="120" x2="76" y2="158" />
          <line x1="100" y1="120" x2="124" y2="158" />
          <line x1="76" y1="158" x2="76" y2="178" />
          <line x1="124" y1="158" x2="124" y2="178" />
          {/* barbell on shoulders */}
          <line x1="64" y1="74" x2="136" y2="74" strokeWidth={4.5} />
          <rect x="58" y="68" width="6" height="12" rx="1.5" fill={accent} stroke="none" />
          <rect x="136" y="68" width="6" height="12" rx="1.5" fill={accent} stroke="none" />
        </g>
      );
    }
    case 'hold':
      // plank — figure horizontal, subtle breath pulse
      return (
        <g className={`${id}-body`}>
          {/* horizontal line for spine */}
          <line x1="48" y1="118" x2="156" y2="118" strokeWidth={5} />
          {/* head */}
          <circle cx="44" cy="110" r="12" />
          {/* forearm props */}
          <line x1="56" y1="118" x2="56" y2="158" />
          <line x1="72" y1="118" x2="72" y2="158" />
          <line x1="56" y1="158" x2="76" y2="158" />
          {/* legs to toes */}
          <line x1="156" y1="118" x2="172" y2="158" />
          <line x1="172" y1="158" x2="176" y2="166" />
          {/* core pulse dot */}
          <circle cx="110" cy="118" r="6" fill={accent} stroke="none" className={`${id}-pulse`} />
        </g>
      );
    case 'swing':
      // kettlebell swing — body upright, arm + weight swing
      return (
        <g>
          <circle cx="100" cy="48" r="14" />
          <line x1="100" y1="62" x2="100" y2="120" />
          <line x1="100" y1="120" x2="78" y2="172" />
          <line x1="100" y1="120" x2="122" y2="172" />
          <g className={`${id}-arm`} style={{ transformOrigin: '100px 78px' }}>
            <line x1="100" y1="78" x2="100" y2="146" strokeWidth={4} />
            <circle cx="100" cy="156" r="11" fill={accent} stroke="none" />
            <rect x="94" y="142" width="12" height="6" rx="1.5" fill={accent} stroke="none" />
          </g>
        </g>
      );
  }
}

// ===== Keyframe / animation rules ===========================================

const EASE = 'cubic-bezier(0.45, 0, 0.55, 1)';

function styleForMotion(motion: MotionKey, id: string, animate: boolean): string {
  // Keep both keyframes and target selectors prefixed so multiple anims coexist.
  const k = (name: string, frames: string) => `@keyframes ${id}-${name} { ${frames} }`;
  const rule = (sel: string, anim: string) => `.${id}-${sel} { animation: ${anim}; }`;
  const motionRule = (sel: string, dur: number, name: string) =>
    rule(sel, `${id}-${name} ${dur}s ${EASE} infinite`);

  // prefers-reduced-motion + animate=false 都凍住
  const freeze = `@media (prefers-reduced-motion: reduce) {
    [class*="${id}-"] { animation: none !important; }
  }`;
  if (!animate) {
    return freeze.replace('(prefers-reduced-motion: reduce)', 'all');
  }

  switch (motion) {
    case 'press':
      return [
        k('arm', '0%,100%{transform:rotate(0deg)} 45%,55%{transform:rotate(-46deg)}'),
        motionRule('arm-l', 3.0, 'arm'),
        k('arm-r', '0%,100%{transform:rotate(0deg)} 45%,55%{transform:rotate(46deg)}'),
        motionRule('arm-r', 3.0, 'arm-r'),
        freeze,
      ].join('\n');
    case 'pull':
      return [
        k('arm-l', '0%,100%{transform:rotate(0deg)} 45%,55%{transform:rotate(38deg)}'),
        k('arm-r', '0%,100%{transform:rotate(0deg)} 45%,55%{transform:rotate(-38deg)}'),
        motionRule('arm-l', 3.0, 'arm-l'),
        motionRule('arm-r', 3.0, 'arm-r'),
        freeze,
      ].join('\n');
    case 'raise':
      return [
        k('arm-l', '0%,100%{transform:rotate(0deg)} 45%,55%{transform:rotate(-72deg)}'),
        k('arm-r', '0%,100%{transform:rotate(0deg)} 45%,55%{transform:rotate(72deg)}'),
        motionRule('arm-l', 2.6, 'arm-l'),
        motionRule('arm-r', 2.6, 'arm-r'),
        freeze,
      ].join('\n');
    case 'curl':
      return [
        k('fore-l', '0%,100%{transform:rotate(0deg)} 45%,55%{transform:rotate(110deg)}'),
        k('fore-r', '0%,100%{transform:rotate(0deg)} 45%,55%{transform:rotate(-110deg)}'),
        motionRule('fore-l', 2.4, 'fore-l'),
        motionRule('fore-r', 2.4, 'fore-r'),
        freeze,
      ].join('\n');
    case 'squat':
      return [
        k('body', '0%,100%{transform:translateY(0)} 45%,55%{transform:translateY(20px)}'),
        motionRule('body', 3.5, 'body'),
        freeze,
      ].join('\n');
    case 'hold':
      return [
        k('body', '0%,100%{transform:translateY(0)} 50%{transform:translateY(1.5px)}'),
        k('pulse', '0%,100%{opacity:0.4; r:5} 50%{opacity:0.95; r:7}'),
        motionRule('body', 4.0, 'body'),
        motionRule('pulse', 2.0, 'pulse'),
        freeze,
      ].join('\n');
    case 'swing':
      return [
        k('arm', '0%,100%{transform:rotate(0deg)} 50%{transform:rotate(48deg)}'),
        motionRule('arm', 2.8, 'arm'),
        freeze,
      ].join('\n');
  }
}
