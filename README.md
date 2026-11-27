# [非官方]《鸣潮》（Wuthering Waves）角色风格化 Blender 展示与交接管线（`dsh-ww-auto-model-extractor`）

![Version](https://img.shields.io/badge/version-v0.1.1-blue)
![Unofficial](https://img.shields.io/badge/status-Unofficial_Research_Tool-orange)
![DSH](https://img.shields.io/badge/DeepSeek_Harness-Cordis_4_(%3E%3D0.2.1--rc.2)-6E40C9)
![License](https://img.shields.io/badge/license-MIT_(Original_Code)-green)
![Platform](https://img.shields.io/badge/platform-Windows_10%2F11_x64-0078D6)
![Blender](https://img.shields.io/badge/Blender-3.6%2B_%7C_4.x_%7C_5.x-E87D0D)
![Unreal Engine](https://img.shields.io/badge/Unreal_Engine-Not_Required-lightgrey)

> **DeepSeek Harness 专用 Cordis 4 插件包（`v0.1.1`）** — 面向本机合法《鸣潮》（Wuthering Waves）正式服已实装自机角色的贴图三级审计、隔离 Blender 沙盒风格化卡通渲染与动作表情展示、多门禁核验及标准化 UE 交接包生成管线（无需本机安装 Unreal Engine）。

> [!WARNING]
> **非官方项目声明与合规红线（Unofficial Notice & Compliance Boundaries）**
> - **非官方性质**：本插件为非官方第三方 3D 渲染与动画管线技术研究工具，与**广州库洛科技有限公司（Kuro Games）**无任何官方关联、合作、授权或背书。
> - **零资产 / 零密钥 / 零自动寻钥**：本仓库**不分发任何游戏原始资产、不内嵌专有商业 Oodle 动态库、不内置任何 AES 密钥，亦不提供自动联网寻钥功能**（当检测到本地 FModel 未关联或缺少有效密钥时，插件自动暂停并提醒宿主机提供本地自备的 `.json` / `.zip` 密钥文件包，经授权并自动备份原 `AppSettings.json` 后代为完成本地关联）。
> - **严禁商用、交易与测试服泄密**：严格仅限个人针对**正式服已公开实装角色**进行离线渲染与骨骼动画学习研究；**严禁用于任何测试服（Beta）拆包泄密、商业变现、有偿代做、公开资产分发、私下买卖交易或不良二创（NSFW）**。完整说明见包内 `NOTICE.md` 与 `THIRD_PARTY_LICENSES.md`。

> [!IMPORTANT]
> **首次打开生成的 `.blend` 时弹出「自动运行 Python 脚本」安全提示说明（非恶意脚本，请放心）**
>
> 产出的 `<ModelId>_showcase.blend` 内嵌了一段完全开源、可直接在 Blender「脚本」标签页查看全文的辅助脚本 **`ww_action_sync.py`**。它**零联网、零磁盘读写、且绝不修改原始动画关键帧数据**，仅用于在切换动作时自动贴合底部时间轴起止帧、自动联动同步/清零面部伴生表情轨（`*_ShapeKeys`），并在右侧按 `N` 提供 **`WW Showcase`** 快捷面板。点击 **「允许执行 / Allow Execution」** 即可启用；即使选择拒绝，模型、卡渲材质与动作依然完整可用。

---

## 一、适用范围、双版本区别与快速开始

- **发布渠道与独立项目说明**：本插件（`dsh-ww-auto-model-extractor`）为 **DeepSeek Harness 专用版**（发布于 GitHub 独立仓库与 DSH 插件市场）；若你使用的是 Antigravity / Claude Code / Cursor / Codex 或命令行，请前往独立发布的标准 Skill 仓库 `ww-auto-model-extractor-skill`（请勿互相混装）。
- **仅面向正式服已实装角色 + 中文多形态直检目录**：覆盖已公开实装自机体型（`IsNpc = false`），不含 NPC、Boss、怪物与场景道具，**严禁用于测试服或未公开内容**。输入中文时自动按**中文、小写英文/拼音、首字母大写/驼峰英文**三通道匹配角色命名目录（如 `今汐` → `Jinxi`、`长离` → `ChangLi`、`莉莉` → `Lili`、`琳奈` → `LinNai`）。
- **FModel 缺密钥暂停提醒与安全代关联说明**：若宿主机本地 FModel 尚未关联《鸣潮》目录或缺少有效密钥（或客户端更新后旧密钥过期），插件会自动暂停并提醒宿主机提供本地自备的 `.json` 或 `.zip` 密钥包路径；宿主机提供路径并确认同意后，插件仅在内存中只读提取 JSON（拒绝任何可执行文件），自动将原 `AppSettings.json` 备份为 `.bak` 后完成本地关联。
- **无需安装 Unreal Engine**：专注三级贴图审计拆分、Blender 风格化展示验证及标准化 `ue_handoff/handoff_manifest.json` + 无双 Root Rest-Pose `.fbx` 交接包生成。
- **对话使用方式**：在 DeepSeek Harness 对话框中直接说明需求（建议指定插件外部的 `work_dir` 如 `D:\WW_Outputs`），插件会按顺序执行：
  `dsh_ww_preflight_check` →（可选 `dsh_ww_list_characters`）→ `dsh_ww_extract_and_showcase` → `dsh_ww_verify_delivery`。

### 运行环境与依赖要求

| 组件 | 版本要求 | 是否必需 | 说明 |
| :--- | :--- | :---: | :--- |
| **DeepSeek Harness** | `>=0.2.1-rc.2 <1.0.0`（Cordis 4） | **必需** | 支持桌面端 / Web / CLI Profile，Node.js `>=20` |
| **操作系统** | Windows 10 / 11 (x64) | **必需** | 支持国服、国际服、Steam、Epic、WeGame 与自定义安装目录 |
| **《鸣潮》正式服客户端** | 本地官方正版正式服客户端 | **必需（硬门禁）** | 缺失时立即报错终止（`FATAL_MISSING_WUTHERING_WAVES`），严禁下载游戏 |
| **本地 FModel 密钥关联** | 本地 FModel 配置或宿主机自备 `.json`/`.zip` 包 | **缺失时暂停** | **本仓库不含密钥且不联网寻钥**；缺密钥/未关联时自动暂停，由宿主机提供本地密钥包并授权后自动备份关联 |
| **Blender** | `3.6 LTS` / `4.2 LTS` / `5.x`（实测 `5.2.3 LTS`） | **必需** | 缺失时返回 `CONSENT_REQUIRED`，获同意后下载官方便携版至隔离 `runtime/` |
| **解码运行库 (Oodle)** | 自动复用本机 FModel/UE 或授权按需下载 | **按需授权** | 开源包不随包分发闭源 Oodle DLL；裸机首次运行在征得同意后下载至 `runtime/native/` |
| **Python** | `3.10+`（未装时自动复用 Blender 内置 Python） | 自动满足 | 零额外 `pip install`，UTF-8 桥接加固 |
| **Unreal Engine** | — | **不需要** | 仅输出标准化 `ue_handoff/` 交接包 |

### 注册工具清单

| 工具名 | 职责与核心参数 |
| :--- | :--- |
| `dsh_ww_self_audit` | 对插件自身执行合规与健康自检（Python/JS 语法、Cordis 4 契约、第三方开源协议完整性、开源解码库健康度、零闭源 Oodle/密钥/违规词泄露） |
| `dsh_ww_preflight_check` | **强制第一步**：Stage 0 环境与本地 FModel 关联门禁（支持 `game_dir`/`blender_path`/`fmodel_dir`/`keys_file`/`work_dir`/`consent_download`/`consent_link_fmodel`） |
| `dsh_ww_list_characters` | 列出本机正式服客户端内已检出的自机角色（支持 `query` 中文三通道过滤、`keys_file` 与 `work_dir`） |
| `dsh_ww_extract_and_showcase` | 全链路执行本地校验与解析（含 D4 过滤）→ 贴图三级审计拆分 → Blender 沙盒风格化卡渲、物理与面部表情装配 → FBX 往返核验 → 标准化交接包封装（必填 `character`，可选 `keys_file`/`consent_link_fmodel`/`model_path`/`anim_names`/`max_anims`/`work_dir`） |
| `dsh_ww_verify_delivery` | 对交付目录产物（必填 `deliverable_dir`）及插件自身执行独立交叉验收 |

---

## 二、跨宿主机自检与授权请求规则

| 宿主机场景 | 插件行为 | 是否需宿主机同意 |
| :--- | :--- | :---: |
| **未安装《鸣潮》正式服客户端** | **硬门禁立即终止**（`FATAL_MISSING_WUTHERING_WAVES`），**严禁自动下载游戏** | 不允许下载 |
| **未检测到 Blender (3.6+/4.x/5.x)** | 返回 `CONSENT_REQUIRED`（含官方 URL 与 SHA256），**获同意后**下载安装至 `runtime/blender/` | **必须先同意** |
| **裸机缺少 Oodle 运行时解码库** | 优先复用本机 FModel/UE 环境；若无则返回 `CONSENT_REQUIRED`，**获同意后**按需下载（SHA256 校验）至 `runtime/native/` | **必须先同意** |
| **FModel 未关联目录或缺本地密钥** | **立即暂停工作**（`CONSENT_REQUIRED`），提醒宿主机提供本地自备的 `.json`/`.zip` 密钥包；**获同意后**内存只读校验、先备份 `.bak` 再写入本地 `AppSettings.json` 完成关联 | **必须先提供并同意** |
| **未安装 FModel GUI** | 可选建议；**获同意后**下载官方 FModel 发布包至隔离目录 `runtime/fmodel/` | **必须先同意** |
| **Blender 4.x/5.x 插件 API 差异** | 仅在工作区隔离沙盒 `sandbox_blender/` 内 AST 热修补并冒烟验证，**绝不修改全局配置** | 沙盒隔离 + 通告 |

---

## 三、重要交付须知：动作过滤规则（决策 D1–D4）与 Blender 避坑提醒

1. **需烘焙动作自动移交（决策 D1 / D4）**：源资产中不含逐帧骨骼姿态、仅存 `Root` / `IK_*` 控制曲线的片段（如 `Land_Roll_Attack01_2`）会在 Stage 1 自动过滤并记入 `ue_handoff/handoff_manifest.json -> deferred_to_ue_animations` 移交下游 UE 烘焙；空中循环动作（如 `Jump_Loop`）保留并标注 `is_aerial_loop: true`（决策 D3）。
2. **Blender 开箱指南**：
   - 贴图已内嵌打包（`pack_all`），3D 视口已按角色身高自动拉近居中并设为 `MATERIAL` 材质预览，顶部 11 个工作区按宿主机语言本地化，按**空格键**即播。
   - **切勿将 `*_ShapeKeys` 手动挂到 `Armature` 上**：`*_ShapeKeys` 是角色面部形态键（`KEY` 槽位）伴生表情轨，不是废动作；请只选不含 `_ShapeKeys` 后缀的身体主动作或用右侧 `N` 键 `WW Showcase` 面板切换。
   - **切勿执行 `Reorient Bones`**：保持 `UEFormat` 原生 `+X` 骨骼轴向，防止动作扭曲。

---

## 四、项目目录结构说明

```text
dsh-ww-auto-model-extractor/
├── .github/                     # Issue 模板、CI 合规契约验证与 Tag 发版工作流
├── assets/                      # 插件横幅视觉资源
├── bin/ww-extract/              # 无头解析子进程及开源解码库（Zlib-ng/Detex/ACL，不含专有 Oodle DLL）
├── bundled_addons/              # 随包 UEFormat Blender 扩展（含完整 GPL-3.0 LICENSE）
├── core/                        # 核心状态机、拼音直检、贴图三级审计、Blender 风格化装配与合规自检
├── docs/                        # 使用指南、发版运维指南与上游组件登记
├── lib/index.js                 # DeepSeek Harness Cordis 4 插件入口（注册 5 工具 + 内嵌 Skill）
├── locale/                      # DSH 多语言插件卡片元数据（zh.json、en.json）
├── skills/ww-auto-model-extractor/SKILL.md  # 内嵌 SOP 指令契约
├── tests/                       # Node Cordis 4 契约测试与 Python 回归测试套件
├── CHANGELOG.md                 # 语义化版本变更日志
├── CONTRIBUTING.md              # 贡献与本地校验指南
├── LICENSE                      # MIT 开源许可证（仅适用于本项目原创源代码）
├── NOTICE.md                    # 非官方声明、协议适用边界隔离与知识产权声明
├── THIRD_PARTY_LICENSES.md      # 随包第三方开源组件许可证全文与版权归属汇编
├── README.md                    # DSH 插件详情页与 GitHub 共用自包含主文档
├── SECURITY.md                  # 安全红线、漏洞报告与版权方响应渠道
├── cordis.patch.yml             # Cordis 4 Bundle 声明补丁
├── icon.png                     # 插件图标（<= 256 KiB）
├── orchestrator.py              # 单入口 JSON CLI 调度器
├── package.json                 # npm / DSH 插件清单
└── tools.schema.json            # 与 lib/index.js 严格同步的 5 工具 JSON Schema
```

---

## 五、插件更新与反馈联系方式

- **更新方式**：在 DSH 客户端「插件管理」点击「更新」，或运行 `dsh plugin update dsh-ww-auto-model-extractor`，亦可运行 `dsh plugin add <新版 .tgz 下载链接>`；升级后调用 `dsh_ww_self_audit` 验证状态为 `PASS`。
- **维护者联系邮箱**：`jiuyue200712@gmail.com`（欢迎通过 GitHub Issues 或邮件反馈跨机兼容问题或版权方沟通）。
- **包内完整参考文档**（DSH 详情页不支持相对链接跳转，可在本地目录直接查阅）：`docs/USER_GUIDE_AND_NOTICES.md`、`docs/UPDATING_AND_RELEASE_GUIDE.md`、`docs/REFERENCES.md`、`NOTICE.md`、`THIRD_PARTY_LICENSES.md`、`SECURITY.md`。

---

## 六、免责声明与安全合规条款（Disclaimer & Legal Notice）

1. **非官方声明（Unofficial & Non-Affiliation）**：本插件为非官方第三方技术研究工具，与**广州库洛科技有限公司（Kuro Games）**无任何官方关联、合作、授权或背书。
2. **仅限个人学习与技术研究**：本插件、脚本及产出的工程文件严格仅限用于**个人离线学习、风格化 3D 渲染与骨骼动画管线研究及非营利性技术交流**。建议研究验证完成后自行妥善清理本地衍生文件。
3. **严禁商业用途与一切私人交易**：**严禁**将本插件或任何衍生角色资产（包括但不限于 3D 模型、贴图、骨骼、动画、形态键、材质参数、Blender/FBX 工程文件等）用于**任何形式的商业用途、盈利性活动、有偿商单、代做服务、付费社群/网盘变现、私下买卖或私人交易**；亦严禁公开二次分发、打包传播任何游戏原始或衍生资产及密钥。
4. **严禁测试服拆包与未公开内容泄密（Anti-Leak）**：**严禁**将本插件用于任何未公开测试服（Beta）、前瞻预下载包、未正式实装上线角色/皮肤/动作/废案资产的解析、渲染、截图或外泄传播，严禁侵犯商业秘密。
5. **零技术保护规避与零进程干预**：本仓库**不内嵌任何游戏资产、不分发专有商业解码 DLL、不内置任何 AES 密钥，且不提供自动联网寻钥服务**；本插件绝不注入或读取游戏进程内存、不修改游戏客户端文件、不触碰或绕过反作弊系统（如 ACE）。
6. **禁止违规衍生与知识产权隔离**：严禁用于架设私服、外挂、竞品换皮、色情低俗或侮辱损害角色形象内容（NSFW）及商业 AI 训练投喂。《鸣潮》（Wuthering Waves）全部游戏资产与商标知识产权均归**广州库洛科技有限公司（Kuro Games）**独家所有；包内 `LICENSE`（MIT）**仅适用于本项目原创源代码**（随包第三方开源组件按 `THIRD_PARTY_LICENSES.md` 各自上游协议授权），绝不授予对任何游戏资产的许可。使用者须确保本机客户端来源合法正版，一切违规引发的法律与账号风险由使用者自行承担。
7. **版权方侵权响应**：若原版权方或合法权利人认为本开源项目的任何内容涉及侵权或不当，请通过项目 GitHub Issues 或联系邮箱 `jiuyue200712@gmail.com` 告知，维护者核实后将第一时间配合删除、修改或下架处理。

> **English Disclaimer**: (1) **Non-Affiliation** — Unofficial third-party technical research plugin, NOT affiliated with or endorsed by Kuro Games (广州库洛科技有限公司). (2) **Personal Offline Study Only** — Strictly limited to personal offline learning and non-commercial stylized 3D rendering/animation research on officially released live characters. (3) **No Commercial Use or Private Trading** — Commercial use, monetization, paid commissions, asset/key redistribution, and private buying/selling/trading are strictly prohibited. (4) **No Beta/Unreleased Leaks** — Using this plugin on closed-beta clients, pre-download packages, or unreleased content is strictly forbidden. (5) **No Circumvention or Process Tampering** — Bundles zero game assets, zero proprietary Oodle DLLs, and zero AES keys; provides no automated remote key fetching; never touches game memory, client files, or anti-cheat. (6) **IP & License Scope** — Private servers, cheats, NSFW/defamatory derivatives, and commercial AI training are prohibited. All Wuthering Waves IP belongs exclusively to Kuro Games. The MIT License applies solely to original source code (third-party open-source components are governed by `THIRD_PARTY_LICENSES.md`). Users assume all legal and account risks. (7) **Rights Holder Contact** — Contact maintainers via GitHub Issues or `jiuyue200712@gmail.com` for prompt review or removal.
