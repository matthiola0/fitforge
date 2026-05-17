/* ============================================================
   FitForge · Home Variants — A: in-progress · B: empty
   ============================================================ */
const { useState, useEffect } = React;

/* ------------------------------------------------------------
   Shared mock data
   ------------------------------------------------------------ */
const WEEK = [
  { label: '日', state: 'rest'   },
  { label: '一', state: 'done'   },
  { label: '二', state: 'done'   },
  { label: '三', state: 'rest'   },
  { label: '四', state: 'done'   },
  { label: '五', state: 'today'  },
  { label: '六', state: 'future' },
];
const RECENT = [
  { rel: '昨天',   name: 'Pull Day · 拉',  dur: 48, exs: 6 },
  { rel: '3 天前', name: 'Push Day · 推',  dur: 52, exs: 5 },
  { rel: '5 天前', name: 'Leg Day · 腿',   dur: 56, exs: 5 },
  { rel: '一週前', name: 'Pull Day · 拉',  dur: 50, exs: 6 },
];
const DISCOVER = [
  { name: 'Romanian Deadlift', zh: '羅馬尼亞硬舉', muscle: '後鏈',   iconKind: 'barbell' },
  { name: 'Bulgarian Split',   zh: '保加利亞分腿蹲', muscle: '腿後 / 臀', iconKind: 'split' },
  { name: 'Lat Pulldown',      zh: '滑輪下拉',     muscle: '背闊',   iconKind: 'cable' },
  { name: 'Incline DB Press',  zh: '上斜啞鈴推',   muscle: '胸 / 肩',  iconKind: 'dumbbell' },
];

/* ------------------------------------------------------------
   iOS status bar
   ------------------------------------------------------------ */
function StatusBar() {
  return (
    <div className="absolute top-0 inset-x-0 h-[54px] z-30 flex items-end justify-between px-7 pb-1.5 pointer-events-none">
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
   Greeting row (top of content) — same for both variants
   ------------------------------------------------------------ */
function GreetingRow({ variant }) {
  return (
    <div className="px-5 pt-[60px] flex items-center justify-between">
      <div className="min-w-0">
        <div className="stage-eyebrow" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <span className="dot" style={{ background: 'hsl(var(--primary))' }}></span>
          週五 · 16 MAY
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[22px] font-extrabold tracking-[-0.025em] leading-tight text-foreground">
            早安，Alex
          </span>
          <span style={{ fontSize: 22, lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui' }}>☀️</span>
        </div>
      </div>
      <button
        className="shrink-0 grid place-items-center transition-colors duration-200 ease-forge hover:bg-secondary/70 outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
        style={{
          width: 40, height: 40, borderRadius: 20,
          background: 'hsl(var(--secondary))',
          color: 'hsl(var(--foreground))',
        }}
        aria-label="設定"
      >
        <span className="text-[14px] font-extrabold tracking-tight">A</span>
      </button>
    </div>
  );
}

/* ============================================================
   VARIANT A · Hero · 訓練進行中
   ============================================================ */
function HeroInProgress() {
  const done = 5, total = 12;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="px-5 mt-5">
      <div className="bg-card rounded-2xl p-5"
           style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--border)), 0 8px 24px -6px hsl(0 0% 0% / 0.10), 0 2px 6px -2px hsl(0 0% 0% / 0.06)' }}>

        {/* eyebrow with live dot */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5">
            <span className="live-dot"></span>
            <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase" style={{ color: 'hsl(var(--primary))' }}>
              訓練進行中 · IN PROGRESS
            </span>
          </div>
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase num" style={{ color: 'hsl(var(--muted-foreground))' }}>
            30 分前開始
          </span>
        </div>

        {/* title (smaller than in default — the STATE is the headline now) */}
        <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.02em] leading-[1.15] text-foreground">
          回來繼續這場訓練？
        </h2>
        <div className="mt-1 text-[13.5px] font-medium leading-[1.5]"
             style={{ color: 'hsl(var(--muted-foreground))' }}>
          Day 1: 全身 A · 上次在 Row 第 2 組
        </div>

        {/* progress bar */}
        <div className="mt-5">
          <div className="relative overflow-hidden rounded-full"
               style={{
                 height: 10,
                 background: 'hsl(var(--secondary))',
               }}>
            <div className="relative overflow-hidden"
                 style={{
                   height: '100%',
                   width: `${pct}%`,
                   background: 'hsl(var(--primary))',
                   borderRadius: 6,
                 }}>
              <div className="bar-shimmer"></div>
            </div>
          </div>

          {/* below bar — done / remaining + percentage */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[24px] font-extrabold tracking-[-0.02em] num leading-none" style={{ color: 'hsl(var(--foreground))' }}>
                {done}<span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700 }}>/{total}</span>
              </span>
              <span className="text-[12px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>組完成</span>
            </div>
            <div className="inline-flex items-baseline gap-1">
              <span className="text-[11px] font-bold tracking-[1.4px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>剩</span>
              <span className="text-[15px] font-extrabold num" style={{ color: 'hsl(var(--foreground))' }}>~17</span>
              <span className="text-[11px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>分</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          className="cta-glow mt-5 w-full inline-flex items-center justify-center gap-1.5
            rounded-xl font-bold text-[15px] tracking-[0.01em]
            bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.99]
            transition-all duration-200 ease-forge"
          style={{ height: 52 }}
        >
          繼續訓練
          <i data-lucide="arrow-right" style={{ width: 18, height: 18 }}></i>
        </button>

        {/* secondary link — destructive but spoken softly */}
        <div className="mt-2.5 text-center">
          <button className="text-[12.5px] font-semibold px-3 py-1.5 transition-colors duration-200 ease-forge"
                  style={{ color: 'hsl(var(--muted-foreground))' }}>
            放棄訓練
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   VARIANT B · Hero · 還沒選課表
   ============================================================ */
function NoPlanIllustration() {
  // Line-art barbell + 3 floating sparks above. Stroked, primary-tinted bg blob.
  return (
    <svg viewBox="0 0 240 140" width="100%" height="120" aria-hidden role="img">
      {/* soft primary-tinted bg blob */}
      <ellipse cx="120" cy="86" rx="78" ry="36"
               fill="hsl(var(--primary) / 0.08)"/>

      {/* floating sparks */}
      <g className="spark-1">
        <circle cx="120" cy="24" r="3.5" fill="hsl(var(--primary))"/>
      </g>
      <g className="spark-2">
        <circle cx="98" cy="36" r="2.6" fill="hsl(var(--primary))" opacity="0.6"/>
      </g>
      <g className="spark-3">
        <circle cx="142" cy="36" r="2.6" fill="hsl(var(--primary))" opacity="0.6"/>
      </g>

      {/* barbell — strokes only for line-art feel */}
      <g fill="none" stroke="hsl(var(--foreground))"
         strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {/* bar */}
        <line x1="44" y1="86" x2="196" y2="86"/>
        {/* big plates (outer) */}
        <rect x="58"  y="62" width="14" height="48" rx="3.5"/>
        <rect x="168" y="62" width="14" height="48" rx="3.5"/>
        {/* small plates (inner) */}
        <rect x="78"  y="72" width="10" height="28" rx="2.5"/>
        <rect x="152" y="72" width="10" height="28" rx="2.5"/>
        {/* outer collars (end caps) */}
        <line x1="48" y1="80" x2="48" y2="92"/>
        <line x1="192" y1="80" x2="192" y2="92"/>
      </g>

      {/* one big plate filled primary to echo the brand mark */}
      <rect x="58"  y="62" width="14" height="48" rx="3.5"
            fill="hsl(var(--primary))" opacity="0.92"/>
      <rect x="168" y="62" width="14" height="48" rx="3.5"
            fill="hsl(var(--primary))" opacity="0.92"/>
    </svg>
  );
}

function HeroNoPlan() {
  return (
    <div className="px-5 mt-5">
      <div className="bg-card rounded-2xl px-5 pt-5 pb-5"
           style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--border)), 0 8px 24px -6px hsl(0 0% 0% / 0.10), 0 2px 6px -2px hsl(0 0% 0% / 0.06)' }}>

        {/* eyebrow */}
        <div className="text-center">
          <span className="text-[10.5px] font-bold tracking-[1.6px] uppercase"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
            還沒開始 · NO PLAN YET
          </span>
        </div>

        {/* illustration */}
        <div className="mt-2 flex justify-center">
          <NoPlanIllustration />
        </div>

        {/* title + sub */}
        <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.02em] leading-[1.15] text-center text-foreground">
          還沒選課表？
        </h2>
        <p className="mt-1.5 text-[13.5px] font-medium leading-[1.5] text-center"
           style={{ color: 'hsl(var(--muted-foreground))', textWrap: 'pretty' }}>
          選一個課表、開始你的第一次訓練。
        </p>

        {/* CTA */}
        <button
          className="cta-glow mt-5 w-full inline-flex items-center justify-center gap-1.5
            rounded-xl font-bold text-[15px] tracking-[0.01em]
            bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.99]
            transition-all duration-200 ease-forge"
          style={{ height: 52 }}
        >
          選擇課表
          <i data-lucide="arrow-right" style={{ width: 18, height: 18 }}></i>
        </button>

        {/* secondary link */}
        <div className="mt-2.5 text-center">
          <button className="text-[12.5px] font-semibold px-3 py-1.5 transition-colors duration-200 ease-forge inline-flex items-center gap-1"
                  style={{ color: 'hsl(var(--muted-foreground))' }}>
            <i data-lucide="search" style={{ width: 13, height: 13 }}></i>
            先逛逛動作庫
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   本週節奏 · 最近訓練 · 探索 · BottomNav · (reused from home-today)
   ------------------------------------------------------------ */
function WeekRhythm() {
  return (
    <div className="px-5 mt-7">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[18px] font-bold tracking-[-0.02em] leading-tight text-foreground">本週節奏</h3>
        <span className="text-[11px] font-bold tracking-[1.4px] uppercase num" style={{ color: 'hsl(var(--muted-foreground))' }}>
          3 / 5 完成
        </span>
      </div>
      <div className="mt-3 bg-card rounded-2xl p-3 grid grid-cols-7"
           style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--border))' }}>
        {WEEK.map((d, i) => {
          const isDone   = d.state === 'done';
          const isToday  = d.state === 'today';
          const isFuture = d.state === 'future';
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 py-1">
              <span className="text-[10.5px] font-bold tracking-[0.5px]"
                    style={{
                      color: isToday ? 'hsl(var(--primary))' :
                             isFuture ? 'hsl(var(--muted-foreground) / 0.6)' :
                             'hsl(var(--muted-foreground))',
                    }}>
                {d.label}
              </span>
              <div className="grid place-items-center"
                   style={{
                     width: 30, height: 30, borderRadius: 15,
                     background: isDone ? 'hsl(var(--primary))' : 'transparent',
                     boxShadow: isToday ? 'inset 0 0 0 1.5px hsl(var(--primary))' :
                                isFuture ? 'inset 0 0 0 1px hsl(var(--border))' :
                                isDone   ? 'none' :
                                'inset 0 0 0 1px hsl(var(--border))',
                   }}>
                {isDone && (
                  <i data-lucide="check" style={{ width: 14, height: 14, color: 'hsl(var(--primary-foreground))', strokeWidth: 3 }}></i>
                )}
                {isToday && (
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: 'hsl(var(--primary))' }}></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentWorkouts() {
  return (
    <div className="mt-7">
      <div className="px-5 flex items-baseline justify-between">
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-foreground">最近訓練</h3>
        <button className="text-[12.5px] font-semibold inline-flex items-center gap-0.5"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
          歷史
          <i data-lucide="chevron-right" style={{ width: 14, height: 14 }}></i>
        </button>
      </div>
      <div className="mt-3 h-lane">
        {RECENT.map((w, i) => (
          <div key={i} className="bg-card rounded-2xl p-4"
               style={{ width: 168, boxShadow: 'inset 0 0 0 1px hsl(var(--border))' }}>
            <div className="text-[10.5px] font-bold tracking-[1.4px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {w.rel}
            </div>
            <div className="mt-2 text-[15px] font-bold tracking-[-0.015em] leading-snug text-foreground" style={{textWrap:'balance'}}>
              {w.name}
            </div>
            <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-[11.5px]"
                 style={{ borderColor: 'hsl(var(--border))' }}>
              <div className="inline-flex items-center gap-1 num" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <i data-lucide="timer" style={{ width: 12, height: 12 }}></i>
                <span><strong style={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}>{w.dur}</strong> 分</span>
              </div>
              <div className="inline-flex items-center gap-1 num" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <i data-lucide="dumbbell" style={{ width: 12, height: 12 }}></i>
                <span><strong style={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}>{w.exs}</strong> 動作</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExerciseThumb({ kind }) {
  return (
    <div className="relative grid place-items-center overflow-hidden"
         style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 14, background: 'hsl(var(--secondary))' }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 30% 25%, hsl(var(--foreground) / 0.04), transparent 60%)',
      }}></div>
      <div style={{ color: 'hsl(var(--foreground))' }}>
        {kind === 'barbell' ? (
          <svg width="46" height="46" viewBox="0 0 64 64" fill="currentColor" aria-hidden>
            <rect x="3"  y="26" width="4"  height="12" rx="1.2"/>
            <rect x="57" y="26" width="4"  height="12" rx="1.2"/>
            <rect x="8"  y="20" width="6"  height="24" rx="1.6"/>
            <rect x="50" y="20" width="6"  height="24" rx="1.6"/>
            <rect x="15" y="24" width="4"  height="16" rx="1.2"/>
            <rect x="45" y="24" width="4"  height="16" rx="1.2"/>
            <rect x="14" y="30" width="36" height="4"  rx="1"/>
          </svg>
        ) : kind === 'split' ? (
          <i data-lucide="move-vertical" style={{ width: 40, height: 40 }}></i>
        ) : kind === 'cable' ? (
          <i data-lucide="cable" style={{ width: 40, height: 40 }}></i>
        ) : (
          <i data-lucide="dumbbell" style={{ width: 40, height: 40 }}></i>
        )}
      </div>
      <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full"
           style={{
             padding: '3px 7px 3px 5px',
             background: 'hsl(var(--background) / 0.92)',
             color: 'hsl(var(--foreground))',
             fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8,
           }}>
        <i data-lucide="play" style={{ width: 9, height: 9, strokeWidth: 3, fill: 'currentColor' }}></i>
        LOOP
      </div>
    </div>
  );
}

function Discover() {
  return (
    <div className="mt-7">
      <div className="px-5 flex items-baseline justify-between">
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-foreground">探索更多動作</h3>
        <button className="text-[12.5px] font-semibold inline-flex items-center gap-0.5"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
          全部
          <i data-lucide="chevron-right" style={{ width: 14, height: 14 }}></i>
        </button>
      </div>
      <div className="mt-3 h-lane">
        {DISCOVER.map((e, i) => (
          <div key={i} className="bg-card rounded-2xl p-3"
               style={{ width: 144, boxShadow: 'inset 0 0 0 1px hsl(var(--border))' }}>
            <ExerciseThumb kind={e.iconKind} />
            <div className="mt-3 text-[13.5px] font-bold tracking-[-0.01em] leading-snug text-foreground" style={{textWrap:'balance'}}>
              {e.zh}
            </div>
            <div className="mt-1.5">
              <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9.5px] font-bold tracking-[1px] uppercase"
                    style={{ background: 'hsl(var(--primary) / 0.10)', color: 'hsl(var(--primary))' }}>
                {e.muscle}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomNav({ active = 'today' }) {
  const tabs = [
    { id: 'today',     label: '今天', icon: 'calendar-check-2' },
    { id: 'plan',      label: '課表', icon: 'list-checks'      },
    { id: 'exercises', label: '動作', icon: 'dumbbell'         },
    { id: 'history',   label: '歷史', icon: 'bar-chart-3'      },
  ];
  return (
    <div className="absolute left-0 right-0 bottom-0 z-20 nav-blur"
         style={{ borderTop: '1px solid hsl(var(--border))', paddingBottom: 26, paddingTop: 8 }}>
      <div className="flex items-stretch justify-around">
        {tabs.map(t => {
          const isActive = t.id === active;
          return (
            <button key={t.id}
                    className="flex-1 flex flex-col items-center gap-0.5 py-1.5 outline-none focus-visible:ring-4 focus-visible:ring-ring/25 transition-colors duration-200"
                    style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
              <span style={{ height: 4 }}>
                {isActive && (
                  <span className="block rounded-full" style={{ width: 18, height: 3, background: 'hsl(var(--primary))' }}></span>
                )}
              </span>
              <i data-lucide={t.icon} style={{ width: 22, height: 22, strokeWidth: isActive ? 2.4 : 2 }}></i>
              <span className="text-[10.5px] font-bold tracking-[0.4px] mt-0.5"
                    style={{ fontWeight: isActive ? 800 : 600 }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Home screen — switches hero by variant prop
   ============================================================ */
function HomeScreen({ variant }) {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="screen-dynamic-island"></div>
      <StatusBar />

      <div className="flex-1 min-h-0 overflow-y-auto screen-scroll" style={{ paddingBottom: 96 }}>
        <GreetingRow variant={variant} />
        {variant === 'inprogress' ? <HeroInProgress /> : <HeroNoPlan />}
        <WeekRhythm />
        <RecentWorkouts />
        <Discover />
        <div className="h-6"></div>
      </div>

      <BottomNav active="today" />
    </div>
  );
}

/* ============================================================
   Phone wrapper + Apps for each root
   ============================================================ */
function Phone({ theme, variant }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="stage-eyebrow flex items-center gap-2">
        <span className="dot"></span>{theme === 'light' ? 'LIGHT MODE' : 'DARK MODE'}
        <span className="mono text-[10.5px] text-[#9F9FA8]">· 375 × 812</span>
      </div>
      <div className={`phone theme-${theme}`}>
        <div className="screen">
          <HomeScreen variant={variant} />
        </div>
      </div>
    </div>
  );
}

function VariantA() {
  return <><Phone theme="light" variant="inprogress" /><Phone theme="dark" variant="inprogress" /></>;
}
function VariantB() {
  return <><Phone theme="light" variant="noplan" /><Phone theme="dark" variant="noplan" /></>;
}

ReactDOM.createRoot(document.getElementById('root-a')).render(<VariantA />);
ReactDOM.createRoot(document.getElementById('root-b')).render(<VariantB />);
