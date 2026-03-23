# Promps ドキュメント

**バージョン**: v0.0.3-2 (Phase 3-前半)
**最終更新**: 2026-01-19 (JST)

---

## Promps ドキュメントへようこそ

このディレクトリには、**Promps Phase 0** の技術ドキュメントが含まれています。Phase 0 は、DSL パーシングとプロンプト生成エンジンの基盤実装です。

---

## ドキュメント一覧

### 新規ユーザー向け

**こちらから**: [プロジェクト README](../../README.md)
- Promps の概要
- インストール手順
- 基本的な使用例

---

### 開発者向け

**コア機能**:
- **[CORE_FEATURES.md](./developer/ja/guides/CORE_FEATURES.md)** - 包括的な機能ドキュメント
  - データ構造（`PromptPart`）
  - パーシングエンジンの詳細
  - プロンプト生成アルゴリズム
  - 設計根拠
  - テスト戦略
  - 使用例

**API ドキュメント**:
- **[API_REFERENCE.md](./developer/ja/api/API_REFERENCE.md)** - 完全な API リファレンス
  - 公開関数（`parse_input`、`generate_prompt`）
  - Tauri コマンド
  - データ型
  - 使用パターン
  - パフォーマンス特性
  - マイグレーションガイド

**アーキテクチャ**:
- **[ARCHITECTURE.md](./design/ARCHITECTURE.md)** - システムアーキテクチャ
  - 高レベル設計
  - モジュール構造
  - データフロー
  - 設計決定
  - 進化パス
  - デプロイメントアーキテクチャ

---

## ドキュメント構成

各ドキュメントファイルは一貫した構造に従っています：

1. **概要**: 高レベルのサマリー
2. **コアコンテンツ**: 詳細情報
3. **例**: 実践的な使用例
4. **リファレンス**: 技術仕様
5. **付録**: サポート情報

---

## ドキュメント標準

### バージョニング

全てのドキュメントには以下が含まれます：
- **バージョン**: フェーズ識別子（例: Phase 0、Phase 1）
- **最終更新**: ISO 日付（YYYY-MM-DD）
- **次回レビュー**: 更新レビュー時期

### 対象読者

ドキュメントは特定の読者向けに書かれています：
- **ユーザー**: README.md、使用ガイド
- **開発者**: API リファレンス、アーキテクチャドキュメント

### メンテナンスポリシー

ドキュメントは以下のタイミングで更新されます：
- **いつ**: 各フェーズ移行前
- **誰が**: 主要開発者
- **どのように**: バージョン管理（Git）、マージ前レビュー

---

## クイックリファレンス

### 主要概念

| 概念 | 説明 | ドキュメント |
|------|------|-------------|
| `_N:` プレフィックス | 名詞の AST 的型アノテーション | CORE_FEATURES.md、ARCHITECTURE.md |
| PromptPart | コアデータ構造（トークン + 型） | CORE_FEATURES.md、API_REFERENCE.md |
| トークンレベル検出 | 各名詞に個別マーカー | CORE_FEATURES.md、ARCHITECTURE.md |
| コンパイラアナロジー | コンパイラパイプラインを模したアーキテクチャ | ARCHITECTURE.md |

---

### よくあるタスク

| タスク | ドキュメント | セクション |
|--------|-------------|-----------|
| コア機能の理解 | CORE_FEATURES.md | コアコンポーネント |
| 公開 API の使用 | API_REFERENCE.md | 公開関数 |
| Tauri との統合 | API_REFERENCE.md | Tauri コマンド |
| 設計決定の理解 | ARCHITECTURE.md | 設計決定 |
| テストの実行 | CORE_FEATURES.md | テスト |

---

## よくある質問

### なぜ自動検出ではなく `_N:` プレフィックスを使うのか？

**簡潔な回答**: 信頼性とシンプルさ。

**詳細な回答**: CORE_FEATURES.md「設計根拠 - なぜ _N: プレフィックスか？」を参照

**要点**:
- 名詞の識別を保証（推論不要）
- 将来の AST ベース検証の基盤（Phase N）
- ユーザー体験: Phase 0（CLI）では手動、Phase 1+（GUI ブロック）では自動

---

### なぜトークンレベルの名詞検出なのか？

**簡潔な回答**: 複数の名詞に個別マーカーを付けるため。

**詳細な回答**: ARCHITECTURE.md「決定 2: トークンレベルの名詞検出」を参照

**要点**:
- 各名詞に明示的な `(NOUN)` マーカー
- 複雑な文の自然な処理（「_N:タコ と _N:イカ を 食べる」）
- AI が名詞の境界を明確に理解可能
- Phase N+1 で品詞ブロック追加による進化を予定

---

### なぜ Phase 0 ではエラーハンドリングがないのか？

**簡潔な回答**: Phase N（ロジックチェック）に延期。

**詳細な回答**: ARCHITECTURE.md「決定 4: Phase 0 ではエラーハンドリングなし」を参照

**要点**:
- Phase 0 の目標: コア機能の確立
- 検証には AST ベースのパターンマッチングが必要（Phase N のスコープ）
- 将来の拡張性を犠牲にすることなく複雑さを軽減

---

### なぜ Phase 0 ではファイル I/O がないのか？

**簡潔な回答**: YAGNI（You Aren't Gonna Need It - 必要になるまで実装しない）。

**詳細な回答**: ARCHITECTURE.md「決定 5: Phase 0 ではファイル I/O なし」を参照

**要点**:
- 急速な開発中のスキーマ変更を回避
- ブロックタイプが確定したら一度だけ実装（Phase N+1）
- 早すぎる設計のロックインを防止

---

## バージョン履歴

### Phase 0 (2025-11-25)

**初回リリース**:
- CORE_FEATURES.md 作成
- API_REFERENCE.md 作成
- ARCHITECTURE.md 作成
- README.md（このファイル）作成

**カバレッジ**:
- コアライブラリ機能
- Tauri 統合
- 設計決定
- テスト戦略

---

## 次のステップ

### Phase 1 ドキュメント（予定）

**新規ドキュメント**:
- BLOCKLY_INTEGRATION.md（Blockly.js 統合ガイド）
- GUI_ARCHITECTURE.md（フロントエンドアーキテクチャ）
- BLOCK_TYPES.md（カスタムブロック定義）

**更新ドキュメント**:
- API_REFERENCE.md（新しい Tauri コマンド）
- ARCHITECTURE.md（GUI データフロー）

---

### Phase N ドキュメント（予定）

**新規ドキュメント**:
- LOGIC_CHECK.md（AST ベース検証）
- PATTERN_REFERENCE.md（文法パターン）
- ERROR_HANDLING.md（エラー型とハンドリング）

**更新ドキュメント**:
- API_REFERENCE.md（エラー型、新しいシグネチャ）
- CORE_FEATURES.md（検証機能）

---

## ドキュメントへの貢献

### ガイドライン

1. **明確さ**: 対象読者（ユーザー、開発者）向けに書く
2. **例**: 実践的なコード例を含める
3. **一貫性**: 既存のドキュメント構造に従う
4. **バージョニング**: 変更時にバージョンと日付を更新
5. **相互参照**: 関連ドキュメントへリンク

### プロセス

1. ドキュメントのギャップや古いコンテンツを特定
2. `docs/` ディレクトリの適切な場所でドキュメントを作成/更新
3. 新しいドキュメントを追加した場合、この INDEX_ja.md を更新
4. 明確さと正確さをレビュー
5. 説明的なメッセージでコミット（例: "docs(ja): BLOCKLY_INTEGRATION.md を追加"）

---

## ドキュメントツール

### ドキュメントの閲覧

**Markdown ビューアー**:
- GitHub Web インターフェース（自動レンダリング）
- VSCode（組み込み Markdown プレビュー）
- Obsidian（Markdown ナレッジベース）
- Typora（WYSIWYG Markdown エディタ）

**コマンドライン**:
```bash
# ターミナルで表示（基本）
cat docs/CORE_FEATURES.md

# フォーマット付きで表示（インストールされている場合）
glow docs/CORE_FEATURES.md
```

### ドキュメントの検索

**grep**（コマンドライン）:
```bash
# 全ドキュメントで "PromptPart" を検索
grep -r "PromptPart" docs/

# 前後 3 行のコンテキスト付きで検索
grep -C 3 "parse_input" docs/API_REFERENCE.md
```

**VSCode**（GUI）:
- Ctrl+Shift+F（ワークスペース内検索）
- フィルター: `docs/**/*.md`

---

## 外部リソース

### 関連技術

- **Rust 言語**: https://www.rust-lang.org/ja
- **Tauri フレームワーク**: https://tauri.app/
- **Blockly.js**（Phase 1）: https://developers.google.com/blockly

### コミュニティ

- **Issues**: https://github.com/BonoJovi/Promps/issues
- **Discussions**: （今後作成予定）
- **Email**: promps-dev@zundou.org

---

## ライセンス

このディレクトリ内の全てのドキュメントは、Promps プロジェクトと同じライセンスの下でライセンスされています：

**MIT ライセンス** - 詳細は [LICENSE](../../LICENSE) ファイルを参照

Copyright (c) 2025 Yoshihiro NAKAHARA

---

**Promps ドキュメントをお読みいただきありがとうございます！**

質問や提案がある場合は、GitHub で Issue を開くか、Email でお問い合わせください。

---

**ドキュメントバージョン**: 1.1
**最終更新**: 2026-01-19 (JST)
**次回レビュー**: Phase 4 リリース前
