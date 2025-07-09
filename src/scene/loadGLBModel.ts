import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Scene } from 'three';
import { AnimationController } from '../animation/AnimationController';

export interface GLBModelInstance {
  model: THREE.Group;
  animationController: AnimationController | null;
}

export function loadGLBModel(scene: Scene, modelPath: string): Promise<GLBModelInstance> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        // Configure model properties
        model.scale.setScalar(0.5);
        model.position.set(0.5, 0, 0.5);

        // Enable shadows for all meshes in the model
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (!child.material) {
              console.error('Erro: Objeto de malha sem material encontrado!', child);
            }
          }
        });

        // Criar controller de animação se houver animações
        let animationController: AnimationController | null = null;
        if (gltf.animations && gltf.animations.length > 0) {
          animationController = new AnimationController(model, gltf.animations);
          
          console.log('Animações disponíveis:', animationController.getAvailableAnimations());
          
          // Opcional: iniciar a primeira animação automaticamente
          const firstAnimation = animationController.getAvailableAnimations()[0];
          if (firstAnimation) {
            animationController.play(firstAnimation, {
              loop: THREE.LoopRepeat
            });
          }
        }

        scene.add(model);
        
        resolve({
          model,
          animationController
        });
      },
      (progress) => {
        console.log(`Loading progress: ${(progress.loaded / progress.total) * 100}%`);
      },
      (error) => {
        console.error('Error loading GLB model:', error);
        reject(error);
      }
    );
  });
}