# 開発フロー自動化 TODO

**作成日**: 2026-01-28
**最終更新**: 2026-01-28
**目的**: Prompsプロジェクトの開発フローで自動化可能な箇所の洗い出し
**次回開始位置**: Future（E2Eテスト自動化、i18n整合性チェック）

---

## 現状の自動化状況

### 実装済みワークフロー

| ワークフロー | トリガー | 状態 |
|-------------|---------|------|
| release.yml | tag push (v*) / manual | active |
| version-bump.yml | manual | active |
| feature-branch-test.yml | feature/* push / PR to dev | active |
| update-stats.yml | cron (daily) / manual | disabled |
| update-ai-context-shared.yml | repository_dispatch | active |

### 適用済みリポジトリ

| リポジトリ | version-bump | feature-branch-test | テスト確認 |
|-----------|--------------|---------------------|-----------|
| Promps | ✅ | ✅ | ✅ 2分33秒 |
| Promps-Pro | ✅ | ✅ | - |
| Promps-Ent | ✅ | ✅ | - |
| Promps-Edu | ✅ | ✅ | - |
| KakeiBonByRust | ✅ | ✅ | - |
| Baconian | ✅ | ✅ | - |

---

## 自動化機会一覧

### 優先度: 高

#### 1. feature/* ブランチのテスト自動実行
- **現状**: 手動で `cargo test && cd res/tests && npm test` を実行
- **改善**: PRまたはpush時に自動テスト
- **実装難易度**: 低
- **効果**: 早期の問題検出、開発効率向上

```yaml
# .github/workflows/feature-branch-test.yml
name: Feature Branch Test

on:
  push:
    branches:
      - 'feature/**'
  pull_request:
    branches:
      - dev

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies (ubuntu)
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.0-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
      - name: Run backend tests
        run: cargo test
      - name: Install frontend dependencies
        run: npm install
        working-directory: ./res/tests
      - name: Run frontend tests
        run: npm test
        working-directory: ./res/tests
```

#### 2. 複数リポジトリ間の自動同期
- **現状**: 手動で各リポジトリに変更を適用
- **改善**: Promps → Promps-Pro → Promps-Ent の自動同期
- **実装難易度**: 中
- **効果**: 派生版開発の大幅効率化

**対象リポジトリ関係**:
```
Promps (origin)
  ↓ upstream
Promps-Pro
  ↓ upstream
Promps-Ent

Promps-Edu (独立)
```

**実装案**:
```yaml
# .github/workflows/sync-downstream.yml (Prompsに配置)
name: Sync to Downstream Repos

on:
  push:
    branches: [dev]
    paths-ignore:
      - '**.md'
      - '.ai-context/**'

jobs:
  sync-to-pro:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Promps-Pro sync
        uses: peter-evans/repository-dispatch@v2
        with:
          token: ${{ secrets.CROSS_REPO_TOKEN }}
          repository: BonoJovi/Promps-Pro
          event-type: sync-from-upstream
```

#### 3. ドラフトリリース自動削除
- **現状**: リリース前に手動でドラフトリリースを削除
- **改善**: version-bump実行前に自動削除
- **実装難易度**: 低
- **効果**: リリース失敗の削減

```yaml
# version-bump.yml に追加
- name: Delete existing draft releases
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh release list --json tagName,isDraft | jq -r '.[] | select(.isDraft) | .tagName' | while read tag; do
      echo "Deleting draft release: $tag"
      gh release delete "$tag" --yes
    done
```

---

### 優先度: 中

#### 4. リリースノーツ自動生成
- **現状**: RELEASE_TEMPLATE.md を参照して手動記述
- **改善**: Conventional Commitsからの自動生成
- **実装難易度**: 低
- **効果**: ドキュメント作成時間削減

```yaml
- name: Generate release notes
  run: |
    PREV_TAG=$(git describe --tags --abbrev=0 HEAD^)
    echo "## What's Changed" > release_notes.md
    echo "" >> release_notes.md
    git log ${PREV_TAG}..HEAD --pretty=format:"- %s" >> release_notes.md
```

#### 5. ドキュメント整合性チェック
- **現状**: バージョン参照の整合性は手動確認
- **改善**: CI/CDでの自動検証
- **実装難易度**: 低
- **効果**: ドキュメント品質保証

```yaml
# .github/workflows/doc-check.yml
name: Document Consistency Check

on:
  push:
    paths:
      - 'Cargo.toml'
      - '.ai-context/ESSENTIAL.md'
      - 'README.md'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify version consistency in docs
        run: |
          VERSION=$(grep -oP '^version = "\K[^"]+' Cargo.toml)
          ESSENTIAL_VER=$(grep -oP '\*\*Version\*\*: v\K[0-9.]+' .ai-context/ESSENTIAL.md)
          if [ "$VERSION" != "$ESSENTIAL_VER" ]; then
            echo "Version mismatch: Cargo.toml=$VERSION, ESSENTIAL.md=$ESSENTIAL_VER"
            exit 1
          fi
          echo "Version consistency OK: $VERSION"
```

#### 6. i18n整合性チェック（将来対応）
- **現状**: i18n未実装
- **改善**: 実装時に自動検証を追加
- **実装難易度**: 中
- **効果**: 多言語対応時の品質保証

```yaml
- name: Check i18n completeness
  run: |
    if [ -d "res/i18n" ]; then
      EN_KEYS=$(jq 'keys | length' res/i18n/en.json)
      JA_KEYS=$(jq 'keys | length' res/i18n/ja.json)
      if [ "$EN_KEYS" != "$JA_KEYS" ]; then
        echo "Translation incomplete: EN=$EN_KEYS, JA=$JA_KEYS"
        exit 1
      fi
    fi
```

---

### 優先度: 低

#### 7. Submodule定期更新
- **現状**: repository_dispatchトリガーのみ
- **改善**: 週次の定期実行を追加
- **実装難易度**: 低
- **効果**: 情報の最新性保証

```yaml
# update-ai-context-shared.yml に追加
on:
  schedule:
    - cron: '0 2 * * 0'  # 週1回、日曜2:00 UTC
  repository_dispatch:
    types: [update-ai-context-shared]
  workflow_dispatch:
```

#### 8. API安定性の自動検証
- **現状**: API_STABILITY.mdで手動管理
- **改善**: Phase 0 APIの後方互換性をCIで検証
- **実装難易度**: 中
- **効果**: 破壊的変更の防止

**実装案**: Rustの型システムが自動検出するため、補助的なテスト追加

```rust
// tests/api_stability.rs
#[test]
fn test_phase0_api_unchanged() {
    // parse_input のシグネチャが変更されていないことを確認
    let _: fn(&str) -> Vec<PromptPart> = parse_input;
}
```

#### 9. E2Eテスト自動化
- **現状**: Human Testとして手動実行
- **改善**: Tauri + Blocklyの統合テスト自動化
- **実装難易度**: 高
- **効果**: UI品質保証

**ツール候補**:
- Tauri Driver (WebDriver)
- Playwright with Tauri

---

## 実装ロードマップ

### Phase 1（即時対応）- 完了
- [x] feature/* ブランチテスト自動化 (2026-01-28 完了・テスト済)
- [x] ドラフトリリース自動削除 (2026-01-28 完了・テスト済)
- [x] version-bump.yml を KakeiBonByRust / Baconian に適用 (2026-01-28 完了)
- [x] バージョンバッジを KakeiBonByRust / Baconian に追加 (2026-01-28 完了)

**テスト結果**:
- ドラフトリリース自動削除: ✅ 動作確認済（テスト用ドラフト作成→削除確認）
- feature/*ブランチテスト: ✅ 動作確認済（Prompsで2分33秒で完了）

### Phase 2（2週目）- 完了
- [x] 複数リポジトリ間同期 (2026-01-28 完了・Promps/Pro/Ent)
- [x] リリースノーツ自動生成 (2026-01-28 完了・全5リポジトリ適用済)

### Phase 3（1ヶ月後）- 完了
- [x] ドキュメント整合性チェック (2026-01-28 完了)
- [x] Submodule定期更新 (2026-01-28 完了)

### Future（v1.1.0以降）
- [ ] E2Eテスト自動化
- [ ] i18n整合性チェック（i18n実装時）

---

## 技術的な推奨事項

### 1. Concurrency設定
同一ブランチの古いワークフローをキャンセル:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### 2. Reusable Workflows
テスト実行ロジックを共通化:
```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test

on:
  workflow_call:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... テスト実行
```

### 3. キャッシュ活用
ビルド時間短縮:
```yaml
- uses: actions/cache@v3
  with:
    path: |
      ~/.cargo/registry
      ~/.cargo/git
      target
    key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
```

### 4. 通知戦略
- 失敗時: GitHub Issues or Slack通知
- 成功時: リリースページに自動投稿

---

## 参考情報

### 現在のテスト統計
- バックエンド: 92テスト
- フロントエンド: 190テスト
- 合計: 282テスト
- 成功率: 100%

### 関連ドキュメント
- `.ai-context/context/workflows/RELEASE.md`
- `.ai-context/context/workflows/BRANCHING.md`
- `.ai-context/context/coding/TESTING.md`
- `.ai-context/context/coding/API_STABILITY.md`
