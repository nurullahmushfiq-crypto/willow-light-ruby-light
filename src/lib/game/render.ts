import { mulberry32 } from "./rng";
import type {
  Coin,
  Floater,
  Layout,
  Obstacle,
  Particle,
  Phase,
  Player,
  ScarfPoint,
} from "./types";

export type SkylineLayer = {
  total: number;
  buildings: { x: number; w: number; h: number; windows: { x: number; y: number; on: boolean }[] }[];
};

export type Skyline = {
  far: SkylineLayer;
  mid: SkylineLayer;
  near: SkylineLayer;
  stars: { x: number; y: number; r: number; tw: number }[];
};

export type RenderView = {
  layout: Layout;
  phase: Phase;
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  particles: Particle[];
  floaters: Floater[];
  scarf: ScarfPoint[];
  scroll: number;
  speed: number;
  time: number;
  trauma: number;
  flash: number;
  combo: number;
  reducedMotion: boolean;
  skyline: Skyline;
};

function makeLayer(rng: () => number, countHint: number, hMin: number, hMax: number, wMin: number, wMax: number): SkylineLayer {
  const buildings: SkylineLayer["buildings"] = [];
  let x = 0;
  for (let i = 0; i < countHint; i++) {
    const w = wMin + rng() * (wMax - wMin);
    const h = hMin + rng() * (hMax - hMin);
    const windows: SkylineLayer["buildings"][number]["windows"] = [];
    const cols = Math.max(1, Math.floor(w / 14));
    const rows = Math.max(1, Math.floor(h / 18));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng() > 0.55) {
          windows.push({
            x: 5 + c * (w / cols),
            y: 8 + r * (h / rows),
            on: rng() > 0.28,
          });
        }
      }
    }
    buildings.push({ x, w, h, windows });
    x += w + 6 + rng() * 18;
  }
  return { total: Math.max(x, 800), buildings };
}

export function createSkyline(seed: number): Skyline {
  const rng = mulberry32(seed);
  const stars = Array.from({ length: 70 }, () => ({
    x: rng(),
    y: rng() * 0.55,
    r: 0.4 + rng() * 1.3,
    tw: rng() * Math.PI * 2,
  }));
  return {
    far: makeLayer(rng, 22, 70, 180, 36, 90),
    mid: makeLayer(rng, 18, 110, 280, 48, 120),
    near: makeLayer(rng, 14, 80, 200, 70, 150),
    stars,
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: SkylineLayer,
  scroll: number,
  groundY: number,
  viewW: number,
  fill: string,
  windowColor: string,
  windowOff: string,
) {
  const off = ((scroll % layer.total) + layer.total) % layer.total;
  ctx.fillStyle = fill;
  for (const b of layer.buildings) {
    for (const extra of [0, layer.total, -layer.total]) {
      const x = b.x - off + extra;
      if (x > viewW || x + b.w < 0) continue;
      const y = groundY - b.h;
      ctx.fillRect(x, y, b.w, b.h);
      for (const w of b.windows) {
        ctx.fillStyle = w.on ? windowColor : windowOff;
        ctx.fillRect(x + w.x, y + w.y, 4, 6);
      }
      ctx.fillStyle = fill;
    }
  }
}

function drawSky(ctx: CanvasRenderingContext2D, v: RenderView) {
  const { w, h, groundY } = v.layout;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0b1020");
  g.addColorStop(0.42, "#1a2236");
  g.addColorStop(0.72, "#3a2a34");
  g.addColorStop(0.88, "#8a5a4a");
  g.addColorStop(1, "#c4785a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const moonX = w * 0.78;
  const moonY = h * 0.16;
  ctx.fillStyle = "rgba(243,241,236,0.12)";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f3f1ec";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a2236";
  ctx.beginPath();
  ctx.arc(moonX + 8, moonY - 4, 20, 0, Math.PI * 2);
  ctx.fill();

  for (const s of v.skyline.stars) {
    const tw = 0.45 + 0.55 * Math.sin(v.time * 1.6 + s.tw);
    ctx.fillStyle = `rgba(243,241,236,${0.35 + tw * 0.5})`;
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLayer(ctx, v.skyline.far, v.scroll * 0.18, groundY - 40, w, "#121826", "rgba(232,192,122,0.35)", "rgba(20,24,36,0.5)");
  drawLayer(ctx, v.skyline.mid, v.scroll * 0.38, groundY - 12, w, "#0e141f", "rgba(232,192,122,0.55)", "rgba(14,18,28,0.7)");
  drawLayer(ctx, v.skyline.near, v.scroll * 0.62, groundY + 8, w, "#0a0d14", "rgba(232,192,122,0.7)", "#12151c");
}

function drawGround(ctx: CanvasRenderingContext2D, v: RenderView) {
  const { w, h, groundY, u } = v.layout;
  ctx.fillStyle = "#141820";
  ctx.fillRect(0, groundY, w, h - groundY);

  const tile = 56 * u;
  const off = ((v.scroll % tile) + tile) % tile;
  ctx.fillStyle = "#1a1f2a";
  for (let x = -off; x < w + tile; x += tile) {
    ctx.fillRect(x, groundY, tile - 3 * u, 10 * u);
  }
  ctx.fillStyle = "#2a3140";
  ctx.fillRect(0, groundY, w, 3 * u);

  ctx.fillStyle = "#0c0f16";
  ctx.fillRect(0, groundY + 18 * u, w, h - groundY);
  ctx.fillStyle = "#1c2230";
  ctx.fillRect(0, groundY + 18 * u, w, 6 * u);

  const seam = 90 * u;
  const soff = ((v.scroll * 1.05) % seam + seam) % seam;
  ctx.strokeStyle = "rgba(243,241,236,0.04)";
  ctx.lineWidth = 1;
  for (let x = -soff; x < w; x += seam) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 24 * u);
    ctx.lineTo(x - 40 * u, h);
    ctx.stroke();
  }
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, u: number, groundY: number, t: number) {
  ctx.save();
  if (o.hang) {
    ctx.fillStyle = "#2a3140";
    ctx.fillRect(o.x + o.w * 0.45, 0, o.w * 0.1, o.y + o.h);
    if (o.kind === "beam") {
      ctx.fillStyle = "#3a4254";
      roundRect(ctx, o.x, o.y, o.w, o.h, 4 * u);
      ctx.fill();
      ctx.fillStyle = "#c45c4a";
      ctx.fillRect(o.x + 6 * u, o.y + o.h * 0.35, o.w - 12 * u, 6 * u);
    } else if (o.kind === "sign") {
      ctx.fillStyle = "#242a38";
      roundRect(ctx, o.x, o.y, o.w, o.h, 6 * u);
      ctx.fill();
      ctx.strokeStyle = "#d7dde3";
      ctx.lineWidth = 2 * u;
      ctx.stroke();
      ctx.fillStyle = "#8e908c";
      ctx.fillRect(o.x + 8 * u, o.y + o.h * 0.3, o.w - 16 * u, 5 * u);
      ctx.fillRect(o.x + 12 * u, o.y + o.h * 0.5, o.w - 24 * u, 5 * u);
    } else {
      ctx.fillStyle = "#3a4254";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + o.h * 0.55, o.w * 0.48, o.h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a3140";
      ctx.fillRect(o.x + o.w * 0.42, o.y + o.h * 0.7, o.w * 0.16, groundY - (o.y + o.h * 0.7));
    }
  } else {
    const body = o.kind === "vent" ? "#3a4456" : "#2c3344";
    ctx.fillStyle = body;
    roundRect(ctx, o.x, o.y, o.w, o.h, 5 * u);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(o.x, o.y, o.w, 5 * u);
    if (o.kind === "crates") {
      ctx.strokeStyle = "rgba(243,241,236,0.08)";
      ctx.strokeRect(o.x + 4 * u, o.y + 4 * u, o.w - 8 * u, o.h / 2 - 6 * u);
      ctx.strokeRect(o.x + 4 * u, o.y + o.h / 2, o.w - 8 * u, o.h / 2 - 6 * u);
    } else if (o.kind === "vent") {
      ctx.fillStyle = "#1a1f2a";
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(o.x + 8 * u, o.y + 8 * u + i * 7 * u, o.w - 16 * u, 3 * u);
      }
    } else {
      ctx.strokeStyle = "rgba(243,241,236,0.1)";
      ctx.strokeRect(o.x + 6 * u, o.y + 8 * u, o.w - 12 * u, o.h - 16 * u);
    }
    const pulse = 0.35 + 0.25 * Math.sin(t * 4 + o.x * 0.01);
    ctx.fillStyle = `rgba(196,92,74,${pulse})`;
    ctx.fillRect(o.x + o.w * 0.7, o.y + 6 * u, 5 * u, 5 * u);
  }
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, c: Coin, t: number) {
  if (!c.active) return;
  const bob = Math.sin(t * 4 + c.bob) * 3;
  const spin = t * 3 + c.bob;
  const sx = Math.abs(Math.cos(spin));
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  if (c.collected) {
    const k = 1 - c.collectT;
    ctx.globalAlpha = Math.max(0, k);
    ctx.scale(1 + (1 - k) * 0.8, 1 + (1 - k) * 0.8);
  }
  ctx.scale(0.35 + sx * 0.65, 1);
  ctx.fillStyle = "#f3f1ec";
  ctx.beginPath();
  ctx.ellipse(0, 0, c.r, c.r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c5cdd6";
  ctx.beginPath();
  ctx.ellipse(0, 0, c.r * 0.45, c.r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, scarf: ScarfPoint[], t: number, phase: Phase) {
  const u = p.standH / 72;
  const cx = p.x + p.w / 2;
  const feet = p.y + p.h;
  const run = phase === "playing" && p.grounded && !p.sliding && !p.dead;
  const cycle = p.runPhase;
  const bob = run ? Math.abs(Math.sin(cycle)) * 2.4 * u : phase === "title" ? Math.sin(t * 2) * 1.4 * u : 0;
  const stride = run ? Math.sin(cycle) : p.sliding ? 0.2 : 0;

  if (scarf.length > 1) {
    ctx.save();
    ctx.strokeStyle = "#c45c4a";
    ctx.lineWidth = 4.2 * u;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(scarf[0]!.x, scarf[0]!.y);
    for (let i = 1; i < scarf.length; i++) {
      const pt = scarf[i]!;
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, feet);
  ctx.rotate(p.rot);
  ctx.scale(p.squashX, p.squashY);
  ctx.translate(0, -p.h + bob);

  const bodyW = p.sliding ? p.w * 0.92 : p.w * 0.58;
  const bodyH = p.sliding ? p.h * 0.55 : p.h * 0.48;
  const bodyY = p.sliding ? p.h * 0.28 : p.h * 0.32;

  ctx.fillStyle = "#2a2c32";
  ctx.save();
  ctx.translate(-7 * u, p.h - 2 * u);
  ctx.rotate(stride * 0.55);
  roundRect(ctx, -3.5 * u, -16 * u, 7 * u, 18 * u, 3 * u);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(7 * u, p.h - 2 * u);
  ctx.rotate(-stride * 0.55);
  roundRect(ctx, -3.5 * u, -16 * u, 7 * u, 18 * u, 3 * u);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#1a1d24";
  roundRect(ctx, -bodyW * 0.55 - 7 * u, bodyY + 4 * u, 11 * u, bodyH * 0.62, 3 * u);
  ctx.fill();

  ctx.fillStyle = "#ede8dc";
  roundRect(ctx, -bodyW / 2, bodyY, bodyW, bodyH, 7 * u);
  ctx.fill();

  ctx.fillStyle = "#c45c4a";
  ctx.fillRect(-bodyW / 2, bodyY + bodyH * 0.42, bodyW, 3.5 * u);

  const headR = (p.sliding ? 9 : 11.5) * u;
  const headX = p.sliding ? 4 * u : 3 * u;
  const headY = bodyY - headR * 0.55;
  ctx.fillStyle = "#ede8dc";
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1d24";
  ctx.beginPath();
  ctx.arc(headX - 1 * u, headY - 2 * u, headR * 0.95, Math.PI * 1.05, Math.PI * 1.95, false);
  ctx.fill();
  ctx.fillStyle = "#0c0d10";
  ctx.beginPath();
  ctx.arc(headX + 5 * u, headY + 1 * u, 2.1 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c45c4a";
  ctx.beginPath();
  ctx.arc(headX - 6 * u, headY + 4 * u, 2.4 * u, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    if (!p.active) continue;
    const a = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.kind === "glow") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
    }
    ctx.restore();
  }
}

function drawFloaters(ctx: CanvasRenderingContext2D, floaters: Floater[], u: number) {
  ctx.font = `600 ${Math.max(12, 14 * u)}px Sora, sans-serif`;
  ctx.textAlign = "center";
  for (const f of floaters) {
    if (!f.active) continue;
    const a = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#f3f1ec";
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawSpeedLines(ctx: CanvasRenderingContext2D, v: RenderView) {
  const ratio = Math.max(0, (v.speed - v.layout.baseSpeed) / Math.max(1, v.layout.maxSpeed - v.layout.baseSpeed));
  if (ratio < 0.35) return;
  const n = Math.floor(6 + ratio * 10);
  ctx.strokeStyle = `rgba(243,241,236,${0.04 + ratio * 0.08})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const y = (i / n) * v.layout.groundY;
    const len = 30 + ratio * 80;
    const x = ((v.scroll * (2 + i * 0.2) + i * 90) % (v.layout.w + 120)) - 60;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len, y);
    ctx.stroke();
  }
}

export function renderGame(ctx: CanvasRenderingContext2D, v: RenderView) {
  const { w, h, u } = v.layout;
  ctx.save();
  let sx = 0;
  let sy = 0;
  if (v.trauma > 0 && !v.reducedMotion) {
    const mag = v.trauma * v.trauma * 14 * u;
    sx = (Math.sin(v.time * 47) * 0.5 + Math.sin(v.time * 23)) * mag;
    sy = (Math.cos(v.time * 41) * 0.5 + Math.cos(v.time * 19)) * mag;
  }
  ctx.translate(sx, sy);

  drawSky(ctx, v);
  drawGround(ctx, v);
  drawSpeedLines(ctx, v);

  ctx.fillStyle = "rgba(12,13,16,0.18)";
  ctx.beginPath();
  ctx.ellipse(v.player.x + v.player.w / 2, v.layout.groundY + 6 * u, v.player.w * 0.7, 6 * u, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const o of v.obstacles) {
    if (o.active) drawObstacle(ctx, o, u, v.layout.groundY, v.time);
  }
  for (const c of v.coins) drawCoin(ctx, c, v.time);
  drawParticles(ctx, v.particles);
  drawPlayer(ctx, v.player, v.scarf, v.time, v.phase);
  drawFloaters(ctx, v.floaters, u);

  if (v.flash > 0) {
    ctx.fillStyle = `rgba(243,241,236,${v.flash * 0.35})`;
    ctx.fillRect(-sx, -sy, w, h);
  }

  const vg = ctx.createRadialGradient(w * 0.5, h * 0.45, h * 0.2, w * 0.5, h * 0.5, h * 0.85);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(8,9,12,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(-sx, -sy, w, h);

  ctx.restore();
}
