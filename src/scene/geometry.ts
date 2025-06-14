import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { SceneManager } from '../core/SceneManager'
import { createPixelTexture } from '../utils/textureUtils'
import { stopGoEased } from '../utils/mathUtils'

export function createGeometry(sceneManager: SceneManager): void {
  const gltfLoader = new GLTFLoader()
  
  // Load and add GLB model
  loadGLBModel(gltfLoader, sceneManager)
}

function loadGLBModel(loader: GLTFLoader, sceneManager: SceneManager): void {
  loader.load(
    '/src/assets/sculping14.glb',
    (gltf) => {
      const model = gltf.scene
      
      // Configure model properties
      model.scale.setScalar(0.5) // Adjust scale as needed
      model.position.set(0.5, 0, 0.5) // Position the model
      
      // Enable shadows for all meshes in the model
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          // Apply pixel-style material properties if needed
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.roughness = 0.8
            child.material.metalness = 0.2
          }
        }
      })
      
      // Add model with optional animation
      sceneManager.addAnimatedObject(model, (time: number) => {
        // Optional: Add subtle rotation animation
        model.rotation.y = Math.sin(time * 0.5) * 0.1
      })
    },
    (progress) => {
      console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%')
    },
    (error) => {
      console.error('Error loading GLB model:', error)
    }
  )
}