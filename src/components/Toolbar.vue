<template>
    <header class="app-header">
      <div class="container row between">
        <div class="row gap-md">
          <h1 class="title">💹 Crypto Market Summary</h1>
          <span class="chip muted" v-if="store.lastUpdated">
            Updated {{ lastUpdatedAgo }}
          </span>
        </div>
        <div class="row gap-sm wrap">
          <input v-model="store.search" class="input" placeholder="Search coin or symbol…" aria-label="Search" />
          <label class="row gap-xs align-center">
            <input type="checkbox" v-model="store.onlyFavorites" />
            <span class="muted">Only favorites</span>
          </label>
          <select v-model.number="store.pollingMs" @change="restartPolling" class="select">
            <option :value="0">Manual refresh</option>
            <option :value="5000">5s</option>
            <option :value="10000">10s</option>
            <option :value="30000">30s</option>
            <option :value="60000">1m</option>
          </select>
          <button class="btn" @click="refresh" :disabled="loading">Refresh</button>
        </div>
      </div>
    </header>
  </template>
  
<script setup>
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useMarketStore } from '../stores/market'
  import { timeAgo } from '../utils/format'
  
  const store = useMarketStore()
  const loading = computed(() => store.loading)
  
  // ⏱ force a re-compute every second so "x seconds ago" updates smoothly
  const tick = ref(0)
  let tickTimer = null
  
  const lastUpdatedAgo = computed(() => {
    // depend on tick so this recalculates every second
    tick.value
    return store.lastUpdated ? timeAgo(store.lastUpdated) : ''
  })
  
  function refresh () { store.fetchMarket() }
  function restartPolling () {
    store.stopPolling()
    if (store.pollingMs > 0) store.startPolling()
  }
  
  onMounted(async () => {
    // start the 1s ticker for the 'ago' text
    tickTimer = setInterval(() => { tick.value++ }, 1000)
  
    await store.fetchCurrencies()
    if (store.pollingMs > 0) store.startPolling()
  })
  
  onUnmounted(() => {
    store.stopPolling()
    if (tickTimer) clearInterval(tickTimer)
  })
  
  watch(() => store.pollingMs, restartPolling)
</script>
  
<style scoped>
  .app-header {
    position: sticky;
    top: 0;
    backdrop-filter: blur(8px);
    background: color-mix(in oklab, Canvas, CanvasText 3%);
    border-bottom: 1px solid color-mix(in oklab, CanvasText 20%, transparent);
  }
  .btn:disabled { opacity: .6; cursor: not-allowed; }
</style>
  