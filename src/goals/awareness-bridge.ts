/**
 * Awareness → Goals Bridge
 *
 * Subscribes to awareness events and fuzzy-matches detected context
 * (apps, windows, files, text) against active goal descriptions.
 * Auto-logs progress entries as 'auto_detected' when matches are found.
 * Feeds the evening review with detected activity.
 */

import type { Goal } from './types.ts';
import * as vault from '../vault/goals.ts';

export type AwarenessGoalMatch = {
  goalId: string;
  goalTitle: string;
  matchScore: number;
  matchedTerms: string[];
  source: string;
};

/**
 * Process an awareness event and check if it relates to any active goals.
 * Returns any matches found so the caller can log them.
 */
export function matchAwarenessToGoals(
  eventData: Record<string, unknown>,
): AwarenessGoalMatch[] {
  const activeGoals = vault.findGoals({ status: 'active' });
  if (activeGoals.length === 0) return [];

  // Extract searchable text from awareness event
  const eventText = extractEventText(eventData);
  if (!eventText) return [];

  const eventWords = tokenize(eventText);
  if (eventWords.length === 0) return [];

  const matches: AwarenessGoalMatch[] = [];

  for (const goal of activeGoals) {
    const goalWords = tokenize(`${goal.title} ${goal.description} ${goal.success_criteria}`);
    if (goalWords.length === 0) continue;

    const { score, matched } = fuzzyMatch(eventWords, goalWords);

    // Threshold: require at least 2 matching terms and 0.15 score
    if (score >= 0.15 && matched.length >= 2) {
      matches.push({
        goalId: goal.id,
        goalTitle: goal.title,
        matchScore: score,
        matchedTerms: matched,
        source: String(eventData.app_name ?? eventData.window_title ?? 'awareness'),
      });
    }
  }

  // Sort by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
}

/**
 * Log auto-detected progress for matched goals.
 * Only logs if the goal hasn't had a recent auto-detection (within 30 min).
 */
export function logAutoDetectedProgress(
  matches: AwarenessGoalMatch[],
  eventType: string,
): void {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;

  for (const match of matches) {
    // Check for recent auto-detection to avoid spam
    const recentProgress = vault.getProgressHistory(match.goalId, 5);
    const hasRecentAutoDetect = recentProgress.some(
      p => p.type === 'auto_detected' && (now - p.created_at) < thirtyMinutes
    );

    if (hasRecentAutoDetect) continue;

    const goal = vault.getGoal(match.goalId);
    if (!goal) continue;

    // Log progress entry (no score change, just detection)
    vault.addProgressEntry(
      match.goalId,
      'auto_detected',
      goal.score,
      goal.score, // no automatic score change
      `Activity detected: ${eventType} via ${match.source} (matched: ${match.matchedTerms.join(', ')})`,
      'awareness',
    );
  }
}

/**
 * Extract searchable text from an awareness event's data payload.
 */
function extractEventText(data: Record<string, unknown>): string {
  const parts: string[] = [];

  // Common awareness event fields
  if (data.app_name) parts.push(String(data.app_name));
  if (data.window_title) parts.push(String(data.window_title));
  if (data.ocr_text) parts.push(String(data.ocr_text));
  if (data.file_path) parts.push(String(data.file_path));
  if (data.url) parts.push(String(data.url));
  if (data.title) parts.push(String(data.title));
  if (data.body) parts.push(String(data.body));
  if (data.description) parts.push(String(data.description));
  if (data.context) parts.push(String(data.context));

  // Session data
  if (data.dominant_app) parts.push(String(data.dominant_app));
  if (data.summary) parts.push(String(data.summary));
  if (data.activities && Array.isArray(data.activities)) {
    for (const a of data.activities) {
      if (typeof a === 'string') parts.push(a);
      else if (a && typeof a === 'object' && 'description' in a) parts.push(String(a.description));
    }
  }

  return parts.join(' ');
}

// Common words to filter from matching
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about',
  'and', 'but', 'or', 'not', 'no', 'if', 'than', 'so', 'up', 'out',
  'that', 'this', 'it', 'its', 'my', 'your', 'his', 'her', 'our',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some',
  'new', 'file', 'window', 'app', 'application', 'open', 'close',
]);

/**
 * Tokenize text into meaningful words (lowercase, filtered).
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
}

/**
 * Fuzzy match: check how many of the event words overlap with goal words.
 * Returns a score (0-1) and the matched terms.
 */
function fuzzyMatch(
  eventWords: string[],
  goalWords: string[],
): { score: number; matched: string[] } {
  const goalSet = new Set(goalWords);
  const matched: string[] = [];

  for (const word of eventWords) {
    if (goalSet.has(word)) {
      matched.push(word);
    } else {
      // Partial match: check if event word is substring of any goal word or vice versa
      for (const gw of goalSet) {
        if (gw.length >= 4 && word.length >= 4) {
          if (gw.includes(word) || word.includes(gw)) {
            matched.push(word);
            break;
          }
        }
      }
    }
  }

  // Deduplicate
  const uniqueMatched = [...new Set(matched)];

  // Score: proportion of goal words that were matched
  const score = goalWords.length > 0 ? uniqueMatched.length / goalWords.length : 0;

  return { score, matched: uniqueMatched };
}
