# J.A.R.V.I.S. LLM Providers - Quick Start Guide

Get up and running with J.A.R.V.I.S. LLM providers in 5 minutes.

## Prerequisites

- Bun runtime installed (`curl -fsSL https://bun.sh/install | bash`)
- At least one of:
  - Anthropic API key (recommended)
  - OpenAI API key
  - Ollama installed locally

## Step 1: Install Dependencies

```bash
cd ~/jarvis
bun install
```

## Step 2: Create Configuration

```bash
# Create config directory
mkdir -p ~/.jarvis

# Copy example config
cp config.example.yaml ~/.jarvis/config.yaml

# Edit config with your API keys
nano ~/.jarvis/config.yaml
```

### Option A: Using Anthropic Claude (Recommended)

1. Get API key from: https://console.anthropic.com/
2. Edit `~/.jarvis/config.yaml`:

```yaml
llm:
  primary: "anthropic"
  fallback: ["openai", "ollama"]
  anthropic:
    api_key: "sk-ant-YOUR_KEY_HERE"
    model: "claude-sonnet-4-5-20250929"
```

### Option B: Using OpenAI

1. Get API key from: https://platform.openai.com/
2. Edit `~/.jarvis/config.yaml`:

```yaml
llm:
  primary: "openai"
  fallback: ["anthropic", "ollama"]
  openai:
    api_key: "sk-YOUR_KEY_HERE"
    model: "gpt-4o"
```

### Option C: Using Ollama (Local, Free)

1. Install Ollama: https://ollama.ai/
2. Pull a model:
   ```bash
   ollama pull llama3
   ```
3. Edit `~/.jarvis/config.yaml`:

```yaml
llm:
  primary: "ollama"
  fallback: []
  ollama:
    base_url: "http://localhost:11434"
    model: "llama3"
```

## Step 3: Test the Setup

```bash
bun run src/llm/test.ts
```

You should see:
- Configuration loaded
- Providers registered
- A test chat response
- A streaming response

## Step 4: Run Examples

```bash
bun run examples/llm-integration.ts
```

This demonstrates:
- Simple chat completions
- Streaming responses
- Tool/function calling
- Provider fallback
- Model overrides

## Basic Usage

### In Your Code

```typescript
import { loadConfig } from './src/config/index.ts';
import {
  LLMManager,
  AnthropicProvider,
  OpenAIProvider,
  OllamaProvider,
} from './src/llm/index.ts';

// Load config and initialize
const config = await loadConfig();
const manager = new LLMManager();

// Register providers
if (config.llm.anthropic?.api_key) {
  manager.registerProvider(
    new AnthropicProvider(
      config.llm.anthropic.api_key,
      config.llm.anthropic.model
    )
  );
}

manager.setPrimary(config.llm.primary);
manager.setFallbackChain(config.llm.fallback);

// Use it
const response = await manager.chat([
  { role: 'user', content: 'Hello!' }
]);

console.log(response.content);
```

## Common Issues

### "No LLM providers configured"

**Solution**: Add at least one API key to `~/.jarvis/config.yaml`

### "Ollama not available"

**Solution**: Start Ollama daemon:
```bash
ollama serve
```

### "Config file not found"

**Solution**: Ensure config exists at `~/.jarvis/config.yaml`
```bash
cp config.example.yaml ~/.jarvis/config.yaml
```

### "API key invalid"

**Solution**:
- Check API key is correct
- Ensure no extra spaces or quotes
- Verify account has credits (for paid APIs)

## Next Steps

1. **Read the Documentation**:
   - `~/jarvis/src/llm/README.md` - LLM providers
   - `~/jarvis/src/config/README.md` - Configuration

2. **Explore Examples**:
   - `~/jarvis/examples/llm-integration.ts`
   - `~/jarvis/src/llm/test.ts`

3. **Integrate into Daemon**:
   - Import `LLMManager` in your daemon code
   - Initialize on startup
   - Use for agent/role interactions

4. **Customize Configuration**:
   - Adjust personality traits
   - Set authority levels
   - Configure active role

## Configuration Overview

```yaml
# Daemon settings
daemon:
  port: 7777
  data_dir: "~/.jarvis"
  db_path: "~/.jarvis/jarvis.db"

# LLM provider settings
llm:
  primary: "anthropic"      # Primary provider
  fallback: ["openai"]      # Backup providers
  anthropic:
    api_key: "sk-ant-..."
    model: "claude-sonnet-4-5-20250929"

# Personality traits
personality:
  core_traits:
    - "loyal"
    - "efficient"
    - "proactive"

# Permission level (0-5)
authority:
  default_level: 3

# Active role
active_role: "default"
```

## Testing Different Providers

### Test Anthropic Only

```typescript
const manager = new LLMManager();
manager.registerProvider(new AnthropicProvider('sk-ant-...'));
manager.setPrimary('anthropic');
```

### Test OpenAI Only

```typescript
const manager = new LLMManager();
manager.registerProvider(new OpenAIProvider('sk-...'));
manager.setPrimary('openai');
```

### Test Ollama Only

```typescript
const manager = new LLMManager();
manager.registerProvider(new OllamaProvider());
manager.setPrimary('ollama');
```

### Test with Fallback

```typescript
// Primary: Anthropic, Fallback: OpenAI
manager.registerProvider(new AnthropicProvider('sk-ant-...'));
manager.registerProvider(new OpenAIProvider('sk-...'));
manager.setPrimary('anthropic');
manager.setFallbackChain(['openai']);

// Will use Anthropic first, OpenAI if Anthropic fails
const response = await manager.chat(messages);
```

## Performance Tips

1. **Use Streaming**: For better UX in interactive applications
   ```typescript
   for await (const event of manager.stream(messages)) {
     if (event.type === 'text') process.stdout.write(event.text);
   }
   ```

2. **Set Temperature**: Lower = more focused, higher = more creative
   ```typescript
   await manager.chat(messages, { temperature: 0.7 });
   ```

3. **Limit Tokens**: Control response length and cost
   ```typescript
   await manager.chat(messages, { max_tokens: 500 });
   ```

4. **Use Local for Development**: Free and fast
   ```yaml
   llm:
     primary: "ollama"  # No API costs
   ```

## Security Best Practices

1. **Never commit API keys**: Keep them in `~/.jarvis/config.yaml` only
2. **Use environment variables**: For production deployments
3. **Restrict config permissions**: `chmod 600 ~/.jarvis/config.yaml`
4. **Monitor usage**: Track token usage to control costs
5. **Use fallbacks**: Always configure backup providers

## Getting Help

- Check `~/jarvis/src/llm/README.md` for detailed docs
- Review `~/jarvis/IMPLEMENTATION_SUMMARY.md` for architecture
- Run test file to verify setup: `bun run src/llm/test.ts`
- Check config: `cat ~/.jarvis/config.yaml`

## Resources

- **Anthropic**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/
- **Ollama**: https://ollama.ai/
- **Bun Runtime**: https://bun.sh/

You're all set! Start building with J.A.R.V.I.S. 🚀
