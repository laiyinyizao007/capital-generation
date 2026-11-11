import { registerWatchlistTool } from './watchlist/tools.js';
export const name = 'automation-watchlist-tools';
export const inject = ['tools'];
export function apply(ctx) {
    registerWatchlistTool(ctx);
}
