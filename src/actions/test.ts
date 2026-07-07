#!/usr/bin/env bun

import {
  getAppController,
  TerminalExecutor,
  WSLBridge,
  BrowserSession,
  CDPBrowser,
  ToolRegistry,
  type ToolDefinition,
} from './index.ts';

async function testActionLayer() {
  console.log('Testing J.A.R.V.I.S. Action Layer\n');

  console.log('1. App Controller');
  console.log(`   Platform: ${process.platform}`);
  try {
    const appController = getAppController();
    console.log(`   ✓ App controller initialized for ${process.platform}`);
  } catch (error) {
    console.log(`   ⚠ App controller not available: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
  }

  console.log('\n2. Terminal Executor');
  const executor = new TerminalExecutor();
  console.log(`   Detected shell: ${executor.getShell()}`);
  try {
    const result = await executor.execute('echo "Hello from JARVIS"');
    console.log(`   ✓ Command executed: ${result.stdout.trim()}`);
    console.log(`   Duration: ${result.duration}ms`);
  } catch (error) {
    console.log(`   ✗ Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n3. WSL Bridge');
  const isWSL = WSLBridge.isWSL();
  console.log(`   Running in WSL: ${isWSL}`);
  if (isWSL) {
    const bridge = new WSLBridge();
    console.log(`   Windows home: ${bridge.getWindowsHome() ?? 'Not detected'}`);
  }

  console.log('\n4. Browser Session');
  const browserSession = new BrowserSession(9222);
  const isAvailable = await browserSession.isAvailable();
  console.log(`   Chrome DevTools available: ${isAvailable}`);
  if (isAvailable) {
    try {
      await (browserSession as any).ensureConnected();
      const browser = (browserSession as any).getBrowser();
      const tabs = await browser.listTabs();
      console.log(`   ✓ Found ${tabs.length} browser tab(s)`);
      await browserSession.disconnect();
    } catch (error) {
      console.log(`   ⚠ Could not connect: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
    }
  }

  console.log('\n5. Tool Registry');
  const registry = new ToolRegistry();

  const exampleTool: ToolDefinition = {
    name: 'echo',
    description: 'Echo a message',
    category: 'utility',
    parameters: {
      message: {
        type: 'string',
        description: 'Message to echo',
        required: true,
      },
    },
    execute: async (params) => {
      return `Echo: ${params.message}`;
    },
  };

  registry.register(exampleTool);
  console.log(`   Registered tools: ${registry.count()}`);
  console.log(`   Categories: ${registry.getCategories().join(', ')}`);

  try {
    const result = await registry.execute('echo', { message: 'Hello JARVIS!' });
    console.log(`   ✓ Tool execution: ${result}`);
  } catch (error) {
    console.log(`   ✗ Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('\n✓ Action Layer test complete!\n');
}

testActionLayer().catch(console.error);
