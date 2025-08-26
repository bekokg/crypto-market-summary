<template>
    <div class="container table-wrap">
      <div v-if="error" role="alert" class="error">Failed to load: {{ error }}</div>
  
      <table class="table" aria-label="Crypto market table">
        <thead>
          <tr>
            <th></th>
            <th>#</th>
            <th @click="setSort('name')" class="sortable">Pair</th>
            <th @click="setSort('price')" class="sortable">Last ({{ baseCurrency }})</th>
            <th @click="setSort('change24h')" class="sortable">24h</th>
            <th @click="setSort('volume')" class="sortable">24h Volume</th>
            <th @click="setSort('bestBid')" class="sortable">Bid</th>
            <th @click="setSort('bestOffer')" class="sortable">Ask</th>
            <th>Spark</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9">
              <div class="skeleton-row">
                <div class="skeleton w-40"></div>
                <div class="skeleton w-160"></div>
                <div class="skeleton w-100"></div>
                <div class="skeleton w-80"></div>
                <div class="skeleton w-140"></div>
                <div class="skeleton w-100"></div>
                <div class="skeleton w-100"></div>
                <div class="skeleton w-160"></div>
                <div class="skeleton w-40"></div>
              </div>
            </td>
          </tr>
  
          <tr v-for="coin in rows" :key="coin.id || coin.symbol">
            <td>
              <button class="star" @click="toggleFav(coin)" :aria-pressed="isFav(coin)">
                {{ isFav(coin) ? '★' : '☆' }}
              </button>
            </td>
            <td>{{ coin.rank ?? '–' }}</td>
            <td>
              <div class="row gap-sm">
                <img v-if="coin.logo" :src="coin.logo" alt="" width="20" height="20" class="logo"/>
                <strong>{{ coin.name }}</strong>
                <span class="muted">{{ coin.symbol }}</span>
              </div>
            </td>
            <td>{{ formatCurrency(coin.price, baseCurrency) }}</td>
            <td :class="coin.change24h >= 0 ? 'up' : 'down'">{{ formatPercent(coin.change24h) }}</td>
            <td>{{ formatNumber(coin.volume) }}</td>
            <td>{{ formatNumber(coin.bestBid) }}</td>
            <td>{{ formatNumber(coin.bestOffer) }}</td>
            <td>
              <svg v-if="coin.spark && coin.spark.length" :width="sparkWidth" :height="sparkHeight" viewBox="0 0 100 30" preserveAspectRatio="none" aria-label="sparkline">
                <polyline :points="sparkPoints(coin.spark)" fill="none" stroke="currentColor" stroke-width="2" />
              </svg>
              <span v-else class="muted">—</span>
            </td>
            
          </tr>
  
          <tr v-if="!loading && rows.length === 0">
            <td colspan="9" class="muted">No results</td>
          </tr>
        </tbody>
      </table>
    </div>
</template>
  
<script setup>
  import { computed } from 'vue'
  import { useMarketStore } from '../stores/market'
  import { formatCurrency, formatNumber, formatPercent } from '../utils/format'
  
  const store = useMarketStore()
  const rows = computed(() => store.filteredSortedCoins)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const baseCurrency = computed(() => store.baseCurrency)
  
  function setSort(key){ store.setSort(key) }
  function isFav(c){ return store.favorites.has(c.id || c.symbol) }
  function toggleFav(c){ store.toggleFavorite(c.id || c.symbol) }
  
  const sparkWidth = 100
  const sparkHeight = 30
  function sparkPoints(arr){
    const n = arr.length
    if (!n) return ''
    const min = Math.min(...arr)
    const max = Math.max(...arr)
    const range = max - min || 1
    return arr.map((v,i) => {
      const x = (i/(n-1))*100
      const y = 30 - ((v - min)/range)*30
      return `${x},${y}`
    }).join(' ')
  }
</script>

<style scoped>
    .table-wrap { 
        padding-top:8px; 
    }
    .error { 
        margin:10px 0; 
        color:#b00020; 
    }


    th.sortable { 
        cursor:pointer; 
        user-select:none; 
    }


    .skeleton-row { 
        display: flex; 
        gap:10px; 
        align-items:center; 
    }

    .w-40 { 
        width:40px; 
    } .w-80 { 
        width:80px; 
    } .w-100 { 
        width:100px; 
    } .w-140 { 
        width:140px; 
    } .w-160 { 
        width:160px; 
    }
</style>