/**
 * Sidecar Communication Protocol — Message Types
 *
 * Defines the WebSocket protocol between brain and sidecars.
 */

/** RPC state machine */
export type RPCState = 'pending' | 'detached' | 'completed' | 'failed' | 'timed_out' | 'cancelled';

/** Event priority levels */
export type EventPriority = 'critical' | 'high' | 'normal' | 'low';

// ---- Binary data variants ----

export interface BinaryDataInline {
  type: 'inline';
  mime_type: string;
  /** Base64-encoded data */
  data: string;
}

export interface BinaryDataRef {
  type: 'ref';
  ref_id: string;
  mime_type: string;
  size: number;
}

export type BinaryData = BinaryDataInline | BinaryDataRef;

// ---- Brain → Sidecar ----

export interface RPCRequest {
  type: 'rpc_request';
  id: string;
  method: string;
  params: Record<string, unknown>;
}

// ---- Sidecar → Brain ----

export interface RPCResultPayload {
  rpc_id: string;
  result: unknown;
  error?: undefined;
}

export interface RPCErrorPayload {
  rpc_id: string;
  result?: undefined;
  error: { code: string; message: string };
}

export interface RPCProgressPayload {
  rpc_id: string;
  progress: number;
  message?: string;
}

export interface SidecarEventPayload {
  [key: string]: unknown;
}

export interface SidecarEvent {
  type: 'rpc_result' | 'rpc_progress' | 'sidecar_event';
  event_type: string;
  timestamp: number;
  payload: RPCResultPayload | RPCErrorPayload | RPCProgressPayload | SidecarEventPayload;
  priority?: EventPriority;
  binary?: BinaryData;
}

// ---- Timeout configuration ----

export interface RPCTimeouts {
  /** Initial timeout before transitioning to DETACHED (ms) */
  initial: number;
  /** Max timeout for detached RPCs (ms) */
  max: number;
}

export const DEFAULT_RPC_TIMEOUTS: RPCTimeouts = {
  initial: 30_000,
  max: 300_000,
};
