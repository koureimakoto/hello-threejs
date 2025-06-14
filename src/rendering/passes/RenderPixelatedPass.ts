import * as THREE from "three"
import { WebGLRenderer, WebGLRenderTarget } from "three"
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"

export class RenderPixelatedPass extends Pass {
  private fsQuad: FullScreenQuad
  public resolution: THREE.Vector2 // Tornando a resolução pública para permitir atualização externa
  public scene: THREE.Scene | null
  private camera: THREE.Camera
  private rgbRenderTarget: WebGLRenderTarget
  private normalRenderTarget: WebGLRenderTarget
  private normalMaterial: THREE.Material

  constructor(resolution: THREE.Vector2, scene: THREE.Scene | null, camera: THREE.Camera) {
    super()
    this.resolution = resolution
    this.fsQuad = new FullScreenQuad(this.createMaterial())
    this.scene = scene
    this.camera = camera

    this.rgbRenderTarget = this.createPixelRenderTarget(resolution, THREE.RGBAFormat, true)
    this.normalRenderTarget = this.createPixelRenderTarget(resolution, THREE.RGBFormat, true)
    this.normalMaterial = new THREE.MeshNormalMaterial()
  }

  /**
   * Define a nova resolução para o passe de pixelização e atualiza os uniforms do shader.
   * @param resolution A nova resolução em pixels (largura, altura).
   */
  public setResolution(resolution: THREE.Vector2): void {
    this.resolution = resolution;
    // Atualiza o uniform 'resolution' no shader material para refletir a nova resolução
    if (this.fsQuad.material instanceof THREE.ShaderMaterial) {
      this.fsQuad.material.uniforms.resolution.value.set(
        this.resolution.x,
        this.resolution.y,
        1 / this.resolution.x,
        1 / this.resolution.y
      );
    }
  }

  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget): void {
    if (!this.scene) return

    renderer.setRenderTarget(this.rgbRenderTarget)
    renderer.render(this.scene, this.camera)

    const overrideMaterial_old = this.scene.overrideMaterial
    renderer.setRenderTarget(this.normalRenderTarget)
    this.scene.overrideMaterial = this.normalMaterial
    renderer.render(this.scene, this.camera)
    this.scene.overrideMaterial = overrideMaterial_old

    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms
    uniforms.tDiffuse.value = this.rgbRenderTarget.texture
    uniforms.tDepth.value = this.rgbRenderTarget.depthTexture
    uniforms.tNormal.value = this.normalRenderTarget.texture

    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
    } else {
      renderer.setRenderTarget(writeBuffer)
      if (this.clear) renderer.clear()
    }
    this.fsQuad.render(renderer)
  }

  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        tNormal: { value: null },
        angleThresholdInRadians: { value: THREE.MathUtils.degToRad(34) }, // Valor inicial de 10 graus convertido para radianos
        resolution: {
          value: new THREE.Vector4(
            this.resolution.x,
            this.resolution.y,
            1 / this.resolution.x,
            1 / this.resolution.y,
          )
        }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform sampler2D tNormal;
        uniform vec4 resolution;
        varying vec2 vUv;

        float getDepth(int x, int y) {
          return texture2D(tDepth, vUv + vec2(x, y) * resolution.zw).r;
        }

        vec3 getNormal(int x, int y) {
          return texture2D(tNormal, vUv + vec2(x, y) * resolution.zw).rgb * 2.0 - 1.0;
        }

        float getAngleBetweenNormals(vec3 normal1, vec3 normal2) {
          float dotProduct = dot(normal1, normal2);
          dotProduct = clamp(dotProduct, -1.0, 1.0); // Clamp para segurança
          return acos(dotProduct); // Retorna o ângulo em radianos
        }

        float neighborHardEdgeIndicator(int x, int y, vec3 normal, float angleThreshold) {
 vec3 neighborNormal = getNormal(x, y);
 float angle = getAngleBetweenNormals(normal, neighborNormal);
 return step(angleThreshold, angle); // Retorna 1.0 se o ângulo for maior que o limite (aresta dura)
        }

        uniform float angleThresholdInRadians;

        float normalEdgeIndicator() {
          float depth = getDepth(0, 0); // A profundidade ainda é usada no neighborHardEdgeIndicator original, mas aqui a removemos
          vec3 normal = getNormal(0, 0);
          float indicator = 0.0;
 indicator += neighborHardEdgeIndicator(0, -1, normal, angleThresholdInRadians);
 indicator += neighborHardEdgeIndicator(0, 1, normal, angleThresholdInRadians);
 indicator += neighborHardEdgeIndicator(-1, 0, normal, angleThresholdInRadians);
 indicator += neighborHardEdgeIndicator(1, 0, normal, angleThresholdInRadians);
 // Use smoothstep para uma transição suave do indicador de borda de normal
          // Ajuste os limites (0.0, 0.5) conforme necessário para a suavidade
          return smoothstep(0.4, 0.9, indicator);
        }

        float depthEdgeIndicator() {
          float depth = getDepth(0, 0);
          float diff = 0.0;
          diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
          diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
          diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
          diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
          return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;
        }


        float lum(vec4 color) {
          vec4 weights = vec4(.2126, .7152, .0722, .0);
          return dot(color, weights);
        }

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          float normalEdgeCoefficient = .3;
          float depthEdgeCoefficient = .4;
          float dei = depthEdgeIndicator();
          float nei = normalEdgeIndicator();
          float coefficient = dei > 0.0 ? (1.0 - depthEdgeCoefficient * dei) : (1.0 + normalEdgeCoefficient * nei);
          gl_FragColor = texel * coefficient;
        }
      `
    })
  }

  private createPixelRenderTarget(resolution: THREE.Vector2, pixelFormat: THREE.PixelFormat, depthTexture: boolean): WebGLRenderTarget {
    const renderTarget = new WebGLRenderTarget(
      resolution.x, resolution.y,
      !depthTexture ? undefined : {
        depthTexture: new THREE.DepthTexture(resolution.x, resolution.y),
        depthBuffer: true
      }
    )
    renderTarget.texture.format = pixelFormat
    renderTarget.texture.minFilter = THREE.NearestFilter
    renderTarget.texture.magFilter = THREE.NearestFilter
    renderTarget.texture.generateMipmaps = false
    renderTarget.stencilBuffer = false
    return renderTarget
  }
}