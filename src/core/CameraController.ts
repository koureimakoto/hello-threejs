import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export class CameraController {
  public controls: OrbitControls

  constructor(
    private camera: THREE.Camera,
    private domElement: HTMLElement
  ) {
    this.controls = new OrbitControls(camera, this.domElement)
    this.setupControls()
  }

  private setupControls(): void {
    this.controls.target.set(0, 0, 0)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.screenSpacePanning = false
    this.controls.minDistance = 1
    this.controls.maxDistance = 10
    this.controls.maxPolarAngle = Math.PI / 2
  }

  public update(): void {
    this.controls.update()
  }

  public handleResize(): void {
    const aspectRatio = window.innerWidth / window.innerHeight
    if (this.camera instanceof THREE.OrthographicCamera) {
      this.camera.left = -aspectRatio
      this.camera.right = aspectRatio
      this.camera.top = 1
      this.camera.bottom = -1
      this.camera.updateProjectionMatrix()
    }
  }

  public dispose(): void {
    this.controls.dispose()
  }
}