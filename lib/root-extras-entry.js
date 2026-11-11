import { userCustomizationSection } from './user-customization.js';
import { readAutomationConfig } from './automation-settings.js';
export const name = 'capital-root-extras';
export const inject = ['systemPrompt'];
/** Re-read per turn so a settings save applies to the same session on the next step. */
export function readRootExtrasConfig(ctx) {
    const config = readAutomationConfig(ctx);
    return { customPersona: config.customPersona };
}
export function apply(ctx) {
    let lastPersonaError;
    const section = userCustomizationSection(() => readRootExtrasConfig(ctx).customPersona, (error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (message === lastPersonaError)
            return;
        lastPersonaError = message;
        ctx.logger?.warn?.(`automation-workbench: customPersona 未加载（${message}）`);
    });
    ctx.effect(() => {
        const dispose = ctx.systemPrompt.section(section);
        return typeof dispose === 'function' ? dispose : () => { };
    }, 'automation-workbench.user-customization()');
}
