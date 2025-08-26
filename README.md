# Vue 3 — Crypto Market Summary (Pinia + Composition API)

A Vue 3 + Vite + Pinia application that fetches cryptocurrency market data and renders an accessible, responsive, and real‑time market table.

## ✨ Features
- **Search** by name or symbol
- **Sorting** by: `rank`, `name`, `price`, `change24h`, `volume`, `bestBid`, `bestOffer`
- **Favorites** (★/☆) + **Only favorites** filter
- **Auto‑refresh (polling)**: manual / 5s / 10s / 30s / 1m
- **Last updated**: drift‑resistant relative time (e.g., "Updated 5s ago")
- **Responsive layout** with sticky header
- **Accessible table semantics** & keyboard‑friendly controls
- Minimal CSS (global utilities + scoped component styles)

---

## 🚀 Getting started

### Prerequisites
- Node 18+

### Setup
```bash
npm i
# copy/replace src/, index.html, package.json as needed
npm run dev
```
> The app defaults to polling every **10s**. Switch to **Manual refresh** from the header if desired.

### Available scripts
```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run preview   # preview the built app
```

---

## 📁 Project structure
```
index.html              # minimal HTML shell
src/
  App.vue
  main.js               # createApp + Pinia + global CSS import
  styles/utilities.css  # global utility + table styles
  stores/market.js      # Pinia store: currencies, market rows, polling
  components/
    Toolbar.vue         # header: search, favorites, interval selector
    CryptoTable.vue     # main table UI with sparkline & favorites
  utils/format.js       # formatCurrency, formatNumber, formatPercent, timeAgo
```

---

## 🌐 Dev proxy & CORS
The upstream APIs do not set CORS headers for localhost. The Vite dev server proxies requests so your browser stays same‑origin.

- In code, always call **relative paths**:
  - **Currency** → `/api/currency`
  - **Market**   → `/api/market`
- Vite rewrites `/api/*` → your real origin (e.g., `https://…/test/api/*`).

If you customize the proxy, update constants in `src/stores/market.js`:
```js
const CURRENCY_URL = '/api/currency'
const MARKET_URL   = '/api/market'
```
For production, either enable CORS on the upstream or keep requests server‑side via your own proxy/edge route.

---

## 🔌 API contracts → normalization
### Currency API (`/api/currency`)
Example item:
```json
{
  "code": "Aud",
  "ticker": "Aud",
  "decimals_places": 2,
  "icon": "<svg…>",
  "type": "Secondary",
  "sort_order": 50
}
```
**Store normalization**
- Uppercase code → `AUD`
- `currencyMeta[code] = { decimals, icon, type, sort }`
- Choose `baseCurrency`: prefer `USD`, else `AUD`, else first available

### Market API (`/api/market`)
Example item:
```json
{
  "pair": {"primary": "Xbt", "secondary": "Aud"},
  "price": {"last": "153263.48", "bestBid": "153362.63", "bestOffer": "153496.92"},
  "change": {"direction": "Down", "percent": "3.87"},
  "volume": {"primary": "31.21", "secondary": "4848923.39115852"},
  "priceHistory": ["156149.98", "155705", …]
}
```
**Store normalization**
- `name = primary/secondary` (e.g., `Xbt/Aud`), `symbol = PRIMARY.toUpperCase()`
- `price = Number(price.last)`
- `bestBid`, `bestOffer`
- `change24h = Number(change.percent)` with sign from `change.direction`
- `volume = Number(volume.secondary || volume.primary)`
- `spark = priceHistory[] → number[]`
- `rank = row.rank ?? idx + 1` (fallback index)

---

## 🗃️ State model (Pinia)
```ts
state = {
  currencies: string[],
  currencyMeta: Record<string, {decimals:number, icon?:string, type?:string, sort?:number}>,
  baseCurrency: string,
  coins: Array<{ id, rank, name, symbol, price, bestBid, bestOffer, change24h, volume, marketCap?, spark?: number[] }>,
  loading: boolean,
  error: string | null,
  lastUpdated: string | null,
  search: string,
  sortBy: 'rank' | 'name' | 'price' | 'change24h' | 'volume' | 'bestBid' | 'bestOffer' | 'marketCap',
  sortDir: 'asc' | 'desc',
  favorites: Set<string>,
  onlyFavorites: boolean,
  pollingMs: number
}
```
**Getter**: `filteredSortedCoins` = search → favorites filter → sort

**Actions**: `fetchCurrencies`, `fetchMarket`, `startPolling`, `stopPolling`, `toggleFavorite`, `setSort`

---

## 🧭 Sorting & Rank
- If you want sequential `#` order (1, 2, 3 …), set default `sortBy` to `'rank'` in the store.
- Otherwise, keep your preferred signal (e.g., `price`, `volume`) as the default and click headers to re‑sort.

---

## ♿ Accessibility
- Semantic `<table>` with header cells
- Native controls; favorites button exposes `aria-pressed`
- Clear focus/hover via native styles and high‑contrast colors

---

## 🧪 Testing (suggested)
- **Unit**: Vitest + `@vue/test-utils` for store actions & table behavior
- **E2E**: Playwright/Cypress for sorting, search, polling, favorites
- Mock `/api/market` to verify normalization & rendering

---

## ⚡ Performance notes
- No heavy UI libs; simple SVG sparkline
- Fine‑grained reactivity via Pinia + Composition API
- Adjust polling to balance freshness vs. load

---

## 🚢 Deployment
- Build: `npm run build` → serve `dist/` on any static host
- If upstream lacks CORS, serve via your own `/api/*` proxy or enable CORS

---

## 🧰 Troubleshooting
- **CORS in dev** → ensure Vite proxy is set and code uses `/api/*`
- **"Updated … ago" not ticking** → use `useRelativeTime` in `Toolbar.vue`
- **Shuffled rank (1, 30, 2 …)** → set `sortBy: 'rank'` as default

---

## 🗺️ Roadmap ideas
- Persist favorites & polling in `localStorage`
- Add spread column (`bestOffer - bestBid` + %)
- Detail drawer with richer chart
- SSE/WebSocket feed if available
- i18n + per‑currency formatting
```
