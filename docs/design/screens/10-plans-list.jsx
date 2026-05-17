/* ============================================================
   FitForge · 課表 (Plans List)
   ============================================================ */
const { useState, useEffect } = React;

/* ------------------------------------------------------------
   Goal categories — map to semantic tokens from the design system
   ------------------------------------------------------------ */
const GOAL = {
  muscle:   { tone: 'primary',  icon: 'dumbbell'    },
  strength: { tone: 'warning',  icon: 'zap'         },
  fitness:  { tone: 'success',  icon: 'heart-pulse' },
  fatloss:  { tone: 'muted',    icon: 'flame'       },
};

const TONE_BG    = { primary: 'hsl(var(--primary) / 0.13)',  warning: 'hsl(var(--warning) / 0.16)', success: 'hsl(var(--success) / 0.14)', muted: 'hsl(var(--secondary))' };
const TONE_FG    = { primary: 'hsl(var(--primary))',          warning: 'hsl(var(--warning))',        success: 'hsl(var(--success))',        muted: 'hsl(var(--foreground))' };

/* ------------------------------------------------------------
   Mock data
   ------------------------------------------------------------ */
const ACTIVE_PLAN = {
  id: 'p-active',
  name: '新手全身入門 A/B',
  goal: 'muscle',
  weeks: 6,
  freq: '週 3 次',
  weekDone: 2,
  weekTotal: 3,
  currentDay: 'Day 1 · 全身 A',
};

const CUSTOM_PLANS = [
  {
    id: 'c-1',
    name: '我的胸日',
    desc: '挑戰平板臥推 PR、輔以 Cable Fly 收尾',
    goal: 'muscle',
    freq: '週 1 次',
    focuses: ['胸', '肩前'],
  },
  {
    id: 'c-2',
    name: '週末有氧 + 核心',
    desc: '划船機 20 分 + 棒式系列、輕鬆收尾',
    goal: 'fitness',
    freq: '週末',
    focuses: ['有氧', '核心'],
  },
];

const DEFAULT_PLANS = [
  {
    id: 'd-1',
    name: '新手全身入門 A/B',
    desc: '兩天輪替全身、最適合剛開始',
    goal: 'fitness',
    freq: '週 3 次',
    focuses: ['全身'],
  },
  {
    id: 'd-2',
    name: '推 / 拉 / 腿三日',
    desc: '經典 PPL 分化、3 天循環',
    goal: 'muscle',
    freq: '週 3 次',
    focuses: ['推', '拉', '腿'],
  },
  {
    id: 'd-3',
    name: '上 / 下身分化',
    desc: '上下身 4 天分化、適合 4 天 / 週',
    goal: 'strength',
    freq: '週 4 次',
    focuses: ['上身', '下身'],
  },
];

/* ------------------------------------------------------------
   Common chrome
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

function Header() {
  return (
    <div className="px-5 pt-[60px] flex items-end justify-between">
      <h1 className="text-[30px] font-extrabold tracking-[-0.03em] leading-tight text-foreground">
        課表
      </h1>
      <button
        className="grid place-items-center transition-all duration-200 ease-forge hover:scale-105 active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
        style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          boxShadow: '0 4px 10px -3px hsl(var(--primary) / 0.40)',
        }}
        aria-label="新增空白課表"
      >
        <i data-lucide="plus" style={{ width: 20, height: 20, strokeWidth: 2.5 }}></i>
      </button>
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div className="px-5 mt-6 flex items-baseline justify-between">
      <h3 className="text-[15px] font-bold tracking-[-0.015em] leading-tight inline-flex items-center gap-2"
          style={{ color: 'hsl(var(--foreground))' }}>
        {children}
      </h3>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------
   Plan icon block (left side of card)
   ------------------------------------------------------------ */
function PlanIcon({ goal, size = 44 }) {
  const tone = GOAL[goal]?.tone || 'muted';
  const icon = GOAL[goal]?.icon || 'dumbbell';
  return (
    <div className="shrink-0 grid place-items-center"
         style={{
           width: size, height: size, borderRadius: 12,
           background: TONE_BG[tone],
           color: TONE_FG[tone],
         }}>
      <i data-lucide={icon} style={{ width: Math.round(size * 0.5), height: Math.round(size * 0.5), strokeWidth: 2 }}></i>
    </div>
  );
}

/* ------------------------------------------------------------
   ACTIVE plan card — full width, primary border, with progress + CTA
   ------------------------------------------------------------ */
function ActiveSection() {
  const p = ACTIVE_PLAN;
  const pct = Math.round((p.weekDone / p.weekTotal) * 100);
  return (
    <>
      <SectionTitle>
        <span className="live-dot"></span>
        <span className="uppercase tracking-[1.4px] text-[11px] font-bold" style={{ color: 'hsl(var(--primary))' }}>
          目前正在跑
        </span>
      </SectionTitle>
      <div className="px-5 mt-2">
        <div className="rounded-2xl bg-card p-5"
             style={{ boxShadow: 'inset 0 0 0 2px hsl(var(--primary)), 0 12px 32px -10px hsl(var(--primary) / 0.30)' }}>
          <div className="flex items-start gap-4">
            <PlanIcon goal={p.goal} size={48} />
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-extrabold tracking-[-0.02em] leading-snug text-foreground"
                   style={{textWrap:'balance'}}>
                {p.name}
              </div>
              <div className="mt-0.5 text-[12.5px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <span className="num">{p.weeks}</span> 週 · {p.freq} · 進行到 <span className="font-bold text-foreground">{p.currentDay}</span>
              </div>
            </div>
          </div>

          {/* this-week progress */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 relative overflow-hidden rounded-full"
                 style={{ height: 8, background: 'hsl(var(--secondary))' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'hsl(var(--primary))', borderRadius: 4 }}></div>
            </div>
            <div className="text-[12px] font-bold num" style={{ color: 'hsl(var(--foreground))' }}>
              本週 <span className="text-primary">{p.weekDone}</span><span style={{ color: 'hsl(var(--muted-foreground))' }}>/{p.weekTotal}</span>
            </div>
          </div>

          {/* CTA */}
          <button
            className="mt-4 w-full inline-flex items-center justify-center gap-1.5
              rounded-xl font-bold text-[14.5px] tracking-[0.01em]
              bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.99]
              transition-all duration-200 ease-forge"
            style={{ height: 48, boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.40)' }}
          >
            繼續
            <i data-lucide="arrow-right" style={{ width: 16, height: 16 }}></i>
          </button>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------
   Plan row (custom + default — same DNA, different trailing affordance)
   ------------------------------------------------------------ */
function PlanRow({ plan, badge, onMore, peeking }) {
  const tone = GOAL[plan.goal]?.tone || 'muted';
  return (
    <div className="swipe-shell"
         style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--border))' }}>
      {/* swipe-action behind */}
      {onMore && (
        <div className="swipe-action" aria-hidden>
          <i data-lucide="trash-2" style={{ width: 16, height: 16, strokeWidth: 2.4 }}></i>
          刪除
        </div>
      )}

      {/* card body */}
      <div className="swipe-card-content"
           style={{
             padding: '14px',
             transform: peeking ? 'translateX(-64px)' : 'translateX(0)',
           }}>
        <div className="flex items-center gap-3">
          <PlanIcon goal={plan.goal} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="text-[15px] font-bold tracking-[-0.015em] leading-snug truncate"
                   style={{ color: 'hsl(var(--foreground))' }}>
                {plan.name}
              </div>
              {badge}
            </div>
            <div className="text-[12px] font-medium truncate mt-0.5"
                 style={{ color: 'hsl(var(--muted-foreground))' }}>
              {plan.desc}
            </div>
            {/* chips row */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold tracking-[1px] uppercase num"
                    style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                <i data-lucide="repeat" style={{ width: 10, height: 10, strokeWidth: 2.4 }}></i>
                {plan.freq}
              </span>
              {plan.focuses.map((f, i) => (
                <span key={i}
                      className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-bold tracking-[1px] uppercase"
                      style={{ background: TONE_BG[tone], color: TONE_FG[tone] }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          {/* trailing — chevron + (optional) more */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            {onMore && (
              <button
                onClick={(e) => { e.stopPropagation(); onMore(); }}
                className="grid place-items-center transition-colors duration-200 ease-forge hover:bg-secondary/70 outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{
                  width: 26, height: 26, borderRadius: 8,
                  color: 'hsl(var(--muted-foreground))',
                }}
                aria-label={peeking ? '收起' : '更多'}
              >
                <i data-lucide={peeking ? 'x' : 'more-horizontal'}
                   style={{ width: 14, height: 14, strokeWidth: 2.2 }}></i>
              </button>
            )}
            <i data-lucide="chevron-right"
               style={{
                 width: 16, height: 16,
                 color: 'hsl(var(--muted-foreground) / 0.7)',
               }}></i>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Custom + Default sections
   ------------------------------------------------------------ */
function CustomSection({ peeked, onTogglePeek }) {
  return (
    <>
      <SectionTitle right={
        <span className="text-[11px] font-bold tracking-[1.4px] uppercase num"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
          {CUSTOM_PLANS.length} 個
        </span>
      }>
        我的自訂課表
      </SectionTitle>
      <div className="px-5 mt-2 space-y-2.5">
        {CUSTOM_PLANS.map(p => (
          <PlanRow
            key={p.id}
            plan={p}
            peeking={peeked === p.id}
            onMore={() => onTogglePeek(p.id)}
          />
        ))}
      </div>
    </>
  );
}

function DefaultBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-sm px-1 py-[1px] text-[9.5px] font-extrabold tracking-[1.2px] uppercase shrink-0"
          style={{
            background: 'hsl(var(--primary) / 0.12)',
            color: 'hsl(var(--primary))',
          }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.5l2.7 6.4 6.9.5-5.2 4.5 1.6 6.7L12 17l-6 3.6 1.6-6.7-5.2-4.5 6.9-.5z"/>
      </svg>
      預設
    </span>
  );
}

function DefaultSection() {
  return (
    <>
      <SectionTitle right={
        <span className="text-[11px] font-bold tracking-[1.4px] uppercase"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
          推薦給新手
        </span>
      }>
        預設課表
      </SectionTitle>
      <div className="px-5 mt-2 space-y-2.5">
        {DEFAULT_PLANS.map(p => (
          <PlanRow key={p.id} plan={p} badge={<DefaultBadge />} />
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------
   BottomNav (課表 active)
   ------------------------------------------------------------ */
function BottomNav({ active = 'plan' }) {
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
   Screen
   ============================================================ */
function PlansScreen() {
  // second custom card starts in the swipe-peek state so users can see it
  const [peeked, setPeeked] = useState('c-2');
  const togglePeek = (id) => setPeeked(prev => prev === id ? null : id);

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="screen-dynamic-island"></div>
      <StatusBar />

      <div className="flex-1 min-h-0 overflow-y-auto screen-scroll" style={{ paddingBottom: 96 }}>
        <Header />
        <ActiveSection />
        <CustomSection peeked={peeked} onTogglePeek={togglePeek} />
        <DefaultSection />
        <div className="h-6"></div>
      </div>

      <BottomNav active="plan" />
    </div>
  );
}

/* ------------------------------------------------------------
   Phones + App
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
          <PlansScreen />
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
