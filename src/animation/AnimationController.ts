import * as THREE from 'three';

export interface AnimationConfig {
  loop?: THREE.AnimationActionLoopStyles;
  clampWhenFinished?: boolean;
  weight?: number;
  timeScale?: number;
}

export class AnimationController {
  private mixer: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private model: THREE.Group;

  constructor(model: THREE.Group, animations: THREE.AnimationClip[]) {
    this.model = model;
    this.mixer = new THREE.AnimationMixer(model);
    
    // Criar actions para todas as animações
    animations.forEach((clip) => {
      const action = this.mixer.clipAction(clip);
      this.actions.set(clip.name, action);
    });
  }

  /**
   * Reproduz uma animação específica
   */
  public play(animationName: string, config?: AnimationConfig): boolean {
    const action = this.actions.get(animationName);
    if (!action) {
      console.warn(`Animation "${animationName}" not found`);
      return false;
    }

    // Configurar a action
    if (config) {
      if (config.loop !== undefined) action.setLoop(config.loop, Infinity);
      if (config.clampWhenFinished !== undefined) action.clampWhenFinished = config.clampWhenFinished;
      if (config.weight !== undefined) action.setEffectiveWeight(config.weight);
      if (config.timeScale !== undefined) action.setEffectiveTimeScale(config.timeScale);
    }

    action.reset().play();
    this.currentAction = action;
    return true;
  }

  /**
   * Para uma animação específica
   */
  public stop(animationName: string): boolean {
    const action = this.actions.get(animationName);
    if (!action) {
      console.warn(`Animation "${animationName}" not found`);
      return false;
    }

    action.stop();
    if (this.currentAction === action) {
      this.currentAction = null;
    }
    return true;
  }

  /**
   * Pausa a animação atual
   */
  public pause(): void {
    if (this.currentAction) {
      this.currentAction.paused = true;
    }
  }

  /**
   * Resume a animação atual
   */
  public resume(): void {
    if (this.currentAction) {
      this.currentAction.paused = false;
    }
  }

  /**
   * Transição suave entre animações com blending
   */
  public crossFade(
    fromAnimationName: string, 
    toAnimationName: string, 
    duration: number = 0.5,
    config?: AnimationConfig
  ): boolean {
    const fromAction = this.actions.get(fromAnimationName);
    const toAction = this.actions.get(toAnimationName);

    if (!fromAction || !toAction) {
      console.warn(`Animation not found: from="${fromAnimationName}" to="${toAnimationName}"`);
      return false;
    }

    // Configurar a nova animação
    if (config) {
      if (config.loop !== undefined) toAction.setLoop(config.loop, Infinity);
      if (config.clampWhenFinished !== undefined) toAction.clampWhenFinished = config.clampWhenFinished;
      if (config.weight !== undefined) toAction.setEffectiveWeight(config.weight);
      if (config.timeScale !== undefined) toAction.setEffectiveTimeScale(config.timeScale);
    }

    // Executar crossfade
    toAction.reset().play();
    fromAction.crossFadeTo(toAction, duration, true);
    
    this.currentAction = toAction;
    return true;
  }

  /**
   * Obtém todas as animações disponíveis
   */
  public getAvailableAnimations(): string[] {
    return Array.from(this.actions.keys());
  }

  /**
   * Obtém a animação atual
   */
  public getCurrentAnimation(): string | null {
    if (!this.currentAction) return null;
    
    for (const [name, action] of this.actions) {
      if (action === this.currentAction) {
        return name;
      }
    }
    return null;
  }

  /**
   * Verifica se uma animação está rodando
   */
  public isPlaying(animationName?: string): boolean {
    if (animationName) {
      const action = this.actions.get(animationName);
      return action ? action.isRunning() : false;
    }
    return this.currentAction ? this.currentAction.isRunning() : false;
  }

  /**
   * Define o peso de uma animação específica
   */
  public setWeight(animationName: string, weight: number): boolean {
    const action = this.actions.get(animationName);
    if (!action) {
      console.warn(`Animation "${animationName}" not found`);
      return false;
    }
    
    action.setEffectiveWeight(weight);
    return true;
  }

  /**
   * Define a velocidade de uma animação específica
   */
  public setTimeScale(animationName: string, timeScale: number): boolean {
    const action = this.actions.get(animationName);
    if (!action) {
      console.warn(`Animation "${animationName}" not found`);
      return false;
    }
    
    action.setEffectiveTimeScale(timeScale);
    return true;
  }

  /**
   * Atualiza o mixer (deve ser chamado no loop de animação)
   */
  public update(deltaTime: number): void {
    this.mixer.update(deltaTime);
  }

  /**
   * Para todas as animações
   */
  public stopAll(): void {
    this.actions.forEach(action => action.stop());
    this.currentAction = null;
  }

  /**
   * Limpa recursos
   */
  public dispose(): void {
    this.mixer.stopAllAction();
    this.actions.clear();
    this.currentAction = null;
  }
}