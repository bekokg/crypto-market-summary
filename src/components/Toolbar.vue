<template>
    <header class="app-header">
      <div class="container">
        <div class="topline">
          <div class="title-row">
            <h1 class="title">💹 Crypto Market Summary</h1>
            <span class="chip muted" v-if="store.lastUpdated" :aria-live="loading ? 'off' : 'polite'">
              Updated {{ lastUpdatedAgo }}
            </span>
          </div>
  
          <!-- Desktop controls stay inline -->
          <div class="controls controls-desktop">
            <input
              v-model="store.search"
              class="input"
              type="search"
              placeholder="Search coin or symbol…"
              aria-label="Search"
              @keydown.enter="refresh"
            />
            <label class="check row gap-xs align-center">
              <input type="checkbox" v-model="store.onlyFavorites" />
              <span class="muted">Only favorites</span>
            </label>
            <select v-model.number="store.pollingMs" @change="restartPolling" class="select" aria-label="Auto refresh">
              <option :value="0">Manual refresh</option>
              <option :value="5000">5s</option>
              <option :value="10000">10s</option>
              <option :value="30000">30s</option>
              <option :value="60000">1m</option>
            </select>
            <button class="btn" @click="refresh" :disabled="loading" :aria-busy="loading">Refresh</button>
          </div>
  
          <!-- Mobile: intuitive Filters button + animated panel -->
          <div class="controls controls-mobile">
            <button
              class="filter-btn"
              :data-active="hasActiveFilters"
              :aria-expanded="showFilters.toString()"
              aria-controls="filters-panel"
              :title="hasActiveFilters ? `${activeFilterCount} active` : 'No active filters'"
              @click="toggleFilters"
            >
              <span class="filter-icon" aria-hidden="true">🎚️</span>
              <span>Filters</span>
              <span v-if="activeFilterCount" class="badge" :aria-label="`${activeFilterCount} filters active`">
                {{ activeFilterCount }}
              </span>
            </button>
  
            <transition name="slide-fade">
              <div v-show="showFilters" id="filters-panel" class="controls-grid" ref="filtersPanel">
                <input
                  v-model="store.search"
                  class="input"
                  type="search"
                  placeholder="Search coin or symbol…"
                  aria-label="Search"
                  @keydown.enter="refresh"
                />
                <label class="check row gap-xs align-center">
                  <input type="checkbox" v-model="store.onlyFavorites" />
                  <span class="muted">Only favorites</span>
                </label>
                <select v-model.number="store.pollingMs" @change="restartPolling" class="select" aria-label="Auto refresh">
                  <option :value="0">Manual refresh</option>
                  <option :value="5000">5s</option>
                  <option :value="10000">10s</option>
                  <option :value="30000">30s</option>
                  <option :value="60000">1m</option>
                </select>
                <button class="btn" @click="refresh" :disabled="loading" :aria-busy="loading">Refresh</button>
                <button class="btn btn-clear" v-if="hasActiveFilters" @click="clearFilters">Clear</button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </header>
</template>
  
<script setup>
  import { ref, computed, onMounted, onUnmounted, watch, onBeforeUnmount } from 'vue'
  import { useMarketStore } from '../stores/market'
  import { timeAgo } from '../utils/format'
  
  const store = useMarketStore()
  const loading = computed(() => store.loading)
  
  // ⏱ re-compute "x seconds ago"
  const tick = ref(0)
  let tickTimer = null
  const lastUpdatedAgo = computed(() => {
    tick.value
    return store.lastUpdated ? timeAgo(store.lastUpdated) : ''
  })
  
  function refresh () { store.fetchMarket() }
  function restartPolling () {
    store.stopPolling()
    if (store.pollingMs > 0) store.startPolling()
  }
  
  // --- Intuitive Filters button state ---
  const showFilters = ref(false)
  const activeFilterCount = computed(() => {
    let n = 0
    if (store.search?.trim()) n++
    if (store.onlyFavorites) n++
    // Count auto-refresh as a “setting” if not manual; remove if you don’t want it counted
    if (store.pollingMs > 0) n++
    return n
  })
  const hasActiveFilters = computed(() => activeFilterCount.value > 0)
  function toggleFilters () { showFilters.value = !showFilters.value }
  function clearFilters () {
    store.search = ''
    store.onlyFavorites = false
    // keep polling setting as-is, or reset to manual:
    // store.pollingMs = 0; restartPolling()
  }
  
  function onKeydown (e) {
    if (e.key === 'Escape') showFilters.value = false
  }
  
  onMounted(async () => {
    tickTimer = setInterval(() => { tick.value++ }, 1000)
    window.addEventListener('keydown', onKeydown)
    await store.fetchCurrencies()
    if (store.pollingMs > 0) store.startPolling()
  })
  onUnmounted(() => {
    store.stopPolling()
    if (tickTimer) clearInterval(tickTimer)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
  })
  watch(() => store.pollingMs, restartPolling)
</script>
  
<style scoped>
  .app-header {
    position: sticky; 
    top: 0; 
    z-index: 10;
    backdrop-filter: blur(6px);
    background: color-mix(in oklab, Canvas, CanvasText 3%);
    border-bottom: 1px solid color-mix(in oklab, CanvasText 20%, transparent);
  }
  .container { 
    padding: 0.75rem 1rem; 
    max-width: 1100px; 
    margin: 0 auto; 
  }
  .topline { 
    display: grid; 
    gap: 0.75rem; 
  }
  .title-row { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    gap: .75rem; 
    flex-wrap: wrap; 
  }
  .title { 
    font-size: clamp(1.1rem, 2.5vw, 1.5rem); 
    line-height: 1.1; 
    margin: 0; 
  }
  .chip { 
    white-space: nowrap; 
  }
  
  .controls-desktop { 
    display: none; 
  }
  .controls-mobile { 
    display: grid; 
    gap: .5rem; 
  }
  
  .filter-btn {
    display: inline-flex; 
    align-items: center; 
    gap: .5rem;
    border: 1px solid color-mix(in oklab, CanvasText 15%, transparent);
    background: Canvas; border-radius: 12px; padding: .6rem .8rem;
    font-weight: 600; cursor: pointer;
    position: relative;
  }
  .filter-btn .badge {
    display: inline-flex; 
    align-items: center; 
    justify-content: center;
    min-width: 1.25rem; 
    height: 1.25rem; 
    padding: 0 .35rem;
    border-radius: 999px; 
    font-size: .75rem; 
    line-height: 1;
    background: color-mix(in oklab, CanvasText 80%, transparent);
    color: Canvas;
  }
  .filter-btn[data-active="true"] {
    border-color: color-mix(in oklab, CanvasText 35%, transparent);
    box-shadow: 0 0 0 3px color-mix(in oklab, CanvasText 10%, transparent);
  }
  .filter-icon { 
    transform: translateY(1px); 
  }
  
  .controls-grid {
    display: grid; 
    grid-template-columns: 1fr; 
    gap: .55rem;
    border: 1px solid color-mix(in oklab, CanvasText 15%, transparent);
    border-radius: 12px; 
    padding: .6rem;
  }
  .input, .select, .btn, .check input { 
    min-height: 44px; 
  }
  .input, .select { 
    width: 100%; 
  }
  .btn:disabled { 
    opacity: .6; 
    cursor: not-allowed; 
  }
  .btn-clear { 
    background: transparent; 
    border: 1px dashed color-mix(in oklab, CanvasText 35%, transparent); 
  }
  
  .slide-fade-enter-active, .slide-fade-leave-active { 
    transition: opacity .18s ease, transform .18s ease; 
  }
  .slide-fade-enter-from, .slide-fade-leave-to { 
    opacity: 0; 
    transform: translateY(-4px); 
  }
  
  @media (min-width: 720px) {
    .controls-desktop { 
        display: flex; 
        align-items: center; 
        gap: .5rem; 
        flex-wrap: wrap; 
    }
    .controls-mobile { 
        display: none; 
    }
    .input { 
        width: 18rem; 
    } 
    .select { 
        width: auto; 
    }
    .app-header { 
        backdrop-filter: blur(8px); 
    }
  }
</style>
  