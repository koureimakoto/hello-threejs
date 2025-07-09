import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.png', '**/*.jpg', '**/*.jpeg']
})