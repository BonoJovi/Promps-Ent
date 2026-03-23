#!/usr/bin/env bash
#
# pre-release-check.sh - Promps リリース前チェックスクリプト
#
# Usage:
#   bash scripts/pre-release-check.sh              # Check using version from Cargo.toml
#   bash scripts/pre-release-check.sh --version 1.5.0  # Check specific version
#   bash scripts/pre-release-check.sh --fix         # Auto-fix draft releases and tags
#
# Checks:
#   1. Version consistency across 5 files
#   2. Draft release remnants on GitHub
#   3. Existing tag remnants (local + remote)

set -euo pipefail

# --- Configuration ---
REPO=$(git remote get-url origin 2>/dev/null | sed -E 's#.+github\.com[:/](.+)\.git$#\1#; s#.+github\.com[:/](.+)$#\1#')

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# --- State ---
FIX_MODE=false
SPECIFIED_VERSION=""
ERRORS=0
WARNINGS=0

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX_MODE=true
            shift
            ;;
        --version)
            SPECIFIED_VERSION="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: bash scripts/pre-release-check.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --fix              Auto-fix draft releases and stale tags (with confirmation)"
            echo "  --version X.Y.Z   Check specific version (default: read from Cargo.toml)"
            echo "  -h, --help         Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# --- Helper functions ---
pass() {
    echo -e "  ${GREEN}✅ $1${NC}"
}

fail() {
    echo -e "  ${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

warn() {
    echo -e "  ${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

info() {
    echo -e "  $1"
}

# --- Ensure we're in the project root ---
if [[ ! -f "Cargo.toml" ]]; then
    echo -e "${RED}Error: Must be run from the project root directory${NC}"
    echo "  cd /path/to/Promps && bash scripts/pre-release-check.sh"
    exit 1
fi

# --- Check prerequisites ---
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: 'gh' (GitHub CLI) is required but not installed${NC}"
    echo "  Install: https://cli.github.com/"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: 'jq' is required but not installed${NC}"
    echo "  Install: sudo apt install jq"
    exit 1
fi

echo ""
echo -e "${BOLD}=== Promps Pre-Release Check ===${NC}"
echo ""

# ========================================
# CHECK 1: Version Consistency
# ========================================
echo -e "${CYAN}[CHECK 1] Version Consistency${NC}"

# Extract versions from each file
CARGO_VER=$(grep -oP '^version = "\K[^"]+' Cargo.toml | head -1)
TAURI_VER=$(jq -r '.version' tauri.conf.json)
PKG_VER=$(jq -r '.version' package.json)
README_VER=$(grep -oP 'Version-\K[0-9]+\.[0-9]+\.[0-9]+' README.md | head -1 || echo "NOT_FOUND")
ESSENTIAL_VER=$(grep -oP '\*\*Version\*\*: v\K[0-9]+\.[0-9]+\.[0-9]+' .ai-context/ESSENTIAL.md || echo "NOT_FOUND")

# Display each version
printf "  %-22s %s\n" "Cargo.toml:" "$CARGO_VER"
printf "  %-22s %s\n" "tauri.conf.json:" "$TAURI_VER"
printf "  %-22s %s\n" "package.json:" "$PKG_VER"
printf "  %-22s %s\n" "README.md:" "$README_VER"
printf "  %-22s %s\n" "ESSENTIAL.md:" "$ESSENTIAL_VER"

# Determine expected version
if [[ -n "$SPECIFIED_VERSION" ]]; then
    EXPECTED_VER="$SPECIFIED_VERSION"
else
    EXPECTED_VER="$CARGO_VER"
fi

# Compare all versions
ALL_MATCH=true
for ver in "$CARGO_VER" "$TAURI_VER" "$PKG_VER" "$README_VER" "$ESSENTIAL_VER"; do
    if [[ "$ver" != "$EXPECTED_VER" ]]; then
        ALL_MATCH=false
        break
    fi
done

if $ALL_MATCH; then
    pass "All versions match: $EXPECTED_VER"
else
    fail "Version mismatch detected!"
    echo ""
    echo -e "  ${YELLOW}Mismatched files:${NC}"
    [[ "$CARGO_VER" != "$EXPECTED_VER" ]]    && echo -e "    ${RED}Cargo.toml: $CARGO_VER (expected $EXPECTED_VER)${NC}" || true
    [[ "$TAURI_VER" != "$EXPECTED_VER" ]]     && echo -e "    ${RED}tauri.conf.json: $TAURI_VER (expected $EXPECTED_VER)${NC}" || true
    [[ "$PKG_VER" != "$EXPECTED_VER" ]]       && echo -e "    ${RED}package.json: $PKG_VER (expected $EXPECTED_VER)${NC}" || true
    [[ "$README_VER" != "$EXPECTED_VER" ]]    && echo -e "    ${RED}README.md: $README_VER (expected $EXPECTED_VER)${NC}" || true
    [[ "$ESSENTIAL_VER" != "$EXPECTED_VER" ]] && echo -e "    ${RED}ESSENTIAL.md: $ESSENTIAL_VER (expected $EXPECTED_VER)${NC}" || true
    echo ""
    echo -e "  ${YELLOW}Fix: Run the version-bump workflow or manually update mismatched files${NC}"
fi

echo ""

# ========================================
# CHECK 2: Draft Releases
# ========================================
echo -e "${CYAN}[CHECK 2] Draft Releases${NC}"

DRAFT_RELEASES=$(gh api "/repos/${REPO}/releases" --jq '.[] | select(.draft == true) | .tag_name' 2>/dev/null || echo "API_ERROR")

if [[ "$DRAFT_RELEASES" == "API_ERROR" ]]; then
    warn "Could not check draft releases (GitHub API error)"
    echo -e "  ${YELLOW}Verify manually: gh release list --repo $REPO${NC}"
elif [[ -z "$DRAFT_RELEASES" ]]; then
    pass "No draft releases found"
else
    fail "Draft release(s) found:"
    while IFS= read -r tag; do
        echo -e "    ${RED}- $tag${NC}"
    done <<< "$DRAFT_RELEASES"

    if $FIX_MODE; then
        echo ""
        while IFS= read -r tag; do
            echo -ne "  ${YELLOW}Delete draft release '$tag'? [y/N]: ${NC}"
            read -r confirm
            if [[ "$confirm" =~ ^[Yy]$ ]]; then
                if gh release delete "$tag" --repo "$REPO" --yes 2>/dev/null; then
                    echo -e "  ${GREEN}Deleted draft release: $tag${NC}"
                    ERRORS=$((ERRORS - 1))
                else
                    echo -e "  ${RED}Failed to delete draft release: $tag${NC}"
                fi
            else
                echo "  Skipped"
            fi
        done <<< "$DRAFT_RELEASES"
    else
        echo ""
        echo -e "  ${YELLOW}Fix: Run with --fix to delete, or manually:${NC}"
        while IFS= read -r tag; do
            echo -e "    gh release delete $tag --repo $REPO --yes"
        done <<< "$DRAFT_RELEASES"
    fi
fi

echo ""

# ========================================
# CHECK 3: Existing Tags
# ========================================
echo -e "${CYAN}[CHECK 3] Existing Tags (v${EXPECTED_VER})${NC}"

# Check local tag
LOCAL_TAG_EXISTS=false
if git tag -l "v${EXPECTED_VER}" | grep -q "v${EXPECTED_VER}"; then
    LOCAL_TAG_EXISTS=true
    fail "Local tag v${EXPECTED_VER} exists"
else
    pass "Local tag: not found"
fi

# Check remote tag
REMOTE_TAG_EXISTS=false
if gh api "/repos/${REPO}/git/refs/tags/v${EXPECTED_VER}" &>/dev/null; then
    REMOTE_TAG_EXISTS=true
    fail "Remote tag v${EXPECTED_VER} exists"
else
    pass "Remote tag: not found"
fi

# Fix mode for tags
if ($LOCAL_TAG_EXISTS || $REMOTE_TAG_EXISTS) && $FIX_MODE; then
    echo ""
    if $LOCAL_TAG_EXISTS; then
        echo -ne "  ${YELLOW}Delete local tag 'v${EXPECTED_VER}'? [y/N]: ${NC}"
        read -r confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            git tag -d "v${EXPECTED_VER}" 2>/dev/null
            echo -e "  ${GREEN}Deleted local tag: v${EXPECTED_VER}${NC}"
            ERRORS=$((ERRORS - 1))
        else
            echo "  Skipped"
        fi
    fi
    if $REMOTE_TAG_EXISTS; then
        echo -ne "  ${YELLOW}Delete remote tag 'v${EXPECTED_VER}'? [y/N]: ${NC}"
        read -r confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            if git push origin ":refs/tags/v${EXPECTED_VER}" 2>/dev/null; then
                echo -e "  ${GREEN}Deleted remote tag: v${EXPECTED_VER}${NC}"
                ERRORS=$((ERRORS - 1))
            else
                echo -e "  ${RED}Failed to delete remote tag: v${EXPECTED_VER}${NC}"
            fi
        else
            echo "  Skipped"
        fi
    fi
elif ($LOCAL_TAG_EXISTS || $REMOTE_TAG_EXISTS) && ! $FIX_MODE; then
    echo ""
    echo -e "  ${YELLOW}Fix: Run with --fix to delete, or manually:${NC}"
    $LOCAL_TAG_EXISTS && echo -e "    git tag -d v${EXPECTED_VER}" || true
    $REMOTE_TAG_EXISTS && echo -e "    git push origin :refs/tags/v${EXPECTED_VER}" || true
fi

echo ""

# ========================================
# Summary
# ========================================
echo -e "${BOLD}=======================================${NC}"
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}=== Result: ALL CHECKS PASSED ===${NC}"
    echo -e "${GREEN}Ready to trigger release build!${NC}"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}(with $WARNINGS warning(s))${NC}"
    fi
    echo ""
    echo -e "${CYAN}Next step:${NC}"
    echo -e "  git tag v${EXPECTED_VER}-ent && git push origin v${EXPECTED_VER}-ent"
    exit 0
else
    echo -e "${RED}${BOLD}=== Result: $ERRORS CHECK(S) FAILED ===${NC}"
    echo -e "${RED}Please fix the issues above before releasing.${NC}"
    if ! $FIX_MODE; then
        echo -e "${YELLOW}Tip: Run with --fix to auto-fix draft releases and tags${NC}"
    fi
    exit 1
fi
