import { createLighting } from './lighting';
import { loadGLBModel, GLBModelInstance } from './loadGLBModel';
import { Scene } from 'three';

// Variável global para acessar o modelo e suas animações
export let sculptingModel: GLBModelInstance | null = null;

export async function createScene(scene: Scene): Promise<void> {
  // Add lighting
  createLighting(scene);

  // Load model with animations
  try {
    sculptingModel = await loadGLBModel(scene, '/src/assets/sculping.glb');
    console.log('Modelo carregado com sucesso!');
    
    if (sculptingModel.animationController) {
      console.log('Controller de animação criado!');
    }
  } catch (error) {
    console.error('Erro ao carregar modelo:', error);
  }
}

// Função helper para acessar o controller de animação externamente
export function getSculptingAnimationController() {
  return sculptingModel?.animationController || null;
}