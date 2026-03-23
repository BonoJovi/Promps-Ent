# Release Process

**Last Updated**: 2026-02-02
**Purpose**: Step-by-step release procedure for Promps project
**Keywords**: release, deploy, deployment, publish, リリース, デプロイ, 公開, version bump, バージョンアップ, tagging, git tag, タグ, GitHub Actions, workflow, ワークフロー, CI/CD, automated build, 自動ビルド, draft release, ドラフトリリース, artifacts, binaries, バイナリ, publish release, rollback, ロールバック, version numbering, バージョン管理
**Related**: @BRANCHING.md, @TESTING.md, @GITHUB_PROJECTS.md, @CONVENTIONS.md

---

## Overview

Promps uses GitHub Actions for automated builds and releases. The release workflow is triggered by pushing a git tag.

---

## Prerequisites

Before creating a release, ensure:
- All changes are committed and pushed to `dev` branch
- All tests pass (42+ tests at 100%)
- Documentation is up to date
- Version numbers are updated in configuration files

---

## Release Workflow

### Step 1: Update Version Numbers

Update version in **all three** configuration files:

**Files to update:**
1. `tauri.conf.json` - Application version
2. `Cargo.toml` - Rust package version
3. `package.json` - Release name (used by GitHub Actions)

**Example:**
```json
// tauri.conf.json
{
  "version": "0.0.2",  // Update this
  ...
}
```

```toml
# Cargo.toml
[package]
version = "0.0.2"  # Update this
```

```json
// package.json
{
  "version": "0.0.2",  // Update this
  ...
}
```

**Commit and push:**
```bash
git add tauri.conf.json Cargo.toml package.json
git commit -m "chore(release): bump version to X.Y.Z"
git pull --rebase origin dev
git push origin dev
```

---

### Step 2: Clean Up Previous Draft Releases

⚠️ **CRITICAL**: GitHub Actions fails if Draft releases exist from previous failed builds.

**Check for Draft releases:**
```bash
gh release list
```

**Delete any Draft releases:**
```bash
# Get Draft release ID
gh api repos/BonoJovi/Promps/releases --jq '.[] | select(.draft == true) | {id: .id, tag_name: .tag_name}'

# Delete Draft release (replace ID)
gh api -X DELETE repos/BonoJovi/Promps/releases/<RELEASE_ID>
```

**Why this is necessary:**
- Previous failed builds may leave Draft releases
- GitHub API rejects creating new releases if Drafts exist
- This prevents "already_exists" errors

---

### Step 3: Create and Push Git Tag

**Create tag:**
```bash
git tag vX.Y.Z-free
git push origin vX.Y.Z-free
```

⚠️ **IMPORTANT: Do NOT manually create a release!**
- GitHub Actions automatically creates a Draft release when the tag is pushed
- The workflow builds all platforms and uploads assets
- The release is automatically published when builds complete
- Running `gh release create` manually will create a duplicate empty release

**If tag already exists (re-releasing):**
```bash
# Delete old tag locally and remotely
git tag -d vX.Y.Z-free
git push origin :refs/tags/vX.Y.Z-free

# Create new tag
git tag vX.Y.Z-free
git push origin vX.Y.Z-free
```

---

### Step 4: Monitor GitHub Actions

**Workflow automatically triggers** when tag is pushed.

**Check workflow status:**
- Web: https://github.com/BonoJovi/Promps/actions
- CLI: `gh run list --limit 3`

**Workflow steps:**
1. `create-release`: Creates Draft release
2. `build-tauri`: Builds for 4 platforms (macOS aarch64/x86_64, Ubuntu, Windows)
3. `publish-release`: Publishes release (changes Draft to public)

**Expected duration:** 5-10 minutes

---

### Step 5: Verify Release

**Check release page:**
- Web: https://github.com/BonoJovi/Promps/releases
- CLI: `gh release list`

**Verify:**
- ✅ Release is marked as "Latest" (not "Draft")
- ✅ All 4 platform binaries are attached
- ✅ Version number matches your tag
- ✅ Release notes are present (auto-generated from commits)

---

## Common Issues and Solutions

### Issue 1: "Validation Failed: already_exists"

**Symptom:**
```
HttpError: Validation Failed: {"resource":"Release","code":"already_exists","field":"tag_name"}
```

**Cause:**
- Draft release exists from previous failed build

**Solution:**
1. Delete Draft release: `gh api -X DELETE repos/BonoJovi/Promps/releases/<ID>`
2. Re-run workflow: `gh run rerun <RUN_ID>`

---

### Issue 2: Wrong Version in Build Artifacts

**Symptom:**
- Created tag v0.0.2, but workflow creates v0.0.1 release

**Cause:**
- Forgot to update version in `tauri.conf.json` and `Cargo.toml`

**Solution:**
1. Update both config files with correct version
2. Commit and push changes
3. Delete old tag and create new one
4. Push new tag

---

### Issue 3: Multiple Draft Releases

**Symptom:**
- Multiple Draft releases visible in `gh release list`

**Cause:**
- Failed builds leave Draft releases behind

**Solution:**
```bash
# List all Drafts
gh api repos/BonoJovi/Promps/releases --jq '.[] | select(.draft == true)'

# Delete each Draft
gh api -X DELETE repos/BonoJovi/Promps/releases/<ID1>
gh api -X DELETE repos/BonoJovi/Promps/releases/<ID2>
```

---

### Issue 4: Duplicate Releases (Latest + Draft)

**Symptom:**
- Two releases with the same tag: one "Latest" (empty) and one "Draft" (with assets)

**Cause:**
- Manual execution of `gh release create` after pushing a tag
- GitHub Actions automatically creates a Draft release on tag push
- Manual creation duplicates the release

**Flow that causes the issue:**
```
1. git tag v1.3.1-free && git push origin v1.3.1-free
   ↓
2. GitHub Actions triggers → Creates Draft release → Builds → Uploads assets
   ↓
3. Manual: gh release create v1.3.1-free  ← WRONG! Creates duplicate
```

**Solution:**
```bash
# Find and delete the empty release
gh api repos/BonoJovi/Promps/releases --jq '.[] | select(.tag_name == "v1.3.1-free") | {name, draft, assets: (.assets | length)}'

# Delete the empty one (assets: 0)
gh api -X DELETE repos/BonoJovi/Promps/releases/<EMPTY_RELEASE_ID>

# Publish the Draft with assets
gh api -X PATCH repos/BonoJovi/Promps/releases/<DRAFT_RELEASE_ID> -f draft=false
```

**Prevention:**
- ⚠️ **NEVER manually run `gh release create` after pushing a tag**
- GitHub Actions handles everything automatically
- Just push the tag and wait for the workflow to complete

---

## Release Checklist

Before creating a release:

- [ ] All tests passing (100% success rate)
- [ ] Documentation updated
- [ ] Version updated in `tauri.conf.json`
- [ ] Version updated in `Cargo.toml`
- [ ] Changes committed and pushed to `dev`
- [ ] Existing Draft releases deleted
- [ ] Tag created and pushed
- [ ] GitHub Actions workflow completed successfully
- [ ] Release verified on GitHub

---

## Rollback Procedure

If a release has critical issues:

**Delete release:**
```bash
gh release delete vX.Y.Z --yes
```

**Delete tag:**
```bash
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```

**Fix issues, then re-release following normal procedure.**

---

## Release Strategy (Tech Preview)

**Current approach:**
- Releases on `dev` branch only
- No `main` branch yet (Tech Preview stage)
- Gradual releases for user adoption

**Reasoning:**
- Working users have limited time for code review
- Gradual releases allow users to keep pace with changes
- Feedback loop works better with smaller increments

**When to create `main` branch:**
- After v1.0.0 (stable release)
- When user base grows significantly

---

## Automated Testing in Release Workflow

**Since v0.0.2**, the release workflow includes test execution:

```yaml
- name: run backend tests
  run: cargo test

- name: run frontend tests
  run: npm test
  working-directory: ./res/tests
```

**This ensures:**
- No broken releases
- All 42+ tests pass before building
- Quality assurance at release time

---

## Version Numbering

**Format:** `MAJOR.MINOR.PATCH`

**Current stage:** v0.0.x (Tech Preview)

**Roadmap:**
- v0.0.1: Phase 0 + Phase 1 (CLI + GUI foundation)
- v0.0.2: Phase 2 (Particle blocks)
- v0.0.3-2: Phase 3 (Verb blocks) ✅ Complete
- v0.0.4: Phase 4 (Project Persistence - save/load)
- v0.0.5: Phase 5 (Logic Check 基礎 - basic validation)
- v0.0.6: Phase 6 (Logic Check 拡張 - advanced validation + suggestions)
- **v1.0.0**: Stable release (after v0.0.6 verification)

---

## See Also

- [GitHub Projects Workflow](.ai-context/workflows/GITHUB_PROJECTS.md)
- [Conventions](.ai-context/development/CONVENTIONS.md)
- [Quick Reference](.ai-context/core/QUICK_REFERENCE.md)
