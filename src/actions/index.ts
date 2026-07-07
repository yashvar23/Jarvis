// App Control exports
export { getAppController } from './app-control/interface.ts';
export type { AppController, WindowInfo, UIElement } from './app-control/interface.ts';
export { LinuxAppController } from './app-control/linux.ts';
export { WindowsAppController } from './app-control/windows.ts';
export { MacAppController } from './app-control/macos.ts';

// Browser exports
export { CDPClient as CDPBrowser } from './browser/cdp.ts';
export type { PageElement as BrowserTab } from './browser/session.ts';
export { BrowserController as BrowserSession } from './browser/session.ts';

// Terminal exports
export { TerminalExecutor } from './terminal/executor.ts';
export type { CommandResult, ExecuteOptions } from './terminal/executor.ts';
export { WSLBridge } from './terminal/wsl-bridge.ts';

// Tools exports
export { ToolRegistry } from './tools/registry.ts';
export type { ToolDefinition, ToolParameter } from './tools/registry.ts';
