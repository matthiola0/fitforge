/* ============================================================
   FitForge · 動作圖庫 (Exercise Library)
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ------------------------------------------------------------
   30 V1 exercises — Chinese + English + muscle + icon kind
   ------------------------------------------------------------ */
const ICON_BY_KIND = {
  barbell: 'barbell', dumbbell: 'dumbbell', cable: 'cable',
  bodyweight: 'person-standing', activity: 'activity',
};

const EXERCISES = [
  // 胸
  { zh: '槓鈴臥推',         en: 'Bench Press',         muscle: '胸', tags: ['槓鈴'],           level: 1, iconKind: 'barbell'    },
  { zh: '上斜啞鈴推',       en: 'Incline DB Press',    muscle: '胸', tags: ['啞鈴'],           level: 1, iconKind: 'dumbbell'   },
  { zh: '滑輪夾胸',         en: 'Cable Fly',           muscle: '胸', tags: ['機械'],           level: 1, iconKind: 'cable'      },
  { zh: '伏地挺身',         en: 'Push-up',             muscle: '胸', tags: ['自體重'],         level: 0, iconKind: 'bodyweight' },
  // 背
  { zh: '硬舉',             en: 'Deadlift',            muscle: '背', tags: ['槓鈴'],           level: 2, iconKind: 'barbell'    },
  { zh: '俯身划船',         en: 'Bent-over Row',       muscle: '背', tags: ['槓鈴'],           level: 1, iconKind: 'barbell'    },
  { zh: '引體向上',         en: 'Pull-up',             muscle: '背', tags: ['自體重'],         level: 2, iconKind: 'bodyweight' },
  { zh: '滑輪下拉',         en: 'Lat Pulldown',        muscle: '背', tags: ['機械'],           level: 0, iconKind: 'cable'      },
  { zh: '坐姿划船',         en: 'Seated Cable Row',    muscle: '背', tags: ['機械'],           level: 0, iconKind: 'cable'      },
  // 肩
  { zh: '站姿肩推',         en: 'Overhead Press',      muscle: '肩', tags: ['槓鈴'],           level: 1, iconKind: 'barbell'    },
  { zh: '啞鈴側平舉',       en: 'Lateral Raise',       muscle: '肩', tags: ['啞鈴'],           level: 0, iconKind: 'dumbbell'   },
  { zh: '反式划船',         en: 'Face Pull',           muscle: '肩', tags: ['機械'],           level: 0, iconKind: 'cable'      },
  // 腿
  { zh: '深蹲',             en: 'Back Squat',          muscle: '腿', tags: ['槓鈴'],           level: 1, iconKind: 'barbell'    },
  { zh: '前蹲',             en: 'Front Squat',         muscle: '腿', tags: ['槓鈴'],           level: 2, iconKind: 'barbell'    },
  { zh: '高腳杯深蹲',       en: 'Goblet Squat',        muscle: '腿', tags: ['啞鈴'],           level: 0, iconKind: 'dumbbell'   },
  { zh: '保加利亞分腿蹲',   en: 'Bulgarian Split Squat', muscle: '腿', tags: ['啞鈴'],         level: 1, iconKind: 'dumbbell'   },
  { zh: '弓步蹲',           en: 'Walking Lunge',       muscle: '腿', tags: ['啞鈴', '自體重'], level: 0, iconKind: 'dumbbell'   },
  { zh: '腿推',             en: 'Leg Press',           muscle: '腿', tags: ['機械'],           level: 0, iconKind: 'cable'      },
  { zh: '腿屈伸',           en: 'Leg Extension',       muscle: '腿', tags: ['機械'],           level: 0, iconKind: 'cable'      },
  { zh: '羅馬尼亞硬舉',     en: 'Romanian Deadlift',   muscle: '腿', tags: ['槓鈴', '啞鈴'],   level: 1, iconKind: 'barbell'    },
  // 臀
  { zh: '臀推',             en: 'Hip Thrust',          muscle: '臀', tags: ['槓鈴'],           level: 1, iconKind: 'barbell'    },
  { zh: '臀橋',             en: 'Glute Bridge',        muscle: '臀', tags: ['自體重'],         level: 0, iconKind: 'bodyweight' },
  { zh: '側躺抬腿',         en: 'Side-lying Abduction', muscle: '臀', tags: ['自體重'],        level: 0, iconKind: 'bodyweight' },
  // 核心
  { zh: '棒式',             en: 'Plank',               muscle: '核心', tags: ['自體重'],       level: 0, iconKind: 'bodyweight' },
  { zh: '懸吊提腿',         en: 'Hanging Leg Raise',   muscle: '核心', tags: ['自體重'],       level: 2, iconKind: 'bodyweight' },
  { zh: '俄羅斯轉體',       en: 'Russian Twist',       muscle: '核心', tags: ['自體重'],       level: 0, iconKind: 'bodyweight' },
  // 手臂
  { zh: '啞鈴二頭彎舉',     en: 'DB Biceps Curl',      muscle: '手臂', tags: ['啞鈴'],         level: 0, iconKind: 'dumbbell'   },
  { zh: '滑輪三頭下壓',     en: 'Triceps Pushdown',    muscle: '手臂', tags: ['機械'],         level: 0, iconKind: 'cable'      },
  { zh: '錘式彎舉',         en: 'Hammer Curl',         muscle: '手臂', tags: ['啞鈴'],         level: 0, iconKind: 'dumbbell'   },
  { zh: '雙槓臂屈伸',       en: 'Tricep Dip',          muscle: '手臂', tags: ['自體重'],       level: 1, iconKind: 'bodyweight' },
];

const MUSCLE_FILTERS = ['全部', '胸', '背', '肩', '腿', '臀', '核心', '手臂'];

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
   Custom barbell SVG (Lucide doesn't have one)
   ------------------------------------------------------------ */
function BarbellGlyph({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor" aria-hidden>
      <rect x="3"  y="26" width="4"  height="12" rx="1.2"/>
      <rect x="57" y="26" width="4"  height="12" rx="1.2"/>
      <rect x="8"  y="20" width="6"  height="24" rx="1.6"/>
      <rect x="50" y="20" width="6"  height="24" rx="1.6"/>
      <rect x="15" y="24" width="4"  height="16" rx="1.2"/>
      <rect x="45" y="24" width="4"  height="16" rx="1.2"/>
      <rect x="14" y="30" width="36" height="4"  rx="1"/>
    </svg>
  );
}

/* ------------------------------------------------------------
   Exercise thumb (square Lottie placeholder)
   ------------------------------------------------------------ */
function ExerciseThumb({ kind, animated }) {
  return (
    <div className="relative overflow-hidden"
         style={{
           width: '100%', aspectRatio: '1 / 1',
           borderTopLeftRadius: 14, borderTopRightRadius: 14,
           background: 'hsl(var(--secondary))',
         }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at 28% 22%, hsl(var(--foreground) / 0.05), transparent 60%)',
      }}></div>

      <div className="absolute inset-0 grid place-items-center" style={{ color: 'hsl(var(--foreground))' }}>
        {kind === 'barbell' ? <BarbellGlyph size={48} /> :
         kind === 'cable' ? <i data-lucide="cable" style={{ width: 40, height: 40 }}></i> :
         kind === 'bodyweight' ? <i data-lucide="person-standing" style={{ width: 40, height: 40 }}></i> :
         kind === 'activity' ? <i data-lucide="activity" style={{ width: 40, height: 40 }}></i> :
         <i data-lucide="dumbbell" style={{ width: 40, height: 40 }}></i>}
      </div>

      {/* "Live" scanline overlay when card is hovered/animated */}
      {animated && <div className="scan-line"></div>}

      {/* LOOP badge */}
      <div className={`absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-full ${animated ? 'loop-anim' : ''}`}
           style={{
             padding: '2px 6px 2px 4.5px',
             background: 'hsl(var(--background) / 0.92)',
             color: 'hsl(var(--foreground))',
             fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
           }}>
        <i data-lucide="play" style={{ width: 8, height: 8, strokeWidth: 3.5, fill: 'currentColor' }}></i>
        LOOP
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Exercise card
   ------------------------------------------------------------ */
function LevelDots({ level }) {
  // 0 = green (新手), 1 = warning (中階), 2 = primary (進階)
  const stops = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--primary))'];
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`難度 ${level + 1} / 3`}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: 3,
          background: i <= level ? stops[level] : 'hsl(var(--border))',
        }}></span>
      ))}
    </span>
  );
}

function MuscleChip({ children, primary }) {
  return (
    <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9.5px] font-bold tracking-[1px] uppercase"
          style={{
            background: primary ? 'hsl(var(--primary) / 0.10)' : 'hsl(var(--secondary))',
            color: primary ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          }}>
      {children}
    </span>
  );
}

function ExerciseCard({ ex, animated }) {
  return (
    <button type="button"
            className="ex-card text-left bg-card outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
            style={{
              borderRadius: 14,
              boxShadow: 'inset 0 0 0 1px hsl(var(--border))',
              overflow: 'hidden',
            }}>
      <ExerciseThumb kind={ex.iconKind} animated={animated} />
      <div className="px-2.5 py-2.5">
        <div className="flex items-baseline justify-between gap-1">
          <div className="text-[13.5px] font-extrabold tracking-[-0.015em] leading-tight text-foreground truncate flex-1 min-w-0">
            {ex.zh}
          </div>
          <LevelDots level={ex.level} />
        </div>
        <div className="text-[10.5px] font-medium leading-tight truncate mt-0.5"
             style={{ color: 'hsl(var(--muted-foreground))' }}>
          {ex.en}
        </div>
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          <MuscleChip primary>{ex.muscle}</MuscleChip>
          {ex.tags[0] && <MuscleChip>{ex.tags[0]}</MuscleChip>}
        </div>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------
   Empty state line-art illustration
   ------------------------------------------------------------ */
function EmptyArt() {
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" aria-hidden role="img">
      {/* soft tinted bg */}
      <ellipse cx="100" cy="78" rx="78" ry="32" fill="hsl(var(--primary) / 0.08)" />

      {/* dumbbell + magnifier glyph */}
      <g fill="none" stroke="hsl(var(--foreground))" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {/* magnifier */}
        <circle cx="86" cy="62" r="22" />
        <line x1="103" y1="78" x2="120" y2="95" />
        {/* small barbell inside magnifier */}
        <line x1="74" y1="62" x2="98" y2="62" />
        <rect x="69" y="56" width="5" height="12" rx="1.2" />
        <rect x="98" y="56" width="5" height="12" rx="1.2" />
      </g>
      {/* fill the magnifier plates with primary */}
      <rect x="69" y="56" width="5" height="12" rx="1.2" fill="hsl(var(--primary))" opacity="0.9"/>
      <rect x="98" y="56" width="5" height="12" rx="1.2" fill="hsl(var(--primary))" opacity="0.9"/>

      {/* tiny ? marks bobbing above */}
      <text x="135" y="46" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="14"
            fill="hsl(var(--muted-foreground))" opacity="0.5">?</text>
      <text x="58" y="34" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="11"
            fill="hsl(var(--muted-foreground))" opacity="0.35">?</text>
    </svg>
  );
}

function EmptyState({ onClear }) {
  return (
    <div className="px-6 py-14 flex flex-col items-center text-center">
      <EmptyArt />
      <h3 className="mt-1 text-[18px] font-extrabold tracking-[-0.02em] text-foreground" style={{textWrap:'balance'}}>
        找不到符合的動作
      </h3>
      <p className="mt-1.5 text-[13px] leading-[1.55] max-w-[28ch]"
         style={{ color: 'hsl(var(--muted-foreground))', textWrap: 'pretty' }}>
        V1 還沒有這個組合 — 試試別的肌群、或先清掉篩選看看全部 30 個動作。
      </p>
      <button onClick={onClear}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-md transition-colors duration-200 ease-forge"
              style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontSize: 13, fontWeight: 800, letterSpacing: '0.005em',
                boxShadow: '0 8px 22px -8px hsl(var(--primary) / 0.45)',
              }}>
        <i data-lucide="rotate-ccw" style={{ width: 13, height: 13, strokeWidth: 2.4 }}></i>
        清除全部篩選
      </button>
    </div>
  );
}

/* ------------------------------------------------------------
   BottomNav (動作 active)
   ------------------------------------------------------------ */
function BottomNav({ active = 'exercises' }) {
  const tabs = [
    { id: 'today',     label: '今天', icon: 'calendar-check-2' },
    { id: 'plan',      label: '課表', icon: 'list-checks'      },
    { id: 'exercises', label: '動作', icon: 'dumbbell'         },
    { id: 'history',   label: '歷史', icon: 'bar-chart-3'      },
  ];
  return (
    <div className="absolute left-0 right-0 bottom-0 z-30 nav-blur"
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

/* ------------------------------------------------------------
   Sticky search + filter + (optional) collapsed title
   ------------------------------------------------------------ */
function StickyHeader({ collapsed, q, setQ, muscle, setMuscle, count }) {
  return (
    <div className="absolute left-0 right-0 top-0 head-blur z-40"
         style={{
           paddingTop: 54,
           borderBottom: '1px solid hsl(var(--border) / 0.5)',
         }}>
      {/* row 1 — title bar with action icons */}
      <div className="px-4 pt-1 pb-2 flex items-center justify-between gap-2">
        <h1 className={`font-extrabold tracking-[-0.025em] text-foreground transition-all duration-200 ease-forge`}
            style={{
              fontSize: collapsed ? 16 : 24,
              lineHeight: 1.1,
            }}>
          動作圖庫
        </h1>
        <div className="flex items-center gap-1">
          <button className="grid place-items-center transition-colors duration-200 ease-forge hover:bg-secondary/70 outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                  style={{ width: 36, height: 36, borderRadius: 11, color: 'hsl(var(--foreground))' }}
                  aria-label="搜尋">
            <i data-lucide="search" style={{ width: 18, height: 18, strokeWidth: 2.2 }}></i>
          </button>
          <button className="relative grid place-items-center transition-colors duration-200 ease-forge hover:bg-secondary/70 outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                  style={{ width: 36, height: 36, borderRadius: 11, color: 'hsl(var(--foreground))' }}
                  aria-label="進階篩選">
            <i data-lucide="sliders-horizontal" style={{ width: 18, height: 18, strokeWidth: 2.2 }}></i>
          </button>
        </div>
      </div>

      {/* row 2 — search input */}
      <div className="px-4">
        <div className="relative">
          <i data-lucide="search"
             style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }}></i>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜尋動作 (中英皆可)"
            className="w-full outline-none transition-colors duration-200 ease-forge"
            style={{
              height: 40, paddingLeft: 36, paddingRight: q ? 36 : 12,
              borderRadius: 12,
              background: 'hsl(var(--secondary))',
              color: 'hsl(var(--foreground))',
              fontSize: 13.5, fontWeight: 500,
            }}
          />
          {q && (
            <button onClick={() => setQ('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center transition-colors duration-200"
                    style={{ width: 24, height: 24, borderRadius: 7, color: 'hsl(var(--muted-foreground))' }}
                    aria-label="清除搜尋">
              <i data-lucide="x" style={{ width: 13, height: 13, strokeWidth: 2.4 }}></i>
            </button>
          )}
        </div>
      </div>

      {/* row 3 — muscle filter chips */}
      <div className="pt-2.5 pb-2">
        <div className="h-lane">
          {MUSCLE_FILTERS.map(m => {
            const isActive = m === muscle;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMuscle(m)}
                className="transition-all duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{
                  padding: '6px 13px',
                  borderRadius: 9,
                  background: isActive ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                  color: isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                  fontSize: 12, fontWeight: 700, letterSpacing: '-0.005em',
                  boxShadow: isActive ? '0 4px 12px -4px hsl(var(--primary) / 0.40)' : 'none',
                  whiteSpace: 'nowrap',
                }}>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* row 4 — result counter (only when collapsed or filtering) */}
      {(collapsed || muscle !== '全部' || q) && (
        <div className="px-4 pb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[1.4px] uppercase num"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
            {count} 個動作
          </span>
          {(muscle !== '全部' || q) && (
            <button className="inline-flex items-center gap-1 text-[11.5px] font-semibold transition-colors duration-200"
                    style={{ color: 'hsl(var(--primary))' }}>
              <i data-lucide="x" style={{ width: 12, height: 12, strokeWidth: 2.6 }}></i>
              清除
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Screen
   ============================================================ */
function ExerciseLibraryScreen({ initialQ = '', initialMuscle = '全部', initialCollapsed = false }) {
  const [q, setQ] = useState(initialQ);
  const [muscle, setMuscle] = useState(initialMuscle);
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const filtered = EXERCISES.filter(e => {
    const matchesQ = !q ||
      e.zh.includes(q) ||
      e.en.toLowerCase().includes(q.toLowerCase());
    const matchesM = muscle === '全部' || e.muscle === muscle;
    return matchesQ && matchesM;
  });

  // detect scroll → collapse title
  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setCollapsed(el.scrollTop > 24);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const clearAll = () => { setQ(''); setMuscle('全部'); };

  // sticky header height ≈ 54 (status) + ~140 (rows) — fudge to 200 when collapsed/filtering shows row 4
  const stickyH = (collapsed || muscle !== '全部' || q) ? 196 : 168;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="screen-dynamic-island"></div>
      <StatusBar />
      <StickyHeader
        collapsed={collapsed}
        q={q} setQ={setQ}
        muscle={muscle} setMuscle={setMuscle}
        count={filtered.length}
      />

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto screen-scroll"
           style={{ paddingTop: stickyH, paddingBottom: 96 }}>

        {filtered.length === 0 ? (
          <EmptyState onClear={clearAll} />
        ) : (
          <div className="px-4 grid grid-cols-2 gap-3">
            {filtered.map((ex, i) => (
              <ExerciseCard key={i} ex={ex} animated={i === 0} />
            ))}
          </div>
        )}

        <div className="h-8"></div>
      </div>

      <BottomNav active="exercises" />
    </div>
  );
}

/* ------------------------------------------------------------
   Phones + Apps
   ------------------------------------------------------------ */
function Phone({ theme, q, muscle, collapsed }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="stage-eyebrow flex items-center gap-2">
        <span className="dot"></span>{theme === 'light' ? 'LIGHT MODE' : 'DARK MODE'}
        <span className="mono text-[10.5px] text-[#9F9FA8]">· 375 × 812</span>
      </div>
      <div className={`phone theme-${theme}`}>
        <div className="screen">
          <ExerciseLibraryScreen initialQ={q} initialMuscle={muscle} initialCollapsed={collapsed} />
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  return (<><Phone theme="light" /><Phone theme="dark" /></>);
}
function EmptyApp() {
  return (
    <>
      <Phone theme="light" q="跳繩" muscle="胸" />
      <Phone theme="dark"  q="跳繩" muscle="胸" />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root-main')).render(<MainApp />);
ReactDOM.createRoot(document.getElementById('root-empty')).render(<EmptyApp />);
