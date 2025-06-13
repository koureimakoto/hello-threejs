import * as THREE from 'three'

export class SceneManager {
  public scene: THREE.Scene
  private animatedObjects: Array<{ mesh: THREE.Object3D; update: (time: number) => void }> = []

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x151729)
  }

  public addAnimatedObject(mesh: THREE.Object3D, updateFn: (time: number) => void): void {
    this.animatedObjects.push({ mesh, update: updateFn })
    this.scene.add(mesh)
  }

  public update(time: number): void {
    this.animatedObjects.forEach(obj => obj.update(time))
  }

  public dispose(): void {
    this.scene.clear()
    this.animatedObjects.length = 0
  }
}