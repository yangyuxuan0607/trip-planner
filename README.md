# 旅行計畫（Trip Planner）

給三個固定使用者用的共享旅行協作工具。主頁以「日期 receipt」呈現整趟行程，支援長文自動解析建立行程、三人投票、共同記帳與結算、操作記錄。

## 技術棧

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma · SQLite · Zod · React Hook Form · Vitest

## 快速開始

```bash
npm install
cp .env.example .env      # 依需求修改內容，尤其是 AUTH_SECRET
npm run db:migrate        # 建立 SQLite 資料庫並套用 schema
npm run db:seed           # 寫入三位使用者 + 範例馬來西亞 9 天行程/投票/支出
npm run dev                # http://localhost:3000
```

登入頁會列出三個人的頭像，點選自己、輸入 4 碼 PIN 即可登入。預設種子資料的 PIN 是：

| 使用者   | PIN    |
| -------- | ------ |
| 我       | `1234` |
| 朋友 A   | `2580` |
| 朋友 B   | `3697` |

PIN 只存在 `src/lib/config/users.ts`（明碼），寫入資料庫時一律經過 bcrypt 雜湊，不會出現在任何前端畫面或 API 回應中。

## 修改三位使用者資料

打開 **`src/lib/config/users.ts`**，修改姓名、PIN、頭像文字（1-2 個字）、代表色（hex），存檔後執行：

```bash
npm run db:seed
```

`seed.ts` 會用 `id` 做 upsert，所以可以重複執行；已存在的旅行/行程/投票/支出資料不會被清空或重建（`seed.ts` 偵測到已有 Trip 時會自動跳過旅行相關的種子資料，只更新使用者）。

## 啟用 AI 長文解析（可選）

「導入長文」預設使用內建的規則式解析器（`src/lib/parser/ruleBased.ts`），不需要任何 API Key 就能運作，靠正則與關鍵字辨識日期、時間、分類、地點、金額。

若要改用 AI（Claude）解析，取得更準確的結果：

1. 在 `.env` 設定 `ANTHROPIC_API_KEY="sk-ant-..."`
2. 重新啟動伺服器

行為：

- 有設定 Key 時，優先呼叫 Claude 做結構化解析，結果會用 Zod 驗證。
- AI 呼叫失敗（沒有網路、Key 無效、回傳格式不符…）會自動 fallback 回規則式解析，使用者一定看得到預覽結果。
- API Key 只會在 server action 內讀取（`src/lib/parser/ai.ts`），不會出現在任何前端 bundle 或 network response 中。
- 不論用哪種解析器，都只是產生「草稿」，一定要使用者在預覽畫面確認、可勾選/修改後才會寫入資料庫。

## 多語言（中文 / English / 日本語）

右上角使用者選單、登入頁都可以切換介面語言，選擇會存進 `trip_locale` cookie，下次造訪自動記得。

- **介面文字**（按鈕、標籤、空狀態…）集中在 `src/lib/i18n/dictionaries.ts`，`I18nProvider`（`src/components/i18n/I18nProvider.tsx`）在 `layout.tsx` 裡用 cookie 讀到的語言初始化，之後切換完全在前端即時生效，不用重新整理。
- **行程內容**（旅行名稱/目的地、每天標題、行程標題/地點/備註、投票問題/選項、支出項目名稱）在資料庫裡各存三個欄位：`xxxZh` / `xxxEn` / `xxxJa`，`Zh`/`En`/`Ja` 都可留空，畫面顯示時用 `pickField()`（`src/lib/i18n/content.ts`）依目前語言挑欄位，該語言沒填就照 `目前語言 → Zh → En → Ja` 的順序找第一個非空版本。
- 新增/編輯表單裡標題、地點、備註、投票問題/選項這類欄位都是 `LocalizedInput`/`LocalizedTextarea`（`src/components/trip/LocalizedField.tsx`）：一個輸入框 + 三個語言小按鈕，切換按鈕來填不同語言，不用填滿三個語言，至少填一個就能送出。
- 「導入長文」解析出來的草稿一律先放進中文欄位（因為規則式解析器本身是抓中文語法），使用者可以在預覽時手動切到 EN/JA 補上翻譯。
- 金額格式固定跟著**幣別**走（`Trip.currency`，目前種子資料是 `MYR`），不會因為切介面語言而變動千分位或貨幣符號。
- 已知限制：伺服器端的驗證錯誤訊息（例如 Zod 產生的欄位錯誤）目前固定是中文；登入的三種錯誤訊息、必填標題等主要提示已經三語化，其餘屬於較少見的邊界情況，先不列入這輪範圍。

## 資料模型

`prisma/schema.prisma`：`User` / `Trip` / `TripMember` / `Day` / `ItineraryItem` / `Poll` / `PollOption` / `Vote` / `Expense` / `ExpenseParticipant` / `ActivityLog`。

可翻譯的文字欄位一律是 `xxxZh`（主要語言，其餘語言留空時的 fallback）/ `xxxEn` / `xxxJa` 三個欄位，而不是單一 `xxx` 欄位。

MVP 只會用到一個 `Trip`（`page.tsx` 抓 `findFirst()`），但資料模型本身支援多個旅行、多個成員組合，之後要擴充不需要改 schema。

## 專案結構

```
prisma/
  schema.prisma          # 資料模型
  seed.ts                 # 種子資料入口（使用者 / 旅行 / 投票 / 支出 / 操作記錄）
  seedData.ts              # 種子行程本體：9 天馬來西亞行程，每個欄位都是 { zh, en, ja }
src/
  app/
    login/page.tsx         # 登入頁
    page.tsx                # 主頁（唯一的旅行頁面）
    actions/                 # 所有會寫入資料庫的 server actions
      auth.ts / itinerary.ts / poll.ts / expense.ts / importText.ts
  components/
    auth/LoginForm.tsx       # 選人 + PIN 數字鍵盤
    i18n/                     # I18nProvider（語言 context + t()）、LocaleSwitcher
    trip/                    # 主頁的所有 UI：Header、DayReceipt、ItineraryRow、
                              # PollBlock、各種 Form Sheet / Dialog、ExpenseSheet、
                              # ActivityLogSheet、SettingsSheet、LocalizedField
    ui/                       # shadcn/ui 生成的元件
  lib/
    config/users.ts           # 三位使用者設定（唯一要手動修改的地方）
    i18n/                      # dictionaries.ts（介面文字）、content.ts（pickField 等）、locale.ts
    parser/                    # 長文解析：types / ruleBased / ai / index（統一入口 + fallback）
    validation/                # Zod schema（itinerary / poll / expense）
    session.ts / auth.ts       # 登入 cookie 簽章、目前使用者
    money.ts                    # 分帳與結算演算法
    maps.ts                      # Google Maps 連結產生
    sort.ts                       # 行程排序規則
tests/                          # Vitest 單元測試
```

## 測試 / Lint / Build

```bash
npm run test        # vitest（分帳演算法、長文解析、行程排序、多語言 fallback 邏輯）
npm run lint
npx tsc --noEmit
npm run build
```

## Docker / 部署到有 persistent disk 的 Node.js 平台

```bash
docker build -t trip-planner .
docker run -p 3000:3000 \
  -e AUTH_SECRET="換成一組隨機字串" \
  -v trip-planner-data:/data \
  trip-planner
```

重點：

- SQLite 檔案固定寫在容器內的 `/data/trip.db`，**一定要掛載 persistent volume 到 `/data`**，否則重啟容器資料會消失。
- 容器啟動時（`docker-entrypoint.sh`）會自動執行 `prisma migrate deploy` 套用資料庫遷移，再執行 `prisma/seed.ts`（`upsert`，可重複執行不會清空既有旅行資料），最後啟動 `next start`。
- 部署到 Railway / Render / Fly.io 這類支援 persistent volume 的平台時，把 volume 掛在 `/data`，並設定環境變數 `AUTH_SECRET`（必填）、`ANTHROPIC_API_KEY`（選填）即可；`DATABASE_URL` 已經在 Dockerfile 內指到 `/data/trip.db`，不需要另外設定。

## 已完成功能

- 三語切換介面（中文／English／日本語），行程內容三語各自存欄位，畫面即時切換不用重整。
- 三人固定登入（選頭像 + 4 碼 PIN + cookie session），可切換使用者、登出。
- 主頁以日期 receipt 呈現行程，緊湊列表、點擊展開完整內容，分類 icon、Google Maps 按鈕、建立者頭像。
- 行程新增 / 編輯 / 刪除（Dialog / 底部 Drawer），上移 / 下移排序（同一時間或都沒時間的項目之間）。
- 長文貼上 → 解析預覽（可勾選、逐筆修改）→ 確認批量寫入；規則式解析內建，AI 解析選用。
- 投票：可掛在某一天或獨立顯示，選項含地圖/網址/價格，即時票數、投票人頭像、領先標示、全員投票完成提示，可改票。
- 記帳：新增 / 編輯 / 刪除支出，勾選分攤者，除不盡金額正確分攤到總額，總支出、每人已付/應付/淨額、最少轉帳次數結算建議。
- 操作記錄：右側 Drawer 查看最近 100 筆操作（登入、行程/投票/支出的新增改刪、投票、批量匯入）。
- 響應式：手機底部 Drawer + 右下角新增按鈕，桌面置中 Dialog，主要內容寬度限制在約 900px。
- Docker 化，SQLite 搭配 persistent volume 可長期保存資料。

## 尚未完成 / 適合第二階段

- 真正的拖曳排序（目前用上移/下移取代，符合需求文件中「若拖曳成本高可用上移下移」的备案）。
- 多幣別記帳的匯率換算（目前所有支出視為同一幣別加總，`currency` 欄位存在但顯示層沒有做換算）。
- 「導入長文」目前不會自動把 `suggestPoll` 的段落轉成投票（只會用徽章標示「適合投票」），使用者要再自己按「建立投票」。
- 多旅行（Trip 切換）UI；資料模型已支援，主頁目前固定抓第一筆 Trip。
- 尚未撰寫瀏覽器端 E2E 測試（Playwright 等），目前驗證方式是 Vitest 單元測試 + 手動操作。
