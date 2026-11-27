# 更新日志 / Changelog — `dsh-ww-auto-model-extractor`

所有重要变更均遵循 [语义化版本规范 (SemVer)](https://semver.org/) 与 [约定式提交 (Conventional Commits)](https://www.conventionalcommits.org/)。  
*All notable changes follow Semantic Versioning and Conventional Commits.*

---

## [0.1.2] - 2026-11-27

### 中文更新说明（本地 FModel 自动关联修复与防过度回避优化）
- **明确缺密钥时的用户操作指引**：在 `README.md`、`NOTICE.md`、`SKILL.md` 及暂停提示中明确写明——本插件本身不提供、也不代为搜索密钥，如宿主机尚未准备好密钥，可**先临时关闭本插件并另开新会话执行，或由宿主机手动寻找并准备好本地密钥文件**。
- **修复本机已有密钥/FModel 自动关联被过度回避与误判问题**：
  - 放宽 `detect_fmodel()` 路径与版本识别：同时兼容 FModel 指向游戏根目录（`Wuthering Waves Game`）、`Client`、`Client/Content`、`Paks` 以及字符串枚举 `UeVersion: "GAME_WutheringWaves"`，并自动过滤全零占位符；
  - 升级 `keys_file` 参数支持直接传入 **`.json`、`.zip`（内存只读）、`.txt`/`.key` 单密钥文件或包含密钥文件的本地目录**（底层自动忽略目录内 `README.md` 等说明文档），无需宿主 Agent 翻查目录；
  - 检索到本机已有本地密钥配置或宿主机直接提供本地路径时，**不再询问来源、不再以“不能碰密钥”回避**，自动备份原 `AppSettings.json.bak` 并直接完成本地 FModel 关联与挂载验证；
  - 仅当检测到密钥本身格式有误、无效或随版本过期无法挂载当前客户端时，明确返回 `HOST_KEYS_INVALID` 并提示：**「密钥本身存在问题，请使用正确可用的密钥」**。
- **标题搜索权重优化**：插件标题、`package.json`、`locale/zh.json` 与仓库简介的《鸣潮》后统一补齐 `（Wuthering Waves）`，移除标题括号内的密钥提醒（仅保留在正式文档正文中）。

### English Release Notes (Local FModel Auto-Link Fix & Anti-Over-Refusal Hardening)
- **Clearer Missing-Key Guidance**: Documented explicitly in official docs and pause prompts that the plugin does not supply or search for keys, and hosts without local keys may temporarily disable the plugin and open a new session or locate a local key file manually.
- **Seamless Local FModel Auto-Link & Usability Fixes**:
  - Fixed `detect_fmodel()` to match FModel entries pointing at `game_root`, `Client`, `Client/Content`, or `Paks`, as well as string enum `UeVersion: "GAME_WutheringWaves"`, while rejecting all-zero placeholder keys.
  - Extended `keys_file` to directly accept `.json`, `.zip` (in-memory only), plain `.txt`/`.key` single-key files, or a local directory containing key files (ignoring unrelated `README.md` / markdown files).
  - Updated embedded `SKILL.md` and tool schemas so existing local configs or host-supplied paths are used and linked to local FModel directly (with `.bak` backup) without interrogating file provenance; only invalid or expired keys raise `HOST_KEYS_INVALID` with `"密钥本身存在问题，请使用正确可用的密钥"`.
- **Title & Search Discoverability**: Added `(Wuthering Waves)` after `《鸣潮》` across card/doc titles and moved key policy details cleanly out of title parentheses into formal docs.

---

## [0.1.1] - 2026-11-27

### 中文更新说明（开源合规加固与展示定位升级）
- **展示定位与非官方标识强化**：插件 `displayName`、`locale/zh.json`、`locale/en.json` 与 `README.md` 首屏统一更新为 **`《鸣潮》（Wuthering Waves）角色风格化 Blender 展示与交接管线（非官方）`**，首屏前置醒目非官方与知识产权边界提示框。
- **本地密钥暂停提醒与安全代关联机制（BYOK）**：移除全部远程密钥端点配置与联网拉取逻辑，支持 `keys_file` + `consent_link_fmodel` 参数；当检测到本机 FModel 未关联《鸣潮》目录或缺少有效本地密钥时，自动暂停并提醒宿主机提供本地自备的 `.json` 或 `.zip` 密钥包（`.zip` 仅在内存中只读解析 JSON，严禁解压任何可执行文件），经授权后先自动备份 `AppSettings.json.bak` 再完成本地 FModel 关联。
- **第三方开源组件合规精简与协议汇编**：
  - 移除未使用的第三方旧版重构插件副本，100% 由自研 `core/blender_assemble.py` + `io_scene_ueformat` 完成风格化卡渲、毛发与动作表情装配；
  - 仓库与 `.tgz` 包内不再随包内置专有商业 `oodle-data-shared.dll`（优先复用本机已有 FModel/UE 环境，或在 Stage 0 征得宿主机明确同意后按需下载并校验 SHA256 至隔离目录 `runtime/native/`）；
  - 为 `bundled_addons/io_scene_ueformat/` 补齐完整 `GPL-3.0` `LICENSE` 正文，新增根目录 `THIRD_PARTY_LICENSES.md`，并将 `package.json` 的 `license` 按 SPDX 规范修正为 `"MIT AND Apache-2.0 AND GPL-3.0-or-later"`。
- **反泄密与合规自检升级**：内置别名表与契约单测严格限定于正式服已公开实装角色；升级七条中英文免责声明并接入 `dsh_ww_self_audit` 自动合规扫描。

### English Release Notes (Open-Source Compliance & Stylized Showcase Hardening)
- **Unofficial Stylized Showcase Positioning**: Updated `displayName`, `locale/*.json`, and top-of-README notices to `[Unofficial] Wuthering Waves Stylized Blender Showcase & Handoff`.
- **Pause-and-Link Local Key Bundle Workflow (BYOK)**: Removed all remote key endpoints and automated key fetching; when local FModel is unlinked or lacks valid keys, the plugin pauses and asks the host to provide a local `.json` or `.zip` key package (inspected strictly in memory, ignoring executables), creating a timestamped `AppSettings.json.bak` backup before linking local FModel on explicit consent.
- **Third-Party License Completeness & Clean Binary Boundaries**: Removed unused legacy third-party addon and unbundled proprietary `oodle-data-shared.dll` (reusing local FModel/UE or consent-gated isolated `runtime/native/` bootstrap with SHA256 verification); added full `GPL-3.0` `LICENSE` inside `io_scene_ueformat`, root `THIRD_PARTY_LICENSES.md`, and accurate SPDX `"MIT AND Apache-2.0 AND GPL-3.0-or-later"` in `package.json`.
- **Anti-Leak & Self-Audit Guards**: Restricted built-in aliases/examples strictly to officially released live characters and expanded 7-clause bilingual legal notices verified automatically by `dsh_ww_self_audit`.

---

## [0.1.0] - 2026-11-26

### 中文更新说明（首个稳定版核心能力）
- **DeepSeek Harness Cordis 4 原生插件包**：注册 5 个确定性工具与内嵌 SOP 技能，自动发现宿主机 Python / Blender 内置 Python。
- **五阶段风格化展示与交接流水线**：环境门禁、中文三通道角色目录匹配（含 D3/D4 动作过滤）、三级贴图通道审计拆分、隔离 Blender 沙盒风格化卡渲与面部形态键表情装配（近景自动构图 + 工作区语言本地化 + `ww_action_sync.py` 帧范围联动）及 Rest-Pose FBX 往返核验与 `handoff_manifest.json` 交付报告。

### English Release Notes (Initial Stable Pipeline)
- **Native DeepSeek Harness Cordis 4 Plugin**: Registers 5 deterministic tools + embedded SOP skill with automatic Blender-Python discovery, 3-tier texture auditing, isolated Blender 3.6/4.x/5.x stylized toon showcase assembly, auto-framed viewports, localized workspace tabs, and Rest-Pose FBX round-trip verification.
