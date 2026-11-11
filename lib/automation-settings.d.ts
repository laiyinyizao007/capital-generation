/**
 * Sole reader of the bundled `automation-config` entry. The id must match the host row,
 * settings card and preset row; drift is caught by the four-way assertion in
 * `test/automation-config.test.mjs`. Unreadable returns `{}` and callers fill defaults;
 * only reference names are read here, never resolved secrets.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { RetrieverConfig } from './retriever-config.js';
import type { SelectedSkillSelection, SelectedSkillsMode } from './agents/selected-skills-provider.js';
export declare const AUTOMATION_CONFIG_ENTRY_ID = "automation-config";
/** Fields this repo consumes (the host half owns the rest). */
export interface AutomationConfigSlice {
    fuyaoCredentialRef?: string;
    ftshareCredentialRef?: string;
    customPersona?: string;
    retriever?: RetrieverConfig;
    selectedSkills?: SelectedSkillSelection;
    selectedSkillsMode?: SelectedSkillsMode;
}
export type AutomationEntrySource = 'settings-describe' | 'config-editor';
/**
 * Settings first, then the config-editor save layer. The selected-skill provider and the
 * persona section live in a separate preset row; reading only `settings.describe()` there
 * made a saved toggle look all-off whenever the settings projection was not ready.
 */
export declare function readAutomationEntry(ctx: Context): {
    value?: Record<string, unknown>;
    source?: AutomationEntrySource;
};
export declare function readAutomationConfig(ctx: Context): AutomationConfigSlice;
/** Flat credential refs needed by the collector domain (same shape as `CollectorConfig`). */
export declare function readCollectorConfig(ctx: Context): {
    fuyaoCredentialRef?: string;
    ftshareCredentialRef?: string;
    windCredentialRef?: string;
};
/** Retriever config slice (baseURL, credential ref, Wind endpoint, local fallback switch). */
export declare function readRetrieverConfig(ctx: Context): RetrieverConfig;
