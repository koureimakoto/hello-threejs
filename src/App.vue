<template>
  <div id="app" ref="appContainer">
    <!-- Controles de animação -->
    <div class="animation-controls" v-if="availableAnimations.length > 0">
      <h3>Animações</h3>
      <div class="animation-buttons">
        <button 
          v-for="animation in availableAnimations" 
          :key="animation"
          @click="playAnimation(animation)"
          :class="{ active: currentAnimation === animation }"
        >
          {{ animation }}
        </button>
      </div>
      
      <div class="crossfade-controls">
        <label>
          Duração da transição:
          <input 
            type="range" 
            min="0.1" 
            max="2" 
            step="0.1" 
            v-model="crossfadeDuration"
          />
          {{ crossfadeDuration }}s
        </label>
      </div>
      
      <div class="playback-controls">
        <button @click="pauseAnimation">Pausar</button>
        <button @click="resumeAnimation">Continuar</button>
        <button @click="stopAllAnimations">Parar Todas</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ThreeJSApp } from './core/ThreeJSApp'

const appContainer = ref<HTMLElement>()
const availableAnimations = ref<string[]>([])
const currentAnimation = ref<string | null>(null)
const crossfadeDuration = ref(0.5)

let threeApp: ThreeJSApp | null = null

const playAnimation = (animationName: string) => {
  const controller = threeApp?.getAnimationController()
  if (!controller) return

  const current = controller.getCurrentAnimation()
  
  if (current && current !== animationName) {
    // Fazer crossfade se já houver uma animação rodando
    controller.crossFade(current, animationName, crossfadeDuration.value, {
      loop: THREE.LoopRepeat
    })
  } else {
    // Reproduzir diretamente se não houver animação atual
    controller.play(animationName, {
      loop: THREE.LoopRepeat
    })
  }
  
  currentAnimation.value = animationName
}

const pauseAnimation = () => {
  const controller = threeApp?.getAnimationController()
  if (controller) {
    controller.pause()
  }
}

const resumeAnimation = () => {
  const controller = threeApp?.getAnimationController()
  if (controller) {
    controller.resume()
  }
}

const stopAllAnimations = () => {
  const controller = threeApp?.getAnimationController()
  if (controller) {
    controller.stopAll()
    currentAnimation.value = null
  }
}

const updateAnimationList = () => {
  const controller = threeApp?.getAnimationController()
  if (controller) {
    availableAnimations.value = controller.getAvailableAnimations()
    currentAnimation.value = controller.getCurrentAnimation()
  }
}

onMounted(async () => {
  if (appContainer.value) {
    threeApp = new ThreeJSApp(appContainer.value)
    threeApp.start()
    
    // Aguardar um pouco para o modelo carregar
    setTimeout(() => {
      updateAnimationList()
    }, 1000)
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

.animation-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  color: white;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 250px;
}

.animation-controls h3 {
  margin-bottom: 12px;
  color: #64b5f6;
}

.animation-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.animation-buttons button {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.animation-buttons button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.animation-buttons button.active {
  background: #64b5f6;
  border-color: #64b5f6;
}

.crossfade-controls {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.crossfade-controls label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.crossfade-controls input[type="range"] {
  width: 100%;
}

.playback-controls {
  display: flex;
  gap: 8px;
}

.playback-controls button {
  flex: 1;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.playback-controls button:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>