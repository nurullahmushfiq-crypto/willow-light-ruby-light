import type { GameSave } from "./types";

const KEY = "stride-save";
const SAVE_VERSION = 1;

const defaults: GameSave = {
  version: SAVE_VERSION,
  highScore: 0,
  muted: false,
};

function migrate(raw: Partial<GameSave> | null): GameSave {
  const merged: GameSave = { ...defaults, ...raw, version: SAVE_VERSION };
  merged.highScore = Math.max(0, Math.floor(Number(merged.highScore) || 0));
  merged.muted = Boolean(merged.muted);
  return merged;
}

export function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return migrate(JSON.parse(raw) as Partial<GameSave>);
  } catch {
    return { ...defaults };
  }
}

export function writeSave(save: GameSave) {
  try {
    const payload: GameSave = { ...save, version: SAVE_VERSION };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // private mode / quota — keep playing in memory
  }
}
