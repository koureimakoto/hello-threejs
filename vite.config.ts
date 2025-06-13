import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000
  },
  assetsInclude: ['**/*.fbx', '**/*.png', '**/*.jpg', '**/*.jpeg']
})