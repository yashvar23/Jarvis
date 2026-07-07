/**
 * Full Integration Example: Personality Engine + Vault Extractor
 *
 * This example demonstrates how to use both systems together
 * in a complete conversational AI pipeline.
 */

import { initDatabase } from '../src/vault/schema.ts';
import {
  getPersonality,
  savePersonality,
  extractSignals,
  applySignals,
  recordInteraction,
  getChannelPersonality,
  personalityToPrompt,
} from '../src/personality/index.ts';
import {
  extractAndStore,
  findEntities,
  findFacts,
  findCommitments,
} from '../src/vault/index.ts';
import type { LLMProvider, LLMMessage } from '../src/llm/provider.ts';

// Initialize database
initDatabase('./data/jarvis.db');

// Mock LLM Provider for demo
const mockLLM: LLMProvider = {
  name: 'mock',
  async chat(messages: LLMMessage[]) {
    // Extract conversation context
    const userMsg = messages.find((m) => m.role === 'user')?.content || '';

    // Simulate assistant response based on user message
    let response = '';
    if (userMsg.includes('birthday')) {
      response = "I'll remember Anna's birthday is on March 15th!";
    } else if (userMsg.includes('help')) {
      response = 'I can help you with various tasks. What would you like to do?';
    } else {
      response = 'I understand. How else can I assist you?';
    }

    // For extraction calls, return mock extraction data
    if (userMsg.includes('extracting structured information')) {
      return {
        content: JSON.stringify({
          entities: [
            { name: 'Anna', type: 'person' },
          ],
          facts: [
            { subject: 'Anna', predicate: 'birthday_is', object: 'March 15', confidence: 1.0 },
          ],
          relationships: [
            { from: 'User', to: 'Anna', type: 'sister_of' },
          ],
          commitments: [
            { what: "Remind about Anna's birthday", when_due: '2026-03-14T09:00:00Z' },
          ],
        }),
        tool_calls: [],
        usage: { input_tokens: 100, output_tokens: 50 },
        model: 'mock',
        finish_reason: 'stop' as const,
      };
    }

    return {
      content: response,
      tool_calls: [],
      usage: { input_tokens: 50, output_tokens: 30 },
      model: 'mock',
      finish_reason: 'stop' as const,
    };
  },
  async *stream() {
    yield { type: 'done' as const, response: {} as any };
  },
  async listModels() {
    return ['mock'];
  },
};

/**
 * Complete message handler with personality learning and knowledge extraction
 */
async function handleMessage(
  userMessage: string,
  channel: string = 'terminal'
): Promise<string> {
  console.log(`\n[${'='.repeat(60)}]`);
  console.log(`[USER on ${channel}]: ${userMessage}`);

  // 1. Load and adapt personality for channel
  let personality = getPersonality();
  const adaptedPersonality = getChannelPersonality(personality, channel);

  // 2. Generate personality-aware system prompt
  const systemPrompt = `You are J.A.R.V.I.S., an adaptive AI assistant.

${personalityToPrompt(adaptedPersonality)}

Respond to the user's message in a way that matches the personality traits above.`;

  console.log(`\n[PERSONALITY]: Adapted for ${channel}`);
  console.log(`  Verbosity: ${adaptedPersonality.learned_preferences.verbosity}/10`);
  console.log(`  Formality: ${adaptedPersonality.learned_preferences.formality}/10`);
  console.log(`  Trust level: ${adaptedPersonality.relationship.trust_level}/10`);

  // 3. Call LLM with personality-aware prompt
  const response = await mockLLM.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]);

  const assistantResponse = response.content;
  console.log(`\n[ASSISTANT]: ${assistantResponse}`);

  // 4. Extract preference signals and update personality
  const signals = extractSignals(userMessage, assistantResponse);
  if (signals.length > 0) {
    console.log(`\n[LEARNING]: Detected ${signals.length} preference signal(s)`);
    signals.forEach((signal) => {
      console.log(`  - ${signal.type}: ${JSON.stringify(signal.data)}`);
    });

    personality = applySignals(personality, signals);
  }

  // 5. Record interaction
  personality = recordInteraction(personality);
  savePersonality(personality);

  console.log(`\n[STATE]: Updated personality (${personality.relationship.message_count} total interactions)`);

  // 6. Extract and store knowledge
  console.log(`\n[EXTRACTION]: Analyzing conversation for knowledge...`);
  const extraction = await extractAndStore(userMessage, assistantResponse, mockLLM);

  if (extraction.entities.length > 0 || extraction.facts.length > 0) {
    console.log(`  ✓ Extracted ${extraction.entities.length} entities`);
    console.log(`  ✓ Extracted ${extraction.facts.length} facts`);
    console.log(`  ✓ Extracted ${extraction.relationships.length} relationships`);
    console.log(`  ✓ Extracted ${extraction.commitments.length} commitments`);
  } else {
    console.log(`  (No new knowledge extracted)`);
  }

  return assistantResponse;
}

/**
 * Query and display knowledge graph stats
 */
function displayKnowledgeStats() {
  const entities = findEntities({});
  const facts = findFacts({});
  const commitments = findCommitments({ status: 'pending' });

  console.log(`\n[${'='.repeat(60)}]`);
  console.log('[KNOWLEDGE GRAPH STATS]');
  console.log(`  Total entities: ${entities.length}`);
  console.log(`  Total facts: ${facts.length}`);
  console.log(`  Pending commitments: ${commitments.length}`);

  if (entities.length > 0) {
    console.log(`\n  Entities by type:`);
    const byType = entities.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count}`);
    });
  }

  if (commitments.length > 0) {
    console.log(`\n  Upcoming commitments:`);
    commitments.slice(0, 3).forEach((c) => {
      const due = c.when_due ? new Date(c.when_due).toLocaleDateString() : 'No due date';
      console.log(`    - ${c.what} (${due})`);
    });
  }
}

// Demo: Simulate a conversation
async function runDemo() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   J.A.R.V.I.S. Full Integration Demo                      ║');
  console.log('║   Personality Engine + Vault Extractor                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Conversation sequence
  await handleMessage(
    "Hi! My sister Anna's birthday is coming up on March 15th.",
    'terminal'
  );

  await handleMessage(
    'Keep it brief please, just acknowledge',
    'terminal'
  );

  await handleMessage(
    'Can you be more casual? 😊',
    'whatsapp'
  );

  await handleMessage(
    'What do you know about Anna?',
    'terminal'
  );

  // Display final stats
  displayKnowledgeStats();

  // Show updated personality
  const finalPersonality = getPersonality();
  console.log(`\n[${'='.repeat(60)}]`);
  console.log('[FINAL PERSONALITY STATE]');
  console.log(`  Verbosity: ${finalPersonality.learned_preferences.verbosity}/10`);
  console.log(`  Formality: ${finalPersonality.learned_preferences.formality}/10`);
  console.log(`  Emoji usage: ${finalPersonality.learned_preferences.emoji_usage}`);
  console.log(`  Total interactions: ${finalPersonality.relationship.message_count}`);
  console.log(`  Trust level: ${finalPersonality.relationship.trust_level}/10`);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Demo Complete!                                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run the demo
runDemo().catch(console.error);
