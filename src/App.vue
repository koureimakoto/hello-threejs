<template>
  <div id="app" ref="appContainer">
    
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ThreeJSApp } from './core/ThreeJSApp'

const appContainer = ref<HTMLElement>()
const pixelDensity = ref(6)
let threeApp: ThreeJSApp | null = null

const updatePixelDensity = (event: Event) => {
  const target = event.target as HTMLInputElement
  pixelDensity.value = parseFloat(target.value)
  if (threeApp) {
    threeApp.setPixelDensityFactor(pixelDensity.value)
  }
}

onMounted(() => {
  if (appContainer.value) {
    threeApp = new ThreeJSApp(appContainer.value)
    threeApp.start()
  }
})

onUnmounted(() => {
  if (threeApp) {
    threeApp.dispose()
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: red;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: transparent;
}
</style>