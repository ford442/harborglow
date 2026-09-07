import { Rng } from './Rng'
import type { InputLogEntry, ReplayFile } from './replay'
import { SIM_DT, type SimContext, createSimContext, setSim } from './SimContext'

export { SIM_DT }

const MAX_STEPS_PER_FRAME = 8
const MAX_FRAME_DT = 0.25

export type SimStepHandler = (sim: SimContext) => void
export type ReplayHandler = (entry: InputLogEntry, sim: SimContext) => void

export class FixedStepScheduler {
  private accumulator = 0
  private sim: SimContext
  private recording = false
  private replaying = false
  private inStep = false
  private log: InputLogEntry[] = []
  private replayQueue: InputLogEntry[] = []
  private replayIndex = 0
  private replayHandler: ReplayHandler | null = null
  private seed = 1

  constructor(seed = 1) {
    this.sim = createSimContext(seed)
    this.seed = seed
    setSim(this.sim)
  }

  reset(seed: number): void {
    this.seed = seed
    this.accumulator = 0
    this.sim = createSimContext(seed)
    this.recording = false
    this.replaying = false
    this.inStep = false
    this.log = []
    this.replayQueue = []
    this.replayIndex = 0
    this.replayHandler = null
    setSim(this.sim)
  }

  get context(): SimContext {
    return this.sim
  }

  get tick(): number {
    return this.sim.tick
  }

  get simTime(): number {
    return this.sim.simTime
  }

  get isRecording(): boolean {
    return this.recording
  }

  get isReplaying(): boolean {
    return this.replaying
  }

  get seedValue(): number {
    return this.seed
  }

  setInputHandler(handler: ReplayHandler | null): void {
    this.replayHandler = handler
  }

  /**
   * Consume wall/render delta, run zero or more fixed sim steps, then
   * expose leftover accumulator as `alpha` for interpolated rendering.
   * When `maxTick` is set, do not step past that host watermark.
   */
  advance(frameDelta: number, onStep: SimStepHandler, maxTick?: number): SimContext {
    const dt = Math.min(Math.max(frameDelta, 0), MAX_FRAME_DT)
    this.accumulator += dt
    let steps = 0
    this.inStep = true
    while (this.accumulator >= SIM_DT && steps < MAX_STEPS_PER_FRAME) {
      if (maxTick !== undefined && this.sim.tick >= maxTick) {
        break
      }
      this.accumulator -= SIM_DT
      this.runOneStep(onStep)
      steps++
    }
    this.inStep = false
    this.sim = {
      ...this.sim,
      alpha: this.accumulator / SIM_DT,
    }
    setSim(this.sim)
    return this.sim
  }

  /** Catch up to a host hello tick without the per-frame step cap. */
  fastForward(targetTick: number, onStep: SimStepHandler): void {
    this.inStep = true
    while (this.sim.tick < targetTick) {
      this.runOneStep(onStep)
    }
    this.inStep = false
    this.accumulator = 0
    this.sim = { ...this.sim, alpha: 0 }
    setSim(this.sim)
  }

  private runOneStep(onStep: SimStepHandler): void {
    this.sim = {
      rng: this.sim.rng,
      simTime: this.sim.simTime + SIM_DT,
      dt: SIM_DT,
      tick: this.sim.tick + 1,
      alpha: 0,
    }
    setSim(this.sim)
    this.dispatchReplayInputs()
    onStep(this.sim)
  }

  /**
   * Queue an input for the tick it belongs to. Applies immediately when
   * `entry.tick` is already in the past or present.
   */
  enqueueInput(entry: InputLogEntry): void {
    if (entry.tick <= this.sim.tick) {
      this.replayHandler?.(entry, this.sim)
      return
    }
    const rest = this.replayQueue.slice(this.replayIndex)
    rest.push(entry)
    rest.sort((a, b) => a.tick - b.tick)
    this.replayQueue = rest
    this.replayIndex = 0
  }

  record(action: string, payload: unknown = null): number | null {
    if (!this.recording || this.replaying) return null
    const tick = this.inStep ? this.sim.tick : this.sim.tick + 1
    this.log.push({ tick, action, payload })
    return tick
  }

  startRecording(): void {
    this.recording = true
    this.replaying = false
    this.log = []
  }

  snapshotReplay(): ReplayFile {
    return {
      version: 1,
      seed: this.seed,
      dt: SIM_DT,
      inputs: this.log.slice(),
    }
  }

  stopRecording(): ReplayFile {
    this.recording = false
    return this.snapshotReplay()
  }

  loadReplay(file: ReplayFile, handler: ReplayHandler): void {
    this.reset(file.seed)
    this.replaying = true
    this.recording = false
    this.replayQueue = file.inputs.slice().sort((a, b) => a.tick - b.tick)
    this.replayIndex = 0
    this.replayHandler = handler
  }

  private dispatchReplayInputs(): void {
    if (!this.replayHandler) return
    while (
      this.replayIndex < this.replayQueue.length &&
      this.replayQueue[this.replayIndex].tick <= this.sim.tick
    ) {
      this.replayHandler(this.replayQueue[this.replayIndex], this.sim)
      this.replayIndex++
    }
  }
}

export const simScheduler = new FixedStepScheduler(1)

export function cloneRng(rng: Rng): Rng {
  return Rng.fromState(rng.getState())
}
