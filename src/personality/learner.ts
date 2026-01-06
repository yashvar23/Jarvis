import type { PersonalityModel } from './model.ts';

export type InteractionSignal = {
  type: 'user_feedback' | 'message_style' | 'explicit_preference';
  data: Record<string, unknown>;
};

/**
 * Clamp a number to a range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Analyze a user message for preference signals
 */
export function extractSignals(userMessage: string, assistantResponse: string): InteractionSignal[] {
  const signals: InteractionSignal[] = [];
  const lowerMessage = userMessage.toLowerCase();

  // Verbosity signals
  if (
    lowerMessage.includes('shorter') ||
    lowerMessage.includes('brief') ||
    lowerMessage.includes('tldr') ||
    lowerMessage.includes('too long') ||
    lowerMessage.includes('concise') ||
    lowerMessage.includes('summarize')
  ) {
    signals.push({
      type: 'user_feedback',
      data: { preference: 'verbosity', direction: -1 },
    });
  }

  if (
    lowerMessage.includes('more detail') ||
    lowerMessage.includes('explain') ||
    lowerMessage.includes('elaborate') ||
    lowerMessage.includes('tell me more') ||
    lowerMessage.includes('expand on')
  ) {
    signals.push({
      type: 'user_feedback',
      data: { preference: 'verbosity', direction: 1 },
    });
  }

  // Formality signals
  if (
    lowerMessage.includes('be more casual') ||
    lowerMessage.includes('less formal') ||
    lowerMessage.includes('relax') ||
    lowerMessage.includes('informal')
  ) {
    signals.push({
      type: 'explicit_preference',
      data: { preference: 'formality', direction: -1 },
    });
  }

  if (
    lowerMessage.includes('be more formal') ||
    lowerMessage.includes('professional') ||
    lowerMessage.includes('polite')
  ) {
    signals.push({
      type: 'explicit_preference',
      data: { preference: 'formality', direction: 1 },
    });
  }

  // Humor signals
  if (
    lowerMessage.includes('funny') ||
    lowerMessage.includes('joke') ||
    lowerMessage.includes('humorous') ||
    lowerMessage.includes('make me laugh')
  ) {
    signals.push({
      type: 'explicit_preference',
      data: { preference: 'humor_level', direction: 1 },
    });
  }

  if (
    lowerMessage.includes('serious') ||
    lowerMessage.includes('no jokes') ||
    lowerMessage.includes('be serious')
  ) {
    signals.push({
      type: 'explicit_preference',
      data: { preference: 'humor_level', direction: -1 },
    });
  }

  // Emoji usage detection (if user uses emojis, they probably like them)
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  if (emojiRegex.test(userMessage)) {
    signals.push({
      type: 'message_style',
      data: { preference: 'emoji_usage', value: true },
    });
  }

  // Format preference signals
  if (
    lowerMessage.includes('bullet points') ||
    lowerMessage.includes('list format') ||
    lowerMessage.includes('as a list')
  ) {
    signals.push({
      type: 'explicit_preference',
      data: { preference: 'preferred_format', value: 'lists' },
    });
  }

  if (
    lowerMessage.includes('table') ||
    lowerMessage.includes('tabular format')
  ) {
    signals.push({
      type: 'explicit_preference',
      data: { preference: 'preferred_format', value: 'tables' },
    });
  }

  if (
    lowerMessage.includes('paragraph') ||
    lowerMessage.includes('prose') ||
    lowerMessage.includes('written out')
  ) {
    signals.push({
      type: 'explicit_preference',
      data: { preference: 'preferred_format', value: 'prose' },
    });
  }

  return signals;
}

/**
 * Apply signals to update personality
 */
export function applySignals(personality: PersonalityModel, signals: InteractionSignal[]): PersonalityModel {
  const updated = { ...personality };

  for (const signal of signals) {
    const { preference, direction, value } = signal.data as {
      preference?: string;
      direction?: number;
      value?: any;
    };

    if (!preference) continue;

    // Handle numeric preferences (verbosity, formality, humor_level)
    if (
      preference === 'verbosity' ||
      preference === 'formality' ||
      preference === 'humor_level'
    ) {
      const currentValue = updated.learned_preferences[preference as keyof typeof updated.learned_preferences] as number;
      const adjustment = direction ?? 0;
      const newValue = clamp(currentValue + adjustment, 0, 10);
      (updated.learned_preferences as any)[preference] = newValue;
    }

    // Handle boolean preferences
    if (preference === 'emoji_usage' && typeof value === 'boolean') {
      updated.learned_preferences.emoji_usage = value;
    }

    // Handle enum preferences
    if (preference === 'preferred_format' && typeof value === 'string') {
      const validFormats: Array<PersonalityModel['learned_preferences']['preferred_format']> = [
        'lists',
        'prose',
        'tables',
        'adaptive',
      ];
      if (validFormats.includes(value as any)) {
        updated.learned_preferences.preferred_format = value as any;
      }
    }
  }

  return updated;
}

/**
 * Increment message count and adjust trust
 */
export function recordInteraction(personality: PersonalityModel): PersonalityModel {
  const updated = { ...personality };
  updated.relationship.message_count += 1;

  // Trust grows slowly over time, caps at 10
  // Every 10 messages = +1 trust (up to max of 10)
  const trustFromInteractions = Math.min(
    10,
    3 + Math.floor(updated.relationship.message_count / 10)
  );

  updated.relationship.trust_level = clamp(trustFromInteractions, 0, 10);

  return updated;
}
