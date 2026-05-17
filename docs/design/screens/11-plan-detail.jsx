/* ============================================================
   FitForge · Plan Detail — preset + custom variants
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ------------------------------------------------------------
   Mock data
   ------------------------------------------------------------ */
const PRESET_PLAN = {
  id: 'preset-1',
  isPreset: true,
  active: true,
  name: '新手全身入門 A/B',
  desc: '為剛開始重訓的人設計。兩天輪替全身、6 週後力量會明顯提升。',
  goal: '增肌',
  weeks: 6,
  freq: '週 3 次',
  duration: 45,
  days: [
    {
      id: 'd1', name: 'Day 1', focus: '全身 A',
      exercises: [
        { zh: '深蹲',         en: 'Back Squat',     setsReps: '3 × 8',    rest: 90, iconKind: 'barbell'  },
        { zh: '槓鈴臥推',     en: 'Bench Press',    setsReps: '3 × 8',    rest: 90, iconKind: 'barbell'  },
        { zh: '俯身划船',     en: 'Bent-over Row',  setsReps: '3 × 8',    rest: 90, iconKind: 'dumbbell' },
        { zh: '棒式',         en: 'Plank',          setsReps: '3 × 30s',  rest: 30, iconKind: 'activity' },
      ],
    },
    {
      id: 'd2', name: 'Day 2', focus: '全身 B',
      exercises: [
        { zh: '硬舉',         en: 'Deadlift',         setsReps: '3 × 6',     rest: 120, iconKind: 'barbell'  },
        { zh: '站姿肩推',     en: 'Overhead Press',   setsReps: '3 × 8',     rest: 90,  iconKind: 'dumbbell' },
        { zh: '引體向上',     en: 'Pull-up',          setsReps: '3 × AMRAP', rest: 90,  iconKind: 'cable'    },
        { zh: '懸吊提腿',     en: 'Hanging Leg Raise', setsReps: '3 × 12',   rest: 60,  iconKind: 'activity' },
      ],
    },
  ],
};

const CUSTOM_PLAN = {
  id: 'custom-1',
  isPreset: false,
  active: true,
  name: '我的胸日',
  desc: '挑戰平板臥推 PR、輔以孤立動作收尾。每週一次、衝強度。',
  goal: '增肌',
  weeks: null,
  freq: '週 1 次',
  duration: 50,
  days: [
    {
      id: 'd1', name: 'Day 1', focus: '胸日',
      exercises: [
        { zh: '平板臥推',     en: 'Bench Press',         setsReps: '4 × 8',     rest: 90, iconKind: 'barbell'  },
        { zh: '上斜啞鈴推',   en: 'Incline DB Press',    setsReps: '3 × 10',    rest: 75, iconKind: 'dumbbell' },
        { zh: '滑輪夾胸',     en: 'Cable Fly',           setsReps: '3 × 12',    rest: 60, iconKind: 'cable'    },
        { zh: '伏地挺身',     en: 'Push-up',             setsReps: '3 × AMRAP', rest: 45, iconKind: 'activity' },
      ],
    },
  ],
};

/* ------------------------------------------------------------
   iOS status bar
   ------------------------------------------------------------ */
function StatusBar() {
  return (
    <div className="absolute top-0 inset-x-0 h-[54px] z-40 flex items-end justify-between px-7 pb-1.5 pointer-events-none">
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
   Sticky top header (back · title · more)
   ------------------------------------------------------------ */
function DetailHeader({ title }) {
  return (
    <div className="absolute left-0 right-0 top-0 head-blur z-30"
         style={{
           paddingTop: 54,
           paddingBottom: 10,
           borderBottom: '1px solid hsl(var(--border) / 0.5)',
         }}>
      <div className="px-3 flex items-center justify-between gap-2">
        <button className="grid place-items-center transition-colors duration-200 ease-forge hover:bg-secondary/70 outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{ width: 38, height: 38, borderRadius: 12, color: 'hsl(var(--foreground))' }}
                aria-label="返回">
          <i data-lucide="chevron-left" style={{ width: 22, height: 22, strokeWidth: 2.2 }}></i>
        </button>
        <div className="flex-1 min-w-0 text-center text-[14px] font-bold tracking-[-0.01em] truncate text-foreground">
          {title}
        </div>
        <button className="grid place-items-center transition-colors duration-200 ease-forge hover:bg-secondary/70 outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{ width: 38, height: 38, borderRadius: 12, color: 'hsl(var(--foreground))' }}
                aria-label="更多選項">
          <i data-lucide="more-vertical" style={{ width: 20, height: 20, strokeWidth: 2.2 }}></i>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Hero (name, desc, chips, badge)
   ------------------------------------------------------------ */
function PresetBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[10px] font-extrabold tracking-[1.2px] uppercase"
          style={{
            background: 'hsl(var(--primary) / 0.12)',
            color: 'hsl(var(--primary))',
            border: '1px solid hsl(var(--primary) / 0.20)',
          }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.5l2.7 6.4 6.9.5-5.2 4.5 1.6 6.7L12 17l-6 3.6 1.6-6.7-5.2-4.5 6.9-.5z"/>
      </svg>
      預設
    </span>
  );
}

function StatChip({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold"
          style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
      <i data-lucide={icon} style={{ width: 13, height: 13, color: 'hsl(var(--primary))' }}></i>
      {children}
    </span>
  );
}

function Hero({ plan }) {
  return (
    <div className="px-5">
      {/* eyebrow with active+preset state */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        {plan.active ? (
          <div className="inline-flex items-center gap-1.5">
            <span className="live-dot"></span>
            <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase" style={{ color: 'hsl(var(--primary))' }}>
              目前正在跑
            </span>
          </div>
        ) : (
          <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
            未使用
          </span>
        )}
        {plan.isPreset && <PresetBadge />}
      </div>

      {/* big title */}
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.1] text-foreground" style={{textWrap:'balance'}}>
        {plan.name}
      </h1>
      <p className="mt-2 text-[14px] leading-[1.55]" style={{ color: 'hsl(var(--muted-foreground))', textWrap: 'pretty' }}>
        {plan.desc}
      </p>

      {/* stat chips */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <StatChip icon="timer">每次 <span className="num">{plan.duration}</span> 分</StatChip>
        <StatChip icon="calendar">{plan.freq}</StatChip>
        <StatChip icon="target">{plan.goal}</StatChip>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Exercise thumb + row
   ------------------------------------------------------------ */
function ExerciseThumb({ kind, size = 52 }) {
  return (
    <div className="relative grid place-items-center overflow-hidden shrink-0"
         style={{ width: size, height: size, borderRadius: 12, background: 'hsl(var(--secondary))' }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 30% 25%, hsl(var(--foreground) / 0.04), transparent 60%)',
      }}></div>
      <div style={{ color: 'hsl(var(--foreground))' }}>
        {kind === 'barbell' ? (
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 64 64" fill="currentColor" aria-hidden>
            <rect x="3"  y="26" width="4"  height="12" rx="1.2"/>
            <rect x="57" y="26" width="4"  height="12" rx="1.2"/>
            <rect x="8"  y="20" width="6"  height="24" rx="1.6"/>
            <rect x="50" y="20" width="6"  height="24" rx="1.6"/>
            <rect x="15" y="24" width="4"  height="16" rx="1.2"/>
            <rect x="45" y="24" width="4"  height="16" rx="1.2"/>
            <rect x="14" y="30" width="36" height="4"  rx="1"/>
          </svg>
        ) : kind === 'cable' ? (
          <i data-lucide="cable" style={{ width: size * 0.50, height: size * 0.50 }}></i>
        ) : kind === 'activity' ? (
          <i data-lucide="activity" style={{ width: size * 0.50, height: size * 0.50 }}></i>
        ) : (
          <i data-lucide="dumbbell" style={{ width: size * 0.50, height: size * 0.50 }}></i>
        )}
      </div>
      <div className="absolute top-1 right-1 inline-flex items-center rounded-full"
           style={{
             padding: '2px 5px 2px 4px',
             background: 'hsl(var(--background) / 0.92)',
             color: 'hsl(var(--foreground))',
             fontSize: 8.5, fontWeight: 800, letterSpacing: 0.5, gap: 2,
           }}>
        <i data-lucide="play" style={{ width: 7, height: 7, strokeWidth: 3.5, fill: 'currentColor' }}></i>
        <span>LOOP</span>
      </div>
    </div>
  );
}

function ExerciseRow({ ex, index, total }) {
  return (
    <div className="flex items-center gap-3 py-2.5"
         style={{ borderTop: index === 0 ? 'none' : '1px solid hsl(var(--border))' }}>
      <ExerciseThumb kind={ex.iconKind} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 truncate">
          <span className="text-[15px] font-bold tracking-[-0.015em] text-foreground">{ex.zh}</span>
          <span className="text-[11.5px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{ex.en}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11.5px]" style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>
          <span className="font-bold num" style={{ color: 'hsl(var(--foreground))' }}>{ex.setsReps}</span>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>·</span>
          <span className="num" style={{ color: 'hsl(var(--muted-foreground))' }}>rest {ex.rest}s</span>
        </div>
      </div>
      <i data-lucide="chevron-right" style={{ width: 16, height: 16, color: 'hsl(var(--muted-foreground) / 0.7)' }}></i>
    </div>
  );
}

/* ------------------------------------------------------------
   Day accordion
   ------------------------------------------------------------ */
function DayCard({ day }) {
  const [open, setOpen] = useState(true);
  const ref = useRef(null);
  const [h, setH] = useState(null);

  useEffect(() => {
    if (ref.current) setH(open ? ref.current.scrollHeight : 0);
    if (window.lucide) window.lucide.createIcons();
  }, [open, day]);

  return (
    <div className="rounded-2xl bg-card" style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--border))' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-[11px] font-extrabold tracking-[1.4px] uppercase" style={{ color: 'hsl(var(--primary))' }}>
            {day.name}
          </span>
          <span className="text-[17px] font-extrabold tracking-[-0.02em] truncate" style={{ color: 'hsl(var(--foreground))' }}>
            · {day.focus}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] font-bold tracking-[1.2px] uppercase num" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {day.exercises.length} 個動作
          </span>
          <div style={{
            width: 18, height: 18, display: 'grid', placeItems: 'center',
            color: 'hsl(var(--muted-foreground))',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 320ms cubic-bezier(0.16,1,0.3,1)',
          }}>
            <i data-lucide="chevron-down" style={{ width: 18, height: 18 }}></i>
          </div>
        </div>
      </button>
      <div className="accordion-body" style={{ maxHeight: h == null ? 'none' : h, opacity: open ? 1 : 0 }}>
        <div ref={ref} className="px-4 pb-3">
          {day.exercises.map((ex, i) => (
            <ExerciseRow key={i} ex={ex} index={i} total={day.exercises.length} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Footer action bar
   ------------------------------------------------------------ */
function FooterActions({ plan }) {
  const isActive = plan.active;
  const isPreset = plan.isPreset;

  return (
    <div className="absolute left-0 right-0 bottom-0 z-30 nav-blur"
         style={{
           borderTop: '1px solid hsl(var(--border))',
           paddingBottom: 26, paddingTop: 12, paddingLeft: 18, paddingRight: 18,
         }}>
      {isActive ? (
        <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
          <button
            className="inline-flex items-center justify-center gap-1
              rounded-xl font-bold text-[13.5px] transition-all duration-200 ease-forge active:scale-[0.99]"
            style={{
              height: 48,
              background: 'transparent',
              color: 'hsl(var(--foreground))',
              boxShadow: 'inset 0 0 0 1.5px hsl(var(--border))',
            }}
          >
            結束使用
          </button>
          <button
            className="inline-flex items-center justify-center gap-1.5
              rounded-xl font-bold text-[14px] tracking-[0.01em]
              bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.99]
              transition-all duration-200 ease-forge"
            style={{ height: 48, boxShadow: '0 8px 22px -6px hsl(var(--primary) / 0.40)' }}
          >
            <i data-lucide={isPreset ? 'copy' : 'pencil'} style={{ width: 15, height: 15 }}></i>
            {isPreset ? '複製為自訂' : '編輯'}
          </button>
        </div>
      ) : (
        <button
          className="w-full inline-flex items-center justify-center gap-1.5
            rounded-xl font-bold text-[15px] tracking-[0.01em]
            bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.99]
            transition-all duration-200 ease-forge"
          style={{ height: 52, boxShadow: '0 8px 22px -6px hsl(var(--primary) / 0.40)' }}
        >
          <i data-lucide="play" style={{ width: 16, height: 16, fill: 'currentColor', strokeWidth: 2 }}></i>
          設為使用中
        </button>
      )}
    </div>
  );
}

/* ============================================================
   Screen
   ============================================================ */
function PlanDetailScreen({ plan }) {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="screen-dynamic-island"></div>
      <StatusBar />
      <DetailHeader title={plan.name} />

      {/* scroll content */}
      <div className="flex-1 min-h-0 overflow-y-auto screen-scroll"
           style={{ paddingTop: 104, paddingBottom: 110 }}>
        <Hero plan={plan} />

        <div className="px-5 mt-6 space-y-3">
          {plan.days.map(d => (
            <DayCard key={d.id} day={d} />
          ))}
        </div>

        <div className="h-6"></div>
      </div>

      <FooterActions plan={plan} />
    </div>
  );
}

/* ------------------------------------------------------------
   Phones + Apps
   ------------------------------------------------------------ */
function Phone({ theme, plan }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="stage-eyebrow flex items-center gap-2">
        <span className="dot"></span>{theme === 'light' ? 'LIGHT MODE' : 'DARK MODE'}
        <span className="mono text-[10.5px] text-[#9F9FA8]">· 375 × 812</span>
      </div>
      <div className={`phone theme-${theme}`}>
        <div className="screen">
          <PlanDetailScreen plan={plan} />
        </div>
      </div>
    </div>
  );
}

function PresetApp() {
  return (<><Phone theme="light" plan={PRESET_PLAN} /><Phone theme="dark" plan={PRESET_PLAN} /></>);
}
function CustomApp() {
  return (<><Phone theme="light" plan={CUSTOM_PLAN} /><Phone theme="dark" plan={CUSTOM_PLAN} /></>);
}

ReactDOM.createRoot(document.getElementById('root-preset')).render(<PresetApp />);
ReactDOM.createRoot(document.getElementById('root-custom')).render(<CustomApp />);
