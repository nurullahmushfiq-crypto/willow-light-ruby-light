import { createAudio, type GameAudio } from "./audio";
import { createInput, type InputHandle } from "./input";
import { pick, randRange, mulberry32, hashSeed } from "./rng";
import { createSkyline, renderGame, type RenderView, type Skyline } from "./render";
import { loadSave, writeSave } from "./save";
import type {
  Coin,
  Floater,
  HudSnapshot,
  Layout,
  Obstacle,
  ObstacleKind,
  Particle,
  Phase,
  Player,
  ScarfPoint,
} from "./types";

const STEP = 1 / 60;
const COYOTE = 0.1;
const JUMP_BUFFER = 0.12;
const SLIDE_BUFFER = 0.12;
const SLIDE_TIME = 0.52;
const COMBO_WINDOW = 2.2;
const POOL_OBS = 28;
const POOL_COIN = 48;
const POOL_PART = 96;
const POOL_FLOAT = 16;

export type GameHandle = {
  start: () => void;
  restart: () => void;
  setMuted: (muted: boolean) => void;
  setSlideHeld: (held: boolean) => void;
  destroy: () => void;
  subscribe: (fn: (s: HudSnapshot) => void) => () => void;
  getState: () => HudSnapshot;
};

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function sep(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  const dx = ax + aw / 2 - (bx + bw / 2);
  const dy = ay + ah / 2 - (by + bh / 2);
  const ox = aw / 2 + bw / 2 - Math.abs(dx);
  const oy = ah / 2 + bh / 2 - Math.abs(dy);
  if (ox <= 0 || oy <= 0) return Math.hypot(Math.max(0, -ox), Math.max(0, -oy));
  return -Math.min(ox, oy);
}

function computeLayout(cssW: number, cssH: number): Layout {
  const w = Math.max(1, cssW);
  const h = Math.max(1, cssH);
  const u = h / 720;
  const playerX = Math.min(220 * u, w * 0.2);
  const lookAhead = Math.max(120, w - playerX);
  const baseSpeed = Math.min(430 * u, lookAhead / 1.2);
  const maxSpeed = Math.min(980 * u, lookAhead / 0.62);
  return {
    w,
    h,
    u,
    groundY: h * 0.78,
    playerX,
    baseSpeed,
    maxSpeed: Math.max(baseSpeed + 40, maxSpeed),
  };
}

function makePlayer(layout: Layout): Player {
  const u = layout.u;
  const standH = 72 * u;
  const standW = 40 * u;
  const slideH = 30 * u;
  const slideW = 52 * u;
  return {
    x: layout.playerX,
    y: layout.groundY - standH,
    w: standW,
    h: standH,
    standH,
    standW,
    slideH,
    slideW,
    vy: 0,
    grounded: true,
    sliding: false,
    slideT: 0,
    squashX: 1,
    squashY: 1,
    rot: 0,
    runPhase: 0,
    coyote: 0,
    jumpBuffer: 0,
    slideBuffer: 0,
    dead: false,
    deathT: 0,
    wantSlide: false,
  };
}

export function createGame(canvas: HTMLCanvasElement): GameHandle {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  const ctx: CanvasRenderingContext2D = context;

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const save = loadSave();
  const audio: GameAudio = createAudio();
  const input: InputHandle = createInput();

  let layout = computeLayout(1, 1);
  let phase: Phase = "title";
  let player = makePlayer(layout);
  let rng = mulberry32(hashSeed(Date.now() & 0xfffffff));
  let skyline: Skyline = createSkyline(0x51e1d);
  let scroll = 0;
  let speed = 0;
  let distance = 0;
  let score = 0;
  let combo = 0;
  let comboT = 0;
  let peakCombo = 0;
  let highScore = save.highScore;
  let muted = save.muted;
  let isNewHigh = false;
  let time = 0;
  let trauma = 0;
  let hitstop = 0;
  let flash = 0;
  let lastSpawnX = 0;
  let lastHang = false;
  let hudDirty = true;
  let raf = 0;
  let lastTs = 0;
  let acc = 0;
  let running = true;
  let lastHud: HudSnapshot | null = null;
  let startLock = 0;

  const obstacles: Obstacle[] = Array.from({ length: POOL_OBS }, () => ({
    active: false,
    kind: "crate",
    hang: false,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    scored: false,
    minSep: 999,
    variant: 0,
  }));
  const coins: Coin[] = Array.from({ length: POOL_COIN }, () => ({
    active: false,
    x: 0,
    y: 0,
    r: 8,
    collected: false,
    collectT: 0,
    bob: 0,
  }));
  const particles: Particle[] = Array.from({ length: POOL_PART }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 4,
    color: "#ede8dc",
    rot: 0,
    vr: 0,
    kind: "dust",
  }));
  const floaters: Floater[] = Array.from({ length: POOL_FLOAT }, () => ({
    active: false,
    x: 0,
    y: 0,
    vy: 0,
    text: "",
    life: 0,
    maxLife: 1,
  }));
  const scarf: ScarfPoint[] = Array.from({ length: 6 }, () => ({ x: 0, y: 0 }));

  const listeners = new Set<(s: HudSnapshot) => void>();

  function multiplier() {
    return 1 + Math.min(4, Math.floor(combo / 4)) * 0.5;
  }

  function snapshot(): HudSnapshot {
    return {
      phase,
      score: Math.floor(score),
      highScore: Math.floor(highScore),
      combo,
      multiplier: multiplier(),
      distance: Math.floor(distance),
      speedRatio:
        (speed - layout.baseSpeed) / Math.max(1, layout.maxSpeed - layout.baseSpeed),
      muted,
      isNewHigh,
      peakCombo,
    };
  }

  function emit() {
    const s = snapshot();
    lastHud = s;
    hudDirty = false;
    for (const fn of listeners) fn(s);
  }

  function grab<T extends { active: boolean }>(pool: T[]): T | null {
    for (const item of pool) if (!item.active) return item;
    return null;
  }

  function burst(
    x: number,
    y: number,
    n: number,
    color: string,
    kind: Particle["kind"],
    spread = 180,
  ) {
    for (let i = 0; i < n; i++) {
      const p = grab(particles);
      if (!p) return;
      const a = randRange(rng, -Math.PI, 0);
      const sp = randRange(rng, 40, spread);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.life = randRange(rng, 0.25, 0.7);
      p.maxLife = p.life;
      p.size = randRange(rng, 3, 8) * layout.u;
      p.color = color;
      p.rot = rng() * Math.PI;
      p.vr = randRange(rng, -8, 8);
      p.kind = kind;
    }
  }

  function floatText(x: number, y: number, text: string) {
    const f = grab(floaters);
    if (!f) return;
    f.active = true;
    f.x = x;
    f.y = y;
    f.vy = -40 * layout.u;
    f.text = text;
    f.life = 0.7;
    f.maxLife = 0.7;
  }

  function resetScarf() {
    const neckX = player.x + player.w * 0.2;
    const neckY = player.y + player.h * 0.28;
    for (let i = 0; i < scarf.length; i++) {
      scarf[i]!.x = neckX - i * 8 * layout.u;
      scarf[i]!.y = neckY + i * 2 * layout.u;
    }
  }

  function clearPools() {
    for (const o of obstacles) o.active = false;
    for (const c of coins) {
      c.active = false;
      c.collected = false;
    }
    for (const p of particles) p.active = false;
    for (const f of floaters) f.active = false;
  }

  function resetRun(next: Phase) {
    rng = mulberry32(hashSeed((Date.now() ^ (Math.random() * 1e9)) | 0));
    skyline = createSkyline(hashSeed((Date.now() / 3) | 0));
    player = makePlayer(layout);
    scroll = 0;
    speed = next === "playing" ? layout.baseSpeed : layout.baseSpeed * 0.35;
    distance = 0;
    score = 0;
    combo = 0;
    comboT = 0;
    peakCombo = 0;
    isNewHigh = false;
    time = 0;
    trauma = 0;
    hitstop = 0;
    flash = 0;
    lastSpawnX = layout.w + layout.baseSpeed * 1.1;
    lastHang = false;
    phase = next;
    startLock = next === "playing" ? 0.22 : 0;
    clearPools();
    resetScarf();
    hudDirty = true;
  }

  function spawnCoin(x: number, y: number) {
    const c = grab(coins);
    if (!c) return;
    c.active = true;
    c.x = x;
    c.y = y;
    c.r = 7 * layout.u;
    c.collected = false;
    c.collectT = 0;
    c.bob = rng() * Math.PI * 2;
  }

  function spawnObstacle(kind: ObstacleKind, x: number) {
    const o = grab(obstacles);
    if (!o) return;
    const u = layout.u;
    const g = layout.groundY;
    o.active = true;
    o.kind = kind;
    o.scored = false;
    o.minSep = 999;
    o.variant = randIntish();
    o.x = x;
    if (kind === "crate") {
      o.hang = false;
      o.w = 48 * u;
      o.h = 44 * u;
      o.y = g - o.h;
    } else if (kind === "crates") {
      o.hang = false;
      o.w = 52 * u;
      o.h = 78 * u;
      o.y = g - o.h;
    } else if (kind === "vent") {
      o.hang = false;
      o.w = 72 * u;
      o.h = 34 * u;
      o.y = g - o.h;
    } else if (kind === "beam") {
      o.hang = true;
      o.w = 96 * u;
      const gap = 48 * u;
      o.h = 22 * u;
      o.y = g - gap - o.h;
    } else if (kind === "sign") {
      o.hang = true;
      o.w = 70 * u;
      const gap = 46 * u;
      o.h = 64 * u;
      o.y = g - gap - o.h;
    } else {
      o.hang = true;
      o.w = 84 * u;
      const gap = 50 * u;
      o.h = 70 * u;
      o.y = g - gap - o.h;
    }
    lastHang = o.hang;
    lastSpawnX = o.x + o.w;

    if (!o.hang) {
      const n = 3 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        spawnCoin(o.x + o.w * 0.2 + i * 16 * u, o.y - 36 * u - Math.sin((i / n) * Math.PI) * 28 * u);
      }
    } else {
      const n = 4;
      for (let i = 0; i < n; i++) {
        spawnCoin(o.x + 10 * u + i * 16 * u, g - 16 * u);
      }
    }
  }

  function randIntish() {
    return Math.floor(rng() * 1000);
  }

  function pickKind(difficulty: number): ObstacleKind {
    const lows: ObstacleKind[] = difficulty > 0.45 ? ["crate", "vent", "crates"] : ["crate", "vent"];
    const highs: ObstacleKind[] = difficulty > 0.3 ? ["beam", "sign", "dish"] : ["beam", "sign"];
    if (lastHang) return pick(rng, lows);
    if (difficulty < 0.15) return rng() < 0.72 ? pick(rng, lows) : pick(rng, highs);
    if (rng() < 0.52) return pick(rng, lows);
    return pick(rng, highs);
  }

  function maybeSpawn() {
    const difficulty = Math.min(1, Math.max(0, (distance - 40) / 2400));
    const reaction = 0.72 - difficulty * 0.18;
    let spacing = speed * reaction + 48 * layout.u;
    spacing += speed * randRange(rng, 0.08, 0.42 - difficulty * 0.22);
    if (lastHang) spacing = Math.max(spacing, speed * 0.62);
    const nextX = lastSpawnX + spacing;
    const spawnLine = layout.w + 56 * layout.u;
    if (nextX <= spawnLine) {
      spawnObstacle(pickKind(difficulty), spawnLine);
    }
  }

  function addCombo(n: number, x: number, y: number, label?: string) {
    combo += n;
    comboT = COMBO_WINDOW;
    if (combo > peakCombo) peakCombo = combo;
    const m = multiplier();
    if (label) floatText(x, y, label);
    else if (combo >= 2) floatText(x, y, `${combo}x`);
    if (combo > 0 && combo % 4 === 0) audio.combo(combo);
    return m;
  }

  function collectCoin(c: Coin) {
    c.collected = true;
    c.collectT = 1;
    const m = addCombo(1, c.x, c.y - 12, `+${Math.floor(50 * multiplier())}`);
    score += 50 * m;
    burst(c.x, c.y, 8, "#f3f1ec", "glow", 120);
    audio.coin();
  }

  function die() {
    if (player.dead) return;
    player.dead = true;
    player.deathT = 0;
    player.vy = -420 * layout.u;
    player.sliding = false;
    phase = "over";
    hitstop = reducedMotion ? 0.02 : 0.09;
    trauma = Math.min(1, trauma + 0.85);
    flash = 0.8;
    audio.crash();
    burst(player.x + player.w / 2, player.y + player.h * 0.5, 22, "#ede8dc", "shard", 260);
    burst(player.x + player.w / 2, player.y + player.h, 10, "#c45c4a", "dust", 140);
    if (score > highScore) {
      highScore = Math.floor(score);
      isNewHigh = true;
      writeSave({ version: 1, highScore, muted });
    }
    hudDirty = true;
  }

  function tryJump() {
    if (player.dead) return;
    if (player.grounded || player.coyote > 0) {
      player.vy = -820 * layout.u;
      player.grounded = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.sliding = false;
      player.slideT = 0;
      player.w = player.standW;
      player.h = player.standH;
      player.y = layout.groundY - player.h;
      player.squashX = 0.78;
      player.squashY = 1.28;
      burst(player.x + player.w / 2, layout.groundY, 6, "#c5cdd6", "dust", 90);
      audio.jump();
    } else {
      player.jumpBuffer = JUMP_BUFFER;
    }
  }

  function startSlide() {
    if (player.dead) return;
    if (!player.grounded) {
      player.slideBuffer = SLIDE_BUFFER;
      return;
    }
    if (player.sliding) {
      player.slideT = SLIDE_TIME;
      return;
    }
    player.sliding = true;
    player.slideT = SLIDE_TIME;
    player.w = player.slideW;
    player.h = player.slideH;
    player.y = layout.groundY - player.h;
    player.squashX = 1.25;
    player.squashY = 0.72;
    audio.slide();
    burst(player.x + player.w, layout.groundY, 5, "#8e908c", "dust", 70);
  }

  function endSlide() {
    if (!player.sliding) return;
    player.sliding = false;
    player.slideT = 0;
    player.w = player.standW;
    player.h = player.standH;
    if (player.grounded) player.y = layout.groundY - player.h;
    player.squashX = 0.9;
    player.squashY = 1.12;
  }

  function hitbox() {
    const insetX = 6 * layout.u;
    const insetY = player.sliding ? 2 * layout.u : 6 * layout.u;
    return {
      x: player.x + insetX,
      y: player.y + insetY,
      w: player.w - insetX * 2,
      h: player.h - insetY,
    };
  }

  function stepPhysics(dt: number) {
    const g = 2400 * layout.u;
    const maxFall = 1400 * layout.u;
    const wasGrounded = player.grounded;

    if (!player.dead) {
      player.vy += g * dt;
      if (player.vy > maxFall) player.vy = maxFall;
      player.y += player.vy * dt;
      const floor = layout.groundY - player.h;
      if (player.y >= floor) {
        player.y = floor;
        if (!player.grounded) {
          player.grounded = true;
          player.squashX = 1.28;
          player.squashY = 0.72;
          burst(player.x + player.w / 2, layout.groundY, 8, "#c5cdd6", "dust", 110);
          audio.land();
          if (player.jumpBuffer > 0) tryJump();
          else if (player.slideBuffer > 0 || player.wantSlide) startSlide();
        }
        player.vy = 0;
        player.coyote = COYOTE;
      } else {
        player.grounded = false;
        player.coyote = Math.max(0, player.coyote - dt);
      }
    } else {
      player.vy += g * dt;
      player.y += player.vy * dt;
      player.x -= speed * 0.15 * dt;
      player.rot += 3.2 * dt;
      player.deathT += dt;
      const floor = layout.groundY - player.h * 0.4;
      if (player.y > floor) {
        player.y = floor;
        player.vy *= -0.35;
        player.rot = Math.min(player.rot, 1.15);
      }
    }

    if (!player.dead && player.sliding) {
      player.slideT -= dt;
      if (player.slideT <= 0 && !player.wantSlide) endSlide();
    }

    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.slideBuffer = Math.max(0, player.slideBuffer - dt);

    const targetX = player.grounded && !player.sliding ? 1 : player.vy < 0 ? 0.82 : 1.08;
    const targetY = player.grounded && !player.sliding ? 1 : player.vy < 0 ? 1.18 : 0.9;
    player.squashX += (targetX - player.squashX) * (1 - Math.exp(-12 * dt));
    player.squashY += (targetY - player.squashY) * (1 - Math.exp(-12 * dt));

    if (player.grounded && !player.sliding && !player.dead) {
      player.runPhase += dt * (8 + speed / Math.max(1, layout.baseSpeed) * 4);
    }

    if (!wasGrounded && player.grounded && !player.dead) {
      /* land juice already applied */
    }
  }

  function stepWorld(dt: number) {
    const move = speed * dt;
    scroll += move;
    lastSpawnX -= move;

    const hb = hitbox();
    for (const o of obstacles) {
      if (!o.active) continue;
      o.x -= move;
      if (o.x + o.w < -80) {
        o.active = false;
        continue;
      }
      const d = sep(hb.x, hb.y, hb.w, hb.h, o.x, o.y, o.w, o.h);
      o.minSep = Math.min(o.minSep, d);
      if (aabb(hb.x, hb.y, hb.w, hb.h, o.x, o.y, o.w, o.h)) {
        die();
        return;
      }
      if (!o.scored && o.x + o.w < player.x) {
        o.scored = true;
        if (o.minSep < 26 * layout.u && o.minSep > -4) {
          const m = addCombo(1, o.x, player.y, "close");
          score += 25 * m;
          audio.whoosh();
          burst(player.x + player.w, player.y + player.h * 0.4, 6, "#d7dde3", "spark", 100);
        }
      }
    }

    for (const c of coins) {
      if (!c.active) continue;
      if (!c.collected) c.x -= move;
      if (c.collected) {
        c.collectT -= dt * 3.2;
        if (c.collectT <= 0) c.active = false;
        continue;
      }
      if (c.x < -40) {
        c.active = false;
        continue;
      }
      if (aabb(hb.x, hb.y, hb.w, hb.h, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)) {
        collectCoin(c);
      }
    }

    maybeSpawn();
  }

  function stepFx(dt: number) {
    trauma = Math.max(0, trauma - dt * 2.4);
    flash = Math.max(0, flash - dt * 3.2);
    if (comboT > 0) {
      comboT -= dt;
      if (comboT <= 0) combo = 0;
    }
    const neckX = player.x + player.w * 0.42;
    const neckY = player.y + player.h * (player.sliding ? 0.42 : 0.28);
    scarf[0]!.x = neckX;
    scarf[0]!.y = neckY;
    for (let i = 1; i < scarf.length; i++) {
      const prev = scarf[i - 1]!;
      const cur = scarf[i]!;
      const tx = prev.x - 9 * layout.u;
      const ty = prev.y + 4 * layout.u + Math.sin(time * 7 + i) * 1.6 * layout.u;
      cur.x += (tx - cur.x) * (1 - Math.exp(-16 * dt));
      cur.y += (ty - cur.y) * (1 - Math.exp(-16 * dt));
    }
    for (const p of particles) {
      if (!p.active) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * layout.u * dt;
      p.rot += p.vr * dt;
      if (p.life <= 0) p.active = false;
    }
    for (const f of floaters) {
      if (!f.active) continue;
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) f.active = false;
    }
  }

  function step(dt: number) {
    if (phase === "title") {
      speed = layout.baseSpeed * 0.32;
      scroll += speed * dt;
      player.x = layout.playerX;
      player.y = layout.groundY - player.h;
      player.grounded = true;
      player.runPhase += dt * 6;
      time += dt;
      stepFx(dt);
      return;
    }

    if (phase === "playing") {
      const t = distance / 1800;
      const ramp = 1 - Math.exp(-t);
      speed = layout.baseSpeed + (layout.maxSpeed - layout.baseSpeed) * ramp;
      const distRate = 55 * (speed / Math.max(1, layout.baseSpeed));
      distance += distRate * dt;
      score += distRate * dt * multiplier();
    }

    time += dt;
    stepPhysics(dt);
    if (phase === "playing" && !player.dead) stepWorld(dt);
    else if (phase === "over") {
      const move = speed * 0.25 * dt;
      scroll += move;
      for (const o of obstacles) if (o.active) o.x -= move;
      for (const c of coins) if (c.active && !c.collected) c.x -= move;
    }
    stepFx(dt);
    hudDirty = true;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(1, canvas.clientWidth);
    const cssH = Math.max(1, canvas.clientHeight);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const next = computeLayout(cssW, cssH);
    const scaleU = next.u / Math.max(0.001, layout.u);
    if (layout.w > 2) {
      player.x = next.playerX;
      player.standH *= scaleU;
      player.standW *= scaleU;
      player.slideH *= scaleU;
      player.slideW *= scaleU;
      player.w *= scaleU;
      player.h *= scaleU;
      player.y = next.groundY - player.h;
    }
    layout = next;
    if (phase === "title") player = makePlayer(layout);
  }

  function view(): RenderView {
    return {
      layout,
      phase,
      player,
      obstacles,
      coins,
      particles,
      floaters,
      scarf,
      scroll,
      speed,
      time,
      trauma,
      flash,
      combo,
      reducedMotion,
      skyline,
    };
  }

  function frame(ts: number) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.1) dt = 0.1;

    const inputState = input.sample();
    player.wantSlide = inputState.slideHeld;

    if (phase === "title") {
      if (inputState.startPressed) beginRun();
    } else if (phase === "over") {
      if (inputState.startPressed && player.deathT > 0.55) beginRun();
    } else if (phase === "playing") {
      if (startLock > 0) startLock -= dt;
      if (inputState.jumpPressed && startLock <= 0) tryJump();
      if (inputState.slidePressed || (inputState.slideHeld && !player.sliding && player.grounded)) {
        startSlide();
      }
      if (!inputState.slideHeld && player.sliding && player.slideT < 0.12) endSlide();
    }

    if (hitstop > 0) {
      hitstop -= dt;
    } else {
      acc += dt;
      const maxMove = 12 * layout.u;
      while (acc >= STEP) {
        const sub = speed * STEP > maxMove && phase === "playing" ? STEP / 2 : STEP;
        if (sub !== STEP) {
          step(STEP / 2);
          step(STEP / 2);
        } else {
          step(STEP);
        }
        acc -= STEP;
      }
    }

    renderGame(ctx, view());
    if (hudDirty) emit();
    raf = requestAnimationFrame(frame);
  }

  function beginRun() {
    audio.unlock();
    audio.start();
    resetRun("playing");
    emit();
  }

  const handle: GameHandle = {
    start() {
      beginRun();
    },
    restart() {
      beginRun();
    },
    setMuted(next) {
      muted = next;
      audio.setMuted(next);
      writeSave({ version: 1, highScore, muted });
      hudDirty = true;
      emit();
    },
    setSlideHeld(held) {
      input.setSlideHeld(held);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      input.detach();
      ro.disconnect();
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(snapshot());
      return () => listeners.delete(fn);
    },
    getState() {
      return lastHud ?? snapshot();
    },
  };

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  resize();
  resetRun("title");
  audio.setMuted(muted);
  input.attach(canvas);
  raf = requestAnimationFrame(frame);
  emit();
  return handle;
}
