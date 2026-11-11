import { automationSharedRuntime } from './runtime.js';
export const name = 'automation-runtime';
export function apply(ctx) {
    ctx.provide('automationChartRuntime', automationSharedRuntime(ctx));
}
