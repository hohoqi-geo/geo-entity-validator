#!/usr/bin/env node
// geo-entity-validator — checks a public site for machine-readable entity signals.
// Read-only: fetches robots.txt, /llms.txt and the homepage. No data is sent anywhere else.
const target = process.argv[2];
if (!target) { console.error("Usage: npx tsx src/validator.ts https://example.com"); process.exit(1); }
const base = new URL(target.startsWith("http") ? target : `https://${target}`).origin;
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended"];

async function get(path: string): Promise<{ status: number; text: string }> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
  try { const r = await fetch(base + path, { signal: ctl.signal, redirect: "follow" }); return { status: r.status, text: r.ok ? await r.text() : "" }; }
  catch { return { status: 0, text: "" }; } finally { clearTimeout(t); }
}

// Simplified RFC 9309 group matching: a bot counts as "blocked" only if its group has "Disallow: /" and no Allow rules.
function blockedBots(robots: string): string[] {
  const groups: { agents: string[]; rules: string[] }[] = []; let cur: { agents: string[]; rules: string[] } | null = null;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim(); const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") { if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); }
    else if (cur && (k === "disallow" || k === "allow")) cur.rules.push(`${k}:${v}`);
  }
  return AI_BOTS.filter((b) => { const g = groups.find((x) => x.agents.includes(b.toLowerCase())) ?? groups.find((x) => x.agents.includes("*")); return !!g?.rules.includes("disallow:/") && !g.rules.some((r) => r.startsWith("allow:/")); });
}

function jsonLdTypes(html: string): { types: string[]; sameAs: number; errors: number } {
  const types: string[] = []; let sameAs = 0, errors = 0;
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n: any): void => { if (Array.isArray(n)) return n.forEach(walk); if (n && typeof n === "object") {
        if (n["@type"]) types.push(...[].concat(n["@type"])); if (n.sameAs) sameAs += [].concat(n.sameAs).length; Object.values(n).forEach(walk); } };
      walk(JSON.parse(m[1]));
    } catch { errors++; }
  }
  return { types: [...new Set(types)], sameAs, errors };
}

const [robots, llms, home] = await Promise.all([get("/robots.txt"), get("/llms.txt"), get("/")]);
const ld = jsonLdTypes(home.text);
const llmsOk = llms.status === 200 && /^#\s+\S/m.test(llms.text);
const report = {
  site: base,
  robots: { status: robots.status, blockedAiBots: robots.status === 200 ? blockedBots(robots.text) : [] },
  llmsTxt: { status: llms.status, hasH1Title: llmsOk },
  jsonLd: { types: ld.types, hasOrganization: ld.types.some((t) => /Organization|LocalBusiness|Corporation/.test(t)), sameAsLinks: ld.sameAs, parseErrors: ld.errors },
  note: "Signals only. Passing these checks does not guarantee any AI mention or ranking.",
};
console.log(JSON.stringify(report, null, 2));
