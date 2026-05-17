# Diagrams

本資料夾存放所有架構圖的 Mermaid 原始檔 (`.mmd`)。每個 SDD 子文件中以 ` ```mermaid ` 行內方式渲染、本資料夾保留可獨立編輯的版本。

## 渲染方式

1. **GitHub / VSCode preview**：直接看 `.md` 內的 mermaid 區塊
2. **Live editing**：將 `.mmd` 內容貼到 [mermaid.live](https://mermaid.live/)
3. **匯出 PNG/SVG**：mermaid CLI (`@mermaid-js/mermaid-cli`)：
   ```bash
   npx -p @mermaid-js/mermaid-cli mmdc -i system-context.mmd -o system-context.png
   ```

## 索引

| 檔案                          | 對應 SDD 章節                                     |
| ----------------------------- | ------------------------------------------------- |
| system-context.mmd            | [SDD §2.1](../SDD.md) — C4 Level 1                |
| container-architecture.mmd    | [SDD §2.2](../SDD.md) — C4 Level 2                |
| component-architecture.mmd    | [02 §3](../02-system-architecture.md) — C4 Level 3 |
| layered-architecture.mmd      | [02 §2](../02-system-architecture.md)             |
| data-model-er.mmd             | [04 §2](../04-data-model.md)                      |
| workout-state-machine.mmd     | [05 §2.2](../05-domain-logic.md)                  |
| onboarding-flow.mmd           | [05 §5.1](../05-domain-logic.md)                  |
| flow-start-workout.mmd        | [02 §4.1](../02-system-architecture.md)           |
| flow-log-set.mmd              | [02 §4.2](../02-system-architecture.md)           |
| flow-finish-workout.mmd       | [02 §4.3](../02-system-architecture.md)           |
| pwa-strategy.mmd              | [08 §2](../08-pwa-offline.md)                     |
| screen-navigation.mmd         | [07 §1](../07-screen-flow.md)                     |
| deployment.mmd                | [02 §8](../02-system-architecture.md)             |
| module-mindmap.mmd            | [SDD §2.3](../SDD.md)                             |
| v1-v2-evolution.mmd           | [12 §3.1](../12-roadmap-v2.md)                    |
