export type Phase = "title" | "playing" | "over";

export type ObstacleKind = "crate" | "crates" | "vent" | "beam" | "sign" | "dish";

export type ParticleKind = "dust" | "spark" | "shard" | "glow";

export type HudSnapshot = {
  phase: Phase;
  score: number;
  highScore: number;
  combo: number;
  multiplier: number;
  distance: number;
  speedRatio: number;
  muted: boolean;
  isNewHigh: boolean;
  peakCombo: number;
};

export type Layout = {
  w: number;
  h: number;
  u: number;
  groundY: number;
  playerX: number;
  baseSpeed: number;
  maxSpeed: number;
};

export type Player = {
  x: number;
  y: number;
  w: number;
  h: number;
  standH: number;
  standW: number;
  slideH: number;
  slideW: number;
  vy: number;
  grounded: boolean;
  sliding: boolean;
  slideT: number;
  squashX: number;
  squashY: number;
  rot: number;
  runPhase: number;
  coyote: number;
  jumpBuffer: number;
  slideBuffer: number;
  dead: boolean;
  deathT: number;
  wantSlide: boolean;
};

export type Obstacle = {
  active: boolean;
  kind: ObstacleKind;
  hang: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  scored: boolean;
  minSep: number;
  variant: number;
};

export type Coin = {
  active: boolean;
  x: number;
  y: number;
  r: number;
  collected: boolean;
  collectT: number;
  bob: number;
};

export type Particle = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  kind: ParticleKind;
};

export type Floater = {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  maxLife: number;
};

export type ScarfPoint = { x: number; y: number };

export type GameSave = {
  version: number;
  highScore: number;
  muted: boolean;
};
