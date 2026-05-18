import { zhTW } from './locales/zh-TW';

/**
 * i18n — V1 minimal
 *
 * 對應 SDD §4.3「i18n 結構預備」要求：所有文案抽 key、V1 只實作 zh-TW、
 * 結構就位讓 V2 加 en/zh-CN/ja... 不用大改。
 *
 * V1 不接 runtime locale switch — `locale` 編譯時固定為 zhTW。V2 要加
 * 第二 locale 時：
 *   1. 加 `locales/en.ts` 同 shape
 *   2. 改成 `const locale = pick(navigator.language)` 在 root provider
 *   3. (選擇性) 加 Plural 規則 — zh-TW 沒 plural、en 才需要
 *
 * 為什麼不直接用 react-i18next / react-intl：V1 單一 locale、那些 lib
 * 加 60-200KB bundle + provider boilerplate、CP 值不對。
 */

type LocaleObject = typeof zhTW;

/** 把 {a:{b:{c:string}}} 攤平成 'a.b.c' literal union */
type DotPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : DotPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = DotPaths<LocaleObject>;

const locale: LocaleObject = zhTW;

/**
 * Translate. Interpolate `{name}` placeholders by passing values via params.
 *
 * ```ts
 * t('today.inProgressDescription', { count: 5, time: '10:00' })
 * // → "5 個動作 · 開始於 10:00"
 * ```
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const parts = key.split('.');
  let node: unknown = locale;
  for (const part of parts) {
    if (typeof node !== 'object' || node === null) break;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== 'string') {
    if (import.meta.env?.DEV) {
      console.warn(`[i18n] Missing translation: ${key}`);
    }
    return key;
  }
  if (!params) return node;
  return node.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

/** Hook 版 — 之後若加 locale state、useT 就能 subscribe；現在和 t 等價。 */
export function useT() {
  return t;
}
