import { registerWaitForAgentsTool } from './agents/wait-for-agents.js';
export const name = 'automation-orchestration-tools';
export const inject = ['tools'];
export function apply(ctx) {
    registerWaitForAgentsTool(ctx);
}
