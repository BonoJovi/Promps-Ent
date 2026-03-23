# GitHub Discussions セットアップガイド

**最終更新**: 2025-12-07

---

## [List] セットアップ手順

### ステップ 1: ディスカッション機能を有効化

1. https://github.com/BonoJovi/Promps にアクセス
2. **Settings** タブをクリック
3. 左サイドバーの **General** を選択
4. **Features** セクションまでスクロール
5. ✅ **Discussions** にチェックを入れる
6. **Save changes** をクリック

---

### ステップ 2: カテゴリーの設定

ディスカッション機能を有効化すると、**Discussions** タブが表示されます。

**推奨カテゴリー構成:**

| カテゴリー名 | 絵文字 | タイプ | 説明 |
|------------|--------|--------|------|
| Announcements | [Announce] | Announcement | 新バージョンリリース、重要なお知らせ（管理者のみ投稿可） |
| Ideas | [Idea] | Open Discussion | 新機能の提案、改善アイデア |
| Q&A | [Thanks] | Q&A | 使い方の質問、トラブルシューティング |
| General | [Speech]️ | Open Discussion | 雑談、フィードバック、コミュニティ交流 |
| Development | [Tools]️ | Open Discussion | 開発に関する議論、設計判断 |
| Documentation | [Books] | Open Discussion | ドキュメント改善の提案 |

**設定手順:**

1. **Discussions** タブ → 右上の ⚙️（設定アイコン）をクリック
2. **Categories** セクションで **New category** をクリック
3. 上記の表に従って各カテゴリーを作成：
   - **Name**: カテゴリー名（英語）
   - **Emoji**: 絵文字を選択
   - **Description**: カテゴリーの説明（日本語でもOK）
   - **Format**: タイプを選択（Announcement / Open Discussion / Q&A）
4. **Create** をクリック

**既存のデフォルトカテゴリー:**
- 不要なデフォルトカテゴリーは削除してOK
- "General" は残すことを推奨

---

### ステップ 3: テンプレートの適用確認

このリポジトリには、以下のテンプレートが既に用意されています：

```
.github/DISCUSSION_TEMPLATE/
├── ideas.yml           # [Idea] Ideas カテゴリー用
├── question.yml        # [Thanks] Q&A カテゴリー用
├── general.yml         # [Speech]️ General カテゴリー用
├── development.yml     # [Tools]️ Development カテゴリー用
└── documentation.yml   # [Books] Documentation カテゴリー用
```

**テンプレートの適用:**

1. 上記ファイルをGitHubにpushする（このガイドの最後を参照）
2. 各カテゴリーの設定画面で **Discussion template** を選択
3. 対応するテンプレートファイル名を指定

例：
- Ideas カテゴリー → `ideas.yml`
- Q&A カテゴリー → `question.yml`

---

### ステップ 4: カテゴリーの並び替え

カテゴリーは以下の順序で表示されることを推奨：

1. [Announce] Announcements
2. [Idea] Ideas
3. [Thanks] Q&A
4. [Speech]️ General
5. [Tools]️ Development
6. [Books] Documentation

**並び替え方法:**
- Categories設定画面でドラッグ&ドロップ

---

### ステップ 5: ピン留め・ウェルカムメッセージ

**最初のディスカッションを作成:**

1. **General** カテゴリーに「Welcome to Promps Discussions!」投稿を作成
2. ディスカッションのガイドラインを簡潔に説明
3. [Pin] ピン留めする（投稿の右上メニュー → Pin discussion）

**ウェルカムメッセージの例:**

```markdown
# Welcome to Promps Discussions! [Party]

Prompsプロジェクトのディスカッションへようこそ！

## [Folder] カテゴリーの使い分け

- **[Idea] Ideas**: 新機能の提案や改善アイデア
- **[Thanks] Q&A**: 使い方の質問やトラブルシューティング
- **[Speech]️ General**: 雑談、フィードバック、使用事例の共有
- **[Tools]️ Development**: 開発に関する技術的な議論
- **[Books] Documentation**: ドキュメントの改善提案

詳しくは [DISCUSSIONS.md](../blob/dev/.github/DISCUSSIONS.md) をご覧ください。

## [Handshake] 行動規範

このコミュニティは [Code of Conduct](../blob/dev/CODE_OF_CONDUCT.md) に従います。
敬意を持った建設的な議論を心がけましょう。

## [Party] コントリビューション歓迎！

小さな質問や提案でも大歓迎です。気軽に投稿してください！
```

---

## [Fix] Git操作（このファイルをリポジトリに追加）

作成したファイルをコミット・プッシュします：

```bash
# ステージング
git add .github/DISCUSSIONS.md
git add .github/DISCUSSIONS_SETUP.md
git add .github/DISCUSSION_TEMPLATE/

# コミット
git commit -m "docs(discussions): add GitHub Discussions setup and templates

- Add DISCUSSIONS.md (運用ガイドライン)
- Add DISCUSSIONS_SETUP.md (セットアップ手順)
- Add discussion templates for 5 categories:
  - ideas.yml (アイデア提案)
  - question.yml (質問・Q&A)
  - general.yml (一般議論)
  - development.yml (開発議論)
  - documentation.yml (ドキュメント改善)
"

# プッシュ（devブランチ）
git pull --rebase origin dev
git push origin dev
```

---

## ✅ 確認事項

セットアップ完了後、以下を確認してください：

- [ ] Discussions タブが表示される
- [ ] 6つのカテゴリーが作成されている
- [ ] 各カテゴリーにテンプレートが設定されている
- [ ] Announcementsカテゴリーが管理者のみ投稿可能になっている
- [ ] Welcomeディスカッションがピン留めされている
- [ ] DISCUSSIONS.mdへのリンクが機能している

---

## [Books] 関連ドキュメント

- [DISCUSSIONS.md](DISCUSSIONS.md) - 運用ガイドライン
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 貢献ガイドライン
- [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) - 行動規範

---

## [Idea] Tips

### ディスカッションからIssueへの変換

有用なディスカッションは、後でIssueに変換できます：

1. ディスカッション画面右側の **...** メニュー
2. **Convert to issue** を選択
3. リポジトリとラベルを選択して変換

### モデレーション

不適切な投稿があった場合：

1. 投稿の右上 **...** メニュー → **Edit** または **Delete**
2. 必要に応じて **Lock discussion** で新規コメントを制限
3. 深刻な場合は **Report content** でGitHubに報告

### 通知設定

ディスカッションの通知を受け取るには：

1. リポジトリページの右上 **Watch** → **Custom**
2. ✅ **Discussions** にチェック
3. **Apply** をクリック

---

**セットアップに関する質問は、Discussions（General カテゴリー）で受け付けます！**
