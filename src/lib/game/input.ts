const JUMP_CODES = new Set(["Space", "ArrowUp", "KeyW", "KeyZ"]);
const SLIDE_CODES = new Set(["ArrowDown", "KeyS", "KeyX", "ControlLeft", "ControlRight"]);
const START_CODES = new Set(["Space", "Enter", "KeyW", "ArrowUp"]);

export type InputState = {
  jumpHeld: boolean;
  jumpPressed: boolean;
  slideHeld: boolean;
  slidePressed: boolean;
  startPressed: boolean;
};

export type InputHandle = {
  attach: (target: HTMLElement) => void;
  detach: () => void;
  sample: () => InputState;
  setSlideHeld: (held: boolean) => void;
};

export function createInput(): InputHandle {
  const keys = new Set<string>();
  let jumpEdge = false;
  let slideEdge = false;
  let startEdge = false;
  let slideOverride = false;
  let pointerSlide = false;
  let pointerId: number | null = null;
  let startY = 0;
  let startX = 0;
  let target: HTMLElement | null = null;
  let prevPadJump = false;
  let prevPadSlide = false;

  function onKeyDown(e: KeyboardEvent) {
    if (e.repeat) return;
    if (JUMP_CODES.has(e.code) || SLIDE_CODES.has(e.code) || START_CODES.has(e.code)) {
      e.preventDefault();
    }
    keys.add(e.code);
    if (JUMP_CODES.has(e.code)) jumpEdge = true;
    if (SLIDE_CODES.has(e.code)) slideEdge = true;
    if (START_CODES.has(e.code)) startEdge = true;
  }

  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.code);
  }

  function clearKeys() {
    keys.clear();
    slideOverride = false;
    pointerSlide = false;
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = e.target as HTMLElement | null;
    if (el?.closest("[data-ui]")) return;
    pointerId = e.pointerId;
    startY = e.clientY;
    startX = e.clientX;
    jumpEdge = true;
    startEdge = true;
    try {
      target?.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (pointerId !== e.pointerId) return;
    const dy = e.clientY - startY;
    const dx = e.clientX - startX;
    if (dy > 36 && dy > Math.abs(dx)) {
      if (!pointerSlide) {
        pointerSlide = true;
        slideEdge = true;
      }
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (pointerId !== e.pointerId) return;
    pointerId = null;
    pointerSlide = false;
  }

  const handle: InputHandle = {
    attach(el) {
      target = el;
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", clearKeys);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) clearKeys();
      });
      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerup", onPointerUp);
      el.addEventListener("pointercancel", onPointerUp);
    },
    detach() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      if (target) {
        target.removeEventListener("pointerdown", onPointerDown);
        target.removeEventListener("pointermove", onPointerMove);
        target.removeEventListener("pointerup", onPointerUp);
        target.removeEventListener("pointercancel", onPointerUp);
      }
      target = null;
    },
    sample() {
      let padJump = false;
      let padSlide = false;
      const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : [];
      if (pads) {
        for (const pad of pads) {
          if (!pad) continue;
          const b = pad.buttons;
          if (b[0]?.pressed || b[12]?.pressed) padJump = true;
          if (b[1]?.pressed || b[13]?.pressed) padSlide = true;
          if ((pad.axes[1] ?? 0) > 0.55) padSlide = true;
        }
      }
      const padJumpEdge = padJump && !prevPadJump;
      const padSlideEdge = padSlide && !prevPadSlide;
      prevPadJump = padJump;
      prevPadSlide = padSlide;

      const jumpHeld = [...JUMP_CODES].some((c) => keys.has(c)) || padJump;
      const slideHeld =
        [...SLIDE_CODES].some((c) => keys.has(c)) || padSlide || slideOverride || pointerSlide;

      const state: InputState = {
        jumpHeld,
        jumpPressed: jumpEdge || padJumpEdge,
        slideHeld,
        slidePressed: slideEdge || padSlideEdge,
        startPressed: startEdge || padJumpEdge,
      };
      jumpEdge = false;
      slideEdge = false;
      startEdge = false;
      return state;
    },
    setSlideHeld(held) {
      if (held && !slideOverride) slideEdge = true;
      slideOverride = held;
    },
  };

  return handle;
}
