# geo-entity-validator

A small, read-only command-line checker for three machine-readable signals that generative search engines can use when reading a website:

1. **AI crawler access** — parses `robots.txt` (simplified RFC 9309 group matching) for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot and Google-Extended.
2. **`/llms.txt`** — checks that the file exists and starts with an H1 title, per the community proposal at llmstxt.org (not a universal AI standard).
3. **Schema.org JSON-LD** — lists entity types, counts `sameAs` links and reports parse errors.

```bash
npm install
npm run check -- https://example.com
```

## Boundaries
- Fetches only three public URLs; sends nothing to third parties; no login, no crawling.
- Passing every check **does not** guarantee mentions, citations or rankings in any AI assistant. Google states its AI features need no special Schema or AI text files.

## References
- Koster et al. (2022). Robots Exclusion Protocol. IETF RFC 9309. doi:10.17487/RFC9309
- Aggarwal et al. (2024). GEO: Generative Engine Optimization. KDD '24. arXiv:2311.09735
- Schema.org vocabulary · llms.txt proposal (llmstxt.org)

## About
Extracted from **GEO Audit Sentinel**, the author's proprietary GEO audit system. Full audits (real AI answers, verbatim evidence with SHA-256 fingerprints): https://geo-audit.co

License: MIT
