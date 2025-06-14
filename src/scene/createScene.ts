import { createLighting } from './lighting'
import { createGeometry } from './geometry'
import { SceneManager } from '../core/SceneManager'

export function createScene(sceneManager: SceneManager): void {
  // Add lighting
  createLighting(sceneManager.scene)
  
  // Add geometry with animations
  createGeometry(sceneManager)
}