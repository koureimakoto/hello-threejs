import * as THREE from "three"
import { WebGLRenderer, WebGLRenderTarget } from "three"
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"

export class RenderPixelatedPass extends Pass {
  private fsQuad: FullScreenQuad
  public resolution: THREE.Vector2
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

  public setResolution(resolution: THREE.Vector2): void {
    this.resolution = resolution;
    if (this.fsQuad.material instanceof THREE.ShaderMaterial) {
      this.fsQuad.material.uniforms.resolution.value.set(
        this.resolution.x,
        this.resolution.y,
        1 / this.resolution.x,
        1 / this.resolution.y
      );
    }
  }

  public setOutlineThickness(thickness: number): void {
    if (this.fsQuad.material instanceof THREE.ShaderMaterial) {
      this.fsQuad.material.uniforms.outlineThickness.value = thickness;
    }
  }

  public setOutlineColor(color: THREE.Color): void {
    if (this.fsQuad.material instanceof THREE.ShaderMaterial) {
      this.fsQuad.material.uniforms.outlineColor.value = color;
    }
  }

  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget): void {
    if (!this.scene) return

    renderer.setClearColor(0x000000, 0)
    renderer.setRenderTarget(this.rgbRenderTarget)
    renderer.clear()
    renderer.render(this.scene, this.camera)

    const overrideMaterial_old = this.scene.overrideMaterial
    renderer.setRenderTarget(this.normalRenderTarget)
    renderer.clear()
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
        angleThresholdInRadians: { value: THREE.MathUtils.degToRad(34) },
        outlineThickness: { value: 1.0 },
        outlineColor: { value: new THREE.Color(0x0d1123) },
        resolution: {
          value: new THREE.Vector4(
            this.resolution.x,
            this.resolution.y,
            1 / this.resolution.x,
            1 / this.resolution.y,
          )
        }
      },
      transparent: true,
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
        uniform float outlineThickness;
        uniform vec3 outlineColor;
        uniform float angleThresholdInRadians;
        varying vec2 vUv;

        float getDepth(int x, int y) {
          return texture2D(tDepth, vUv + vec2(x, y) * resolution.zw).r;
        }

        vec3 getNormal(int x, int y) {
          return texture2D(tNormal, vUv + vec2(x, y) * resolution.zw).rgb * 2.0 - 1.0;
        }

        float getAngleBetweenNormals(vec3 normal1, vec3 normal2) {
          float dotProduct = dot(normal1, normal2);
          dotProduct = clamp(dotProduct, -1.0, 1.0);
          return acos(dotProduct);
        }

        float neighborHardEdgeIndicator(int x, int y, vec3 normal, float angleThreshold) {
          vec3 neighborNormal = getNormal(x, y);
          float angle = getAngleBetweenNormals(normal, neighborNormal);
          return step(angleThreshold, angle);
        }

        // CORREÇÃO: Função para detectar outline EXTERNA
        float isOutlinePixel() {
          vec4 currentPixel = texture2D(tDiffuse, vUv);
          
          // CHAVE: Se o pixel atual é TRANSPARENTE, verifica se deve virar outline
          if (currentPixel.a < 0.01) {
            float radius = outlineThickness;
            
            // Verifica se há pixels OPACOS na vizinhança
            for (float x = -radius; x <= radius; x += 1.0) {
              for (float y = -radius; y <= radius; y += 1.0) {
                if (x == 0.0 && y == 0.0) continue;
                
                float distance = length(vec2(x, y));
                if (distance <= radius) {
                  vec2 offset = vec2(x, y);
                  vec4 neighborPixel = texture2D(tDiffuse, vUv + offset * resolution.zw);
                  
                  // Se encontrar um pixel opaco próximo, este pixel transparente vira outline
                  if (neighborPixel.a > 0.01) {
                    return 1.0;
                  }
                }
              }
            }
          }
          
          return 0.0;
        }

        float normalEdgeIndicator() {
          vec3 normal = getNormal(0, 0);
          float indicator = 0.0;
          
          indicator += neighborHardEdgeIndicator(0, -1, normal, angleThresholdInRadians);
          indicator += neighborHardEdgeIndicator(0, 1, normal, angleThresholdInRadians);
          indicator += neighborHardEdgeIndicator(-1, 0, normal, angleThresholdInRadians);
          indicator += neighborHardEdgeIndicator(1, 0, normal, angleThresholdInRadians);
          
          // Diagonais para outline mais espessa
          indicator += neighborHardEdgeIndicator(-1, -1, normal, angleThresholdInRadians) * 0.7;
          indicator += neighborHardEdgeIndicator(1, -1, normal, angleThresholdInRadians) * 0.7;
          indicator += neighborHardEdgeIndicator(-1, 1, normal, angleThresholdInRadians) * 0.7;
          indicator += neighborHardEdgeIndicator(1, 1, normal, angleThresholdInRadians) * 0.7;
          
          return smoothstep(0.4, 0.9, indicator);
        }

        float depthEdgeIndicator() {
          float depth = getDepth(0, 0);
          float diff = 0.0;
          
          diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
          diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
          diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
          diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
          
          // Diagonais para outline mais espessa
          diff += clamp(getDepth(1, 1) - depth, 0.0, 1.0) * 0.7;
          diff += clamp(getDepth(-1, 1) - depth, 0.0, 1.0) * 0.7;
          diff += clamp(getDepth(1, -1) - depth, 0.0, 1.0) * 0.7;
          diff += clamp(getDepth(-1, -1) - depth, 0.0, 1.0) * 0.7;
          
          return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;
        }

        float lum(vec4 color) {
          vec4 weights = vec4(.2126, .7152, .0722, .0);
          return dot(color, weights);
        }

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          float outlineStrength = isOutlinePixel();
          
          // Se é um pixel de outline (transparente que deve virar outline)
          if (outlineStrength > 0.0) {
            gl_FragColor = vec4(outlineColor, 1.0);
            return;
          }
          
          // Se o pixel é transparente e não é outline, mantém transparente
          if (texel.a < 0.01) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            return;
          }
          
          // Aplicar highlight nas bordas dos pixels opacos
          float normalEdgeCoefficient = .3;
          float depthEdgeCoefficient = .9;
          float dei = depthEdgeIndicator();
          float nei = normalEdgeIndicator();
          float coefficient = dei > 0.0 ? (1.0 - depthEdgeCoefficient * dei) : (1.0 + normalEdgeCoefficient * nei);
          
          gl_FragColor = vec4(texel.rgb * coefficient, texel.a);
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