import { getDb, generateId } from './schema.ts';

export type VectorRecord = {
  id: string;
  ref_type: string;
  ref_id: string;
  embedding: Float32Array;
  model: string;
  created_at: number;
};

type VectorRow = {
  id: string;
  ref_type: string;
  ref_id: string;
  embedding: ArrayBuffer;
  model: string;
  created_at: number;
};

/**
 * Parse vector row from database, converting BLOB to Float32Array
 */
function parseVector(row: VectorRow): VectorRecord {
  return {
    ...row,
    embedding: new Float32Array(row.embedding),
  };
}

/**
 * Store a vector embedding for a reference entity or fact
 */
export function storeVector(
  ref_type: string,
  ref_id: string,
  embedding: Float32Array,
  model: string
): VectorRecord {
  const db = getDb();
  const id = generateId();
  const now = Date.now();

  // Convert Float32Array to Buffer for SQLite BLOB storage
  const buffer = Buffer.from(embedding.buffer);

  const stmt = db.prepare(
    'INSERT INTO vectors (id, ref_type, ref_id, embedding, model, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  stmt.run(id, ref_type, ref_id, buffer, model, now);

  return {
    id,
    ref_type,
    ref_id,
    embedding,
    model,
    created_at: now,
  };
}

/**
 * Find similar vectors using cosine similarity
 *
 * TODO: This is a stub implementation. For production use, integrate sqlite-vec extension
 * which provides optimized vector similarity search with HNSW indexing.
 *
 * See: https://github.com/asg017/sqlite-vec
 *
 * Example with sqlite-vec:
 * SELECT ref_type, ref_id, vec_distance_cosine(embedding, ?) as similarity
 * FROM vectors
 * ORDER BY similarity DESC
 * LIMIT ?
 */
export function findSimilar(
  embedding: Float32Array,
  limit: number = 10
): Array<{ ref_type: string; ref_id: string; similarity: number }> {
  // TODO: Implement vector similarity search with sqlite-vec extension
  return [];
}

/**
 * Delete all vectors for a given reference
 */
export function deleteVectors(ref_type: string, ref_id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM vectors WHERE ref_type = ? AND ref_id = ?');
  stmt.run(ref_type, ref_id);
}
