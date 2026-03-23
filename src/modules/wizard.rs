/// Wizard Template Module for Promps Ent
///
/// Provides step-by-step guided prompt building for beginners.
/// Users answer questions and blocks are auto-generated.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// Data Structures
// ============================================================================

/// License tier for wizard templates
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WizardTier {
    Pro,
    Enterprise,
}

/// Input type for a wizard step
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WizardInputType {
    Select,
    Radio,
    TextInput,
}

/// A selectable option within a wizard step
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardOption {
    pub value: String,
    pub label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
}

/// A single step in the wizard flow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardStep {
    pub id: String,
    pub title: String,
    pub description: String,
    pub input_type: WizardInputType,
    pub options: Vec<WizardOption>,
    pub required: bool,
}

/// A block to be generated in the workspace
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardBlock {
    pub block_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value_from_step: Option<String>,
}

/// Rule that maps step selections to blocks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardBlockRule {
    pub conditions: HashMap<String, String>,
    pub blocks: Vec<WizardBlock>,
}

/// A complete wizard template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WizardTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub tier: WizardTier,
    pub steps: Vec<WizardStep>,
    pub block_rules: Vec<WizardBlockRule>,
    pub fallback_blocks: Vec<WizardBlock>,
}

// ============================================================================
// Japanese Templates
// ============================================================================

pub fn get_wizard_templates() -> Vec<WizardTemplate> {
    vec![
        // 1. Analysis Wizard
        WizardTemplate {
            id: "analyze_ja".to_string(),
            name: "分析ウィザード".to_string(),
            description: "対象を選んで分析プロンプトを自動生成".to_string(),
            icon: "🔍".to_string(),
            tier: WizardTier::Enterprise,
            steps: vec![
                WizardStep {
                    id: "target".to_string(),
                    title: "分析対象".to_string(),
                    description: "何を分析しますか？".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "document".to_string(), label: "ドキュメント".to_string(), description: Some("文書やレポートを分析".to_string()), icon: Some("📄".to_string()) },
                        WizardOption { value: "data".to_string(), label: "データ".to_string(), description: Some("数値やデータセットを分析".to_string()), icon: Some("📊".to_string()) },
                        WizardOption { value: "code".to_string(), label: "コード".to_string(), description: Some("ソースコードを分析".to_string()), icon: Some("💻".to_string()) },
                    ],
                    required: true,
                },
                WizardStep {
                    id: "method".to_string(),
                    title: "分析方法".to_string(),
                    description: "どのように分析しますか？".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "detailed".to_string(), label: "詳細分析".to_string(), description: Some("細部まで徹底的に分析".to_string()), icon: Some("🔬".to_string()) },
                        WizardOption { value: "summary".to_string(), label: "要約分析".to_string(), description: Some("要点をまとめて分析".to_string()), icon: Some("📋".to_string()) },
                        WizardOption { value: "comparison".to_string(), label: "比較分析".to_string(), description: Some("他との違いを分析".to_string()), icon: Some("⚖️".to_string()) },
                    ],
                    required: true,
                },
            ],
            block_rules: vec![
                // document + detailed
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "document".to_string()), ("method".to_string(), "detailed".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("ドキュメント".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("詳細".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_analyze".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // document + summary
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "document".to_string()), ("method".to_string(), "summary".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("ドキュメント".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // document + comparison
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "document".to_string()), ("method".to_string(), "comparison".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("ドキュメント".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("比較".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_de".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_analyze".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // data + detailed
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "data".to_string()), ("method".to_string(), "detailed".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("データ".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("詳細".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_analyze".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // data + summary
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "data".to_string()), ("method".to_string(), "summary".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("データ".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // data + comparison
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "data".to_string()), ("method".to_string(), "comparison".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("データ".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("比較".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_de".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_analyze".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // code + detailed
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "code".to_string()), ("method".to_string(), "detailed".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("コード".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("詳細".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_analyze".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // code + summary
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "code".to_string()), ("method".to_string(), "summary".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("コード".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // code + comparison
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "code".to_string()), ("method".to_string(), "comparison".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("コード".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("比較".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_de".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_analyze".to_string(), default_value: None, value_from_step: None },
                    ],
                },
            ],
            fallback_blocks: vec![
                WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("対象".to_string()), value_from_step: None },
                WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_verb_analyze".to_string(), default_value: None, value_from_step: None },
            ],
        },

        // 2. Translation Wizard
        WizardTemplate {
            id: "translate_ja".to_string(),
            name: "翻訳ウィザード".to_string(),
            description: "対象と言語を選んで翻訳プロンプトを自動生成".to_string(),
            icon: "🌐".to_string(),
            tier: WizardTier::Enterprise,
            steps: vec![
                WizardStep {
                    id: "target".to_string(),
                    title: "翻訳対象".to_string(),
                    description: "何を翻訳しますか？".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "document".to_string(), label: "ドキュメント".to_string(), description: Some("文書やマニュアルを翻訳".to_string()), icon: Some("📄".to_string()) },
                        WizardOption { value: "text".to_string(), label: "テキスト".to_string(), description: Some("短いテキストを翻訳".to_string()), icon: Some("📝".to_string()) },
                        WizardOption { value: "email".to_string(), label: "メール".to_string(), description: Some("メール文面を翻訳".to_string()), icon: Some("✉️".to_string()) },
                    ],
                    required: true,
                },
                WizardStep {
                    id: "language".to_string(),
                    title: "言語設定".to_string(),
                    description: "翻訳先の言語を選択してください".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "en".to_string(), label: "英語".to_string(), description: Some("日本語→英語".to_string()), icon: Some("🇬🇧".to_string()) },
                        WizardOption { value: "fr".to_string(), label: "フランス語".to_string(), description: Some("日本語→フランス語".to_string()), icon: Some("🇫🇷".to_string()) },
                        WizardOption { value: "zh".to_string(), label: "中国語".to_string(), description: Some("日本語→中国語".to_string()), icon: Some("🇨🇳".to_string()) },
                    ],
                    required: true,
                },
            ],
            block_rules: vec![
                // document + en
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "document".to_string()), ("language".to_string(), "en".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("ドキュメント".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("英語".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // document + fr
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "document".to_string()), ("language".to_string(), "fr".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("ドキュメント".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("フランス語".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // document + zh
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "document".to_string()), ("language".to_string(), "zh".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("ドキュメント".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("中国語".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // text + en
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "text".to_string()), ("language".to_string(), "en".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("テキスト".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("英語".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // text + fr
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "text".to_string()), ("language".to_string(), "fr".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("テキスト".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("フランス語".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // text + zh
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "text".to_string()), ("language".to_string(), "zh".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("テキスト".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("中国語".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // email + en
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "email".to_string()), ("language".to_string(), "en".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("メール".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("英語".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // email + fr
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "email".to_string()), ("language".to_string(), "fr".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("メール".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("フランス語".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // email + zh
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "email".to_string()), ("language".to_string(), "zh".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("メール".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("中国語".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
                    ],
                },
            ],
            fallback_blocks: vec![
                WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("テキスト".to_string()), value_from_step: None },
                WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_verb_translate".to_string(), default_value: None, value_from_step: None },
            ],
        },

        // 3. Summary Wizard
        WizardTemplate {
            id: "summary_ja".to_string(),
            name: "要約ウィザード".to_string(),
            description: "対象と形式を選んで要約プロンプトを自動生成".to_string(),
            icon: "📋".to_string(),
            tier: WizardTier::Enterprise,
            steps: vec![
                WizardStep {
                    id: "target".to_string(),
                    title: "要約対象".to_string(),
                    description: "何を要約しますか？".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "article".to_string(), label: "記事".to_string(), description: Some("ニュースや記事を要約".to_string()), icon: Some("📰".to_string()) },
                        WizardOption { value: "report".to_string(), label: "レポート".to_string(), description: Some("報告書やレポートを要約".to_string()), icon: Some("📑".to_string()) },
                        WizardOption { value: "meeting".to_string(), label: "議事録".to_string(), description: Some("会議内容を要約".to_string()), icon: Some("🤝".to_string()) },
                    ],
                    required: true,
                },
                WizardStep {
                    id: "format".to_string(),
                    title: "要約形式".to_string(),
                    description: "どの形式で要約しますか？".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "brief".to_string(), label: "簡潔".to_string(), description: Some("短くまとめる".to_string()), icon: Some("⚡".to_string()) },
                        WizardOption { value: "detailed".to_string(), label: "詳細".to_string(), description: Some("詳しくまとめる".to_string()), icon: Some("📖".to_string()) },
                        WizardOption { value: "bullets".to_string(), label: "箇条書き".to_string(), description: Some("ポイントを箇条書きで".to_string()), icon: Some("📌".to_string()) },
                    ],
                    required: true,
                },
            ],
            block_rules: vec![
                // article + brief
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "article".to_string()), ("format".to_string(), "brief".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("記事".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("簡潔".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // article + detailed
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "article".to_string()), ("format".to_string(), "detailed".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("記事".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("詳細".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // article + bullets
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "article".to_string()), ("format".to_string(), "bullets".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("記事".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("箇条書き".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_de".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // report + brief
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "report".to_string()), ("format".to_string(), "brief".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("レポート".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("簡潔".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // report + detailed
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "report".to_string()), ("format".to_string(), "detailed".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("レポート".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("詳細".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // report + bullets
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "report".to_string()), ("format".to_string(), "bullets".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("レポート".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("箇条書き".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_de".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // meeting + brief
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "meeting".to_string()), ("format".to_string(), "brief".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("議事録".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("簡潔".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // meeting + detailed
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "meeting".to_string()), ("format".to_string(), "detailed".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("議事録".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("詳細".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_ni".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
                // meeting + bullets
                WizardBlockRule {
                    conditions: HashMap::from([("target".to_string(), "meeting".to_string()), ("format".to_string(), "bullets".to_string())]),
                    blocks: vec![
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("議事録".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("箇条書き".to_string()), value_from_step: None },
                        WizardBlock { block_type: "promps_particle_de".to_string(), default_value: None, value_from_step: None },
                        WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
                    ],
                },
            ],
            fallback_blocks: vec![
                WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("内容".to_string()), value_from_step: None },
                WizardBlock { block_type: "promps_particle_wo".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_verb_summarize".to_string(), default_value: None, value_from_step: None },
            ],
        },
    ]
}

// ============================================================================
// English Templates
// ============================================================================

pub fn get_wizard_templates_en() -> Vec<WizardTemplate> {
    vec![
        // 1. Analysis Wizard
        WizardTemplate {
            id: "analyze_en".to_string(),
            name: "Analysis Wizard".to_string(),
            description: "Select a target and generate an analysis prompt".to_string(),
            icon: "🔍".to_string(),
            tier: WizardTier::Enterprise,
            steps: vec![
                WizardStep {
                    id: "target".to_string(),
                    title: "Analysis Target".to_string(),
                    description: "What do you want to analyze?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "document".to_string(), label: "Document".to_string(), description: Some("Analyze documents and reports".to_string()), icon: Some("📄".to_string()) },
                        WizardOption { value: "data".to_string(), label: "Data".to_string(), description: Some("Analyze numbers and datasets".to_string()), icon: Some("📊".to_string()) },
                        WizardOption { value: "code".to_string(), label: "Code".to_string(), description: Some("Analyze source code".to_string()), icon: Some("💻".to_string()) },
                    ],
                    required: true,
                },
                WizardStep {
                    id: "method".to_string(),
                    title: "Analysis Method".to_string(),
                    description: "How should it be analyzed?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "detailed".to_string(), label: "Detailed".to_string(), description: Some("Thorough in-depth analysis".to_string()), icon: Some("🔬".to_string()) },
                        WizardOption { value: "summary".to_string(), label: "Summary".to_string(), description: Some("Summarized key points".to_string()), icon: Some("📋".to_string()) },
                        WizardOption { value: "comparison".to_string(), label: "Comparison".to_string(), description: Some("Compare differences".to_string()), icon: Some("⚖️".to_string()) },
                    ],
                    required: true,
                },
            ],
            block_rules: vec![
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("method".to_string(), "detailed".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("analyze".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("in".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("detail".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("method".to_string(), "summary".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("method".to_string(), "comparison".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("compare".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "data".to_string()), ("method".to_string(), "detailed".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("analyze".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("data".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("in".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("detail".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "data".to_string()), ("method".to_string(), "summary".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("data".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "data".to_string()), ("method".to_string(), "comparison".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("compare".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("data".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "code".to_string()), ("method".to_string(), "detailed".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("analyze".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("code".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("in".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("detail".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "code".to_string()), ("method".to_string(), "summary".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("code".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "code".to_string()), ("method".to_string(), "comparison".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("compare".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("code".to_string()), value_from_step: None },
                ]},
            ],
            fallback_blocks: vec![
                WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("analyze".to_string()), value_from_step: None },
                WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("target".to_string()), value_from_step: None },
            ],
        },

        // 2. Translation Wizard
        WizardTemplate {
            id: "translate_en".to_string(),
            name: "Translation Wizard".to_string(),
            description: "Select target and language to generate a translation prompt".to_string(),
            icon: "🌐".to_string(),
            tier: WizardTier::Enterprise,
            steps: vec![
                WizardStep {
                    id: "target".to_string(),
                    title: "Translation Target".to_string(),
                    description: "What do you want to translate?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "document".to_string(), label: "Document".to_string(), description: Some("Translate documents and manuals".to_string()), icon: Some("📄".to_string()) },
                        WizardOption { value: "text".to_string(), label: "Text".to_string(), description: Some("Translate short text".to_string()), icon: Some("📝".to_string()) },
                        WizardOption { value: "email".to_string(), label: "Email".to_string(), description: Some("Translate email content".to_string()), icon: Some("✉️".to_string()) },
                    ],
                    required: true,
                },
                WizardStep {
                    id: "language".to_string(),
                    title: "Target Language".to_string(),
                    description: "Select the target language".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "ja".to_string(), label: "Japanese".to_string(), description: Some("English to Japanese".to_string()), icon: Some("🇯🇵".to_string()) },
                        WizardOption { value: "fr".to_string(), label: "French".to_string(), description: Some("English to French".to_string()), icon: Some("🇫🇷".to_string()) },
                        WizardOption { value: "es".to_string(), label: "Spanish".to_string(), description: Some("English to Spanish".to_string()), icon: Some("🇪🇸".to_string()) },
                    ],
                    required: true,
                },
            ],
            block_rules: vec![
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("language".to_string(), "ja".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("to".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("Japanese".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("language".to_string(), "fr".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("to".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("French".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("language".to_string(), "es".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("to".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("Spanish".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "text".to_string()), ("language".to_string(), "ja".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("text".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("to".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("Japanese".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "text".to_string()), ("language".to_string(), "fr".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("text".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("to".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("French".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "text".to_string()), ("language".to_string(), "es".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("text".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("to".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("Spanish".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "email".to_string()), ("language".to_string(), "ja".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("email".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("to".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("Japanese".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "email".to_string()), ("language".to_string(), "fr".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("email".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("to".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("French".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "email".to_string()), ("language".to_string(), "es".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("email".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("to".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("Spanish".to_string()), value_from_step: None },
                ]},
            ],
            fallback_blocks: vec![
                WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("translate".to_string()), value_from_step: None },
                WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("text".to_string()), value_from_step: None },
            ],
        },

        // 3. Summary Wizard
        WizardTemplate {
            id: "summary_en".to_string(),
            name: "Summary Wizard".to_string(),
            description: "Select target and format to generate a summary prompt".to_string(),
            icon: "📋".to_string(),
            tier: WizardTier::Enterprise,
            steps: vec![
                WizardStep {
                    id: "target".to_string(),
                    title: "Summary Target".to_string(),
                    description: "What do you want to summarize?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "article".to_string(), label: "Article".to_string(), description: Some("Summarize news and articles".to_string()), icon: Some("📰".to_string()) },
                        WizardOption { value: "report".to_string(), label: "Report".to_string(), description: Some("Summarize reports".to_string()), icon: Some("📑".to_string()) },
                        WizardOption { value: "meeting".to_string(), label: "Meeting Notes".to_string(), description: Some("Summarize meeting content".to_string()), icon: Some("🤝".to_string()) },
                    ],
                    required: true,
                },
                WizardStep {
                    id: "format".to_string(),
                    title: "Summary Format".to_string(),
                    description: "How should it be summarized?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "brief".to_string(), label: "Brief".to_string(), description: Some("Short and concise".to_string()), icon: Some("⚡".to_string()) },
                        WizardOption { value: "detailed".to_string(), label: "Detailed".to_string(), description: Some("Comprehensive summary".to_string()), icon: Some("📖".to_string()) },
                        WizardOption { value: "bullets".to_string(), label: "Bullet Points".to_string(), description: Some("Key points as bullet list".to_string()), icon: Some("📌".to_string()) },
                    ],
                    required: true,
                },
            ],
            block_rules: vec![
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "article".to_string()), ("format".to_string(), "brief".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("article".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("briefly".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "article".to_string()), ("format".to_string(), "detailed".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("article".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("in".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("detail".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "article".to_string()), ("format".to_string(), "bullets".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("article".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("as".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("bullet points".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "report".to_string()), ("format".to_string(), "brief".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("report".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("briefly".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "report".to_string()), ("format".to_string(), "detailed".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("report".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("in".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("detail".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "report".to_string()), ("format".to_string(), "bullets".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("report".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("as".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("bullet points".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "meeting".to_string()), ("format".to_string(), "brief".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("meeting notes".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("briefly".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "meeting".to_string()), ("format".to_string(), "detailed".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("meeting notes".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("in".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("detail".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "meeting".to_string()), ("format".to_string(), "bullets".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("meeting notes".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("as".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("bullet points".to_string()), value_from_step: None },
                ]},
            ],
            fallback_blocks: vec![
                WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("summarize".to_string()), value_from_step: None },
                WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("content".to_string()), value_from_step: None },
            ],
        },
    ]
}

// ============================================================================
// French Templates
// ============================================================================

pub fn get_wizard_templates_fr() -> Vec<WizardTemplate> {
    vec![
        WizardTemplate {
            id: "analyze_fr".to_string(),
            name: "Assistant d'analyse".to_string(),
            description: "Choisissez une cible et g\u{00e9}n\u{00e9}rez un prompt d'analyse".to_string(),
            icon: "🔍".to_string(),
            tier: WizardTier::Enterprise,
            steps: vec![
                WizardStep {
                    id: "target".to_string(),
                    title: "Cible d'analyse".to_string(),
                    description: "Que voulez-vous analyser ?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "document".to_string(), label: "Document".to_string(), description: Some("Analyser des documents et rapports".to_string()), icon: Some("📄".to_string()) },
                        WizardOption { value: "data".to_string(), label: "Donn\u{00e9}es".to_string(), description: Some("Analyser des chiffres et jeux de donn\u{00e9}es".to_string()), icon: Some("📊".to_string()) },
                        WizardOption { value: "code".to_string(), label: "Code".to_string(), description: Some("Analyser du code source".to_string()), icon: Some("💻".to_string()) },
                    ],
                    required: true,
                },
                WizardStep {
                    id: "method".to_string(),
                    title: "M\u{00e9}thode d'analyse".to_string(),
                    description: "Comment souhaitez-vous analyser ?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "detailed".to_string(), label: "D\u{00e9}taill\u{00e9}e".to_string(), description: Some("Analyse approfondie".to_string()), icon: Some("🔬".to_string()) },
                        WizardOption { value: "summary".to_string(), label: "R\u{00e9}sum\u{00e9}e".to_string(), description: Some("Points cl\u{00e9}s r\u{00e9}sum\u{00e9}s".to_string()), icon: Some("📋".to_string()) },
                        WizardOption { value: "comparison".to_string(), label: "Comparaison".to_string(), description: Some("Comparer les diff\u{00e9}rences".to_string()), icon: Some("⚖️".to_string()) },
                    ],
                    required: true,
                },
            ],
            block_rules: vec![
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("method".to_string(), "detailed".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("analyser".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("en".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("d\u{00e9}tail".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("method".to_string(), "summary".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("r\u{00e9}sumer".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("method".to_string(), "comparison".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("comparer".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                ]},
            ],
            fallback_blocks: vec![
                WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("analyser".to_string()), value_from_step: None },
                WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("cible".to_string()), value_from_step: None },
            ],
        },

        WizardTemplate {
            id: "translate_fr".to_string(),
            name: "Assistant de traduction".to_string(),
            description: "Choisissez la cible et la langue pour g\u{00e9}n\u{00e9}rer un prompt de traduction".to_string(),
            icon: "🌐".to_string(),
            tier: WizardTier::Enterprise,
            steps: vec![
                WizardStep {
                    id: "target".to_string(),
                    title: "Cible de traduction".to_string(),
                    description: "Que voulez-vous traduire ?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "document".to_string(), label: "Document".to_string(), description: Some("Traduire des documents".to_string()), icon: Some("📄".to_string()) },
                        WizardOption { value: "text".to_string(), label: "Texte".to_string(), description: Some("Traduire un texte court".to_string()), icon: Some("📝".to_string()) },
                        WizardOption { value: "email".to_string(), label: "E-mail".to_string(), description: Some("Traduire un e-mail".to_string()), icon: Some("✉️".to_string()) },
                    ],
                    required: true,
                },
                WizardStep {
                    id: "language".to_string(),
                    title: "Langue cible".to_string(),
                    description: "S\u{00e9}lectionnez la langue cible".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "en".to_string(), label: "Anglais".to_string(), description: Some("Fran\u{00e7}ais vers anglais".to_string()), icon: Some("🇬🇧".to_string()) },
                        WizardOption { value: "ja".to_string(), label: "Japonais".to_string(), description: Some("Fran\u{00e7}ais vers japonais".to_string()), icon: Some("🇯🇵".to_string()) },
                        WizardOption { value: "es".to_string(), label: "Espagnol".to_string(), description: Some("Fran\u{00e7}ais vers espagnol".to_string()), icon: Some("🇪🇸".to_string()) },
                    ],
                    required: true,
                },
            ],
            block_rules: vec![
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("language".to_string(), "en".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("traduire".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("en".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("anglais".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("language".to_string(), "ja".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("traduire".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("en".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("japonais".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "document".to_string()), ("language".to_string(), "es".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("traduire".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("document".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("en".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("espagnol".to_string()), value_from_step: None },
                ]},
            ],
            fallback_blocks: vec![
                WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("traduire".to_string()), value_from_step: None },
                WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("texte".to_string()), value_from_step: None },
            ],
        },

        WizardTemplate {
            id: "summary_fr".to_string(),
            name: "Assistant de r\u{00e9}sum\u{00e9}".to_string(),
            description: "Choisissez la cible et le format pour g\u{00e9}n\u{00e9}rer un prompt de r\u{00e9}sum\u{00e9}".to_string(),
            icon: "📋".to_string(),
            tier: WizardTier::Enterprise,
            steps: vec![
                WizardStep {
                    id: "target".to_string(),
                    title: "Cible du r\u{00e9}sum\u{00e9}".to_string(),
                    description: "Que voulez-vous r\u{00e9}sumer ?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "article".to_string(), label: "Article".to_string(), description: Some("R\u{00e9}sumer des articles".to_string()), icon: Some("📰".to_string()) },
                        WizardOption { value: "report".to_string(), label: "Rapport".to_string(), description: Some("R\u{00e9}sumer des rapports".to_string()), icon: Some("📑".to_string()) },
                        WizardOption { value: "meeting".to_string(), label: "Compte-rendu".to_string(), description: Some("R\u{00e9}sumer une r\u{00e9}union".to_string()), icon: Some("🤝".to_string()) },
                    ],
                    required: true,
                },
                WizardStep {
                    id: "format".to_string(),
                    title: "Format du r\u{00e9}sum\u{00e9}".to_string(),
                    description: "Sous quelle forme r\u{00e9}sumer ?".to_string(),
                    input_type: WizardInputType::Radio,
                    options: vec![
                        WizardOption { value: "brief".to_string(), label: "Bref".to_string(), description: Some("Court et concis".to_string()), icon: Some("⚡".to_string()) },
                        WizardOption { value: "detailed".to_string(), label: "D\u{00e9}taill\u{00e9}".to_string(), description: Some("R\u{00e9}sum\u{00e9} complet".to_string()), icon: Some("📖".to_string()) },
                        WizardOption { value: "bullets".to_string(), label: "Points cl\u{00e9}s".to_string(), description: Some("Liste \u{00e0} puces".to_string()), icon: Some("📌".to_string()) },
                    ],
                    required: true,
                },
            ],
            block_rules: vec![
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "article".to_string()), ("format".to_string(), "brief".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("r\u{00e9}sumer".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("article".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("bri\u{00e8}vement".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "article".to_string()), ("format".to_string(), "detailed".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("r\u{00e9}sumer".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("article".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("en".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("d\u{00e9}tail".to_string()), value_from_step: None },
                ]},
                WizardBlockRule { conditions: HashMap::from([("target".to_string(), "article".to_string()), ("format".to_string(), "bullets".to_string())]), blocks: vec![
                    WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("r\u{00e9}sumer".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("article".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_other".to_string(), default_value: Some("en".to_string()), value_from_step: None },
                    WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("points cl\u{00e9}s".to_string()), value_from_step: None },
                ]},
            ],
            fallback_blocks: vec![
                WizardBlock { block_type: "promps_article_please".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_verb_custom".to_string(), default_value: Some("r\u{00e9}sumer".to_string()), value_from_step: None },
                WizardBlock { block_type: "promps_article_the".to_string(), default_value: None, value_from_step: None },
                WizardBlock { block_type: "promps_noun".to_string(), default_value: Some("contenu".to_string()), value_from_step: None },
            ],
        },
    ]
}

// ============================================================================
// Locale-based accessor
// ============================================================================

/// Get wizard templates by locale
pub fn get_wizard_templates_by_locale(locale: &str) -> Vec<WizardTemplate> {
    match locale {
        "en" => get_wizard_templates_en(),
        "fr" => get_wizard_templates_fr(),
        _ => get_wizard_templates(), // default: Japanese
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_japanese_template_count() {
        let templates = get_wizard_templates();
        assert_eq!(templates.len(), 3);
    }

    #[test]
    fn test_english_template_count() {
        let templates = get_wizard_templates_en();
        assert_eq!(templates.len(), 3);
    }

    #[test]
    fn test_french_template_count() {
        let templates = get_wizard_templates_fr();
        assert_eq!(templates.len(), 3);
    }

    #[test]
    fn test_total_templates_by_locale() {
        // 3 languages × 3 wizards = 9 total
        let ja = get_wizard_templates_by_locale("ja");
        let en = get_wizard_templates_by_locale("en");
        let fr = get_wizard_templates_by_locale("fr");
        assert_eq!(ja.len() + en.len() + fr.len(), 9);
    }

    #[test]
    fn test_template_ids_unique_per_locale() {
        for locale in &["ja", "en", "fr"] {
            let templates = get_wizard_templates_by_locale(locale);
            let ids: Vec<&str> = templates.iter().map(|t| t.id.as_str()).collect();
            let mut unique_ids = ids.clone();
            unique_ids.sort();
            unique_ids.dedup();
            assert_eq!(ids.len(), unique_ids.len(), "Duplicate IDs in locale {}", locale);
        }
    }

    #[test]
    fn test_each_template_has_steps() {
        for locale in &["ja", "en", "fr"] {
            let templates = get_wizard_templates_by_locale(locale);
            for tmpl in &templates {
                assert!(!tmpl.steps.is_empty(), "Template {} has no steps", tmpl.id);
            }
        }
    }

    #[test]
    fn test_each_step_has_options() {
        for locale in &["ja", "en", "fr"] {
            let templates = get_wizard_templates_by_locale(locale);
            for tmpl in &templates {
                for step in &tmpl.steps {
                    assert!(!step.options.is_empty(), "Step {} in {} has no options", step.id, tmpl.id);
                }
            }
        }
    }

    #[test]
    fn test_step_ids_unique_within_template() {
        for locale in &["ja", "en", "fr"] {
            let templates = get_wizard_templates_by_locale(locale);
            for tmpl in &templates {
                let ids: Vec<&str> = tmpl.steps.iter().map(|s| s.id.as_str()).collect();
                let mut unique_ids = ids.clone();
                unique_ids.sort();
                unique_ids.dedup();
                assert_eq!(ids.len(), unique_ids.len(), "Duplicate step IDs in template {}", tmpl.id);
            }
        }
    }

    #[test]
    fn test_block_rules_exist() {
        for locale in &["ja", "en", "fr"] {
            let templates = get_wizard_templates_by_locale(locale);
            for tmpl in &templates {
                assert!(!tmpl.block_rules.is_empty(), "Template {} has no block rules", tmpl.id);
            }
        }
    }

    #[test]
    fn test_fallback_blocks_exist() {
        for locale in &["ja", "en", "fr"] {
            let templates = get_wizard_templates_by_locale(locale);
            for tmpl in &templates {
                assert!(!tmpl.fallback_blocks.is_empty(), "Template {} has no fallback blocks", tmpl.id);
            }
        }
    }

    #[test]
    fn test_block_types_valid() {
        let valid_prefixes = ["promps_"];
        for locale in &["ja", "en", "fr"] {
            let templates = get_wizard_templates_by_locale(locale);
            for tmpl in &templates {
                for rule in &tmpl.block_rules {
                    for block in &rule.blocks {
                        assert!(
                            valid_prefixes.iter().any(|p| block.block_type.starts_with(p)),
                            "Invalid block_type '{}' in template {}", block.block_type, tmpl.id
                        );
                    }
                }
                for block in &tmpl.fallback_blocks {
                    assert!(
                        valid_prefixes.iter().any(|p| block.block_type.starts_with(p)),
                        "Invalid fallback block_type '{}' in template {}", block.block_type, tmpl.id
                    );
                }
            }
        }
    }

    #[test]
    fn test_all_templates_are_enterprise_tier() {
        for locale in &["ja", "en", "fr"] {
            let templates = get_wizard_templates_by_locale(locale);
            for tmpl in &templates {
                assert_eq!(tmpl.tier, WizardTier::Enterprise, "Template {} should be Enterprise tier", tmpl.id);
            }
        }
    }

    #[test]
    fn test_default_locale_returns_japanese() {
        let default = get_wizard_templates_by_locale("unknown");
        let ja = get_wizard_templates();
        assert_eq!(default.len(), ja.len());
        assert_eq!(default[0].id, ja[0].id);
    }

    #[test]
    fn test_wizard_template_serialization() {
        let templates = get_wizard_templates();
        let json = serde_json::to_string(&templates).unwrap();
        let parsed: Vec<WizardTemplate> = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.len(), templates.len());
        assert_eq!(parsed[0].id, templates[0].id);
    }

    #[test]
    fn test_block_rule_conditions_reference_valid_steps() {
        for locale in &["ja", "en", "fr"] {
            let templates = get_wizard_templates_by_locale(locale);
            for tmpl in &templates {
                let step_ids: Vec<&str> = tmpl.steps.iter().map(|s| s.id.as_str()).collect();
                for rule in &tmpl.block_rules {
                    for key in rule.conditions.keys() {
                        assert!(
                            step_ids.contains(&key.as_str()),
                            "Condition key '{}' not found in steps of template {}", key, tmpl.id
                        );
                    }
                }
            }
        }
    }
}
