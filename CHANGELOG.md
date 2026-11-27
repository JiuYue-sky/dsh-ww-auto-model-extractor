# 更新日志 / Changelog — `dsh-ww-auto-model-extractor`

所有重要变更均遵循 [语义化版本规范 (SemVer)](https://semver.org/) 与 [约定式提交 (Conventional Commits)](https://www.conventionalcommits.org/)。  
*All notable changes follow Semantic Versioning and Conventional Commits.*

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
