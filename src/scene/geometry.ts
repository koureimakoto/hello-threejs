import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { SceneManager } from '../core/SceneManager'

export function createGeometry(sceneManager: SceneManager): void {
  const gltfLoader = new GLTFLoader()

  console.log("TESTE:", sceneManager.scene.getObjectByName("Sculping14")?.isObject3D)
  // Load the initial GLB model
  loadGLBModel(gltfLoader, sceneManager, '/src/assets/sculping14.glb')

}
export function loadGLBModel(loader: GLTFLoader, sceneManager: SceneManager, modelPath: string): void {
  loader.load(
 modelPath,
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

          if (!child.material) {
            console.error("Erro: Objeto de malha sem material encontrado!", child);
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