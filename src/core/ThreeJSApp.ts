import * as THREE from 'three';
import { PixelRenderer } from '../rendering/PixelRenderer';
import { CameraController } from './CameraController';
import { createScene, getSculptingAnimationController } from '../scene/createScene';

export class ThreeJSApp {
  private scene: THREE.Scene;
  private pixelRenderer: PixelRenderer;
  private cameraController: CameraController;
  private animationId: number | null = null;
  private clock: THREE.Clock;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.pixelRenderer = new PixelRenderer(container);
    this.cameraController = new CameraController(
      this.pixelRenderer.camera, 
      this.pixelRenderer.renderer.domElement
    );
    this.clock = new THREE.Clock();

    this.initializeScene();
    this.setupEventListeners();
  }

  private async initializeScene(): Promise<void> {
    await createScene(this.scene);
  }

  private setupEventListeners(): void {
    const handleResize = () => {
      this.pixelRenderer.handleResize();
      this.cameraController.handleResize();
    };

    window.addEventListener('resize', handleResize);
    handleResize();
  }

  public start(): void {
    this.animate();
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    const deltaTime = this.clock.getDelta();
    
    // Atualizar animações
    const animationController = getSculptingAnimationController();
    if (animationController) {
      animationController.update(deltaTime);
    }
    
    this.cameraController.update();
    this.pixelRenderer.render(this.scene);
  };

  public setPixelDensityFactor(factor: number): void {
    this.pixelRenderer.setPixelDensityFactor(factor);
  }

  // Método público para acessar o controller de animação
  public getAnimationController() {
    return getSculptingAnimationController();
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.pixelRenderer.dispose();
    this.cameraController.dispose();
    
    const animationController = getSculptingAnimationController();
    if (animationController) {
      animationController.dispose();
    }
  }
}