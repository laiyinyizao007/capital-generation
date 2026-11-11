import { createRetrieverRuntime } from './retriever-runtime.js';
import { registerSourceTools } from './web-retriever/tools.js';
import { readRetrieverConfig } from './automation-settings.js';
export const name = 'automation-retrieve-sources-tools';
export const inject = ['tools'];
export function apply(ctx) {
    const runtime = createRetrieverRuntime(ctx, readRetrieverConfig(ctx));
    registerSourceTools(ctx, { ...runtime.localFetchConfig });
}
