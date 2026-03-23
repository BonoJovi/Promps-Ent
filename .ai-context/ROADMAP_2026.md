# Promps Ent Roadmap 2026

**Created**: 2026-02-03
**Purpose**: Development plan and business strategy for Promps Ent

---

## Current Status

**Version**: v1.4.0 Ent (Released 2026-02-05)
**Tests**: 647 (176 backend + 471 frontend) - 100% passing

### v1.4.0 Ent Features (Complete)

**Core**:
- Visual block editing (Blockly.js)
- Grammar validation (6 rules, JP/EN)
- AutoFix, 7 pattern templates
- Project save/load (.promps format)
- i18n (Japanese/English)
- Light/Dark mode

**Pro Features (Synced)**:
- Undo/Redo
- API key management (OpenAI, Anthropic, Google AI)
- Direct AI send
- Export (TXT/Markdown/JSON)
- Tags & search, Project sidebar
- Block templates (macros)
- Block Favorites & Floating Palette

**Ent-Exclusive**:
- AI Import Hub (morpheme analysis → Blockly blocks)
- Color Theme Customization (Light/Dark/Custom)

---

## Development Roadmap

### v1.x Series (Customization & Security)

| Version | Content | Status | Priority |
|---------|---------|--------|----------|
| **v1.4.0 Ent** | Color Theme Customization + Code Consistency | ✅ Released | - |
| **v1.5.0+** | Input Validation & Limits (50/100 block warnings) | Planned | High |
| **v1.6.0+** | Custom Block Creation (user-defined blocks) | Planned | Medium |
| **v1.7.0+** | Remaining features (flexible) | Planned | Low |

**v1.5.0+ Candidates**:
- Version Control (project history)
- Quality Score
- Custom Grammar Rules
- i18n language expansion (Chinese, Korean, etc.)

### v2.0.0 (Network & AI Enhancement)

| Feature | Notes |
|---------|-------|
| Multi-AI Comparison | Side-by-side AI responses (cost/environment adjustment needed) |
| Cloud Sync | **Google Drive + OneDrive only** (Dropbox excluded due to service concerns) |
| Network Sharing | Project sharing |
| Network Collaboration | Real-time co-editing |

**Decisions**:
- Self-hosted BaaS: **Excluded** (too risky for solo project)
- Dropbox: **Excluded** (service degradation, user exodus)
- v2.0.0 scope: **Fixed** (no additional features beyond this list)

---

## Business Plan

### Timeline

```
v1.1.0 → v1.2.0 → v1.3.0 (2-3 days estimate)
     ↓
promps.org launch
     ↓
License sales start (buy-once + subscription SIMULTANEOUSLY)
```

### Pricing Structure

| Plan | Price | Notes |
|------|-------|-------|
| Free | ¥0 | Core features |
| Pro | ¥2,000〜3,000/month | Editing + AI features |
| Enterprise | ¥5,000〜7,000/month | Full features |

**Key Decision**: Buy-once and subscription must launch together
- Reason: Starting with buy-once first creates psychological barrier to subscription migration

### Payment Infrastructure

| Component | Service |
|-----------|---------|
| Payment | Paddle (MoR, tax handling automated) |
| License Server | **Cloudflare Workers + D1** (free tier) |
| API Authentication | Cloudflare Workers |

---

## License Authentication Architecture

### Why REST (not P2P)

| Aspect | REST | P2P |
|--------|------|-----|
| Complexity | Low | High (NAT traversal) |
| Security | HTTPS standard | Complex |
| Central management | Easy | Difficult |
| Firewall | No issues | Problematic |
| License revocation | Instant on server | Complex propagation |

**Decision**: REST API for license authentication

### Cloudflare Stack (Free Tier)

| Service | Purpose | Free Quota |
|---------|---------|------------|
| Workers | REST API | 100K requests/day |
| D1 | License DB (SQLite) | 5GB, 5M reads/day |
| KV | Cache/Session | 100K reads/day |

**Benefits**:
- No Sakura VPS needed → Cost reduction
- Global edge → Low latency
- Auto-scaling → No management
- DDoS protection → Built-in

### API Design

```
POST /api/v1/license/validate
Request:
{
  "license_key": "PENT-XXXX-XXXX-XXXX",
  "email": "user@example.com",
  "machine_id": "hashed_machine_identifier"
}

Response:
{
  "valid": true,
  "plan": "enterprise",
  "expires_at": "2027-02-03T00:00:00Z"
}
```

---

## Implementation Strategy

### Parallel Tracks

| Track | Content |
|-------|---------|
| **Auth Server** | Cloudflare Workers + D1 + Paddle Webhook |
| **Promps Ent** | v1.1.0 → v1.2.0 → v1.3.0 |

### Existing Assets (Promps Ent)

| Component | Status | Purpose |
|-----------|--------|---------|
| `reqwest` | Installed | HTTP client for auth requests |
| `license.rs` | Exists | Extend for network auth |
| `license.js` | Exists | UI integration |

---

## Flexibility Notes

**Pro/Ent Feature Balance**:
- Pro and Ent may have feature count disparity
- Some features may be moved between grades as needed
- Approach: Flexible adjustment based on implementation progress

---

## Excluded Features

| Feature | Reason |
|---------|--------|
| Self-hosted BaaS | Too risky for solo project |
| Dropbox integration | Service degradation, unclear future |
| Team sharing (v1.x) | Depends on Cloud Sync (v2.0.0) |

---

## Document References

| Document | Location |
|----------|----------|
| Feature Matrix | `docs/shared/pricing/PRICING_AND_FEATURES.md` |
| Essential Context | `.ai-context/ESSENTIAL.md` |
| API Stability | `.ai-context/context/coding/API_STABILITY.md` |
| Testing Strategy | `.ai-context/context/coding/TESTING.md` |

---

**Last Updated**: 2026-02-05
