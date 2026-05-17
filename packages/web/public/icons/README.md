# Icons

V1 暫用 `icon.svg` 佔位（白色 F、橙紅背景、圓角 22%）。

之後從 [docs/design/logo/](../../../docs/design/logo/) 取得正式 logo 後、輸出 PNG：

| 檔名 | 尺寸 | 用途 |
|------|------|------|
| `icon-192.png` | 192×192 | PWA install (Android) |
| `icon-512.png` | 512×512 | PWA install (Android) / splash |
| `icon-maskable-512.png` | 512×512 | Android maskable icon (80% safe area) |
| `apple-touch-icon.png` | 180×180 | iOS Safari 加到主畫面 |

`vite.config.ts` 的 PWA manifest 已 reference 這些檔名、放對即可被 build 進去。
