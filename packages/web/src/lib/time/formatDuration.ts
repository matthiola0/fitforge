/**
 * 把秒數格式化為易讀字串。
 *
 *   45            → '45 秒'
 *   90            → '1 分 30 秒'
 *   3725          → '1 小時 2 分'
 *   null          → '—'
 */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return '—';
  if (totalSeconds < 60) return `${totalSeconds} 秒`;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes === 0 ? `${hours} 小時` : `${hours} 小時 ${minutes} 分`;
  }
  if (seconds === 0) return `${minutes} 分`;
  return `${minutes} 分 ${seconds} 秒`;
}

/** 把 ISO datetime 轉成相對時間 (簡易版) */
export function formatRelative(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '—';
  const diffMs = now.getTime() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);
  if (diffMin < 1) return '剛剛';
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  if (diffHr < 24) return `${diffHr} 小時前`;
  if (diffDay === 1) return '昨天';
  if (diffDay < 7) return `${diffDay} 天前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} 週前`;
  return `${Math.floor(diffDay / 30)} 個月前`;
}

/** 取得時段問候語 */
export function greetingByHour(hour: number = new Date().getHours()): string {
  if (hour < 5) return '深夜好';
  if (hour < 11) return '早安';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
}
