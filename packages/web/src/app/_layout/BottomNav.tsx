import { NavLink } from 'react-router-dom';
import { Calendar, Dumbbell, History, ListTodo } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

/**
 * BottomNav — 4 個底部 tab
 *
 * - sticky 在 viewport 底部
 * - safe area padding (iOS PWA home indicator)
 *
 * 對應 docs/07-screen-flow.md §4。
 */

type NavTab = {
  to: string;
  label: string;
  icon: typeof Calendar;
  match: RegExp;
};

const TABS: NavTab[] = [
  { to: '/today', label: t('nav.today'), icon: Calendar, match: /^\/today/ },
  { to: '/plans', label: t('nav.plans'), icon: ListTodo, match: /^\/plans/ },
  { to: '/exercises', label: t('nav.library'), icon: Dumbbell, match: /^\/exercises/ },
  { to: '/history', label: t('nav.history'), icon: History, match: /^\/history/ },
];

export function BottomNav() {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur',
        'pb-safe',
      )}
      aria-label="主要導覽"
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {TABS.map(({ to, label, icon: Icon, match }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2.5',
                  'transition-colors duration-150 ease-forge',
                  isActive || match.test(window.location.pathname)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon size={22} strokeWidth={2} />
              <span className="text-[11px] font-semibold">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
