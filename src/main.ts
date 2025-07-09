import * as THREE from 'three';
import { PixelRenderer } from './rendering/PixelRenderer';
import { CameraController } from './core/CameraController';
import { createScene } from './scene/createScene';

const container = document.getElementById('app')!;

const scene = new THREE.Scene();
const pixelRenderer = new PixelRenderer(container);
const cameraController = new CameraController(pixelRenderer.camera, pixelRenderer.renderer.domElement);

createScene(scene);

// Setup resize handling
const handleResize = () => {
  pixelRenderer.handleResize();
  cameraController.handleResize();
};

window.addEventListener('resize', handleResize);
handleResize(); // Call once to set initial size correctly

const animate = () => {
  requestAnimationFrame(animate);

  cameraController.update();

  pixelRenderer.render(scene);
};

animate();
