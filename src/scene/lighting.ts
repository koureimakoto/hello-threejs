import * as THREE from 'three'

export function createLighting(scene: THREE.Scene): void {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x2d3645, 1.5)
  scene.add(ambientLight)

  // Directional light
  const directionalLight = new THREE.DirectionalLight(0xfffc9c, 1)
  directionalLight.position.set(100, 100, 100)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(2048, 2048)
  directionalLight.shadow.camera.near = 0.1
  directionalLight.shadow.camera.far = 500
  directionalLight.shadow.camera.left = -50
  directionalLight.shadow.camera.right = 50
  directionalLight.shadow.camera.top = 50
  directionalLight.shadow.camera.bottom = -50
  scene.add(directionalLight)

  // Spot light
  const spotLight = new THREE.SpotLight(0xff8800, 1, 10, Math.PI / 16, 0.02, 2)
  spotLight.position.set(2, 2, 0)
  spotLight.target.position.set(0, 0, 0)
  spotLight.castShadow = true
  scene.add(spotLight)
  scene.add(spotLight.target)
}