# 澳門社會服務百科（Macau Social Services Hub）

「一站搜尋全澳服務，有需要，就搵得到。」

本專案支援**雙模式運行**：
1. **GitHub Pages 純靜態公開版**：直接於瀏覽器開啟，免架設伺服器即可使用首頁、12 大服務分類、廣東話口語／簡繁體智能搜尋、服務詳情卡、OpenStreetMap 互動地圖、本地智能服務配對、三語切換與無障礙字體放大，並可於 `/admin` 下載 CSV 公開資料。
2. **完整全端模式（Node.js + SQLite + Gemini AI）**：提供即時 SQLite 資料庫持久化、管理員登入、CSV／Excel 批量匯入與核實流程、以及伺服器端 Gemini AI 情境配對。

---

## 一、如何直接在 GitHub Pages 開啟（只需 2 步）

1. 將本專案推送至您的 GitHub 儲存庫（`main` 或 `master` 分支）。
2. 前往儲存庫頁面的 **Settings → Pages → Build and deployment → Source**，將來源改選為 **GitHub Actions**。

完成後，GitHub 會自動執行 `.github/workflows/deploy-pages.yml` 完成編譯並發佈，數分鐘後即可透過 `https://<您的帳號>.github.io/<儲存庫名稱>/` 直接開啟網站。

---

## 二、本機或雲端伺服器運行完整全端版（含 SQLite 與管理後台）

```bash
npm install
npm run dev
```

啟動後於瀏覽器開啟 `http://localhost:3000`（管理後台位於 `/admin`）。
如需啟用伺服器端 Gemini AI 配對或預設管理員密碼，可複製 `.env.example` 為 `.env` 並填入 `GEMINI_API_KEY` 與 `ADMIN_PASSWORD`。
