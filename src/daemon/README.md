# J.A.R.V.I.S. Daemon

Core daemon infrastructure for the JARVIS system.

## Overview

The daemon provides:
- **Service Registry**: Manages lifecycle of all system services (observers, agents, WebSocket server)
- **Health Monitoring**: Tracks system health, memory usage, database connectivity
- **Graceful Shutdown**: Handles SIGINT/SIGTERM signals and stops services cleanly
- **Structured Logging**: Timestamped logs for debugging and monitoring

## Architecture

```
src/daemon/
├── index.ts      # Main entry point and CLI
├── services.ts   # Service registry and lifecycle management
└── health.ts     # Health monitoring and status reporting
```

## Usage

### Running the Daemon

```bash
# Run with defaults (port 3142, ~/.jarvis data directory)
bun run src/daemon/index.ts

# Run with custom configuration
bun run src/daemon/index.ts --port 3142 --data-dir ~/my-jarvis-data

# See all options
bun run src/daemon/index.ts --help
```

### Programmatic Usage

```typescript
import { startDaemon } from './src/daemon/index.ts';

await startDaemon({
  port: 3142,
  dataDir: '/path/to/data',
  dbPath: '/path/to/jarvis.db',
  healthCheckInterval: 30000, // 30 seconds
});
```

## Service Registry

Services implement the `Service` interface:

```typescript
export interface Service {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): ServiceStatus;
}
```

Register services before starting the daemon:

```typescript
import { ServiceRegistry } from './src/daemon/services.ts';

const registry = new ServiceRegistry();

// Register your service
registry.register({
  name: 'my-service',
  async start() {
    // Start logic
  },
  async stop() {
    // Stop logic
  },
  status() {
    return 'running';
  }
});

// Start all services
await registry.startAll();

// Stop all services (in reverse order)
await registry.stopAll();
```

## Health Monitoring

The health monitor tracks:
- **Uptime**: Total daemon uptime in seconds
- **Services**: Status of each registered service
- **Memory**: Heap usage and RSS
- **Database**: Connection status and file size

Access health status:

```typescript
import { HealthMonitor } from './src/daemon/health.ts';

const monitor = new HealthMonitor(registry, dbPath);
monitor.start(30000); // Check every 30 seconds

const health = monitor.getHealth();
console.log(health);
// {
//   uptime: 120,
//   services: { core: 'running', observers: 'running' },
//   memory: { heapUsed: 1048576, heapTotal: 2097152, rss: 45678912 },
//   database: { connected: true, size: 4096 },
//   startedAt: 1708644000000
// }

// Get formatted health report
console.log(monitor.formatHealth());
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `--port` | 3142 | WebSocket server port |
| `--data-dir` | `~/.jarvis` | Data directory |
| `--db-path` | `~/.jarvis/jarvis.db` | Database file path |
| `--health-interval` | 30000 | Health check interval (ms) |

## Graceful Shutdown

The daemon handles:
- `SIGINT` (Ctrl+C)
- `SIGTERM` (kill command)
- Uncaught exceptions
- Unhandled promise rejections

Shutdown sequence:
1. Stop health monitor
2. Stop all services in reverse order
3. Close database connection
4. Exit process

Press Ctrl+C twice for force shutdown.

## Development

### Adding a New Service

1. Implement the `Service` interface
2. Register the service in `src/daemon/index.ts`
3. The daemon will handle start/stop lifecycle

Example:

```typescript
// src/observers/file-observer.ts
import type { Service, ServiceStatus } from '../daemon/services.ts';

export class FileObserver implements Service {
  name = 'file-observer';
  private watcher: FSWatcher | null = null;
  private _status: ServiceStatus = 'stopped';

  async start(): Promise<void> {
    this._status = 'starting';
    // Set up file watching
    this._status = 'running';
  }

  async stop(): Promise<void> {
    this._status = 'stopping';
    this.watcher?.close();
    this._status = 'stopped';
  }

  status(): ServiceStatus {
    return this._status;
  }
}

// Register in src/daemon/index.ts
import { FileObserver } from '../observers/file-observer.ts';

registry.register(new FileObserver());
```

## Logging

All logs include timestamps and component prefixes:

```
[2026-02-22T22:17:03.230Z] Initializing database at /home/user/.jarvis/jarvis.db
[ServiceRegistry] Starting core...
[ServiceRegistry] ✓ core started
[HealthMonitor] Starting health checks (every 30000ms)
```

## Database

The daemon uses `bun:sqlite` with:
- **WAL mode**: Better concurrency
- **Foreign keys**: Enabled
- **Location**: `~/.jarvis/jarvis.db` (configurable)

Schema is managed by `~/jarvis/src/vault/schema.ts`.

## Testing

Run a quick test:

```bash
# Start daemon and let it run for 3 seconds
timeout 3 bun run src/daemon/index.ts --data-dir /tmp/test-jarvis
```

Expected output:
- ASCII banner
- Configuration summary
- Database initialization
- Service startup
- Health status
- Graceful shutdown on timeout

## Next Steps

Replace placeholder services with real implementations:
- Observer services (file, window, process, etc.)
- Agent services (personality, decision-making)
- WebSocket server for external communication
- Commitment scheduler
- Vector embedding service
