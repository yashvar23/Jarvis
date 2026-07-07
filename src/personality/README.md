# Personality Engine

An adaptive personality system for J.A.R.V.I.S. that learns user preferences and adapts communication style over time.

## Quick Start

```typescript
import { initDatabase } from '@/vault/schema';
import {
  getPersonality,
  savePersonality,
  extractSignals,
  applySignals,
  recordInteraction,
  personalityToPrompt,
} from '@/personality';

// Initialize database
initDatabase('./data/jarvis.db');

// Process a user interaction
let personality = getPersonality();
const signals = extractSignals("Keep it brief", "Sure!");
personality = applySignals(personality, signals);
personality = recordInteraction(personality);
savePersonality(personality);

// Generate LLM prompt
const prompt = personalityToPrompt(personality);
```

## Modules

- **`model.ts`**: Personality state structure and persistence
- **`learner.ts`**: Signal extraction and learning
- **`adapter.ts`**: Channel adaptation and prompt generation
- **`index.ts`**: Public API exports

## Features

✓ Learns from user feedback (verbosity, formality, humor)
✓ Detects emoji usage preferences
✓ Adapts to different channels (WhatsApp, Email, Terminal)
✓ Builds trust over time
✓ Generates personality-aware LLM prompts

## Documentation

See [docs/PERSONALITY_ENGINE.md](~/jarvis/docs/PERSONALITY_ENGINE.md) for full documentation.

## Testing

```bash
bun test src/personality/personality.test.ts
```

## Demo

```bash
bun run examples/personality-demo.ts
```
