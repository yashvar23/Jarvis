# Personality Engine

The Personality Engine enables J.A.R.V.I.S. to learn and adapt its communication style based on user interactions. It maintains a dynamic personality model that evolves over time, adapts to different communication channels, and can be used to generate personalized LLM prompts.

## Features

- **Persistent Personality State**: Stores personality in SQLite database
- **Signal Detection**: Automatically detects user preferences from messages
- **Adaptive Learning**: Adjusts communication style based on feedback
- **Channel Adaptation**: Customizes personality for different channels (WhatsApp, Email, etc.)
- **Trust Building**: Builds trust level over time through interactions
- **LLM Integration**: Generates personality prompts for LLM system messages

## Architecture

The Personality Engine consists of three main modules:

### 1. Model (`personality/model.ts`)

Manages the personality state structure and persistence.

```typescript
import { getPersonality, savePersonality, updatePersonality } from '@/personality';

// Get current personality
const personality = getPersonality();

// Update specific fields
const updated = updatePersonality({
  learned_preferences: {
    verbosity: 7,
  },
});

// Save to database
savePersonality(updated);
```

**Personality Structure:**
```typescript
{
  core_traits: string[];                    // Base personality traits
  learned_preferences: {
    verbosity: number;                      // 0-10 scale
    formality: number;                      // 0-10 scale
    humor_level: number;                    // 0-10 scale
    emoji_usage: boolean;
    preferred_format: 'lists' | 'prose' | 'tables' | 'adaptive';
  };
  relationship: {
    first_interaction: number;              // Timestamp
    message_count: number;
    trust_level: number;                    // 0-10, grows over time
    shared_references: string[];            // Known contexts
  };
  channel_overrides: Record<string, Partial<PersonalityModel>>;
}
```

### 2. Learner (`personality/learner.ts`)

Extracts preference signals from conversations and applies them to the personality model.

```typescript
import { extractSignals, applySignals, recordInteraction } from '@/personality';

// Extract signals from a user message
const signals = extractSignals(
  "Please keep it brief",
  "Sure, I'll be concise."
);

// Apply signals to personality
let personality = getPersonality();
personality = applySignals(personality, signals);

// Record the interaction (increments message count, adjusts trust)
personality = recordInteraction(personality);

// Save updated personality
savePersonality(personality);
```

**Signal Types:**
- `user_feedback`: Implicit feedback from message content
- `message_style`: Style cues from user's writing (e.g., emoji usage)
- `explicit_preference`: Direct instructions (e.g., "be more casual")

**Detected Preferences:**
- **Verbosity**: "brief", "TLDR", "more detail", "explain"
- **Formality**: "casual", "formal", "professional"
- **Humor**: "funny", "serious", "joke"
- **Emoji Usage**: Detected from emoji presence in messages
- **Format**: "table", "list", "bullet points", "paragraph"

### 3. Adapter (`personality/adapter.ts`)

Adapts personality for specific channels and generates LLM prompts.

```typescript
import { getChannelPersonality, personalityToPrompt } from '@/personality';

// Get channel-adapted personality
const whatsappPersonality = getChannelPersonality(personality, 'whatsapp');

// Generate LLM system prompt
const prompt = personalityToPrompt(whatsappPersonality);
```

**Default Channel Adaptations:**

| Channel   | Verbosity | Formality | Emoji | Format   |
|-----------|-----------|-----------|-------|----------|
| WhatsApp  | 4/10      | 3/10      | Yes   | Lists    |
| Telegram  | 4/10      | 3/10      | Yes   | Lists    |
| Email     | 7/10      | 8/10      | No    | Prose    |
| Terminal  | 5/10      | 5/10      | No    | Adaptive |
| WebSocket | 5/10      | 5/10      | No    | Adaptive |

## Usage Example

```typescript
import {
  getPersonality,
  savePersonality,
  extractSignals,
  applySignals,
  recordInteraction,
  getChannelPersonality,
  personalityToPrompt,
} from '@/personality';

// 1. Process a user interaction
async function handleMessage(userMessage: string, assistantResponse: string, channel: string) {
  // Load current personality
  let personality = getPersonality();

  // Extract preference signals
  const signals = extractSignals(userMessage, assistantResponse);

  // Apply learning
  personality = applySignals(personality, signals);
  personality = recordInteraction(personality);

  // Save updated state
  savePersonality(personality);

  // Get channel-adapted personality
  const adapted = getChannelPersonality(personality, channel);

  // Generate prompt for next LLM call
  const systemPrompt = personalityToPrompt(adapted);

  return systemPrompt;
}

// 2. Manual personality updates
const updated = updatePersonality({
  core_traits: ['direct', 'strategic', 'resourceful', 'proactive'],
  relationship: {
    shared_references: ['Project X', 'User preferences'],
  },
});
```

## Database Schema

Personality state is stored in the `personality_state` table:

```sql
CREATE TABLE personality_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data TEXT NOT NULL,              -- JSON-serialized PersonalityModel
  updated_at INTEGER NOT NULL
);
```

## Best Practices

1. **Regular Updates**: Call `recordInteraction()` after every conversation turn
2. **Signal Extraction**: Always extract signals before applying them
3. **Channel Context**: Use `getChannelPersonality()` when generating responses
4. **Gradual Learning**: Signals adjust values by ±1, allowing gradual adaptation
5. **Trust Building**: Trust level increases automatically with interaction count
6. **Persistence**: Always `savePersonality()` after applying changes

## Trust Level Progression

Trust level grows based on interaction count:

- **0-9 messages**: Trust level 3 (low)
- **10-19 messages**: Trust level 4 (developing)
- **20-29 messages**: Trust level 5 (developing)
- **30-49 messages**: Trust level 6 (moderate)
- **50-69 messages**: Trust level 7 (moderate)
- **70-89 messages**: Trust level 8 (high)
- **90-99 messages**: Trust level 9 (high)
- **100+ messages**: Trust level 10 (very high)

Formula: `trust_level = min(10, 3 + floor(message_count / 10))`

## Testing

Run the test suite:

```bash
bun test src/personality/personality.test.ts
```

Run the demo:

```bash
bun run examples/personality-demo.ts
```

## Integration Points

### With LLM Layer

```typescript
import { personalityToPrompt } from '@/personality';

const systemMessage = {
  role: 'system',
  content: `
You are J.A.R.V.I.S., an AI assistant.

${personalityToPrompt(personality)}

## Core Instructions
...
  `,
};
```

### With Communication Layer

```typescript
// In message handler
const adapted = getChannelPersonality(personality, message.channel);
const prompt = personalityToPrompt(adapted);
// Use prompt in LLM call
```

### With Agent Layer

```typescript
// Store agent-specific personality overrides
updatePersonality({
  channel_overrides: {
    'agent:research': {
      learned_preferences: {
        verbosity: 8,  // More detailed for research
        formality: 7,   // More formal
      },
    },
  },
});
```

## Future Enhancements

- [ ] Sentiment analysis for emotional adaptation
- [ ] Time-of-day personality adjustments
- [ ] Multi-user personality profiles
- [ ] A/B testing different personality configurations
- [ ] Personality rollback/versioning
- [ ] Advanced signal detection using LLMs
- [ ] User satisfaction scoring
