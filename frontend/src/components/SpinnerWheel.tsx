import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playTick } from '../services/sounds';
import type { SpinEasing } from '../services/settings';
import type { WheelEntry } from '../services/storage';

const LARGE_LIST_THRESHOLD = 50; // Show name-at-pointer overlay when segment count exceeds this

// ─── Easing functions ──────────────────────────────────
function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4); }
function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

const EASING_FNS: Record<SpinEasing, (t: number) => number> = {
  cubic: easeOutCubic,
  quart: easeOutQuart,
  expo: easeOutExpo,
};

const PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
  '#F1948A', '#AED6F1', '#D7BDE2', '#A3E4D7',
];

/**
 * Assign colors so no two adjacent segments (including wrap-around) share the same color.
 * Uses a greedy approach: for each segment, pick the next palette color that differs
 * from its neighbor(s). For the last segment, also avoids the first segment's color.
 */
export function assignColors(count: number): string[] {
  if (count === 0) return [];
  if (count === 1) return [PALETTE[0]];

  const result: string[] = [PALETTE[0]];
  let paletteIdx = 1;

  for (let i = 1; i < count; i++) {
    const prev = result[i - 1];
    const isLast = i === count - 1;
    const first = result[0];

    // Find a palette color that differs from the previous (and from first if last segment)
    let attempts = 0;
    while (attempts < PALETTE.length) {
      const candidate = PALETTE[paletteIdx % PALETTE.length];
      paletteIdx++;
      if (candidate !== prev && (!isLast || count <= 2 || candidate !== first)) {
        result.push(candidate);
        break;
      }
      attempts++;
    }
    // Fallback (shouldn't happen with 16 colors): just push next color
    if (result.length <= i) {
      result.push(PALETTE[paletteIdx % PALETTE.length]);
      paletteIdx++;
    }
  }
  return result;
}

/** Compute cumulative angles for weighted segments. */
function computeSliceAngles(entries: WheelEntry[]): { sliceAngles: number[]; cumAngles: number[] } {
  const totalWeight = entries.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  const sliceAngles = entries.map(e => ((e.weight ?? 1) / totalWeight) * Math.PI * 2);
  const cumAngles: number[] = [];
  let cum = 0;
  for (const a of sliceAngles) {
    cum += a;
    cumAngles.push(cum);
  }
  return { sliceAngles, cumAngles };
}

/** Find which segment a given angle falls into (given cumulative angles). */
function segmentAtAngle(relAngle: number, cumAngles: number[]): number {
  for (let i = 0; i < cumAngles.length; i++) {
    if (relAngle < cumAngles[i]) return i;
  }
  return cumAngles.length - 1;
}

type Props = {
  names: WheelEntry[];
  onSpinComplete: (id: string) => void;
  spinning: boolean;
  onSpinStart: () => void;
  targetId: string | null;
  spinDuration?: number;       // seconds (default 4)
  spinEasing?: SpinEasing;     // easing preset (default 'cubic')
  idleSpin?: boolean;          // gentle idle rotation (default false)
  manualStop?: boolean;        // show stop button during spin (default false)
  onManualStop?: (winnerId: string) => void; // called when manual stop resolves
};

export default function SpinnerWheel({
  names, onSpinComplete, spinning, onSpinStart, targetId,
  spinDuration = 4, spinEasing = 'cubic', idleSpin = false,
  manualStop = false, onManualStop,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  // Random starting angle so the wheel doesn't always begin at the same position
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const lastPegIndexRef = useRef(-1);
  // Stable refs to prevent animation effect restart mid-spin
  const onSpinCompleteRef = useRef(onSpinComplete);
  onSpinCompleteRef.current = onSpinComplete;
  const onManualStopRef = useRef(onManualStop);
  onManualStopRef.current = onManualStop;
  const namesRef = useRef(names);
  namesRef.current = names;
  // Manual stop flag — when true, the animation effect switches to deceleration
  const stopRequestedRef = useRef(false);

  // Cached canvas dimensions — updated on mount and resize only (not every frame).
  const dimensionsRef = useRef<{ w: number; h: number; dpr: number } | null>(null);

  useEffect(() => {
    function updateDimensions() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      dimensionsRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Compute colors once per name-count change — ensures no adjacent segments share a color
  const segmentColors = useMemo(() => assignColors(names.length), [names.length]);

  // Precompute slice angles for weighted segments
  const { sliceAngles, cumAngles } = useMemo(() => computeSliceAngles(names), [names]);

  // Large list: track which name is under the pointer
  const [nameAtPointer, setNameAtPointer] = useState('');
  const isLargeList = names.length >= LARGE_LIST_THRESHOLD;
  const nameAtPointerRef = useRef('');

  const draw = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dims = dimensionsRef.current;
    if (!dims) return;
    const { w, h, dpr } = dims;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 10;

    ctx.clearRect(0, 0, w, h);

    // Dark circular backdrop for visual contrast (WoN style)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    ctx.restore();

    if (names.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#888';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add names to spin!', cx, cy);
      return;
    }

    // Draw weighted segments
    let cumAngle = 0;
    for (let i = 0; i < names.length; i++) {
      const segAngle = sliceAngles[i];
      const startAngle = rotation + cumAngle;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      // Per-entry color override, then palette color, then fallback
      ctx.fillStyle = names[i].color || segmentColors[i] || PALETTE[i % PALETTE.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Skip text labels for large lists
      if (names.length < LARGE_LIST_THRESHOLD) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + segAngle / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333';
        ctx.font = `bold ${Math.min(16, 300 / names.length)}px Arial`;
        const maxTextWidth = radius - 30;
        // Use displayLabel if available, otherwise name
        let label = names[i].displayLabel || names[i].name;
        while (ctx.measureText(label).width > maxTextWidth && label.length > 1) {
          label = label.slice(0, -1);
        }
        const fullLabel = names[i].displayLabel || names[i].name;
        if (label !== fullLabel) label += '\u2026';
        ctx.fillText(label, radius - 15, 0);
        ctx.restore();
      }

      cumAngle += segAngle;
    }

    // Pegs between segments on the rim
    cumAngle = 0;
    for (let i = 0; i < names.length; i++) {
      const pegAngle = rotation + cumAngle;
      const pegX = cx + Math.cos(pegAngle) * (radius - 2);
      const pegY = cy + Math.sin(pegAngle) * (radius - 2);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      cumAngle += sliceAngles[i];
    }

    // Center circle — acts as SPIN button
    const centerRadius = 30;
    ctx.beginPath();
    ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2);
    const centerGrad = ctx.createRadialGradient(cx, cy - 5, 0, cx, cy, centerRadius);
    centerGrad.addColorStop(0, '#fff');
    centerGrad.addColorStop(1, '#e8e8e8');
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // "SPIN" text in center
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', cx, cy);

    // Pointer arrow (top, pointing down)
    const pointerX = cx;
    const pointerY = cy - radius - 2;
    ctx.beginPath();
    ctx.moveTo(pointerX, pointerY + 18);
    ctx.lineTo(pointerX - 12, pointerY);
    ctx.lineTo(pointerX + 12, pointerY);
    ctx.closePath();
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Compute which name is under the pointer (pointer is at -PI/2 = top)
    if (names.length >= LARGE_LIST_THRESHOLD) {
      const pointerAngle = -Math.PI / 2;
      const relAngle = ((pointerAngle - rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const idx = segmentAtAngle(relAngle, cumAngles);
      const newName = names[idx]?.name || '';
      if (newName !== nameAtPointerRef.current) {
        nameAtPointerRef.current = newName;
        setNameAtPointer(newName);
      }
    }
  }, [names, segmentColors, sliceAngles, cumAngles]);

  const drawRef = useRef(draw);
  drawRef.current = draw;

  // Click handler for canvas — clicking the wheel triggers spin
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (spinning || names.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy) - 10;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (dist <= radius) {
      onSpinStart();
    }
  }, [spinning, names.length, onSpinStart]);

  // Redraw wheel when names change (non-animated)
  useEffect(() => {
    draw(angleRef.current);
  }, [draw]);

  // Animation effect — depends ONLY on spinning + targetId.
  useEffect(() => {
    if (!spinning || !targetId) return;

    const currentNames = namesRef.current;
    const currentDraw = drawRef.current;
    if (currentNames.length === 0) return;

    const targetIndex = currentNames.findIndex(n => n.id === targetId);
    if (targetIndex === -1) return;

    // Weighted slice angles for animation
    const { sliceAngles: animSlices, cumAngles: animCum } = computeSliceAngles(currentNames);
    const midOfTarget = (animCum[targetIndex] - animSlices[targetIndex] / 2);
    const extraSpins = 5 + Math.random() * 3;
    const targetAngle = -Math.PI / 2 - midOfTarget - extraSpins * Math.PI * 2;

    const startAngle = angleRef.current;
    const totalRotation = targetAngle - startAngle;
    const duration = spinDuration * 1000 * (0.875 + Math.random() * 0.25);
    const startTime = performance.now();
    lastPegIndexRef.current = -1;
    stopRequestedRef.current = false;
    const easeFn = EASING_FNS[spinEasing] || easeOutCubic;

    // Precompute cumulative peg positions for weighted tick detection
    const pegCum = animCum.map(a => a / (Math.PI * 2));

    function animate(now: number) {
      // Manual stop: find segment at pointer, decelerate to its center
      if (stopRequestedRef.current) {
        stopRequestedRef.current = false;
        const pointerAngle = -Math.PI / 2;
        const curAngle = angleRef.current;
        const relAngle = ((pointerAngle - curAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const stopIdx = segmentAtAngle(relAngle, animCum);
        const stopMid = (animCum[stopIdx] - animSlices[stopIdx] / 2);
        const snapAngle = -Math.PI / 2 - stopMid;
        // Compute how much rotation to reach the snap — find nearest equivalent
        const diff = snapAngle - curAngle;
        const snapTarget = curAngle + diff - Math.ceil(diff / (Math.PI * 2)) * Math.PI * 2;

        const snapStart = performance.now();
        const snapDuration = 500;
        const snapStartAngle = curAngle;
        const snapRotation = snapTarget - curAngle;

        function snapAnimate(snapNow: number) {
          const st = Math.min((snapNow - snapStart) / snapDuration, 1);
          const se = easeOutCubic(st);
          const a = snapStartAngle + snapRotation * se;
          angleRef.current = a;
          currentDraw(a);
          if (st < 1) {
            animRef.current = requestAnimationFrame(snapAnimate);
          } else {
            const handler = onManualStopRef.current || onSpinCompleteRef.current;
            handler(currentNames[stopIdx].id);
          }
        }
        animRef.current = requestAnimationFrame(snapAnimate);
        return;
      }

      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeFn(t);
      const currentAngle = startAngle + totalRotation * eased;

      // Tick sound: detect when a peg crosses the pointer
      if (currentNames.length > 0) {
        const norm = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const fracPos = norm / (Math.PI * 2);
        let pegIndex = 0;
        for (let i = 0; i < pegCum.length; i++) {
          if (fracPos < pegCum[i]) { pegIndex = i; break; }
          pegIndex = i + 1;
        }
        if (pegIndex !== lastPegIndexRef.current) {
          lastPegIndexRef.current = pegIndex;
          playTick();
        }
      }

      angleRef.current = currentAngle;
      currentDraw(currentAngle);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        onSpinCompleteRef.current(currentNames[targetIndex].id);
      }
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [spinning, targetId, spinDuration, spinEasing]);

  // Manual stop handler
  const handleStop = useCallback(() => {
    if (spinning) {
      stopRequestedRef.current = true;
    }
  }, [spinning]);

  // Idle spin: gentle constant rotation when not spinning
  useEffect(() => {
    if (!idleSpin || spinning) return;
    let rafId = 0;
    let lastTime = performance.now();
    const IDLE_SPEED = 0.15; // radians per second

    function idleAnimate(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      angleRef.current += IDLE_SPEED * dt;
      drawRef.current(angleRef.current);
      rafId = requestAnimationFrame(idleAnimate);
    }
    rafId = requestAnimationFrame(idleAnimate);
    return () => cancelAnimationFrame(rafId);
  }, [idleSpin, spinning]);

  return (
    <div className="spinner-container">
      {/* Large list overlay: show name at pointer */}
      {isLargeList && nameAtPointer && (
        <div className="pointer-name-overlay">{nameAtPointer}</div>
      )}
      <canvas
        ref={canvasRef}
        className="spinner-canvas"
        onClick={handleCanvasClick}
        style={{ cursor: spinning || names.length === 0 ? 'default' : 'pointer' }}
      />
      <div className="spin-buttons">
        {spinning && manualStop ? (
          <button className="spin-button stop-button" onClick={handleStop}>
            STOP!
          </button>
        ) : (
          <button
            className="spin-button"
            onClick={onSpinStart}
            disabled={spinning || names.length === 0}
            title="Ctrl+Enter"
          >
            {spinning ? 'Spinning...' : 'SPIN!'}
          </button>
        )}
      </div>
    </div>
  );
}
