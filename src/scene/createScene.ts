import { createLighting } from './lighting';
import { loadGLBModel } from './loadGLBModel';
import { Scene } from 'three';

export function createScene(scene: Scene): void {
  // Add lighting
  createLighting(scene);

  // Add geometry with animations
  loadGLBModel(scene, '/src/assets/sculping20.glb');
}
