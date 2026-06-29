import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Cases are stored as a JSON document (`data`) plus a few promoted columns we filter on
 * (lab, status, biomarker, site). This keeps the rich nested Case model intact while giving
 * indexed lookups and atomic, transactional writes — the fix for the JSON-store corruption risk.
 */
export const casesTable = sqliteTable('cases', {
  accession: text('accession').primaryKey(),
  labId: text('lab_id').notNull(),
  status: text('status').notNull(),
  biomarker: text('biomarker').notNull(),
  site: text('site').notNull(),
  data: text('data').notNull(),
});

/** Append-only audit trail of clinical actions. Operator + case identity only — no patient PHI. */
export const auditTable = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  at: text('at').notNull(),
  actor: text('actor').notNull(),
  labId: text('lab_id').notNull(),
  action: text('action').notNull(),
  accession: text('accession'),
  detail: text('detail'),
});
