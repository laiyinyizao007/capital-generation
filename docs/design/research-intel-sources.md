# 方案：研报与论文情报源扩展（research-intel）

> 状态：**待评审**（仅方案，未落地代码）
> 目标仓库：`laiyinyizao007/capital-generation`（fork 自 `v587d/capital-generation`）
> 分支：`feature/research-intel`

## 0. 一句话

给 CapGen 补上**当前完全缺失的两块情报面**——「行业/宏观/策略类研报」（现在只能查个股研报）与
「学术论文元数据」（现在完全没有），并让它们能被投研自动化任务定时消费。

## 1. 现状盘点（已核实，非推测）

### 1.1 插件已有什么

| 能力 | 工具名 | 上游 | 缺口 |
| --- | --- | --- | --- |
| 个股研报列表 | `eastmoney_reports` | `reportapi.eastmoney.com` | `code` **必填**，只能按个股查；只走 `qType=0` |
| 个股研报列表（备份） | `sina_reports` | `vip.stock.finance.sina.com.cn` | 同上，只能按个股 |
| 研报正文 | `ocr` | PaddleOCR AIStudio | 只能解析 `.pdf` 直链；研报 PDF 直链由 `eastmoney_reports` 的 `pdf_url` 提供 |
| 学术论文 | **无** | — | 完全空白 |

工具面共 11 个具名来源（7 个上游 `SourceId`，东财占 4 个工具），全部零 key、本机直连出网。

### 1.2 实测可达性（本机 2026-11-09）

| 源 | 路径 | 结果 |
| --- | --- | --- |
| 东财研报 API | `reportapi.eastmoney.com/report/list` | **200**。`qType=0` 个股（10306 篇）、`qType=1` 行业（12311 篇，带 `industryName`）、`qType=2` 宏观/策略（1099 篇）。`qType≥3` 全 0 |
| 东财研报 PDF | `pdf.dfcfw.com/pdf/H3_<infoCode>_1.pdf` | **200**（`infoCode` 须匹配 `^AP\d{6,}$`） |
| arXiv API | `export.arxiv.org/api/query` | **200**。`q-fin` 8 个有效分类：`CP 3445 / GN 3112 / MF 3541 / PM 2528 / PR 2297 / RM 3148 / ST 4440 / TR 2460` |
| SSRN | `papers.ssrn.com` / `elibrary.ssrn.com` / `api.ssrn.com` | **403 / SSL 失败**（Cloudflare）。换 UA、RSS 路径、API 路径全部不通 |
| 慧博 | `www.hibor.com.cn` | 首页 **200**，但为 JS 渲染，无可直连的搜索 URL（`/search.html` 404） |
| 豆包 | `www.cnki.net` | **200**（仅确认连通，未验证是否有可用的研报检索接口） |
| Semantic Scholar | `api.semanticscholar.org` | **429**（限流，未重试） |

### 1.3 关键实测结论

1. **东财研报 `qType` 是分类开关**：`0`=个股、`1`=行业、`2`=宏观/策略/大宗。现有工具硬编码 `qType=0` 且 `code` 必填，
   所以行业研报与策略/宏观研报**目前完全不可达**——这是最大的现成增量。
2. **东财研报接口不支持关键词检索**：`q=` / `title=` / `reportName=` / `researchReportType=` 全部被忽略
   （实测 `hits` 恒为 32084）。可用的筛选维度只有 `code` / `industryCode` / `orgCode` / `rating` / `beginTime` / `endTime`。
   → **「金工研报」只能靠客户端过滤标题**（先扫列表，再按标题/机构筛）。
3. **`orgCode` 字段真实存在**（如 `80036717`=中邮证券、`80000208`=华宝证券），但由东财内部编码，**没有公开字典接口**（`/report/OrgList` 404）。
   → 机构筛选优先用 `orgCode` 走上游精确过滤；不知道码时用 `orgSName` 客户端过滤（如「华泰」）。
4. **`industryCode` 也是上游真实支持的精确过滤**（如 `1044`=生物制品，实测该码下 hits 全部为生物制品）。
   → Phase 1 实现时确认：行业与机构两个维度都不必靠客户端过滤，只有**关键词**需要本地过滤。
5. **`column` 是东财内部分类码**：`002002xxxx` 表示行业研报 + 细分行业，后三位含义无公开文档。
6. **SSRN 本机直连不可用**，与用户资料里「SSRN 是绝对大本营」的预期不符。替代路径只剩：
   - 走 AnySearch（需 `ANYSEARCH_API_KEY`，本会话未配置）；
   - 走 `r.jina.ai` 之类的文本代理（实测 200 但只拿到 491 字节摘要，质量需验证）；
   - 改用 arXiv q-fin（免费、稳定、已验证），覆盖 SSRN 里 q-fin 的主要部分。

### 1.4 persona 体积预算（Phase 2/3 的硬约束）

上游 persona 有逐角色与总量双重闸门（`test/persona.test.mjs`）：

| 闸门 | 上限 | Phase 1 后实测 | 余量 |
|---|---|---|---|
| `capital-web-retriever` persona | 1390 | 1341 | **49** |
| `capital-data-junior` persona | 2760 | 2726 | 34 |
| `capital-data-collector` persona | 1700 | 1627 | 73 |
| 全部 persona 合计 | 12000 | 11953 | **47** |

→ 每个新工具名约 25 字符，**总量余量 47 只够再加约一个工具**。Phase 2 的 `arxiv_papers` 必须在
persona 之外找位置（工具面清单不必逐个点名新工具时）或先做取舍。

## 2. 方案

### 2.1 分三期，按「增量价值 / 实现成本」排序

#### Phase 1 — 东财研报分类扩展（成本最低，增量最确定）

**做什么**：把 `eastmoney_reports` 拆成两个工具，或给它加 `scope` 参数。

推荐**新建独立工具**而不是改现有工具的参数：现有工具的 `description` 已写死了「个股研报」「按 6 位代码」，
改动会牵动 `capital-web-protocol` skill 与既有断言；新建工具对既有行为零影响。

| 新工具 | 用途 | 关键参数 |
| --- | --- | --- |
| `eastmoney_industry_reports` | 行业研报（`qType=1`） | `industry_code`（可选，`*` 为全市场）、`org_name`（可选，客户端按机构名过滤）、`title_keyword`（可选，客户端按标题过滤）、`start_date`/`end_date`、`page`/`page_size` |
| `eastmoney_macro_reports` | 宏观/策略/大宗研报（`qType=2`） | 同上，另加 `org_name` 过滤 |

**「金工研报」怎么落地**：这是用户资料的核心诉求，但不能靠上游关键词参数（不支持）。落地方式：

- 客户端标题过滤 `title_keyword`，例如传 `金融工程` / `金工` / `因子` / `量化` / `CTA` / `展期收益率`；
- 内置一份**金工关键词词典**（放在 skill 层，不硬编在工具里），由模型按任务挑词、多次调用；
- 配套维护**金工团队名单**（华泰金工/林晓明、天风金工、国君金工、中信金工、申万宏源金工…），
  用 `org_name` 过滤。

**边界纪律**（沿用插件既有约束）：
- 东财接口**只能按 `industryCode`/`orgCode` 精确筛，不能按标题搜**，所以工具 description 必须写明
  「`title_keyword` 是拉取后本地过滤，上游不支持关键词检索；过滤可能漏，也可能命中不相关标题」；
- 空结果必须能区分「上游真没有」与「本地过滤后没有」——后者要在 `note` 里写明过滤词和过滤前条数。
  这一点插件已有先例（`eastmoneyReports` 的 `note` 写「共 N 篇；列表不含摘要…」）。

#### Phase 2 — arXiv 论文源（新增独立来源）

**做什么**：新增具名来源 `arxiv`，走 `export.arxiv.org/api/query`。

| 新工具 | 用途 |
| --- | --- |
| `arxiv_papers` | 按分类/关键词/作者检索 q-fin 论文元数据（标题、作者、摘要、发布日期、DOI、PDF 直链、分类） |

**实现要点**：
- 上游返回 **Atom XML**，插件目前**没有任何 XML/RSS 解析器**（grep 全仓无 `rss`/`atom`/`feed.xml`）。
  → 需要新增一个轻量 Atom 解析（只解析 `entry` 里的 `id/title/summary/author/published/updated/category/link`），
    放在 `src/web-retriever/` 下；**不要引入 XML 依赖**（§4.2 铁律「不新增 DSH 依赖」，解析只用纯 JS）。
- 分类用 `cat:q-fin.PM` 这类前缀，常用分类建议做成工具参数枚举。
- 检索语法必须按上游实际语义写进 description：
  - `AND` / `OR` / `ANDNOT` 需**空格分隔**并 URL 编码（`+AND+` 实测 total=0，`%20AND%20` 正常）；
  - 短语匹配要加引号（`abs:"deflated sharpe"` 实测 total=0，因为该词组不在摘要里；`all:"factor zoo"` 实测 7 条）。
- PDF 直链从 `<link title="pdf" href="...">` 取，交给 `ocr` 解析正文——与研报 PDF 同一路径，
  `ocr` 的 `url` 形态要求路径以 `.pdf` 结尾，arXiv 的 `/pdf/2511.12345v1` **不带 `.pdf` 后缀**，
  → 需要在工具里拼上 `.pdf`（arXiv 确实支持该形式，落地前需实测验证）。
- 摘要长度按 `MAX_ITEM_CHARS`（1200）裁剪，符合既有预算。

**为什么不直接上 SSRN**：
- 实测 403，不写「不可用」的实现就是埋雷；
- 若用户坚持要 SSRN，可加一个**可选的 AnySearch 兜底路径**（需 `ANYSEARCH_API_KEY`），但那是
  `anysearch_search` 现有能力，不该新造工具；
- 建议方案：**Phase 2 先用 arXiv 落地，SSRN 作为「用户配了 AnySearch key 时的搜索建议」写进 skill 与文档**，
  不进代码。

#### Phase 3 — 投研自动化任务模板（消费侧）

**做什么**：在 `automation/builtins.js` 加 1~2 个 `category: 'research'` 的内置模板。

| 模板 id | 标题 | 建议触发 | 内容 |
| --- | --- | --- | --- |
| `quant-research-digest` | 金工研报与论文周报 | 每周日 17:00 | 扫行业/策略研报 + arXiv q-fin 新论文，按主题聚类，标注机构、日期、来源与可复核链接 |
| `sector-research-weekly`（可选） | 行业研报跟踪 | 每周六 21:00 | 按自选股所属行业扫 `qType=1` 行业研报 |

**落地必须同步改的 4 处**（漏了必红）：
1. `automation/builtins.js` — 新增 `BUILTIN_DEFINITIONS` 条目；
2. `automation/task-icons.js` — `BUILTIN_TASK_ICONS` 加映射，图标 id 必须取自 `TASK_ICON_CATALOG` 闭集；
3. `test/automation-schema.test.mjs` — 更新「16 个模板」的 `length` 与 id 顺序断言；
4. `test/automation-client.test.mjs` — 图标一一对应断言。

**硬约束**（`test/automation-schema.test.mjs` 已钉住）：
- `instruction` 120–260 字，**不得点名工具名**（`get_watchlist`/`anysearch`/`web_retriever`/`data_collector`/`data_junior`）；
- `description` ≤100 字且**必须出现「自选股」**；
- `trigger.timezone` 固定 `Asia/Shanghai`；
- `state` 固定 `'dormant'`（默认不添加，用户手动开）。

**设计前置问题**（`docs/design/automation-tasks-v0.4.md:176-177` 明文要求）：
> 新增模板时先回答「它和现有哪一个模板会给出同一段内容」，答不上来才加。

最近的邻居是 `research-topics`（研究选题，每周日 14:00），但它**只挑题不写报告**，
且明文要求「不要写成完整研报」——所以新模板的产出口径（研报/论文摘要聚类）与之不重叠。

**无人值守限制**：`automation/policy.js` 会拒绝 `ask_user_question` / `write` / `edit` / shell 提权。
→ 研报/论文摘要**只能写在最终答复里**，不能落盘成报告文件。这是插件既有纪律，新模板必须遵守。

### 2.2 数据源接管的完整改动清单（Phase 1 + Phase 2）

按「漏了必红」排序：

| # | 文件 | 改什么 | 漏了会怎样 |
| --- | --- | --- | --- |
| 1 | `src/web-retriever/sources.ts` | 新增 `SourceId` 成员 `arxiv`（+ `SOURCE_IDS`）；新增 `eastmoneyIndustryReports` / `eastmoneyMacroReports` / `arxivPapers` 导出函数 | 编译不过 |
| 2 | `src/web-retriever/tools.ts` | `definitions` 数组加 3 条工具定义（name/description/parameters/output.schema/execute） | 工具不存在 |
| 3 | `src/agents/root-tool-policy.ts` | `RETRIEVAL_DENIED_TOOLS` 加工具名 | `test/root-tool-policy.test.mjs` 断言「2+2+11=15」变红 |
| 4 | `test/family-rows.mjs` | `CAPITAL_ROW_TOOLS['.../tools/retrieve-sources']` 加工具名 | `test/family-entries.test.mjs` 变红 |
| 5 | `test/persona.test.mjs` | `PLUGIN_TOOLS` 具名来源名单加工具名 | 变红 |
| 6 | `test/web-retriever-sources.test.mjs` | 工具名断言加工具名 | 变红 |
| 7 | `scripts/lib/contract-registry.mjs` | `RETRIEVER` 数组加巡检条目（`pr('retriever', '<工具名>', 'daily', {...})`），字段：`family`/`capability`/`tier`/`params`/`budgetMs`；`params` 必须能过该 source 的 `normalizeParams` | `test/contract-registry.test.mjs` 覆盖闸门变红 |
| 8 | `docs/web-retriever-capabilities.md` | 加工具表格行；更新「当前共 N 个工具」；修掉「来源查询面（9）」的笔误（实为 11） | `test/web-retriever-capabilities.test.mjs` 变红 |
| 9 | `README.md` | 「共计 N 个网页检索能力」计数 | 同上 |
| 10 | `preset/capital-generation/skills/capital-web-protocol/SKILL.md` | §1 来源边界表加工具行；更新「十一个」字样 | 语义漂移（模型侧纪律的唯一落点） |
| 11 | `docs/dev/web-retriever.md` | §4.1 的来源名单与计数 | 同上 |
| 12 | `src/web-retriever/atom.ts`（新） | 轻量 Atom 解析（纯 JS，不引依赖） | Phase 2 必需 |
| 13 | `CHANGELOG.md` | Conventional Commits 条目 | 流程要求 |

### 2.3 明确不做的事

- **不新增 DSH 依赖**（§4.2 铁律）：抓取器自研，解析只用纯 JS；arXiv 的 Atom 解析自己写，不用 XML 库。
- **不引入「配方式」来源抽象**（`sources.ts:1-5` 明文：*no recipe registry*）：每个来源是一个具体实现函数。
- **不做浏览器自动化抓慧博**：慧博是 JS 渲染动态站，自动化浏览器进不了无人值守任务（`automation/policy.js` 拒 shell/提权）。
  慧博留给 `anysearch_search` 与人工浏览。
- **不碰 SSRN 的直连实现**：实测 403，不写必然失败的代码。
- **不新增 DSH 依赖 / 不恢复 `final_report` 全链路**（§7 禁止恢复项）。

## 3. 风险与已知不确定项

| 风险 | 说明 | 处置 |
| --- | --- | --- |
| arXiv PDF 直链无 `.pdf` 后缀 | `ocr` 的 `url` 形态硬性要求路径以 `.pdf` 结尾 | 工具里补 `.pdf`，**落地前必须实测** arXiv 是否接受该形式；不通过则只给摘要不接 OCR |
| 东财客户端过滤会漏 | `title_keyword` / `org_name` 是拉取后过滤，不是上游检索 | description 必须写明；`note` 记录「过滤前 N 条 → 过滤后 M 条」 |
| `orgCode` 无公开字典 | 无法按机构精确筛 | 用 `orgSName` 客户端过滤；金工团队维护成本地名→机构名映射（不含 orgCode） |
| 新增工具数会牵动多处断言 | 插件有「一处漏改必红」的传统 | 按 §2.2 清单逐项改，`npm test` 逐个跑 |
| arXiv API 限流 | 官方建议 3 秒/请求 | 工具调用本身是模型节奏，非高频；如需加节流则复用 `src/net/throttle.ts` |
| `npm test` 全绿是硬闸门 | AGENTS.md §8.3 要求：挂载验证 + `npm test` 全绿 + `npm run check:dsh` | 三项都要跑并如实汇报 |

## 4. 待确认问题（需用户拍板）

1. **SSRN 怎么办**：接受「arXiv 替代 + SSRN 走 AnySearch 搜索建议」这个降级方案，还是需要专门为 SSRN 争取一条可行通道？
2. **慧博怎么办**：接受「不进代码，交给 AnySearch + 人工」吗？
3. **Phase 1 的工具形态**：新建独立工具（推荐，零影响既有行为）还是给 `eastmoney_reports` 加 `scope` 参数？
4. **自动化模板数量**：只加 1 个（金工研报与论文周报），还是加 2 个（再加行业研报跟踪）？
5. **金工团队名单**要不要现在就固化进 skill（会带来维护成本），还是只留关键词词典、机构名由模型临场给？

## 5. 附：实测命令留痕

- arXiv 分类规模：`GET http://export.arxiv.org/api/query?search_query=cat:q-fin.XX&max_results=1` → `feed.totalResults`
- 东财分类：`GET https://reportapi.eastmoney.com/report/list?industryCode=*&pageSize=8&beginTime=2026-01-01&endTime=2026-12-31&pageNo=1&qType={0,1,2}` → `hits` / `data[].industryName`
- 东财关键词参数无效：`q=` / `title=` / `reportName=` 下 `hits` 恒定
- SSRN 403：`GET https://papers.ssrn.com/sol3/RssFeed.cfm?param=xt` → 403（含自定义 UA）
- 慧博 JS 渲染：`GET https://www.hibor.com.cn/` → 200，但页面链接仅 `/docupload*.html` `/elelist.html`
