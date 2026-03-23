# Promps v0.0.1 - Technology Preview

## ⚠️ Tech Preview Notice

**This is a Technology Preview release** - an early version to test the concept and gather community feedback.

**What this means:**
- ✅ **Core functionality works** and is ready for testing
- ⚠️ **Limited features** - only Noun and Other block types
- ⚠️ **No grammar validation** - any block combination is allowed
- ⚠️ **No project save/load** - sessions are not persistent
- [Bug] **Bugs are expected** - please report them!

**We're looking for testers!** Your feedback will directly shape the future of Promps.

---

## [Target] What's Included in v0.0.1

### Features
- ✅ Visual block-based interface (powered by Blockly.js)
- ✅ Real-time prompt preview
- ✅ Automatic noun detection and marking with `(NOUN)`
- ✅ Simple drag-and-drop operation
- ✅ Desktop application (Tauri + Rust)

### Block Types
- **Noun Block** (名詞): For entities like "User", "Order", "Database"
- **Other Block** (その他): For particles, verbs, adjectives, and connectives

---

## [Download] Installation

### Download Binaries

Choose the appropriate binary for your platform:

- **Linux**: `promps_0.0.1_amd64.AppImage` or `promps_0.0.1_amd64.deb`
- **Windows**: `promps_0.0.1_x64_en-US.msi`
- **macOS**: `promps_0.0.1_x64.dmg` (Intel) or `promps_0.0.1_aarch64.dmg` (Apple Silicon)

### Build from Source

```bash
git clone https://github.com/BonoJovi/Promps.git
cd Promps
git checkout v0.0.1
cargo tauri build
```

---

## [Rocket] Quick Start

1. **Launch Promps**
2. **Drag blocks** from the left panel to the workspace
3. **Connect blocks** vertically to form sentences
4. **See your prompt** generated in real-time on the right panel
5. **Copy and use** the generated prompt with AI assistants

### Example

**Blocks:**
```
[Noun: User] → [Other: が] → [Noun: Order] → [Other: を] → [Other: 作成]
```

**Generated Output:**
```
User (NOUN) が Order (NOUN) を 作成
```

---

## [Bug] Known Limitations (Tech Preview)

- No grammar validation (any block combination is accepted)
- No project save/load functionality
- Limited block types (only Noun and Other)
- No undo/redo functionality
- No keyboard shortcuts

These limitations are intentional for the Tech Preview and will be addressed in future releases.

---

## [Handshake] How to Help

### We Need Your Feedback!

1. **Try the application** and create some prompts
2. **Report bugs** using our [Bug Report template](https://github.com/BonoJovi/Promps/issues/new?template=bug_report.md)
3. **Suggest features** using our [Feature Request template](https://github.com/BonoJovi/Promps/issues/new?template=feature_request.md)
4. **Share general feedback** using our [Feedback template](https://github.com/BonoJovi/Promps/issues/new?template=custom.md)

### Testing Checklist

Help us by testing these scenarios:

- [ ] Install and launch on your platform (Linux/Windows/macOS)
- [ ] Create a simple prompt with Noun blocks only
- [ ] Create a prompt with mixed Noun and Other blocks
- [ ] Test the real-time preview updates
- [ ] Copy the generated prompt and use it with an AI assistant
- [ ] Try different block combinations
- [ ] Report any crashes or unexpected behavior

---

## [Road]️ Roadmap

Based on this Tech Preview feedback, we plan to implement:

- **v0.1.0**: More block types (particles, verbs, adjectives as separate types)
- **v0.2.0**: Grammar validation and pattern matching
- **v0.3.0**: Project save/load functionality
- **v0.4.0**: Undo/redo and keyboard shortcuts
- **v1.0.0**: Full release with all planned features

*Roadmap subject to change based on community feedback!*

---

## [Note] Full Changelog

### Added
- Visual block-based prompt builder interface
- Noun block type with automatic `(NOUN)` marking
- Other block type for particles, verbs, and other words
- Real-time prompt preview panel
- Drag-and-drop block placement
- Vertical block connection
- Desktop application support (Linux, Windows, macOS)

---

## [List] Documentation

- [README](https://github.com/BonoJovi/Promps/blob/main/README.md)
- [Contributing Guide](https://github.com/BonoJovi/Promps/blob/main/CONTRIBUTING.md)
- [Security Policy](https://github.com/BonoJovi/Promps/blob/main/SECURITY.md)

---

## [Email] Contact

- **Issues**: https://github.com/BonoJovi/Promps/issues
- **Email**: promps-dev@zundou.org

---

## [Thanks] Thank You!

Thank you for being an early tester of Promps! Your feedback is invaluable and will directly influence the project's direction.

**This is just the beginning** - let's build something amazing together! [Rocket]

---

**Built with ❤️ for better AI collaboration**

---

# 日本語版

# Promps v0.0.1 - テクノロジープレビュー

## ⚠️ テックプレビューについて

**これはテクノロジープレビューリリースです** - コンセプトをテストし、コミュニティからのフィードバックを収集するための早期バージョンです。

**これが意味すること:**
- ✅ **コア機能は動作します** テスト準備完了
- ⚠️ **機能は限定的** - 名詞ブロックとその他ブロックのみ
- ⚠️ **文法チェックなし** - どんなブロックの組み合わせも許可
- ⚠️ **プロジェクト保存/読込なし** - セッションは永続化されません
- [Bug] **バグは想定内** - 見つけたら報告してください！

**テスターを募集中！** あなたのフィードバックが Promps の未来を形作ります。

---

## [Target] v0.0.1 に含まれるもの

### 機能
- ✅ ビジュアルブロックベースインターフェース（Blockly.js 使用）
- ✅ リアルタイムプロンプトプレビュー
- ✅ 自動名詞検出と `(NOUN)` マーキング
- ✅ シンプルなドラッグ＆ドロップ操作
- ✅ デスクトップアプリケーション（Tauri + Rust）

### ブロックタイプ
- **名詞ブロック**: "User"、"Order"、"Database" などのエンティティ用
- **その他ブロック**: 助詞、動詞、形容詞、接続詞用

---

## [Download] インストール

### バイナリをダウンロード

プラットフォームに適したバイナリを選択：

- **Linux**: `promps_0.0.1_amd64.AppImage` または `promps_0.0.1_amd64.deb`
- **Windows**: `promps_0.0.1_x64_en-US.msi`
- **macOS**: `promps_0.0.1_x64.dmg`（Intel）または `promps_0.0.1_aarch64.dmg`（Apple Silicon）

### ソースからビルド

```bash
git clone https://github.com/BonoJovi/Promps.git
cd Promps
git checkout v0.0.1
cargo tauri build
```

---

## [Rocket] クイックスタート

1. **Promps を起動**
2. **左パネルからブロックをドラッグ** してワークスペースに配置
3. **ブロックを縦に接続** して文を形成
4. **右パネルでプロンプトが生成される** のをリアルタイムで確認
5. **生成されたプロンプトをコピー** して AI アシスタントで使用

### 例

**ブロック:**
```
[名詞: User] → [その他: が] → [名詞: Order] → [その他: を] → [その他: 作成]
```

**生成される出力:**
```
User (NOUN) が Order (NOUN) を 作成
```

---

## [Bug] 既知の制限事項（テックプレビュー）

- 文法チェックなし（どんなブロックの組み合わせも受け入れられます）
- プロジェクト保存/読込機能なし
- 限定的なブロックタイプ（名詞とその他のみ）
- アンドゥ/リドゥ機能なし
- キーボードショートカットなし

これらの制限はテックプレビューでは意図的なもので、将来のリリースで対応されます。

---

## [Handshake] 協力方法

### フィードバックをお願いします！

1. **アプリケーションを試して** プロンプトを作成してみてください
2. **バグを報告** - [バグレポートテンプレート](https://github.com/BonoJovi/Promps/issues/new?template=バグレポート.md)を使用
3. **機能を提案** - [機能リクエストテンプレート](https://github.com/BonoJovi/Promps/issues/new?template=機能リクエスト.md)を使用
4. **一般的なフィードバックを共有** - [フィードバックテンプレート](https://github.com/BonoJovi/Promps/issues/new?template=カスタム課題テンプレート.md)を使用

### テストチェックリスト

以下のシナリオをテストして協力してください：

- [ ] プラットフォーム（Linux/Windows/macOS）でインストールと起動
- [ ] 名詞ブロックのみでシンプルなプロンプトを作成
- [ ] 名詞ブロックとその他ブロックを混在させたプロンプトを作成
- [ ] リアルタイムプレビューの更新をテスト
- [ ] 生成されたプロンプトをコピーして AI アシスタントで使用
- [ ] 異なるブロックの組み合わせを試す
- [ ] クラッシュや予期しない動作を報告

---

## [Road]️ ロードマップ

このテックプレビューのフィードバックに基づいて実装予定：

- **v0.1.0**: より多くのブロックタイプ（助詞、動詞、形容詞を別タイプとして）
- **v0.2.0**: 文法チェックとパターンマッチング
- **v0.3.0**: プロジェクト保存/読込機能
- **v0.4.0**: アンドゥ/リドゥとキーボードショートカット
- **v1.0.0**: 計画されたすべての機能を含む正式リリース

*ロードマップはコミュニティのフィードバックに基づいて変更される可能性があります！*

---

## [Note] 完全な変更履歴

### 追加
- ビジュアルブロックベースのプロンプトビルダーインターフェース
- 自動 `(NOUN)` マーキング付き名詞ブロックタイプ
- 助詞、動詞、その他の単語用のその他ブロックタイプ
- リアルタイムプロンプトプレビューパネル
- ドラッグ＆ドロップブロック配置
- 縦方向のブロック接続
- デスクトップアプリケーションサポート（Linux、Windows、macOS）

---

## [List] ドキュメント

- [README](https://github.com/BonoJovi/Promps/blob/main/README.md)
- [貢献ガイド](https://github.com/BonoJovi/Promps/blob/main/CONTRIBUTING.md)
- [セキュリティポリシー](https://github.com/BonoJovi/Promps/blob/main/SECURITY.md)

---

## [Email] 連絡先

- **Issues**: https://github.com/BonoJovi/Promps/issues
- **Email**: promps-dev@zundou.org

---

## [Thanks] ありがとうございます！

Promps の初期テスターになっていただきありがとうございます！あなたのフィードバックは非常に貴重で、プロジェクトの方向性に直接影響します。

**これは始まりに過ぎません** - 一緒に素晴らしいものを作りましょう！[Rocket]

---

**より良い AI コラボレーションのために ❤️ を込めて作成**
