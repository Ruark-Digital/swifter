// Triage responsive audit findings.jsonl → RESPONSIVE-AUDIT.md
// - Clusters by (surfaceFamily, symptom, route)
// - Severity: P0 (page-level overflow > 50% of width OR fixed offscreen)
//             P1 (overflow offender > viewport+50px OR table without scroll wrapper)
//             P2 (small overflow, cosmetic)
// - Attempts file:line attribution by grepping distinctive className substrings against src/.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = process.cwd();
const FINDINGS = resolve(ROOT, ".qa/reports/responsive/findings.jsonl");
const OUT = resolve(ROOT, ".planning/quick/260529-responsive-audit/RESPONSIVE-AUDIT.md");

const SRC = resolve(ROOT, "src");

// --- 1. Load findings ----------------------------------------------------
const lines = readFileSync(FINDINGS, "utf8").split("\n").filter(Boolean);
const findings = lines.map((l) => JSON.parse(l));

// --- 2. Family classification -------------------------------------------
function surfaceFamily(f) {
  const r = f.routeKey || "";
  const path = f.routePath || "";
  if (r === "login" || /privacy|terms|disclaimer|contact|onboarding|forgot/.test(path)) return "auth-and-marketing";
  if (f.kind === "tab") return "detail-tabs";
  if (["dashboard", "profile"].includes(r)) return "shell-and-dashboards";
  if (["projects", "contracts", "msa", "vendor", "solicitation"].includes(r)) return "lists-and-dashboards";
  return "other";
}

// --- 3. Severity + symptom ----------------------------------------------
function classify(f) {
  const sig = f.signals || {};
  const vw = f.width;
  const offenders = sig.offenders || [];
  const tablesNoWrap = sig.tablesNoScrollWrapper || [];
  const fixedOff = sig.fixedOffscreen || [];

  const issues = [];

  // Page-level overflow
  if (sig.bodyScroll) issues.push({ sev: "P0", sym: "body horizontal scroll", evidence: `htmlScrollWidth=${sig.htmlScrollWidth} vp=${vw}` });

  // Clipped content (content origin far right of viewport)
  const bigClip = offenders.find((o) => o.rect.x > vw * 0.3 && o.rect.w > vw * 0.6);
  if (bigClip) {
    issues.push({
      sev: "P0",
      sym: "main content clipped — desktop sidebar/layout at narrow viewport",
      offender: bigClip,
      evidence: `rect x=${bigClip.rect.x} w=${bigClip.rect.w} vp=${vw}`,
    });
  }

  // Fixed positioned element off-screen
  if (fixedOff.length) {
    const f0 = fixedOff[0];
    issues.push({ sev: "P0", sym: "fixed element off-screen (modal/drawer/header)", offender: f0, evidence: `rect=${JSON.stringify(f0.rect)}` });
  }

  // Wide overflowing element (not main content)
  const wide = offenders.find((o) => o.rect.w > vw + 50 && o !== bigClip);
  if (wide) {
    issues.push({ sev: "P1", sym: "element wider than viewport", offender: wide, evidence: `rect w=${wide.rect.w} vp=${vw}` });
  }

  // Tables without scroll wrapper at narrow widths
  if (tablesNoWrap.length) {
    issues.push({ sev: "P1", sym: `${tablesNoWrap.length} table(s) without horizontal-scroll wrapper`, offender: { className: tablesNoWrap[0].className }, evidence: `w=${tablesNoWrap[0].rect.w}` });
  }

  // Smaller overflowers — cosmetic
  const cosmetic = offenders.filter((o) => o.rect.w > vw + 4 && o.rect.w <= vw + 50);
  if (cosmetic.length && !issues.length) {
    issues.push({ sev: "P2", sym: "minor overflow (within 50px of viewport)", offender: cosmetic[0], evidence: `rect w=${cosmetic[0].rect.w} vp=${vw}` });
  }

  return issues;
}

// --- 4. Build className → file:line grep index -------------------------
//   Walk src/ once, build map of "distinctive class fragment" -> [files...]
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(e)) out.push(p);
  }
  return out;
}

const SRC_FILES = walk(SRC);

const fileContents = new Map();
function load(p) {
  if (!fileContents.has(p)) fileContents.set(p, readFileSync(p, "utf8"));
  return fileContents.get(p);
}

function attribute(offender) {
  if (!offender) return null;
  const candidates = [];
  if (offender.testid) candidates.push(offender.testid);
  if (offender.id) candidates.push(offender.id);
  const cls = offender.className || "";
  // pull a few distinctive class fragments
  const fragments = cls
    .split(/\s+/)
    .filter((c) => c.length > 12 && !/^(text-|bg-|dark:|hover:|focus:|p-|m-|w-|h-|gap-|flex|grid|items-|justify-)/.test(c))
    .slice(0, 3);
  candidates.push(...fragments);
  // last resort: look for arbitrary value classes
  const arbitrary = cls.match(/\[calc\([^\]]+\)\]/g) || [];
  candidates.push(...arbitrary);

  for (const c of candidates) {
    for (const f of SRC_FILES) {
      const txt = load(f);
      const idx = txt.indexOf(c);
      if (idx >= 0) {
        const line = txt.slice(0, idx).split("\n").length;
        return `${f.replace(ROOT + "\\", "").replace(/\\/g, "/")}:${line}`;
      }
    }
  }
  return null;
}

// --- 5. Cluster ---------------------------------------------------------
const rows = [];
for (const f of findings) {
  const fam = surfaceFamily(f);
  const issues = classify(f);
  for (const issue of issues) {
    rows.push({
      role: f.role,
      viewport: f.viewport,
      width: f.width,
      family: fam,
      route: f.routeKey || f.routePath,
      label: f.label,
      kind: f.kind,
      sev: issue.sev,
      sym: issue.sym,
      evidence: issue.evidence,
      file: attribute(issue.offender),
      shot: f.screenshot,
    });
  }
}

// Dedupe identical (family, route, viewport, sym) — keep first
const seen = new Set();
const uniqueRows = [];
for (const r of rows) {
  const k = `${r.family}|${r.route}|${r.viewport}|${r.sev}|${r.sym}`;
  if (seen.has(k)) continue;
  seen.add(k);
  uniqueRows.push(r);
}

// --- 6. Summary counts --------------------------------------------------
const bySev = { P0: 0, P1: 0, P2: 0 };
const byFamSev = {};
for (const r of uniqueRows) {
  bySev[r.sev]++;
  byFamSev[r.family] = byFamSev[r.family] || { P0: 0, P1: 0, P2: 0 };
  byFamSev[r.family][r.sev]++;
}

// --- 7. Emit markdown ---------------------------------------------------
const sevOrder = { P0: 0, P1: 1, P2: 2 };
uniqueRows.sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev] || a.family.localeCompare(b.family) || a.route.localeCompare(b.route));

let md = `# Responsive Audit — Findings\n\n`;
md += `_Generated: ${new Date().toISOString()} from \`.qa/reports/responsive/findings.jsonl\` (${findings.length} captures, ${uniqueRows.length} unique findings)._\n\n`;

md += `## Summary\n\n`;
md += `| Severity | Count |\n|---|---|\n`;
for (const s of ["P0", "P1", "P2"]) md += `| ${s} | ${bySev[s]} |\n`;
md += `\n`;

md += `### By surface family\n\n`;
md += `| Family | P0 | P1 | P2 |\n|---|---|---|---|\n`;
for (const fam of Object.keys(byFamSev).sort()) {
  const c = byFamSev[fam];
  md += `| ${fam} | ${c.P0} | ${c.P1} | ${c.P2} |\n`;
}
md += `\n`;

md += `## Severity rubric\n\n`;
md += `- **P0** — page unusable: body horizontal scroll, main content clipped off-viewport, fixed element off-screen.\n`;
md += `- **P1** — degraded: element wider than viewport, table without horizontal-scroll wrapper at narrow widths.\n`;
md += `- **P2** — cosmetic: minor overflow within 50px of viewport edge.\n\n`;

md += `## Findings\n\n`;
md += `| # | Sev | Family | Route / Tab | Viewport | Role | Symptom | Suspected file:line | Screenshot |\n`;
md += `|---|---|---|---|---|---|---|---|---|\n`;
uniqueRows.forEach((r, i) => {
  const tab = r.kind === "tab" ? r.label.replace(/^tab-/, "") : "";
  const where = tab ? `${r.route} → ${tab}` : r.route;
  md += `| ${i + 1} | ${r.sev} | ${r.family} | ${where} | ${r.viewport} (${r.width}px) | ${r.role} | ${r.sym} | ${r.file ?? "—"} | \`${r.shot}\` |\n`;
});

// --- 8. Surface-family breakdown ----------------------------------------
md += `\n## Surface-family breakdown\n\n`;
const families = Object.keys(byFamSev).sort((a, b) => (byFamSev[b].P0 + byFamSev[b].P1) - (byFamSev[a].P0 + byFamSev[a].P1));
for (const fam of families) {
  const c = byFamSev[fam];
  if (c.P0 + c.P1 + c.P2 === 0) continue;
  md += `### ${fam}\n\n`;
  md += `P0: **${c.P0}**, P1: **${c.P1}**, P2: **${c.P2}**\n\n`;
  const top = uniqueRows.filter((r) => r.family === fam && r.sev !== "P2").slice(0, 10);
  if (top.length) {
    md += `Top offenders:\n\n`;
    for (const r of top) {
      md += `- **${r.sev}** \`${r.route}${r.kind === "tab" ? " → " + r.label.replace(/^tab-/, "") : ""}\` @ ${r.viewport}: ${r.sym}${r.file ? ` (${r.file})` : ""}\n`;
    }
    md += `\n`;
  }
  md += `Suggested follow-up: \`260530-responsive-${fam}\` — sized from above, expect ${c.P0 + c.P1} P0/P1 fixes.\n\n`;
}

md += `## Known traps to verify during fixes\n\n`;
md += `- [[button-inline-flex-whitespace-nowrap-overflow]] — long content in shadcn Button trigger forces horizontal scroll on parent dialog.\n`;
md += `- [[radix-tabs-force-mount-trap]] — \`forceMount\` keeps tab panels in DOM; can leak as stray empty section on narrow widths.\n`;
md += `- [[fileinput-dropzone-dark-mode-pattern]] — FileInput overrides often regress; check at every viewport after dark-mode style edits.\n`;
md += `- [[react-baseline-warnings-260528]] — console errors counted here include baseline noise (validation HOC prop spreading); not all are responsive issues.\n\n`;

md += `## Non-fixes that look like fixes\n\n`;
md += `- Adding \`overflow-x: hidden\` on \`<body>\` will silence P0 \"body scroll\" but **hide** clipped content. Fix the layout root instead.\n`;
md += `- Wrapping every table in \`overflow-x-auto\` solves P1 but yields a terrible mobile UX; prefer card-view per [[plan: detail-tabs]] but only after P0s clear.\n`;

writeFileSync(OUT, md);
console.log(`Wrote ${OUT}`);
console.log(`P0=${bySev.P0} P1=${bySev.P1} P2=${bySev.P2} (unique rows=${uniqueRows.length})`);
