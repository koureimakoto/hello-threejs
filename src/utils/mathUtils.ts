export function easeInOutCubic(x: number): number {
  return x ** 2 * 3 - x ** 3 * 2
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x))
}

export function linearStep(x: number, edge0: number, edge1: number): number {
  const w = edge1 - edge0
  const m = 1 / w
  const y0 = -m * edge0
  return clamp(y0 + m * x, 0, 1)
}

export function stopGo(x: number, downtime: number, period: number): number {
  const cycle = Math.floor(x / period)
  const tween = x - cycle * period
  const linStep = linearStep(tween, downtime, period)
  return cycle + linStep
}

export function stopGoEased(x: number, downtime: number, period: number): number {
  const cycle = Math.floor(x / period)
  const tween = x - cycle * period
  const linStep = easeInOutCubic(linearStep(tween, downtime, period))
  return cycle + linStep
}