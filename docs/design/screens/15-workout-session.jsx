/* ============================================================
   FitForge · Active Workout — most critical UI
   ============================================================ */
const { useState, useEffect } = React;

/* ------------------------------------------------------------
   Workout data (the 4 states share this)
   ------------------------------------------------------------ */
const WORKOUT = {
  day: 'Day 1: 全身 A',
  exercises: [
    { id: 'squat',  zh: '深蹲',         en: 'Back Squat',     target: '70kg × 8',  sets: 3, doneSets: 3, iconKind: 'barbell'    },
    { id: 'bench',  zh: '槓鈴臥推',     en: 'Bench Press',    target: '80kg × 8–10', sets: 3, doneSets: 1, current: true, iconKind: 'barbell' },
    { id: 'row',    zh: '俯身划船',     en: 'Bent-over Row',  target: '60kg × 10', sets: 3, doneSets: 0, iconKind: 'barbell'    },
    { id: 'plank',  zh: '棒式',         en: 'Plank',          target: '30s × 3',   sets: 3, doneSets: 0, iconKind: 'activity'   },
  ],
};

const CURRENT_EX_IDX = 1; // bench
const CURRENT_EX = WORKOUT.exercises[CURRENT_EX_IDX];
const CURRENT_SET = 2;
const TOTAL_SETS = 3;

const LAST_TIME = { weight: 80, reps: 9, complete: true };

/* ------------------------------------------------------------
   iOS status bar
   ------------------------------------------------------------ */
function StatusBar() {
  return (
    <div className="absolute top-0 inset-x-0 h-[54px] z-50 flex items-end justify-between px-7 pb-1.5 pointer-events-none">
      <div className="text-foreground text-[15px] font-semibold tracking-[-0.01em]" style={{fontFeatureSettings: '"tnum"'}}>9:41</div>
      <div className="flex items-center gap-1.5 text-foreground">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.5"/>
          <rect x="4.5" y="5" width="3" height="6" rx="0.5"/>
          <rect x="9" y="3" width="3" height="8" rx="0.5"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.5"/>
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M1 4 A11 11 0 0 1 15 4"/>
          <path d="M3 6.5 A7.5 7.5 0 0 1 13 6.5"/>
          <path d="M5.3 9 A4 4 0 0 1 10.7 9"/>
          <circle cx="8" cy="10.2" r="0.7" fill="currentColor" stroke="none"/>
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" strokeOpacity="0.5"/>
          <rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor"/>
          <rect x="23" y="4" width="2" height="4" rx="1" fill="currentColor" fillOpacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Slim header — elapsed | day name | end button
   ------------------------------------------------------------ */
function WorkoutHeader() {
  return (
    <div className="absolute left-0 right-0 z-30"
         style={{
           top: 0,
           paddingTop: 54,
           background: 'hsl(var(--card))',
           borderBottom: '1px solid hsl(var(--border))',
         }}>
      <div className="h-[44px] px-3 flex items-center gap-2">
        {/* elapsed time */}
        <div className="inline-flex items-center gap-1.5 shrink-0">
          <span style={{ width: 6, height: 6, borderRadius: 3, background: 'hsl(var(--destructive))' }}></span>
          <span className="text-[14px] font-extrabold tracking-[-0.005em] num text-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            00:24:13
          </span>
        </div>

        {/* day name centered */}
        <div className="flex-1 min-w-0 text-center text-[13px] font-bold tracking-[-0.01em] truncate"
             style={{ color: 'hsl(var(--muted-foreground))' }}>
          {WORKOUT.day}
        </div>

        {/* wake lock tiny indicator + end button */}
        <div className="inline-flex items-center gap-1 shrink-0">
          <div className="grid place-items-center" style={{
            width: 22, height: 22, borderRadius: 7,
            color: 'hsl(var(--muted-foreground))',
          }} aria-label="螢幕不鎖">
            <i data-lucide="lock-open" style={{ width: 12, height: 12, strokeWidth: 2.2 }}></i>
          </div>
          <button className="px-2.5 py-1.5 transition-colors duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                  style={{
                    color: 'hsl(var(--destructive))',
                    fontSize: 13, fontWeight: 800, letterSpacing: '-0.005em',
                    borderRadius: 8,
                  }}>
            結束
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Lottie thumbnail (small bench-press loop)
   ------------------------------------------------------------ */
function MiniLottie() {
  return (
    <svg viewBox="0 0 120 80" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {/* bench */}
      <rect x="32" y="58" width="56" height="6" rx="2" fill="hsl(var(--foreground) / 0.22)"/>
      {/* head */}
      <circle cx="80" cy="52" r="6" fill="hsl(var(--foreground) / 0.85)"/>
      {/* torso */}
      <rect x="44" y="48" width="40" height="12" rx="3" fill="hsl(var(--foreground))"/>
      {/* arms */}
      <g style={{ transform: 'scaleY(0.85)', transformOrigin: '58px 48px' }}>
        <rect x="56" y="22" width="6" height="28" rx="3" fill="hsl(var(--foreground) / 0.85)"/>
      </g>
      {/* barbell */}
      <g>
        <rect x="20" y="22" width="78" height="4" rx="2" fill="hsl(var(--foreground))"/>
        <rect x="14" y="14" width="8" height="20" rx="2" fill="hsl(var(--primary))"/>
        <rect x="96" y="14" width="8" height="20" rx="2" fill="hsl(var(--primary))"/>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------
   Main visual: exercise name + set indicator + target + thumb
   ------------------------------------------------------------ */
function MainVisual() {
  return (
    <div className="pt-5 px-5 pb-1 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        {/* set indicator */}
        <div className="inline-flex items-baseline gap-1">
          <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
            第
          </span>
          <span className="text-[20px] font-extrabold tracking-[-0.02em] num"
                style={{ color: 'hsl(var(--primary))' }}>
            {CURRENT_SET}
          </span>
          <span className="text-[14px] font-bold tracking-[-0.01em]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            / {TOTAL_SETS}
          </span>
          <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase ml-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            組
          </span>
        </div>

        {/* exercise name */}
        <h2 className="mt-1 text-[26px] font-extrabold tracking-[-0.025em] leading-[1.1] text-foreground" style={{textWrap:'balance'}}>
          {CURRENT_EX.zh}
        </h2>
        <div className="text-[12px] font-medium leading-tight"
             style={{ color: 'hsl(var(--muted-foreground))' }}>
          {CURRENT_EX.en}
        </div>

        {/* target line */}
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1"
             style={{ background: 'hsl(var(--secondary))' }}>
          <i data-lucide="target" style={{ width: 12, height: 12, color: 'hsl(var(--primary))', strokeWidth: 2.4 }}></i>
          <span className="text-[12px] font-bold num text-foreground" style={{ letterSpacing: '-0.005em' }}>
            目標 {CURRENT_EX.target}
          </span>
        </div>
      </div>

      {/* mini lottie thumb */}
      <button className="shrink-0 grid place-items-center overflow-hidden relative outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              style={{ width: 76, height: 76, borderRadius: 14, background: 'hsl(var(--secondary))' }}
              aria-label="放大示範">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 30% 25%, hsl(var(--foreground) / 0.05), transparent 60%)',
        }}></div>
        <MiniLottie />
        <span className="absolute bottom-1 right-1 grid place-items-center"
              style={{
                width: 18, height: 18, borderRadius: 9,
                background: 'hsl(var(--background) / 0.85)',
                color: 'hsl(var(--foreground))',
              }}>
          <i data-lucide="maximize-2" style={{ width: 9, height: 9, strokeWidth: 2.6 }}></i>
        </span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------
   Big stepper (used for weight + reps)
   ------------------------------------------------------------ */
function BigStepper({ label, unit, value, step = 1, edited }) {
  // pure UI; we keep value local for interactivity
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);

  const dec = () => setV(x => Math.max(0, +(x - step).toFixed(2)));
  const inc = () => setV(x => +(x + step).toFixed(2));

  const display = (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const isEdited = edited || v !== value;

  return (
    <div className="flex-1 min-w-0 rounded-2xl px-3 py-3"
         style={{
           background: 'hsl(var(--card))',
           boxShadow: 'inset 0 0 0 1px hsl(var(--border))',
         }}>
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {label}
        </span>
        <span className="text-[10px] font-bold tracking-[1.4px] uppercase" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
          {unit}
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-1">
        <button className="big-step-btn" onClick={dec} aria-label={`${label}減`}>
          <i data-lucide="minus" style={{ width: 18, height: 18, strokeWidth: 2.8 }}></i>
        </button>
        <span className={`big-num ${isEdited ? 'edited' : ''}`}>{display}</span>
        <button className="big-step-btn" onClick={inc} aria-label={`${label}加`}>
          <i data-lucide="plus" style={{ width: 18, height: 18, strokeWidth: 2.8 }}></i>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   RPE chip selector (1-10)
   ------------------------------------------------------------ */
function RpeRow({ value }) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);

  // Color by RPE level: 1-5 success, 6-8 warning, 9-10 primary (hard)
  const colorFor = (i) => {
    if (i <= 5) return 'success';
    if (i <= 8) return 'warning';
    return 'primary';
  };
  const tones = {
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    primary: 'hsl(var(--primary))',
  };

  return (
    <div className="px-5 mt-3">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
          RPE · 這組多難
        </span>
        <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
          可選
        </span>
      </div>
      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          const isActive = n === v;
          const tone = tones[colorFor(n)];
          return (
            <button
              key={n}
              type="button"
              onClick={() => setV(prev => prev === n ? null : n)}
              className="transition-all duration-150 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 9,
                background: isActive ? tone : 'hsl(var(--secondary))',
                color: isActive ? '#fff' : 'hsl(var(--foreground))',
                fontFamily: 'Inter',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                boxShadow: isActive ? `0 4px 10px -3px ${tone.replace(')', ' / 0.45)')}` : 'none',
              }}>
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Primary CTA + secondary actions
   ------------------------------------------------------------ */
function CompleteCTA({ glow }) {
  return (
    <div className="px-5 mt-4">
      <button
        className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl
          bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.99]
          transition-all duration-200 ease-forge ${glow ? 'cta-active' : ''}`}
        style={{
          height: 64,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: '-0.005em',
          boxShadow: glow ? undefined : '0 8px 20px -6px hsl(var(--primary) / 0.40)',
        }}>
        <i data-lucide="check" style={{ width: 22, height: 22, strokeWidth: 2.8 }}></i>
        完成這組
      </button>
    </div>
  );
}

function SecondaryActions() {
  const items = [
    { icon: 'skip-forward', label: '跳過這組' },
    { icon: 'plus-circle',  label: '加一組'  },
    { icon: 'list',         label: '切換動作' },
  ];
  return (
    <div className="px-5 mt-3 flex items-center justify-around">
      {items.map((it, i) => (
        <button key={i}
                className="flex flex-col items-center gap-1 px-3 py-1.5 transition-colors duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{ color: 'hsl(var(--muted-foreground))', borderRadius: 10 }}>
          <i data-lucide={it.icon} style={{ width: 18, height: 18, strokeWidth: 2 }}></i>
          <span className="text-[10.5px] font-semibold tracking-[0.4px]">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   Bottom sheet (collapsed peek only)
   ------------------------------------------------------------ */
function SheetPeek() {
  return (
    <div className="absolute left-0 right-0 bottom-0 z-30"
         style={{
           paddingBottom: 14,
           paddingTop: 10,
           background: 'hsl(var(--card))',
           borderTop: '1px solid hsl(var(--border))',
         }}>
      <div className="grid place-items-center">
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'hsl(var(--muted-foreground) / 0.40)' }}></div>
      </div>
      <div className="mt-2 px-5 flex items-center justify-between">
        <span className="text-[11.5px] font-bold tracking-[0.2px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
          動作 <span className="num text-foreground">2</span>/{WORKOUT.exercises.length}
        </span>
        <span className="text-[10.5px] font-semibold tracking-[0.4px]"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
          上拉看全部
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Bottom sheet — expanded (state 4)
   ------------------------------------------------------------ */
function ExerciseListSheet() {
  return (
    <div className="absolute left-0 right-0 bottom-0 z-40 flex flex-col"
         style={{
           height: '60%',
           background: 'hsl(var(--card))',
           borderTopLeftRadius: 24, borderTopRightRadius: 24,
           boxShadow: '0 -20px 60px -10px rgba(0,0,0,0.45)',
         }}>
      <div className="pt-2 pb-1 grid place-items-center shrink-0">
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'hsl(var(--muted-foreground) / 0.40)' }}></div>
      </div>

      <div className="px-5 pt-2 pb-2 flex items-baseline justify-between shrink-0">
        <h3 className="text-[17px] font-extrabold tracking-[-0.02em] text-foreground">本次訓練</h3>
        <span className="text-[11px] font-bold tracking-[1.4px] uppercase num"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
          {WORKOUT.exercises.filter(e => e.doneSets === e.sets).length}<span style={{ opacity: 0.6 }}>/{WORKOUT.exercises.length}</span> 完成
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto screen-scroll px-5 pb-6">
        <div className="space-y-2">
          {WORKOUT.exercises.map(ex => {
            const isCurrent = ex.current;
            const isDone = ex.doneSets === ex.sets;
            return (
              <button key={ex.id} type="button"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/25 ${isCurrent ? 'ex-row-current' : 'ex-row-default'}`}>
                {/* status icon */}
                <div className="shrink-0 grid place-items-center"
                     style={{
                       width: 32, height: 32, borderRadius: 10,
                       background: isDone ? 'hsl(var(--success))' : isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                       color: isDone ? 'hsl(var(--success-foreground))' : isCurrent ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                     }}>
                  {isDone ? (
                    <i data-lucide="check" style={{ width: 16, height: 16, strokeWidth: 3 }}></i>
                  ) : isCurrent ? (
                    <i data-lucide="play" style={{ width: 13, height: 13, fill: 'currentColor', strokeWidth: 2.2 }}></i>
                  ) : (
                    <i data-lucide="dumbbell" style={{ width: 14, height: 14, strokeWidth: 2 }}></i>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[14px] font-extrabold tracking-[-0.015em] truncate text-foreground">{ex.zh}</span>
                    <span className="text-[10.5px] font-medium truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{ex.en}</span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] num"
                       style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {ex.target}
                  </div>
                </div>

                {/* set dots */}
                <div className="shrink-0 flex items-center gap-1">
                  {Array.from({ length: ex.sets }, (_, i) => (
                    <span key={i}
                          style={{
                            width: 9, height: 9, borderRadius: 5,
                            background: i < ex.doneSets
                              ? (isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--success))')
                              : 'transparent',
                            boxShadow: i < ex.doneSets
                              ? 'none'
                              : 'inset 0 0 0 1.5px hsl(var(--border))',
                          }}></span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Rest overlay (state 3)
   ------------------------------------------------------------ */
function RestOverlay() {
  return (
    <div className="rest-backdrop"
         style={{
           top: 98, // below status bar + header
           bottom: 56, // above sheet peek
         }}>
      {/* dismiss hint at top */}
      <div className="pt-2 grid place-items-center">
        <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
          休息中 · 點空白略過
        </span>
      </div>

      {/* big timer with conic ring */}
      <div className="flex-1 grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="timer-ring">
            <div className="timer-ring-inner">
              <div className="rest-num text-foreground" style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 800,
                fontSize: 64,
                letterSpacing: '-0.04em',
                color: 'hsl(var(--primary))',
              }}>
                00:45
              </div>
            </div>
          </div>

          {/* next set + last */}
          <div className="text-center">
            <div className="text-[10.5px] font-bold tracking-[1.6px] uppercase mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              下一組
            </div>
            <div className="text-[16px] font-extrabold tracking-[-0.015em] num" style={{ color: 'hsl(var(--foreground))' }}>
              {CURRENT_EX.zh} · 80kg × 8–10
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5"
                 style={{
                   background: 'hsl(var(--success) / 0.14)',
                   color: 'hsl(var(--success))',
                 }}>
              <i data-lucide="check" style={{ width: 11, height: 11, strokeWidth: 3 }}></i>
              <span className="text-[11px] font-bold num">上次 {LAST_TIME.weight}kg × {LAST_TIME.reps}</span>
            </div>
          </div>
        </div>
      </div>

      {/* action row */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-2.5">
        <button className="inline-flex items-center justify-center gap-1.5 rounded-xl transition-colors duration-200 ease-forge"
                style={{
                  height: 48,
                  background: 'transparent',
                  color: 'hsl(var(--foreground))',
                  boxShadow: 'inset 0 0 0 1.5px hsl(var(--border))',
                  fontSize: 14, fontWeight: 800,
                }}>
          <i data-lucide="skip-forward" style={{ width: 15, height: 15, strokeWidth: 2.2 }}></i>
          跳過
        </button>
        <button className="inline-flex items-center justify-center gap-1.5 rounded-xl transition-colors duration-200 ease-forge"
                style={{
                  height: 48,
                  background: 'transparent',
                  color: 'hsl(var(--foreground))',
                  boxShadow: 'inset 0 0 0 1.5px hsl(var(--border))',
                  fontSize: 14, fontWeight: 800,
                }}>
          <i data-lucide="plus" style={{ width: 15, height: 15, strokeWidth: 2.4 }}></i>
          <span className="num">+15</span> 秒
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   The full screen — toggled by state prop
   ============================================================ */
function ActiveWorkoutScreen({ state }) {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  // STATE values
  // 1 = fresh (default values, no rpe)
  // 2 = input edited (weight 82.5, reps 10, rpe 8)
  // 3 = rest overlay shown
  // 4 = sheet expanded

  const isEdited = state === 2;
  const weight = isEdited ? 82.5 : 80;
  const reps   = isEdited ? 10   : 8;
  const rpe    = isEdited ? 8    : null;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="screen-dynamic-island"></div>
      <StatusBar />
      <WorkoutHeader />

      {/* body sits between header and sheet peek */}
      <div className="absolute left-0 right-0"
           style={{ top: 98, bottom: 56 }}>

        <MainVisual />

        {/* steppers */}
        <div className="px-5 mt-3 flex items-stretch gap-2.5">
          <BigStepper label="重量" unit="KG"  value={weight} step={2.5} edited={isEdited} />
          <BigStepper label="次數" unit="REPS" value={reps}   step={1}   edited={isEdited} />
        </div>

        {/* RPE */}
        <RpeRow value={rpe} />

        {/* CTA */}
        <CompleteCTA glow={isEdited} />

        {/* secondary */}
        <SecondaryActions />
      </div>

      {/* sheet peek (always present except when expanded) */}
      {state !== 4 && <SheetPeek />}

      {/* Rest overlay */}
      {state === 3 && <RestOverlay />}

      {/* Expanded sheet */}
      {state === 4 && <ExerciseListSheet />}
    </div>
  );
}

/* ------------------------------------------------------------
   Phones + Apps
   ------------------------------------------------------------ */
function Phone({ theme, state }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="stage-eyebrow flex items-center gap-2">
        <span className="dot"></span>{theme === 'light' ? 'LIGHT MODE' : 'DARK MODE'}
        <span className="mono text-[10.5px] text-[#9F9FA8]">· 375 × 812</span>
      </div>
      <div className={`phone theme-${theme}`}>
        <div className="screen">
          <ActiveWorkoutScreen state={state} />
        </div>
      </div>
    </div>
  );
}

function App1() { return (<><Phone theme="light" state={1} /><Phone theme="dark" state={1} /></>); }
function App2() { return (<><Phone theme="light" state={2} /><Phone theme="dark" state={2} /></>); }
function App3() { return (<><Phone theme="light" state={3} /><Phone theme="dark" state={3} /></>); }
function App4() { return (<><Phone theme="light" state={4} /><Phone theme="dark" state={4} /></>); }

ReactDOM.createRoot(document.getElementById('root-1')).render(<App1 />);
ReactDOM.createRoot(document.getElementById('root-2')).render(<App2 />);
ReactDOM.createRoot(document.getElementById('root-3')).render(<App3 />);
ReactDOM.createRoot(document.getElementById('root-4')).render(<App4 />);
