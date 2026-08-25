import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Play, i as RotateCcw, n as Volume2, o as ChevronDown, t as VolumeX } from "../_libs/lucide-react.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-4LldXlLG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,color,border-color] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			ghost: "border border-border bg-transparent text-fg hover:bg-surface-2",
			muted: "bg-surface-2 text-fg hover:bg-surface"
		},
		size: {
			default: "h-11 px-5",
			lg: "h-12 px-7 text-base",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		"data-slot": "button",
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function env(ctx, gain, t, a, d, peak = 1) {
	gain.gain.cancelScheduledValues(t);
	gain.gain.setValueAtTime(1e-4, t);
	gain.gain.exponentialRampToValueAtTime(Math.max(.001, peak), t + a);
	gain.gain.exponentialRampToValueAtTime(1e-4, t + a + d);
}
function tone(ctx, dest, freq, dur, type, peak, slideTo) {
	const t = ctx.currentTime;
	const osc = ctx.createOscillator();
	const g = ctx.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t);
	if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
	env(ctx, g, t, .012, dur, peak);
	osc.connect(g);
	g.connect(dest);
	osc.start(t);
	osc.stop(t + dur + .05);
	osc.onended = () => {
		osc.disconnect();
		g.disconnect();
	};
}
function noiseBurst(ctx, dest, dur, peak, hp = 400) {
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
	env(ctx, g, t, .008, dur, peak);
	src.connect(filter);
	filter.connect(g);
	g.connect(dest);
	src.start(t);
	src.stop(t + dur + .04);
	src.onended = () => {
		src.disconnect();
		filter.disconnect();
		g.disconnect();
	};
}
function createAudio() {
	let ctx = null;
	let bus = null;
	let muted = false;
	let pad = null;
	function ensure() {
		if (ctx) return;
		ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		const master = ctx.createGain();
		const sfx = ctx.createGain();
		const music = ctx.createGain();
		sfx.gain.value = .7;
		music.gain.value = .12;
		master.gain.value = muted ? 0 : 1;
		sfx.connect(master);
		music.connect(master);
		master.connect(ctx.destination);
		bus = {
			master,
			sfx,
			music
		};
	}
	function resume() {
		ensure();
		if (ctx && ctx.state === "suspended") ctx.resume();
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
		g.gain.value = 1e-4;
		a.connect(g);
		b.connect(g);
		g.connect(bus.music);
		a.start();
		b.start();
		g.gain.setTargetAtTime(.9, ctx.currentTime, .4);
		pad = {
			a,
			b,
			g
		};
	}
	const api = {
		unlock() {
			resume();
			startPad();
		},
		setMuted(next) {
			muted = next;
			if (bus && ctx) bus.master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, .03);
		},
		jump() {
			if (!ctx || !bus) return;
			const jitter = .94 + Math.random() * .12;
			tone(ctx, bus.sfx, 420 * jitter, .12, "triangle", .22, 680 * jitter);
		},
		land() {
			if (!ctx || !bus) return;
			noiseBurst(ctx, bus.sfx, .08, .18, 180);
			tone(ctx, bus.sfx, 90, .1, "sine", .18);
		},
		slide() {
			if (!ctx || !bus) return;
			noiseBurst(ctx, bus.sfx, .16, .12, 700);
		},
		coin() {
			if (!ctx || !bus) return;
			const j = .96 + Math.random() * .08;
			tone(ctx, bus.sfx, 880 * j, .08, "sine", .16, 1320 * j);
		},
		combo(level) {
			if (!ctx || !bus) return;
			const f = 520 + Math.min(level, 8) * 40;
			tone(ctx, bus.sfx, f, .1, "triangle", .14, f * 1.5);
		},
		crash() {
			if (!ctx || !bus) return;
			noiseBurst(ctx, bus.sfx, .28, .28, 120);
			tone(ctx, bus.sfx, 140, .22, "sine", .28, 50);
		},
		whoosh() {
			if (!ctx || !bus) return;
			noiseBurst(ctx, bus.sfx, .12, .08, 900);
		},
		start() {
			resume();
			startPad();
			if (!ctx || !bus) return;
			tone(ctx, bus.sfx, 330, .1, "triangle", .16, 440);
			tone(ctx, bus.sfx, 440, .14, "triangle", .12, 660);
		}
	};
	if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") resume();
	});
	return api;
}
var JUMP_CODES = /* @__PURE__ */ new Set([
	"Space",
	"ArrowUp",
	"KeyW",
	"KeyZ"
]);
var SLIDE_CODES = /* @__PURE__ */ new Set([
	"ArrowDown",
	"KeyS",
	"KeyX",
	"ControlLeft",
	"ControlRight"
]);
var START_CODES = /* @__PURE__ */ new Set([
	"Space",
	"Enter",
	"KeyW",
	"ArrowUp"
]);
function createInput() {
	const keys = /* @__PURE__ */ new Set();
	let jumpEdge = false;
	let slideEdge = false;
	let startEdge = false;
	let slideOverride = false;
	let pointerSlide = false;
	let pointerId = null;
	let startY = 0;
	let startX = 0;
	let target = null;
	let prevPadJump = false;
	let prevPadSlide = false;
	function onKeyDown(e) {
		if (e.repeat) return;
		if (JUMP_CODES.has(e.code) || SLIDE_CODES.has(e.code) || START_CODES.has(e.code)) e.preventDefault();
		keys.add(e.code);
		if (JUMP_CODES.has(e.code)) jumpEdge = true;
		if (SLIDE_CODES.has(e.code)) slideEdge = true;
		if (START_CODES.has(e.code)) startEdge = true;
	}
	function onKeyUp(e) {
		keys.delete(e.code);
	}
	function clearKeys() {
		keys.clear();
		slideOverride = false;
		pointerSlide = false;
	}
	function onPointerDown(e) {
		if (e.button !== 0 && e.pointerType === "mouse") return;
		if (e.target?.closest("[data-ui]")) return;
		pointerId = e.pointerId;
		startY = e.clientY;
		startX = e.clientX;
		jumpEdge = true;
		startEdge = true;
		try {
			target?.setPointerCapture(e.pointerId);
		} catch {}
	}
	function onPointerMove(e) {
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
	function onPointerUp(e) {
		if (pointerId !== e.pointerId) return;
		pointerId = null;
		pointerSlide = false;
	}
	return {
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
			if (pads) for (const pad of pads) {
				if (!pad) continue;
				const b = pad.buttons;
				if (b[0]?.pressed || b[12]?.pressed) padJump = true;
				if (b[1]?.pressed || b[13]?.pressed) padSlide = true;
				if ((pad.axes[1] ?? 0) > .55) padSlide = true;
			}
			const padJumpEdge = padJump && !prevPadJump;
			const padSlideEdge = padSlide && !prevPadSlide;
			prevPadJump = padJump;
			prevPadSlide = padSlide;
			const jumpHeld = [...JUMP_CODES].some((c) => keys.has(c)) || padJump;
			const slideHeld = [...SLIDE_CODES].some((c) => keys.has(c)) || padSlide || slideOverride || pointerSlide;
			const state = {
				jumpHeld,
				jumpPressed: jumpEdge || padJumpEdge,
				slideHeld,
				slidePressed: slideEdge || padSlideEdge,
				startPressed: startEdge || padJumpEdge
			};
			jumpEdge = false;
			slideEdge = false;
			startEdge = false;
			return state;
		},
		setSlideHeld(held) {
			if (held && !slideOverride) slideEdge = true;
			slideOverride = held;
		}
	};
}
function mulberry32(seed) {
	let a = seed >>> 0;
	return function next() {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function hashSeed(n) {
	let t = n | 0;
	t = Math.imul(t ^ t >>> 16, 2146121005);
	t = Math.imul(t ^ t >>> 15, 2221713035);
	return (t ^ t >>> 16) >>> 0;
}
function randRange(rng, a, b) {
	return a + rng() * (b - a);
}
function pick(rng, items) {
	return items[Math.floor(rng() * items.length)];
}
function makeLayer(rng, countHint, hMin, hMax, wMin, wMax) {
	const buildings = [];
	let x = 0;
	for (let i = 0; i < countHint; i++) {
		const w = wMin + rng() * (wMax - wMin);
		const h = hMin + rng() * (hMax - hMin);
		const windows = [];
		const cols = Math.max(1, Math.floor(w / 14));
		const rows = Math.max(1, Math.floor(h / 18));
		for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (rng() > .55) windows.push({
			x: 5 + c * (w / cols),
			y: 8 + r * (h / rows),
			on: rng() > .28
		});
		buildings.push({
			x,
			w,
			h,
			windows
		});
		x += w + 6 + rng() * 18;
	}
	return {
		total: Math.max(x, 800),
		buildings
	};
}
function createSkyline(seed) {
	const rng = mulberry32(seed);
	const stars = Array.from({ length: 70 }, () => ({
		x: rng(),
		y: rng() * .55,
		r: .4 + rng() * 1.3,
		tw: rng() * Math.PI * 2
	}));
	return {
		far: makeLayer(rng, 22, 70, 180, 36, 90),
		mid: makeLayer(rng, 18, 110, 280, 48, 120),
		near: makeLayer(rng, 14, 80, 200, 70, 150),
		stars
	};
}
function roundRect(ctx, x, y, w, h, r) {
	const rr = Math.max(0, Math.min(r, w / 2, h / 2));
	ctx.beginPath();
	ctx.moveTo(x + rr, y);
	ctx.arcTo(x + w, y, x + w, y + h, rr);
	ctx.arcTo(x + w, y + h, x, y + h, rr);
	ctx.arcTo(x, y + h, x, y, rr);
	ctx.arcTo(x, y, x + w, y, rr);
	ctx.closePath();
}
function drawLayer(ctx, layer, scroll, groundY, viewW, fill, windowColor, windowOff) {
	const off = (scroll % layer.total + layer.total) % layer.total;
	ctx.fillStyle = fill;
	for (const b of layer.buildings) for (const extra of [
		0,
		layer.total,
		-layer.total
	]) {
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
function drawSky(ctx, v) {
	const { w, h, groundY } = v.layout;
	const g = ctx.createLinearGradient(0, 0, 0, h);
	g.addColorStop(0, "#0b1020");
	g.addColorStop(.42, "#1a2236");
	g.addColorStop(.72, "#3a2a34");
	g.addColorStop(.88, "#8a5a4a");
	g.addColorStop(1, "#c4785a");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);
	const moonX = w * .78;
	const moonY = h * .16;
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
		ctx.fillStyle = `rgba(243,241,236,${.35 + (.45 + .55 * Math.sin(v.time * 1.6 + s.tw)) * .5})`;
		ctx.beginPath();
		ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
		ctx.fill();
	}
	drawLayer(ctx, v.skyline.far, v.scroll * .18, groundY - 40, w, "#121826", "rgba(232,192,122,0.35)", "rgba(20,24,36,0.5)");
	drawLayer(ctx, v.skyline.mid, v.scroll * .38, groundY - 12, w, "#0e141f", "rgba(232,192,122,0.55)", "rgba(14,18,28,0.7)");
	drawLayer(ctx, v.skyline.near, v.scroll * .62, groundY + 8, w, "#0a0d14", "rgba(232,192,122,0.7)", "#12151c");
}
function drawGround(ctx, v) {
	const { w, h, groundY, u } = v.layout;
	ctx.fillStyle = "#141820";
	ctx.fillRect(0, groundY, w, h - groundY);
	const tile = 56 * u;
	const off = (v.scroll % tile + tile) % tile;
	ctx.fillStyle = "#1a1f2a";
	for (let x = -off; x < w + tile; x += tile) ctx.fillRect(x, groundY, tile - 3 * u, 10 * u);
	ctx.fillStyle = "#2a3140";
	ctx.fillRect(0, groundY, w, 3 * u);
	ctx.fillStyle = "#0c0f16";
	ctx.fillRect(0, groundY + 18 * u, w, h - groundY);
	ctx.fillStyle = "#1c2230";
	ctx.fillRect(0, groundY + 18 * u, w, 6 * u);
	const seam = 90 * u;
	const soff = (v.scroll * 1.05 % seam + seam) % seam;
	ctx.strokeStyle = "rgba(243,241,236,0.04)";
	ctx.lineWidth = 1;
	for (let x = -soff; x < w; x += seam) {
		ctx.beginPath();
		ctx.moveTo(x, groundY + 24 * u);
		ctx.lineTo(x - 40 * u, h);
		ctx.stroke();
	}
}
function drawObstacle(ctx, o, u, groundY, t) {
	ctx.save();
	if (o.hang) {
		ctx.fillStyle = "#2a3140";
		ctx.fillRect(o.x + o.w * .45, 0, o.w * .1, o.y + o.h);
		if (o.kind === "beam") {
			ctx.fillStyle = "#3a4254";
			roundRect(ctx, o.x, o.y, o.w, o.h, 4 * u);
			ctx.fill();
			ctx.fillStyle = "#c45c4a";
			ctx.fillRect(o.x + 6 * u, o.y + o.h * .35, o.w - 12 * u, 6 * u);
		} else if (o.kind === "sign") {
			ctx.fillStyle = "#242a38";
			roundRect(ctx, o.x, o.y, o.w, o.h, 6 * u);
			ctx.fill();
			ctx.strokeStyle = "#d7dde3";
			ctx.lineWidth = 2 * u;
			ctx.stroke();
			ctx.fillStyle = "#8e908c";
			ctx.fillRect(o.x + 8 * u, o.y + o.h * .3, o.w - 16 * u, 5 * u);
			ctx.fillRect(o.x + 12 * u, o.y + o.h * .5, o.w - 24 * u, 5 * u);
		} else {
			ctx.fillStyle = "#3a4254";
			ctx.beginPath();
			ctx.ellipse(o.x + o.w / 2, o.y + o.h * .55, o.w * .48, o.h * .42, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = "#2a3140";
			ctx.fillRect(o.x + o.w * .42, o.y + o.h * .7, o.w * .16, groundY - (o.y + o.h * .7));
		}
	} else {
		ctx.fillStyle = o.kind === "vent" ? "#3a4456" : "#2c3344";
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
			for (let i = 0; i < 4; i++) ctx.fillRect(o.x + 8 * u, o.y + 8 * u + i * 7 * u, o.w - 16 * u, 3 * u);
		} else {
			ctx.strokeStyle = "rgba(243,241,236,0.1)";
			ctx.strokeRect(o.x + 6 * u, o.y + 8 * u, o.w - 12 * u, o.h - 16 * u);
		}
		ctx.fillStyle = `rgba(196,92,74,${.35 + .25 * Math.sin(t * 4 + o.x * .01)})`;
		ctx.fillRect(o.x + o.w * .7, o.y + 6 * u, 5 * u, 5 * u);
	}
	ctx.restore();
}
function drawCoin(ctx, c, t) {
	if (!c.active) return;
	const bob = Math.sin(t * 4 + c.bob) * 3;
	const spin = t * 3 + c.bob;
	const sx = Math.abs(Math.cos(spin));
	ctx.save();
	ctx.translate(c.x, c.y + bob);
	if (c.collected) {
		const k = 1 - c.collectT;
		ctx.globalAlpha = Math.max(0, k);
		ctx.scale(1 + (1 - k) * .8, 1 + (1 - k) * .8);
	}
	ctx.scale(.35 + sx * .65, 1);
	ctx.fillStyle = "#f3f1ec";
	ctx.beginPath();
	ctx.ellipse(0, 0, c.r, c.r, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#c5cdd6";
	ctx.beginPath();
	ctx.ellipse(0, 0, c.r * .45, c.r * .45, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}
function drawPlayer(ctx, p, scarf, t, phase) {
	const u = p.standH / 72;
	const cx = p.x + p.w / 2;
	const feet = p.y + p.h;
	const run = phase === "playing" && p.grounded && !p.sliding && !p.dead;
	const cycle = p.runPhase;
	const bob = run ? Math.abs(Math.sin(cycle)) * 2.4 * u : phase === "title" ? Math.sin(t * 2) * 1.4 * u : 0;
	const stride = run ? Math.sin(cycle) : p.sliding ? .2 : 0;
	if (scarf.length > 1) {
		ctx.save();
		ctx.strokeStyle = "#c45c4a";
		ctx.lineWidth = 4.2 * u;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.beginPath();
		ctx.moveTo(scarf[0].x, scarf[0].y);
		for (let i = 1; i < scarf.length; i++) {
			const pt = scarf[i];
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
	const bodyW = p.sliding ? p.w * .92 : p.w * .58;
	const bodyH = p.sliding ? p.h * .55 : p.h * .48;
	const bodyY = p.sliding ? p.h * .28 : p.h * .32;
	ctx.fillStyle = "#2a2c32";
	ctx.save();
	ctx.translate(-7 * u, p.h - 2 * u);
	ctx.rotate(stride * .55);
	roundRect(ctx, -3.5 * u, -16 * u, 7 * u, 18 * u, 3 * u);
	ctx.fill();
	ctx.restore();
	ctx.save();
	ctx.translate(7 * u, p.h - 2 * u);
	ctx.rotate(-stride * .55);
	roundRect(ctx, -3.5 * u, -16 * u, 7 * u, 18 * u, 3 * u);
	ctx.fill();
	ctx.restore();
	ctx.fillStyle = "#1a1d24";
	roundRect(ctx, -bodyW * .55 - 7 * u, bodyY + 4 * u, 11 * u, bodyH * .62, 3 * u);
	ctx.fill();
	ctx.fillStyle = "#ede8dc";
	roundRect(ctx, -bodyW / 2, bodyY, bodyW, bodyH, 7 * u);
	ctx.fill();
	ctx.fillStyle = "#c45c4a";
	ctx.fillRect(-bodyW / 2, bodyY + bodyH * .42, bodyW, 3.5 * u);
	const headR = (p.sliding ? 9 : 11.5) * u;
	const headX = p.sliding ? 4 * u : 3 * u;
	const headY = bodyY - headR * .55;
	ctx.fillStyle = "#ede8dc";
	ctx.beginPath();
	ctx.arc(headX, headY, headR, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#1a1d24";
	ctx.beginPath();
	ctx.arc(headX - 1 * u, headY - 2 * u, headR * .95, Math.PI * 1.05, Math.PI * 1.95, false);
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
function drawParticles(ctx, particles) {
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
		} else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .7);
		ctx.restore();
	}
}
function drawFloaters(ctx, floaters, u) {
	ctx.font = `600 ${Math.max(12, 14 * u)}px Sora, sans-serif`;
	ctx.textAlign = "center";
	for (const f of floaters) {
		if (!f.active) continue;
		ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
		ctx.fillStyle = "#f3f1ec";
		ctx.fillText(f.text, f.x, f.y);
	}
	ctx.globalAlpha = 1;
}
function drawSpeedLines(ctx, v) {
	const ratio = Math.max(0, (v.speed - v.layout.baseSpeed) / Math.max(1, v.layout.maxSpeed - v.layout.baseSpeed));
	if (ratio < .35) return;
	const n = Math.floor(6 + ratio * 10);
	ctx.strokeStyle = `rgba(243,241,236,${.04 + ratio * .08})`;
	ctx.lineWidth = 2;
	for (let i = 0; i < n; i++) {
		const y = i / n * v.layout.groundY;
		const len = 30 + ratio * 80;
		const x = (v.scroll * (2 + i * .2) + i * 90) % (v.layout.w + 120) - 60;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x - len, y);
		ctx.stroke();
	}
}
function renderGame(ctx, v) {
	const { w, h, u } = v.layout;
	ctx.save();
	let sx = 0;
	let sy = 0;
	if (v.trauma > 0 && !v.reducedMotion) {
		const mag = v.trauma * v.trauma * 14 * u;
		sx = (Math.sin(v.time * 47) * .5 + Math.sin(v.time * 23)) * mag;
		sy = (Math.cos(v.time * 41) * .5 + Math.cos(v.time * 19)) * mag;
	}
	ctx.translate(sx, sy);
	drawSky(ctx, v);
	drawGround(ctx, v);
	drawSpeedLines(ctx, v);
	ctx.fillStyle = "rgba(12,13,16,0.18)";
	ctx.beginPath();
	ctx.ellipse(v.player.x + v.player.w / 2, v.layout.groundY + 6 * u, v.player.w * .7, 6 * u, 0, 0, Math.PI * 2);
	ctx.fill();
	for (const o of v.obstacles) if (o.active) drawObstacle(ctx, o, u, v.layout.groundY, v.time);
	for (const c of v.coins) drawCoin(ctx, c, v.time);
	drawParticles(ctx, v.particles);
	drawPlayer(ctx, v.player, v.scarf, v.time, v.phase);
	drawFloaters(ctx, v.floaters, u);
	if (v.flash > 0) {
		ctx.fillStyle = `rgba(243,241,236,${v.flash * .35})`;
		ctx.fillRect(-sx, -sy, w, h);
	}
	const vg = ctx.createRadialGradient(w * .5, h * .45, h * .2, w * .5, h * .5, h * .85);
	vg.addColorStop(0, "rgba(0,0,0,0)");
	vg.addColorStop(1, "rgba(8,9,12,0.45)");
	ctx.fillStyle = vg;
	ctx.fillRect(-sx, -sy, w, h);
	ctx.restore();
}
var KEY = "stride-save";
var SAVE_VERSION = 1;
var defaults = {
	version: SAVE_VERSION,
	highScore: 0,
	muted: false
};
function migrate(raw) {
	const merged = {
		...defaults,
		...raw,
		version: SAVE_VERSION
	};
	merged.highScore = Math.max(0, Math.floor(Number(merged.highScore) || 0));
	merged.muted = Boolean(merged.muted);
	return merged;
}
function loadSave() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...defaults };
		return migrate(JSON.parse(raw));
	} catch {
		return { ...defaults };
	}
}
function writeSave(save) {
	try {
		const payload = {
			...save,
			version: SAVE_VERSION
		};
		localStorage.setItem(KEY, JSON.stringify(payload));
	} catch {}
}
var STEP = 1 / 60;
var COYOTE = .1;
var JUMP_BUFFER = .12;
var SLIDE_BUFFER = .12;
var SLIDE_TIME = .52;
var COMBO_WINDOW = 2.2;
var POOL_OBS = 28;
var POOL_COIN = 48;
var POOL_PART = 96;
var POOL_FLOAT = 16;
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
	return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function sep(ax, ay, aw, ah, bx, by, bw, bh) {
	const dx = ax + aw / 2 - (bx + bw / 2);
	const dy = ay + ah / 2 - (by + bh / 2);
	const ox = aw / 2 + bw / 2 - Math.abs(dx);
	const oy = ah / 2 + bh / 2 - Math.abs(dy);
	if (ox <= 0 || oy <= 0) return Math.hypot(Math.max(0, -ox), Math.max(0, -oy));
	return -Math.min(ox, oy);
}
function computeLayout(cssW, cssH) {
	const w = Math.max(1, cssW);
	const h = Math.max(1, cssH);
	const u = h / 720;
	const playerX = Math.min(220 * u, w * .2);
	const lookAhead = Math.max(120, w - playerX);
	const baseSpeed = Math.min(430 * u, lookAhead / 1.2);
	const maxSpeed = Math.min(980 * u, lookAhead / .62);
	return {
		w,
		h,
		u,
		groundY: h * .78,
		playerX,
		baseSpeed,
		maxSpeed: Math.max(baseSpeed + 40, maxSpeed)
	};
}
function makePlayer(layout) {
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
		wantSlide: false
	};
}
function createGame(canvas) {
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D is unavailable");
	const ctx = context;
	const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const save = loadSave();
	const audio = createAudio();
	const input = createInput();
	let layout = computeLayout(1, 1);
	let phase = "title";
	let player = makePlayer(layout);
	let rng = mulberry32(hashSeed(Date.now() & 268435455));
	let skyline = createSkyline(335389);
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
	let lastHud = null;
	let startLock = 0;
	const obstacles = Array.from({ length: POOL_OBS }, () => ({
		active: false,
		kind: "crate",
		hang: false,
		x: 0,
		y: 0,
		w: 0,
		h: 0,
		scored: false,
		minSep: 999,
		variant: 0
	}));
	const coins = Array.from({ length: POOL_COIN }, () => ({
		active: false,
		x: 0,
		y: 0,
		r: 8,
		collected: false,
		collectT: 0,
		bob: 0
	}));
	const particles = Array.from({ length: POOL_PART }, () => ({
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
		kind: "dust"
	}));
	const floaters = Array.from({ length: POOL_FLOAT }, () => ({
		active: false,
		x: 0,
		y: 0,
		vy: 0,
		text: "",
		life: 0,
		maxLife: 1
	}));
	const scarf = Array.from({ length: 6 }, () => ({
		x: 0,
		y: 0
	}));
	const listeners = /* @__PURE__ */ new Set();
	function multiplier() {
		return 1 + Math.min(4, Math.floor(combo / 4)) * .5;
	}
	function snapshot() {
		return {
			phase,
			score: Math.floor(score),
			highScore: Math.floor(highScore),
			combo,
			multiplier: multiplier(),
			distance: Math.floor(distance),
			speedRatio: (speed - layout.baseSpeed) / Math.max(1, layout.maxSpeed - layout.baseSpeed),
			muted,
			isNewHigh,
			peakCombo
		};
	}
	function emit() {
		const s = snapshot();
		lastHud = s;
		hudDirty = false;
		for (const fn of listeners) fn(s);
	}
	function grab(pool) {
		for (const item of pool) if (!item.active) return item;
		return null;
	}
	function burst(x, y, n, color, kind, spread = 180) {
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
			p.life = randRange(rng, .25, .7);
			p.maxLife = p.life;
			p.size = randRange(rng, 3, 8) * layout.u;
			p.color = color;
			p.rot = rng() * Math.PI;
			p.vr = randRange(rng, -8, 8);
			p.kind = kind;
		}
	}
	function floatText(x, y, text) {
		const f = grab(floaters);
		if (!f) return;
		f.active = true;
		f.x = x;
		f.y = y;
		f.vy = -40 * layout.u;
		f.text = text;
		f.life = .7;
		f.maxLife = .7;
	}
	function resetScarf() {
		const neckX = player.x + player.w * .2;
		const neckY = player.y + player.h * .28;
		for (let i = 0; i < scarf.length; i++) {
			scarf[i].x = neckX - i * 8 * layout.u;
			scarf[i].y = neckY + i * 2 * layout.u;
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
	function resetRun(next) {
		rng = mulberry32(hashSeed(Date.now() ^ Math.random() * 1e9 | 0));
		skyline = createSkyline(hashSeed(Date.now() / 3 | 0));
		player = makePlayer(layout);
		scroll = 0;
		speed = next === "playing" ? layout.baseSpeed : layout.baseSpeed * .35;
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
		startLock = next === "playing" ? .22 : 0;
		clearPools();
		resetScarf();
		hudDirty = true;
	}
	function spawnCoin(x, y) {
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
	function spawnObstacle(kind, x) {
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
			for (let i = 0; i < n; i++) spawnCoin(o.x + o.w * .2 + i * 16 * u, o.y - 36 * u - Math.sin(i / n * Math.PI) * 28 * u);
		} else {
			const n = 4;
			for (let i = 0; i < n; i++) spawnCoin(o.x + 10 * u + i * 16 * u, g - 16 * u);
		}
	}
	function randIntish() {
		return Math.floor(rng() * 1e3);
	}
	function pickKind(difficulty) {
		const lows = difficulty > .45 ? [
			"crate",
			"vent",
			"crates"
		] : ["crate", "vent"];
		const highs = difficulty > .3 ? [
			"beam",
			"sign",
			"dish"
		] : ["beam", "sign"];
		if (lastHang) return pick(rng, lows);
		if (difficulty < .15) return rng() < .72 ? pick(rng, lows) : pick(rng, highs);
		if (rng() < .52) return pick(rng, lows);
		return pick(rng, highs);
	}
	function maybeSpawn() {
		const difficulty = Math.min(1, Math.max(0, (distance - 40) / 2400));
		const reaction = .72 - difficulty * .18;
		let spacing = speed * reaction + 48 * layout.u;
		spacing += speed * randRange(rng, .08, .42 - difficulty * .22);
		if (lastHang) spacing = Math.max(spacing, speed * .62);
		const nextX = lastSpawnX + spacing;
		const spawnLine = layout.w + 56 * layout.u;
		if (nextX <= spawnLine) spawnObstacle(pickKind(difficulty), spawnLine);
	}
	function addCombo(n, x, y, label) {
		combo += n;
		comboT = COMBO_WINDOW;
		if (combo > peakCombo) peakCombo = combo;
		const m = multiplier();
		if (label) floatText(x, y, label);
		else if (combo >= 2) floatText(x, y, `${combo}x`);
		if (combo > 0 && combo % 4 === 0) audio.combo(combo);
		return m;
	}
	function collectCoin(c) {
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
		hitstop = reducedMotion ? .02 : .09;
		trauma = Math.min(1, trauma + .85);
		flash = .8;
		audio.crash();
		burst(player.x + player.w / 2, player.y + player.h * .5, 22, "#ede8dc", "shard", 260);
		burst(player.x + player.w / 2, player.y + player.h, 10, "#c45c4a", "dust", 140);
		if (score > highScore) {
			highScore = Math.floor(score);
			isNewHigh = true;
			writeSave({
				version: 1,
				highScore,
				muted
			});
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
			player.squashX = .78;
			player.squashY = 1.28;
			burst(player.x + player.w / 2, layout.groundY, 6, "#c5cdd6", "dust", 90);
			audio.jump();
		} else player.jumpBuffer = JUMP_BUFFER;
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
		player.squashY = .72;
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
		player.squashX = .9;
		player.squashY = 1.12;
	}
	function hitbox() {
		const insetX = 6 * layout.u;
		const insetY = player.sliding ? 2 * layout.u : 6 * layout.u;
		return {
			x: player.x + insetX,
			y: player.y + insetY,
			w: player.w - insetX * 2,
			h: player.h - insetY
		};
	}
	function stepPhysics(dt) {
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
					player.squashY = .72;
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
			player.x -= speed * .15 * dt;
			player.rot += 3.2 * dt;
			player.deathT += dt;
			const floor = layout.groundY - player.h * .4;
			if (player.y > floor) {
				player.y = floor;
				player.vy *= -.35;
				player.rot = Math.min(player.rot, 1.15);
			}
		}
		if (!player.dead && player.sliding) {
			player.slideT -= dt;
			if (player.slideT <= 0 && !player.wantSlide) endSlide();
		}
		player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
		player.slideBuffer = Math.max(0, player.slideBuffer - dt);
		const targetX = player.grounded && !player.sliding ? 1 : player.vy < 0 ? .82 : 1.08;
		const targetY = player.grounded && !player.sliding ? 1 : player.vy < 0 ? 1.18 : .9;
		player.squashX += (targetX - player.squashX) * (1 - Math.exp(-12 * dt));
		player.squashY += (targetY - player.squashY) * (1 - Math.exp(-12 * dt));
		if (player.grounded && !player.sliding && !player.dead) player.runPhase += dt * (8 + speed / Math.max(1, layout.baseSpeed) * 4);
		if (!wasGrounded && player.grounded && !player.dead) {}
	}
	function stepWorld(dt) {
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
					burst(player.x + player.w, player.y + player.h * .4, 6, "#d7dde3", "spark", 100);
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
			if (aabb(hb.x, hb.y, hb.w, hb.h, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)) collectCoin(c);
		}
		maybeSpawn();
	}
	function stepFx(dt) {
		trauma = Math.max(0, trauma - dt * 2.4);
		flash = Math.max(0, flash - dt * 3.2);
		if (comboT > 0) {
			comboT -= dt;
			if (comboT <= 0) combo = 0;
		}
		const neckX = player.x + player.w * .42;
		const neckY = player.y + player.h * (player.sliding ? .42 : .28);
		scarf[0].x = neckX;
		scarf[0].y = neckY;
		for (let i = 1; i < scarf.length; i++) {
			const prev = scarf[i - 1];
			const cur = scarf[i];
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
	function step(dt) {
		if (phase === "title") {
			speed = layout.baseSpeed * .32;
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
			const move = speed * .25 * dt;
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
		const scaleU = next.u / Math.max(.001, layout.u);
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
	function view() {
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
			skyline
		};
	}
	function frame(ts) {
		if (!running) return;
		if (!lastTs) lastTs = ts;
		let dt = (ts - lastTs) / 1e3;
		lastTs = ts;
		if (dt > .1) dt = .1;
		const inputState = input.sample();
		player.wantSlide = inputState.slideHeld;
		if (phase === "title") {
			if (inputState.startPressed) beginRun();
		} else if (phase === "over") {
			if (inputState.startPressed && player.deathT > .55) beginRun();
		} else if (phase === "playing") {
			if (startLock > 0) startLock -= dt;
			if (inputState.jumpPressed && startLock <= 0) tryJump();
			if (inputState.slidePressed || inputState.slideHeld && !player.sliding && player.grounded) startSlide();
			if (!inputState.slideHeld && player.sliding && player.slideT < .12) endSlide();
		}
		if (hitstop > 0) hitstop -= dt;
		else {
			acc += dt;
			const maxMove = 12 * layout.u;
			while (acc >= STEP) {
				if ((speed * STEP > maxMove && phase === "playing" ? STEP / 2 : STEP) !== STEP) {
					step(STEP / 2);
					step(STEP / 2);
				} else step(STEP);
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
	const handle = {
		start() {
			beginRun();
		},
		restart() {
			beginRun();
		},
		setMuted(next) {
			muted = next;
			audio.setMuted(next);
			writeSave({
				version: 1,
				highScore,
				muted
			});
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
		}
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
var INITIAL = {
	phase: "title",
	score: 0,
	highScore: 0,
	combo: 0,
	multiplier: 1,
	distance: 0,
	speedRatio: 0,
	muted: false,
	isNewHigh: false,
	peakCombo: 0
};
function formatScore(n) {
	return n.toLocaleString("en-US");
}
function GameView() {
	const canvasRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(INITIAL);
	(0, import_react.useEffect)(() => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "absolute inset-0 h-full w-full touch-none",
			style: { touchAction: "none" },
			"aria-label": "Stride rooftop runner"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-none absolute inset-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-w-0",
						children: playing || over ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium tracking-wide text-muted uppercase",
								children: "Score"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold tabular-nums text-2xl leading-tight tracking-tight sm:text-3xl",
								children: formatScore(hud.score)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-subtle tabular-nums",
								children: [formatScore(hud.distance), " m"]
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-[0.22em] text-muted uppercase",
							children: "Rooftop runner"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [playing && hud.combo >= 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-md border border-border bg-surface/80 px-3 py-1.5 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-medium tracking-wide text-muted uppercase",
								children: "Combo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-semibold tabular-nums text-lg leading-none",
								children: [hud.combo, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-1 text-xs text-muted",
									children: [hud.multiplier.toFixed(1), "x"]
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							"data-ui": true,
							variant: "ghost",
							size: "icon",
							className: "pointer-events-auto",
							"aria-label": hud.muted ? "Unmute" : "Mute",
							onClick: () => gameRef.current?.setMuted(!hud.muted),
							children: hud.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {})
						})]
					})]
				}),
				title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 z-10 flex items-center justify-center px-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "overlay-enter pointer-events-auto flex w-full max-w-md flex-col items-center text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium tracking-[0.28em] text-muted uppercase",
								children: "Dusk courier"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-3 text-6xl font-semibold tracking-[-0.05em] text-fg sm:text-7xl text-balance",
								children: "Stride"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 max-w-sm text-sm leading-relaxed text-muted text-pretty",
								children: "Jump and slide the rooftops. Near-misses chain into combos. The city only gets faster."
							}),
							hud.highScore > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 text-xs font-medium tabular-nums text-subtle",
								children: ["Best ", formatScore(hud.highScore)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								"data-ui": true,
								size: "lg",
								className: "mt-8 min-w-44",
								onClick: () => gameRef.current?.start(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {}), "Run"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-6 text-xs text-subtle",
								children: "Tap or Space to jump · Down or swipe to slide"
							})
						]
					})
				}),
				over && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 z-10 flex items-center justify-center bg-bg/40 px-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "modal-enter pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium tracking-[0.22em] text-muted uppercase",
								children: hud.isNewHigh ? "New best" : "Run over"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-2 text-3xl font-semibold tracking-tight text-balance",
								children: hud.isNewHigh ? "You set the line" : "Out of stride"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
								className: "mt-6 grid grid-cols-2 gap-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs text-muted",
										children: "Score"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1 font-semibold tabular-nums text-2xl",
										children: formatScore(hud.score)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs text-muted",
										children: "Best"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1 font-semibold tabular-nums text-2xl",
										children: formatScore(hud.highScore)
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs text-muted",
										children: "Distance"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
										className: "mt-1 font-medium tabular-nums",
										children: [formatScore(hud.distance), " m"]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
										className: "text-xs text-muted",
										children: "Peak combo"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
										className: "mt-1 font-medium tabular-nums",
										children: hud.peakCombo
									})] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								"data-ui": true,
								size: "lg",
								className: "mt-8 w-full",
								onClick: () => gameRef.current?.restart(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}), "Run again"]
							})
						]
					})
				}),
				playing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden text-xs text-subtle sm:block",
						children: "Space jump · Down slide"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						"data-ui": true,
						type: "button",
						className: "pointer-events-auto ml-auto flex size-16 items-center justify-center rounded-xl border border-border bg-surface/90 text-fg shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:size-14",
						"aria-label": "Slide",
						onPointerDown: (e) => {
							e.preventDefault();
							e.currentTarget.setPointerCapture(e.pointerId);
							gameRef.current?.setSlideHeld(true);
						},
						onPointerUp: () => gameRef.current?.setSlideHeld(false),
						onPointerCancel: () => gameRef.current?.setSlideHeld(false),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-7" })
					})]
				})
			]
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameView, {});
}
//#endregion
export { Home as component };
