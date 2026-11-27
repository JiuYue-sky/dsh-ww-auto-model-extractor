/**
 * [Unofficial] DeepSeek Harness (0.2.2+) Cordis Plugin for Wuthering Waves Stylized
 * Character Blender Showcase & Standardized UE Handoff.
 *
 * Thin wrapper delegating all deterministic auditing, Blender sandbox assembly,
 * and compliance self-audit work to the shared `orchestrator.py` + `core/` engine.
 */

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PLUGIN_ROOT = path.resolve(__dirname, "..");
export const ORCHESTRATOR_PATH = path.join(PLUGIN_ROOT, "orchestrator.py");
export const SKILL_MD_PATH = path.join(PLUGIN_ROOT, "skills", "ww-auto-model-extractor", "SKILL.md");

export const name = "ww-auto-model-extractor";
export const inject = ["tools"];

function fallbackDefineTool(def) {
  const rawParams = def.parameters || {};
  let compiledParams;
  if (rawParams.type === "object" && rawParams.properties) {
    compiledParams = rawParams;
  } else {
    const properties = {};
    const required = [];
    for (const [k, v] of Object.entries(rawParams)) {
      if (!v || typeof v !== "object") continue;
      const { required: isReq, ...rest } = v;
      properties[k] = rest;
      if (isReq === true) required.push(k);
    }
    compiledParams = {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }
  return {
    ...def,
    parameters: compiledParams,
  };
}

async function loadDefineTool() {
  try {
    const mod = await import("@deepseek-ai/dsh-tools");
    if (typeof mod.defineTool === "function") return mod.defineTool;
  } catch {
    // Fallback JSON-Schema compiler for isolated plugin installs & contract testing
  }
  return fallbackDefineTool;
}

const defineTool = await loadDefineTool();

let _cachedPython = null;

function _probePython(exe, prefixArgs = []) {
  try {
    const res = spawnSync(exe, [...prefixArgs, "-c", "import sys; print(sys.version_info[0])"], {
      windowsHide: true,
      timeout: 5000,
      encoding: "utf8",
    });
    return res.status === 0 && (res.stdout || "").trim().startsWith("3");
  } catch {
    return false;
  }
}

function _discoverBlenderEmbeddedPythons() {
  const found = [];
  const scanRoots = [path.join(PLUGIN_ROOT, "runtime", "blender")];
  if (process.platform === "win32") {
    const localApp = process.env.LOCALAPPDATA;
    if (localApp) {
      scanRoots.push(path.join(localApp, "Programs", "Blender Foundation"));
    }
    for (let code = 67; code <= 90; code++) {
      const drv = `${String.fromCharCode(code)}:\\`;
      if (!fs.existsSync(drv)) continue;
      scanRoots.push(
        path.join(drv, "Program Files", "Blender Foundation"),
        path.join(drv, "Blender Foundation"),
        path.join(drv, "Apps", "Blender"),
        path.join(drv, "Blender"),
        path.join(drv, "SteamLibrary", "steamapps", "common")
      );
    }
  }
  for (const root of scanRoots) {
    if (!fs.existsSync(root)) continue;
    try {
      const entries = fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => b.name.localeCompare(a.name));
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        const sub = path.join(root, e.name);
        for (const inner of fs.readdirSync(sub, { withFileTypes: true })) {
          if (!inner.isDirectory()) continue;
          const py = path.join(sub, inner.name, "python", "bin", process.platform === "win32" ? "python.exe" : "python3");
          if (fs.existsSync(py)) found.push(py);
        }
      }
    } catch {
      // ignore permission errors on scan roots
    }
  }
  return found;
}

export function resolvePythonExecutable() {
  if (_cachedPython) return _cachedPython;

  const candidates = [];
  if (process.env.WW_AUTO_PYTHON && fs.existsSync(process.env.WW_AUTO_PYTHON)) {
    candidates.push({ exe: process.env.WW_AUTO_PYTHON, args: [] });
  }
  if (process.platform === "win32") {
    candidates.push({ exe: "python", args: [] });
    candidates.push({ exe: "py", args: ["-3"] });
    candidates.push({ exe: "python3", args: [] });
    const localApp = process.env.LOCALAPPDATA;
    if (localApp) {
      const pyRoot = path.join(localApp, "Programs", "Python");
      if (fs.existsSync(pyRoot)) {
        try {
          for (const e of fs.readdirSync(pyRoot, { withFileTypes: true }).sort((a, b) => b.name.localeCompare(a.name))) {
            if (!e.isDirectory()) continue;
            const pyExe = path.join(pyRoot, e.name, "python.exe");
            if (fs.existsSync(pyExe)) candidates.push({ exe: pyExe, args: [] });
          }
        } catch {}
      }
    }
  } else {
    candidates.push({ exe: "python3", args: [] });
    candidates.push({ exe: "python", args: [] });
  }
  for (const bpyExe of _discoverBlenderEmbeddedPythons()) {
    candidates.push({ exe: bpyExe, args: [] });
  }

  for (const c of candidates) {
    if (_probePython(c.exe, c.args)) {
      _cachedPython = c;
      return c;
    }
  }
  return null;
}

const MAX_CAPTURE_BYTES = 16 * 1024 * 1024;

function _sanitizeCliValue(raw) {
  const s = String(raw ?? "");
  if (s.includes("\0")) {
    throw new Error("Invalid NUL byte rejected in CLI argument");
  }
  return s;
}

function _pushOpt(cli, flag, raw) {
  if (raw === undefined || raw === null || raw === "") return;
  cli.push(`${flag}=${_sanitizeCliValue(raw)}`);
}

function _clampMaxAnims(raw) {
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n)) return 6;
  return Math.max(1, Math.min(64, n));
}

function _isPathInsideDir(candidate, baseDir) {
  if (typeof candidate !== "string" || !candidate.trim() || candidate.includes("\0")) return false;
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(candidate);
  const rel = path.relative(resolvedBase, resolvedTarget);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function runOrchestrator(cliArgs, { signal, timeoutMs = 420_000 } = {}) {
  return new Promise((resolve) => {
    const py = resolvePythonExecutable();
    if (!py) {
      resolve({
        exitCode: 2,
        payload: {
          status: "CONSENT_REQUIRED",
          code: "HOST_MISSING_PYTHON_AND_BLENDER",
          error: "Host machine has neither Python 3 nor Blender (with embedded Python) installed.",
          host_notice:
            "未在本机检测到 Python 3 或 Blender（可自动复用 Blender 内置 Python）。请先安装官方 Blender 4.2+/5.2 LTS 或 Python 3.10+ 后重试；或设置环境变量 WW_AUTO_PYTHON 指向 python.exe。",
        },
        stderr: "",
      });
      return;
    }
    const child = spawn(py.exe, [...py.args, ORCHESTRATOR_PATH, ...cliArgs], {
      cwd: PLUGIN_ROOT,
      windowsHide: true,
      env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdoutChunks = [];
    const stderrChunks = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;

    const finish = (code, extraErr = "") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      let parsed = null;
      try {
        const trimmed = stdout.trim();
        const jsonStart = trimmed.indexOf("{");
        if (jsonStart >= 0) {
          parsed = JSON.parse(trimmed.slice(jsonStart));
        }
      } catch {
        parsed = null;
      }
      if (parsed && typeof parsed === "object") {
        resolve({ exitCode: code ?? -1, payload: parsed, stderr: stderr.slice(-1000) });
      } else {
        resolve({
          exitCode: code ?? -1,
          payload: {
            status: "FAIL",
            error: extraErr || stderr.slice(-1000) || stdout.slice(-1000) || "Orchestrator produced non-JSON output",
          },
          stderr: stderr.slice(-1000),
        });
      }
    };

    const onAbort = () => {
      try {
        child.kill("SIGKILL");
      } catch {}
      finish(-1, "Aborted by caller signal");
    };
    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }

    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {}
      finish(-1, `DSH wrapper timeout exceeded (${timeoutMs}ms)`);
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      const buf = Buffer.isBuffer(d) ? d : Buffer.from(d);
      if (stdoutBytes < MAX_CAPTURE_BYTES) {
        const remain = MAX_CAPTURE_BYTES - stdoutBytes;
        stdoutChunks.push(buf.length <= remain ? buf : buf.subarray(0, remain));
        stdoutBytes += Math.min(buf.length, remain);
      }
    });
    child.stderr.on("data", (d) => {
      const buf = Buffer.isBuffer(d) ? d : Buffer.from(d);
      if (stderrBytes < MAX_CAPTURE_BYTES) {
        const remain = MAX_CAPTURE_BYTES - stderrBytes;
        stderrChunks.push(buf.length <= remain ? buf : buf.subarray(0, remain));
        stderrBytes += Math.min(buf.length, remain);
      }
    });
    child.on("error", (err) => finish(-1, String(err)));
    child.on("close", (code) => finish(code));
  });
}

function readSkillBody() {
  if (!fs.existsSync(SKILL_MD_PATH)) {
    return "Run dsh_ww_preflight_check BEFORE asking for character name. Never auto-download Wuthering Waves.";
  }
  const raw = fs.readFileSync(SKILL_MD_PATH, "utf8");
  const stripped = raw.replace(/^---[\s\S]*?---\s*/, "");
  return stripped.trim();
}

function renderJsonBlocks(title, payload) {
  const notice = payload?.host_notice ? `\n\n[HOST NOTICE]\n${payload.host_notice}` : "";
  const text = `${title} (status=${payload?.status ?? "UNKNOWN"})${notice}\n\n${JSON.stringify(payload, null, 2)}`;
  return [{ type: "text", text }];
}

export function apply(ctx, config = {}) {
  if (config.enabled === false) return;

  const registerSkillOn = (sctx) => {
    if (sctx.skills && typeof sctx.skills.register === "function") {
      sctx.skills.register({
        name: "ww-auto-model-extractor",
        description:
          "【非官方】面向本机合法《鸣潮》（Wuthering Waves）正式服已实装角色的贴图三级审计、隔离 Blender 沙盒风格化卡渲与动作表情展示及标准化 UE 交接管线（强制先跑前置门禁，无需安装 UE）。",
        whenToUse:
          "当用户希望对本机合法《鸣潮》（Wuthering Waves）正式服已实装角色进行 Blender 风格化材质/动作展示核验或准备标准化 UE 交接包时触发。",
        source: "bundled",
        path: SKILL_MD_PATH,
        resourceBase: { kind: "directory", path: PLUGIN_ROOT },
        content: readSkillBody(),
      });
    }
  };
  if (typeof ctx.inject === "function") {
    ctx.inject(["skills"], registerSkillOn);
  } else {
    registerSkillOn(ctx);
  }

  const registerToolsOn = (sctx) => {
    const disposers = [];

    disposers.push(
      sctx.tools.register(
        defineTool({
          name: "dsh_ww_self_audit",
          description:
            "Run internal compliance & health self-audit on dsh-ww-auto-model-extractor (Python/JS syntax, DSH manifest contract, open-source decoders Zlib/Detex/ACL, third-party licenses, zero proprietary Oodle/key/URL leak scan).",
          parameters: {},
          output: {
            schema: { type: "object", additionalProperties: true },
            render: (_args, value) => renderJsonBlocks("WW Showcase Pipeline Self-Audit", value),
          },
          async execute(_args, exec) {
            const { payload } = await runOrchestrator(["--self-audit"], { signal: exec?.signal, timeoutMs: 60_000 });
            return payload;
          },
        })
      )
    );

    disposers.push(
      sctx.tools.register(
        defineTool({
          name: "dsh_ww_preflight_check",
          description:
            "Stage 0 Preflight Gate: MUST be called BEFORE asking for a character name. Runs package self-audit, detects local official Wuthering Waves client (aborts if missing; NEVER downloads game), checks Blender/Oodle and FModel link/keys (pauses if FModel is unlinked or lacks keys so host can supply local .json/.zip key package), and runs isolated Blender sandbox smoke test.",
          parameters: {
            game_dir: { type: "string", description: "Optional explicit path to local official Wuthering Waves installation." },
            blender_path: { type: "string", description: "Optional explicit path to blender.exe." },
            fmodel_dir: { type: "string", description: "Optional explicit path to local FModel directory or FModel.exe." },
            keys_file: {
              type: "string",
              description: "Host-provided local .json or .zip key package path (parsed safely in memory; combine with consent_link_fmodel=true to backup AppSettings.json and link FModel).",
            },
            work_dir: { type: "string", description: "Optional output working directory." },
            consent_download: {
              type: "string",
              description: "ONLY pass after explicit user approval! Comma-separated: blender,oodle,fmodel (never game).",
            },
            consent_link_fmodel: {
              type: "boolean",
              description: "ONLY set true after explicit user approval to backup AppSettings.json and write local WW directory + host-provided AesKeys into FModel.",
            },
          },
          output: {
            schema: { type: "object", additionalProperties: true },
            render: (_args, value) => renderJsonBlocks("Stage 0 Preflight Check", value),
          },
          async execute(args = {}, exec) {
            try {
              const cli = ["--step", "0"];
              _pushOpt(cli, "--game-dir", args.game_dir);
              _pushOpt(cli, "--blender", args.blender_path);
              _pushOpt(cli, "--fmodel-dir", args.fmodel_dir);
              _pushOpt(cli, "--keys-file", args.keys_file);
              _pushOpt(cli, "--work-dir", args.work_dir);
              _pushOpt(cli, "--consent-download", args.consent_download);
              if (args.consent_link_fmodel) cli.push("--consent-link-fmodel");
              const { payload } = await runOrchestrator(cli, { signal: exec?.signal, timeoutMs: 300_000 });
              return payload;
            } catch (err) {
              return { status: "FAIL", error: String(err?.message || err) };
            }
          },
        })
      )
    );

    disposers.push(
      sctx.tools.register(
        defineTool({
          name: "dsh_ww_list_characters",
          description:
            "List officially released playable characters mounted in the host machine's local Wuthering Waves client (pauses if local FModel lacks valid keys so host can supply a local .json/.zip key package).",
          parameters: {
            query: {
              type: "string",
              description:
                "Optional character filter (Chinese input matches naming folders across Chinese, lowercase English/Pinyin, and Capitalized/PascalCase variants, e.g. 今汐->Jinxi, 长离->ChangLi, 莉莉->Lili, 琳奈->LinNai; also accepts English/ModelId).",
            },
            keys_file: {
              type: "string",
              description: "Optional path to host-provided local .json or .zip key package.",
            },
            work_dir: { type: "string", description: "Optional workspace directory matching Stage 0." },
          },
          output: {
            schema: { type: "object", additionalProperties: true },
            render: (_args, value) => renderJsonBlocks("Discovered Released Characters", value),
          },
          async execute(args = {}, exec) {
            try {
              const cli = ["--list-characters"];
              _pushOpt(cli, "--query", args.query);
              _pushOpt(cli, "--keys-file", args.keys_file);
              _pushOpt(cli, "--work-dir", args.work_dir);
              const { payload } = await runOrchestrator(cli, { signal: exec?.signal, timeoutMs: 120_000 });
              return payload;
            } catch (err) {
              return { status: "FAIL", error: String(err?.message || err) };
            }
          },
        })
      )
    );

    disposers.push(
      sctx.tools.register(
        defineTool({
          name: "dsh_ww_extract_and_showcase",
          description:
            "Execute full verified stylized showcase & handoff pipeline for a released Wuthering Waves character: local key check -> parsing -> 3-tier texture audit (_N split, _SDF correlation) -> sandboxed Blender stylized toon shader + in-game animation/ribbon/facial shape keys + motion verification + preview renders + Rest-Pose FBX roundtrip -> handoff_manifest.json & Delivery Report.",
          parameters: {
            character: {
              type: "string",
              required: true,
              description:
                "Target released playable character name (e.g. 今汐, 长离, 守岸人, 爱弥斯, 莉莉, Jinxi, Lili, or ModelId).",
            },
            model_path: { type: "string", description: "Optional exact VFS .uasset path for released alternate outfits." },
            anim_names: { type: "string", description: "Optional comma-separated specific animation names." },
            max_anims: { type: "integer", description: "Max animations to assemble (default 6)." },
            keys_file: {
              type: "string",
              description: "Optional host-provided local .json or .zip key package path.",
            },
            consent_link_fmodel: {
              type: "boolean",
              description: "ONLY set true after explicit user approval to backup AppSettings.json and link host-provided keys to local FModel.",
            },
            game_dir: { type: "string", description: "Optional explicit WW directory." },
            blender_path: { type: "string", description: "Optional explicit blender.exe path." },
            fmodel_dir: { type: "string", description: "Optional explicit FModel directory or FModel.exe path." },
            work_dir: { type: "string", description: "Optional workspace output directory." },
          },
          output: {
            schema: { type: "object", additionalProperties: true },
            render: (_args, value) => renderJsonBlocks("WW Stylized Blender Showcase & Handoff", value),
          },
          async execute(args = {}, exec) {
            try {
              const cli = ["--auto"];
              _pushOpt(cli, "--character", args.character ?? "");
              _pushOpt(cli, "--model-path", args.model_path);
              _pushOpt(cli, "--anim-names", args.anim_names);
              if (args.max_anims !== undefined && args.max_anims !== null && args.max_anims !== "") {
                cli.push(`--max-anims=${_clampMaxAnims(args.max_anims)}`);
              } else if (config.maxAnims) {
                cli.push(`--max-anims=${_clampMaxAnims(config.maxAnims)}`);
              }
              _pushOpt(cli, "--keys-file", args.keys_file);
              if (args.consent_link_fmodel) cli.push("--consent-link-fmodel");
              _pushOpt(cli, "--game-dir", args.game_dir);
              _pushOpt(cli, "--blender", args.blender_path);
              _pushOpt(cli, "--fmodel-dir", args.fmodel_dir);
              _pushOpt(cli, "--work-dir", args.work_dir);
              const { payload } = await runOrchestrator(cli, { signal: exec?.signal, timeoutMs: 600_000 });
              return payload;
            } catch (err) {
              return { status: "FAIL", error: String(err?.message || err) };
            }
          },
        })
      )
    );

    disposers.push(
      sctx.tools.register(
        defineTool({
          name: "dsh_ww_verify_delivery",
          description:
            "Verify an existing character deliverable directory (checks showcase .blend, preview PNGs, handoff .fbx, handoff_manifest.json, DELIVERY_REPORT.md, and runs plugin self-audit).",
          parameters: {
            deliverable_dir: {
              type: "string",
              required: true,
              description: "Path to the character deliverable directory containing delivery_summary.json.",
            },
          },
          output: {
            schema: { type: "object", additionalProperties: true },
            render: (_args, value) => renderJsonBlocks("Delivery Cross-Verification", value),
          },
          async execute(args = {}, exec) {
            const rawDir = String(args.deliverable_dir || "");
            if (!rawDir || rawDir.includes("\0")) {
              return { status: "FAIL", deliverable_dir: "", failures: ["Invalid or empty deliverable_dir"] };
            }
            const ddir = path.resolve(rawDir);
            const summaryFile = path.join(ddir, "delivery_summary.json");
            const failures = [];
            let summary = null;
            if (!fs.existsSync(summaryFile)) {
              failures.push(`Missing delivery_summary.json in ${ddir}`);
            } else {
              try {
                summary = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
              } catch (err) {
                failures.push(`Malformed delivery_summary.json: ${String(err?.message || err)}`);
              }
              if (summary && typeof summary === "object") {
                for (const k of ["handoff_manifest_path", "delivery_report_md", "showcase_blend_path", "handoff_fbx_path"]) {
                  const fp = summary[k];
                  if (typeof fp !== "string" || !_isPathInsideDir(fp, ddir)) {
                    failures.push(`Path for ${k} is invalid or outside deliverable_dir: ${fp}`);
                  } else if (!fs.existsSync(fp)) {
                    failures.push(`Missing deliverable file for ${k}: ${fp}`);
                  }
                }
                const previews = Array.isArray(summary.preview_renders) ? summary.preview_renders : [];
                if (previews.length === 0) failures.push("No preview renders listed.");
                for (const p of previews) {
                  if (typeof p !== "string" || !_isPathInsideDir(p, ddir)) {
                    failures.push(`Preview PNG path is invalid or outside deliverable_dir: ${p}`);
                  } else if (!fs.existsSync(p) || fs.statSync(p).size < 2000) {
                    failures.push(`Missing or tiny preview PNG: ${p}`);
                  }
                }
              }
            }
            const { payload: audit } = await runOrchestrator(["--self-audit"], { signal: exec?.signal, timeoutMs: 60_000 });
            if (audit.status !== "PASS") {
              failures.push(`Self-audit failed: ${JSON.stringify(audit.failures)}`);
            }
            return {
              status: failures.length === 0 ? "PASS" : "FAIL",
              deliverable_dir: ddir,
              failures,
              delivery_summary: summary,
              self_audit: audit,
            };
          },
        })
      )
    );

    return () => {
      for (const d of disposers) {
        if (typeof d === "function") d();
      }
    };
  };

  if (typeof ctx.inject === "function") {
    ctx.inject(["tools"], registerToolsOn);
  } else if (ctx.tools && typeof ctx.tools.register === "function") {
    registerToolsOn(ctx);
  }
}
