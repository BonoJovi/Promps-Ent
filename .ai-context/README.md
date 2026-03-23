# AI Context Directory - Optimized for Token Efficiency

**Last Updated**: 2025-12-15
**Purpose**: Hierarchical AI context with lazy loading and shared submodule

---

## Token Optimization Strategy

**Problem**: Previous structure loaded ~8,400 lines (~9% token budget) at session startup.

**Solution**: 3-tier architecture with lazy loading + shared submodule.

**Result**: < 100 lines loaded at startup (~2-3% token budget).

---

## Directory Structure

```
.ai-context/
├── ESSENTIAL.md                    # [Tier 1] Always loaded (< 100 lines)
│
├── context/                        # [Tier 2] Project-specific context
│   ├── coding/
│   │   ├── CONVENTIONS.md          # Coding standards
│   │   ├── TESTING.md              # Testing strategy
│   │   └── API_STABILITY.md        # API change policy
│   │
│   ├── architecture/
│   │   ├── PROJECT_STRUCTURE.md    # Module organization
│   │   └── TAURI.md                # Tauri framework
│   │
│   └── workflows/
│       ├── BRANCHING.md            # Branching strategy
│       ├── RELEASE.md              # Release process
│       └── I18N.md                 # i18n management
│
├── shared/                         # [Submodule] Shared across projects
│   ├── developer/
│   │   └── YOSHIHIRO_NAKAHARA_PROFILE.md
│   ├── analytics/
│   │   └── SEO_Keywords_Tracking.md
│   ├── methodology/
│   │   ├── AI_COLLABORATION.md
│   │   ├── DESIGN_PHILOSOPHY.md
│   │   └── SCALE_ARCHITECTURE.md
│   ├── insights/
│   │   └── ... (9 insight documents)
│   ├── workflows/
│   │   ├── DOCUMENTATION_CREATION.md
│   │   └── GITHUB_PROJECTS.md
│   └── README.md
│
├── knowledge/
│   └── archive/
│       └── QUICK_REFERENCE.md      # Historical reference
│
└── README.md                       # This file
```

---

## Shared Submodule

The `shared/` directory is a Git submodule pointing to:
**https://github.com/BonoJovi/ai-context-shared**

### Why Submodule?

- **Single source of truth**: Common files managed in one place
- **Cross-project consistency**: KakeiBonByRust and Promps share the same context
- **Easy updates**: `git submodule update --remote` syncs all projects

### Submodule Commands

```bash
# Update to latest shared context
git submodule update --remote

# Clone project with submodules
git clone --recurse-submodules <repo-url>

# Initialize submodules after clone
git submodule init && git submodule update
```

---

## Usage Guidelines for AI

### Session Startup (Automatic)
- **ESSENTIAL.md** is loaded automatically via CLAUDE.md
- Contains: Current phase, critical rules, quick references
- Size: < 100 lines (token-efficient)

### When Coding
Load as needed:
- `@.ai-context/context/coding/CONVENTIONS.md` - Coding standards
- `@.ai-context/context/coding/TESTING.md` - Testing approach
- `@.ai-context/context/coding/API_STABILITY.md` - API change rules

### When Designing
Load as needed:
- `@.ai-context/context/architecture/PROJECT_STRUCTURE.md`
- `@.ai-context/context/architecture/TAURI.md`

### When Managing Workflows
Load as needed:
- `@.ai-context/context/workflows/BRANCHING.md` - Git workflow
- `@.ai-context/context/workflows/RELEASE.md` - Release procedure
- `@.ai-context/shared/workflows/DOCUMENTATION_CREATION.md` - Doc creation

### When Understanding "Why"
Load from shared (rare):
- `@.ai-context/shared/methodology/AI_COLLABORATION.md`
- `@.ai-context/shared/methodology/DESIGN_PHILOSOPHY.md`
- `@.ai-context/shared/insights/`

---

## File Size Reference

### Tier 2: Project-Specific Context
| File | Approx Lines | Load When |
|------|-------------|-----------|
| CONVENTIONS.md | ~870 | Implementing code |
| TESTING.md | ~280 | Writing tests |
| API_STABILITY.md | ~330 | Modifying APIs |
| PROJECT_STRUCTURE.md | ~320 | Understanding modules |
| TAURI.md | ~55 | Tauri-specific tasks |
| BRANCHING.md | ~310 | Git operations |
| RELEASE.md | ~220 | Creating releases |
| I18N.md | ~280 | Localization tasks |

### Shared Context (Submodule)
| File | Approx Lines | Load When |
|------|-------------|-----------|
| YOSHIHIRO_NAKAHARA_PROFILE.md | ~275 | Career context |
| SEO_Keywords_Tracking.md | ~230 | SEO strategy |
| AI_COLLABORATION.md | ~1,690 | Understanding methodology |
| DESIGN_PHILOSOPHY.md | ~950 | Understanding architecture |
| DOCUMENTATION_CREATION.md | ~650 | Creating documentation |

---

## Migration Notes

### 2025-12-15 - Submodule Migration
- Created `ai-context-shared` repository
- Moved common files to shared submodule:
  - developer/, analytics/, methodology/, insights/
  - workflows/DOCUMENTATION_CREATION.md, GITHUB_PROJECTS.md
- Updated all references to use `shared/` path
- Project-specific files remain in `context/`

### 2025-12-09 - Initial Structure
- Created 3-tier structure (was 2-tier)
- Moved ~8,400 lines from "always load" to "load on demand"

---

**This structure ensures AI assistants can efficiently access the right information at the right time, with minimal token overhead and cross-project consistency.**
