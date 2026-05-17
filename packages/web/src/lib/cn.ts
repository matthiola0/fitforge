import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — Tailwind 友善的 className 合併
 *
 * 慣例同 shadcn/ui。後出現的 class 會覆蓋前面同類別的 class。
 *
 *   cn('p-4 text-sm', condition && 'bg-primary', someClass)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
