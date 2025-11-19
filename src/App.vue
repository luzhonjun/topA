<template>
  <div id="app">
    <StockList />
  </div>
</template>

<script setup lang="ts">
import StockList from './components/StockList.vue'
</script>

<style>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>