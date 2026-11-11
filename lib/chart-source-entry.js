import { registerChartSourceTool } from './chart/source-token.js';
import { automationDatasetStore, automationSharedRuntime } from './runtime.js';
export const name = 'capital-chart-source-tools';
export const inject = ['tools'];
export function apply(ctx) {
    const shared = automationSharedRuntimeOf(ctx);
    registerChartSourceTool(ctx, { store: automationDatasetStore(ctx), tokens: shared.sourceTokens });
}
/** Host row first, root-keyed module cache as fallback (monolith carriers). */
export function automationSharedRuntimeOf(ctx) {
    try {
        const hostShared = ctx.get('automationChartRuntime');
        if (hostShared !== undefined)
            return hostShared;
    }
    catch {
        // Monolith carrier without the host row.
    }
    return automationSharedRuntime(ctx);
}
