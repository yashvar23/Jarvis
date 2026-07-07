/**
 * Example: Integrating LLM Providers into J.A.R.V.I.S. Daemon
 *
 * This example demonstrates how to:
 * 1. Load configuration from YAML
 * 2. Initialize LLM providers based on config
 * 3. Use the LLM manager for chat and streaming
 * 4. Handle errors and fallbacks
 */

import { loadConfig, saveConfig } from '../src/config/index.ts';
import {
  LLMManager,
  AnthropicProvider,
  OpenAIProvider,
  OllamaProvider,
  type LLMMessage,
} from '../src/llm/index.ts';

class JarvisLLMService {
  private manager: LLMManager;
  private config: any;

  constructor() {
    this.manager = new LLMManager();
  }

  async initialize(configPath?: string): Promise<void> {
    console.log('Loading J.A.R.V.I.S. configuration...');
    this.config = await loadConfig(configPath);

    console.log('Initializing LLM providers...');
    let providersRegistered = 0;

    // Register Anthropic (Claude)
    if (this.config.llm.anthropic?.api_key) {
      const anthropic = new AnthropicProvider(
        this.config.llm.anthropic.api_key,
        this.config.llm.anthropic.model
      );
      this.manager.registerProvider(anthropic);
      console.log('  ✓ Anthropic Claude registered');
      providersRegistered++;
    }

    // Register OpenAI (GPT)
    if (this.config.llm.openai?.api_key) {
      const openai = new OpenAIProvider(
        this.config.llm.openai.api_key,
        this.config.llm.openai.model
      );
      this.manager.registerProvider(openai);
      console.log('  ✓ OpenAI GPT registered');
      providersRegistered++;
    }

    // Register Ollama (local)
    if (this.config.llm.ollama) {
      try {
        const ollama = new OllamaProvider(
          this.config.llm.ollama.base_url,
          this.config.llm.ollama.model
        );
        // Test connection
        await ollama.listModels();
        this.manager.registerProvider(ollama);
        console.log('  ✓ Ollama registered');
        providersRegistered++;
      } catch (err) {
        console.warn('  ⚠ Ollama not available (is it running?)');
      }
    }

    if (providersRegistered === 0) {
      throw new Error('No LLM providers configured. Please add API keys to config.');
    }

    // Configure primary and fallbacks
    this.manager.setPrimary(this.config.llm.primary);
    this.manager.setFallbackChain(this.config.llm.fallback);

    console.log(`Primary provider: ${this.config.llm.primary}`);
    console.log(`Fallback chain: ${this.config.llm.fallback.join(' → ')}`);
    console.log('LLM service ready!\n');
  }

  async chat(messages: LLMMessage[], options?: any) {
    return this.manager.chat(messages, options);
  }

  stream(messages: LLMMessage[], options?: any) {
    return this.manager.stream(messages, options);
  }

  getProvider(name: string) {
    return this.manager.getProvider(name);
  }
}

// Example usage in daemon
async function main() {
  const llm = new JarvisLLMService();

  try {
    await llm.initialize();

    // Example 1: Simple chat completion
    console.log('=== Example 1: Simple Chat ===');
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are J.A.R.V.I.S., a helpful AI assistant.',
      },
      {
        role: 'user',
        content: 'What can you help me with today?',
      },
    ];

    const response = await llm.chat(messages);
    console.log('Response:', response.content);
    console.log('Model:', response.model);
    console.log('Tokens:', response.usage);
    console.log('');

    // Example 2: Streaming response
    console.log('=== Example 2: Streaming Response ===');
    process.stdout.write('J.A.R.V.I.S.: ');

    const streamMessages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are J.A.R.V.I.S. Respond concisely.',
      },
      {
        role: 'user',
        content: 'Tell me a fun fact about TypeScript in one sentence.',
      },
    ];

    let streamContent = '';
    for await (const event of llm.stream(streamMessages)) {
      if (event.type === 'text') {
        process.stdout.write(event.text);
        streamContent += event.text;
      } else if (event.type === 'done') {
        console.log('\n');
        console.log('Model:', event.response.model);
        console.log('Tokens:', event.response.usage);
      } else if (event.type === 'error') {
        console.error('\nError:', event.error);
      }
    }
    console.log('');

    // Example 3: Tool calling
    console.log('=== Example 3: Tool Calling ===');
    const toolMessages: LLMMessage[] = [
      {
        role: 'user',
        content: 'What is the weather like in Paris and Tokyo?',
      },
    ];

    const tools = [
      {
        name: 'get_weather',
        description: 'Get the current weather in a given location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city name, e.g., Paris, Tokyo',
            },
            unit: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description: 'Temperature unit',
            },
          },
          required: ['location'],
        },
      },
    ];

    const toolResponse = await llm.chat(toolMessages, { tools });

    if (toolResponse.tool_calls.length > 0) {
      console.log('Tool calls requested:');
      for (const call of toolResponse.tool_calls) {
        console.log(`  - ${call.name}(${JSON.stringify(call.arguments)})`);
      }
    } else {
      console.log('Response:', toolResponse.content);
    }
    console.log('');

    // Example 4: Testing fallback
    console.log('=== Example 4: Provider Fallback ===');
    console.log('(This demonstrates automatic fallback on failure)');
    // The manager will automatically try fallback providers if primary fails

    // Example 5: Model override
    console.log('=== Example 5: Model Override ===');
    const overrideMessages: LLMMessage[] = [
      {
        role: 'user',
        content: 'Say "hello" in exactly 3 different languages.',
      },
    ];

    const overrideResponse = await llm.chat(overrideMessages, {
      temperature: 0.5,
      max_tokens: 100,
    });
    console.log('Response:', overrideResponse.content);
    console.log('Model:', overrideResponse.model);
    console.log('');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (import.meta.main) {
  main().catch(console.error);
}

export { JarvisLLMService };
