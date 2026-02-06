// THIS FILE IS A ZOYA STUB.
// The upstream activepieces engine uses `isolated-vm` (a Node N-API native
// addon) to run user code in a V8 isolate. Zoya runs the engine exclusively
// in SANDBOX_PROCESS mode (see src/workflows/activepieces/SPIKE-SANDBOXING.md),
// which never reaches this file. The original implementation has been removed
// to drop the transitive native-addon dependency.
//
// If this stub is ever reached, AP_EXECUTION_MODE is set to SANDBOX_CODE_ONLY
// or SANDBOX_CODE_AND_PROCESS -- neither of which Zoya supports. Reset
// AP_EXECUTION_MODE to SANDBOX_PROCESS.

import type { CodeSandbox } from '../../core/code/code-sandbox-common'

const message = 'v8-isolate-code-sandbox is not available in Zoya. Use AP_EXECUTION_MODE=SANDBOX_PROCESS.'

export const v8IsolateCodeSandbox: CodeSandbox = {
    async runCodeModule() {
        throw new Error(message)
    },
    async runScript() {
        throw new Error(message)
    },
}

