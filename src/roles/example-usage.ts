#!/usr/bin/env bun
/**
 * Example usage of the Role Engine in a real application
 *
 * This demonstrates how to integrate the Role Engine with an agent system
 */

import {
  loadRolesFromDir,
  buildSystemPrompt,
  canPerform,
  getRolePermissionsSummary,
  type RoleDefinition,
  type ActionCategory,
} from './index.ts';

// Mock agent state
interface AgentState {
  id: string;
  role: RoleDefinition;
  currentTask?: string;
  commitments: string[];
  observations: string[];
}

/**
 * Initialize the role system and load all available roles
 */
function initializeRoleSystem(rolesDir: string): Map<string, RoleDefinition> {
  console.log('🔧 Initializing Role System...');
  const roles = loadRolesFromDir(rolesDir);
  console.log(`✅ Loaded ${roles.size} roles`);

  // Display loaded roles
  for (const [id, role] of roles) {
    console.log(`   - ${role.name} (authority: ${role.authority_level}/10)`);
  }

  return roles;
}

/**
 * Create an agent with a specific role
 */
function createAgent(
  agentId: string,
  roleId: string,
  roles: Map<string, RoleDefinition>
): AgentState | null {
  const role = roles.get(roleId);

  if (!role) {
    console.error(`❌ Role '${roleId}' not found`);
    return null;
  }

  console.log(`\n🤖 Creating agent '${agentId}' with role '${role.name}'`);

  const agent: AgentState = {
    id: agentId,
    role,
    commitments: [],
    observations: [],
  };

  // Display agent capabilities
  const permissions = getRolePermissionsSummary(role);
  console.log(`   Authority: ${permissions.level}/10`);
  console.log(`   ${permissions.description}`);
  console.log(`   Allowed actions: ${permissions.allowed.join(', ')}`);

  return agent;
}

/**
 * Check if an agent can perform an action, with logging
 */
function checkAction(agent: AgentState, action: ActionCategory): boolean {
  const can = canPerform(agent.role, action);
  const status = can ? '✅' : '❌';
  console.log(`   ${status} ${action}: ${can ? 'ALLOWED' : 'DENIED'}`);
  return can;
}

/**
 * Generate system prompt for an agent
 */
function generateAgentPrompt(agent: AgentState, userName: string): string {
  console.log(`\n📝 Generating system prompt for ${agent.id}...`);

  const prompt = buildSystemPrompt(agent.role, {
    userName,
    currentTime: new Date().toLocaleString(),
    activeCommitments: agent.commitments,
    recentObservations: agent.observations,
    agentHierarchy: 'You are a top-level agent',
  });

  console.log(`   Generated ${prompt.length} characters`);
  return prompt;
}

/**
 * Simulate an agent attempting various actions
 */
function simulateAgentActions(agent: AgentState) {
  console.log(`\n🎬 Simulating actions for ${agent.role.name}...`);

  const actions: ActionCategory[] = [
    'read_data',
    'write_data',
    'send_message',
    'execute_command',
    'spawn_agent',
    'send_email',
    'make_payment',
    'delete_data',
  ];

  for (const action of actions) {
    checkAction(agent, action);
  }
}

/**
 * Main demonstration
 */
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  J.A.R.V.I.S. Role Engine - Usage Example');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Initialize role system
  const { join } = await import('path');
  const roles = initializeRoleSystem(join(import.meta.dir, '../../roles'));

  // 2. Create different agents with different roles
  const execAgent = createAgent('agent-001', 'executive_assistant', roles);
  const researchAgent = createAgent('agent-002', 'research_specialist', roles);
  const observerAgent = createAgent('agent-003', 'activity_observer', roles);
  const sysAdminAgent = createAgent('agent-004', 'system_admin', roles);

  if (!execAgent || !researchAgent || !observerAgent || !sysAdminAgent) {
    console.error('Failed to create agents');
    return;
  }

  // 3. Add some state to the executive agent
  execAgent.commitments = [
    'Prepare board meeting presentation',
    'Review quarterly reports',
  ];
  execAgent.observations = [
    'User has 3 meetings tomorrow morning',
    'User prefers detailed reports',
  ];

  // 4. Generate system prompts
  const execPrompt = generateAgentPrompt(execAgent, 'Alice Johnson');

  // 5. Test permission boundaries
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Permission Testing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  simulateAgentActions(execAgent);
  simulateAgentActions(observerAgent);
  simulateAgentActions(sysAdminAgent);

  // 6. Show a snippet of the generated prompt
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Sample System Prompt');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(execPrompt.substring(0, 600) + '...\n');

  // 7. Compare roles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Role Comparison');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const agents = [execAgent, researchAgent, observerAgent, sysAdminAgent];

  console.log('Role                  | Auth | Can Execute? | Can Pay? | Tools');
  console.log('──────────────────────|──────|──────────────|──────────|──────');

  for (const agent of agents) {
    const name = agent.role.name.padEnd(21);
    const auth = `${agent.role.authority_level}/10`.padEnd(4);
    const canExec = canPerform(agent.role, 'execute_command') ? '✅ Yes' : '❌ No ';
    const canPay = canPerform(agent.role, 'make_payment') ? '✅ Yes' : '❌ No ';
    const tools = agent.role.tools.length;
    console.log(`${name} | ${auth} | ${canExec}       | ${canPay}     | ${tools}`);
  }

  console.log('\n✅ Example complete!\n');
}

main().catch(console.error);
