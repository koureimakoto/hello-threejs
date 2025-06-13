import { SceneManager } from './core/SceneManager'
import { PixelRenderer } from './rendering/PixelRenderer'
import { CameraController } from './core/CameraController'
import { createScene } from './scene/createScene'

class App {
  private sceneManager: SceneManager
  private pixelRenderer: PixelRenderer
  private cameraController: CameraController
  private animationId: number = 0

  constructor() {
    this.init()
  }

  private init(): void {
    const container = document.getElementById('app')!
    
    // Initialize core systems
    this.sceneManager = new SceneManager()
    this.pixelRenderer = new PixelRenderer(container)
    this.cameraController = new CameraController(
      this.pixelRenderer.camera,
      this.pixelRenderer.renderer.domElement
    )

    // Create the scene
    createScene(this.sceneManager)

    // Setup resize handling
    this.handleResize()
    window.addEventListener('resize', () => this.handleResize())

    // Start animation loop
    this.animate()
  }

  private handleResize(): void {
    this.pixelRenderer.handleResize()
    this.cameraController.handleResize()
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)
    
    const time = performance.now() / 1000
    
    // Update scene animations
    this.sceneManager.update(time)
    
    // Update camera controls
    this.cameraController.update()
    
    // Render the scene
    this.pixelRenderer.render(this.sceneManager.scene)
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.pixelRenderer.dispose()
    this.cameraController.dispose()
    window.removeEventListener('resize', () => this.handleResize())
  }
}

// Initialize the application
new App()