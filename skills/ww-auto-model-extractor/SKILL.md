---
name: ww-auto-model-extractor
version: 0.1.1
description: 【非官方】面向本机合法《鸣潮》（Wuthering Waves）正式服已实装角色的贴图三级审计、隔离 Blender 沙盒风格化卡渲与动作表情展示、多门禁核验与标准化 UE 交接包管线（无需本机安装 Unreal Engine）。
whenToUse: 当用户希望对本机合法《鸣潮》（Wuthering Waves）正式服已实装自机角色进行 Blender 风格化材质/动作展示核验或生成标准化 UE 交接包时触发。
---

# [非官方]《鸣潮》（Wuthering Waves）角色风格化 Blender 展示与交接管线插件指令契约

## 强制执行纪律

1. **禁止直接索要角色名**：激活本插件后，第一步**必须**调用 `dsh_ww_preflight_check` 完成包体合规自检、宿主机环境探测及隔离 Blender 沙盒冒烟测试。
2. **缺少《鸣潮》正式服客户端严禁下载，直接终止**：若 `dsh_ww_preflight_check` 返回 `code: "FATAL_MISSING_WUTHERING_WAVES"`，立刻告知宿主机缺少目标游戏客户端并停止任务，绝不尝试下载游戏。
3. **缺少软件或运行库必须先征得宿主机同意**：若返回 `status: "CONSENT_REQUIRED"`（如缺少 Blender，或本机无 FModel/UE 环境需按需下载 Oodle 运行库），必须先向宿主机说明下载来源、SHA256 校验与隔离目录，**获得明确同意后**方可传入 `consent_download`（如 `blender,oodle`）。
4. **FModel 未关联或缺密钥时暂停并代执行本地安全关联（无联网寻钥）**：本开源版本不含任何密钥且不提供自动联网寻钥。当检测到本机 FModel 未关联《鸣潮》目录或缺少有效密钥（返回 `provide_keys_and_link_fmodel` 或 `HOST_KEYS_REQUIRED`）时，**必须立即暂停工作**，提醒宿主机提供其本地自备的密钥文件或压缩包路径（支持 `.json` 或含 `keys.json` 的 `.zip`，内存只读提取 JSON，拒绝任何可执行文件），并在获宿主机同意后调用 `dsh_ww_preflight_check(keys_file="<本地路径>", consent_link_fmodel=true)` 自动备份原 `AppSettings.json` 并完成本地关联。
5. **明确通告 `host_notice` & 不要求安装 UE**：任意工具返回非空 `host_notice` 必须完整通告宿主机；未烘焙动作按决策 D4 自动移交 `handoff_manifest.json -> deferred_to_ue_animations`，无需宿主机安装 Unreal Engine。
6. **必须进行交付验收**：完成 `dsh_ww_extract_and_showcase` 后，调用 `dsh_ww_verify_delivery` 对产出物和插件自身进行交叉核验。

## 标准对话流

1. 调用 `dsh_ww_preflight_check`。
2. 门禁通过后，询问目标正式服已实装角色名称（支持中文、小写英文/拼音、首字母大写/驼峰英文直检，如 `今汐`→`Jinxi`、`长离`→`ChangLi`、`莉莉`→`Lili`、`琳奈`→`LinNai`；若需查看列表调用 `dsh_ww_list_characters`）。
3. 收到角色名后调用 `dsh_ww_extract_and_showcase`（建议将 `work_dir` 指向插件目录之外的工作目录；如宿主机指定了本地 `keys.json`，一并传入 `keys_file`）。
4. 调用 `dsh_ww_verify_delivery` 核验交付物，并提醒用户：首次打开 `.blend` 点击「允许执行」可激活内嵌 `ww_action_sync.py`（自动校准时间轴帧范围并同步面部伴生表情 `*_ShapeKeys`，零联网且不改原关键帧）；切勿手动将 `*_ShapeKeys` 挂到 `Armature` 上，建议用右侧 `N` 键 `WW Showcase` 面板切换动作。

## 免责声明与合规边界

本项目为非官方第三方技术研究插件，与广州库洛科技有限公司（Kuro Games）无任何官方关联。严格仅限正式服已实装角色的个人离线学习与渲染动画研究；**严禁**用于测试服（Beta）拆包泄密、任何商业用途、盈利活动、有偿代做、公开资产分发、私人买卖交易及不良二创（NSFW）。游戏资产版权归广州库洛科技有限公司所有，MIT 许可仅适用于本插件原创代码（第三方开源组件协议见 `THIRD_PARTY_LICENSES.md`）。联系邮箱：`jiuyue200712@gmail.com`。
