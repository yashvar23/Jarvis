/**
 * Emergency controls: pause and kill switch.
 */

export type EmergencyState = 'normal' | 'paused' | 'killed';

export class EmergencyController {
  private state: EmergencyState = 'normal';
  private onStateChange: ((state: EmergencyState) => void) | null = null;

  getState(): EmergencyState {
    return this.state;
  }

  /**
   * Pause: freeze all agent tool execution. Agents can still receive messages
   * but all tools return [SYSTEM PAUSED].
   */
  pause(): void {
    if (this.state === 'killed') return; // Can't pause from killed
    this.state = 'paused';
    this.onStateChange?.(this.state);
    console.log('[EmergencyController] System PAUSED — all tool execution suspended');
  }

  /**
   * Resume from paused state.
   */
  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'normal';
    this.onStateChange?.(this.state);
    console.log('[EmergencyController] System RESUMED — tool execution restored');
  }

  /**
   * Kill: terminate all agents, cancel all pending.
   * Requires explicit reset() to recover.
   */
  kill(): void {
    this.state = 'killed';
    this.onStateChange?.(this.state);
    console.log('[EmergencyController] System KILLED — all agents terminated');
  }

  /**
   * Reset from killed state back to normal.
   */
  reset(): void {
    if (this.state !== 'killed') return;
    this.state = 'normal';
    this.onStateChange?.(this.state);
    console.log('[EmergencyController] System RESET — back to normal');
  }

  /**
   * Check if tool execution is allowed.
   */
  canExecute(): boolean {
    return this.state === 'normal';
  }

  setStateChangeCallback(cb: (state: EmergencyState) => void): void {
    this.onStateChange = cb;
  }
}
