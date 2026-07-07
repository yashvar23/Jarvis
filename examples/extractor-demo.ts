/**
 * Vault Extractor Demo
 *
 * This example demonstrates the Vault Extractor capabilities:
 * 1. Building extraction prompts
 * 2. Parsing extraction responses
 * 3. Extracting and storing knowledge from conversations
 * 4. Querying the stored knowledge
 */

import { initDatabase } from '../src/vault/schema.ts';
import {
  buildExtractionPrompt,
  parseExtractionResponse,
  extractAndStore,
} from '../src/vault/extractor.ts';
import {
  findEntities,
  findFacts,
  findRelationships,
  findCommitments,
} from '../src/vault/index.ts';
import type { LLMProvider } from '../src/llm/provider.ts';

// Initialize database
initDatabase('./data/jarvis.db');

console.log('=== Vault Extractor Demo ===\n');

// 1. Building extraction prompts
console.log('1. Building Extraction Prompt:');
const userMessage = "My sister Anna's birthday is March 15th. She works at Google as a software engineer.";
const assistantResponse = "I've noted that Anna's birthday is on March 15th and that she works at Google as a software engineer.";

const prompt = buildExtractionPrompt(userMessage, assistantResponse);
console.log('   Prompt preview (first 200 chars):');
console.log(`   ${prompt.substring(0, 200)}...\n`);

// 2. Parsing extraction responses
console.log('2. Parsing Mock Extraction Response:');
const mockResponse = JSON.stringify({
  entities: [
    { name: 'Anna', type: 'person' },
    { name: 'Google', type: 'tool' },
  ],
  facts: [
    { subject: 'Anna', predicate: 'birthday_is', object: 'March 15', confidence: 1.0 },
    { subject: 'Anna', predicate: 'works_at', object: 'Google', confidence: 1.0 },
    { subject: 'Anna', predicate: 'role_is', object: 'software engineer', confidence: 1.0 },
  ],
  relationships: [
    { from: 'User', to: 'Anna', type: 'sister_of' },
    { from: 'Anna', to: 'Google', type: 'works_at' },
  ],
  commitments: [
    { what: "Remind about Anna's birthday", when_due: '2026-03-14T09:00:00Z', priority: 'normal' },
  ],
});

const parsed = parseExtractionResponse(mockResponse);
console.log(`   Extracted entities: ${parsed.entities.length}`);
console.log(`   Extracted facts: ${parsed.facts.length}`);
console.log(`   Extracted relationships: ${parsed.relationships.length}`);
console.log(`   Extracted commitments: ${parsed.commitments.length}\n`);

// 3. Mock LLM Provider for demo
console.log('3. Creating Mock LLM Provider:');
const mockProvider: LLMProvider = {
  name: 'mock-demo',
  async chat() {
    // Simulate LLM response with extracted knowledge
    return {
      content: mockResponse,
      tool_calls: [],
      usage: { input_tokens: 150, output_tokens: 200 },
      model: 'mock-model',
      finish_reason: 'stop' as const,
    };
  },
  async *stream() {
    yield { type: 'done' as const, response: {} as any };
  },
  async listModels() {
    return ['mock-model'];
  },
};
console.log('   Mock provider created\n');

// 4. Extract and store
console.log('4. Extracting and Storing Knowledge:');
const extraction = await extractAndStore(userMessage, assistantResponse, mockProvider);
console.log(`   ✓ Stored ${extraction.entities.length} entities`);
console.log(`   ✓ Stored ${extraction.facts.length} facts`);
console.log(`   ✓ Stored ${extraction.relationships.length} relationships`);
console.log(`   ✓ Stored ${extraction.commitments.length} commitments\n`);

// 5. Query stored knowledge
console.log('5. Querying Stored Knowledge:');

// Query entities
const entities = findEntities({ type: 'person' });
console.log(`   Found ${entities.length} person entities:`);
entities.forEach((entity) => {
  console.log(`     - ${entity.name} (${entity.type})`);
});

// Query facts about Anna
const annaEntities = findEntities({ name: 'Anna', type: 'person' });
if (annaEntities.length > 0) {
  const annaFacts = findFacts({ subject_id: annaEntities[0].id });
  console.log(`\n   Facts about Anna:`);
  annaFacts.forEach((fact) => {
    console.log(`     - ${fact.predicate}: ${fact.object} (confidence: ${fact.confidence})`);
  });
}

// Query relationships
const relationships = findRelationships({});
console.log(`\n   Found ${relationships.length} relationships:`);
relationships.forEach((rel) => {
  console.log(`     - ${rel.type}`);
});

// Query commitments
const commitments = findCommitments({ status: 'pending' });
console.log(`\n   Found ${commitments.length} pending commitments:`);
commitments.forEach((commitment) => {
  const dueDate = commitment.when_due ? new Date(commitment.when_due).toLocaleString() : 'No due date';
  console.log(`     - ${commitment.what}`);
  console.log(`       Due: ${dueDate}`);
  console.log(`       Priority: ${commitment.priority}`);
});

console.log('\n=== Demo Complete ===');
console.log('\nNext Steps:');
console.log('- Integrate with a real LLM provider (Anthropic, OpenAI, etc.)');
console.log('- Set up automatic extraction on every conversation');
console.log('- Use extracted knowledge to personalize responses');
console.log('- Build commitment tracking and reminder systems');
