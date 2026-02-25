import { useCallback, useEffect, useRef } from 'react';
import { playTick } from '../services/sounds';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
  '#F1948A', '#AED6F1', '#D7BDE2', '#A3E4D7',
];

type Props = {
  names: { id: string; name: string }[];
  onSpinComplete: (id: string) => void;
  spinning: boolean;
  onSpinStart: () => void;
  targetId: string | null;
};

export default function SpinnerWheel({ names, onSpinComplete, spinning, onSpinStart, targetId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(0);
  const lastPegIndexRef = useRef(-1);
  // Stable refs to prevent animation effect restart mid-spin
  const onSpinCompleteRef = useRef(onSpinComplete);
  onSpinCompleteRef.current = onSpinComplete;
  const namesRef = useRef(names);
  namesRef.current = names;

  const draw = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
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

    const sliceAngle = (Math.PI * 2) / names.length;

    for (let i = 0; i < names.length; i++) {
      const startAngle = rotation + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#333';
      ctx.font = `bold ${Math.min(16, 300 / names.length)}px Arial`;
      const maxTextWidth = radius - 30;
      let label = names[i].name;
      while (ctx.measureText(label).width > maxTextWidth && label.length > 1) {
        label = label.slice(0, -1);
      }
      if (label !== names[i].name) label += '\u2026';
      ctx.fillText(label, radius - 15, 0);
      ctx.restore();
    }

    // Pegs between segments on the rim
    if (names.length > 0) {
      for (let i = 0; i < names.length; i++) {
        const pegAngle = rotation + i * sliceAngle;
        const pegX = cx + Math.cos(pegAngle) * (radius - 2);
        const pegY = cy + Math.sin(pegAngle) * (radius - 2);
        ctx.beginPath();
        ctx.arc(pegX, pegY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
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

    // Pointer arrow (top, pointing down — WoN style)
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
  }, [names]);

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
    // Only trigger on clicks within the wheel area
    if (dist <= radius) {
      onSpinStart();
    }
  }, [spinning, names.length, onSpinStart]);

  // Redraw wheel when names change (non-animated)
  useEffect(() => {
    draw(angleRef.current);
  }, [draw]);

  // Animation effect — depends ONLY on spinning + targetId.
  // names/draw/onSpinComplete are read from refs to prevent restart mid-spin.
  useEffect(() => {
    if (!spinning || !targetId) return;

    const currentNames = namesRef.current;
    const currentDraw = drawRef.current;
    if (currentNames.length === 0) return;

    const targetIndex = currentNames.findIndex(n => n.id === targetId);
    if (targetIndex === -1) return;

    const sliceAngle = (Math.PI * 2) / currentNames.length;
    const extraSpins = 5 + Math.random() * 3;
    // Align target segment with top pointer (-PI/2)
    const targetAngle = -Math.PI / 2 - (targetIndex * sliceAngle + sliceAngle / 2) - extraSpins * Math.PI * 2;

    const startAngle = angleRef.current;
    const totalRotation = targetAngle - startAngle;
    const duration = 3000 + Math.random() * 1000;
    const startTime = performance.now();
    lastPegIndexRef.current = -1;

    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      const currentAngle = startAngle + totalRotation * eased;

      // Tick sound: detect when a peg crosses the pointer (top, -PI/2)
      if (currentNames.length > 0) {
        const normalizedAngle = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const pegIndex = Math.floor(normalizedAngle / sliceAngle);
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
  }, [spinning, targetId]);

  return (
    <div className="spinner-container">
      <canvas
        ref={canvasRef}
        className="spinner-canvas"
        onClick={handleCanvasClick}
        style={{ cursor: spinning || names.length === 0 ? 'default' : 'pointer' }}
      />
      <button
        className="spin-button"
        onClick={onSpinStart}
        disabled={spinning || names.length === 0}
      >
        {spinning ? 'Spinning...' : 'SPIN!'}
      </button>
    </div>
  );
}
