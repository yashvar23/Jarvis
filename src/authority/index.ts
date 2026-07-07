/**
 * Authority & Autonomy Engine — Barrel exports
 */

export { AuthorityEngine, type AuthorityConfig, type AuthorityDecision, type AuthorityCheckParams, type PerActionOverride, type ContextRule } from './engine.ts';
export { ApprovalManager, type ApprovalRequest, type ApprovalStatus, type ApprovalUrgency } from './approval.ts';
export { AuditTrail, type AuditEntry, type AuthorityDecisionType } from './audit.ts';
export { AuthorityLearner } from './learning.ts';
export { EmergencyController, type EmergencyState } from './emergency.ts';
export { ApprovalDelivery } from './approval-delivery.ts';
export { DeferredExecutor } from './deferred-executor.ts';
export { getActionForTool, TOOL_ACTION_MAP, CATEGORY_ACTION_MAP } from './tool-action-map.ts';
