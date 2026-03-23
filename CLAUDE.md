# Promps Project Context

This file automatically loads **minimal** project context at the start of each Claude Code session.

**Token Optimization**: Only essential information is loaded by default. Load additional contexts as needed using `@` references.

---

## Always Load (Essential Context Only)

### Essential Information - Current Status & Critical Rules
@.ai-context/ESSENTIAL.md

---

## Load When Needed (On-Demand Contexts)

### Project-Specific Context

**For Coding Tasks**:
- Conventions: `@.ai-context/context/coding/CONVENTIONS_OVERVIEW.md`
- Conventions (detailed): `@.ai-context/context/coding/archive/CONVENTIONS_DETAILED.md`
- Testing Strategy: `@.ai-context/context/coding/TESTING.md`
- API Stability: `@.ai-context/context/coding/API_STABILITY.md`

**For Architecture Tasks**:
- Project Structure: `@.ai-context/context/architecture/PROJECT_STRUCTURE.md`
- Tauri Integration: `@.ai-context/context/architecture/TAURI.md`

**For Workflow Tasks**:
- Branching Strategy: `@.ai-context/context/workflows/BRANCHING.md`
- Release Process: `@.ai-context/context/workflows/RELEASE.md`
- i18n Management: `@.ai-context/context/workflows/I18N.md`

### Shared Context (via submodule)

**For Understanding Methodology** (rarely needed):
- AI Collaboration: `@.ai-context/shared/methodology/AI_COLLABORATION.md`
- Design Philosophy: `@.ai-context/shared/methodology/DESIGN_PHILOSOPHY.md`
- Scale & Architecture: `@.ai-context/shared/methodology/SCALE_ARCHITECTURE.md`

**Common Workflows**:
- Documentation Creation: `@.ai-context/shared/workflows/DOCUMENTATION_CREATION.md`
- GitHub Projects: `@.ai-context/shared/workflows/GITHUB_PROJECTS.md`

**Developer Profile** (for career/context reference):
- `@.ai-context/shared/developer/YOSHIHIRO_NAKAHARA_PROFILE.md`

**Analytics** (SEO tracking across all projects):
- `@.ai-context/shared/analytics/SEO_Keywords_Tracking.md`

**Insights** (optional reading):
- `@.ai-context/shared/insights/` - Various architectural and development insights

---

## Submodule Management

The `shared/` directory is a Git submodule pointing to:
https://github.com/BonoJovi/ai-context-shared

**Update shared context**:
```bash
git submodule update --remote
```

---

**Performance Note**: This configuration loads < 100 lines at session startup (vs. ~4,000+ lines previously). This reduces initial token usage from ~9% to ~2-3%.
