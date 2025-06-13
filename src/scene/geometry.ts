import * as THREE from 'three'
import { SceneManager } from '../core/SceneManager'
import { createPixelTexture } from '../utils/textureUtils'
import { stopGoEased } from '../utils/mathUtils'

export function createGeometry(sceneManager: SceneManager): void {
  const textureLoader = new THREE.TextureLoader()
  
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