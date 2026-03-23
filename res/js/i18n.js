/**
 * Promps - Internationalization (i18n) Module
 *
 * Provides UI translation support for Japanese/English switching.
 * In Japanese mode: generates Japanese prompts with particles and verbs
 * In English mode: generates English prompts with English grammar
 */

/**
 * Translation data for all supported languages
 */
const TRANSLATIONS = {
    ja: {
        // Common Dialog
        'dialog.ok': 'OK',
        'dialog.cancel': 'キャンセル',

        // Header & Toolbar
        'app.subtitle': 'ビジュアルプロンプト言語ジェネレーター',
        'toolbar.new': '新規',
        'toolbar.new.title': '新規プロジェクト (Ctrl+N)',
        'toolbar.open': '開く',
        'toolbar.open.title': 'プロジェクトを開く (Ctrl+O)',
        'toolbar.save': '保存',
        'toolbar.save.title': 'プロジェクトを保存 (Ctrl+S)',
        'toolbar.saveAs': '名前を付けて保存',
        'toolbar.saveAs.title': '名前を付けて保存 (Ctrl+Shift+S)',
        'toolbar.theme': 'テーマ',
        'toolbar.theme.title.toDark': 'ダークモードへ切替',
        'toolbar.theme.title.toLight': 'ライトモードへ切替',
        'toolbar.lang': 'JA',
        'toolbar.lang.title': 'Switch to English',

        // Workspace & Preview
        'workspace.title': 'ワークスペース',
        'workspace.loading': 'Blocklyワークスペースを読み込み中...',
        'preview.title': '生成されたプロンプト',
        'preview.placeholder': '生成されたプロンプトがここに表示されます。',
        // Validation
        'validation.passed': '文法チェック OK',
        'validation.error': 'エラー',
        'validation.errors': 'エラー',
        'validation.warning': '警告',
        'validation.warnings': '警告',

        // Block Counter (v1.1.0)
        'blocks.counter.label': 'ブロック',
        'blocks.warning.threshold': 'ブロック数が多くなっています。プロンプトの簡略化を検討してください。',
        'blocks.warning.limit': 'ブロック数の上限（100）に達しました。追加するには既存のブロックを削除してください。',

        // Pattern Templates (Phase 6)
        'pattern.header': 'パターンテンプレート',
        'pattern.apply': '適用',
        'pattern.example': '例',
        'suggestion.header': 'おすすめパターン',
        'suggestion.complete': '完成',
        'suggestion.apply': '適用',

        // Template (Macro) Feature
        'toolbox.myTemplates': 'マイテンプレート',
        'template.saveAs': 'テンプレートとして保存',
        'template.enterName': 'テンプレート名を入力:',
        'template.empty': '保存されたテンプレートはありません',
        'template.delete': '削除',
        'template.deleteConfirm': 'このテンプレートを削除しますか？',
        'template.save': '保存',
        'template.cancel': 'キャンセル',
        'template.namePlaceholder': 'テンプレート名',
        // v1.2.0 Template Editor
        'template.edit': '編集',
        'template.export': 'エクスポート',
        'template.import': 'テンプレートをインポート',
        'template.editor.title': 'テンプレートを編集',
        'template.editor.name': 'テンプレート名',
        'template.editor.description': '説明',
        'template.editor.icon': 'アイコン',
        'template.editor.color': '色',
        'template.editor.category': 'カテゴリ',
        'template.editor.preview': 'プレビュー',
        'template.editor.save': '保存',
        'template.editor.cancel': 'キャンセル',
        'template.export.success': 'テンプレートをエクスポートしました',
        'template.export.failed': 'エクスポートに失敗しました',
        'template.import.success': 'テンプレートをインポートしました',
        'template.import.failed': 'インポートに失敗しました',
        'template.editor.newCategory': '+ 新規',
        'template.editor.nameRequired': 'テンプレート名を入力してください。',
        'template.editor.saveFailed': 'テンプレートの保存に失敗しました。',
        'template.editor.descriptionPlaceholder': '説明（任意）',
        // v1.2.0 Category Management
        'category.default': 'デフォルト',
        'category.favorites': 'お気に入り',
        'category.recent': '最近使用',
        'category.custom': 'カスタム',
        'category.add': '追加',
        'category.edit': '編集',
        'category.delete': '削除',
        'category.enterName': 'カテゴリ名を入力:',
        'category.manage': 'カテゴリ管理',
        'category.close': '閉じる',
        'category.system': 'システム',
        'category.deleteConfirm': 'このカテゴリを削除しますか？',
        // Category Editor Modal
        'category.editor.title': 'カテゴリ管理',
        'category.editor.placeholder': '新しいカテゴリ名',
        'category.editor.add': '追加',
        'common.close': '閉じる',

        // Blockly Category Names
        'blockly.category.noun': '名詞',
        'blockly.category.particle': '助詞',
        'blockly.category.article': '冠詞',
        'blockly.category.verb': '動詞',
        'blockly.category.punctuation': '句読点',
        'blockly.category.other': 'その他',

        // Blockly Block Labels (displayed on blocks)
        'blockly.noun.label': '名詞:',
        'blockly.other.label': 'その他:',
        'blockly.verb.label': '動詞:',

        // Particle Labels
        'blockly.particle.ga.label': 'が',
        'blockly.particle.wo.label': 'を',
        'blockly.particle.ni.label': 'に',
        'blockly.particle.de.label': 'で',
        'blockly.particle.to.label': 'と',
        'blockly.particle.he.label': 'へ',
        'blockly.particle.kara.label': 'から',
        'blockly.particle.made.label': 'まで',
        'blockly.particle.yori.label': 'より',

        // Particle DSL Output
        'blockly.particle.ga.output': 'が ',
        'blockly.particle.wo.output': 'を ',
        'blockly.particle.ni.output': 'に ',
        'blockly.particle.de.output': 'で ',
        'blockly.particle.to.output': 'と ',
        'blockly.particle.he.output': 'へ ',
        'blockly.particle.kara.output': 'から ',
        'blockly.particle.made.output': 'まで ',
        'blockly.particle.yori.output': 'より ',

        // Article Labels (English mode only, but keys needed for consistency)
        'blockly.article.a.label': 'a',
        'blockly.article.an.label': 'an',
        'blockly.article.the.label': 'the',
        'blockly.article.this.label': 'this',
        'blockly.article.that.label': 'that',
        'blockly.article.please.label': 'please',

        // Article DSL Output
        'blockly.article.a.output': 'a ',
        'blockly.article.an.output': 'an ',
        'blockly.article.the.output': 'the ',
        'blockly.article.this.output': 'this ',
        'blockly.article.that.output': 'that ',
        'blockly.article.please.output': 'please ',

        // Article Tooltips
        'blockly.article.a.tooltip': '不定冠詞（子音で始まる単数名詞用）',
        'blockly.article.an.tooltip': '不定冠詞（母音で始まる単数名詞用）',
        'blockly.article.the.tooltip': '定冠詞（特定の名詞用）',
        'blockly.article.this.tooltip': '指示詞（近くのもの）',
        'blockly.article.that.tooltip': '指示詞（遠くのもの）',
        'blockly.article.please.tooltip': '丁寧な依頼',

        // Verb Labels
        'blockly.verb.analyze.label': '分析して',
        'blockly.verb.summarize.label': '要約して',
        'blockly.verb.translate.label': '翻訳して',
        'blockly.verb.create.label': '作成して',
        'blockly.verb.generate.label': '生成して',
        'blockly.verb.convert.label': '変換して',
        'blockly.verb.delete.label': '削除して',
        'blockly.verb.update.label': '更新して',
        'blockly.verb.extract.label': '抽出して',
        'blockly.verb.explain.label': '説明して',
        'blockly.verb.describe.label': '解説して',
        'blockly.verb.teach.label': '教えて',
        'blockly.verb.custom.default': '作成して',

        // Verb DSL Output
        'blockly.verb.analyze.output': '分析して ',
        'blockly.verb.summarize.output': '要約して ',
        'blockly.verb.translate.output': '翻訳して ',
        'blockly.verb.create.output': '作成して ',
        'blockly.verb.generate.output': '生成して ',
        'blockly.verb.convert.output': '変換して ',
        'blockly.verb.delete.output': '削除して ',
        'blockly.verb.update.output': '更新して ',
        'blockly.verb.extract.output': '抽出して ',
        'blockly.verb.explain.output': '説明して ',
        'blockly.verb.describe.output': '解説して ',
        'blockly.verb.teach.output': '教えて ',

        // Punctuation Labels & Output (same in both modes)
        'blockly.punct.touten.label': '、',
        'blockly.punct.kuten.label': '。',
        'blockly.punct.exclaim.label': '！',
        'blockly.punct.question.label': '？',
        'blockly.punct.dquote.label': '"',
        'blockly.punct.squote.label': "'",
        'blockly.punct.comma.label': ',',
        'blockly.punct.slash.label': '/',
        'blockly.punct.amp.label': '&',
        'blockly.punct.touten.output': '、 ',
        'blockly.punct.kuten.output': '。 ',
        'blockly.punct.exclaim.output': '！ ',
        'blockly.punct.question.output': '？ ',
        'blockly.punct.dquote.output': '" ',
        'blockly.punct.squote.output': "' ",
        'blockly.punct.comma.output': ', ',
        'blockly.punct.slash.output': '/ ',
        'blockly.punct.amp.output': '& ',
        'blockly.punct.period.label': '.',
        'blockly.punct.period.output': '. ',
        'blockly.punct.period.tooltip': '句読点: ピリオド（.）',

        // Blockly Block Tooltips
        'blockly.noun.tooltip': '名詞ブロック (_N: プレフィックス付き)',
        'blockly.other.tooltip': 'その他ブロック (助詞、動詞、形容詞、接続詞など)',
        'blockly.particle.ga.tooltip': '助詞: が（主語を示す）',
        'blockly.particle.wo.tooltip': '助詞: を（目的語を示す）',
        'blockly.particle.ni.tooltip': '助詞: に（方向・対象を示す）',
        'blockly.particle.de.tooltip': '助詞: で（手段・場所を示す）',
        'blockly.particle.to.tooltip': '助詞: と（並列・共同を示す）',
        'blockly.particle.he.tooltip': '助詞: へ（方向を示す）',
        'blockly.particle.kara.tooltip': '助詞: から（起点を示す）',
        'blockly.particle.made.tooltip': '助詞: まで（終点を示す）',
        'blockly.particle.yori.tooltip': '助詞: より（比較を示す）',
        'blockly.verb.analyze.tooltip': '動詞: 分析して',
        'blockly.verb.summarize.tooltip': '動詞: 要約して',
        'blockly.verb.translate.tooltip': '動詞: 翻訳して',
        'blockly.verb.create.tooltip': '動詞: 作成して',
        'blockly.verb.generate.tooltip': '動詞: 生成して',
        'blockly.verb.convert.tooltip': '動詞: 変換して',
        'blockly.verb.delete.tooltip': '動詞: 削除して',
        'blockly.verb.update.tooltip': '動詞: 更新して',
        'blockly.verb.extract.tooltip': '動詞: 抽出して',
        'blockly.verb.explain.tooltip': '動詞: 説明して',
        'blockly.verb.describe.tooltip': '動詞: 解説して',
        'blockly.verb.teach.tooltip': '動詞: 教えて',
        'blockly.verb.custom.tooltip': 'カスタム動詞ブロック',
        'blockly.punct.touten.tooltip': '句読点: 読点（、）',
        'blockly.punct.kuten.tooltip': '句読点: 句点（。）',
        'blockly.punct.exclaim.tooltip': '句読点: 感嘆符（！）',
        'blockly.punct.question.tooltip': '句読点: 疑問符（？）',
        'blockly.punct.dquote.tooltip': '句読点: 二重引用符（"）',
        'blockly.punct.squote.tooltip': "句読点: 引用符（'）",
        'blockly.punct.comma.tooltip': '句読点: カンマ（,）',
        'blockly.punct.slash.tooltip': '句読点: スラッシュ（/）',
        'blockly.punct.amp.tooltip': '句読点: アンパサンド（&）',

        // Validation Error Messages - English Grammar (displayed in Japanese UI)
        'validation.en.articleNotBeforeNoun': '冠詞の後に名詞がありません',
        'validation.en.consecutiveArticles': '冠詞が連続しています',
        'validation.en.prepositionWithoutObject': '前置詞の後に名詞がありません',
        'validation.en.pleasePosition': '「please」は文頭または動詞の前に置いてください',
        'validation.en.periodNotAtEnd': 'ピリオドは文末に置いてください',
        'validation.en.missingVerb': '文に動詞がありません',

        // Project Manager
        'project.unsaved.title': '未保存の変更',
        'project.unsaved.message': '未保存の変更があります。破棄しますか？',
        'project.save.failed': 'プロジェクトの保存に失敗しました',
        'project.load.failed': 'プロジェクトの読み込みに失敗しました',

        // Footer
        'footer.version': 'Promps Ent v2.1.0 - Wizard',

        // Pro Features - Toolbar
        'pro.toolbar.undo': '元に戻す',
        'pro.toolbar.undo.title': '元に戻す (Ctrl+Z) [Ent]',
        'pro.toolbar.redo': 'やり直し',
        'pro.toolbar.redo.title': 'やり直し (Ctrl+Y) [Ent]',
        'pro.toolbar.settings': '設定',
        'pro.toolbar.settings.title': 'APIキー設定 [Ent]',

        // Pro Features - API Key Management
        'pro.apiKey.title': 'APIキー設定',
        'pro.apiKey.description': 'AIサービスのAPIキーを設定します。キーはシステムに安全に保存されます。',
        'pro.apiKey.close': '閉じる',
        'pro.apiKey.edit': '編集',
        'pro.apiKey.save': '保存',
        'pro.apiKey.cancel': 'キャンセル',
        'pro.apiKey.delete': '削除',
        'pro.apiKey.placeholder': 'APIキーを入力...',
        'pro.apiKey.status.set': '設定済み',
        'pro.apiKey.status.notSet': '未設定',
        'pro.apiKey.enterKey': 'APIキーを入力してください。',
        'pro.apiKey.saveFailed': 'APIキーの保存に失敗しました: ',
        'pro.apiKey.deleteFailed': 'APIキーの削除に失敗しました: ',

        // Pro Features - Send to AI
        'pro.sendAi.title': 'AIへ送信',
        'pro.sendAi.selectProvider': 'プロバイダーを選択...',
        'pro.sendAi.selectProviderError': 'AIプロバイダーを選択してください。',
        'pro.sendAi.createPromptFirst': '先にプロンプトを作成してください。',
        'pro.sendAi.sending': '送信中...',
        'pro.sendAi.send': '送信',
        'pro.sendAi.loading': 'AIへ送信中...',

        'pro.apiKey.confirmDelete': '{provider} のAPIキーを削除しますか？',
        'pro.apiKey.loadFailed': 'APIキーの読み込みに失敗しました。バックエンドが起動しているか確認してください。',
        'pro.apiKey.loadError': 'APIキーの読み込みに失敗しました: ',
        'pro.sendAi.error': 'エラー',

        // Pro Features - Export
        'toolbar.export': 'エクスポート',
        'toolbar.export.title': 'エクスポート (Ctrl+E) [Ent]',
        'toolbar.blockFavorites': 'ブロック',
        'toolbar.blockFavorites.title': 'ブロックお気に入り (Ctrl+B) [Ent]',
        'export.title': 'エクスポート',
        'export.type.header': 'エクスポートタイプ',
        'export.type.prompt': 'プロンプトのみ',
        'export.type.promptDesc': '生成されたプロンプトテキストをエクスポート',
        'export.type.project': 'プロジェクト全体',
        'export.type.projectDesc': 'ワークスペース、メタデータ、プロンプトをエクスポート',
        'export.format.header': 'フォーマット',
        'export.format.txtDesc': 'プレーンテキストファイル',
        'export.format.mdDesc': 'ヘッダー付きMarkdown形式',
        'export.format.jsonDesc': '構造化JSONデータ',
        'export.preview.header': 'プレビュー',
        'export.cancel': 'キャンセル',
        'export.export': 'エクスポート',
        'export.success': 'エクスポートしました',
        'export.failed': 'エクスポートに失敗しました',
        'export.noContent': 'エクスポートするプロンプトがありません。先にプロンプトを作成してください。',
        'export.noProject': 'エクスポートするプロジェクトがありません。',

        // Pro Features - Project Sidebar
        'sidebar.projects': 'プロジェクト',
        'sidebar.search.placeholder': 'プロジェクトを検索...',
        'sidebar.recent': '最近のプロジェクト',
        'sidebar.scanFolder': 'フォルダをスキャン',
        'sidebar.noProjects': 'プロジェクトがありません',
        'sidebar.noResults': '一致するプロジェクトがありません',
        'sidebar.toggle': 'サイドバーを切り替え',
        'sidebar.tags': 'タグ',
        'sidebar.clearFilters': 'クリア',

        // Pro Features - Tags
        'tags.edit': 'タグを編集',
        'tags.add': '追加',
        'tags.addPlaceholder': 'タグを追加...',
        'tags.remove': '削除',
        'tags.noTags': 'タグなし',
        'tags.suggested': '既存のタグ',
        'common.save': '保存',
        'common.cancel': 'キャンセル',
        'template.editor.noCategory': 'カテゴリなし',

        // Pro Features - Folder Scan
        'scan.selectFolder': 'スキャンするフォルダを選択',
        'scan.found': '{count}件のプロジェクトが見つかりました',
        'scan.noProjects': 'プロジェクトが見つかりませんでした',
        'scan.error': 'スキャンに失敗しました',

        // Pro Features - Project Favorites
        'sidebar.favorites': 'お気に入り',
        'favorites.add': 'お気に入りに追加',
        'favorites.remove': 'お気に入りから削除',
        'favorites.empty': 'お気に入りのプロジェクトはありません',

        // Pro Features - Block Favorites
        'blockFavorites.addToFavorites': 'お気に入りに追加',
        'blockFavorites.removeFromFavorites': 'お気に入りから削除',
        'blockFavorites.paletteTitle': 'お気に入りブロック',
        'blockFavorites.empty': 'お気に入りのブロックはありません',
        'blockFavorites.dragHint': 'ワークスペースにドラッグ',
        'blockFavorites.palette.title': 'お気に入り',
        'blockFavorites.palette.empty': 'お気に入りはありません',
        'blockFavorites.palette.hint': 'ブロックを右クリックして追加',
        'blockFavorites.remove': '削除',

        // Ent Features - Color Theme
        'colorTheme.title': 'カラーテーマ設定',
        'colorTheme.colors': 'カラー',
        'colorTheme.lightMode': 'ライトモード',
        'colorTheme.darkMode': 'ダークモード',
        'colorTheme.group.primary': '基本カラー',
        'colorTheme.group.blockly': 'Blocklyワークスペース',
        'colorTheme.group.accent': 'アクセントカラー',
        'colorTheme.bgPrimary': '背景（メイン）',
        'colorTheme.bgSurface': '背景（サーフェス）',
        'colorTheme.bgHeader': 'ヘッダー背景',
        'colorTheme.textPrimary': 'テキスト（メイン）',
        'colorTheme.accentPrimary': 'アクセント（メイン）',
        'colorTheme.blocklyWorkspace': 'ワークスペース背景',
        'colorTheme.blocklyToolbox': 'ツールボックス背景',
        'colorTheme.blocklyFlyout': 'フライアウト背景',
        'colorTheme.accentSuccess': '成功カラー',
        'colorTheme.accentError': 'エラーカラー',
        'colorTheme.accentWarning': '警告カラー',
        'colorTheme.apply': '適用',
        'colorTheme.cancel': 'キャンセル',
        'colorTheme.reset': 'リセット',
        'colorTheme.resetConfirm': '{mode}の色をデフォルトに戻しますか？',

        // AI Import (Ent v1.5.0)
        'ent.import.title': 'AIインポート',
        'ent.import.analyzing': '解析中...',
        'ent.import.noResponse': 'AIからの応答がありません',
        'ent.import.noTokens': 'トークンが見つかりません',
        'ent.import.error': 'インポートエラー',

        // Ent Features - AI Compare (v1.5.0)
        'ent.compare.title': 'AI比較',
        'ent.compare.compareBtn': '比較',
        'ent.compare.selectProviders': 'プロバイダーを選択',
        'ent.compare.prompt': 'プロンプト',
        'ent.compare.results': '結果',
        'ent.compare.close': '閉じる',
        'ent.compare.compare': '比較開始',
        'ent.compare.sending': '送信中...',
        'ent.compare.noProviders': '2つ以上のプロバイダーを選択してください。',
        'ent.compare.noPrompt': '先にプロンプトを作成してください。',
        'ent.compare.noApiKey': 'APIキー未設定',
        'ent.compare.elapsed': '{ms}ms',
        'ent.compare.totalTime': '合計: {ms}ms',
        'ent.compare.copy': 'コピー',
        'ent.compare.copied': 'コピー済み',
        'ent.compare.error': 'エラー',
        'ent.compare.selectModel': 'モデルを選択',
        'ent.compare.configureKey': 'キーを設定',

        // v2.0.0: QR Code Sharing
        'toolbar.qrShare': 'QR',
        'toolbar.qrShare.title': 'QRコード共有 [Ent]',
        'qr.title': 'QRコード共有',
        'qr.tab.generate': '生成',
        'qr.tab.import': 'インポート',
        'qr.generate': 'QRコード生成',
        'qr.save': 'QRを保存',
        'qr.importFile': 'QRファイルを読込',
        'qr.noDsl': 'プロンプトがありません。先にプロンプトを作成してください。',
        'qr.dataSize': 'データサイズ: {size} バイト',
        'qr.generated': 'QRコードを生成しました',
        'qr.generateFailed': 'QRコード生成に失敗しました',
        'qr.saved': 'QRコードを保存しました',
        'qr.saveFailed': 'QRコード保存に失敗しました',
        'qr.decodeFailed': 'QRコード読み取りに失敗しました',
        'qr.imported': 'QRコードからインポートしました',
        'qr.import.name': 'プロジェクト名',
        'qr.import.locale': '言語',
        'qr.import.dsl': 'DSL',
        'qr.import.apply': 'ワークスペースに適用',
        'qr.import.legacyFormat': '旧形式のQRコードです。v2.0.0以降で生成したQRコードをご利用ください。',

        // v2.0.0: LAN P2P File Exchange
        'toolbar.lanShare': 'LAN',
        'toolbar.lanShare.title': 'LAN共有 [Ent]',
        'lan.title': 'LAN共有',
        'lan.start': '共有開始',
        'lan.stop': '共有停止',
        'lan.started': 'LAN共有を開始しました',
        'lan.stopped': 'LAN共有を停止しました',
        'lan.startFailed': 'LAN共有の開始に失敗しました',
        'lan.stopFailed': 'LAN共有の停止に失敗しました',
        'lan.status.active': '共有中',
        'lan.status.inactive': '停止中',
        'lan.peers': '検出されたピア',
        'lan.noPeers': 'ピアが見つかりません',
        'lan.refresh': '更新',
        'lan.send': '送信',
        'lan.sent': 'プロジェクトを送信しました',
        'lan.sendFailed': '送信に失敗しました',
        'lan.noDsl': 'プロンプトがありません。先にプロンプトを作成してください。',
        'lan.pendingTransfers': '受信待ち',
        'lan.from': '送信元',
        'lan.accept': '受入',
        'lan.reject': '拒否',
        'lan.received': 'プロジェクトを受信しました',
        'lan.acceptFailed': '受信に失敗しました',
        'lan.rejected': '転送を拒否しました',
        // v2.1.0: Wizard
        'toolbar.wizard': 'ウィザード',
        'toolbar.wizard.title': 'プロンプトウィザード [Ent]',
        'wizard.title': 'プロンプトウィザード',
        'wizard.intro': 'ウィザードを選んでステップごとにプロンプトを構築します。',
        'wizard.back': '戻る',
        'wizard.next': '次へ',
        'wizard.cancel': 'キャンセル',
        'wizard.apply': '適用',
        'wizard.preview.title': 'プレビュー',
        'wizard.step': 'ステップ',
        'wizard.of': '/',
        'wizard.custom.create': '新規ウィザード作成',
        'wizard.custom.createDesc': '独自のカスタムウィザードを作成',
        'wizard.custom.edit': '編集',
        'wizard.custom.delete': '削除',
        'wizard.custom.deleteConfirm': 'このウィザードを削除しますか？',
        'wizard.editor.title': 'ウィザードエディタ',
        'wizard.editor.name': 'ウィザード名',
        'wizard.editor.description': '説明',
        'wizard.editor.icon': 'アイコン',
        'wizard.editor.steps': 'ステップ',
        'wizard.editor.addStep': 'ステップを追加',
        'wizard.editor.stepTitle': 'ステップタイトル',
        'wizard.editor.stepDescription': 'ステップの説明',
        'wizard.editor.options': 'オプション',
        'wizard.editor.addOption': 'オプションを追加',
        'wizard.editor.blockRules': 'ブロックルール',
        'wizard.editor.addBlock': 'ブロックを追加',
        'wizard.editor.blockType': 'ブロックタイプ',
        'wizard.editor.defaultValue': 'デフォルト値',
        'wizard.editor.save': '保存',
        'wizard.editor.cancel': 'キャンセル',
        'wizard.editor.nameRequired': 'ウィザード名を入力してください',
        'wizard.editor.stepRequired': '最低1つのステップが必要です',
        'wizard.editor.fallbackBlocks': '既定ブロック',
        'wizard.editor.fallbackBlocks.tooltip': 'ルールの条件に一致しない場合に使用されるブロックです',
        'wizard.editor.optionValue': '値',
        'wizard.editor.optionLabel': 'ラベル',
        'wizard.editor.conditions': '条件',
        'wizard.editor.deleteStep': 'ステップを削除',
        'wizard.editor.deleteOption': 'オプションを削除',
        'wizard.editor.deleteRule': 'ルールを削除',
        'wizard.editor.deleteBlock': 'ブロックを削除',
        'wizard.editor.rule': 'ルール',
        'wizard.editor.blocks': 'ブロック',
        'wizard.custom.export': 'エクスポート',
        'wizard.custom.import': 'インポート',
        'wizard.custom.export.success': 'カスタムウィザードをエクスポートしました',
        'wizard.custom.import.success': 'カスタムウィザードをインポートしました',
        'wizard.custom.import.error': 'ファイルの読み込みに失敗しました',
        'wizard.custom.import.invalid': 'ウィザードデータの形式が正しくありません',
        'wizard.custom.import.empty': 'インポートするウィザードがありません',
        'wizard.custom.export.empty': 'エクスポートするカスタムウィザードがありません',
        'wizard.custom.import.count': '{count}件のウィザードをインポートしました',
        'wizard.custom.import.mode': 'インポート方法を選択してください',
        'wizard.custom.import.merge': '追加（既存を保持）',
        'wizard.custom.import.replace': '置換（既存を削除）',
        'wizard.sample': 'サンプル'
    },

    en: {
        // Common Dialog
        'dialog.ok': 'OK',
        'dialog.cancel': 'Cancel',

        // Header & Toolbar
        'app.subtitle': 'Visual Prompt Language Generator',
        'toolbar.new': 'New',
        'toolbar.new.title': 'New Project (Ctrl+N)',
        'toolbar.open': 'Open',
        'toolbar.open.title': 'Open Project (Ctrl+O)',
        'toolbar.save': 'Save',
        'toolbar.save.title': 'Save Project (Ctrl+S)',
        'toolbar.saveAs': 'Save As',
        'toolbar.saveAs.title': 'Save As (Ctrl+Shift+S)',
        'toolbar.theme': 'Theme',
        'toolbar.theme.title.toDark': 'Switch to Dark Mode',
        'toolbar.theme.title.toLight': 'Switch to Light Mode',
        'toolbar.lang': 'EN',
        'toolbar.lang.title': 'Passer en français',

        // Workspace & Preview
        'workspace.title': 'Workspace',
        'workspace.loading': 'Loading Blockly workspace...',
        'preview.title': 'Generated Prompt',
        'preview.placeholder': 'Generated prompt will appear here.',
        // Validation
        'validation.passed': 'Grammar check passed',
        'validation.error': 'error',
        'validation.errors': 'errors',
        'validation.warning': 'warning',
        'validation.warnings': 'warnings',

        // Block Counter (v1.1.0)
        'blocks.counter.label': 'blocks',
        'blocks.warning.threshold': 'Block count is getting high. Consider simplifying your prompt.',
        'blocks.warning.limit': 'Block limit (100) reached. Remove existing blocks to add more.',

        // Pattern Templates (Phase 6)
        'pattern.header': 'Pattern Templates',
        'pattern.apply': 'Apply',
        'pattern.example': 'Example',
        'suggestion.header': 'Recommended Patterns',
        'suggestion.complete': 'Complete',
        'suggestion.apply': 'Apply',

        // Template (Macro) Feature
        'toolbox.myTemplates': 'My Templates',
        'template.saveAs': 'Save as Template',
        'template.enterName': 'Enter template name:',
        'template.empty': 'No templates saved',
        'template.delete': 'Delete',
        'template.deleteConfirm': 'Delete this template?',
        'template.save': 'Save',
        'template.cancel': 'Cancel',
        'template.namePlaceholder': 'Template name',
        // v1.2.0 Template Editor
        'template.edit': 'Edit',
        'template.export': 'Export',
        'template.import': 'Import Template',
        'template.editor.title': 'Edit Template',
        'template.editor.name': 'Template Name',
        'template.editor.description': 'Description',
        'template.editor.icon': 'Icon',
        'template.editor.color': 'Color',
        'template.editor.category': 'Category',
        'template.editor.preview': 'Preview',
        'template.editor.save': 'Save',
        'template.editor.cancel': 'Cancel',
        'template.export.success': 'Template exported successfully',
        'template.export.failed': 'Export failed',
        'template.import.success': 'Template imported',
        'template.import.failed': 'Import failed',
        'template.editor.newCategory': '+ New',
        'template.editor.nameRequired': 'Please enter a template name.',
        'template.editor.saveFailed': 'Failed to save template.',
        'template.editor.descriptionPlaceholder': 'Optional description',
        // v1.2.0 Category Management
        'category.default': 'Default',
        'category.favorites': 'Favorites',
        'category.recent': 'Recently Used',
        'category.custom': 'Custom',
        'category.add': 'Add',
        'category.edit': 'Edit',
        'category.delete': 'Delete',
        'category.enterName': 'Enter category name:',
        'category.manage': 'Manage Categories',
        'category.close': 'Close',
        'category.system': 'System',
        'category.deleteConfirm': 'Delete this category?',
        // Category Editor Modal
        'category.editor.title': 'Manage Categories',
        'category.editor.placeholder': 'New category name',
        'category.editor.add': 'Add',
        'common.close': 'Close',

        // Blockly Category Names
        'blockly.category.noun': 'Noun',
        'blockly.category.particle': 'Connector',
        'blockly.category.article': 'Article',
        'blockly.category.verb': 'Action',
        'blockly.category.punctuation': 'Punctuation',
        'blockly.category.other': 'Other',

        // Blockly Block Labels (displayed on blocks)
        'blockly.noun.label': 'Noun:',
        'blockly.other.label': 'Other:',
        'blockly.verb.label': 'Action:',

        // Connector Labels (English equivalents of Japanese particles)
        'blockly.particle.ga.label': '(subject)',
        'blockly.particle.wo.label': '(object)',
        'blockly.particle.ni.label': 'to',
        'blockly.particle.de.label': 'with',
        'blockly.particle.to.label': 'and',
        'blockly.particle.he.label': 'toward',
        'blockly.particle.kara.label': 'from',
        'blockly.particle.made.label': 'until',
        'blockly.particle.yori.label': 'than',

        // Connector DSL Output (empty for subject/object markers, English for others)
        'blockly.particle.ga.output': '',
        'blockly.particle.wo.output': '',
        'blockly.particle.ni.output': 'to ',
        'blockly.particle.de.output': 'with ',
        'blockly.particle.to.output': 'and ',
        'blockly.particle.he.output': 'toward ',
        'blockly.particle.kara.output': 'from ',
        'blockly.particle.made.output': 'until ',
        'blockly.particle.yori.output': 'than ',

        // Article Labels (English mode only)
        'blockly.article.a.label': 'a',
        'blockly.article.an.label': 'an',
        'blockly.article.the.label': 'the',
        'blockly.article.this.label': 'this',
        'blockly.article.that.label': 'that',
        'blockly.article.please.label': 'please',

        // Article DSL Output
        'blockly.article.a.output': 'a ',
        'blockly.article.an.output': 'an ',
        'blockly.article.the.output': 'the ',
        'blockly.article.this.output': 'this ',
        'blockly.article.that.output': 'that ',
        'blockly.article.please.output': 'please ',

        // Article Tooltips
        'blockly.article.a.tooltip': 'Indefinite article for singular nouns starting with consonant sound',
        'blockly.article.an.tooltip': 'Indefinite article for singular nouns starting with vowel sound',
        'blockly.article.the.tooltip': 'Definite article for specific nouns',
        'blockly.article.this.tooltip': 'Demonstrative for nearby objects',
        'blockly.article.that.tooltip': 'Demonstrative for distant objects',
        'blockly.article.please.tooltip': 'Polite request marker',

        // Action Labels
        'blockly.verb.analyze.label': 'analyze',
        'blockly.verb.summarize.label': 'summarize',
        'blockly.verb.translate.label': 'translate',
        'blockly.verb.create.label': 'create',
        'blockly.verb.generate.label': 'generate',
        'blockly.verb.convert.label': 'convert',
        'blockly.verb.delete.label': 'delete',
        'blockly.verb.update.label': 'update',
        'blockly.verb.extract.label': 'extract',
        'blockly.verb.explain.label': 'explain',
        'blockly.verb.describe.label': 'describe',
        'blockly.verb.teach.label': 'teach',
        'blockly.verb.custom.default': 'process',

        // Action DSL Output
        'blockly.verb.analyze.output': 'analyze ',
        'blockly.verb.summarize.output': 'summarize ',
        'blockly.verb.translate.output': 'translate ',
        'blockly.verb.create.output': 'create ',
        'blockly.verb.generate.output': 'generate ',
        'blockly.verb.convert.output': 'convert ',
        'blockly.verb.delete.output': 'delete ',
        'blockly.verb.update.output': 'update ',
        'blockly.verb.extract.output': 'extract ',
        'blockly.verb.explain.output': 'explain ',
        'blockly.verb.describe.output': 'describe ',
        'blockly.verb.teach.output': 'teach ',

        // Punctuation Labels & Output
        'blockly.punct.touten.label': ',',
        'blockly.punct.kuten.label': '.',
        'blockly.punct.exclaim.label': '!',
        'blockly.punct.question.label': '?',
        'blockly.punct.dquote.label': '"',
        'blockly.punct.squote.label': "'",
        'blockly.punct.comma.label': ',',
        'blockly.punct.slash.label': '/',
        'blockly.punct.amp.label': '&',
        'blockly.punct.touten.output': ', ',
        'blockly.punct.kuten.output': '. ',
        'blockly.punct.exclaim.output': '! ',
        'blockly.punct.question.output': '? ',
        'blockly.punct.dquote.output': '" ',
        'blockly.punct.squote.output': "' ",
        'blockly.punct.comma.output': ', ',
        'blockly.punct.slash.output': '/ ',
        'blockly.punct.amp.output': '& ',
        'blockly.punct.period.label': '.',
        'blockly.punct.period.output': '. ',
        'blockly.punct.period.tooltip': 'Punctuation: period',

        // Blockly Block Tooltips
        'blockly.noun.tooltip': 'Noun block - marks important terms (_N: prefix)',
        'blockly.other.tooltip': 'Other block - for custom text',
        'blockly.particle.ga.tooltip': 'Subject marker - indicates the subject (can be omitted in English)',
        'blockly.particle.wo.tooltip': 'Object marker - indicates the object (can be omitted in English)',
        'blockly.particle.ni.tooltip': 'Direction marker - equivalent to "to"',
        'blockly.particle.de.tooltip': 'Means marker - equivalent to "with" or "by"',
        'blockly.particle.to.tooltip': 'Conjunction - equivalent to "and" or "with"',
        'blockly.particle.he.tooltip': 'Direction marker - equivalent to "toward"',
        'blockly.particle.kara.tooltip': 'Origin marker - equivalent to "from"',
        'blockly.particle.made.tooltip': 'Limit marker - equivalent to "until"',
        'blockly.particle.yori.tooltip': 'Comparison marker - equivalent to "than"',
        'blockly.verb.analyze.tooltip': 'Action: analyze',
        'blockly.verb.summarize.tooltip': 'Action: summarize',
        'blockly.verb.translate.tooltip': 'Action: translate',
        'blockly.verb.create.tooltip': 'Action: create',
        'blockly.verb.generate.tooltip': 'Action: generate',
        'blockly.verb.convert.tooltip': 'Action: convert',
        'blockly.verb.delete.tooltip': 'Action: delete',
        'blockly.verb.update.tooltip': 'Action: update',
        'blockly.verb.extract.tooltip': 'Action: extract',
        'blockly.verb.explain.tooltip': 'Action: explain',
        'blockly.verb.describe.tooltip': 'Action: describe',
        'blockly.verb.teach.tooltip': 'Action: teach',
        'blockly.verb.custom.tooltip': 'Custom action block',
        'blockly.punct.touten.tooltip': 'Punctuation: comma',
        'blockly.punct.kuten.tooltip': 'Punctuation: period',
        'blockly.punct.exclaim.tooltip': 'Punctuation: exclamation mark',
        'blockly.punct.question.tooltip': 'Punctuation: question mark',
        'blockly.punct.dquote.tooltip': 'Punctuation: double quote',
        'blockly.punct.squote.tooltip': 'Punctuation: single quote',
        'blockly.punct.comma.tooltip': 'Punctuation: comma',
        'blockly.punct.slash.tooltip': 'Punctuation: slash',
        'blockly.punct.amp.tooltip': 'Punctuation: ampersand',

        // Validation Error Messages - English Grammar
        'validation.en.articleNotBeforeNoun': 'Article must be followed by a noun',
        'validation.en.consecutiveArticles': 'Consecutive articles not allowed',
        'validation.en.prepositionWithoutObject': 'Preposition must be followed by a noun',
        'validation.en.pleasePosition': '"please" should be at start or before verb',
        'validation.en.periodNotAtEnd': 'Period should be at end of sentence',
        'validation.en.missingVerb': 'Sentence has no verb (action)',

        // Project Manager
        'project.unsaved.title': 'Unsaved Changes',
        'project.unsaved.message': 'You have unsaved changes. Do you want to discard them?',
        'project.save.failed': 'Failed to save project',
        'project.load.failed': 'Failed to load project',

        // Footer
        'footer.version': 'Promps Ent v2.1.0 - Wizard',

        // Pro Features - Toolbar
        'pro.toolbar.undo': 'Undo',
        'pro.toolbar.undo.title': 'Undo (Ctrl+Z) [Ent]',
        'pro.toolbar.redo': 'Redo',
        'pro.toolbar.redo.title': 'Redo (Ctrl+Y) [Ent]',
        'pro.toolbar.settings': 'Settings',
        'pro.toolbar.settings.title': 'API Key Settings [Ent]',

        // Pro Features - API Key Management
        'pro.apiKey.title': 'API Key Settings',
        'pro.apiKey.description': 'Configure your AI service API keys. Keys are securely stored on your system.',
        'pro.apiKey.close': 'Close',
        'pro.apiKey.edit': 'Edit',
        'pro.apiKey.save': 'Save',
        'pro.apiKey.cancel': 'Cancel',
        'pro.apiKey.delete': 'Delete',
        'pro.apiKey.placeholder': 'Enter API key...',
        'pro.apiKey.status.set': 'Set',
        'pro.apiKey.status.notSet': 'Not Set',
        'pro.apiKey.enterKey': 'Please enter an API key.',
        'pro.apiKey.saveFailed': 'Failed to save API key: ',
        'pro.apiKey.deleteFailed': 'Failed to delete API key: ',

        // Pro Features - Send to AI
        'pro.sendAi.title': 'Send to AI',
        'pro.sendAi.selectProvider': 'Select Provider...',
        'pro.sendAi.selectProviderError': 'Please select an AI provider.',
        'pro.sendAi.createPromptFirst': 'Please create a prompt first.',
        'pro.sendAi.sending': 'Sending...',
        'pro.sendAi.send': 'Send',
        'pro.sendAi.loading': 'Sending to AI...',

        'pro.apiKey.confirmDelete': 'Are you sure you want to delete the API key for {provider}?',
        'pro.apiKey.loadFailed': 'Failed to load API keys. Please check if the backend is running.',
        'pro.apiKey.loadError': 'Failed to load API keys: ',
        'pro.sendAi.error': 'Error',

        // Pro Features - Export
        'toolbar.export': 'Export',
        'toolbar.export.title': 'Export (Ctrl+E) [Ent]',
        'toolbar.blockFavorites': 'Blocks',
        'toolbar.blockFavorites.title': 'Block Favorites (Ctrl+B) [Ent]',
        'export.title': 'Export',
        'export.type.header': 'Export Type',
        'export.type.prompt': 'Prompt Only',
        'export.type.promptDesc': 'Export the generated prompt text',
        'export.type.project': 'Full Project',
        'export.type.projectDesc': 'Export workspace, metadata, and prompt',
        'export.format.header': 'Format',
        'export.format.txtDesc': 'Plain text file',
        'export.format.mdDesc': 'Markdown format with header',
        'export.format.jsonDesc': 'Structured JSON data',
        'export.preview.header': 'Preview',
        'export.cancel': 'Cancel',
        'export.export': 'Export',
        'export.success': 'Export successful',
        'export.failed': 'Export failed',
        'export.noContent': 'No prompt to export. Create a prompt first.',
        'export.noProject': 'No project to export.',

        // Pro Features - Project Sidebar
        'sidebar.projects': 'Projects',
        'sidebar.search.placeholder': 'Search projects...',
        'sidebar.recent': 'Recent',
        'sidebar.scanFolder': 'Scan Folder',
        'sidebar.noProjects': 'No recent projects',
        'sidebar.noResults': 'No matching projects',
        'sidebar.toggle': 'Toggle sidebar',
        'sidebar.tags': 'Tags',
        'sidebar.clearFilters': 'Clear',

        // Pro Features - Tags
        'tags.edit': 'Edit Tags',
        'tags.add': 'Add',
        'tags.addPlaceholder': 'Add tag...',
        'tags.remove': 'Remove',
        'tags.noTags': 'No tags',
        'tags.suggested': 'Existing tags',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'template.editor.noCategory': 'No Category',

        // Pro Features - Folder Scan
        'scan.selectFolder': 'Select folder to scan',
        'scan.found': 'Found {count} projects',
        'scan.noProjects': 'No projects found',
        'scan.error': 'Scan failed',

        // Pro Features - Project Favorites
        'sidebar.favorites': 'Favorites',
        'favorites.add': 'Add to favorites',
        'favorites.remove': 'Remove from favorites',
        'favorites.empty': 'No favorite projects',

        // Pro Features - Block Favorites
        'blockFavorites.addToFavorites': 'Add to Favorites',
        'blockFavorites.removeFromFavorites': 'Remove from Favorites',
        'blockFavorites.paletteTitle': 'Favorite Blocks',
        'blockFavorites.empty': 'No favorite blocks',
        'blockFavorites.dragHint': 'Drag to workspace',
        'blockFavorites.palette.title': 'Favorites',
        'blockFavorites.palette.empty': 'No favorites yet',
        'blockFavorites.palette.hint': 'Right-click a block to add',
        'blockFavorites.remove': 'Remove',

        // Ent Features - Color Theme
        'colorTheme.title': 'Color Theme Settings',
        'colorTheme.colors': 'Colors',
        'colorTheme.lightMode': 'Light Mode',
        'colorTheme.darkMode': 'Dark Mode',
        'colorTheme.group.primary': 'Primary Colors',
        'colorTheme.group.blockly': 'Blockly Workspace',
        'colorTheme.group.accent': 'Accent Colors',
        'colorTheme.bgPrimary': 'Background Primary',
        'colorTheme.bgSurface': 'Background Surface',
        'colorTheme.bgHeader': 'Header Background',
        'colorTheme.textPrimary': 'Text Primary',
        'colorTheme.accentPrimary': 'Accent Primary',
        'colorTheme.blocklyWorkspace': 'Workspace Background',
        'colorTheme.blocklyToolbox': 'Toolbox Background',
        'colorTheme.blocklyFlyout': 'Flyout Background',
        'colorTheme.accentSuccess': 'Success Color',
        'colorTheme.accentError': 'Error Color',
        'colorTheme.accentWarning': 'Warning Color',
        'colorTheme.apply': 'Apply',
        'colorTheme.cancel': 'Cancel',
        'colorTheme.reset': 'Reset',
        'colorTheme.resetConfirm': 'Reset {mode} colors to defaults?',

        // AI Import (Ent v1.5.0)
        'ent.import.title': 'AI Import',
        'ent.import.analyzing': 'Analyzing...',
        'ent.import.noResponse': 'No response from AI',
        'ent.import.noTokens': 'No tokens found',
        'ent.import.error': 'Import error',

        // Ent Features - AI Compare (v1.5.0)
        'ent.compare.title': 'AI Compare',
        'ent.compare.compareBtn': 'Compare',
        'ent.compare.selectProviders': 'Select Providers',
        'ent.compare.prompt': 'Prompt',
        'ent.compare.results': 'Results',
        'ent.compare.close': 'Close',
        'ent.compare.compare': 'Compare',
        'ent.compare.sending': 'Sending...',
        'ent.compare.noProviders': 'Please select at least 2 providers.',
        'ent.compare.noPrompt': 'Please create a prompt first.',
        'ent.compare.noApiKey': 'No API key',
        'ent.compare.elapsed': '{ms}ms',
        'ent.compare.totalTime': 'Total: {ms}ms',
        'ent.compare.copy': 'Copy',
        'ent.compare.copied': 'Copied',
        'ent.compare.error': 'Error',
        'ent.compare.selectModel': 'Select model',
        'ent.compare.configureKey': 'Configure key',

        // v2.0.0: QR Code Sharing
        'toolbar.qrShare': 'QR',
        'toolbar.qrShare.title': 'QR Code Share [Ent]',
        'qr.title': 'QR Code Share',
        'qr.tab.generate': 'Generate',
        'qr.tab.import': 'Import',
        'qr.generate': 'Generate QR Code',
        'qr.save': 'Save QR',
        'qr.importFile': 'Import QR File',
        'qr.noDsl': 'No prompt available. Please create a prompt first.',
        'qr.dataSize': 'Data size: {size} bytes',
        'qr.generated': 'QR code generated',
        'qr.generateFailed': 'QR code generation failed',
        'qr.saved': 'QR code saved',
        'qr.saveFailed': 'QR code save failed',
        'qr.decodeFailed': 'QR code decoding failed',
        'qr.imported': 'Imported from QR code',
        'qr.import.name': 'Project Name',
        'qr.import.locale': 'Language',
        'qr.import.dsl': 'DSL',
        'qr.import.apply': 'Apply to Workspace',
        'qr.import.legacyFormat': 'Legacy QR format. Please use a QR code generated with v2.0.0 or later.',

        // v2.0.0: LAN P2P File Exchange
        'toolbar.lanShare': 'LAN',
        'toolbar.lanShare.title': 'LAN Share [Ent]',
        'lan.title': 'LAN Share',
        'lan.start': 'Start Sharing',
        'lan.stop': 'Stop Sharing',
        'lan.started': 'LAN sharing started',
        'lan.stopped': 'LAN sharing stopped',
        'lan.startFailed': 'Failed to start LAN sharing',
        'lan.stopFailed': 'Failed to stop LAN sharing',
        'lan.status.active': 'Active',
        'lan.status.inactive': 'Inactive',
        'lan.peers': 'Discovered Peers',
        'lan.noPeers': 'No peers found',
        'lan.refresh': 'Refresh',
        'lan.send': 'Send',
        'lan.sent': 'Project sent',
        'lan.sendFailed': 'Failed to send',
        'lan.noDsl': 'No prompt available. Please create a prompt first.',
        'lan.pendingTransfers': 'Pending Transfers',
        'lan.from': 'From',
        'lan.accept': 'Accept',
        'lan.reject': 'Reject',
        'lan.received': 'Project received',
        'lan.acceptFailed': 'Failed to accept transfer',
        'lan.rejected': 'Transfer rejected',
        // v2.1.0: Wizard
        'toolbar.wizard': 'Wizard',
        'toolbar.wizard.title': 'Prompt Wizard [Ent]',
        'wizard.title': 'Prompt Wizard',
        'wizard.intro': 'Select a wizard to build your prompt step by step.',
        'wizard.back': 'Back',
        'wizard.next': 'Next',
        'wizard.cancel': 'Cancel',
        'wizard.apply': 'Apply',
        'wizard.preview.title': 'Preview',
        'wizard.step': 'Step',
        'wizard.of': 'of',
        'wizard.custom.create': 'Create New Wizard',
        'wizard.custom.createDesc': 'Create your own custom wizard',
        'wizard.custom.edit': 'Edit',
        'wizard.custom.delete': 'Delete',
        'wizard.custom.deleteConfirm': 'Delete this wizard?',
        'wizard.editor.title': 'Wizard Editor',
        'wizard.editor.name': 'Wizard Name',
        'wizard.editor.description': 'Description',
        'wizard.editor.icon': 'Icon',
        'wizard.editor.steps': 'Steps',
        'wizard.editor.addStep': 'Add Step',
        'wizard.editor.stepTitle': 'Step Title',
        'wizard.editor.stepDescription': 'Step Description',
        'wizard.editor.options': 'Options',
        'wizard.editor.addOption': 'Add Option',
        'wizard.editor.blockRules': 'Block Rules',
        'wizard.editor.addBlock': 'Add Block',
        'wizard.editor.blockType': 'Block Type',
        'wizard.editor.defaultValue': 'Default Value',
        'wizard.editor.save': 'Save',
        'wizard.editor.cancel': 'Cancel',
        'wizard.editor.nameRequired': 'Please enter a wizard name',
        'wizard.editor.stepRequired': 'At least one step is required',
        'wizard.editor.fallbackBlocks': 'Default Blocks',
        'wizard.editor.fallbackBlocks.tooltip': 'Blocks used when no rule conditions match',
        'wizard.editor.optionValue': 'Value',
        'wizard.editor.optionLabel': 'Label',
        'wizard.editor.conditions': 'Conditions',
        'wizard.editor.deleteStep': 'Delete Step',
        'wizard.editor.deleteOption': 'Delete Option',
        'wizard.editor.deleteRule': 'Delete Rule',
        'wizard.editor.deleteBlock': 'Delete Block',
        'wizard.editor.rule': 'Rule',
        'wizard.editor.blocks': 'Blocks',
        'wizard.custom.export': 'Export',
        'wizard.custom.import': 'Import',
        'wizard.custom.export.success': 'Custom wizards exported successfully',
        'wizard.custom.import.success': 'Custom wizards imported successfully',
        'wizard.custom.import.error': 'Failed to read file',
        'wizard.custom.import.invalid': 'Invalid wizard data format',
        'wizard.custom.import.empty': 'No wizards to import',
        'wizard.custom.export.empty': 'No custom wizards to export',
        'wizard.custom.import.count': '{count} wizard(s) imported',
        'wizard.custom.import.mode': 'Choose import method',
        'wizard.custom.import.merge': 'Merge (keep existing)',
        'wizard.custom.import.replace': 'Replace (remove existing)',
        'wizard.sample': 'Sample'
    },

    fr: {
        // Common Dialog
        'dialog.ok': 'OK',
        'dialog.cancel': 'Annuler',

        // Header & Toolbar
        'app.subtitle': 'Générateur visuel de langage de prompt',
        'toolbar.new': 'Nouveau',
        'toolbar.new.title': 'Nouveau projet (Ctrl+N)',
        'toolbar.open': 'Ouvrir',
        'toolbar.open.title': 'Ouvrir un projet (Ctrl+O)',
        'toolbar.save': 'Enregistrer',
        'toolbar.save.title': 'Enregistrer le projet (Ctrl+S)',
        'toolbar.saveAs': 'Enregistrer sous',
        'toolbar.saveAs.title': 'Enregistrer sous (Ctrl+Shift+S)',
        'toolbar.theme': 'Thème',
        'toolbar.theme.title.toDark': 'Passer au mode sombre',
        'toolbar.theme.title.toLight': 'Passer au mode clair',
        'toolbar.lang': 'FR',
        'toolbar.lang.title': '日本語に切り替え',

        // Workspace & Preview
        'workspace.title': 'Espace de travail',
        'workspace.loading': 'Chargement de l\'espace Blockly...',
        'preview.title': 'Prompt généré',
        'preview.placeholder': 'Le prompt généré apparaîtra ici.',
        // Validation
        'validation.passed': 'Vérification grammaticale OK',
        'validation.error': 'erreur',
        'validation.errors': 'erreurs',
        'validation.warning': 'avertissement',
        'validation.warnings': 'avertissements',

        // Block Counter (v1.1.0)
        'blocks.counter.label': 'blocs',
        'blocks.warning.threshold': 'Le nombre de blocs est élevé. Envisagez de simplifier votre prompt.',
        'blocks.warning.limit': 'Limite de blocs (100) atteinte. Supprimez des blocs existants pour en ajouter.',

        // Pattern Templates (Phase 6)
        'pattern.header': 'Modèles de patron',
        'pattern.apply': 'Appliquer',
        'pattern.example': 'Exemple',
        'suggestion.header': 'Patrons recommandés',
        'suggestion.complete': 'Complet',
        'suggestion.apply': 'Appliquer',

        // Template (Macro) Feature
        'toolbox.myTemplates': 'Mes modèles',
        'template.saveAs': 'Enregistrer comme modèle',
        'template.enterName': 'Nom du modèle :',
        'template.empty': 'Aucun modèle enregistré',
        'template.delete': 'Supprimer',
        'template.deleteConfirm': 'Supprimer ce modèle ?',
        'template.save': 'Enregistrer',
        'template.cancel': 'Annuler',
        'template.namePlaceholder': 'Nom du modèle',
        // v1.2.0 Template Editor
        'template.edit': 'Modifier',
        'template.export': 'Exporter',
        'template.import': 'Importer un modèle',
        'template.editor.title': 'Modifier le modèle',
        'template.editor.name': 'Nom du modèle',
        'template.editor.description': 'Description',
        'template.editor.icon': 'Icône',
        'template.editor.color': 'Couleur',
        'template.editor.category': 'Catégorie',
        'template.editor.preview': 'Aperçu',
        'template.editor.save': 'Enregistrer',
        'template.editor.cancel': 'Annuler',
        'template.export.success': 'Modèle exporté avec succès',
        'template.export.failed': 'Échec de l\'exportation',
        'template.import.success': 'Modèle importé',
        'template.import.failed': 'Échec de l\'importation',
        'template.editor.newCategory': '+ Nouveau',
        'template.editor.nameRequired': 'Veuillez entrer un nom de modèle.',
        'template.editor.saveFailed': 'Échec de l\'enregistrement du modèle.',
        'template.editor.descriptionPlaceholder': 'Description (facultatif)',
        // v1.2.0 Category Management
        'category.default': 'Par défaut',
        'category.favorites': 'Favoris',
        'category.recent': 'Récemment utilisés',
        'category.custom': 'Personnalisé',
        'category.add': 'Ajouter',
        'category.edit': 'Modifier',
        'category.delete': 'Supprimer',
        'category.enterName': 'Nom de la catégorie :',
        'category.manage': 'Gérer les catégories',
        'category.close': 'Fermer',
        'category.system': 'Système',
        'category.deleteConfirm': 'Supprimer cette catégorie ?',
        // Category Editor Modal
        'category.editor.title': 'Gérer les catégories',
        'category.editor.placeholder': 'Nouveau nom de catégorie',
        'category.editor.add': 'Ajouter',
        'common.close': 'Fermer',

        // Blockly Category Names
        'blockly.category.noun': 'Nom',
        'blockly.category.particle': 'Connecteur',
        'blockly.category.article': 'Article',
        'blockly.category.verb': 'Action',
        'blockly.category.punctuation': 'Ponctuation',
        'blockly.category.other': 'Autre',

        // Blockly Block Labels (displayed on blocks)
        'blockly.noun.label': 'Nom :',
        'blockly.other.label': 'Autre :',
        'blockly.verb.label': 'Action :',

        // Connector Labels (French equivalents of Japanese particles)
        'blockly.particle.ga.label': '(sujet)',
        'blockly.particle.wo.label': '(objet)',
        'blockly.particle.ni.label': 'à',
        'blockly.particle.de.label': 'avec',
        'blockly.particle.to.label': 'et',
        'blockly.particle.he.label': 'vers',
        'blockly.particle.kara.label': 'de',
        'blockly.particle.made.label': 'jusqu\'à',
        'blockly.particle.yori.label': 'que',

        // Connector DSL Output (empty for subject/object markers, French for others)
        'blockly.particle.ga.output': '',
        'blockly.particle.wo.output': '',
        'blockly.particle.ni.output': 'à ',
        'blockly.particle.de.output': 'avec ',
        'blockly.particle.to.output': 'et ',
        'blockly.particle.he.output': 'vers ',
        'blockly.particle.kara.output': 'de ',
        'blockly.particle.made.output': 'jusqu\'à ',
        'blockly.particle.yori.output': 'que ',

        // Article Labels (French mode)
        'blockly.article.a.label': 'un',
        'blockly.article.an.label': 'une',
        'blockly.article.the.label': 'le',
        'blockly.article.this.label': 'ce',
        'blockly.article.that.label': 'cette',
        'blockly.article.please.label': 'veuillez',

        // Article DSL Output
        'blockly.article.a.output': 'un ',
        'blockly.article.an.output': 'une ',
        'blockly.article.the.output': 'le ',
        'blockly.article.this.output': 'ce ',
        'blockly.article.that.output': 'cette ',
        'blockly.article.please.output': 'veuillez ',

        // Article Tooltips
        'blockly.article.a.tooltip': 'Article indéfini masculin singulier',
        'blockly.article.an.tooltip': 'Article indéfini féminin singulier',
        'blockly.article.the.tooltip': 'Article défini (le, la, les)',
        'blockly.article.this.tooltip': 'Démonstratif (ce, cette)',
        'blockly.article.that.tooltip': 'Démonstratif (ce, cette - éloigné)',
        'blockly.article.please.tooltip': 'Formule de politesse',

        // Action Labels (French infinitives)
        'blockly.verb.analyze.label': 'analyser',
        'blockly.verb.summarize.label': 'résumer',
        'blockly.verb.translate.label': 'traduire',
        'blockly.verb.create.label': 'créer',
        'blockly.verb.generate.label': 'générer',
        'blockly.verb.convert.label': 'convertir',
        'blockly.verb.delete.label': 'supprimer',
        'blockly.verb.update.label': 'mettre à jour',
        'blockly.verb.extract.label': 'extraire',
        'blockly.verb.explain.label': 'expliquer',
        'blockly.verb.describe.label': 'décrire',
        'blockly.verb.teach.label': 'enseigner',
        'blockly.verb.custom.default': 'traiter',

        // Action DSL Output
        'blockly.verb.analyze.output': 'analyser ',
        'blockly.verb.summarize.output': 'résumer ',
        'blockly.verb.translate.output': 'traduire ',
        'blockly.verb.create.output': 'créer ',
        'blockly.verb.generate.output': 'générer ',
        'blockly.verb.convert.output': 'convertir ',
        'blockly.verb.delete.output': 'supprimer ',
        'blockly.verb.update.output': 'mettre à jour ',
        'blockly.verb.extract.output': 'extraire ',
        'blockly.verb.explain.output': 'expliquer ',
        'blockly.verb.describe.output': 'décrire ',
        'blockly.verb.teach.output': 'enseigner ',

        // Punctuation Labels & Output
        'blockly.punct.touten.label': ',',
        'blockly.punct.kuten.label': '.',
        'blockly.punct.exclaim.label': '!',
        'blockly.punct.question.label': '?',
        'blockly.punct.dquote.label': '"',
        'blockly.punct.squote.label': "'",
        'blockly.punct.comma.label': ',',
        'blockly.punct.slash.label': '/',
        'blockly.punct.amp.label': '&',
        'blockly.punct.touten.output': ', ',
        'blockly.punct.kuten.output': '. ',
        'blockly.punct.exclaim.output': '! ',
        'blockly.punct.question.output': '? ',
        'blockly.punct.dquote.output': '" ',
        'blockly.punct.squote.output': "' ",
        'blockly.punct.comma.output': ', ',
        'blockly.punct.slash.output': '/ ',
        'blockly.punct.amp.output': '& ',
        'blockly.punct.period.label': '.',
        'blockly.punct.period.output': '. ',
        'blockly.punct.period.tooltip': 'Ponctuation : point',

        // Blockly Block Tooltips
        'blockly.noun.tooltip': 'Bloc nom - marque les termes importants (préfixe _N:)',
        'blockly.other.tooltip': 'Bloc autre - pour le texte personnalisé',
        'blockly.particle.ga.tooltip': 'Marqueur de sujet (peut être omis en français)',
        'blockly.particle.wo.tooltip': 'Marqueur d\'objet (peut être omis en français)',
        'blockly.particle.ni.tooltip': 'Marqueur de direction - équivalent à « à »',
        'blockly.particle.de.tooltip': 'Marqueur de moyen - équivalent à « avec »',
        'blockly.particle.to.tooltip': 'Conjonction - équivalent à « et »',
        'blockly.particle.he.tooltip': 'Marqueur de direction - équivalent à « vers »',
        'blockly.particle.kara.tooltip': 'Marqueur d\'origine - équivalent à « de »',
        'blockly.particle.made.tooltip': 'Marqueur de limite - équivalent à « jusqu\'à »',
        'blockly.particle.yori.tooltip': 'Marqueur de comparaison - équivalent à « que »',
        'blockly.verb.analyze.tooltip': 'Action : analyser',
        'blockly.verb.summarize.tooltip': 'Action : résumer',
        'blockly.verb.translate.tooltip': 'Action : traduire',
        'blockly.verb.create.tooltip': 'Action : créer',
        'blockly.verb.generate.tooltip': 'Action : générer',
        'blockly.verb.convert.tooltip': 'Action : convertir',
        'blockly.verb.delete.tooltip': 'Action : supprimer',
        'blockly.verb.update.tooltip': 'Action : mettre à jour',
        'blockly.verb.extract.tooltip': 'Action : extraire',
        'blockly.verb.explain.tooltip': 'Action : expliquer',
        'blockly.verb.describe.tooltip': 'Action : décrire',
        'blockly.verb.teach.tooltip': 'Action : enseigner',
        'blockly.verb.custom.tooltip': 'Bloc d\'action personnalisé',
        'blockly.punct.touten.tooltip': 'Ponctuation : virgule',
        'blockly.punct.kuten.tooltip': 'Ponctuation : point',
        'blockly.punct.exclaim.tooltip': 'Ponctuation : point d\'exclamation',
        'blockly.punct.question.tooltip': 'Ponctuation : point d\'interrogation',
        'blockly.punct.dquote.tooltip': 'Ponctuation : guillemet double',
        'blockly.punct.squote.tooltip': 'Ponctuation : guillemet simple',
        'blockly.punct.comma.tooltip': 'Ponctuation : virgule',
        'blockly.punct.slash.tooltip': 'Ponctuation : barre oblique',
        'blockly.punct.amp.tooltip': 'Ponctuation : esperluette',

        // Validation Error Messages - French Grammar
        'validation.en.articleNotBeforeNoun': 'L\'article doit être suivi d\'un nom',
        'validation.en.consecutiveArticles': 'Articles consécutifs non autorisés',
        'validation.en.prepositionWithoutObject': 'La préposition doit être suivie d\'un nom',
        'validation.en.pleasePosition': '« veuillez » doit être au début ou avant un verbe',
        'validation.en.periodNotAtEnd': 'Le point doit être en fin de phrase',
        'validation.en.missingVerb': 'La phrase ne contient pas de verbe (action)',

        // Project Manager
        'project.unsaved.title': 'Modifications non enregistrées',
        'project.unsaved.message': 'Vous avez des modifications non enregistrées. Voulez-vous les abandonner ?',
        'project.save.failed': 'Échec de l\'enregistrement du projet',
        'project.load.failed': 'Échec du chargement du projet',

        // Footer
        'footer.version': 'Promps Ent v2.1.0 - Wizard',

        // Pro Features - Toolbar
        'pro.toolbar.undo': 'Annuler',
        'pro.toolbar.undo.title': 'Annuler (Ctrl+Z) [Ent]',
        'pro.toolbar.redo': 'Rétablir',
        'pro.toolbar.redo.title': 'Rétablir (Ctrl+Y) [Ent]',
        'pro.toolbar.settings': 'Paramètres',
        'pro.toolbar.settings.title': 'Paramètres des clés API [Ent]',

        // Pro Features - API Key Management
        'pro.apiKey.title': 'Paramètres des clés API',
        'pro.apiKey.description': 'Configurez vos clés API de services IA. Les clés sont stockées en toute sécurité sur votre système.',
        'pro.apiKey.close': 'Fermer',
        'pro.apiKey.edit': 'Modifier',
        'pro.apiKey.save': 'Enregistrer',
        'pro.apiKey.cancel': 'Annuler',
        'pro.apiKey.delete': 'Supprimer',
        'pro.apiKey.placeholder': 'Entrez la clé API...',
        'pro.apiKey.status.set': 'Définie',
        'pro.apiKey.status.notSet': 'Non définie',
        'pro.apiKey.enterKey': 'Veuillez entrer une clé API.',
        'pro.apiKey.saveFailed': 'Échec de l\'enregistrement de la clé API : ',
        'pro.apiKey.deleteFailed': 'Échec de la suppression de la clé API : ',

        // Pro Features - Send to AI
        'pro.sendAi.title': 'Envoyer à l\'IA',
        'pro.sendAi.selectProvider': 'Sélectionner un fournisseur...',
        'pro.sendAi.selectProviderError': 'Veuillez sélectionner un fournisseur IA.',
        'pro.sendAi.createPromptFirst': 'Veuillez d\'abord créer un prompt.',
        'pro.sendAi.sending': 'Envoi en cours...',
        'pro.sendAi.send': 'Envoyer',
        'pro.sendAi.loading': 'Envoi à l\'IA...',

        'pro.apiKey.confirmDelete': 'Êtes-vous sûr de vouloir supprimer la clé API pour {provider} ?',
        'pro.apiKey.loadFailed': 'Échec du chargement des clés API. Vérifiez que le backend est en cours d\'exécution.',
        'pro.apiKey.loadError': 'Échec du chargement des clés API : ',
        'pro.sendAi.error': 'Erreur',

        // Pro Features - Export
        'toolbar.export': 'Exporter',
        'toolbar.export.title': 'Exporter (Ctrl+E) [Ent]',
        'toolbar.blockFavorites': 'Blocs',
        'toolbar.blockFavorites.title': 'Blocs favoris (Ctrl+B) [Ent]',
        'export.title': 'Exporter',
        'export.type.header': 'Type d\'export',
        'export.type.prompt': 'Prompt uniquement',
        'export.type.promptDesc': 'Exporter le texte du prompt généré',
        'export.type.project': 'Projet complet',
        'export.type.projectDesc': 'Exporter l\'espace de travail, les métadonnées et le prompt',
        'export.format.header': 'Format',
        'export.format.txtDesc': 'Fichier texte brut',
        'export.format.mdDesc': 'Format Markdown avec en-tête',
        'export.format.jsonDesc': 'Données JSON structurées',
        'export.preview.header': 'Aperçu',
        'export.cancel': 'Annuler',
        'export.export': 'Exporter',
        'export.success': 'Exportation réussie',
        'export.failed': 'Échec de l\'exportation',
        'export.noContent': 'Aucun prompt à exporter. Créez d\'abord un prompt.',
        'export.noProject': 'Aucun projet à exporter.',

        // Pro Features - Project Sidebar
        'sidebar.projects': 'Projets',
        'sidebar.search.placeholder': 'Rechercher des projets...',
        'sidebar.recent': 'Récents',
        'sidebar.scanFolder': 'Scanner un dossier',
        'sidebar.noProjects': 'Aucun projet récent',
        'sidebar.noResults': 'Aucun projet correspondant',
        'sidebar.toggle': 'Afficher/masquer la barre latérale',
        'sidebar.tags': 'Étiquettes',
        'sidebar.clearFilters': 'Effacer',

        // Pro Features - Tags
        'tags.edit': 'Modifier les étiquettes',
        'tags.add': 'Ajouter',
        'tags.addPlaceholder': 'Ajouter une étiquette...',
        'tags.remove': 'Supprimer',
        'tags.noTags': 'Aucune étiquette',
        'tags.suggested': 'Étiquettes existantes',
        'common.save': 'Enregistrer',
        'common.cancel': 'Annuler',
        'template.editor.noCategory': 'Sans catégorie',

        // Pro Features - Folder Scan
        'scan.selectFolder': 'Sélectionner le dossier à scanner',
        'scan.found': '{count} projets trouvés',
        'scan.noProjects': 'Aucun projet trouvé',
        'scan.error': 'Échec du scan',

        // Pro Features - Project Favorites
        'sidebar.favorites': 'Favoris',
        'favorites.add': 'Ajouter aux favoris',
        'favorites.remove': 'Retirer des favoris',
        'favorites.empty': 'Aucun projet favori',

        // Pro Features - Block Favorites
        'blockFavorites.addToFavorites': 'Ajouter aux favoris',
        'blockFavorites.removeFromFavorites': 'Retirer des favoris',
        'blockFavorites.paletteTitle': 'Blocs favoris',
        'blockFavorites.empty': 'Aucun bloc favori',
        'blockFavorites.dragHint': 'Glisser vers l\'espace de travail',
        'blockFavorites.palette.title': 'Favoris',
        'blockFavorites.palette.empty': 'Pas encore de favoris',
        'blockFavorites.palette.hint': 'Clic droit sur un bloc pour l\'ajouter',
        'blockFavorites.remove': 'Supprimer',

        // Ent Features - Color Theme
        'colorTheme.title': 'Paramètres du thème couleur',
        'colorTheme.colors': 'Couleurs',
        'colorTheme.lightMode': 'Mode clair',
        'colorTheme.darkMode': 'Mode sombre',
        'colorTheme.group.primary': 'Couleurs principales',
        'colorTheme.group.blockly': 'Espace de travail Blockly',
        'colorTheme.group.accent': 'Couleurs d\'accentuation',
        'colorTheme.bgPrimary': 'Arrière-plan principal',
        'colorTheme.bgSurface': 'Arrière-plan surface',
        'colorTheme.bgHeader': 'Arrière-plan en-tête',
        'colorTheme.textPrimary': 'Texte principal',
        'colorTheme.accentPrimary': 'Accentuation principale',
        'colorTheme.blocklyWorkspace': 'Arrière-plan espace de travail',
        'colorTheme.blocklyToolbox': 'Arrière-plan boîte à outils',
        'colorTheme.blocklyFlyout': 'Arrière-plan flyout',
        'colorTheme.accentSuccess': 'Couleur de succès',
        'colorTheme.accentError': 'Couleur d\'erreur',
        'colorTheme.accentWarning': 'Couleur d\'avertissement',
        'colorTheme.apply': 'Appliquer',
        'colorTheme.cancel': 'Annuler',
        'colorTheme.reset': 'Réinitialiser',
        'colorTheme.resetConfirm': 'Réinitialiser les couleurs de {mode} par défaut ?',

        // AI Import (Ent v1.5.0)
        'ent.import.title': 'Import IA',
        'ent.import.analyzing': 'Analyse en cours...',
        'ent.import.noResponse': 'Aucune réponse de l\'IA',
        'ent.import.noTokens': 'Aucun jeton trouvé',
        'ent.import.error': 'Erreur d\'importation',

        // Ent Features - AI Compare (v1.5.0)
        'ent.compare.title': 'Comparaison IA',
        'ent.compare.compareBtn': 'Comparer',
        'ent.compare.selectProviders': 'Sélectionner les fournisseurs',
        'ent.compare.prompt': 'Prompt',
        'ent.compare.results': 'Résultats',
        'ent.compare.close': 'Fermer',
        'ent.compare.compare': 'Comparer',
        'ent.compare.sending': 'Envoi en cours...',
        'ent.compare.noProviders': 'Veuillez sélectionner au moins 2 fournisseurs.',
        'ent.compare.noPrompt': 'Veuillez d\'abord créer un prompt.',
        'ent.compare.noApiKey': 'Pas de clé API',
        'ent.compare.elapsed': '{ms}ms',
        'ent.compare.totalTime': 'Total : {ms}ms',
        'ent.compare.copy': 'Copier',
        'ent.compare.copied': 'Copié',
        'ent.compare.error': 'Erreur',
        'ent.compare.selectModel': 'Sélectionner le modèle',
        'ent.compare.configureKey': 'Configurer la clé',

        // v2.0.0: QR Code Sharing
        'toolbar.qrShare': 'QR',
        'toolbar.qrShare.title': 'Partage QR Code [Ent]',
        'qr.title': 'Partage QR Code',
        'qr.tab.generate': 'Générer',
        'qr.tab.import': 'Importer',
        'qr.generate': 'Générer le QR Code',
        'qr.save': 'Enregistrer QR',
        'qr.importFile': 'Importer fichier QR',
        'qr.noDsl': 'Aucun prompt disponible. Veuillez d\'abord créer un prompt.',
        'qr.dataSize': 'Taille des données : {size} octets',
        'qr.generated': 'QR code généré',
        'qr.generateFailed': 'Échec de la génération du QR code',
        'qr.saved': 'QR code enregistré',
        'qr.saveFailed': 'Échec de l\'enregistrement du QR code',
        'qr.decodeFailed': 'Échec du décodage du QR code',
        'qr.imported': 'Importé depuis le QR code',
        'qr.import.name': 'Nom du projet',
        'qr.import.locale': 'Langue',
        'qr.import.dsl': 'DSL',
        'qr.import.apply': 'Appliquer à l\'espace de travail',
        'qr.import.legacyFormat': 'Ancien format QR. Veuillez utiliser un QR code généré avec la version 2.0.0 ou ultérieure.',

        // v2.0.0: LAN P2P File Exchange
        'toolbar.lanShare': 'LAN',
        'toolbar.lanShare.title': 'Partage LAN [Ent]',
        'lan.title': 'Partage LAN',
        'lan.start': 'Démarrer le partage',
        'lan.stop': 'Arrêter le partage',
        'lan.started': 'Partage LAN démarré',
        'lan.stopped': 'Partage LAN arrêté',
        'lan.startFailed': 'Échec du démarrage du partage LAN',
        'lan.stopFailed': 'Échec de l\'arrêt du partage LAN',
        'lan.status.active': 'Actif',
        'lan.status.inactive': 'Inactif',
        'lan.peers': 'Pairs découverts',
        'lan.noPeers': 'Aucun pair trouvé',
        'lan.refresh': 'Actualiser',
        'lan.send': 'Envoyer',
        'lan.sent': 'Projet envoyé',
        'lan.sendFailed': 'Échec de l\'envoi',
        'lan.noDsl': 'Aucun prompt disponible. Veuillez d\'abord créer un prompt.',
        'lan.pendingTransfers': 'Transferts en attente',
        'lan.from': 'De',
        'lan.accept': 'Accepter',
        'lan.reject': 'Refuser',
        'lan.received': 'Projet reçu',
        'lan.acceptFailed': 'Échec de la réception du transfert',
        'lan.rejected': 'Transfert refusé',
        // v2.1.0: Wizard
        'toolbar.wizard': 'Assistant',
        'toolbar.wizard.title': 'Assistant de prompt [Ent]',
        'wizard.title': 'Assistant de prompt',
        'wizard.intro': 'S\u00e9lectionnez un assistant pour construire votre prompt \u00e9tape par \u00e9tape.',
        'wizard.back': 'Retour',
        'wizard.next': 'Suivant',
        'wizard.cancel': 'Annuler',
        'wizard.apply': 'Appliquer',
        'wizard.preview.title': 'Aper\u00e7u',
        'wizard.step': '\u00c9tape',
        'wizard.of': 'sur',
        'wizard.custom.create': 'Cr\u00e9er un assistant',
        'wizard.custom.createDesc': 'Cr\u00e9ez votre propre assistant personnalis\u00e9',
        'wizard.custom.edit': 'Modifier',
        'wizard.custom.delete': 'Supprimer',
        'wizard.custom.deleteConfirm': 'Supprimer cet assistant ?',
        'wizard.editor.title': '\u00c9diteur d\'assistant',
        'wizard.editor.name': 'Nom',
        'wizard.editor.description': 'Description',
        'wizard.editor.icon': 'Ic\u00f4ne',
        'wizard.editor.steps': '\u00c9tapes',
        'wizard.editor.addStep': 'Ajouter',
        'wizard.editor.stepTitle': 'Titre',
        'wizard.editor.stepDescription': 'Description',
        'wizard.editor.options': 'Options',
        'wizard.editor.addOption': 'Ajouter',
        'wizard.editor.blockRules': 'R\u00e8gles de blocs',
        'wizard.editor.addBlock': 'Ajouter',
        'wizard.editor.blockType': 'Type de bloc',
        'wizard.editor.defaultValue': 'Valeur par d\u00e9faut',
        'wizard.editor.save': 'Enregistrer',
        'wizard.editor.cancel': 'Annuler',
        'wizard.editor.nameRequired': 'Veuillez entrer un nom d\'assistant',
        'wizard.editor.stepRequired': 'Au moins une \u00e9tape est requise',
        'wizard.editor.fallbackBlocks': 'Blocs par défaut',
        'wizard.editor.fallbackBlocks.tooltip': 'Blocs utilisés lorsqu\'aucune condition de règle ne correspond',
        'wizard.editor.optionValue': 'Valeur',
        'wizard.editor.optionLabel': '\u00c9tiquette',
        'wizard.editor.conditions': 'Conditions',
        'wizard.editor.deleteStep': 'Supprimer l\'\u00e9tape',
        'wizard.editor.deleteOption': 'Supprimer l\'option',
        'wizard.editor.deleteRule': 'Supprimer la r\u00e8gle',
        'wizard.editor.deleteBlock': 'Supprimer le bloc',
        'wizard.editor.rule': 'R\u00e8gle',
        'wizard.editor.blocks': 'Blocs',
        'wizard.custom.export': 'Exporter',
        'wizard.custom.import': 'Importer',
        'wizard.custom.export.success': 'Assistants personnalisés exportés avec succès',
        'wizard.custom.import.success': 'Assistants personnalisés importés avec succès',
        'wizard.custom.import.error': 'Échec de la lecture du fichier',
        'wizard.custom.import.invalid': 'Format de données d\'assistant invalide',
        'wizard.custom.import.empty': 'Aucun assistant à importer',
        'wizard.custom.export.empty': 'Aucun assistant personnalisé à exporter',
        'wizard.custom.import.count': '{count} assistant(s) importé(s)',
        'wizard.custom.import.mode': 'Choisissez la méthode d\'importation',
        'wizard.custom.import.merge': 'Fusionner (conserver existants)',
        'wizard.custom.import.replace': 'Remplacer (supprimer existants)',
        'wizard.sample': 'Exemple'
    }
};

/**
 * Current locale (default: Japanese)
 */
let currentLocale = localStorage.getItem('promps-lang') || 'ja';

/**
 * Get translation for a key
 * @param {string} key - Translation key
 * @param {Object} params - Optional parameters for interpolation
 * @returns {string} Translated text or key if not found
 */
function t(key, params = {}) {
    const translations = TRANSLATIONS[currentLocale] || TRANSLATIONS.ja;
    let text = translations[key];

    if (text === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
    }

    // Simple parameter interpolation: {paramName}
    for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
    }

    return text;
}

/**
 * Get current locale
 * @returns {string} Current locale code ('ja', 'en', or 'fr')
 */
function getLocale() {
    return currentLocale;
}

/**
 * Set locale and update UI
 * @param {string} lang - Language code ('ja', 'en', or 'fr')
 */
function setLocale(lang) {
    if (!TRANSLATIONS[lang]) {
        console.warn(`Unsupported locale: ${lang}`);
        return;
    }

    currentLocale = lang;
    localStorage.setItem('promps-lang', lang);

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update all elements with data-i18n attribute
    updateUIText();

    // Dispatch custom event for other modules to react
    window.dispatchEvent(new CustomEvent('localechange', {
        detail: { locale: lang }
    }));

    console.log(`Locale changed to: ${lang}`);
}

/**
 * Toggle between Japanese, English, and French
 */
function toggleLocale() {
    const cycle = { ja: 'en', en: 'fr', fr: 'ja' };
    const newLocale = cycle[currentLocale] || 'ja';
    setLocale(newLocale);
}

/**
 * Update all elements with data-i18n attribute
 */
function updateUIText() {
    // Update elements with data-i18n attribute (text content)
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });

    // Update elements with data-i18n-title attribute (title/tooltip)
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });

    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
}

/**
 * Initialize i18n module
 * Called automatically on load
 */
function initI18n() {
    // Ensure HTML lang attribute matches current locale
    document.documentElement.lang = currentLocale;

    // Update UI text
    updateUIText();

    console.log(`i18n initialized with locale: ${currentLocale}`);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    initI18n();
}

// Export to global scope
window.i18n = {
    t,
    getLocale,
    setLocale,
    toggleLocale,
    updateUIText,
    TRANSLATIONS
};

// Convenience global functions
window.t = t;
window.getLocale = getLocale;

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { t, getLocale, setLocale, toggleLocale, updateUIText, TRANSLATIONS };
}
