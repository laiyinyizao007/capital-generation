import { registerTimeTool } from './time/tools.js';
import { automationDatasetStore } from './runtime.js';
export const name = 'automation-time-tools';
export const inject = ['tools'];
export function apply(ctx) {
    registerTimeTool(ctx, automationDatasetStore(ctx));
}
