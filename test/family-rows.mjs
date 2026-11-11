/**
 * Row contracts map each custom tool-family row to its exact model tool names.
 * Entry tests verify registrations; persona tests combine this table with preset rows (§9.7).
 * Framework-provided names (skill/send_message/shell/fs) are not listed here.
 */

/** Custom tool entry points, in declaration order. */
export const CAPITAL_ROW_TOOLS = {
  'dsh-workbench-automation/tools/collect': ['request_data', 'list_capabilities', 'describe_capability', 'dc_status'],
  'dsh-workbench-automation/tools/dataset-read': ['describe_dataset', 'inspect_dataset', 'profile_dataset', 'query_dataset'],
  'dsh-workbench-automation/tools/chart-source': ['prepare_chart_source'],
  'dsh-workbench-automation/tools/chart-render': ['render_chart'],
  'dsh-workbench-automation/tools/retrieve-search': ['anysearch_search', 'web_retriever_fetch', 'wind_docs_announcements', 'wind_docs_news'],
  'dsh-workbench-automation/tools/retrieve-sources': [
    'cls_telegraph', 'wscn_lives', 'cninfo_irm', 'sseinfo_qa',
    'eastmoney_724', 'eastmoney_stock_news', 'eastmoney_reports',
    'eastmoney_announcements', 'eastmoney_announcement_body',
    'sina_reports', 'ths_eps_forecast',
  ],
  'dsh-workbench-automation/tools/ocr': ['ocr'],
  // Root-only one-turn wait across delegated children and their descendants.
  'dsh-workbench-automation/tools/orchestration': ['wait_for_agents'],
  // Main Agent's final-turn delivery step; the card must be written by the closing turn.
  'dsh-workbench-automation/tools/present': ['present_charts'],
  'dsh-workbench-automation/tools/time': ['get_local_datetime', 'resolve_data_time_range'],
  'dsh-workbench-automation/tools/watchlist': ['get_watchlist'],
  // Root presence settings only; this row registers no tools.
  'dsh-workbench-automation/tools/root-extras': [],
  // Role-scoped selected-skill catalog + prompt section; registers no model tools.
  'dsh-workbench-automation/tools/selected-skills': [],
}

/** Rows that declare a non-tool placement config (the value is not a tool switch). */
const ROW_CONFIG_KEYS = {
  'dsh-workbench-automation/tools/selected-skills': ['role'],
}

/** A row owns its complete tool family; generic capabilities are not trimmed per role. */
export function rowTools(rowName, config) {
  const names = CAPITAL_ROW_TOOLS[rowName]
  if (names === undefined) throw new Error(`未知的族行 ${rowName}：它没登记在 test/family-rows.mjs 的行契约里`)
  const allowed = ROW_CONFIG_KEYS[rowName] ?? []
  const extra = Object.keys(config ?? {}).filter((key) => !allowed.includes(key))
  if (extra.length > 0) {
    throw new Error(`${rowName} 带了行契约里没有的配置 ${extra.join(', ')}：写一格没人读的 config 就是下一次"以为裁了、其实没裁"`)
  }
  return [...names]
}

/** Deduplicated sorted surface produced by a set of mounted rows. */
export function faceOf(rows) {
  return [...new Set(rows.flatMap((row) => rowTools(row.name, row.config)))].sort()
}
