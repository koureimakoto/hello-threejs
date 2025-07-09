import * as THREE from 'three';

export class SceneManager {
  public scene: THREE.Scene;

  constructor() {
    this.scene = new THREE.Scene();
  }

  public update(time: number): void {
    // No-op
  }

  public dispose(): void {
    this.scene.clear();
  }
}
