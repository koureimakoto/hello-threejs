import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RenderPixelatedPass } from './passes/RenderPixelatedPass'
import { PixelatePass } from './passes/PixelatePass'

export class PixelRenderer {
  // A propriedade 'renderer' é inicializada no método setupRenderer, que é chamado
  // no construtor. O modificador de asserção de atribuição definitiva (!) é usado
  // para dizer ao TypeScript que esta propriedade será definitivamente atribuída.
  public renderer!: THREE.WebGLRenderer
  // A propriedade 'camera' é inicializada no método setupCamera, que é chamado
  // no construtor. O modificador de asserção de atribuição definitiva (!) é usado
  // para dizer ao TypeScript que esta propriedade será definitivamente atribuída.
  public camera!: THREE.OrthographicCamera
  private composer!: EffectComposer
  private screenResolution: THREE.Vector2
  private renderResolution: THREE.Vector2

  constructor(container: HTMLElement) {
    this.screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
    // A densidade de pixel na tela é controlada por esta linha.
    // `divideScalar(6)` significa que a resolução de renderização será 1/6 da resolução da tela.
    // Um fator menor (ex: 3) resultará em pixels maiores (menor densidade).
    // Um fator maior (ex: 12) resultará em pixels menores (maior densidade).
    this.renderResolution = this.screenResolution.clone().divideScalar(4)
    this.renderResolution.x = Math.floor(this.renderResolution.x)
    this.renderResolution.y = Math.floor(this.renderResolution.y)

    this.setupRenderer(container)
    this.setupCamera()
    this.setupComposer()
  }

  private setupRenderer(container: HTMLElement): void {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance'
    })
    // Configurar transparência no renderer
    this.renderer.setClearColor(0x000000, 0) // Alpha 0 para transparência
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setSize(this.screenResolution.x, this.screenResolution.y)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(this.renderer.domElement)
  }

  private setupCamera(): void {
    const aspectRatio = this.screenResolution.x / this.screenResolution.y
    this.camera = new THREE.OrthographicCamera(-aspectRatio, aspectRatio, 1, -1, 0.1, 10)
    this.camera.position.set(0, 2 * Math.tan(Math.PI / 6), 2)
  }

  private setupComposer(): void {
    // Criar render target com transparência
    const renderTarget = new THREE.WebGLRenderTarget(
      this.screenResolution.x, 
      this.screenResolution.y,
      {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        generateMipmaps: false,
        stencilBuffer: false
      }
    )

    this.composer = new EffectComposer(this.renderer, renderTarget)
    
    // Pixelated render pass
    this.composer.addPass(new RenderPixelatedPass(this.renderResolution, null, this.camera))
    
    // Bloom effect com configurações mais suaves para preservar transparência
    const bloomPass = new UnrealBloomPass(this.screenResolution, 0.3, 0.1, 0.8)
    this.composer.addPass(bloomPass)
    
    // Final pixelation
    const pixelatePass = new PixelatePass(this.renderResolution)
    pixelatePass.renderToScreen = true
    this.composer.addPass(pixelatePass)
  }

  public render(scene: THREE.Scene): void {
    // Update the scene reference in the pixelated pass
    const pixelatedPass = this.composer.passes[0] as RenderPixelatedPass
    pixelatedPass.scene = scene
    
    // Limpar com transparência
    this.renderer.setClearColor(0x000000, 0)
    this.composer.render()
  }

  public handleResize(): void {
    this.screenResolution.set(window.innerWidth, window.innerHeight)
    // Ao redimensionar a janela, a resolução de renderização é recalculada
    // para manter a mesma densidade de pixel relativa à tela.
    // Modificar o fator `6` aqui também afeta a densidade de pixel no redimensionamento.
    // Para ter uma densidade de pixel constante independente da tela, você precisaria
    // de uma lógica de cálculo de renderResolution diferente.
    this.renderResolution = this.screenResolution.clone().divideScalar(6)
    this.renderResolution.x = Math.floor(this.renderResolution.x)
    this.renderResolution.y = Math.floor(this.renderResolution.y)

    this.renderer.setSize(this.screenResolution.x, this.screenResolution.y)
    this.composer.setSize(this.screenResolution.x, this.screenResolution.y)
  }

  /**
   * Define o fator de densidade de pixel. Um fator menor resulta em pixels maiores,
   * um fator maior resulta em pixels menores.
   * @param factor O fator pelo qual a resolução da tela é dividida para obter a resolução de renderização.
   *
   * Para usar com um slider HTML (input type="range"):
   * No seu código JavaScript/TypeScript principal, obtenha a instância de PixelRenderer
   * e adicione um event listener ao slider. No listener, chame:
   * pixelRendererInstance.setPixelDensityFactor(parseFloat(slider.value));
   */
  public setPixelDensityFactor(factor: number): void {
    this.renderResolution = this.screenResolution.clone().divideScalar(factor);
    this.handleResize(); // Recalcula e aplica a nova resolução
  }
  public dispose(): void {
    this.renderer.dispose()
    this.composer.dispose()
  }
}