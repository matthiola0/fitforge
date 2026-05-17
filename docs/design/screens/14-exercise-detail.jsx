/* ============================================================
   FitForge · Exercise Detail — fullscreen read-only learning page
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ------------------------------------------------------------
   Mock content — two exercises to show difficulty-color variation
   ------------------------------------------------------------ */
const BENCH = {
  zh: '槓鈴臥推',
  en: 'Barbell Bench Press',
  muscles: ['胸', '肩前', '三頭'],
  equipment: '槓鈴 + 臥推椅',
  level: 'beginner', // beginner | intermediate | advanced
  desc: '臥推是最經典的上半身複合動作 — 槓鈴下降到胸口中段，再用胸 / 肩 / 三頭一起推起。掌握姿勢之後、它會是你「胸日」的核心。',
  steps: [
    { t: '躺平在臥推椅上、雙腳踩穩地面，握距比肩稍寬。' },
    { t: '吸氣、肩胛骨向後夾、把槓鈴從架上解開。' },
    { t: '槓鈴沿著直線下降到胸口中段、輕碰胸口、不反彈。' },
    { t: '吐氣、把槓鈴向上推回起始位置、手肘不鎖死。' },
  ],
  tips: [
    '想像把胸口往上頂、而不是手在推 — 力量會從正確的肌群來。',
    '手肘和身體之間約 60–75° 角、不要完全外張變 90°。',
    '訓練重量時務必有 spotter — 失誤的成本太高。',
  ],
  mistakes: [
    '槓鈴落點過高 (碰到鎖骨) — 容易傷肩。',
    '腳離地 / 屁股離椅 — 失去身體穩定性、力量會打折。',
    '手肘過度外張變 T 字 — 對肩前韌帶造成過大壓力。',
  ],
};

const DEADLIFT = {
  zh: '硬舉',
  en: 'Conventional Deadlift',
  muscles: ['後鏈', '臀', '背'],
  equipment: '槓鈴 + 槓片',
  level: 'advanced',
  desc: '硬舉是動作之王 — 一次練到整條後鏈。看似簡單、但姿勢誤差會直接反映在腰背上。重量輕一點、姿勢對得起來再加重。',
  steps: [
    { t: '雙腳與髖同寬、槓鈴貼小腿前緣。' },
    { t: '蹲下、雙手握住槓鈴 (略寬於膝)、背挺直、目視前方。' },
    { t: '吐氣、用腳推地、把槓鈴沿著小腿往上拉。' },
    { t: '到最高點時臀部收緊、再沿原路慢慢放回。' },
  ],
  tips: [
    '槓鈴全程貼著腿前緣 — 任何「離身體」的軌跡都是腰在代償。',
    '想像把地板往腳下推、而不是「用腰拉」— 力量主要來自腿與臀。',
    '先用輕重量學 hinge (髖鉸鏈) 動作模式、再加重。',
  ],
  mistakes: [
    '圓背 — 腰椎承重時最大的傷害來源、寧可降重量也要挺直。',
    '槓鈴離開身體軌跡 — 腰會被迫吃下整個力矩。',
    '膝蓋過早鎖死 — 力量沒順利轉到髖、腰背承受過多。',
  ],
};

const LEVEL_TOKEN = {
  beginner:     { label: '初級', tone: 'success' },
  intermediate: { label: '中階', tone: 'warning' },
  advanced:     { label: '進階', tone: 'primary' },
};
const TONE_BG = { primary: 'hsl(var(--primary) / 0.13)',  warning: 'hsl(var(--warning) / 0.18)', success: 'hsl(var(--success) / 0.16)' };
const TONE_FG = { primary: 'hsl(var(--primary))',         warning: 'hsl(var(--warning))',        success: 'hsl(var(--success))' };

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
   Sticky header (back + title + favorite-future)
   ------------------------------------------------------------ */
function DetailHeader({ ex }) {
  return (
    <div className="absolute left-0 right-0 top-0 head-blur z-40"
         style={{ paddingTop: 54, paddingBottom: 10, borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
      <div className="px-3 flex items-center justify-between gap-2">
        <button className="grid place-items-center transition-colors duration-200 ease-forge hover:bg-secondary/70 outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{ width: 38, height: 38, borderRadius: 12, color: 'hsl(var(--foreground))' }}
                aria-label="返回">
          <i data-lucide="chevron-left" style={{ width: 22, height: 22, strokeWidth: 2.2 }}></i>
        </button>
        <div className="flex-1 min-w-0 text-center inline-flex items-baseline justify-center gap-1.5 truncate">
          <span className="text-[14.5px] font-extrabold tracking-[-0.015em] truncate text-foreground">{ex.zh}</span>
          <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{ex.en}</span>
        </div>
        {/* favorite placeholder — V2 enabled, V1 hidden but we keep 38×38 spacer */}
        <div style={{ width: 38, height: 38 }} aria-hidden></div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Lottie-placeholder: synthetic bench-press animation
   ------------------------------------------------------------ */
function LottieBenchPress() {
  // person from side view, lying on a bench, pressing a bar.
  // Built from stacked rects + circle and three keyframes.
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {/* floor line */}
      <line x1="10" y1="180" x2="290" y2="180"
            stroke="hsl(var(--foreground) / 0.18)" strokeWidth="2" strokeLinecap="round" />

      {/* bench */}
      <rect x="70" y="135" width="160" height="14" rx="3" fill="hsl(var(--foreground) / 0.22)" />
      <rect x="80"  y="149" width="6" height="32" fill="hsl(var(--foreground) / 0.22)" />
      <rect x="214" y="149" width="6" height="32" fill="hsl(var(--foreground) / 0.22)" />

      {/* head */}
      <circle cx="206" cy="124" r="11" fill="hsl(var(--foreground) / 0.85)" />
      {/* torso (chest breathes) */}
      <g className="lottie-chest" style={{ transformOrigin: '160px 138px' }}>
        <rect x="110" y="120" width="92" height="20" rx="6" fill="hsl(var(--foreground))" />
      </g>
      {/* legs */}
      <rect x="70"  y="128" width="44" height="12" rx="5" fill="hsl(var(--foreground) / 0.85)" />
      <rect x="60"  y="138" width="22" height="40" rx="6" fill="hsl(var(--foreground) / 0.85)" />

      {/* arms — scale Y to suggest extension/retraction */}
      <g className="lottie-arms" style={{ transformOrigin: '150px 120px' }}>
        <rect x="146" y="80" width="8" height="44" rx="4" fill="hsl(var(--foreground) / 0.85)" />
      </g>

      {/* barbell — moves up & down */}
      <g className="lottie-bar">
        {/* bar */}
        <rect x="80"  y="76" width="140" height="6" rx="3" fill="hsl(var(--foreground))" />
        {/* big plates */}
        <rect x="62"  y="60" width="14" height="38" rx="3" fill="hsl(var(--primary))" />
        <rect x="224" y="60" width="14" height="38" rx="3" fill="hsl(var(--primary))" />
        {/* small plates */}
        <rect x="78"  y="68" width="8"  height="22" rx="2" fill="hsl(var(--foreground))" />
        <rect x="214" y="68" width="8"  height="22" rx="2" fill="hsl(var(--foreground))" />
        {/* collars */}
        <rect x="56"  y="74" width="4"  height="10" rx="1" fill="hsl(var(--foreground))" />
        <rect x="240" y="74" width="4"  height="10" rx="1" fill="hsl(var(--foreground))" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------
   Lottie-placeholder: deadlift (simpler — just barbell + figure)
   ------------------------------------------------------------ */
function LottieDeadlift() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <line x1="10" y1="180" x2="290" y2="180" stroke="hsl(var(--foreground) / 0.18)" strokeWidth="2" strokeLinecap="round" />

      {/* figure */}
      <circle cx="150" cy="56" r="13" fill="hsl(var(--foreground))" />
      <rect x="143" y="70" width="14" height="62" rx="5" fill="hsl(var(--foreground))" />
      <rect x="125" y="130" width="50" height="12" rx="5" fill="hsl(var(--foreground) / 0.85)" />
      <rect x="135" y="140" width="10" height="40" rx="4" fill="hsl(var(--foreground) / 0.85)" />
      <rect x="155" y="140" width="10" height="40" rx="4" fill="hsl(var(--foreground) / 0.85)" />

      {/* arms */}
      <rect x="138" y="80" width="6" height="68" rx="3" fill="hsl(var(--foreground) / 0.85)" />
      <rect x="156" y="80" width="6" height="68" rx="3" fill="hsl(var(--foreground) / 0.85)" />

      {/* barbell — moves up/down */}
      <g className="lottie-bar">
        {/* bar */}
        <rect x="60"  y="146" width="180" height="6" rx="3" fill="hsl(var(--foreground))" />
        {/* big plates */}
        <rect x="44"  y="124" width="16" height="50" rx="3" fill="hsl(var(--primary))" />
        <rect x="240" y="124" width="16" height="50" rx="3" fill="hsl(var(--primary))" />
        {/* small plates */}
        <rect x="62" y="134" width="10" height="30" rx="2" fill="hsl(var(--foreground))" />
        <rect x="228" y="134" width="10" height="30" rx="2" fill="hsl(var(--foreground))" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------
   Playback controls under the Lottie stage
   ------------------------------------------------------------ */
function PlaybackControls() {
  const [speed, setSpeed] = useState('1x');
  const [paused, setPaused] = useState(false);

  // Apply pause/speed to the demo elements via CSS animation-play-state
  useEffect(() => {
    const els = document.querySelectorAll('.lottie-bar, .lottie-arms, .lottie-chest');
    els.forEach(el => {
      el.style.animationPlayState = paused ? 'paused' : 'running';
      const dur = speed === '0.5x' ? '3.6s' : '1.8s';
      el.style.animationDuration = dur;
    });
  }, [speed, paused]);

  return (
    <div className="absolute left-0 right-0 bottom-0 z-10 px-3 pb-3 pt-6"
         style={{
           background: 'linear-gradient(to top, hsl(var(--muted)) 60%, hsl(var(--muted) / 0))',
         }}>
      <div className="flex items-center gap-2">
        {/* play / pause */}
        <button onClick={() => setPaused(p => !p)}
                className="grid place-items-center transition-colors duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: 'hsl(var(--background) / 0.85)',
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 4px 12px -4px rgba(0,0,0,0.20)',
                }}
                aria-label={paused ? '播放' : '暫停'}>
          <i data-lucide={paused ? 'play' : 'pause'} style={{ width: 16, height: 16, fill: 'currentColor', strokeWidth: 2 }}></i>
        </button>

        {/* speed pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl"
             style={{ background: 'hsl(var(--background) / 0.85)' }}>
          {['0.5x', '1x'].map(s => {
            const isActive = s === speed;
            return (
              <button key={s}
                      onClick={() => setSpeed(s)}
                      className="transition-all duration-200 ease-forge"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 11.5, fontWeight: 800, letterSpacing: 0.2,
                        background: isActive ? 'hsl(var(--primary))' : 'transparent',
                        color: isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                      }}>
                {s}
              </button>
            );
          })}
        </div>

        {/* replay */}
        <button onClick={() => {
                  const els = document.querySelectorAll('.lottie-bar, .lottie-arms, .lottie-chest');
                  els.forEach(el => {
                    el.style.animation = 'none';
                    // force reflow
                    el.offsetHeight;
                    el.style.animation = '';
                  });
                  setPaused(false);
                }}
                className="grid place-items-center transition-colors duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: 'hsl(var(--background) / 0.85)',
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 4px 12px -4px rgba(0,0,0,0.20)',
                }}
                aria-label="重播">
          <i data-lucide="rotate-ccw" style={{ width: 15, height: 15, strokeWidth: 2.2 }}></i>
        </button>

        <div className="flex-1"></div>

        {/* tiny caption right */}
        <span className="text-[10px] font-bold tracking-[1.4px] uppercase"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
          動畫示範
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Hero stage
   ------------------------------------------------------------ */
function HeroLottie({ exId }) {
  return (
    <div className="lottie-stage">
      {exId === 'bench' ? <LottieBenchPress /> : <LottieDeadlift />}
      <PlaybackControls />
    </div>
  );
}

/* ------------------------------------------------------------
   Tag chips row
   ------------------------------------------------------------ */
function Chip({ children, tone = 'muted', dot }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-bold tracking-[0.2px]"
          style={{
            background: TONE_BG[tone] || 'hsl(var(--secondary))',
            color: TONE_FG[tone] || 'hsl(var(--foreground))',
          }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 3, background: 'currentColor' }}></span>}
      {children}
    </span>
  );
}

function TagsRow({ ex }) {
  const lv = LEVEL_TOKEN[ex.level];
  return (
    <div className="px-5 mt-5 flex flex-wrap items-center gap-1.5">
      {ex.muscles.map(m => (
        <Chip key={m} tone="primary" dot>{m}</Chip>
      ))}
      <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-bold tracking-[0.2px]"
            style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
        <i data-lucide="wrench" style={{ width: 11, height: 11, strokeWidth: 2.4 }}></i>
        {ex.equipment}
      </span>
      <Chip tone={lv.tone} dot>{lv.label}</Chip>
    </div>
  );
}

/* ------------------------------------------------------------
   Section blocks (description / steps / tips / mistakes)
   ------------------------------------------------------------ */
function SectionTitle({ icon, iconColor = 'hsl(var(--foreground))', children }) {
  return (
    <h3 className="text-[17px] font-extrabold tracking-[-0.02em] text-foreground inline-flex items-center gap-1.5">
      {icon && (
        <span className="grid place-items-center" style={{
          width: 22, height: 22, borderRadius: 7,
          background: 'transparent',
          color: iconColor,
        }}>
          <i data-lucide={icon} style={{ width: 17, height: 17, strokeWidth: 2.2 }}></i>
        </span>
      )}
      {children}
    </h3>
  );
}

function DescriptionSection({ ex }) {
  return (
    <div className="px-5 mt-7">
      <SectionTitle>動作說明</SectionTitle>
      <p className="mt-2.5 text-[14px] leading-[1.65]" style={{ color: 'hsl(var(--foreground) / 0.85)', textWrap: 'pretty' }}>
        {ex.desc}
      </p>
    </div>
  );
}

function StepsSection({ ex }) {
  return (
    <div className="px-5 mt-7">
      <SectionTitle>步驟</SectionTitle>
      <ol className="mt-3 space-y-3">
        {ex.steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="grid place-items-center shrink-0"
                  style={{
                    width: 26, height: 26, borderRadius: 13,
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800, fontSize: 12, letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: 1,
                  }}>
              {i + 1}
            </span>
            <span className="flex-1 text-[14px] leading-[1.6] pt-[3px]"
                  style={{ color: 'hsl(var(--foreground))', textWrap: 'pretty' }}>
              {s.t}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TipsSection({ ex }) {
  return (
    <div className="px-5 mt-7">
      <div className="rounded-2xl p-4"
           style={{
             background: 'hsl(var(--primary) / 0.06)',
             boxShadow: 'inset 0 0 0 1px hsl(var(--primary) / 0.20)',
           }}>
        <SectionTitle icon="lightbulb" iconColor="hsl(var(--primary))">重點提醒</SectionTitle>
        <ul className="mt-3 space-y-2">
          {ex.tips.map((t, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="shrink-0 mt-[7px]" style={{
                width: 5, height: 5, borderRadius: 3,
                background: 'hsl(var(--primary))',
              }}></span>
              <span className="flex-1 text-[13.5px] leading-[1.55]"
                    style={{ color: 'hsl(var(--foreground))', textWrap: 'pretty' }}>
                {t}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MistakesSection({ ex }) {
  return (
    <div className="px-5 mt-3">
      <div className="rounded-2xl p-4"
           style={{
             background: 'hsl(var(--warning) / 0.07)',
             borderLeft: '3px solid hsl(var(--warning))',
             borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
           }}>
        <SectionTitle icon="alert-triangle" iconColor="hsl(var(--warning))">常見錯誤</SectionTitle>
        <ul className="mt-3 space-y-2.5">
          {ex.mistakes.map((m, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="shrink-0 mt-[3px] grid place-items-center"
                    style={{
                      width: 16, height: 16, borderRadius: 5,
                      background: 'hsl(var(--warning) / 0.20)',
                      color: 'hsl(var(--warning))',
                    }}>
                <i data-lucide="x" style={{ width: 10, height: 10, strokeWidth: 3 }}></i>
              </span>
              <span className="flex-1 text-[13.5px] leading-[1.55]"
                    style={{ color: 'hsl(var(--foreground))', textWrap: 'pretty' }}>
                {m}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ============================================================
   Screen
   ============================================================ */
function ExerciseDetailScreen({ ex, exId }) {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="screen-dynamic-island"></div>
      <StatusBar />
      <DetailHeader ex={ex} />

      <div className="flex-1 min-h-0 overflow-y-auto screen-scroll" style={{ paddingTop: 96 }}>
        <HeroLottie exId={exId} />
        <TagsRow ex={ex} />
        <DescriptionSection ex={ex} />
        <StepsSection ex={ex} />
        <TipsSection ex={ex} />
        <MistakesSection ex={ex} />
        <div className="h-6"></div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Phones + Apps
   ------------------------------------------------------------ */
function Phone({ theme, ex, exId, label }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="stage-eyebrow flex items-center gap-2">
        <span className="dot"></span>{theme === 'light' ? 'LIGHT' : 'DARK'} · {label}
        <span className="mono text-[10.5px] text-[#9F9FA8]">· 375 × 812</span>
      </div>
      <div className={`phone theme-${theme}`}>
        <div className="screen">
          <ExerciseDetailScreen ex={ex} exId={exId} />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <Phone theme="light" ex={BENCH}    exId="bench"    label="平板臥推 · 初級" />
      <Phone theme="dark"  ex={BENCH}    exId="bench"    label="平板臥推 · 初級" />
      <Phone theme="light" ex={DEADLIFT} exId="deadlift" label="硬舉 · 進階" />
      <Phone theme="dark"  ex={DEADLIFT} exId="deadlift" label="硬舉 · 進階" />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
