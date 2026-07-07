import { getDb, generateId } from './schema.ts';
import { findEntities } from './entities.ts';

export type Fact = {
  id: string;
  subject_id: string;
  predicate: string;
  object: string;
  confidence: number;
  source: string | null;
  created_at: number;
  verified_at: number | null;
};

type FactRow = {
  id: string;
  subject_id: string;
  predicate: string;
  object: string;
  confidence: number;
  source: string | null;
  created_at: number;
  verified_at: number | null;
};

/**
 * Parse fact row from database
 */
function parseFact(row: FactRow): Fact {
  return { ...row };
}

/**
 * Create a new fact in the knowledge graph
 */
export function createFact(
  subject_id: string,
  predicate: string,
  object: string,
  opts?: { confidence?: number; source?: string }
): Fact {
  const db = getDb();
  const id = generateId();
  const now = Date.now();
  const confidence = opts?.confidence ?? 1.0;
  const source = opts?.source ?? null;

  const stmt = db.prepare(
    'INSERT INTO facts (id, subject_id, predicate, object, confidence, source, created_at, verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const objectStr = typeof object === 'string' ? object : JSON.stringify(object);
  stmt.run(id, subject_id, predicate, objectStr, confidence, source, now, null);

  return {
    id,
    subject_id,
    predicate,
    object,
    confidence,
    source,
    created_at: now,
    verified_at: null,
  };
}

/**
 * Get a fact by ID
 */
export function getFact(id: string): Fact | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM facts WHERE id = ?');
  const row = stmt.get(id) as FactRow | null;

  if (!row) return null;

  return parseFact(row);
}

/**
 * Find facts matching query criteria
 */
export function findFacts(query: {
  subject_id?: string;
  predicate?: string;
  object?: string;
}): Fact[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.subject_id) {
    conditions.push('subject_id = ?');
    params.push(query.subject_id);
  }

  if (query.predicate) {
    conditions.push('predicate = ?');
    params.push(query.predicate);
  }

  if (query.object) {
    conditions.push('object = ?');
    params.push(query.object);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const stmt = db.prepare(`SELECT * FROM facts ${where} ORDER BY created_at DESC`);
  const rows = stmt.all(...params as any[]) as FactRow[];

  return rows.map(parseFact);
}

/**
 * Query a fact by subject name and predicate
 * Example: "What is Anna's birthday?" → queryFact("Anna", "birthday")
 */
export function queryFact(subjectName: string, predicate: string): Fact | null {
  const entities = findEntities({ name: subjectName });

  if (entities.length === 0) return null;

  // Use the first matching entity
  const facts = findFacts({ subject_id: entities[0]!.id, predicate });

  return facts.length > 0 ? facts[0]! : null;
}

/**
 * Update a fact's properties
 */
export function updateFact(
  id: string,
  updates: Partial<Pick<Fact, 'predicate' | 'object' | 'confidence' | 'source'>>
): Fact | null {
  const db = getDb();
  const fact = getFact(id);
  if (!fact) return null;

  const fields: string[] = [];
  const params: unknown[] = [];

  if (updates.predicate !== undefined) {
    fields.push('predicate = ?');
    params.push(updates.predicate);
  }

  if (updates.object !== undefined) {
    fields.push('object = ?');
    params.push(updates.object);
  }

  if (updates.confidence !== undefined) {
    fields.push('confidence = ?');
    params.push(updates.confidence);
  }

  if (updates.source !== undefined) {
    fields.push('source = ?');
    params.push(updates.source);
  }

  if (fields.length === 0) return fact;

  params.push(id);

  const stmt = db.prepare(`UPDATE facts SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...params as any[]);

  return getFact(id);
}

/**
 * Delete a fact
 */
export function deleteFact(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM facts WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Mark a fact as verified
 */
export function verifyFact(id: string): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE facts SET verified_at = ? WHERE id = ?');
  stmt.run(Date.now(), id);
}
