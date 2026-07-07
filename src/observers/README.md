# Observer Layer

The Observer Layer monitors system events and emits standardized observations to the Vault. All observers implement a common interface and can be managed centrally through the `ObserverManager`.

## Architecture

### Common Interface

All observers implement the `Observer` interface:

```typescript
interface Observer {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  onEvent(handler: ObserverEventHandler): void;
}
```

Events are emitted in a standardized format:

```typescript
type ObserverEvent = {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
};
```

## Observers

### FileWatcher (Fully Implemented)

Monitors file system changes in specified directories.

```typescript
import { FileWatcher } from './file-watcher';

const watcher = new FileWatcher([
  '/home/user/projects',
  '/home/user/documents'
]);

watcher.onEvent((event) => {
  // event.type: 'file_change'
  // event.data: { path, eventType: 'rename'|'change', filename, basePath }
});

await watcher.start();
```

Features:
- Recursive directory watching using `node:fs` watch API
- Debouncing (100ms) to avoid duplicate rapid-fire events
- Automatic cleanup of old debounce entries to prevent memory leaks

### ClipboardMonitor (Fully Implemented)

Polls the system clipboard and detects content changes.

```typescript
import { ClipboardMonitor } from './clipboard';

const clipboard = new ClipboardMonitor(1000); // Poll every 1 second

clipboard.onEvent((event) => {
  // event.type: 'clipboard'
  // event.data: { content, length }
});

await clipboard.start();
```

Features:
- Cross-platform clipboard reading (Linux/macOS/Windows/WSL)
- Automatic platform detection and command selection
- Silent failure on read errors to avoid spam

Platform commands used:
- Linux: `xclip` or `xsel`
- macOS: `pbpaste`
- Windows/WSL: `powershell.exe Get-Clipboard`

### ProcessMonitor (Fully Implemented)

Monitors running processes and detects lifecycle changes.

```typescript
import { ProcessMonitor } from './processes';

const processes = new ProcessMonitor(5000); // Poll every 5 seconds

processes.onEvent((event) => {
  // event.type: 'process_started' or 'process_stopped'
  // event.data: { pid, name, cpu?, memory? }
});

await processes.start();
```

Features:
- Cross-platform process listing (Linux/macOS/Windows)
- Detects new and terminated processes
- Provides CPU and memory usage data
- Automatic cleanup of terminated process records

### NotificationListener (Stub)

Placeholder for system notification monitoring.

**TODO:**
- Linux: Monitor D-Bus `org.freedesktop.Notifications`
- Windows: Use PowerShell to read notification center
- macOS: Use notification center API

### CalendarSync (Stub)

Placeholder for calendar integration.

**TODO:**
- Google Calendar API integration (OAuth2)
- Microsoft Graph API (Outlook/Office 365)
- CalDAV support for generic providers

### EmailSync (Stub)

Placeholder for email integration.

**TODO:**
- Gmail API integration (OAuth2)
- Microsoft Graph API (Outlook/Office 365)
- IMAP support for generic providers

## ObserverManager

The `ObserverManager` provides centralized control over all observers.

```typescript
import { ObserverManager, FileWatcher, ClipboardMonitor } from './observers';

const manager = new ObserverManager();

// Register observers
manager.register(new FileWatcher(['/path/to/watch']));
manager.register(new ClipboardMonitor(1000));

// Set event handler (typically the Vault's ingestion function)
manager.setEventHandler((event) => {
  console.log(`[${event.type}]`, event.data);
  // Forward to Vault for storage/analysis
});

// Start all observers
await manager.startAll();

// Get status
console.log(manager.getStatus());
// => { 'file-watcher': true, 'clipboard': true }

// Stop specific observer
await manager.stopObserver('clipboard');

// Stop all observers
await manager.stopAll();
```

### Manager API

- `register(observer: Observer)` - Register a new observer
- `setEventHandler(handler: ObserverEventHandler)` - Set global event handler
- `startAll()` - Start all registered observers
- `stopAll()` - Stop all registered observers
- `startObserver(name: string)` - Start specific observer
- `stopObserver(name: string)` - Stop specific observer
- `getStatus()` - Get running status of all observers
- `listObservers()` - Get list of registered observer names

## Usage Example

See `example.ts` for a complete working example:

```bash
bun run src/observers/example.ts
```

This will run all observers for 30 seconds and log events to the console.

## Integration with Vault

The Observer Layer is designed to integrate with the Vault for persistent storage:

```typescript
import { ObserverManager } from './observers';
import { Vault } from '../vault';

const vault = new Vault();
const manager = new ObserverManager();

// Register all observers...
manager.register(new FileWatcher(['/home/user/projects']));
// ... etc

// Connect to Vault
manager.setEventHandler((event) => {
  vault.storeObservation(event);
});

await manager.startAll();
```

## Event Types

Current event types emitted by observers:

- `file_change` - File system change detected
- `clipboard` - Clipboard content changed
- `process_started` - New process started
- `process_stopped` - Process terminated

Future event types (when stubs are implemented):

- `notification` - System notification received
- `calendar_event` - Calendar event upcoming/created/updated
- `new_email` - New email received
- `email_read` - Email marked as read
- `email_sent` - Email sent

## Performance Considerations

- **FileWatcher**: Uses native `node:fs` watch API with minimal overhead
- **ClipboardMonitor**: Polling-based, configurable interval (default 1s)
- **ProcessMonitor**: Polling-based, configurable interval (default 5s)
- **Debouncing**: FileWatcher implements 100ms debouncing for rapid changes
- **Memory**: Old debounce entries are automatically cleaned up

## Error Handling

All observers implement graceful error handling:

- Silent failures for transient errors (e.g., clipboard read failures)
- Console logging for persistent errors
- Proper cleanup in `stop()` methods
- Error isolation (one observer's failure doesn't affect others)

## Platform Support

- **Linux**: Full support for all implemented observers
- **macOS**: Full support for all implemented observers
- **Windows**: Full support for all implemented observers
- **WSL**: Full support (uses Windows clipboard via PowerShell)

## Testing

Run the example to test all observers:

```bash
bun run src/observers/example.ts
```

Or create custom tests:

```typescript
import { test, expect } from 'bun:test';
import { FileWatcher } from './file-watcher';

test('FileWatcher starts and stops', async () => {
  const watcher = new FileWatcher(['/tmp']);

  expect(watcher.isRunning()).toBe(false);

  await watcher.start();
  expect(watcher.isRunning()).toBe(true);

  await watcher.stop();
  expect(watcher.isRunning()).toBe(false);
});
```
