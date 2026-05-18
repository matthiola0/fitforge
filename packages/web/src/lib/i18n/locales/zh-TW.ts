/**
 * Locale: zh-TW (繁體中文)
 *
 * V1 唯一 locale。SDD §4.3「i18n 結構預備、V1 只接 zh-TW」要求把文案
 * 抽 key、V2 再加 en/zh-CN/ja...。
 *
 * Key 命名：`namespace.context.purpose`。namespace 對應 feature
 * (today / plans / workout / settings / common)、context 是螢幕或情境、
 * purpose 是按鈕 / 標題 / 描述等。
 *
 * Interpolation：用 `{name}` 佔位、`t()` 第二參數帶替換值。
 * Plural：V1 沒做 plural 規則 (zh-TW 沒有 plural form)、V2 加 en 時再導入。
 */

export const zhTW = {
  common: {
    cancel: '取消',
    save: '儲存',
    delete: '刪除',
    remove: '移除',
    edit: '編輯',
    confirm: '確認',
    back: '返回',
    next: '下一步',
    skip: '跳過',
    done: '完成',
    retry: '重試',
    close: '關閉',
    settings: '設定',
    minutes: '分鐘',
    seconds: '秒',
    sets: '組',
    exercises: '動作',
  },

  nav: {
    today: '今天',
    plans: '課表',
    library: '動作',
    history: '歷史',
  },

  today: {
    title: '今天',
    greetingMorning: '早安',
    greetingAfternoon: '午安',
    greetingEvening: '晚安',
    greetingNight: '深夜',
    noPlanBadge: '開始第一次',
    noPlanTitle: '還沒選課表',
    noPlanDescription: '選一個預設課表、開始你的健身旅程。',
    noPlanCta: '選擇課表',
    inProgressBadge: '進行中',
    inProgressDescription: '{count} 個動作 · 開始於 {time}',
    inProgressCta: '繼續訓練',
    startCta: '開始訓練',
    adhocTitle: '自由訓練',
    adhocSubtitle: '沒在跑課表？選個部位、隨意練',
  },

  onboarding: {
    step1Title: '想透過健身達到什麼？',
    step2Title: '一週能練幾次？',
    step3Title: '你能用什麼器材？',
    step4Title: '你的訓練經驗？',
    recommendationTitle: '為你推薦這套',
    goalHypertrophy: '增肌',
    goalHypertrophyDesc: '想長肌肉、線條明顯',
    goalStrength: '增強力量',
    goalStrengthDesc: '能舉更重、爆發力強',
    goalFitness: '一般體適能',
    goalFitnessDesc: '健康、有活力',
    goalFatLoss: '減脂',
    goalFatLossDesc: '體脂降低、看起來精實',
    skipConfirm: '跳過',
  },

  plans: {
    title: '課表',
    activeSection: '使用中',
    presetsSection: '預設',
    customSection: '我的',
    setActive: '設為使用中',
    inUse: '使用中',
    detailNoExercises: '這天還沒有動作、點下方按鈕加入。',
    deleteConfirmTitle: '移除這個課表？',
    deleteConfirmBody: '「{name}」軟刪除、訓練紀錄不受影響。',
    exitConfirmTitle: '未儲存的變更會丟失',
    exitConfirmBody: '想先儲存嗎？',
    exitConfirmSave: '儲存並關閉',
    exitConfirmDiscard: '不儲存、直接離開',
    exitConfirmCancel: '繼續編輯',
    pickerEmptyTitle: '沒有符合的動作',
    pickerEmptyBody: '換個關鍵字或部位試試。',
  },

  workout: {
    sessionPrepareTitle: '準備開始訓練',
    startCta: '開始訓練',
    starting: '啟動中...',
    completeSet: '完成這組',
    skipSet: '跳過這組',
    nextSet: '下一組',
    restTitle: '組間休息',
    restNextSet: '下一組 · 第 {n} 組',
    restLastSetLog: '上次 {weight}kg × {reps}',
    restAdd15: '+15 秒',
    allSetsDone: '所有組完成',
    allSetsDoneSubtitle: '辛苦了！按下方按鈕結束、看完整摘要。',
    finishCta: '結束訓練 · 看摘要',
    finishConfirmTitle: '結束本次訓練？',
    finishConfirmBody: '已紀錄的組會保留、未完成的組會丟失。',
    finishConfirmMetaSaved: '{count} 組保留',
    finishConfirmMetaLost: '{count} 組丟失',
    finishConfirmCta: '結束',
    finishConfirmCancel: '繼續訓練',
    swapDisabledHasCompleted: '已有完成的組、無法替換',
    removeDisabledHasCompleted: '已有完成的組、已有完成的組、不能移除',
    swapTitle: '替換動作',
    removeTitle: '移除動作',
    summaryTitle: '訓練完成',
  },

  history: {
    title: '歷史',
    emptyTitle: '還沒有訓練紀錄',
    emptyBody: '完成第一次訓練後、會自動顯示在這裡。',
    emptyCta: '回首頁 · 開始第一次',
    deleteConfirmTitle: '移除這筆紀錄？',
    deleteConfirmBody: '軟刪除、可由設定的「資料」區域復原。',
    detailDeleteTitle: '移除這筆訓練？',
    detailDeleteBody: '軟刪除、可從匯出 JSON 復原。',
    firstTimeNote: '這個動作沒有上次紀錄、是第一次',
  },

  library: {
    title: '動作圖庫',
    searchPlaceholder: '搜尋動作 (中英皆可)',
    filterAll: '全部',
    emptyTitle: '找不到符合的動作',
    emptyBody: 'V1 還沒有這個組合 — 試試別的肌群、或先清掉篩選看看全部 30 個動作。',
    emptyCta: '清除全部篩選',
    detailDemo: '動畫示範',
    detailPaused: '已暫停',
  },

  settings: {
    title: '設定',
    unitSection: '單位',
    themeSection: '主題',
    dataSection: '資料',
    aboutSection: '關於',
    themeSystem: '跟隨系統',
    themeLight: '淺色',
    themeDark: '深色',
    dataExport: '匯出 JSON',
    dataImport: '匯入',
    dataReset: '清除所有資料',
    resetConfirmTitle: '清除所有資料？',
    resetConfirmBodyEmphasis: '此動作不可復原。',
    resetConfirmBodyDetail: '所有訓練紀錄、自訂課表、設定都會永久刪除。',
    resetConfirmType: '我要清除',
    resetConfirmCta: '永久清除',
  },

  install: {
    title: '裝到主畫面、訓練時更快開',
    subtitle: '離線可用、安裝後像 native app 一樣秒開',
    bulletOffline: '訓練中可完全離線',
    bulletDesktop: '桌面 icon、不用每次找瀏覽器',
    installCta: '立即安裝',
    laterCta: '之後再說',
    iosDividerLabel: 'Safari · 3 步 · 約 10 秒',
    iosStep1: '點 Safari 底部的分享按鈕',
    iosStep2: '往下滑、選「加到主畫面」',
    iosStep3: '點右上角「新增」、完成',
  },

  notFound: {
    title: '找不到頁面',
    description: '可能是連結舊了、或這個頁面還沒實作。回首頁從頭開始吧。',
    homeCta: '回首頁',
    plansCta: '或看看課表',
  },

  errors: {
    genericTitle: '出了點狀況',
    genericBody: '請再試一次、或回首頁重新開始。',
  },
} as const;
