import { useEffect, useRef } from 'react';
import { playCelebration } from '../services/sounds';

type Props = {
  winnerName: string;
  winnerColor?: string;  // segment color for accent
  onClose: () => void;   // keep on wheel
  onRemove: () => void;  // remove from wheel
};

// Lightweight canvas confetti
function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA'];

  type Particle = { x: number; y: number; vx: number; vy: number; w: number; h: number; color: string; rotation: number; rv: number; alpha: number };
  const particles: Particle[] = [];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: W / 2 + (Math.random() - 0.5) * 100,
      y: H / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.3,
      alpha: 1,
    });
  }

  let frame: number;
  function animate() {
    ctx!.clearRect(0, 0, W, H);
    let alive = false;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.rotation += p.rv;
      p.alpha -= 0.005;

      if (p.alpha <= 0) continue;
      alive = true;

      ctx!.save();
      ctx!.globalAlpha = p.alpha;
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx!.restore();
    }

    if (alive) {
      frame = requestAnimationFrame(animate);
    }
  }

  frame = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frame);
}

export default function WinnerDialog({ winnerName, winnerColor, onClose, onRemove }: Props) {
  const confettiRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    playCelebration();
    if (confettiRef.current) {
      const cleanup = launchConfetti(confettiRef.current);
      return cleanup;
    }
  }, []);

  return (
    <div className="winner-backdrop">
      <canvas ref={confettiRef} className="winner-confetti" />
      <div
        className="winner-card"
        style={winnerColor ? { borderTop: `4px solid ${winnerColor}` } : undefined}
      >
        <div className="winner-header">We have a winner!</div>
        <div className="winner-name" style={winnerColor ? { color: winnerColor } : undefined}>
          {winnerName}
        </div>
        <div className="winner-actions">
          <button className="btn btn-secondary-dark" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
