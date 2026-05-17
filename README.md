# FitForge

> Local-first PWA for fitness beginners — 預設課表、動作圖庫、訓練紀錄、完全離線。

## 文件

完整設計文件在 [`docs/`](./docs/)。最快的閱讀方式：雙擊 [`docs/viewer.html`](./docs/viewer.html) 或 [`docs/open-viewer.bat`](./docs/open-viewer.bat)。

從哪開始：

- [SDD.md](./docs/SDD.md) — 全貌（5 分鐘）
- [01-product-overview.md](./docs/01-product-overview.md) — 產品定位
- [09-monorepo-structure.md](./docs/09-monorepo-structure.md) — 專案結構

## Quick Start

```bash
# 安裝依賴
pnpm install

# 跑 core 單元測試
pnpm --filter @fitforge/core test

# (V1 web app 尚未實作)
# pnpm dev
```

## 結構

```
fitness-app/
├── docs/              # SDD + Claude Design prompts
├── packages/
│   ├── core/          # 業務邏輯 (V1/V2 共用，純 TS)
│   └── web/           # React PWA (V1，待加)
└── package.json
```

## 狀態

- [x] SDD 完成
- [x] Tag 系統 + 訓練菜單彈性化設計
- [ ] `packages/core` 業務邏輯（進行中）
- [ ] `packages/web` React PWA
- [ ] 30 個 Lottie 動作素材
- [ ] PWA 部署到 Vercel

## License

個人專案 / 學習用途。
