<template>
  <Toolbar />
  <CryptoTable />
  <footer class="container app-footer">
    <span class="muted">Data auto-refresh: {{ store.pollingMs > 0 ? store.pollingMs/1000 + 's' : 'off' }}</span>
  </footer>
</template>

<script setup>
  import Toolbar from './components/Toolbar.vue'
  import CryptoTable from './components/CryptoTable.vue'
  import { useMarketStore } from './stores/market'
  const store = useMarketStore()
</script>

<style scoped>
  .app-footer { 
    padding:24px 16px; 
}
</style>