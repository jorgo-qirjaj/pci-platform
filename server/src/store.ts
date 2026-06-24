import fs from 'fs';
import path from 'path';
import { Case } from './types';
import { SEED_CASES } from './seed';

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

interface StoreShape {
  cases: Case[];
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

class Store {
  private cases: Case[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) as StoreShape;
        this.cases = raw.cases ?? clone(SEED_CASES);
      } else {
        this.cases = clone(SEED_CASES);
        this.persist();
      }
    } catch {
      this.cases = clone(SEED_CASES);
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(STORE_FILE, JSON.stringify({ cases: this.cases }, null, 2));
    } catch (err) {
      // Persistence is best-effort; the in-memory store remains authoritative.
      console.warn('[store] could not persist:', (err as Error).message);
    }
  }

  /** Reset back to seed data (used by the demo reset endpoint). */
  reset() {
    this.cases = clone(SEED_CASES);
    this.persist();
  }

  list(): Case[] {
    return clone(this.cases);
  }

  get(accession: string): Case | undefined {
    const found = this.cases.find((c) => c.accession === accession);
    return found ? clone(found) : undefined;
  }

  update(accession: string, patch: Partial<Case>): Case | undefined {
    const idx = this.cases.findIndex((c) => c.accession === accession);
    if (idx === -1) return undefined;
    this.cases[idx] = { ...this.cases[idx], ...patch };
    this.persist();
    return clone(this.cases[idx]);
  }

  create(c: Case): Case {
    this.cases.unshift(c);
    this.persist();
    return clone(c);
  }

  /** Next accession number in the PCI-YYYY-NNNNN sequence. */
  nextAccession(): string {
    const year = 2026;
    const nums = this.cases
      .map((c) => parseInt(c.accession.split('-').pop() || '0', 10))
      .filter((n) => !Number.isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `PCI-${year}-${String(next).padStart(5, '0')}`;
  }
}

export const store = new Store();
