/**
 * Filesystem locations for sandbox-api side-files.
 *
 * Centralized so tests can override via env without leaking $HOME state.
 * Defaults to `~/.zoya/workflow-files/` and `~/.zoya/workflow-logs/`,
 * matching the rest of the daemon's `~/.zoya/...` tree.
 */

import { homedir } from "node:os";
import { resolve } from "node:path";

const ROOT_ENV = "ZOYA_WORKFLOW_DATA_DIR";

function root(): string {
  const override = process.env[ROOT_ENV];
  if (override) return resolve(override);
  return resolve(homedir(), ".zoya");
}

export function workflowFileBase(): string {
  return resolve(root(), "workflow-files");
}

export function workflowLogsBase(): string {
  return resolve(root(), "workflow-logs");
}

