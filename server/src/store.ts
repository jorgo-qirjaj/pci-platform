import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, desc, eq } from 'drizzle-orm';
import { AuditEntry, Case } from './types';
import { SEED_CASES, PRIMARY_LAB_ID } from './seed';
import { auditTable, casesTable } from './schema';

// SQLite database file. ':memory:' (tests) keeps everything in-process. Overridable for deploys.
const DB_FILE = process.env.PCI_DB_FILE || path.join(__dirname, '..', 'data', 'pci.db');
// A pre-SQLite JSON store, imported once on first run so existing data isn't lost.
const LEGACY_JSON = process.env.PCI_STORE_FILE || path.join(__dirname, '..', 'data', 'store.json');

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** Backfill fields added after older data was written (opaque id, labId, slide magnification). */
function backfill(c: Case): Case {
  return {
    ...c,
    id: c.id || randomUUID(),
    labId: c.labId || PRIMARY_LAB_ID,
    slide: { ...c.slide, magnification: c.slide?.magnification ?? (c.biomarker === 'PDL1' ? 20 : 40) },
  };
}

class Store {
  private sqlite: Database.Database;
  private db: BetterSQLite3Database;

  constructor() {
    if (DB_FILE !== ':memory:') {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    this.sqlite = new Database(DB_FILE);
    if (DB_FILE !== ':memory:') this.sqlite.pragma('journal_mode = WAL'); // safer concurrent writes
    this.sqlite.exec(
      `CREATE TABLE IF NOT EXISTS cases (
        accession TEXT PRIMARY KEY,
        lab_id    TEXT NOT NULL,
        status    TEXT NOT NULL,
        biomarker TEXT NOT NULL,
        site      TEXT NOT NULL,
        data      TEXT NOT NULL
      )`,
    );
    this.sqlite.exec(
      `CREATE TABLE IF NOT EXISTS audit_log (
        id        TEXT PRIMARY KEY,
        at        TEXT NOT NULL,
        actor     TEXT NOT NULL,
        lab_id    TEXT NOT NULL,
        action    TEXT NOT NULL,
        accession TEXT,
        detail    TEXT
      )`,
    );
    this.db = drizzle(this.sqlite);
    if (this.count() === 0) this.seedOrImport();
  }

  private count(): number {
    return (this.sqlite.prepare('SELECT COUNT(*) AS n FROM cases').get() as { n: number }).n;
  }

  /** Atomic bulk upsert — the whole batch lands in one transaction (no partial/corrupt state). */
  private upsertAll(cases: Case[]) {
    const stmt = this.sqlite.prepare(
      `INSERT INTO cases (accession, lab_id, status, biomarker, site, data) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(accession) DO UPDATE SET
         lab_id=excluded.lab_id, status=excluded.status, biomarker=excluded.biomarker,
         site=excluded.site, data=excluded.data`,
    );
    const tx = this.sqlite.transaction((rows: Case[]) => {
      for (const c of rows) stmt.run(c.accession, c.labId, c.status, c.biomarker, c.site, JSON.stringify(c));
    });
    tx(cases);
  }

  /** First-run population: import a legacy JSON store (with backfill) if present, else seed. */
  private seedOrImport() {
    try {
      if (fs.existsSync(LEGACY_JSON)) {
        const raw = JSON.parse(fs.readFileSync(LEGACY_JSON, 'utf8')) as { cases?: Case[] };
        if (raw.cases?.length) {
          this.upsertAll(raw.cases.map(backfill));
          return;
        }
      }
    } catch {
      /* unreadable legacy store — fall through to seed */
    }
    this.upsertAll(clone(SEED_CASES));
  }

  /** Reset back to seed data (demo reset endpoint). Clears the audit trail too (dev-only). */
  reset() {
    this.sqlite.exec('DELETE FROM cases');
    this.sqlite.exec('DELETE FROM audit_log');
    this.upsertAll(clone(SEED_CASES));
  }

  /** Writes are durable per transaction; kept for the graceful-shutdown contract. */
  flush() {
    /* no buffered state */
  }

  /** Append an audit record (append-only). Best-effort: a logging failure never blocks the action. */
  appendAudit(entry: AuditEntry) {
    try {
      this.sqlite
        .prepare('INSERT INTO audit_log (id, at, actor, lab_id, action, accession, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(entry.id, entry.at, entry.actor, entry.labId, entry.action, entry.accession ?? null, entry.detail ?? null);
    } catch (err) {
      console.warn('[audit] failed to record entry:', (err as Error).message);
    }
  }

  /** Audit entries for a lab (newest first), optionally scoped to one case. */
  listAudit(labId: string, opts: { accession?: string; limit?: number } = {}): AuditEntry[] {
    const where = opts.accession
      ? and(eq(auditTable.labId, labId), eq(auditTable.accession, opts.accession))
      : eq(auditTable.labId, labId);
    const rows = this.db
      .select()
      .from(auditTable)
      .where(where)
      .orderBy(desc(auditTable.at))
      .limit(Math.min(opts.limit ?? 200, 1000))
      .all();
    return rows.map((r) => ({
      id: r.id,
      at: r.at,
      actor: r.actor,
      labId: r.labId,
      action: r.action as AuditEntry['action'],
      accession: r.accession ?? undefined,
      detail: r.detail ?? undefined,
    }));
  }

  list(): Case[] {
    const rows = this.db.select().from(casesTable).all();
    // Newest accession first (mirrors the previous insert-at-front ordering).
    return rows.map((r) => JSON.parse(r.data) as Case).sort((a, b) => (a.accession < b.accession ? 1 : -1));
  }

  get(accession: string): Case | undefined {
    const row = this.db.select().from(casesTable).where(eq(casesTable.accession, accession)).get();
    return row ? (JSON.parse(row.data) as Case) : undefined;
  }

  create(c: Case): Case {
    this.upsertAll([c]);
    return clone(c);
  }

  update(accession: string, patch: Partial<Case>): Case | undefined {
    const current = this.get(accession);
    if (!current) return undefined;
    const updated = { ...current, ...patch };
    this.upsertAll([updated]);
    return clone(updated);
  }

  /** Next accession number in the PCI-YYYY-NNNNN sequence. */
  nextAccession(): string {
    const year = 2026;
    const rows = this.sqlite.prepare('SELECT accession FROM cases').all() as { accession: string }[];
    const nums = rows
      .map((r) => parseInt(r.accession.split('-').pop() || '0', 10))
      .filter((n) => !Number.isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `PCI-${year}-${String(next).padStart(5, '0')}`;
  }
}

export const store = new Store();
