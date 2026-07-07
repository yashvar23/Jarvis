/**
 * Example usage of J.A.R.V.I.S. Communication Layer
 *
 * This demonstrates how to:
 * 1. Start the WebSocket server
 * 2. Set up Telegram bot integration
 * 3. Handle messages from multiple channels
 * 4. Relay LLM streaming responses
 */

import {
  WebSocketServer,
  ChannelManager,
  TelegramAdapter,
  StreamRelay,
  type WSMessage,
  type ChannelMessage,
} from './index.ts';

async function main() {
  console.log('🤖 Starting J.A.R.V.I.S. Communication Layer...\n');

  // 1. Initialize WebSocket server
  const wsServer = new WebSocketServer(3142);

  wsServer.setHandler({
    async onMessage(msg: WSMessage) {
      console.log('[WS] Received message:', msg.type);

      if (msg.type === 'chat') {
        // Echo back for demo
        return {
          type: 'chat' as const,
          payload: {
            reply: `You said: ${msg.payload}`,
          },
          id: msg.id,
          timestamp: Date.now(),
        };
      }
    },
    onConnect() {
      console.log('[WS] Client connected');
    },
    onDisconnect() {
      console.log('[WS] Client disconnected');
    },
  });

  wsServer.start();

  // 2. Initialize Channel Manager
  const channelManager = new ChannelManager();

  // Set up unified message handler
  channelManager.setHandler(async (message: ChannelMessage) => {
    console.log(`\n[${message.channel.toUpperCase()}] Message from ${message.from}:`);
    console.log(`  "${message.text}"`);

    // Broadcast to WebSocket clients
    wsServer.broadcast({
      type: 'chat',
      payload: {
        channel: message.channel,
        from: message.from,
        text: message.text,
      },
      id: message.id,
      timestamp: message.timestamp,
    });

    // Simple echo response for demo
    return `Received your message: "${message.text}"`;
  });

  // 3. Register channels (Telegram only for demo)
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

  if (telegramToken) {
    const telegram = new TelegramAdapter(telegramToken);
    channelManager.register(telegram);
    console.log('✓ Telegram adapter registered');
  } else {
    console.log('⚠️  TELEGRAM_BOT_TOKEN not set, skipping Telegram');
  }

  // Connect all channels
  try {
    await channelManager.connectAll();
    console.log('\n✓ All channels connected');
    console.log('Status:', channelManager.getStatus());
  } catch (error) {
    console.error('Error connecting channels:', error);
  }

  // 4. Demo: Stream relay (requires LLM provider setup)
  const streamRelay = new StreamRelay(wsServer);

  // Example stream simulation
  console.log('\n📡 Streaming demo (simulated)...');
  const simulatedStream = (async function* () {
    yield { type: 'text' as const, text: 'Hello ' };
    await new Promise(r => setTimeout(r, 100));
    yield { type: 'text' as const, text: 'from ' };
    await new Promise(r => setTimeout(r, 100));
    yield { type: 'text' as const, text: 'J.A.R.V.I.S.!' };
    await new Promise(r => setTimeout(r, 100));
    yield { type: 'done' as const, response: { content: 'Hello from J.A.R.V.I.S.!', tool_calls: [], usage: { input_tokens: 0, output_tokens: 10 }, model: 'demo', finish_reason: 'stop' as const } };
  })();

  const fullResponse = await streamRelay.relayStream(simulatedStream, 'demo-123');
  console.log('Full response:', fullResponse);

  console.log('\n✓ Communication layer is running');
  console.log(`  WebSocket: ws://localhost:${wsServer.getPort()}/ws`);
  console.log(`  Health: http://localhost:${wsServer.getPort()}/health`);
  console.log(`  Channels: ${channelManager.listChannels().join(', ')}`);
  console.log('\nPress Ctrl+C to stop...');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    await channelManager.disconnectAll();
    wsServer.stop();
    process.exit(0);
  });
}

main().catch(console.error);
