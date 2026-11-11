import { registerChartTool } from './chart/tool.js';
import { automationDatasetStore } from './runtime.js';
import { automationSharedRuntimeOf } from './chart-source-entry.js';
export const name = 'automation-chart-render-tools';
export const inject = ['tools'];
export function apply(ctx) {
    const shared = automationSharedRuntimeOf(ctx);
    registerChartTool(ctx, {
        store: automationDatasetStore(ctx),
        sourceTokens: shared.sourceTokens,
        artifacts: shared.artifacts,
        charts: () => ctx.get('automationCharts'),
    });
}
