import { defineStore } from 'pinia'

const CURRENCY_URL = '/api/currency'
const MARKET_URL = '/api/market'


export const useMarketStore = defineStore('market', {
    state: () => ({
        // currency
        currencies: [],          // ["USD","AUD", ...]
        currencyMeta: {},        // { USD: {decimals, icon, ...}, ... }
        baseCurrency: 'USD',

        // market
        coins: [],               // normalized rows
        loading: false,
        error: null,
        lastUpdated: null,

        // UI
        search: '',
        sortBy: 'price',         // name | price | change24h | volume | marketCap | bestBid | bestOffer
        sortDir: 'desc',
        favorites: new Set(),
        onlyFavorites: false,

        // polling
        pollingMs: 10000,
        _timer: null,
    }),

    getters: {
        filteredSortedCoins(state) {
            let rows = state.coins
            if (state.search) {
                const q = state.search.toLowerCase()
                rows = rows.filter(r => (r.name + ' ' + r.symbol).toLowerCase().includes(q))
            }
            if (state.onlyFavorites && state.favorites.size) {
                rows = rows.filter(r => state.favorites.has(r.id || r.symbol))
            }
            const dir = state.sortDir === 'asc' ? 1 : -1
            const key = state.sortBy
            rows = [...rows].sort((a, b) => {
                const av = a[key]
                const bv = b[key]
                if (av == null && bv == null) return 0
                if (av == null) return 1
                if (bv == null) return -1
                if (typeof av === 'string') return av.localeCompare(bv) * dir
                return (av - bv) * dir
            })
            return rows
        }
    },

    actions: {
        async fetchCurrencies() {
            try {
                const res = await fetch(CURRENCY_URL)
                if (!res.ok) throw new Error(`Currency API ${res.status}`)
                const data = await res.json()

                // Expect items like:
                // { code: "Aud", ticker: "Aud", decimals_places: 2, icon: "<svg...>", type: "Secondary" }
                const list = Array.isArray(data) ? data : (data?.currencies || [])
                const meta = {}
                for (const c of list) {
                    const code = String(c.code || c.ticker || '').toUpperCase()
                    if (!code) continue
                    meta[code] = {
                        code,
                        decimals: Number(c.decimals_places ?? 2),
                        icon: c.icon || null,
                        type: c.type || null,
                        sort: Number(c.sort_order ?? 0),
                    }
                }
                this.currencyMeta = meta
                this.currencies = Object.keys(meta)

                // choose a sensible default
                if (meta['USD']) this.baseCurrency = 'USD'
                else if (meta['AUD']) this.baseCurrency = 'AUD'
                else if (this.currencies.length) this.baseCurrency = this.currencies[0]
            } catch (e) {
                this.error = e.message
            }
        },

        async fetchMarket() {
            this.loading = true
            this.error = null
            try {
                const res = await fetch(MARKET_URL)
                if (!res.ok) throw new Error(`Market API ${res.status}`)
                const raw = await res.json()

                // Normalization for your sample:
                // { pair:{primary:'Xbt',secondary:'Aud'}, price:{last,bestBid,bestOffer}, change:{direction,percent}, volume:{primary,secondary}, priceHistory:[...] }
                const rows = (Array.isArray(raw) ? raw : raw?.data || []).map((row, idx) => {
                    const primary = row.pair?.primary || row.symbol || row.base || `COIN_${idx}`
                    const secondary = row.pair?.secondary || row.quote || this.baseCurrency || 'USD'
                    const id = row.id || `${primary}_${secondary}`
                    const name = `${primary}/${secondary}`

                    const last = Number(row.price?.last ?? row.last ?? 0)
                    const bestBid = Number(row.price?.bestBid ?? row.bestBid ?? 0)
                    const bestOffer = Number(row.price?.bestOffer ?? row.bestOffer ?? 0)

                    // apply direction sign to percent if provided
                    const pct = Number(row.price?.change?.percent ?? 0)
                    const dir = (row.price?.change?.direction || '').toLowerCase() === 'down' ? -1 : 1
                    const change24h = isNaN(pct) ? 0 : pct * dir

                    const volume = Number(row.volume?.secondary ?? row.volume?.primary ?? row.volume_24h ?? 0)

                    const spark = Array.isArray(row.priceHistory)
                        ? row.priceHistory.map(v => Number(v)).filter(v => !isNaN(v))
                        : []

                    return {
                        id,
                        rank: row.rank ?? idx + 1,
                        name,
                        symbol: String(primary).toUpperCase(),
                        price: last,
                        bestBid,
                        bestOffer,
                        change24h,
                        volume,
                        marketCap: Number(row.marketCap || row.market_cap || 0) || null,
                        spark,
                        logo: row.image || row.logo || row.icon || null,
                    }
                })

                this.coins = rows
                this.lastUpdated = new Date().toISOString()
            } catch (e) {
                this.error = e.message
            } finally {
                this.loading = false
            }
        },

        startPolling() {
            this.stopPolling()
            this.fetchMarket()
            this._timer = setInterval(() => this.fetchMarket(), this.pollingMs)
        },
        stopPolling() {
            if (this._timer) {
                clearInterval(this._timer)
                this._timer = null
            }
        },
        toggleFavorite(idOrSymbol) {
            const key = idOrSymbol
            if (this.favorites.has(key)) this.favorites.delete(key)
            else this.favorites.add(key)
        },
        setSort(key) {
            if (this.sortBy === key) {
                this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
            } else {
                this.sortBy = key
                this.sortDir = 'desc'
            }
        }
    }
})
