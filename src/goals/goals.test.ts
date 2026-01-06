import { test, expect, describe, beforeEach } from 'bun:test';
import { initDatabase } from '../vault/schema.ts';
import * as vault from '../vault/goals.ts';

describe('Vault — Goals', () => {
  beforeEach(() => initDatabase(':memory:'));

  // ── CRUD ──────────────────────────────────────────────────────────

  test('createGoal + getGoal', () => {
    const goal = vault.createGoal('Ship MVP', 'objective', {
      description: 'Launch the product',
      success_criteria: 'Product live with 100 users',
      time_horizon: 'quarterly',
      deadline: Date.now() + 86400000 * 90,
      tags: ['product', 'launch'],
      authority_level: 5,
    });

    expect(goal.id).toBeTruthy();
    expect(goal.title).toBe('Ship MVP');
    expect(goal.level).toBe('objective');
    expect(goal.description).toBe('Launch the product');
    expect(goal.success_criteria).toBe('Product live with 100 users');
    expect(goal.score).toBe(0.0);
    expect(goal.status).toBe('draft');
    expect(goal.health).toBe('on_track');
    expect(goal.tags).toEqual(['product', 'launch']);
    expect(goal.dependencies).toEqual([]);
    expect(goal.escalation_stage).toBe('none');
    expect(goal.parent_id).toBeNull();

    const fetched = vault.getGoal(goal.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.title).toBe('Ship MVP');
    expect(fetched!.tags).toEqual(['product', 'launch']);
  });

  test('createGoal with active status sets started_at', () => {
    const goal = vault.createGoal('Active goal', 'task', { status: 'active' });
    expect(goal.status).toBe('active');
    expect(goal.started_at).not.toBeNull();
  });

  test('getGoal returns null for non-existent', () => {
    expect(vault.getGoal('nonexistent')).toBeNull();
  });

  // ── Hierarchy ─────────────────────────────────────────────────────

  test('parent-child hierarchy', () => {
    const obj = vault.createGoal('Objective', 'objective');
    const kr1 = vault.createGoal('KR 1', 'key_result', { parent_id: obj.id });
    const kr2 = vault.createGoal('KR 2', 'key_result', { parent_id: obj.id });
    const milestone = vault.createGoal('Milestone 1', 'milestone', { parent_id: kr1.id });

    const children = vault.getGoalChildren(obj.id);
    expect(children.length).toBe(2);
    expect(children.map(c => c.title).sort()).toEqual(['KR 1', 'KR 2']);

    const kr1Children = vault.getGoalChildren(kr1.id);
    expect(kr1Children.length).toBe(1);
    expect(kr1Children[0]!.title).toBe('Milestone 1');
  });

  test('getGoalTree returns full hierarchy', () => {
    const obj = vault.createGoal('Root', 'objective');
    const kr = vault.createGoal('KR', 'key_result', { parent_id: obj.id });
    const ms = vault.createGoal('Milestone', 'milestone', { parent_id: kr.id });
    const task = vault.createGoal('Task', 'task', { parent_id: ms.id });

    const tree = vault.getGoalTree(obj.id);
    expect(tree.length).toBe(4);
    expect(tree[0]!.title).toBe('Root');
    expect(tree.map(g => g.level)).toEqual(['objective', 'key_result', 'milestone', 'task']);
  });

  test('getGoalTree returns empty for non-existent root', () => {
    expect(vault.getGoalTree('nonexistent')).toEqual([]);
  });

  test('getRootGoals returns only top-level', () => {
    vault.createGoal('Root 1', 'objective');
    vault.createGoal('Root 2', 'objective');
    const root3 = vault.createGoal('Root 3', 'objective');
    vault.createGoal('Child', 'key_result', { parent_id: root3.id });

    const roots = vault.getRootGoals();
    expect(roots.length).toBe(3);
  });

  // ── Queries ───────────────────────────────────────────────────────

  test('findGoals with filters', () => {
    vault.createGoal('G1', 'objective', { status: 'active' });
    vault.createGoal('G2', 'task', { status: 'active', tags: ['work'] });
    vault.createGoal('G3', 'objective', { status: 'draft' });

    expect(vault.findGoals({ status: 'active' }).length).toBe(2);
    expect(vault.findGoals({ level: 'objective' }).length).toBe(2);
    expect(vault.findGoals({ status: 'active', level: 'task' }).length).toBe(1);
    expect(vault.findGoals({ tag: 'work' }).length).toBe(1);
  });

  test('findGoals with limit', () => {
    for (let i = 0; i < 10; i++) {
      vault.createGoal(`Goal ${i}`, 'task');
    }
    expect(vault.findGoals({ limit: 5 }).length).toBe(5);
  });

  // ── Updates ───────────────────────────────────────────────────────

  test('updateGoal partial update', () => {
    const goal = vault.createGoal('Original', 'objective');

    const updated = vault.updateGoal(goal.id, {
      title: 'Updated Title',
      description: 'New description',
      tags: ['updated'],
    });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated Title');
    expect(updated!.description).toBe('New description');
    expect(updated!.tags).toEqual(['updated']);
    expect(updated!.updated_at).toBeGreaterThanOrEqual(goal.updated_at);
  });

  test('updateGoal returns null for non-existent', () => {
    expect(vault.updateGoal('nonexistent', { title: 'X' })).toBeNull();
  });

  test('updateGoal with empty updates returns existing', () => {
    const goal = vault.createGoal('Test', 'task');
    const same = vault.updateGoal(goal.id, {});
    expect(same!.title).toBe('Test');
  });

  // ── Score ─────────────────────────────────────────────────────────

  test('updateGoalScore clamps and logs progress', () => {
    const goal = vault.createGoal('Scored goal', 'key_result');

    const updated = vault.updateGoalScore(goal.id, 0.7, 'Good progress');
    expect(updated!.score).toBe(0.7);
    expect(updated!.score_reason).toBe('Good progress');

    // Check progress entry was created
    const history = vault.getProgressHistory(goal.id);
    expect(history.length).toBe(1);
    expect(history[0]!.score_before).toBe(0.0);
    expect(history[0]!.score_after).toBe(0.7);
    expect(history[0]!.note).toBe('Good progress');
    expect(history[0]!.type).toBe('manual');
  });

  test('updateGoalScore clamps to 0-1 range', () => {
    const goal = vault.createGoal('Clamp test', 'task');
    vault.updateGoalScore(goal.id, 1.5, 'Over max');
    expect(vault.getGoal(goal.id)!.score).toBe(1.0);

    vault.updateGoalScore(goal.id, -0.5, 'Under min');
    expect(vault.getGoal(goal.id)!.score).toBe(0.0);
  });

  // ── Status ────────────────────────────────────────────────────────

  test('updateGoalStatus to active sets started_at', () => {
    const goal = vault.createGoal('Activating', 'objective');
    expect(goal.started_at).toBeNull();

    const active = vault.updateGoalStatus(goal.id, 'active');
    expect(active!.status).toBe('active');
    expect(active!.started_at).not.toBeNull();
  });

  test('updateGoalStatus to completed sets completed_at', () => {
    const goal = vault.createGoal('Completing', 'task', { status: 'active' });
    const done = vault.updateGoalStatus(goal.id, 'completed');
    expect(done!.status).toBe('completed');
    expect(done!.completed_at).not.toBeNull();
  });

  test('updateGoalStatus to failed sets completed_at', () => {
    const goal = vault.createGoal('Failing', 'task', { status: 'active' });
    const failed = vault.updateGoalStatus(goal.id, 'failed');
    expect(failed!.status).toBe('failed');
    expect(failed!.completed_at).not.toBeNull();
  });

  test('updateGoalStatus to killed sets completed_at', () => {
    const goal = vault.createGoal('Killing', 'task', { status: 'active' });
    const killed = vault.updateGoalStatus(goal.id, 'killed');
    expect(killed!.status).toBe('killed');
    expect(killed!.completed_at).not.toBeNull();
  });

  // ── Health ────────────────────────────────────────────────────────

  test('updateGoalHealth', () => {
    const goal = vault.createGoal('Health check', 'objective');
    expect(goal.health).toBe('on_track');

    const updated = vault.updateGoalHealth(goal.id, 'at_risk');
    expect(updated!.health).toBe('at_risk');
  });

  // ── Escalation ────────────────────────────────────────────────────

  test('updateGoalEscalation sets stage and timestamp', () => {
    const goal = vault.createGoal('Escalating', 'key_result', { status: 'active' });
    expect(goal.escalation_stage).toBe('none');
    expect(goal.escalation_started_at).toBeNull();

    const pressured = vault.updateGoalEscalation(goal.id, 'pressure');
    expect(pressured!.escalation_stage).toBe('pressure');
    expect(pressured!.escalation_started_at).not.toBeNull();

    const startedAt = pressured!.escalation_started_at;

    // Advancing stage should keep the original start time
    const rootCause = vault.updateGoalEscalation(goal.id, 'root_cause');
    expect(rootCause!.escalation_stage).toBe('root_cause');
    expect(rootCause!.escalation_started_at).toBe(startedAt);

    // Resetting to none clears the timestamp
    const cleared = vault.updateGoalEscalation(goal.id, 'none');
    expect(cleared!.escalation_stage).toBe('none');
    expect(cleared!.escalation_started_at).toBeNull();
  });

  // ── Delete ────────────────────────────────────────────────────────

  test('deleteGoal cascades to children', () => {
    const parent = vault.createGoal('Parent', 'objective');
    const child = vault.createGoal('Child', 'key_result', { parent_id: parent.id });
    vault.createGoal('Grandchild', 'milestone', { parent_id: child.id });

    expect(vault.deleteGoal(parent.id)).toBe(true);
    expect(vault.getGoal(parent.id)).toBeNull();
    expect(vault.getGoal(child.id)).toBeNull();
  });

  test('deleteGoal returns false for non-existent', () => {
    expect(vault.deleteGoal('nonexistent')).toBe(false);
  });

  // ── Reorder ───────────────────────────────────────────────────────

  test('reorderGoals updates sort_order', () => {
    const g1 = vault.createGoal('First', 'task', { sort_order: 0 });
    const g2 = vault.createGoal('Second', 'task', { sort_order: 1 });
    const g3 = vault.createGoal('Third', 'task', { sort_order: 2 });

    vault.reorderGoals([
      { id: g3.id, sort_order: 0 },
      { id: g1.id, sort_order: 1 },
      { id: g2.id, sort_order: 2 },
    ]);

    const goals = vault.findGoals({ level: 'task' });
    expect(goals[0]!.title).toBe('Third');
    expect(goals[1]!.title).toBe('First');
    expect(goals[2]!.title).toBe('Second');
  });

  // ── Overdue & Escalation Queries ──────────────────────────────────

  test('getOverdueGoals', () => {
    vault.createGoal('Past due', 'task', {
      status: 'active',
      deadline: Date.now() - 86400000,
    });
    vault.createGoal('Future', 'task', {
      status: 'active',
      deadline: Date.now() + 86400000,
    });
    vault.createGoal('No deadline', 'task', { status: 'active' });

    const overdue = vault.getOverdueGoals();
    expect(overdue.length).toBe(1);
    expect(overdue[0]!.title).toBe('Past due');
  });

  test('getGoalsNeedingEscalation', () => {
    vault.createGoal('Behind', 'task', { status: 'active' });
    vault.updateGoalHealth(
      vault.findGoals({ status: 'active' })[0]!.id,
      'behind',
    );

    vault.createGoal('On track', 'task', { status: 'active' });

    const needEscalation = vault.getGoalsNeedingEscalation();
    expect(needEscalation.length).toBe(1);
    expect(needEscalation[0]!.title).toBe('Behind');
  });

  test('getGoalsByDependency', () => {
    const dep = vault.createGoal('Dependency', 'milestone', { status: 'active' });
    vault.createGoal('Dependent', 'task', {
      status: 'active',
      dependencies: [dep.id],
    });
    vault.createGoal('Independent', 'task', { status: 'active' });

    const dependents = vault.getGoalsByDependency(dep.id);
    expect(dependents.length).toBe(1);
    expect(dependents[0]!.title).toBe('Dependent');
  });

  // ── Progress History ──────────────────────────────────────────────

  test('progress history tracks score changes', () => {
    const goal = vault.createGoal('Progress test', 'key_result');

    vault.updateGoalScore(goal.id, 0.3, 'Started work');
    vault.updateGoalScore(goal.id, 0.5, 'Halfway there');
    vault.updateGoalScore(goal.id, 0.7, 'Almost done');

    const history = vault.getProgressHistory(goal.id);
    expect(history.length).toBe(3);

    // All three scores should be recorded
    const scores = history.map(h => h.score_after).sort();
    expect(scores).toEqual([0.3, 0.5, 0.7]);
  });

  // ── Check-Ins ─────────────────────────────────────────────────────

  test('createCheckIn + getRecentCheckIns', () => {
    const morning = vault.createCheckIn(
      'morning_plan',
      'Today focus on shipping the API',
      ['goal-1', 'goal-2'],
      ['Build endpoints', 'Write tests'],
    );

    expect(morning.type).toBe('morning_plan');
    expect(morning.summary).toBe('Today focus on shipping the API');
    expect(morning.goals_reviewed).toEqual(['goal-1', 'goal-2']);
    expect(morning.actions_planned).toEqual(['Build endpoints', 'Write tests']);

    const evening = vault.createCheckIn(
      'evening_review',
      'Built endpoints but skipped tests',
      ['goal-1', 'goal-2'],
      [],
      ['Build endpoints'],
    );

    const all = vault.getRecentCheckIns();
    expect(all.length).toBe(2);

    const mornings = vault.getRecentCheckIns('morning_plan');
    expect(mornings.length).toBe(1);

    const evenings = vault.getRecentCheckIns('evening_review');
    expect(evenings.length).toBe(1);
  });

  test('getTodayCheckIn', () => {
    vault.createCheckIn('morning_plan', 'Today plan', ['g1']);

    const today = vault.getTodayCheckIn('morning_plan');
    expect(today).not.toBeNull();
    expect(today!.summary).toBe('Today plan');

    const noEvening = vault.getTodayCheckIn('evening_review');
    expect(noEvening).toBeNull();
  });

  // ── Metrics ───────────────────────────────────────────────────────

  test('getGoalMetrics aggregates correctly', () => {
    // Create a mix of goals
    const obj = vault.createGoal('Obj', 'objective', { status: 'active' });
    vault.updateGoalScore(obj.id, 0.6, 'In progress');

    vault.createGoal('Done', 'task', { status: 'active' });
    vault.updateGoalStatus(
      vault.findGoals({ level: 'task' })[0]!.id,
      'completed',
    );

    vault.createGoal('Behind', 'task', { status: 'active' });
    vault.updateGoalHealth(
      vault.findGoals({ status: 'active', level: 'task' })[0]!.id,
      'behind',
    );

    const metrics = vault.getGoalMetrics();
    expect(metrics.total).toBe(3);
    expect(metrics.active).toBe(2);
    expect(metrics.completed).toBe(1);
    expect(metrics.avg_score).toBe(0.6); // only active objectives
    expect(metrics.behind).toBe(1);
  });
});
