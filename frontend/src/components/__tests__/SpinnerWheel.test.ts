import { describe, it, expect } from 'vitest';
import { assignColors } from '../SpinnerWheel';

// ─── assignColors ───────────────────────────────────────

describe('assignColors', () => {
  it('returns empty array for 0 segments', () => {
    expect(assignColors(0)).toEqual([]);
  });

  it('returns single color for 1 segment', () => {
    const colors = assignColors(1);
    expect(colors).toHaveLength(1);
  });

  it('returns correct number of colors', () => {
    for (const n of [2, 3, 5, 8, 16, 20, 50]) {
      expect(assignColors(n)).toHaveLength(n);
    }
  });

  it('no two adjacent segments share the same color', () => {
    for (const n of [2, 3, 4, 5, 8, 16, 20, 50, 100]) {
      const colors = assignColors(n);
      for (let i = 0; i < colors.length - 1; i++) {
        expect(colors[i]).not.toBe(colors[i + 1]);
      }
    }
  });

  it('first and last segments differ for count >= 3', () => {
    for (const n of [3, 4, 5, 8, 16, 20, 50]) {
      const colors = assignColors(n);
      expect(colors[0]).not.toBe(colors[colors.length - 1]);
    }
  });
});

// ─── Spin target angle / segment consistency ────────────

describe('spin target angle math', () => {
  // Reproduce the exact math from SpinnerWheel animation effect
  function computeTargetAngle(targetIndex: number, totalNames: number, extraSpins: number) {
    const sliceAngle = (Math.PI * 2) / totalNames;
    return -Math.PI / 2 - (targetIndex * sliceAngle + sliceAngle / 2) - extraSpins * Math.PI * 2;
  }

  // Reproduce the pointer-to-segment math from draw()
  function segmentAtPointer(rotation: number, totalNames: number): number {
    const sliceAngle = (Math.PI * 2) / totalNames;
    const pointerAngle = -Math.PI / 2;
    const relAngle = ((pointerAngle - rotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    return Math.floor(relAngle / sliceAngle) % totalNames;
  }

  it('target angle lands pointer on correct segment for all indices', () => {
    const counts = [2, 3, 5, 8, 16, 50, 100];
    for (const n of counts) {
      for (let targetIndex = 0; targetIndex < n; targetIndex++) {
        const extraSpins = 5; // fixed for determinism
        const targetAngle = computeTargetAngle(targetIndex, n, extraSpins);
        const landedSegment = segmentAtPointer(targetAngle, n);
        expect(landedSegment).toBe(targetIndex);
      }
    }
  });

  it('target angle is consistent with varying extra spins', () => {
    const n = 8;
    for (let targetIndex = 0; targetIndex < n; targetIndex++) {
      for (const extraSpins of [3, 5, 7, 10, 20]) {
        const targetAngle = computeTargetAngle(targetIndex, n, extraSpins);
        const landedSegment = segmentAtPointer(targetAngle, n);
        expect(landedSegment).toBe(targetIndex);
      }
    }
  });

  it('easeOutCubic reaches exactly 1.0 at t=1', () => {
    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
  });

  it('200 consecutive deterministic spins all land on correct segment', () => {
    const names = ['Abby', 'Bess', 'Collin', 'Della', 'Emmett', 'Finn', 'Greer', 'Holly'];
    const n = names.length;

    for (let spin = 0; spin < 200; spin++) {
      const targetIndex = spin % n; // cycle through all names
      const extraSpins = 5 + (spin % 4); // vary extra rotations
      const targetAngle = computeTargetAngle(targetIndex, n, extraSpins);
      const landedSegment = segmentAtPointer(targetAngle, n);

      expect(landedSegment).toBe(targetIndex);
    }
  });
});
