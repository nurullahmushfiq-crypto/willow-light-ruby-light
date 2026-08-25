import { useEffect, useRef, useState } from "react";
import { ChevronDown, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createGame, type GameHandle } from "@/lib/game/engine";
import type { HudSnapshot } from "@/lib/game/types";

const INITIAL: HudSnapshot = {
  phase: "title",
  score: 0,
  highScore: 0,
  combo: 0,
  multiplier: 1,
  distance: 0,
  speedRatio: 0,
  muted: false,
  isNewHigh: false,
  peakCombo: 0,
};

function formatScore(n: number) {
  return n.toLocaleString("en-US");
}

export function GameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createGame(canvas);
    gameRef.current = game;
    const unsub = game.subscribe(setHud);
    return () => {
      unsub();
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const playing = hud.phase === "playing";
  const over = hud.phase === "over";
  const title = hud.phase === "title";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: "none" }}
        aria-label="Stride rooftop runner"
      />

      <div className="pointer-events-none absolute inset-0">
        <header className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6">
          <div className="min-w-0">
            {playing || over ? (
              <div>
                <p className="text-xs font-medium tracking-wide text-muted uppercase">Score</p>
                <p className="font-semibold tabular-nums text-2xl leading-tight tracking-tight sm:text-3xl">
                  {formatScore(hud.score)}
                </p>
                <p className="text-xs text-subtle tabular-nums">
                  {formatScore(hud.distance)} m
                </p>
              </div>
            ) : (
              <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">Rooftop runner</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {playing && hud.combo >= 2 && (
              <div className="rounded-md border border-border bg-surface/80 px-3 py-1.5 text-right">
                <p className="text-[10px] font-medium tracking-wide text-muted uppercase">Combo</p>
                <p className="font-semibold tabular-nums text-lg leading-none">
                  {hud.combo}
                  <span className="ml-1 text-xs text-muted">{hud.multiplier.toFixed(1)}x</span>
                </p>
              </div>
            )}
            <Button
              data-ui
              variant="ghost"
              size="icon"
              className="pointer-events-auto"
              aria-label={hud.muted ? "Unmute" : "Mute"}
              onClick={() => gameRef.current?.setMuted(!hud.muted)}
            >
              {hud.muted ? <VolumeX /> : <Volume2 />}
            </Button>
          </div>
        </header>

        {title && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-5">
            <div className="overlay-enter pointer-events-auto flex w-full max-w-md flex-col items-center text-center">
              <p className="text-xs font-medium tracking-[0.28em] text-muted uppercase">Dusk courier</p>
              <h1 className="mt-3 text-6xl font-semibold tracking-[-0.05em] text-fg sm:text-7xl text-balance">
                Stride
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted text-pretty">
                Jump and slide the rooftops. Near-misses chain into combos. The city only gets faster.
              </p>
              {hud.highScore > 0 && (
                <p className="mt-4 text-xs font-medium tabular-nums text-subtle">
                  Best {formatScore(hud.highScore)}
                </p>
              )}
              <Button
                data-ui
                size="lg"
                className="mt-8 min-w-44"
                onClick={() => gameRef.current?.start()}
              >
                <Play />
                Run
              </Button>
              <p className="mt-6 text-xs text-subtle">
                Tap or Space to jump · Down or swipe to slide
              </p>
            </div>
          </div>
        )}

        {over && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/40 px-5">
            <div className="modal-enter pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-8">
              <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">
                {hud.isNewHigh ? "New best" : "Run over"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
                {hud.isNewHigh ? "You set the line" : "Out of stride"}
              </h2>
              <dl className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-muted">Score</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-2xl">{formatScore(hud.score)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Best</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-2xl">{formatScore(hud.highScore)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Distance</dt>
                  <dd className="mt-1 font-medium tabular-nums">{formatScore(hud.distance)} m</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Peak combo</dt>
                  <dd className="mt-1 font-medium tabular-nums">{hud.peakCombo}</dd>
                </div>
              </dl>
              <Button
                data-ui
                size="lg"
                className="mt-8 w-full"
                onClick={() => gameRef.current?.restart()}
              >
                <RotateCcw />
                Run again
              </Button>
            </div>
          </div>
        )}

        {playing && (
          <footer className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
            <p className="hidden text-xs text-subtle sm:block">Space jump · Down slide</p>
            <button
              data-ui
              type="button"
              className="pointer-events-auto ml-auto flex size-16 items-center justify-center rounded-xl border border-border bg-surface/90 text-fg shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:size-14"
              aria-label="Slide"
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                gameRef.current?.setSlideHeld(true);
              }}
              onPointerUp={() => gameRef.current?.setSlideHeld(false)}
              onPointerCancel={() => gameRef.current?.setSlideHeld(false)}
            >
              <ChevronDown className="size-7" />
            </button>
          </footer>
        )}
      </div>
    </main>
  );
}
