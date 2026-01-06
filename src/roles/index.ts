// Type definitions
export type {
  KPI,
  CommunicationStyle,
  SubRoleTemplate,
  RoleDefinition,
} from './types.ts';

// Loader functions
export {
  loadRole,
  loadRolesFromDir,
  validateRole,
} from './loader.ts';

// Prompt builder
export type { PromptContext } from './prompt-builder.ts';
export { buildSystemPrompt } from './prompt-builder.ts';

// Authority system
export type { ActionCategory } from './authority.ts';
export {
  AUTHORITY_REQUIREMENTS,
  canPerform,
  getRequiredLevel,
  listAllowedActions,
  listDeniedActions,
  describeAuthorityLevel,
  getRolePermissionsSummary,
} from './authority.ts';

// Utility functions
export {
  findRolesWithPermission,
  findMinimalRoleForAction,
  compareRoles,
  getRoleHierarchy,
  canSpawnRole,
  findSpawnersOfRole,
  validateRoleHierarchy,
  getRoleStats,
} from './utils.ts';
