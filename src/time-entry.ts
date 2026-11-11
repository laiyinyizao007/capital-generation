/**
 * `tools/time` row: get_local_datetime + resolve_data_time_range. Every mode that needs
 * time mounts it; date normalization has one implementation, and Dataset boundaries are
 * enforced by `tool-exec` identity checks, not by row composition.
 */
import type { Context } from '@deepseek-ai/cordis'

import { registerTimeTool } from './time/tools.js'
import { automationDatasetStore, type RuntimeContext } from './runtime.js'

export const name = 'automation-time-tools'
export const inject = ['tools']

export function apply(ctx: Context): void {
  registerTimeTool(ctx, automationDatasetStore(ctx as unknown as RuntimeContext))
}
