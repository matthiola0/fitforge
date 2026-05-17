/* ============================================================
   FitForge · Home (Today) — main app file
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ------------------------------------------------------------
   Shared mock data for both phones
   ------------------------------------------------------------ */
const PLAN_TODAY = {
  day: 'Day 1',
  focus: '全身 A',
  exercises: [
    { name: 'Squat',   sets: '3×8'   },
    { name: 'Bench',   sets: '3×8'   },
    { name: 'Row',     sets: '3×8'   },
    { name: 'Plank',   sets: '3×30s' },
  ],
  duration: 45,
  totalSets: 12,
};

// 7 days. Today is index 5 (週五).
const WEEK = [
  { label: '日', state: 'rest'    },
  { label: '一', state: 'done'    },
  { label: '二', state: 'done'    },
  { label: '三', state: 'rest'    },
  { label: '四', state: 'done'    },
  { label: '五', state: 'today'   },
  { label: '六', state: 'future'  },
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
      <div className="text-foreground text-[15px] font-semibold tracking-[-0.01em]" style={{fontFeatureSettings: '"tnum"'}}>
        9:41
      </div>
      <div className="flex items-center gap-1.5 text-foreground">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0"    y="7" width="3" height="4"  rx="0.5"/>
          <rect x="4.5"  y="5" width="3" height="6"  rx="0.5"/>
          <rect x="9"    y="3" width="3" height="8"  rx="0.5"/>
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
          <rect x="2"   y="2"   width="19" height="8"  rx="1.5" fill="currentColor"/>
          <rect x="23"  y="4"   width="2"  height="4"  rx="1" fill="currentColor" fillOpacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Greeting row (top of content)
   ------------------------------------------------------------ */
function GreetingRow() {
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

/* ------------------------------------------------------------
   HERO · Today's Session card
   ------------------------------------------------------------ */
function HeroToday() {
  return (
    <div className="px-5 mt-5">
      <div className="bg-card rounded-2xl p-5"
           style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--border)), 0 8px 24px -6px hsl(0 0% 0% / 0.10), 0 2px 6px -2px hsl(0 0% 0% / 0.06)' }}>
        <div className="flex items-center justify-between">
          <div className="stage-eyebrow" style={{ color: 'hsl(var(--primary))' }}>
            <span className="dot" style={{ background: 'hsl(var(--primary))' }}></span>
            今天的訓練
          </div>
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase num"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
            WK 03 · #12
          </span>
        </div>

        {/* Big plan name */}
        <h2 className="mt-2.5 text-[26px] font-extrabold tracking-[-0.025em] leading-[1.1] text-foreground">
          {PLAN_TODAY.day}<span style={{ color: 'hsl(var(--muted-foreground))' }}>:</span> {PLAN_TODAY.focus}
        </h2>

        {/* Exercise chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {PLAN_TODAY.exercises.map((ex, i) => (
            <span key={i}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold tracking-[-0.005em]"
                  style={{
                    background: 'hsl(var(--secondary))',
                    color: 'hsl(var(--foreground))',
                  }}>
              <span>{ex.name}</span>
              <span className="num mono" style={{ color: 'hsl(var(--muted-foreground))', fontSize: 10.5, marginLeft: 1 }}>{ex.sets}</span>
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t flex items-center gap-5"
             style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center" style={{
              width: 26, height: 26, borderRadius: 8,
              background: 'hsl(var(--primary) / 0.10)',
              color: 'hsl(var(--primary))',
            }}>
              <i data-lucide="timer" style={{ width: 14, height: 14 }}></i>
            </span>
            <div>
              <div className="text-[10.5px] font-bold tracking-[1.4px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>預估</div>
              <div className="text-[15px] font-extrabold tracking-[-0.015em] num leading-none mt-0.5">
                {PLAN_TODAY.duration} <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>分</span>
              </div>
            </div>
          </div>
          <div className="w-px h-9" style={{ background: 'hsl(var(--border))' }}></div>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center" style={{
              width: 26, height: 26, borderRadius: 8,
              background: 'hsl(var(--primary) / 0.10)',
              color: 'hsl(var(--primary))',
            }}>
              <i data-lucide="layers" style={{ width: 14, height: 14 }}></i>
            </span>
            <div>
              <div className="text-[10.5px] font-bold tracking-[1.4px] uppercase" style={{ color: 'hsl(var(--muted-foreground))' }}>總組數</div>
              <div className="text-[15px] font-extrabold tracking-[-0.015em] num leading-none mt-0.5">
                {PLAN_TODAY.totalSets} <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>組</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          className="cta-glow mt-4 w-full inline-flex items-center justify-center gap-1.5
            rounded-xl font-bold text-[15px] tracking-[0.01em]
            bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.99]
            transition-all duration-200 ease-forge"
          style={{ height: 52 }}
        >
          開始訓練
          <i data-lucide="arrow-right" style={{ width: 18, height: 18 }}></i>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   本週節奏
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
                  <span style={{
                    width: 6, height: 6, borderRadius: 3,
                    background: 'hsl(var(--primary))',
                  }}></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   最近訓練 (horizontal scroll)
   ------------------------------------------------------------ */
function RecentWorkouts() {
  return (
    <div className="mt-7">
      <div className="px-5 flex items-baseline justify-between">
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-foreground">最近訓練</h3>
        <button className="text-[12.5px] font-semibold inline-flex items-center gap-0.5 transition-colors duration-200"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
          歷史
          <i data-lucide="chevron-right" style={{ width: 14, height: 14 }}></i>
        </button>
      </div>
      <div className="mt-3 h-lane">
        {RECENT.map((w, i) => (
          <div key={i} className="bg-card rounded-2xl p-4"
               style={{
                 width: 168,
                 boxShadow: 'inset 0 0 0 1px hsl(var(--border))',
               }}>
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

/* ------------------------------------------------------------
   Exercise thumbnail (Lottie placeholder)
   ------------------------------------------------------------ */
function ExerciseThumb({ kind }) {
  return (
    <div className="relative grid place-items-center overflow-hidden"
         style={{
           width: '100%', aspectRatio: '1 / 1',
           borderRadius: 14,
           background: 'hsl(var(--secondary))',
         }}>
      {/* subtle radial highlight to suggest depth on a flat-ish thumb */}
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

      {/* "animated" indicator — small play badge in corner suggesting Lottie loop */}
      <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full"
           style={{
             padding: '3px 7px 3px 5px',
             background: 'hsl(var(--background) / 0.92)',
             color: 'hsl(var(--foreground))',
             fontSize: 9.5,
             fontWeight: 700,
             letterSpacing: 0.8,
           }}>
        <i data-lucide="play" style={{ width: 9, height: 9, strokeWidth: 3, fill: 'currentColor' }}></i>
        LOOP
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   探索更多動作 (horizontal scroll)
   ------------------------------------------------------------ */
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
               style={{
                 width: 144,
                 boxShadow: 'inset 0 0 0 1px hsl(var(--border))',
               }}>
            <ExerciseThumb kind={e.iconKind} />
            <div className="mt-3 text-[13.5px] font-bold tracking-[-0.01em] leading-snug text-foreground" style={{textWrap:'balance'}}>
              {e.zh}
            </div>
            <div className="mt-1.5">
              <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9.5px] font-bold tracking-[1px] uppercase"
                    style={{
                      background: 'hsl(var(--primary) / 0.10)',
                      color: 'hsl(var(--primary))',
                    }}>
                {e.muscle}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   BottomNav
   ------------------------------------------------------------ */
function BottomNav({ active = 'today' }) {
  const tabs = [
    { id: 'today',     label: '今天', icon: 'calendar-check-2' },
    { id: 'plan',      label: '課表', icon: 'list-checks'      },
    { id: 'exercises', label: '動作', icon: 'dumbbell'         },
    { id: 'history',   label: '歷史', icon: 'bar-chart-3'      },
  ];
  return (
    <div className="absolute left-0 right-0 bottom-0 z-20 nav-blur"
         style={{
           borderTop: '1px solid hsl(var(--border))',
           paddingBottom: 26, // ~ safe-area-inset-bottom approximation
           paddingTop: 8,
         }}>
      <div className="flex items-stretch justify-around">
        {tabs.map(t => {
          const isActive = t.id === active;
          return (
            <button key={t.id}
                    className="flex-1 flex flex-col items-center gap-0.5 py-1.5 outline-none focus-visible:ring-4 focus-visible:ring-ring/25 transition-colors duration-200"
                    style={{
                      color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    }}>
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

/* ------------------------------------------------------------
   Home screen
   ------------------------------------------------------------ */
function HomeScreen() {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="screen-dynamic-island"></div>
      <StatusBar />

      {/* scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto screen-scroll" style={{ paddingBottom: 96 }}>
        <GreetingRow />
        <HeroToday />
        <WeekRhythm />
        <RecentWorkouts />
        <Discover />
        <div className="h-6"></div>
      </div>

      <BottomNav active="today" />
    </div>
  );
}

/* ------------------------------------------------------------
   Phone wrapper + App entry
   ------------------------------------------------------------ */
function Phone({ theme }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="stage-eyebrow flex items-center gap-2">
        <span className="dot"></span>{theme === 'light' ? 'LIGHT MODE' : 'DARK MODE'}
        <span className="mono text-[10.5px] text-[#9F9FA8]">· 375 × 812</span>
      </div>
      <div className={`phone theme-${theme}`}>
        <div className="screen">
          <HomeScreen />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <Phone theme="light" />
      <Phone theme="dark" />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
