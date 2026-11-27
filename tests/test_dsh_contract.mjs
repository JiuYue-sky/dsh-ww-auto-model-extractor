/**
 * Contract test for DeepSeek Harness (0.2.2+) Cordis plugin `dsh-ww-auto-model-extractor`.
 * Verifies:
 *  1. package.json DSH manifest fields, icon <= 256 KiB, cordis.patch.yml existence.
 *  2. lib/index.js loads cleanly as ESM and registers all 5 tools + embedded SOP skill on mock Cordis ctx.
 *  3. Tool names & parameters stay in sync with tools.schema.json.
 *  4. Every tool's output.render() returns ContentBlock[] (never bare string).
 *  5. Actually executes `dsh_ww_self_audit` through the Node -> Python orchestrator bridge!
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, "..");

async function main() {
  // 1. Validate package.json & assets
  const pkg = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, "package.json"), "utf8"));
  assert.equal(pkg.name, "dsh-ww-auto-model-extractor");
  assert.equal(pkg.type, "module");
  assert.equal(pkg.repository?.type, "git", "package.json repository.type must be git for marketplace/npm linkage");
  assert.ok(
    String(pkg.repository?.url || "").includes("github.com/JiuYue-sky/dsh-ww-auto-model-extractor"),
    "package.json repository.url must point to the canonical GitHub repo"
  );
  assert.ok(
    String(pkg.engines?.dsh || "").includes(">=0.2.2-0"),
    "engines.dsh must include explicit 0.2.2 prerelease branch for node-semver compatibility"
  );
  assert.ok(pkg.engines?.dsh, "engines.dsh must be declared");
  assert.ok(pkg.engines.dsh.startsWith(">="), "engines.dsh must declare lower bound");
  assert.ok(!pkg.engines.dsh.includes("<0.4.0"), "engines.dsh must not artificially cap future DSH 0.4+ updates");
  assert.match(pkg.description || "", /[\u4e00-\u9fff]/, "package.json description must contain Chinese text");
  assert.equal(pkg.dsh?.bundle?.patch, "./cordis.patch.yml");
  assert.ok(fs.existsSync(path.join(PLUGIN_ROOT, "cordis.patch.yml")), "cordis.patch.yml must exist");

  // 1b. Validate DSH locale/zh.json + locale/en.json (DSH LOCALE_IDS = ['zh', 'en'], NOT 'zh-CN'!)
  const zhLocPath = path.join(PLUGIN_ROOT, "locale", "zh.json");
  const enLocPath = path.join(PLUGIN_ROOT, "locale", "en.json");
  const staleZhCnPath = path.join(PLUGIN_ROOT, "locale", "zh-CN.json");
  assert.ok(fs.existsSync(enLocPath), "locale/en.json must exist (required by DSH readPluginMeta)");
  assert.ok(fs.existsSync(zhLocPath), "locale/zh.json must exist (DSH uses 'zh', not 'zh-CN')");
  assert.ok(!fs.existsSync(staleZhCnPath), "stale locale/zh-CN.json must be removed");
  const zhLoc = JSON.parse(fs.readFileSync(zhLocPath, "utf8"));
  const enLoc = JSON.parse(fs.readFileSync(enLocPath, "utf8"));
  assert.match(zhLoc.meta?.title || "", /[\u4e00-\u9fff]/, "locale/zh.json meta.title must be Chinese");
  assert.match(zhLoc.meta?.description || "", /[\u4e00-\u9fff]/, "locale/zh.json meta.description must be Chinese");
  assert.ok(enLoc.meta?.title && enLoc.meta?.description, "locale/en.json meta.title & description must be non-empty");

  // 1c. Validate DSH README has NO unclickable relative .md links & includes full bilingual disclaimer + contact + structure
  const readmeRaw = fs.readFileSync(path.join(PLUGIN_ROOT, "README.md"), "utf8");
  const deadRelMd = readmeRaw.match(/\[[^\]]+\]\((?!https?:\/\/|#|mailto:)[^)]+\.md(?:#[^)]*)?\)/gi);
  assert.equal(deadRelMd, null, `DSH README must not contain unclickable relative .md links: ${JSON.stringify(deadRelMd)}`);
  for (const kw of ["免责声明", "商业", "交易", "Kuro Games", "ww_action_sync.py", "D1–D4", "jiuyue200712@gmail.com", "目录结构"]) {
    assert.ok(readmeRaw.includes(kw), `DSH README.md must include inline section/keyword: ${kw}`);
  }
  assert.ok(fs.existsSync(path.join(PLUGIN_ROOT, "LICENSE")), "LICENSE must exist");

  const iconPath = path.join(PLUGIN_ROOT, pkg.icon);
  assert.ok(fs.existsSync(iconPath), "icon.png must exist");
  assert.ok(fs.statSync(iconPath).size <= 256 * 1024, "icon.png must be <= 256 KiB per DSH manifest spec");

  const bannerPath = path.join(PLUGIN_ROOT, "assets", "banner.png");
  assert.ok(fs.existsSync(bannerPath), "assets/banner.png must exist");

  // 2. Validate SKILL.md frontmatter
  const skillPath = path.join(PLUGIN_ROOT, "skills", "ww-auto-model-extractor", "SKILL.md");
  const skillRaw = fs.readFileSync(skillPath, "utf8");
  assert.ok(skillRaw.startsWith("---"), "SKILL.md must start with YAML frontmatter");
  assert.ok(skillRaw.includes("name: ww-auto-model-extractor"), "SKILL.md must declare kebab-case name");
  assert.ok(skillRaw.includes("dsh_ww_preflight_check"), "SKILL.md must enforce dsh_ww_preflight_check");

  // 3. Load lib/index.js with mock Cordis 4 ctx & verify strict Cordis 4 plugin contract
  const mod = await import(pathToFileURL(path.join(PLUGIN_ROOT, "lib", "index.js")).href);
  assert.equal(typeof mod.apply, "function", "Plugin must export apply()");
  assert.notEqual(mod.apply.constructor.name, "AsyncFunction", "Cordis 4 apply() MUST be synchronous!");
  assert.ok(Array.isArray(mod.inject), "Cordis 4 inject MUST be an array (never {optional: ...}!)");
  assert.ok(mod.inject.includes("tools"), "Cordis 4 inject must include 'tools'");
  assert.equal(typeof mod.resolvePythonExecutable, "function");
  const resolvedPy = mod.resolvePythonExecutable();
  assert.ok(resolvedPy && resolvedPy.exe, "resolvePythonExecutable() must resolve a valid Python 3 interpreter");

  const registeredTools = new Map();
  const registeredSkills = [];
  const mockCtx = {
    skills: {
      register(skill) {
        registeredSkills.push(skill);
        return () => {};
      },
    },
    tools: {
      register(def) {
        registeredTools.set(def.name, def);
        return () => registeredTools.delete(def.name);
      },
    },
    inject(_deps, cb) {
      return cb(mockCtx);
    },
  };

  mod.apply(mockCtx, { enabled: true });

  // 4. Verify registered skills & tools match tools.schema.json
  assert.equal(registeredSkills.length, 1, "Must register 1 embedded skill");
  assert.equal(registeredSkills[0].name, "ww-auto-model-extractor");
  assert.match(registeredSkills[0].description || "", /[\u4e00-\u9fff]/, "Embedded skill description must be Chinese-first");
  assert.ok(registeredSkills[0].content.length > 100);

  const schemaDoc = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, "tools.schema.json"), "utf8"));
  const expectedNames = schemaDoc.tools.map((t) => t.name).sort();
  const actualNames = Array.from(registeredTools.keys()).sort();
  assert.deepEqual(actualNames, expectedNames, "Registered tool names must match tools.schema.json");

  // 4b. Enforce exact parameter-name & required-flag parity between lib/index.js and tools.schema.json!
  for (const st of schemaDoc.tools) {
    const reg = registeredTools.get(st.name);
    const schemaParamKeys = Object.keys(st.parameters || {}).sort();
    const actualParamKeys = Object.keys(reg.parameters?.properties || {}).sort();
    assert.deepEqual(actualParamKeys, schemaParamKeys, `Parameter mismatch on tool ${st.name}`);
    const schemaReq = Object.entries(st.parameters || {})
      .filter(([, v]) => v && v.required === true)
      .map(([k]) => k)
      .sort();
    const actualReq = Array.isArray(reg.parameters?.required) ? [...reg.parameters.required].sort() : [];
    assert.deepEqual(actualReq, schemaReq, `Required parameter mismatch on tool ${st.name}`);
  }

  // 5. Verify every tool's JSON Schema parameters & output.render ContentBlock[]
  for (const [tname, def] of registeredTools.entries()) {
    assert.equal(def.parameters?.type, "object", `${tname}.parameters must be compiled JSON Schema object`);
    assert.equal(typeof def.parameters?.properties, "object", `${tname}.parameters.properties must exist`);
    const rendered = def.output.render({}, { status: "PASS", host_notice: "test notice" });
    assert.ok(Array.isArray(rendered), `${tname}.output.render must return ContentBlock[]`);
    assert.equal(rendered[0].type, "text");
    assert.ok(rendered[0].text.includes("test notice"), `${tname}.output.render must surface host_notice`);
  }

  // 6. Execute live self-audit through the DSH tool wrapper!
  const auditTool = registeredTools.get("dsh_ww_self_audit");
  const auditRes = await auditTool.execute({}, {});
  assert.equal(auditRes.status, "PASS", `dsh_ww_self_audit failed: ${JSON.stringify(auditRes.failures)}`);
  assert.equal(auditRes.flavor, "dsh_plugin");

  // 7. Verify UTF-8 Node -> Python bridge for Chinese multi-form playable-folder matching (Chinese / lower / Capitalized)
  const pyProbe = spawnSync(
    resolvedPy.exe,
    [
      ...resolvedPy.args,
      "-c",
      [
        "import json, sys",
        "sys.path.insert(0, sys.argv[1])",
        "from core.config_rules import resolve_character_query_variants",
        "from core.asset_extractor import _match_characters_detailed",
        "v_lili = resolve_character_query_variants('莉莉')",
        "v_new = resolve_character_query_variants('星月')",
        "mock = [",
        "  {'BodyType':'FemaleMS','CharacterFolder':'Lili','ModelId':'R2T1LiliMd10011','ModelPath':'Client/Content/Aki/Character/Role/FemaleMS/Lili/R2T1LiliMd10011/Model/R2T1LiliMd10011.uasset','MaterialCount':21,'TextureCount':33},",
        "  {'BodyType':'FemaleM','CharacterFolder':'xingyue','ModelId':'R2T1xingyueMd10011','ModelPath':'Client/Content/Aki/Character/Role/FemaleM/xingyue/R2T1xingyueMd10011/Model/R2T1xingyueMd10011.uasset','MaterialCount':10,'TextureCount':20},",
        "  {'BodyType':'FemaleM','CharacterFolder':'苍澜','ModelId':'R2T1CanglanMd10011','ModelPath':'Client/Content/Aki/Character/Role/FemaleM/苍澜/R2T1CanglanMd10011/Model/R2T1CanglanMd10011.uasset','MaterialCount':10,'TextureCount':20},",
        "]",
        "m1, d1 = _match_characters_detailed(mock, '莉莉')",
        "m2, d2 = _match_characters_detailed(mock, '星月')",
        "m3, d3 = _match_characters_detailed(mock, '苍澜')",
        "print(json.dumps({'v_lili': v_lili, 'v_new': v_new, 'm1': d1[0], 'm2': d2[0], 'm3': d3[0]}, ensure_ascii=False))",
      ].join("\n"),
      PLUGIN_ROOT,
    ],
    {
      cwd: PLUGIN_ROOT,
      encoding: "utf8",
      env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
      timeout: 15000,
    }
  );
  assert.equal(pyProbe.status, 0, `UTF-8 Chinese folder-match probe failed: ${pyProbe.stderr}`);
  const probeData = JSON.parse(pyProbe.stdout);
  assert.ok(probeData.v_lili.chinese.includes("莉莉"));
  assert.ok(probeData.v_lili.english_lower.includes("lili"));
  assert.ok(probeData.v_lili.english_capitalized.includes("Lili"));
  assert.equal(probeData.m1.character_folder, "Lili");
  assert.equal(probeData.m1.match_channel, "english_capitalized_folder_exact");
  assert.equal(probeData.m2.character_folder, "xingyue");
  assert.equal(probeData.m2.match_channel, "english_lower_folder_exact");
  assert.equal(probeData.m3.character_folder, "苍澜");
  assert.equal(probeData.m3.match_channel, "chinese_folder_exact");

  // 7. Security guard checks: NUL-byte rejection, malformed delivery_summary.json, and path escape rejection
  const extractTool = registeredTools.get("dsh_ww_extract_and_showcase");
  const nulRes = await extractTool.execute({ character: "Lili\0evil" }, {});
  assert.equal(nulRes.status, "FAIL", "NUL byte in character must be rejected");

  const verifyTool = registeredTools.get("dsh_ww_verify_delivery");
  const tmpSecDir = fs.mkdtempSync(path.join(os.tmpdir(), "dsh_sec_"));
  try {
    fs.writeFileSync(path.join(tmpSecDir, "delivery_summary.json"), "{broken json", "utf8");
    const badJsonRes = await verifyTool.execute({ deliverable_dir: tmpSecDir }, {});
    assert.equal(badJsonRes.status, "FAIL", "Malformed delivery_summary.json must fail cleanly");
    assert.ok(badJsonRes.failures.some((m) => m.includes("Malformed delivery_summary.json")));

    const escapeSummary = {
      handoff_manifest_path: path.join(PLUGIN_ROOT, "package.json"),
      delivery_report_md: path.join(PLUGIN_ROOT, "README.md"),
      showcase_blend_path: path.join(PLUGIN_ROOT, "LICENSE"),
      handoff_fbx_path: path.join(PLUGIN_ROOT, "icon.png"),
      preview_renders: [path.join(PLUGIN_ROOT, "icon.png")],
    };
    fs.writeFileSync(path.join(tmpSecDir, "delivery_summary.json"), JSON.stringify(escapeSummary), "utf8");
    const escRes = await verifyTool.execute({ deliverable_dir: tmpSecDir }, {});
    assert.equal(escRes.status, "FAIL", "Paths escaping deliverable_dir must be rejected");
    assert.ok(escRes.failures.some((m) => m.includes("outside deliverable_dir")));
  } finally {
    fs.rmSync(tmpSecDir, { recursive: true, force: true });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        plugin: pkg.name,
        version: pkg.version,
        tools_verified: actualNames,
        skills_verified: registeredSkills.map((s) => s.name),
        self_audit_checks: auditRes.total_checks,
        multiform_chinese_match_verified: true,
        security_guards_verified: true,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("DSH CONTRACT TEST FAILED:", err);
  process.exit(1);
});
