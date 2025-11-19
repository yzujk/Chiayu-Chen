# AGENTS.md - 專案持續開發指南

本文件幫助未來的 AI 助手快速理解專案狀態、開發環境、測試方法與如何繼續開發。

---

## 📋 專案概述

**專案名稱**：投票問卷系統（Poll Survey System）  
**目標**：建立一個純前端、無伺服器、即時同步的投票平台，幫助大眾快速發起投票並收集意見。

**關鍵特性**：
- ✅ 完全匿名（系統自動生成匿名 ID）
- ✅ 無需後端或資料庫伺服器
- ✅ 即時同步（多個設備/瀏覽器即時更新）
- ✅ 使用 GUN.js 分散式存儲
- ✅ 繁體中文介面
- ✅ CDN 版本所有 JavaScript 套件

---

## 🎯 產品願景與 MVP

### MVP（最小可行產品）功能
1. **建立投票**：設定題目、選項、題目類型（單選/多選）
2. **參與投票**：匿名進入、投票、查看結果
3. **即時同步**：多人同時投票，結果無延遲更新
4. **修改投票**：參與者可改變投票選擇
5. **結果統計**：正確計算票數與百分比
6. **資料持久化**：關閉瀏覽器後資料仍保留

詳見 `PRD.md`，其中包含完整的驗收測試案例（TC-1 ~ TC-6）。

---

## 🛠️ 技術棧

| 層級 | 技術 | 備註 |
|-----|------|------|
| **前端框架** | 原生 JavaScript | 無 React/Vue 依賴 |
| **UI/樣式** | 原生 CSS | 可選 Bootstrap CDN |
| **資料庫** | GUN.js（CDN） | 分散式，無伺服器 |
| **測試框架** | Mocha + Chai（CDN） | 瀏覽器環境執行 |
| **部署** | 靜態 HTML | 無需 Node.js 或其他後端 |
| **語言** | JavaScript（ES6+） | 支援所有現代瀏覽器 |

---

## 📁 專案結構

```
Chiayu-Chen/
├── PRD.md                   # 產品需求文件
├── AGENTS.md                # 本文件（開發指南）
├── README.md                # 使用者說明文件
├── index.html               # 主應用入口
├── src/
│   ├── app.js               # 主應用邏輯
│   ├── gun-client.js        # GUN.js 初始化與 API 封裝
│   ├── poll-manager.js      # 投票業務邏輯
│   └── style.css            # 應用樣式
└── tests/
    ├── test.html            # 測試運行器（Mocha HTML）
    └── test.js              # 單元測試案例（Mocha + Chai）
```

---

## 🧪 TDD 開發流程

本專案遵循 **TDD（測試驅動開發）** 模式：

### 1. Red（紅）— 編寫失敗的測試
- 在 `tests/test.js` 中編寫描述預期行為的測試
- 測試應該失敗（因為功能未實現）

### 2. Green（綠）— 實現最小功能讓測試通過
- 在 `src/` 目錄的相應模組中編寫代碼
- 使測試通過（不必完美）

### 3. Refactor（重構）— 優化代碼
- 改善代碼品質、可讀性、效能
- 確保所有測試仍然通過

### 測試運行
```bash
# 本地測試
# 1. 啟動簡單 HTTP 伺服器
python3 -m http.server 8000

# 2. 瀏覽器打開
http://localhost:8000/tests/test.html
```

---

## 📝 核心模組說明

### `src/gun-client.js`
GUN.js 初始化與數據操作 API 封裝。

**主要函數**：
- `initGun()` — 初始化 GUN 實例
- `createPoll(title, options, type)` — 建立新投票
- `savePoll(poll)` — 保存投票到 GUN
- `loadPoll(pollId)` — 加載投票
- `subscribeToPolls(callback)` — 訂閱投票變化（即時同步）
- `saveVote(pollId, userId, selectedOptions)` — 保存投票記錄
- `loadVotes(pollId)` — 加載投票記錄

### `src/poll-manager.js`
投票業務邏輯層（CRUD + 統計）。

**主要函數**：
- `generateAnonymousId()` — 生成匿名 ID
- `createPoll(title, options, type)` — 建立投票
- `getUserVote(pollId, userId)` — 獲取用戶投票
- `updateVote(pollId, userId, oldOptions, newOptions)` — 修改投票
- `getPollStats(poll)` — 計算投票統計
- `calculatePercentage(votes, total)` — 百分比計算

### `src/app.js`
主應用邏輯，連接 UI 與業務邏輯。

**主要職責**：
- DOM 操作與事件監聽
- 投票表單提交處理
- 結果頁面更新與渲染
- GUN 實時同步集成

### `src/style.css`
應用樣式表（繁體中文支援、回應式設計）。

---

## 🔄 開發循環範例

假設要實現「建立投票」功能：

### 步驟 1：編寫測試（Red）
```javascript
// tests/test.js
describe('投票建立', () => {
  it('應建立投票並生成唯一 ID', () => {
    const poll = pollManager.createPoll('你好嗎？', ['好', '不好'], 'single');
    expect(poll).to.have.property('id');
    expect(poll.title).to.equal('你好嗎？');
  });
});
```

### 步驟 2：實現功能（Green）
```javascript
// src/poll-manager.js
function createPoll(title, options, type) {
  const poll = {
    id: 'poll_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    title: title,
    type: type,
    options: options.map((text, idx) => ({ id: 'opt_' + idx, text, votes: 0 })),
    createdAt: Date.now(),
    totalVotes: 0
  };
  return poll;
}
```

### 步驟 3：重構與優化（Refactor）
- 提取常數（如 ID 前綴）
- 添加輸入驗證
- 優化效能

---

## ✅ 驗收標準

所有測試應通過（見 `PRD.md` TC-1 ~ TC-6）：

- ✅ TC-1：建立投票
- ✅ TC-2：參與投票
- ✅ TC-3：即時同步
- ✅ TC-4：修改投票
- ✅ TC-5：投票統計
- ✅ TC-6：資料持久化

運行 `tests/test.html` 在瀏覽器檢查所有測試狀態。

---

## 📖 如何繼續開發

### 新 AI 接手的步驟

1. **閱讀本文件（AGENTS.md）** — 瞭解專案目標、技術棧、模組分工
2. **閱讀 PRD.md** — 瞭解產品需求、MVP 功能、驗收測試
3. **查看現有測試** — 在 `tests/test.js` 檢查已通過/未通過的測試
4. **選擇下一個待開發功能** — 參考 PRD.md 的 TC-N，選擇未實現的功能
5. **TDD 循環**：
   - 在 `tests/test.js` 添加測試
   - 在 `src/` 實現功能
   - 運行 `tests/test.html` 驗證
   - 重複直到所有測試通過

### 常見命令

```bash
# 啟動本地測試伺服器
python3 -m http.server 8000

# 查看測試（瀏覽器）
http://localhost:8000/tests/test.html

# 查看應用（瀏覽器）
http://localhost:8000/index.html
```

---

## 📌 重要注意事項

1. **匿名設計**：不要存儲真實使用者身份，只用生成的匿名 ID
2. **中文優先**：所有文本、按鈕、提示都應使用繁體中文
3. **CDN 版本**：所有外部套件必須通過 CDN 加載，不使用 npm
4. **無後端**：數據只存在 GUN.js，不連接任何伺服器 API
5. **即時同步**：使用 GUN.js 的 `on()` 方法監聽資料變化
6. **測試覆蓋**：所有核心業務邏輯必須有測試

---

## 🚀 後續擴展（非 MVP）

- 投票截止時間設定
- 結果分享（二維碼/連結）
- 圖表展示（柱狀圖/餅圖）
- 投票結果導出（CSV）
- 權限管理（邀請制投票）

---

## 📞 問題排除

### 測試無法執行
- 確認 `tests/test.html` 和 `tests/test.js` 存在
- 檢查瀏覽器控制台（F12）是否有 JavaScript 錯誤
- 確認 Mocha/Chai CDN 連結有效

### GUN.js 連線問題
- GUN.js 默認連接公共中繼，若無網路則離線運作
- 檢查 `src/gun-client.js` 中的 `initGun()` 配置

### 即時同步不工作
- 確認 `subscribeToPolls()` 已在 `src/app.js` 中呼叫
- 檢查 GUN.js 訂閱回調是否正確綁定 DOM

---

**最後更新**：2025-11-19  
**開發階段**：初始 TDD 階段（紅-綠-重構循環）
