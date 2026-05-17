# 08 — PWA 與離線策略 (PWA & Offline Strategy)

> 本檔定義 Service Worker 策略、Web App Manifest、Lottie 預載、可安裝體驗、更新流程。配 [ADR-005](./03-tech-stack.md#adr-005--pwa-完整-offline--installable) 一起讀。

---

## 1. 為什麼是完整 Offline-first

訓練場景：
- 健身房地下室 / 角落、訊號差
- 訓練中專注度需要、不能等網路 spinner
- 用戶來打開 = 立即可用、是否定義「app 質感」的分水嶺

**設計原則**：
1. 第一次載入後、所有後續操作不需網路
2. 動作 Lottie 預載完成後、訓練中任何動作可立即播放
3. Service Worker 更新不打斷正在進行的訓練

---

## 2. Service Worker 策略圖

```mermaid
graph LR
    Request[Browser fetch] --> SW[Service Worker]
    SW --> Decide{URL 類別?}

    Decide -->|App Shell<br/>HTML/JS/CSS| Precache[Precache Cache<br/>install 時寫入]
    Precache --> Browser[回傳]

    Decide -->|Lottie JSON<br/>/lottie/*| SWRStale[Stale-While-Revalidate<br/>立即回快取、背景更新]
    SWRStale --> Browser

    Decide -->|Icons / fonts| CacheFirst[Cache-first<br/>1 年 TTL]
    CacheFirst --> Browser

    Decide -->|API (V2)| NetworkFirst[Network-first<br/>fallback to offline]
    NetworkFirst --> Browser

    Decide -->|其他| NetworkOnly[Network-only]
    NetworkOnly --> Browser

    style SW fill:#f3e5f5
    style Precache fill:#c8e6c9
    style SWRStale fill:#fff9c4
    style CacheFirst fill:#bbdefb
```

V1 不會出現 「API」分支 (沒有 server)，但結構先寫進來 V2 不重設。

---

## 3. vite-plugin-pwa 設定

```typescript
// packages/web/vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // 不自動 activate、出更新提示
      injectRegister: 'auto',
      strategies: 'generateSW', // Workbox 自動產 SW
      manifest: {
        name: 'FitForge',
        short_name: 'FitForge',
        description: '健身新手的離線可用 PWA — 預設課表、動作圖庫、訓練紀錄',
        theme_color: '#FF6B35', // 從設計系統 token
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/today',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: '開始今天的訓練',
            url: '/today',
            icons: [{ src: '/icons/shortcut-workout.png', sizes: '96x96' }],
          },
        ],
        screenshots: [
          { src: '/screenshots/today.png', sizes: '1080x2400', form_factor: 'narrow' },
          { src: '/screenshots/workout.png', sizes: '1080x2400', form_factor: 'narrow' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/lottie\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'lottie-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 1 個月
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(woff2|ttf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
        navigateFallback: '/index.html', // SPA fallback
        cleanupOutdatedCaches: true,
        skipWaiting: false, // 等用戶確認再啟用新 SW
        clientsClaim: false,
      },
      devOptions: {
        enabled: false, // dev 時關閉、避免 cache 問題
      },
    }),
  ],
});
```

---

## 4. 預載 Lottie 動畫 (主動 precache)

`runtimeCaching` 是「**用到才快取**」、但訓練中第一次播某動作會等網路。為了訓練中 100% 可離線、**主動預載**：

```typescript
// packages/web/src/lib/pwa/preloadLottie.ts
import { exerciseSeeds } from '@fitforge/core/data/seeds/exercises';

export async function preloadLottieAssets(): Promise<void> {
  const cache = await caches.open('lottie-cache');
  const urls = exerciseSeeds.map((ex) => `/assets/lottie/${ex.slug}.json`);

  // 批次 fetch、失敗不阻擋
  await Promise.allSettled(
    urls.map(async (url) => {
      const cached = await cache.match(url);
      if (cached) return;
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
    })
  );
}
```

**呼叫時機**：
- App 啟動完成 + SeedService 完成後、`requestIdleCallback` 中觸發
- 不阻擋 UI、不顯示 progress (避免用戶感到「在下載」)
- 完成後可寫入 `Settings.lottieCachedAt`、用 badge 顯示「離線可用 ✓」

---

## 5. Web App Manifest 詳解

| 欄位             | V1 值                       | 為何                                        |
| ---------------- | --------------------------- | ------------------------------------------- |
| `name`           | FitForge                    | 安裝畫面顯示                                |
| `short_name`     | FitForge                    | 主畫面 icon 下方文字                        |
| `display`        | `standalone`                | 隱藏瀏覽器 UI、看起來像 app                 |
| `orientation`    | `portrait`                  | 訓練 app 不需橫向                           |
| `start_url`      | `/today`                    | 啟動進首頁、不是上次離開的頁                |
| `scope`          | `/`                         | 任何路徑都算 PWA 內                         |
| `theme_color`    | (從 設計系統 token)         | 狀態列顏色                                  |
| `background_color` | `#FFFFFF`                 | 啟動畫面背景 (Safari 看)                    |
| `icons`          | 192/512 + maskable          | Android maskable 必要                       |
| `shortcuts`      | 「開始今天的訓練」           | Long-press app icon 快捷                    |
| `screenshots`    | 3-5 張                       | 安裝對話框顯示 (Chrome desktop / Android)   |

---

## 6. 安裝引導 UX

### 6.1 何時提示

不一打開就跳「裝我」 — 太煩。策略：

```typescript
// packages/web/src/features/pwa/InstallPrompt.tsx
export function InstallPromptManager() {
  const dismissed = useUiStore((s) => s.installPromptDismissed);
  const dismiss = useUiStore((s) => s.dismissInstallPrompt);
  const visitCount = useVisitCounter();

  useEffect(() => {
    if (dismissed) return;
    if (visitCount < 3) return; // 第 3 次訪問才提示
    // 監聽 beforeinstallprompt
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, [dismissed, visitCount]);

  // ... 顯示底部 sheet「安裝到主畫面、訓練時更快開啟」 + 「安裝」按鈕
}
```

### 6.2 iOS Safari 特殊處理

iOS Safari 不支援 `beforeinstallprompt`、只能「分享 → 加到主畫面」。需要：
- 偵測 iOS Safari + 不在 standalone 模式
- 顯示自訂 sheet：圖文教學「點分享 icon → 加入主畫面」
- 第 3 次訪問顯示 1 次、之後不再煩

---

## 7. 更新流程 (Service Worker Update)

Workbox 預設行為：
- 新版部署、舊用戶開啟 app → 新 SW 在背景下載 + install
- 但**不自動啟用** (因為 `skipWaiting: false`)
- App 收到 `updatefound` event → UI 顯示「有新版本可用」+ 「立即更新」按鈕
- 用戶點按鈕 → `registration.waiting.postMessage({ type: 'SKIP_WAITING' })` → reload

```typescript
// packages/web/src/features/pwa/UpdateBanner.tsx
export function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setNeedRefresh(true);
            }
          });
        });
      });
    }
  }, []);

  if (!needRefresh) return null;
  return (
    <Banner>
      有新版本可用 <Button onClick={() => {
        registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }}>立即更新</Button>
    </Banner>
  );
}
```

**邊界情況**：訓練進行中 (status === 'in_progress') 不顯示更新 banner — 訓練結束才提醒。

---

## 8. 離線指示 (Online/Offline Indicator)

V1 因為純離線、不太需要顯示「離線中」(用戶不會感受到)。但**為了 V2 cloud sync** 預留：

```typescript
// packages/web/src/features/pwa/useOnlineStatus.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return isOnline;
}
```

V1 只在 Settings 頁顯示「離線可用 ✓」靜態標籤、不做 banner。

---

## 9. Wake Lock (訓練中防螢幕關)

訓練組間休息時、用戶可能不操作螢幕 60+ 秒、會被系統關屏。用 Wake Lock API 保持亮著：

```typescript
// packages/web/src/features/workout/useWakeLock.ts
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;

    let cancelled = false;
    (async () => {
      try {
        const lock = await (navigator.wakeLock as any).request('screen');
        if (cancelled) { lock.release(); return; }
        sentinelRef.current = lock;
      } catch (e) {
        console.warn('[fitforge:pwa] wakeLock failed', e);
      }
    })();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        // 重新請求
        (navigator.wakeLock as any).request('screen').then((l: WakeLockSentinel) => {
          sentinelRef.current = l;
        });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      sentinelRef.current?.release();
      sentinelRef.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active]);
}
```

**在哪用**：`WorkoutSessionPage` mount 時 `useWakeLock(true)`。

**限制**：iOS Safari 16.4+ 才支援。舊版用戶會自動黑屏、無 fallback。

---

## 10. Push Notifications — V1 不做

理由：
- iOS PWA push 限制多 (16.4+ 只在 standalone 模式可用)
- V1 無 server、訊息源頭無從產生
- 訓練提醒邏輯本應由 server cron 推 (V2 議題)

**預留**：UI 不出現 push 相關 UI；Settings 不出現「通知開關」(避免空 promise)。

---

## 11. PWA 觀察與量測

V1 不裝外部分析、但加入「自我健檢」：

| 測試對象             | 工具                          | 目標                       |
| -------------------- | ----------------------------- | -------------------------- |
| PWA 完整性            | Lighthouse (CLI / Chrome devtool) | PWA score ≥ 95             |
| Workbox precache 完整 | `chrome://serviceworker-internals/` 或 DevTools Application 看 cache | 所有 app shell 在 cache 內 |
| Lottie 預載成功       | DevTools Application → Cache Storage → lottie-cache | 30/30 entries              |
| 離線完整流程          | DevTools Network throttle: Offline、跑完一次訓練 | 全程無 spinner             |
| 安裝體驗              | 真機 (iOS Safari + Android Chrome) | 加到主畫面、icon 正確、啟動 splash 正確 |

---

## 12. 風險與緩解

| 風險                                              | 緩解                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Service Worker bug 卡住舊版 (用戶看不到更新)       | DevTools 提供 unregister 流程；Settings 提供「強制刷新」按鈕         |
| Lottie 預載失敗 (網路抖動)                         | `Promise.allSettled`、部分失敗不阻擋、下次啟動再試                    |
| iOS Safari Cache Storage 容量限制 (約 50MB)        | V1 預估 < 5MB、不踩雷                                                |
| `unloaded SW` 在某些 iOS 版本被回收                 | 用戶下次訪問會 re-install、雖然有 1s 延遲、可接受                     |

---

## 13. 下一步閱讀

- 想看部署流程 (Vercel + HTTPS) → [11-testing-deployment.md](./11-testing-deployment.md)
- 想看 Lottie 從哪來 → [01-product-overview.md](./01-product-overview.md) §6 + [20-claude-design-prompts.md](./20-claude-design-prompts.md) §15
- 想看 V2 cloud sync 對 PWA 的影響 → [12-roadmap-v2.md](./12-roadmap-v2.md)
