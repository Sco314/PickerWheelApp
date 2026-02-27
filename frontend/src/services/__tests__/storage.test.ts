// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  secureRandomIndex,
  getQuickSpin,
  setQuickSpinNames,
  pickRandomFromQuickSpin,
  pickRandomFromDraft,
  applyQuickSpinPick,
  quickSpinReset,
} from '../storage';

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});

// ─── secureRandomIndex ──────────────────────────────────

describe('secureRandomIndex', () => {
  it('returns 0 for length <= 0', () => {
    expect(secureRandomIndex(0)).toBe(0);
    expect(secureRandomIndex(-1)).toBe(0);
  });

  it('returns 0 for length 1', () => {
    for (let i = 0; i < 20; i++) {
      expect(secureRandomIndex(1)).toBe(0);
    }
  });

  it('always returns values in [0, length)', () => {
    for (const length of [2, 5, 8, 100, 1000]) {
      for (let i = 0; i < 50; i++) {
        const idx = secureRandomIndex(length);
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(length);
      }
    }
  });

  it('produces different values over many calls (not stuck)', () => {
    const values = new Set<number>();
    for (let i = 0; i < 100; i++) {
      values.add(secureRandomIndex(100));
    }
    // With 100 draws from [0,100), we should see at least 20 distinct values
    expect(values.size).toBeGreaterThan(20);
  });
});

// ─── pickRandomFromQuickSpin ────────────────────────────

describe('pickRandomFromQuickSpin', () => {
  it('returns null when no eligible entries', () => {
    setQuickSpinNames([]);
    expect(pickRandomFromQuickSpin()).toBeNull();
  });

  it('returns a valid SpinRecord with matching eligible entry', () => {
    setQuickSpinNames(['Alice', 'Bob', 'Charlie']);
    const qs = getQuickSpin();
    const record = pickRandomFromQuickSpin();

    expect(record).not.toBeNull();
    expect(qs.eligible).toContain(record!.entryId);
    const matchingItem = qs.items.find(i => i.id === record!.entryId);
    expect(matchingItem).toBeDefined();
    expect(record!.entryName).toBe(matchingItem!.name);
    expect(record!.removedFromPool).toBe(false);
    expect(record!.timestamp).toBeGreaterThan(0);
  });

  it('does not mutate storage (read-only pick)', () => {
    setQuickSpinNames(['Alice', 'Bob', 'Charlie']);
    const qsBefore = getQuickSpin();
    const eligibleBefore = [...qsBefore.eligible];

    pickRandomFromQuickSpin();

    const qsAfter = getQuickSpin();
    expect(qsAfter.eligible).toEqual(eligibleBefore);
    expect(qsAfter.picked).toEqual([]);
    expect(qsAfter.history).toEqual([]);
  });

  it('picks every entry at least once over 200 spins', () => {
    const names = ['Alice', 'Bob', 'Charlie', 'Della', 'Emmett'];
    setQuickSpinNames(names);
    const picked = new Set<string>();

    for (let i = 0; i < 200; i++) {
      const record = pickRandomFromQuickSpin();
      if (record) picked.add(record.entryName);
    }

    for (const name of names) {
      expect(picked.has(name)).toBe(true);
    }
  });
});

// ─── pickRandomFromDraft ────────────────────────────────

describe('pickRandomFromDraft', () => {
  it('returns null when eligible list is empty', () => {
    expect(pickRandomFromDraft('nonexistent', [])).toBeNull();
  });
});

// ─── applyQuickSpinPick + consistency ───────────────────

describe('spin apply + undo consistency', () => {
  it('removes winner from eligible after apply with removedFromPool=true', () => {
    setQuickSpinNames(['A', 'B', 'C']);
    const record = pickRandomFromQuickSpin()!;
    record.removedFromPool = true;
    applyQuickSpinPick(record);

    const qs = getQuickSpin();
    expect(qs.eligible).not.toContain(record.entryId);
    expect(qs.picked).toContain(record.entryId);
    expect(qs.history).toHaveLength(1);
  });

  it('keeps winner eligible after apply with removedFromPool=false', () => {
    setQuickSpinNames(['A', 'B', 'C']);
    const record = pickRandomFromQuickSpin()!;
    record.removedFromPool = false;
    applyQuickSpinPick(record);

    const qs = getQuickSpin();
    expect(qs.eligible).toContain(record.entryId);
    expect(qs.picked).not.toContain(record.entryId);
    expect(qs.history).toHaveLength(1);
  });

  it('reset restores all entries to eligible', () => {
    setQuickSpinNames(['A', 'B', 'C']);
    const qs0 = getQuickSpin();
    const allIds = [...qs0.eligible];

    // Pick and remove two entries
    const r1 = pickRandomFromQuickSpin()!;
    r1.removedFromPool = true;
    applyQuickSpinPick(r1);
    const r2 = pickRandomFromQuickSpin()!;
    r2.removedFromPool = true;
    applyQuickSpinPick(r2);

    quickSpinReset();

    const qsAfter = getQuickSpin();
    expect(qsAfter.eligible.sort()).toEqual(allIds.sort());
    expect(qsAfter.picked).toEqual([]);
    expect(qsAfter.history).toEqual([]);
  });
});
