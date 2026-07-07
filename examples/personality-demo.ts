/**
 * Personality Engine Demo
 *
 * This example demonstrates the Personality Engine capabilities:
 * 1. Loading and saving personality state
 * 2. Extracting signals from user messages
 * 3. Learning from interactions
 * 4. Channel-specific adaptations
 * 5. Generating personality prompts for LLMs
 */

import { initDatabase } from '../src/vault/schema.ts';
import {
  getPersonality,
  savePersonality,
  updatePersonality,
  extractSignals,
  applySignals,
  recordInteraction,
  getChannelPersonality,
  personalityToPrompt,
} from '../src/personality/index.ts';

// Initialize database
initDatabase('./data/jarvis.db');

console.log('=== Personality Engine Demo ===\n');

// 1. Get initial personality
console.log('1. Initial Personality:');
let personality = getPersonality();
console.log(`   Verbosity: ${personality.learned_preferences.verbosity}/10`);
console.log(`   Formality: ${personality.learned_preferences.formality}/10`);
console.log(`   Humor: ${personality.learned_preferences.humor_level}/10`);
console.log(`   Message count: ${personality.relationship.message_count}`);
console.log(`   Trust level: ${personality.relationship.trust_level}/10\n`);

// 2. Simulate user interactions and learning
console.log('2. Learning from User Interactions:');

const interactions = [
  {
    user: 'Keep it brief please',
    assistant: 'Sure, I will be more concise.',
  },
  {
    user: 'Can you be more casual? 😊',
    assistant: 'Absolutely! I can totally do that.',
  },
  {
    user: 'Show me this as a table',
    assistant: 'Here is the data in table format...',
  },
];

interactions.forEach((interaction, i) => {
  console.log(`   Interaction ${i + 1}:`);
  console.log(`   User: "${interaction.user}"`);

  // Extract signals
  const signals = extractSignals(interaction.user, interaction.assistant);
  console.log(`   Detected signals: ${signals.length}`);
  signals.forEach((signal) => {
    console.log(`     - ${signal.type}: ${JSON.stringify(signal.data)}`);
  });

  // Apply signals
  personality = applySignals(personality, signals);
  personality = recordInteraction(personality);
  console.log('');
});

// Save the learned personality
savePersonality(personality);

// 3. Show updated personality
console.log('3. Updated Personality After Learning:');
console.log(`   Verbosity: ${personality.learned_preferences.verbosity}/10`);
console.log(`   Formality: ${personality.learned_preferences.formality}/10`);
console.log(`   Humor: ${personality.learned_preferences.humor_level}/10`);
console.log(`   Emoji usage: ${personality.learned_preferences.emoji_usage}`);
console.log(`   Format preference: ${personality.learned_preferences.preferred_format}`);
console.log(`   Message count: ${personality.relationship.message_count}`);
console.log(`   Trust level: ${personality.relationship.trust_level}/10\n`);

// 4. Channel adaptations
console.log('4. Channel-Specific Adaptations:');

const channels = ['whatsapp', 'email', 'terminal'];
channels.forEach((channel) => {
  const adapted = getChannelPersonality(personality, channel);
  console.log(`   ${channel.toUpperCase()}:`);
  console.log(`     Verbosity: ${adapted.learned_preferences.verbosity}/10`);
  console.log(`     Formality: ${adapted.learned_preferences.formality}/10`);
  console.log(`     Emoji: ${adapted.learned_preferences.emoji_usage}`);
  console.log('');
});

// 5. Generate LLM prompt
console.log('5. Generated Personality Prompt for LLM:');
const prompt = personalityToPrompt(personality);
console.log('---');
console.log(prompt);
console.log('---\n');

// 6. Manual personality updates
console.log('6. Manual Personality Update:');
const updated = updatePersonality({
  core_traits: ['direct', 'strategic', 'resourceful', 'proactive'],
  relationship: {
    shared_references: ['Project Phoenix', 'Anna'],
  },
});
console.log(`   Core traits: ${updated.core_traits.join(', ')}`);
console.log(`   Shared references: ${updated.relationship.shared_references.join(', ')}\n`);

console.log('=== Demo Complete ===');
