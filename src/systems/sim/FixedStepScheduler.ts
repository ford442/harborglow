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
    this.log = []
    this.replayQueue = []
    this.replayIndex = 0
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

  /**
   * Consume wall/render delta, run zero or more fixed sim steps, then
   * expose leftover accumulator as `alpha` for interpolated rendering.
   */
  advance(frameDelta: number, onStep: SimStepHandler): SimContext {
    const dt = Math.min(Math.max(frameDelta, 0), MAX_FRAME_DT)
    this.accumulator += dt
    let steps = 0
    while (this.accumulator >= SIM_DT && steps < MAX_STEPS_PER_FRAME) {
      this.accumulator -= SIM_DT
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
      steps++
    }
    this.sim = {
      ...this.sim,
      alpha: this.accumulator / SIM_DT,
    }
    setSim(this.sim)
    return this.sim
  }

  record(action: string, payload: unknown = null): void {
    if (!this.recording || this.replaying) return
    this.log.push({ tick: this.sim.tick, action, payload })
  }

  startRecording(): void {
    this.recording = true
    this.replaying = false
    this.log = []
  }

  stopRecording(): ReplayFile {
    this.recording = false
    return {
      version: 1,
      seed: this.seed,
      dt: SIM_DT,
      inputs: this.log.slice(),
    }
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
    if (!this.replaying || !this.replayHandler) return
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
