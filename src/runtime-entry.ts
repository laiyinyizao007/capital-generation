/**
 * Host-plane Capital runtime row. Chart source tokens are issued by data_junior and
 * redeemed by the specialist, so both presets must see one registry; provide it here
 * instead of per preset. The module-level cache still keys by root for older call sites.
 */
import type { Context } from '@deepseek-ai/cordis'

import { automationSharedRuntime, type AutomationShared } from './runtime.js'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Shared by the Capital root, junior and specialist presets. */
    automationChartRuntime: AutomationShared
  }
}

export const name = 'automation-runtime'

export function apply(ctx: Context): void {
  ctx.provide('automationChartRuntime', automationSharedRuntime(ctx))
}
