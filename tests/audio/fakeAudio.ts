/** A stand-in for the browser's Web Audio, just enough to run the sound engine in node. */

/** An AudioParam that keeps the last value it was given. */
export class FakeParam {
  constructor(private readonly ctx: FakeAudioContext, public value: number) {}
  setValueAtTime(value: number): this {
    return this.set('setValueAtTime', value)
  }
  linearRampToValueAtTime(value: number): this {
    return this.set('linearRampToValueAtTime', value)
  }
  exponentialRampToValueAtTime(value: number): this {
    return this.set('exponentialRampToValueAtTime', value)
  }
  setTargetAtTime(value: number): this {
    return this.set('setTargetAtTime', value)
  }
  cancelScheduledValues(): this {
    this.ctx.check('cancelScheduledValues')
    return this
  }
  private set(method: string, value: number): this {
    this.ctx.check(method)
    this.value = value
    return this
  }
}

/** Any node: every node has every param and field the engine sets, which keeps the fake small. */
export class FakeNode {
  readonly gain: FakeParam
  readonly frequency: FakeParam
  readonly detune: FakeParam
  readonly Q: FakeParam
  readonly playbackRate: FakeParam
  readonly delayTime: FakeParam
  type = ''
  loop = false
  buffer: FakeBuffer | null = null
  startedAt: number | null = null
  stoppedAt: number | null = null

  constructor(readonly context: FakeAudioContext, readonly kind: string) {
    this.gain = new FakeParam(context, 1)
    this.frequency = new FakeParam(context, 440)
    this.detune = new FakeParam(context, 0)
    this.Q = new FakeParam(context, 1)
    this.playbackRate = new FakeParam(context, 1)
    this.delayTime = new FakeParam(context, 0)
    context.nodes.push(this)
  }
  connect<T>(target: T): T {
    this.context.check('connect')
    return target
  }
  disconnect(): void {}
  start(at = 0): void {
    this.context.check('start')
    this.startedAt = at
  }
  stop(at = 0): void {
    this.context.check('stop')
    this.stoppedAt = at
  }
}

export class FakeBuffer {
  private readonly channels: Float32Array[]
  constructor(count: number, readonly length: number, readonly sampleRate: number) {
    this.channels = Array.from({ length: count }, () => new Float32Array(length))
  }
  getChannelData(channel: number): Float32Array {
    return this.channels[channel]
  }
}

/**
 * An AudioContext that starts suspended, as on iOS. Its state changes fire 'statechange' at once.
 * Name a method in `failing` (the context's, a node's or a param's) to make every call to it throw.
 */
export class FakeAudioContext extends EventTarget {
  state = 'suspended'
  currentTime = 0
  readonly sampleRate = 48000
  readonly nodes: FakeNode[] = []
  readonly destination = new FakeNode(this, 'destination')
  readonly failing = new Set<string>()
  /** Like a browser that resumes only inside a gesture: resume() rejects and nothing changes. */
  refuseResume = false

  check(method: string): void {
    if (this.failing.has(method)) throw new Error(`fake ${method} failed`)
  }

  /** Moves to `state` as the browser would, firing 'statechange' when it changes; 'interrupted' is iOS's call or Siri. */
  changeState(state: string): void {
    if (this.state === state) return
    this.state = state
    this.dispatchEvent(new Event('statechange'))
  }

  resume(): Promise<void> {
    this.check('resume')
    if (this.refuseResume || this.state === 'closed') return Promise.reject(new Error('resume refused'))
    this.changeState('running')
    return Promise.resolve()
  }
  suspend(): Promise<void> {
    this.check('suspend')
    if (this.state !== 'closed') this.changeState('suspended')
    return Promise.resolve()
  }
  close(): Promise<void> {
    this.check('close')
    this.changeState('closed')
    return Promise.resolve()
  }

  createGain(): FakeNode {
    return this.make('createGain', 'gain')
  }
  createOscillator(): FakeNode {
    return this.make('createOscillator', 'oscillator')
  }
  createBufferSource(): FakeNode {
    return this.make('createBufferSource', 'bufferSource')
  }
  createBiquadFilter(): FakeNode {
    return this.make('createBiquadFilter', 'biquadFilter')
  }
  createDelay(): FakeNode {
    return this.make('createDelay', 'delay')
  }
  createBuffer(channels: number, length: number, sampleRate: number): FakeBuffer {
    this.check('createBuffer')
    return new FakeBuffer(channels, length, sampleRate)
  }

  private make(method: string, kind: string): FakeNode {
    this.check(method)
    return new FakeNode(this, kind)
  }
}
