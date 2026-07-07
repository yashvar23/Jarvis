import { test, expect, describe } from 'bun:test';
import { ChannelManager } from './index.ts';
import type { ChannelAdapter, ChannelMessage } from './channels/telegram.ts';
import { splitMessage } from './channels/discord.ts';

// Mock channel adapter for testing
class MockChannel implements ChannelAdapter {
  name = 'mock';
  private _connected = false;
  private _handler: ((msg: ChannelMessage) => Promise<string>) | null = null;

  async connect(): Promise<void> {
    this._connected = true;
  }

  async disconnect(): Promise<void> {
    this._connected = false;
  }

  async sendMessage(to: string, text: string): Promise<void> {
    // Mock implementation
  }

  onMessage(handler: (msg: ChannelMessage) => Promise<string>): void {
    this._handler = handler;
  }

  isConnected(): boolean {
    return this._connected;
  }

  // Test helper to simulate receiving a message
  async simulateMessage(text: string): Promise<string | null> {
    if (!this._handler) return null;

    const msg: ChannelMessage = {
      id: '1',
      channel: 'mock',
      from: 'testuser',
      text,
      timestamp: Date.now(),
      metadata: {},
    };

    return this._handler(msg);
  }
}

test('ChannelManager - register channel', () => {
  const manager = new ChannelManager();
  const channel = new MockChannel();

  manager.register(channel);
  expect(manager.listChannels()).toEqual(['mock']);
  expect(manager.getChannel('mock')).toBe(channel);
});

test('ChannelManager - set handler', async () => {
  const manager = new ChannelManager();
  const channel = new MockChannel();

  manager.register(channel);

  let handlerCalled = false;
  manager.setHandler(async (msg) => {
    handlerCalled = true;
    return `Echo: ${msg.text}`;
  });

  const response = await channel.simulateMessage('test');
  expect(handlerCalled).toBe(true);
  expect(response).toBe('Echo: test');
});

test('ChannelManager - connect all channels', async () => {
  const manager = new ChannelManager();
  const channel1 = new MockChannel();
  const channel2 = new MockChannel();
  channel2.name = 'mock2';

  manager.register(channel1);
  manager.register(channel2);

  await manager.connectAll();

  const status = manager.getStatus();
  expect(status.mock).toBe(true);
  expect(status.mock2).toBe(true);
});

test('ChannelManager - disconnect all channels', async () => {
  const manager = new ChannelManager();
  const channel = new MockChannel();

  manager.register(channel);
  await manager.connectAll();

  expect(manager.getStatus().mock).toBe(true);

  await manager.disconnectAll();
  expect(manager.getStatus().mock).toBe(false);
});

test('ChannelManager - list channels', () => {
  const manager = new ChannelManager();

  expect(manager.listChannels()).toEqual([]);

  manager.register(new MockChannel());
  expect(manager.listChannels()).toEqual(['mock']);

  const channel2 = new MockChannel();
  channel2.name = 'mock2';
  manager.register(channel2);

  expect(manager.listChannels()).toContain('mock');
  expect(manager.listChannels()).toContain('mock2');
});

// Discord splitMessage tests
describe('Discord splitMessage', () => {
  test('returns single chunk for short message', () => {
    const result = splitMessage('Hello world', 2000);
    expect(result).toEqual(['Hello world']);
  });

  test('returns single chunk for message exactly at limit', () => {
    const text = 'a'.repeat(2000);
    const result = splitMessage(text, 2000);
    expect(result).toEqual([text]);
  });

  test('splits long message at newline boundary', () => {
    const line = 'This is a line of text\n';
    // Create text that exceeds 100 chars, with newlines
    const text = line.repeat(10); // 220 chars
    const result = splitMessage(text, 100);
    expect(result.length).toBeGreaterThan(1);
    // Each chunk should be <= 100 chars
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
    // Recombined should equal original (modulo trimmed whitespace)
    const recombined = result.join('');
    // The original text is preserved (whitespace trimming might remove leading spaces between chunks)
    expect(recombined.replace(/\s+/g, '')).toBe(text.replace(/\s+/g, ''));
  });

  test('hard splits when no good break point', () => {
    // No spaces or newlines — must hard split
    const text = 'a'.repeat(5000);
    const result = splitMessage(text, 2000);
    expect(result.length).toBe(3); // 2000 + 2000 + 1000
    expect(result[0]!.length).toBe(2000);
    expect(result[1]!.length).toBe(2000);
    expect(result[2]!.length).toBe(1000);
  });

  test('handles empty string', () => {
    const result = splitMessage('', 2000);
    expect(result).toEqual(['']);
  });

  test('splits at space when no newlines available', () => {
    // Words separated by spaces, no newlines
    const words = Array(200).fill('word').join(' '); // "word word word..." ~1000 chars
    const result = splitMessage(words, 100);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
  });
});
