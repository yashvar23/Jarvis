/**
 * Authority Learner — Tracks approval patterns and suggests auto-approve rules.
 *
 * After N consecutive approvals of the same action+tool pattern,
 * suggests adding a persistent override so the user doesn't have to
 * keep approving the same thing.
 */

import { getDb, generateId } from '../vault/schema.ts';
import type { ActionCategory } from '../roles/authority.ts';
import type { PerActionOverride } from './engine.ts';

const DEFAULT_SUGGEST_THRESHOLD = 5;

export class AuthorityLearner {
  private threshold: number;

  constructor(threshold: number = DEFAULT_SUGGEST_THRESHOLD) {
    this.threshold = threshold;
  }

  /**
   * Record an approval or denial decision.
   * Approvals increment the consecutive count; denials reset it.
   */
  recordDecision(actionCategory: ActionCategory, toolName: string, approved: boolean): void {
    const db = getDb();
    const now = Date.now();

    if (approved) {
      // Try to increment existing pattern
      const result = db.run(
        `UPDATE approval_patterns
         SET consecutive_approvals = consecutive_approvals + 1, last_approval_at = ?
         WHERE action_category = ? AND tool_name = ?`,
        [now, actionCategory, toolName]
      );

      // Create pattern if it doesn't exist
      if (result.changes === 0) {
        db.run(
          `INSERT INTO approval_patterns (id, action_category, tool_name, consecutive_approvals, last_approval_at, suggestion_sent)
           VALUES (?, ?, ?, 1, ?, 0)`,
          [generateId(), actionCategory, toolName, now]
        );
      }
    } else {
      // Denial resets the consecutive count
      db.run(
        `UPDATE approval_patterns
         SET consecutive_approvals = 0, suggestion_sent = 0
         WHERE action_category = ? AND tool_name = ?`,
        [actionCategory, toolName]
      );
    }
  }

  /**
   * Get patterns that have crossed the suggestion threshold.
   */
  getSuggestions(): Array<{
    actionCategory: ActionCategory;
    toolName: string;
    consecutiveApprovals: number;
    suggestedRule: PerActionOverride;
  }> {
    const db = getDb();
    const rows = db.query(
      `SELECT * FROM approval_patterns
       WHERE consecutive_approvals >= ? AND suggestion_sent = 0
       ORDER BY consecutive_approvals DESC`
    ).all(this.threshold) as Array<{
      action_category: string;
      tool_name: string;
      consecutive_approvals: number;
    }>;

    return rows.map(row => ({
      actionCategory: row.action_category as ActionCategory,
      toolName: row.tool_name,
      consecutiveApprovals: row.consecutive_approvals,
      suggestedRule: {
        action: row.action_category as ActionCategory,
        allowed: true,
        requires_approval: false, // Auto-approve
      },
    }));
  }

  /**
   * Mark a suggestion as sent so we don't re-suggest.
   */
  markSuggestionSent(actionCategory: ActionCategory, toolName: string): void {
    const db = getDb();
    db.run(
      `UPDATE approval_patterns SET suggestion_sent = 1 WHERE action_category = ? AND tool_name = ?`,
      [actionCategory, toolName]
    );
  }

  /**
   * Reset a pattern (e.g., when user dismisses a suggestion).
   */
  resetPattern(actionCategory: ActionCategory, toolName: string): void {
    const db = getDb();
    db.run(
      `UPDATE approval_patterns SET consecutive_approvals = 0, suggestion_sent = 0 WHERE action_category = ? AND tool_name = ?`,
      [actionCategory, toolName]
    );
  }
}
