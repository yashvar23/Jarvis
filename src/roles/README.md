# Role Engine

The Role Engine is a core component of Project J.A.R.V.I.S. that defines, loads, and manages AI agent roles with their permissions, responsibilities, and behavior patterns.

## Overview

The Role Engine provides:

- **Role Definitions**: YAML-based role configuration with clear responsibilities and boundaries
- **Authority System**: 10-level permission system controlling what actions agents can perform
- **System Prompt Generation**: Automatic generation of detailed system prompts from role definitions
- **Validation**: Type-safe role loading with comprehensive validation
- **Multi-Role Management**: Load and manage multiple roles from a directory

## Architecture

```
src/roles/
├── types.ts            # TypeScript type definitions
├── loader.ts           # YAML loading and validation
├── prompt-builder.ts   # System prompt generation
├── authority.ts        # Permission and authority system
└── index.ts            # Public API exports
```

## Usage

### Loading a Single Role

```typescript
import { loadRole } from './roles/index.ts';

const role = loadRole('/path/to/role.yaml');
console.log(role.name, role.authority_level);
```

### Loading Multiple Roles

```typescript
import { loadRolesFromDir } from './roles/index.ts';

const roles = loadRolesFromDir('/config/roles');
for (const [id, role] of roles) {
  console.log(`${id}: ${role.name}`);
}
```

### Building System Prompts

```typescript
import { buildSystemPrompt } from './roles/index.ts';

const prompt = buildSystemPrompt(role, {
  userName: 'John Doe',
  currentTime: new Date().toLocaleString(),
  activeCommitments: ['Finish report by Friday'],
  recentObservations: ['User prefers morning meetings'],
  agentHierarchy: 'Manager > Assistant (you) > Specialist',
});
```

### Checking Permissions

```typescript
import { canPerform, getRolePermissionsSummary } from './roles/index.ts';

// Check specific action
if (canPerform(role, 'execute_command')) {
  console.log('Can execute commands');
}

// Get full permission summary
const summary = getRolePermissionsSummary(role);
console.log(summary.allowed);  // List of allowed actions
console.log(summary.denied);   // List of denied actions
```

## Role Definition Format

Roles are defined in YAML files with the following structure:

```yaml
id: unique_role_id
name: Human-Readable Role Name
description: Brief description of the role's purpose

responsibilities:
  - First responsibility
  - Second responsibility

autonomous_actions:
  - Actions the agent can take without asking

approval_required:
  - Actions that require user approval

kpis:
  - name: KPI Name
    metric: What to measure
    target: Target value
    check_interval: How often to check

communication_style:
  tone: Description of communication tone
  verbosity: concise | detailed | adaptive
  formality: formal | casual | adaptive

heartbeat_instructions: |
  Instructions for periodic check-ins.
  What to monitor and when to notify the user.

sub_roles:
  - role_id: sub_role_id
    name: Sub-Role Name
    description: What this sub-role does
    spawned_by: parent_role_id
    reports_to: parent_role_id
    max_budget_per_task: 100

tools:
  - tool_name_1
  - tool_name_2

authority_level: 6  # 1-10
```

## Authority Levels

The authority system uses a 1-10 scale:

| Level | Capabilities |
|-------|-------------|
| 1-2   | **Read Only**: Can read data but cannot modify anything |
| 3-4   | **Read & Write**: Can read/write data and send messages |
| 5-6   | **Command Execution**: Can execute commands, control apps, access browser |
| 7-8   | **Agent Management**: Can spawn agents, send emails, install software |
| 9-10  | **Full Access**: Can make payments, modify settings, delete data, terminate agents |

### Action Categories

The following action categories are enforced:

**Level 1+**: `read_data`

**Level 3+**: `write_data`, `send_message`

**Level 5+**: `execute_command`, `access_browser`, `control_app`

**Level 7+**: `spawn_agent`, `send_email`, `install_software`

**Level 9+**: `make_payment`, `modify_settings`, `delete_data`, `terminate_agent`

## Example Roles

See `/config/roles/` for example role definitions:

- **Executive Assistant** (Level 6): Manages schedule, communications, and tasks
- **Research Specialist** (Level 4): Deep research and report generation
- **System Administrator** (Level 9): System maintenance and infrastructure

## Type Definitions

### RoleDefinition

```typescript
type RoleDefinition = {
  id: string;
  name: string;
  description: string;
  responsibilities: string[];
  autonomous_actions: string[];
  approval_required: string[];
  kpis: KPI[];
  communication_style: CommunicationStyle;
  heartbeat_instructions: string;
  sub_roles: SubRoleTemplate[];
  tools: string[];
  authority_level: number;  // 1-10
};
```

### KPI

```typescript
type KPI = {
  name: string;
  metric: string;
  target: string;
  check_interval: string;
};
```

### CommunicationStyle

```typescript
type CommunicationStyle = {
  tone: string;
  verbosity: 'concise' | 'detailed' | 'adaptive';
  formality: 'formal' | 'casual' | 'adaptive';
};
```

### SubRoleTemplate

```typescript
type SubRoleTemplate = {
  role_id: string;
  name: string;
  description: string;
  spawned_by: string;
  reports_to: string;
  max_budget_per_task: number;
};
```

## Testing

Run the test suite:

```bash
# Test single role loading
bun run src/roles/test.ts

# Test multi-role loading
bun run src/roles/test-multi.ts
```

## Integration with J.A.R.V.I.S.

The Role Engine integrates with:

1. **Agent System**: Agents are instantiated with specific roles
2. **LLM Integration**: System prompts are generated for LLM context
3. **Permission System**: Authority levels enforce action restrictions
4. **Daemon**: Roles are loaded at startup and managed by the daemon

## Best Practices

1. **Authority Principle**: Assign the minimum authority level needed for the role
2. **Clear Boundaries**: Explicitly define autonomous vs approval-required actions
3. **Measurable KPIs**: Define concrete, measurable success metrics
4. **Heartbeat Clarity**: Provide clear, actionable heartbeat instructions
5. **Tool Assignment**: Only assign tools the role actually needs
6. **Communication Style**: Match style to the role's purpose and audience

## Future Enhancements

- Role templates and inheritance
- Dynamic authority adjustment based on performance
- Role-based routing and delegation
- Automatic KPI tracking and reporting
- Role versioning and migration
