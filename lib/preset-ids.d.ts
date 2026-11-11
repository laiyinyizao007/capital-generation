/**
 * Single source of preset identity. Since 0.2.1 the preset id is the role
 * identity used by root convergence, shell guards, role surfaces, diagnostics and tests.
 * These strings must match `preset/dsh-workbench-automation/agent.patch.yml` `config.id` and
 * delegation `agentPreset` values; `config.id` is also session-log identity, so do not
 * rename casually. `test/persona.test.mjs` cross-checks them.
 */
export declare const ROOT_PRESET_ID = "dsh-workbench-automation";
export declare const ROLE_PRESET_IDS: {
    readonly collector: "automation-data-collector";
    readonly junior: "automation-data-junior";
    readonly specialist: "automation-visualization-specialist";
    readonly retriever: "automation-web-retriever";
    readonly analyst: "automation-data-analyst";
};
export type RolePresetId = (typeof ROLE_PRESET_IDS)[keyof typeof ROLE_PRESET_IDS];
/** Role preset ids (array form avoids prototype-method coupling). */
export declare const ROLE_PRESET_ID_LIST: readonly string[];
/** Every preset claimed by this plugin: root plus five roles. */
export declare const AUTOMATION_PRESET_IDS: readonly string[];
export declare function isAutomationPresetId(id: string | undefined): boolean;
/**
 * Roles reached only through delegation. They stay registered because delegation rows resolve
 * `config.id`, but the host roster filter hides them from the new-session selector.
 */
export declare const INTERNAL_ROLE_PRESET_IDS: readonly string[];
export declare function isInternalRolePresetId(id: unknown): boolean;
/**
 * Which preset may use which tool (enforced by `src/tool-exec.ts`). This replaces the old
 * session-topology check, which rejected manually opened role sessions.
 *
 * The root preset must never appear in any set. These lists live at `src/` root because
 * data and chart layers must not depend on the agents layer.
 */
export declare const DATA_COLLECTION_PRESET_IDS: readonly string[];
export declare const DATASET_READING_PRESET_IDS: readonly string[];
/** May issue `chart_source_ref` for chart reads. */
export declare const CHART_SOURCE_PRESET_IDS: readonly string[];
