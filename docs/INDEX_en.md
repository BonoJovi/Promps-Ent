# Promps Documentation

**Version**: v0.0.3-2 (Phase 3-First Half)
**Last Updated**: 2026-01-19 (JST)

---

## Welcome to Promps Documentation

This directory contains technical documentation for **Promps Phase 0**, the foundational DSL parsing and prompt generation engine.

---

## Documentation Index

### For New Users

**Start Here**: [Project README](../README.md)
- Quick overview of Promps
- Installation instructions
- Basic usage examples

---

### For Developers

**Core Functionality**:
- **[CORE_FEATURES.md](./developer/en/guides/CORE_FEATURES.md)** - Comprehensive feature documentation
  - Data structures (`PromptPart`)
  - Parsing engine details
  - Prompt generation algorithm
  - Design rationale
  - Testing strategy
  - Usage examples

**API Documentation**:
- **[API_REFERENCE.md](./developer/en/api/API_REFERENCE.md)** - Complete API reference
  - Public functions (`parse_input`, `generate_prompt`)
  - Tauri commands
  - Data types
  - Usage patterns
  - Performance characteristics
  - Migration guides

**Architecture**:
- **[ARCHITECTURE.md](./design/ARCHITECTURE_en.md)** - System architecture
  - High-level design
  - Module structure
  - Data flow
  - Design decisions
  - Evolution path
  - Deployment architecture

---

## Document Structure

Each documentation file follows a consistent structure:

1. **Overview**: High-level summary
2. **Core Content**: Detailed information
3. **Examples**: Practical usage examples
4. **Reference**: Technical specifications
5. **Appendix**: Supporting information

---

## Documentation Standards

### Versioning

All documentation includes:
- **Version**: Phase identifier (e.g., Phase 0, Phase 1)
- **Last Updated**: ISO date (YYYY-MM-DD)
- **Next Review**: When to review for updates

### Audience Targeting

Documentation is written for specific audiences:
- **Users**: README.md, usage guides
- **Developers**: API reference, architecture docs

### Maintenance Policy

Documentation is updated:
- **When**: Before each phase transition
- **Who**: Primary developer + AI assistants
- **How**: Version control (Git), review before merge

---

## Quick Reference

### Key Concepts

| Concept | Description | Document |
|---------|-------------|----------|
| `_N:` Prefix | AST-like type annotation for nouns | CORE_FEATURES.md, ARCHITECTURE.md |
| PromptPart | Core data structure (token + type) | CORE_FEATURES.md, API_REFERENCE.md |
| Token-Level Detection | Individual marker for each noun | CORE_FEATURES.md, ARCHITECTURE.md |
| Compiler Analogy | Architecture mirrors compiler pipeline | ARCHITECTURE.md |

---

### Common Tasks

| Task | Document | Section |
|------|----------|---------|
| Understanding core features | CORE_FEATURES.md | Core Components |
| Using public API | API_REFERENCE.md | Public Functions |
| Integrating with Tauri | API_REFERENCE.md | Tauri Commands |
| Understanding design decisions | ARCHITECTURE.md | Design Decisions |
| Running tests | CORE_FEATURES.md | Testing |

---

## Frequently Asked Questions

### Why `_N:` prefix instead of automatic detection?

**Short Answer**: Reliability and simplicity.

**Detailed Answer**: See CORE_FEATURES.md "Design Rationale - Why _N: Prefix?"

**Key Points**:
- Guarantees noun identification (no inference needed)
- Foundation for future AST-based validation (Phase N)
- User experience: Manual in Phase 0 (CLI), automatic in Phase 1+ (GUI blocks)

---

### Why token-level noun detection?

**Short Answer**: To mark each noun individually.

**Detailed Answer**: See ARCHITECTURE.md "Decision 2: Token-Level Noun Detection"

**Key Points**:
- Explicit `(NOUN)` marker for each noun
- Natural handling of complex sentences ("_N:タコ と _N:イカ を 食べる")
- AI can clearly understand noun boundaries
- Evolution planned with part-of-speech blocks in Phase N+1

---

### Why no error handling in Phase 0?

**Short Answer**: Deferred to Phase N (logic check).

**Detailed Answer**: See ARCHITECTURE.md "Decision 4: No Error Handling in Phase 0"

**Key Points**:
- Phase 0 goal: Establish core functionality
- Validation requires AST-based pattern matching (Phase N)
- Reduces complexity without sacrificing future extensibility

---

### Why no file I/O in Phase 0?

**Short Answer**: YAGNI (You Aren't Gonna Need It).

**Detailed Answer**: See ARCHITECTURE.md "Decision 5: No File I/O in Phase 0"

**Key Points**:
- Avoid schema changes during rapid development
- Implement once when block types are finalized (Phase N+1)
- Prevents premature design lock-in

---

## Version History

### Phase 0 (2025-11-25)

**Initial Release**:
- CORE_FEATURES.md created
- API_REFERENCE.md created
- ARCHITECTURE.md created
- README.md (this file) created

**Coverage**:
- Core library functionality
- Tauri integration
- Design decisions
- Testing strategy

---

## Next Steps

### Phase 1 Documentation (Planned)

**New Documents**:
- BLOCKLY_INTEGRATION.md (Blockly.js integration guide)
- GUI_ARCHITECTURE.md (Frontend architecture)
- BLOCK_TYPES.md (Custom block definitions)

**Updated Documents**:
- API_REFERENCE.md (new Tauri commands)
- ARCHITECTURE.md (GUI data flow)

---

### Phase N Documentation (Planned)

**New Documents**:
- LOGIC_CHECK.md (AST-based validation)
- PATTERN_REFERENCE.md (Grammatical patterns)
- ERROR_HANDLING.md (Error types and handling)

**Updated Documents**:
- API_REFERENCE.md (error types, new signatures)
- CORE_FEATURES.md (validation features)

---

## Contributing to Documentation

### Guidelines

1. **Clarity**: Write for the target audience (users, developers)
2. **Examples**: Include practical code examples
3. **Consistency**: Follow existing document structure
4. **Versioning**: Update version and date on changes
5. **Cross-references**: Link to related documents

### Process

1. Identify documentation gap or outdated content
2. Create/update document in appropriate `docs/` subdirectory
3. Update this INDEX_en.md if new document added
4. Review for clarity and accuracy
5. Commit with descriptive message (e.g., "docs: add BLOCKLY_INTEGRATION.md")

---

## Documentation Tools

### Viewing Documentation

**Markdown Viewers**:
- GitHub web interface (automatic rendering)
- VSCode (built-in Markdown preview)
- Obsidian (Markdown knowledge base)
- Typora (WYSIWYG Markdown editor)

**Command Line**:
```bash
# View in terminal (basic)
cat docs/CORE_FEATURES.md

# View with formatting (if installed)
glow docs/CORE_FEATURES.md
```

### Searching Documentation

**grep** (command line):
```bash
# Search all docs for "PromptPart"
grep -r "PromptPart" docs/

# Search with context (3 lines before/after)
grep -C 3 "parse_input" docs/API_REFERENCE.md
```

**VSCode** (GUI):
- Ctrl+Shift+F (search in workspace)
- Filter: `docs/**/*.md`

---

## External Resources

### Related Technologies

- **Rust Language**: https://www.rust-lang.org/
- **Tauri Framework**: https://tauri.app/
- **Blockly.js** (Phase 1): https://developers.google.com/blockly

### Community

- **Issues**: https://github.com/BonoJovi/Promps/issues
- **Discussions**: (To be created)
- **Email**: promps-dev@zundou.org

---

## License

All documentation in this directory is licensed under the same license as the Promps project:

**MIT License** - See [LICENSE](../LICENSE) file for details

Copyright (c) 2025 Yoshihiro NAKAHARA

---

**Thank you for reading Promps documentation!**

For questions or suggestions, please open an issue on GitHub or contact us via email.

---

**Document Version**: 1.1
**Last Updated**: 2026-01-19 (JST)
**Next Review**: Before Phase 4 release
