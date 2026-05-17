/* ============================================================
   FitForge · Plan Editor — main + add-exercise sheet
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ------------------------------------------------------------
   Mock data
   ------------------------------------------------------------ */
const PLAN_INIT = {
  name: '我的全身入門',
  desc: '兩天輪替、全身循環、適合剛開始重訓的人。',
  goal: 'muscle',
  freq: 3,
  days: [
    {
      id: 'd1', name: 'Day 1 · 全身 A',
      exercises: [
        { id: 'e1', zh: '深蹲',     en: 'Squat',         iconKind: 'barbell',  sets: 3, reps: 8,  rest: 90 },
        { id: 'e2', zh: '平板臥推', en: 'Bench Press',   iconKind: 'barbell',  sets: 3, reps: 8,  rest: 90 },
        { id: 'e3', zh: '俯身划船', en: 'Bent-over Row', iconKind: 'dumbbell', sets: 3, reps: 10, rest: 75 },
      ],
    },
    {
      id: 'd2', name: 'Day 2 · 全身 B',
      exercises: [
        { id: 'e4', zh: '硬舉',     en: 'Deadlift',         iconKind: 'barbell',  sets: 3, reps: 6, rest: 120 },
        { id: 'e5', zh: '站姿肩推', en: 'Overhead Press',   iconKind: 'dumbbell', sets: 3, reps: 8, rest: 90 },
      ],
    },
  ],
};

const GOAL_OPTIONS = [
  { id: 'muscle',   label: '增肌' },
  { id: 'strength', label: '力量' },
  { id: 'fitness',  label: '體適能' },
  { id: 'fatloss',  label: '減脂' },
];

const EXERCISE_LIBRARY = [
  { zh: '羅馬尼亞硬舉',     en: 'Romanian Deadlift', muscle: '後鏈', iconKind: 'barbell'  },
  { zh: '引體向上',         en: 'Pull-up',           muscle: '背',   iconKind: 'cable'    },
  { zh: '高腳杯深蹲',       en: 'Goblet Squat',      muscle: '腿',   iconKind: 'dumbbell' },
  { zh: '滑輪下拉',         en: 'Lat Pulldown',      muscle: '背',   iconKind: 'cable'    },
  { zh: '臀推',             en: 'Hip Thrust',        muscle: '臀',   iconKind: 'barbell'  },
  { zh: '棒式',             en: 'Plank',             muscle: '核心', iconKind: 'activity' },
  { zh: '保加利亞分腿蹲',   en: 'Bulgarian Split',   muscle: '腿',   iconKind: 'dumbbell' },
  { zh: '反式划船',         en: 'Face Pull',         muscle: '肩後', iconKind: 'cable'    },
];

const MUSCLE_FILTERS = ['全部', '胸', '背', '腿', '肩', '手', '核心'];

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
   Sticky top header
   ------------------------------------------------------------ */
function EditorHeader({ dirty }) {
  return (
    <div className="absolute left-0 right-0 top-0 head-blur z-40"
         style={{ paddingTop: 54, paddingBottom: 10, borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
      <div className="px-3 flex items-center justify-between gap-2">
        <button className="grid place-items-center transition-colors duration-200 ease-forge hover:bg-secondary/70 outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{ width: 38, height: 38, borderRadius: 12, color: 'hsl(var(--foreground))' }}
                aria-label="返回">
          <i data-lucide="chevron-left" style={{ width: 22, height: 22, strokeWidth: 2.2 }}></i>
        </button>
        <div className="flex-1 min-w-0 text-center inline-flex items-center justify-center gap-1.5">
          <span className="text-[14px] font-bold tracking-[-0.01em] truncate text-foreground">
            編輯課表
          </span>
          {dirty && <span className="dirty-dot" aria-label="未儲存"></span>}
        </div>
        <button className="grid place-items-center transition-colors duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  color: 'hsl(var(--destructive))',
                }}
                aria-label="刪除課表">
          <i data-lucide="trash-2" style={{ width: 19, height: 19, strokeWidth: 2.2 }}></i>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Form primitives
   ------------------------------------------------------------ */
function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div className="inline-flex items-center gap-1">
      <button type="button" onClick={dec} className="stepper-btn" aria-label="減">
        <i data-lucide="minus" style={{ width: 12, height: 12, strokeWidth: 2.6 }}></i>
      </button>
      <span className="stepper-val">{value}{suffix}</span>
      <button type="button" onClick={inc} className="stepper-btn" aria-label="加">
        <i data-lucide="plus" style={{ width: 12, height: 12, strokeWidth: 2.6 }}></i>
      </button>
    </div>
  );
}

function FieldGroup({ label, hint, children }) {
  return (
    <div className="px-4 py-3.5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="field-label">{label}</div>
        {hint}
      </div>
      <div className="mt-1">
        {children}
      </div>
    </div>
  );
}

function GoalChips({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {GOAL_OPTIONS.map(g => {
        const isActive = g.id === value;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(g.id)}
            className="inline-flex items-center px-3 py-1.5 rounded-md transition-all duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            style={{
              background: isActive ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
              color: isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
              fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.005em',
              boxShadow: isActive ? '0 4px 12px -4px hsl(var(--primary) / 0.40)' : 'none',
            }}
          >
            {g.label}
          </button>
        );
      })}
    </div>
  );
}

function BasicFieldsCard({ plan, setPlan }) {
  const set = (key) => (v) => setPlan(p => ({ ...p, [key]: v }));
  return (
    <div className="bg-card rounded-2xl"
         style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--border))' }}>
      <FieldGroup label="課表名稱">
        <input className="field-input" value={plan.name} onChange={e => set('name')(e.target.value)} />
      </FieldGroup>
      <FieldGroup label="課表描述">
        <textarea className="field-input" rows={3} value={plan.desc}
                  onChange={e => set('desc')(e.target.value)}
                  style={{ resize: 'none', fontWeight: 500, fontSize: 14, lineHeight: 1.5 }} />
      </FieldGroup>
      <FieldGroup label="目標">
        <div className="mt-2"><GoalChips value={plan.goal} onChange={set('goal')} /></div>
      </FieldGroup>
      <FieldGroup label="每週訓練次數"
                  hint={<span className="text-[11px] font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>2 ~ 6 次</span>}>
        <div className="mt-2 inline-flex items-center gap-2">
          <Stepper value={plan.freq} onChange={set('freq')} min={2} max={6} />
          <span className="text-[12.5px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>次 / 週</span>
        </div>
      </FieldGroup>
    </div>
  );
}

/* ------------------------------------------------------------
   Exercise thumb
   ------------------------------------------------------------ */
function ExerciseThumb({ kind, size = 40 }) {
  return (
    <div className="relative grid place-items-center overflow-hidden shrink-0"
         style={{ width: size, height: size, borderRadius: 10, background: 'hsl(var(--secondary))' }}>
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
    </div>
  );
}

/* ------------------------------------------------------------
   Exercise edit row
   ------------------------------------------------------------ */
function ExerciseEditRow({ ex, onChange, onDelete, isFirst }) {
  return (
    <div className="py-2.5"
         style={{ borderTop: isFirst ? 'none' : '1px solid hsl(var(--border))' }}>
      {/* row 1: drag + thumb + name + delete */}
      <div className="flex items-center gap-2.5">
        <i data-lucide="grip-vertical" style={{ width: 14, height: 14, color: 'hsl(var(--muted-foreground) / 0.55)' }}></i>
        <ExerciseThumb kind={ex.iconKind} />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold tracking-[-0.015em] truncate text-foreground">
            {ex.zh}
            <span className="ml-1 text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{ex.en}</span>
          </div>
        </div>
        <button onClick={onDelete}
                className="grid place-items-center transition-colors duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{ width: 26, height: 26, borderRadius: 8, color: 'hsl(var(--muted-foreground))' }}
                aria-label="刪除動作">
          <i data-lucide="x" style={{ width: 14, height: 14, strokeWidth: 2.2 }}></i>
        </button>
      </div>
      {/* row 2: steppers */}
      <div className="mt-2 ml-[22px] flex items-center gap-3 flex-wrap" style={{paddingLeft:8}}>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{color:'hsl(var(--muted-foreground))'}}>SETS</span>
          <Stepper value={ex.sets} onChange={v => onChange({...ex, sets: v})} min={1} max={10} />
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{color:'hsl(var(--muted-foreground))'}}>REPS</span>
          <Stepper value={ex.reps} onChange={v => onChange({...ex, reps: v})} min={1} max={50} />
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{color:'hsl(var(--muted-foreground))'}}>REST</span>
          <Stepper value={ex.rest} onChange={v => onChange({...ex, rest: v})} min={15} max={300} step={15} suffix="s" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Day card
   ------------------------------------------------------------ */
function DayCard({ day, onChange, onDelete, canMoveUp, canMoveDown, onMove, onAddExercise }) {
  return (
    <div className="bg-card rounded-2xl"
         style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--border))' }}>
      {/* day header */}
      <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
        <input
          value={day.name}
          onChange={(e) => onChange({ ...day, name: e.target.value })}
          className="flex-1 min-w-0 outline-none bg-transparent text-foreground"
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            padding: '4px 6px',
            marginLeft: -6,
            borderRadius: 6,
          }}
        />
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onMove(-1)} disabled={!canMoveUp}
                  className="grid place-items-center transition-colors duration-200 ease-forge disabled:opacity-25 outline-none"
                  style={{ width: 28, height: 28, borderRadius: 8, color: 'hsl(var(--muted-foreground))' }}
                  aria-label="向上排序">
            <i data-lucide="chevron-up" style={{ width: 16, height: 16, strokeWidth: 2.4 }}></i>
          </button>
          <button onClick={() => onMove(1)} disabled={!canMoveDown}
                  className="grid place-items-center transition-colors duration-200 ease-forge disabled:opacity-25 outline-none"
                  style={{ width: 28, height: 28, borderRadius: 8, color: 'hsl(var(--muted-foreground))' }}
                  aria-label="向下排序">
            <i data-lucide="chevron-down" style={{ width: 16, height: 16, strokeWidth: 2.4 }}></i>
          </button>
          <button onClick={onDelete}
                  className="grid place-items-center transition-colors duration-200 ease-forge outline-none"
                  style={{ width: 28, height: 28, borderRadius: 8, color: 'hsl(var(--destructive))' }}
                  aria-label="刪除這天">
            <i data-lucide="trash-2" style={{ width: 14, height: 14, strokeWidth: 2.2 }}></i>
          </button>
        </div>
      </div>

      {/* exercises */}
      <div className="px-4 pb-2">
        {day.exercises.map((ex, i) => (
          <ExerciseEditRow
            key={ex.id}
            ex={ex}
            isFirst={i === 0}
            onChange={(next) => {
              const exs = day.exercises.map(e => e.id === ex.id ? next : e);
              onChange({ ...day, exercises: exs });
            }}
            onDelete={() => {
              const exs = day.exercises.filter(e => e.id !== ex.id);
              onChange({ ...day, exercises: exs });
            }}
          />
        ))}
      </div>

      {/* add exercise button */}
      <div className="px-4 pb-4">
        <button onClick={onAddExercise}
                className="w-full inline-flex items-center justify-center gap-1.5 transition-colors duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                style={{
                  height: 38, borderRadius: 10,
                  background: 'transparent',
                  color: 'hsl(var(--foreground))',
                  boxShadow: 'inset 0 0 0 1.5px hsl(var(--border))',
                  fontSize: 13, fontWeight: 700, letterSpacing: '-0.005em',
                }}>
          <i data-lucide="plus" style={{ width: 14, height: 14, strokeWidth: 2.4 }}></i>
          新增動作
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Add Exercise Sheet
   ------------------------------------------------------------ */
function AddExerciseSheet({ onClose, onPick }) {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState('全部');

  const filtered = EXERCISE_LIBRARY.filter(e => {
    const matchesQ = !q || e.zh.includes(q) || e.en.toLowerCase().includes(q.toLowerCase());
    const matchesM = muscle === '全部' || e.muscle === muscle;
    return matchesQ && matchesM;
  });

  return (
    <>
      {/* backdrop */}
      <div className="backdrop-in absolute inset-0 z-40"
           onClick={onClose}
           style={{ background: 'hsl(0 0% 0% / 0.42)' }}></div>

      {/* sheet */}
      <div className="sheet-up absolute left-0 right-0 bottom-0 z-50 flex flex-col"
           style={{
             height: '88%',
             background: 'hsl(var(--background))',
             borderTopLeftRadius: 24, borderTopRightRadius: 24,
             boxShadow: '0 -20px 60px -10px rgba(0,0,0,0.40)',
           }}>
        {/* drag handle */}
        <div className="pt-2 pb-1 grid place-items-center shrink-0">
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'hsl(var(--muted-foreground) / 0.35)' }}></div>
        </div>

        {/* header */}
        <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-foreground">選擇動作</h2>
          <button onClick={onClose}
                  className="grid place-items-center transition-colors duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'hsl(var(--secondary))',
                    color: 'hsl(var(--foreground))',
                  }}
                  aria-label="關閉">
            <i data-lucide="x" style={{ width: 16, height: 16, strokeWidth: 2.4 }}></i>
          </button>
        </div>

        {/* search */}
        <div className="px-5 pb-3 shrink-0">
          <div className="relative">
            <i data-lucide="search"
               style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }}></i>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="搜尋動作 (中英皆可)"
              className="w-full outline-none transition-colors duration-200 ease-forge"
              style={{
                height: 44, paddingLeft: 36, paddingRight: 12,
                borderRadius: 12,
                background: 'hsl(var(--secondary))',
                color: 'hsl(var(--foreground))',
                fontSize: 14, fontWeight: 500,
              }}
            />
          </div>
        </div>

        {/* filter chips */}
        <div className="pb-3 shrink-0">
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
                    padding: '7px 14px',
                    borderRadius: 10,
                    background: isActive ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                    color: isActive ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                    fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.005em',
                    boxShadow: isActive ? '0 4px 12px -4px hsl(var(--primary) / 0.40)' : 'none',
                  }}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* list (scroll) */}
        <div className="flex-1 min-h-0 overflow-y-auto screen-scroll px-5 pb-6">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-[13px] font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>沒有符合的動作。試試其他關鍵字？</div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onPick(e)}
                  className="w-full text-left flex items-center gap-3 p-2.5 transition-colors duration-200 ease-forge hover:bg-secondary/70 outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                  style={{ borderRadius: 14 }}>
                  <ExerciseThumb kind={e.iconKind} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-bold tracking-[-0.015em] truncate text-foreground">
                      {e.zh}
                      <span className="ml-1 text-[11.5px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{e.en}</span>
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9.5px] font-bold tracking-[1px] uppercase"
                            style={{ background: 'hsl(var(--primary) / 0.10)', color: 'hsl(var(--primary))' }}>
                        {e.muscle}
                      </span>
                    </div>
                  </div>
                  <div className="grid place-items-center shrink-0"
                       style={{
                         width: 30, height: 30, borderRadius: 10,
                         background: 'hsl(var(--primary))',
                         color: 'hsl(var(--primary-foreground))',
                       }}>
                    <i data-lucide="plus" style={{ width: 14, height: 14, strokeWidth: 2.6 }}></i>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------
   Save bar
   ------------------------------------------------------------ */
function SaveBar({ dirty }) {
  return (
    <div className="absolute left-0 right-0 bottom-0 z-30 nav-blur"
         style={{
           borderTop: '1px solid hsl(var(--border))',
           paddingBottom: 26, paddingTop: 12, paddingLeft: 18, paddingRight: 18,
         }}>
      <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
        <button
          className="inline-flex items-center justify-center gap-1 rounded-xl font-bold text-[14px] transition-all duration-200 ease-forge active:scale-[0.99]"
          style={{
            height: 48,
            background: 'transparent',
            color: 'hsl(var(--foreground))',
            boxShadow: 'inset 0 0 0 1.5px hsl(var(--border))',
          }}>
          取消
        </button>
        <button
          className="inline-flex items-center justify-center gap-1.5 rounded-xl font-bold text-[14.5px] tracking-[0.01em] bg-primary text-primary-foreground hover:opacity-95 active:scale-[0.99] transition-all duration-200 ease-forge"
          style={{
            height: 48,
            boxShadow: dirty ? '0 12px 28px -6px hsl(var(--primary) / 0.50), 0 4px 10px -3px hsl(var(--primary) / 0.30)' : 'none',
          }}>
          <i data-lucide="check" style={{ width: 16, height: 16, strokeWidth: 2.6 }}></i>
          儲存
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Screen
   ============================================================ */
function EditorScreen({ initialSheetOpen }) {
  const [plan, setPlan] = useState(PLAN_INIT);
  const [sheetOpen, setSheetOpen] = useState(!!initialSheetOpen);
  const [activeDayId, setActiveDayId] = useState(plan.days[0]?.id);
  const dirty = true; // demo: show dirty state for the save bar glow

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const setDay = (id) => (next) => {
    setPlan(p => ({ ...p, days: p.days.map(d => d.id === id ? next : d) }));
  };
  const deleteDay = (id) => () => {
    setPlan(p => ({ ...p, days: p.days.filter(d => d.id !== id) }));
  };
  const moveDay = (id) => (dir) => {
    setPlan(p => {
      const i = p.days.findIndex(d => d.id === id);
      const j = i + dir;
      if (j < 0 || j >= p.days.length) return p;
      const days = [...p.days];
      [days[i], days[j]] = [days[j], days[i]];
      return { ...p, days };
    });
  };
  const addDay = () => {
    const n = plan.days.length + 1;
    const id = 'd' + Date.now();
    setPlan(p => ({ ...p, days: [...p.days, { id, name: `Day ${n} · 新訓練日`, exercises: [] }] }));
  };
  const handleAddExercise = (dayId) => () => {
    setActiveDayId(dayId);
    setSheetOpen(true);
  };
  const handlePickExercise = (libEx) => {
    const id = 'ex' + Date.now();
    const newEx = { id, zh: libEx.zh, en: libEx.en, iconKind: libEx.iconKind, sets: 3, reps: 10, rest: 75 };
    setPlan(p => ({
      ...p,
      days: p.days.map(d => d.id === activeDayId ? { ...d, exercises: [...d.exercises, newEx] } : d),
    }));
    setSheetOpen(false);
  };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="screen-dynamic-island"></div>
      <StatusBar />
      <EditorHeader dirty={dirty} />

      {/* scroll content */}
      <div className="flex-1 min-h-0 overflow-y-auto screen-scroll"
           style={{ paddingTop: 104, paddingBottom: 100 }}>
        <div className="px-5 space-y-4">
          <BasicFieldsCard plan={plan} setPlan={setPlan} />

          {/* days section header */}
          <div className="pt-2 flex items-baseline justify-between">
            <h3 className="text-[15px] font-extrabold tracking-[-0.015em] text-foreground inline-flex items-center gap-2">
              訓練日
              <span className="text-[11px] font-bold tracking-[1.4px] uppercase num" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {plan.days.length} 天
              </span>
            </h3>
          </div>

          {plan.days.map((day, i) => (
            <DayCard
              key={day.id}
              day={day}
              onChange={setDay(day.id)}
              onDelete={deleteDay(day.id)}
              canMoveUp={i > 0}
              canMoveDown={i < plan.days.length - 1}
              onMove={moveDay(day.id)}
              onAddExercise={handleAddExercise(day.id)}
            />
          ))}

          {/* add day */}
          <button onClick={addDay}
                  className="w-full inline-flex items-center justify-center gap-1.5 transition-colors duration-200 ease-forge outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                  style={{
                    height: 44, borderRadius: 12,
                    background: 'transparent',
                    color: 'hsl(var(--foreground))',
                    boxShadow: 'inset 0 0 0 1.5px hsl(var(--border))',
                    fontSize: 13.5, fontWeight: 700,
                  }}>
            <i data-lucide="plus" style={{ width: 16, height: 16, strokeWidth: 2.4 }}></i>
            新增訓練日
          </button>
        </div>
        <div className="h-6"></div>
      </div>

      <SaveBar dirty={dirty} />

      {sheetOpen && <AddExerciseSheet onClose={() => setSheetOpen(false)} onPick={handlePickExercise} />}
    </div>
  );
}

/* ------------------------------------------------------------
   Phones + Apps
   ------------------------------------------------------------ */
function Phone({ theme, sheetOpen }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="stage-eyebrow flex items-center gap-2">
        <span className="dot"></span>{theme === 'light' ? 'LIGHT MODE' : 'DARK MODE'}
        <span className="mono text-[10.5px] text-[#9F9FA8]">· 375 × 812</span>
      </div>
      <div className={`phone theme-${theme}`}>
        <div className="screen">
          <EditorScreen initialSheetOpen={sheetOpen} />
        </div>
      </div>
    </div>
  );
}

function MainApp()  { return (<><Phone theme="light" /><Phone theme="dark" /></>); }
function SheetApp() { return (<><Phone theme="light" sheetOpen /><Phone theme="dark" sheetOpen /></>); }

ReactDOM.createRoot(document.getElementById('root-main')).render(<MainApp />);
ReactDOM.createRoot(document.getElementById('root-sheet')).render(<SheetApp />);
