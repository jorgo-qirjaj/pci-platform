import { z } from 'zod';
import type { Response } from 'express';

// Request schemas. Keep these the single source of truth for what each endpoint accepts;
// strings are length-bounded so a client can't push unbounded input into the store.

export const LoginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export const CreateCaseSchema = z.object({
  biomarker: z.enum(['p53', 'PDL1', 'HER2', 'MMR']),
  site: z.string().trim().max(200).optional(),
  specimen: z.string().trim().max(200).optional(),
});

export const ScoreBodySchema = z.object({
  regionId: z.string().trim().max(100).optional(),
});

// Shape a decoded JWT must have before we trust it (closes M8 — no blind cast).
export const TokenPayloadSchema = z.object({
  email: z.string().min(1),
  name: z.string(),
  role: z.string(),
  initials: z.string(),
  labId: z.string().min(1),
});

/**
 * Validate `data` against `schema`. On success returns the parsed value; on failure
 * writes a 400 with per-field issues and returns null — callers do `if (!v) return;`.
 */
export function parseBody<T>(schema: z.ZodType<T>, data: unknown, res: Response): T | null {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  res.status(400).json({
    error: 'Invalid request',
    issues: result.error.issues.map((i) => ({ field: i.path.join('.') || '(body)', message: i.message })),
  });
  return null;
}
