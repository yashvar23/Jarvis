#!/usr/bin/env bun
/**
 * Test utility functions
 */

import {
  loadRolesFromDir,
  findRolesWithPermission,
  findMinimalRoleForAction,
  compareRoles,
  getRoleHierarchy,
  validateRoleHierarchy,
  getRoleStats,
  findSpawnersOfRole,
} from './index.ts';

console.log('🧪 Testing Role Utility Functions\n');

// Load roles
import { join } from 'path';
const roles = loadRolesFromDir(join(import.meta.dir, '../../roles'));
console.log(`✅ Loaded ${roles.size} roles\n`);

// Test 1: Find roles with specific permission
console.log('Test 1: Find roles that can execute commands');
const execRoles = findRolesWithPermission(roles, 'execute_command');
console.log(`Found ${execRoles.length} roles:`);
execRoles.forEach(r => console.log(`  - ${r.name} (level ${r.authority_level})`));

// Test 2: Find minimal role for action
console.log('\nTest 2: Find least privileged role that can send email');
const minRole = findMinimalRoleForAction(roles, 'send_email');
if (minRole) {
  console.log(`  ✅ ${minRole.name} (level ${minRole.authority_level})`);
} else {
  console.log('  ❌ No role can send email');
}

// Test 3: Compare two roles
console.log('\nTest 3: Compare Executive Assistant vs Research Specialist');
const exec = roles.get('executive_assistant');
const research = roles.get('research_specialist');

if (exec && research) {
  const comparison = compareRoles(exec, research);
  console.log(`  Only ${exec.name}:`);
  comparison.onlyInRole1.forEach(a => console.log(`    - ${a}`));
  console.log(`  Only ${research.name}:`);
  comparison.onlyInRole2.forEach(a => console.log(`    - ${a}`));
  console.log(`  Both roles:`);
  comparison.inBoth.forEach(a => console.log(`    - ${a}`));
}

// Test 4: Role hierarchy
console.log('\nTest 4: Role hierarchy by authority level');
console.log(getRoleHierarchy(roles));

// Test 5: Validate hierarchy
console.log('\nTest 5: Validate role hierarchy');
const validation = validateRoleHierarchy(roles);
if (validation.valid) {
  console.log('  ✅ Role hierarchy is valid');
} else {
  console.log('  ❌ Hierarchy errors:');
  validation.errors.forEach(e => console.log(`    - ${e}`));
}

// Test 6: Find spawners
console.log('\nTest 6: Find roles that can spawn research_specialist');
const spawners = findSpawnersOfRole(roles, 'research_specialist');
if (spawners.length > 0) {
  console.log(`  Found ${spawners.length} spawner(s):`);
  spawners.forEach(r => console.log(`    - ${r.name}`));
} else {
  console.log('  No roles can spawn research_specialist');
}

// Test 7: Statistics
console.log('\nTest 7: Role collection statistics');
const stats = getRoleStats(roles);
console.log(`  Total roles: ${stats.totalRoles}`);
console.log(`  Average authority level: ${stats.averageAuthorityLevel.toFixed(1)}`);
console.log(`  Total tools: ${stats.totalTools}`);
console.log(`  Total KPIs: ${stats.totalKPIs}`);
console.log(`  Roles with sub-roles: ${stats.rolesWithSubRoles}`);
console.log('  Authority distribution:');
Object.entries(stats.authorityDistribution)
  .sort(([a], [b]) => Number(b) - Number(a))
  .forEach(([level, count]) => {
    console.log(`    Level ${level}: ${count} role(s)`);
  });

console.log('\n✅ All utility tests passed!');
