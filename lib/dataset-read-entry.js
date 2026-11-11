import { registerDatasetTools } from './data-collector/dataset-tools.js';
import { automationDatasetStore } from './runtime.js';
export const name = 'automation-dataset-read-tools';
export const inject = ['tools'];
export function apply(ctx) {
    registerDatasetTools(ctx, automationDatasetStore(ctx));
}
