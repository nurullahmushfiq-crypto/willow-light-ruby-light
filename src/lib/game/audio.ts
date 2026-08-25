type Bus = { master: GainNode; sfx: GainNode; music: GainNode };

export type GameAudio = {
  unlock: () => void;
  setMuted: (muted: boolean) => void;
  jump: () => void;
  land: () => void;
  slide: () => void;
  coin: () => void;
  combo: (level: number) => void;
  crash: () => void;
  whoosh: () => void;
  start: () => void;
};

function env(ctx: AudioContext, gain: GainNode, t: number, a: number, d: number, peak = 1) {
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + a);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  slideTo?: number,
) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  env(ctx, g, t, 0.012, dur, peak);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function noiseBurst(ctx: AudioContext, dest: AudioNode, dur: number, peak: number, hp = 400) {
  const t = ctx.currentTime;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = ctx.createGain();
  env(ctx, g, t, 0.008, dur, peak);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(t + dur + 0.04);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

export function createAudio(): GameAudio {
  let ctx: AudioContext | null = null;
  let bus: Bus | null = null;
  let muted = false;
  let pad: { a: OscillatorNode; b: OscillatorNode; g: GainNode } | null = null;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    const master = ctx.createGain();
    const sfx = ctx.createGain();
    const music = ctx.createGain();
    sfx.gain.value = 0.7;
    music.gain.value = 0.12;
    master.gain.value = muted ? 0 : 1;
    sfx.connect(master);
    music.connect(master);
    master.connect(ctx.destination);
    bus = { master, sfx, music };
  }

  function resume() {
    ensure();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  function startPad() {
    if (!ctx || !bus || pad) return;
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    const g = ctx.createGain();
    a.type = "sine";
    b.type = "sine";
    a.frequency.value = 110;
    b.frequency.value = 164.8;
    g.gain.value = 0.0001;
    a.connect(g);
    b.connect(g);
    g.connect(bus.music);
    a.start();
    b.start();
    g.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
    pad = { a, b, g };
  }

  const api: GameAudio = {
    unlock() {
      resume();
      startPad();
    },
    setMuted(next) {
      muted = next;
      if (bus && ctx) {
        bus.master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.03);
      }
    },
    jump() {
      if (!ctx || !bus) return;
      const jitter = 0.94 + Math.random() * 0.12;
      tone(ctx, bus.sfx, 420 * jitter, 0.12, "triangle", 0.22, 680 * jitter);
    },
    land() {
      if (!ctx || !bus) return;
      noiseBurst(ctx, bus.sfx, 0.08, 0.18, 180);
      tone(ctx, bus.sfx, 90, 0.1, "sine", 0.18);
    },
    slide() {
      if (!ctx || !bus) return;
      noiseBurst(ctx, bus.sfx, 0.16, 0.12, 700);
    },
    coin() {
      if (!ctx || !bus) return;
      const j = 0.96 + Math.random() * 0.08;
      tone(ctx, bus.sfx, 880 * j, 0.08, "sine", 0.16, 1320 * j);
    },
    combo(level) {
      if (!ctx || !bus) return;
      const f = 520 + Math.min(level, 8) * 40;
      tone(ctx, bus.sfx, f, 0.1, "triangle", 0.14, f * 1.5);
    },
    crash() {
      if (!ctx || !bus) return;
      noiseBurst(ctx, bus.sfx, 0.28, 0.28, 120);
      tone(ctx, bus.sfx, 140, 0.22, "sine", 0.28, 50);
    },
    whoosh() {
      if (!ctx || !bus) return;
      noiseBurst(ctx, bus.sfx, 0.12, 0.08, 900);
    },
    start() {
      resume();
      startPad();
      if (!ctx || !bus) return;
      tone(ctx, bus.sfx, 330, 0.1, "triangle", 0.16, 440);
      tone(ctx, bus.sfx, 440, 0.14, "triangle", 0.12, 660);
    },
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") resume();
    });
  }

  return api;
}
