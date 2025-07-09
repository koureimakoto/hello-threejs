import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Scene } from 'three';

export function loadGLBModel(scene: Scene, modelPath: string): void {
  const loader = new GLTFLoader();

  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;

      // Configure model properties
      model.scale.setScalar(0.5); // Adjust scale as needed
      model.position.set(0.5, 0, 0.5); // Position the model

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

      scene.add(model);
    },
    (progress) => {
      console.log(`Loading progress: ${(progress.loaded / progress.total) * 100}%`);
    },
    (error) => {
      console.error('Error loading GLB model:', error);
    }
  );
}
