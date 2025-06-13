import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RenderPixelatedPass } from './passes/RenderPixelatedPass'
import { PixelatePass } from './passes/PixelatePass'

export class PixelRenderer {
  public renderer: THREE.WebGLRenderer
  public camera: THREE.OrthographicCamera
  private composer: EffectComposer
  private screenResolution: THREE.Vector2
  private renderResolution: THREE.Vector2

  constructor(container: HTMLElement) {
    this.screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
    this.renderResolution = this.screenResolution.clone().divideScalar(6)
    this.renderResolution.x = Math.floor(this.renderResolution.x)
    this.renderResolution.y = Math.floor(this.renderResolution.y)

    this.setupRenderer(container)
    this.setupCamera()
    this.setupComposer()
  }

  private setupRenderer(container: HTMLElement): void {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      powerPreference: 'high-performance'
    })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setSize(this.screenResolution.x, this.screenResolution.y)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(this.renderer.domElement)
  }

  private setupCamera(): void {
    const aspectRatio = this.screenResolution.x / this.screenResolution.y
    this.camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, 0.1, 10)
    this.camera.position.set(0, 2 * Math.tan(Math.PI / 6), 2)
  }

  private setupComposer(): void {
    this.composer = new EffectComposer(this.renderer)
    
    // Pixelated render pass
    this.composer.addPass(new RenderPixelatedPass(this.renderResolution, null, this.camera))
    
    // Bloom effect
    const bloomPass = new UnrealBloomPass(this.screenResolution, 0.4, 0.1, 0.9)
    this.composer.addPass(bloomPass)
    
    // Final pixelation
    this.composer.addPass(new PixelatePass(this.renderResolution))
  }

  public render(scene: THREE.Scene): void {
    // Update the scene reference in the pixelated pass
    const pixelatedPass = this.composer.passes[0] as RenderPixelatedPass
    pixelatedPass.scene = scene
    
    this.composer.render()
  }

  public handleResize(): void {
    this.screenResolution.set(window.innerWidth, window.innerHeight)
    this.renderResolution = this.screenResolution.clone().divideScalar(6)
    this.renderResolution.x = Math.floor(this.renderResolution.x)
    this.renderResolution.y = Math.floor(this.renderResolution.y)

    this.renderer.setSize(this.screenResolution.x, this.screenResolution.y)
    this.composer.setSize(this.screenResolution.x, this.screenResolution.y)
  }

  public dispose(): void {
    this.renderer.dispose()
    this.composer.dispose()
  }
}