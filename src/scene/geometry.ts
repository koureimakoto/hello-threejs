import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { SceneManager } from '../core/SceneManager'
import { createPixelTexture } from '../utils/textureUtils'
import { stopGoEased } from '../utils/mathUtils'

export function createGeometry(sceneManager: SceneManager): void {
  const textureLoader = new THREE.TextureLoader()
  const gltfLoader = new GLTFLoader()
  
  // Create textures
  const checkerTexture = createPixelTexture(
    textureLoader.load("https://threejsfundamentals.org/threejs/resources/images/checker.png")
  )
  checkerTexture.repeat.set(3, 3)
  
  const checkerTexture2 = createPixelTexture(
    textureLoader.load("https://threejsfundamentals.org/threejs/resources/images/checker.png")
  )
  checkerTexture2.repeat.set(1.5, 1.5)

  // Create ground plane
  createGroundPlane(sceneManager.scene, checkerTexture)
  
  // Create boxes
  createBoxes(sceneManager.scene, checkerTexture2)
  
  // Create animated crystal
  createAnimatedCrystal(sceneManager)
  
  // Load and add GLB model
  loadGLBModel(gltfLoader, sceneManager)
}

function createGroundPlane(scene: THREE.Scene, texture: THREE.Texture): void {
  const planeSideLength = 2
  const planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(planeSideLength, planeSideLength),
    new THREE.MeshPhongMaterial({ map: texture })
  )
  planeMesh.receiveShadow = true
  planeMesh.rotation.x = -Math.PI / 2
  scene.add(planeMesh)
}

function createBoxes(scene: THREE.Scene, texture: THREE.Texture): void {
  const boxMaterial = new THREE.MeshPhongMaterial({ map: texture })
  
  function addBox(size: number, x: number, z: number, rotation: number): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), boxMaterial)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.rotation.y = rotation
    mesh.position.set(x, size / 2 + 0.0001, z)
    scene.add(mesh)
    return mesh
  }
  
  addBox(0.4, 0, 0, Math.PI / 4)
  addBox(0.2, -0.4, -0.15, Math.PI / 4)
}

function createAnimatedCrystal(sceneManager: SceneManager): void {
  const radius = 0.2
  const geometry = new THREE.IcosahedronGeometry(radius)
  const material = new THREE.MeshPhongMaterial({
    color: 0x2379cf,
    emissive: 0x143542,
    shininess: 100,
    specular: 0xffffff,
  })
  
  const crystalMesh = new THREE.Mesh(geometry, material)
  crystalMesh.receiveShadow = true
  crystalMesh.castShadow = true
  
  // Add animated crystal with update function
  sceneManager.addAnimatedObject(crystalMesh, (time: number) => {
    const mat = material as THREE.MeshPhongMaterial
    mat.emissiveIntensity = Math.sin(time * 3) * 0.5 + 0.5
    crystalMesh.position.y = 0.7 + Math.sin(time * 2) * 0.05
    crystalMesh.rotation.y = stopGoEased(time, 2, 4) * 2 * Math.PI
  })
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