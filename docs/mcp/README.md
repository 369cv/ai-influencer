# MCP — Index

| Doc | Type | Summary |
|---|---|---|
| [blueprint-teardown.md](blueprint-teardown.md) | knowledge | How Blueprint's MCP is designed: free vs paid tiers, preview→start, idempotency, reserve→commit credits, server-explained metrics, plugin layer |
| [build-playbook.md](build-playbook.md) | workflow + rules | Step-by-step for building a remote MCP server for any platform, invariants R1–R9, protocol minimum, the OAuth path to a connector URL, production checklist |
| [connect.md](connect.md) | how-to | Connector URL, tool list, and how to connect Claude Code / claude.ai / curl to this repo's server |
| [`.claude/skills/build-mcp-server/`](../../.claude/skills/build-mcp-server/SKILL.md) | skill | Reusable skill: tells Claude how to build an MCP server following the playbook |
| [`lib/mcp/`](../../lib/mcp/) | tool (code) | Reference implementation: protocol core, tool registry, validator, Higgsfield gateway |
| [`scripts/mcp-smoke.mjs`](../../scripts/mcp-smoke.mjs) | tool (test) | 15 protocol and safety-rail checks, run in-process or over HTTP |

**Graph edges:** teardown → informs → playbook → implemented-by → `lib/mcp/` → used-by → connect · skill → points-to → playbook + `lib/mcp/`
