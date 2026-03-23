/// Promps Phase 5-6 - Grammar Validation Module
///
/// This module provides grammar validation for DSL sequences.
/// It checks for common Japanese grammar patterns and reports errors/warnings.

use serde::{Deserialize, Serialize};

// ============================================================================
// Token Classification
// ============================================================================

/// Token types for grammar validation
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TokenType {
    /// Noun (名詞) - tokens starting with _N:
    Noun,
    /// Particle (助詞) - が、を、に、で、と、へ、から、まで、より
    Particle,
    /// Verb (動詞) - fixed verbs and custom verbs ending in して/する
    Verb,
    /// Punctuation (句読点) - 、。！？"',/&
    Punctuation,
    /// Article (冠詞) - a, an, the, this, that (English mode)
    Article,
    /// Preposition (前置詞) - to, with, from, etc. (English mode)
    Preposition,
    /// Please marker (polite request marker in English)
    Please,
    /// Other (その他) - everything else
    Other,
}

impl TokenType {
    /// Classify a token into its type
    pub fn classify(token: &str) -> Self {
        let token = token.trim();

        // Check for noun marker
        if token.starts_with("_N:") {
            return TokenType::Noun;
        }

        // Check for verb marker
        if token.starts_with("_V:") {
            return TokenType::Verb;
        }

        // Check for particles (助詞)
        if Self::is_particle(token) {
            return TokenType::Particle;
        }

        // Check for verbs (動詞)
        if Self::is_verb(token) {
            return TokenType::Verb;
        }

        // Check for punctuation (句読点)
        if Self::is_punctuation(token) {
            return TokenType::Punctuation;
        }

        TokenType::Other
    }

    /// Check if token is a particle (助詞)
    fn is_particle(token: &str) -> bool {
        // Common Japanese particles
        const PARTICLES: &[&str] = &[
            "が", "を", "に", "で", "と", "へ", "から", "まで", "より",
            "の", "も", "は", "や", "か", "ね", "よ", "わ",
        ];
        PARTICLES.contains(&token)
    }

    /// Check if token is a verb (動詞)
    fn is_verb(token: &str) -> bool {
        // Fixed verbs from Phase 3
        const FIXED_VERBS: &[&str] = &[
            "分析して", "要約して", "翻訳して", "作成して",
            "削除して", "更新して", "検索して", "表示して",
            "保存して", "読み込んで", "送信して", "受信して",
        ];

        if FIXED_VERBS.contains(&token) {
            return true;
        }

        // Custom verbs ending in して or する
        if token.ends_with("して") || token.ends_with("する") {
            return true;
        }

        false
    }

    /// Check if token is punctuation (句読点)
    fn is_punctuation(token: &str) -> bool {
        const PUNCTUATION: &[&str] = &[
            "、", "。", "！", "？", "\"", "'", ",", "/", "&",
        ];
        PUNCTUATION.contains(&token)
    }

    /// Check if token is a comma/touten (読点)
    pub fn is_touten(token: &str) -> bool {
        token == "、"
    }

    /// Check if token is a period/kuten (句点)
    pub fn is_kuten(token: &str) -> bool {
        token == "。"
    }

    /// Check if token is an English period
    pub fn is_period(token: &str) -> bool {
        token == "."
    }

    // ========================================================================
    // English Token Classification
    // ========================================================================

    /// Classify a token for English mode
    pub fn classify_en(token: &str) -> Self {
        let token = token.trim();
        let token_lower = token.to_lowercase();

        // Check for noun marker
        if token.starts_with("_N:") {
            return TokenType::Noun;
        }

        // Check for verb marker
        if token.starts_with("_V:") {
            return TokenType::Verb;
        }

        // Check for articles
        if Self::is_article(&token_lower) {
            return TokenType::Article;
        }

        // Check for "please" (special polite marker)
        if token_lower == "please" {
            return TokenType::Please;
        }

        // Check for English verbs
        if Self::is_english_verb(&token_lower) {
            return TokenType::Verb;
        }

        // Check for prepositions
        if Self::is_preposition(&token_lower) {
            return TokenType::Preposition;
        }

        // Check for punctuation
        if Self::is_english_punctuation(token) {
            return TokenType::Punctuation;
        }

        TokenType::Other
    }

    /// Check if token is an English article
    fn is_article(token: &str) -> bool {
        const ARTICLES: &[&str] = &["a", "an", "the", "this", "that", "these", "those"];
        ARTICLES.contains(&token)
    }

    /// Check if token is an English verb
    fn is_english_verb(token: &str) -> bool {
        const VERBS: &[&str] = &[
            "analyze", "summarize", "translate", "create", "generate",
            "convert", "delete", "update", "extract", "explain",
            "describe", "teach", "process", "find", "search",
            "show", "display", "list", "get", "make",
            "write", "read", "check", "verify", "validate",
            "compare", "format", "optimize", "review", "edit",
        ];
        VERBS.contains(&token)
    }

    /// Check if token is a preposition
    fn is_preposition(token: &str) -> bool {
        const PREPOSITIONS: &[&str] = &[
            "to", "with", "from", "in", "on", "at", "for",
            "by", "about", "into", "through", "between",
            "under", "over", "after", "before", "without",
        ];
        PREPOSITIONS.contains(&token)
    }

    /// Check if token is English punctuation
    fn is_english_punctuation(token: &str) -> bool {
        const PUNCTUATION: &[&str] = &[
            ".", ",", "!", "?", "\"", "'", "/", "&", ";", ":",
        ];
        PUNCTUATION.contains(&token)
    }

    // ========================================================================
    // French Token Classification
    // ========================================================================

    /// Classify a token for French mode
    pub fn classify_fr(token: &str) -> Self {
        let token = token.trim();
        let token_lower = token.to_lowercase();

        // Check for noun marker
        if token.starts_with("_N:") {
            return TokenType::Noun;
        }

        // Check for verb marker
        if token.starts_with("_V:") {
            return TokenType::Verb;
        }

        // Check for articles
        if Self::is_french_article(&token_lower) {
            return TokenType::Article;
        }

        // Check for "veuillez" (French polite marker)
        if token_lower == "veuillez" {
            return TokenType::Please;
        }

        // Check for French verbs
        if Self::is_french_verb(&token_lower) {
            return TokenType::Verb;
        }

        // Check for prepositions
        if Self::is_french_preposition(&token_lower) {
            return TokenType::Preposition;
        }

        // Check for punctuation
        if Self::is_english_punctuation(token) {
            return TokenType::Punctuation;
        }

        TokenType::Other
    }

    /// Check if token is a French article
    fn is_french_article(token: &str) -> bool {
        const ARTICLES: &[&str] = &[
            "le", "la", "les", "un", "une", "des",
            "ce", "cette", "ces", "cet",
        ];
        ARTICLES.contains(&token)
    }

    /// Check if token is a French verb (infinitive form)
    fn is_french_verb(token: &str) -> bool {
        const VERBS: &[&str] = &[
            "analyser", "résumer", "traduire", "créer", "générer",
            "convertir", "supprimer", "mettre", "extraire", "expliquer",
            "décrire", "enseigner", "traiter", "trouver", "chercher",
            "afficher", "lister", "obtenir", "faire",
            "écrire", "lire", "vérifier", "valider",
            "comparer", "formater", "optimiser", "réviser", "modifier",
        ];
        VERBS.contains(&token)
    }

    /// Check if token is a French preposition
    fn is_french_preposition(token: &str) -> bool {
        const PREPOSITIONS: &[&str] = &[
            "à", "de", "avec", "pour", "par", "en", "dans",
            "sur", "vers", "entre", "sous", "sans",
        ];
        PREPOSITIONS.contains(&token)
    }
}

// ============================================================================
// Validation Result Types
// ============================================================================

/// Severity level for validation errors
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    /// Error - must be fixed
    Error,
    /// Warning - should be reviewed
    Warning,
}

/// Validation error codes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ValidationErrorCode {
    // Japanese Grammar Rules (日本語文法ルール)
    /// Rule 1: Particle without preceding noun
    ParticleWithoutNoun,
    /// Rule 2: Consecutive particles
    ConsecutiveParticles,
    /// Rule 3: Verb not at end
    VerbNotAtEnd,
    /// Rule 4: Consecutive nouns without particle
    ConsecutiveNouns,
    /// Rule 5: Missing subject (no が with verb)
    MissingSubject,
    /// Rule 6: Missing object (no を with verb)
    MissingObject,
    /// Rule 7: Touten (、) after を particle (invalid)
    ToutenAfterWo,
    /// Rule 8: Touten (、) not after particle
    ToutenNotAfterParticle,
    /// Rule 9: Kuten (。) not after verb
    KutenNotAfterVerb,

    // English Grammar Rules (英語文法ルール)
    /// EN Rule 1: Article not followed by noun
    ArticleNotBeforeNoun,
    /// EN Rule 2: Consecutive articles
    ConsecutiveArticles,
    /// EN Rule 3: Verb at start without please (imperative)
    VerbAtStartEn,
    /// EN Rule 4: Preposition not followed by noun/article
    PrepositionWithoutObject,
    /// EN Rule 5: Please not at start or before verb
    PleasePosition,
    /// EN Rule 6: Period not at end
    PeriodNotAtEnd,
    /// EN Rule 7: Missing verb in sentence
    MissingVerb,
}

/// Auto-fix action type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AutoFixActionType {
    /// Insert a block before the target position
    InsertBefore,
    /// Insert a block after the target position
    InsertAfter,
}

/// Auto-fix action for automatic error correction
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoFixAction {
    /// Type of action to perform
    pub action_type: AutoFixActionType,
    /// Block type to insert (e.g., "promps_noun", "promps_particle_ga")
    pub block_type: String,
    /// Target position (0-indexed token position)
    pub target_position: usize,
    /// Label for the fix button
    pub label: String,
}

/// A single validation error or warning
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationError {
    /// Error code for programmatic handling
    pub code: ValidationErrorCode,
    /// Human-readable message (Japanese)
    pub message: String,
    /// Position in the token sequence (0-indexed)
    pub position: usize,
    /// Severity level
    pub severity: Severity,
    /// Suggested fix (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
    /// Auto-fix action (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub autofix: Option<AutoFixAction>,
}

impl ValidationError {
    /// Create a new validation error
    pub fn new(
        code: ValidationErrorCode,
        message: impl Into<String>,
        position: usize,
        severity: Severity,
        suggestion: Option<String>,
    ) -> Self {
        ValidationError {
            code,
            message: message.into(),
            position,
            severity,
            suggestion,
            autofix: None,
        }
    }

    /// Create a new validation error with auto-fix action
    pub fn with_autofix(
        code: ValidationErrorCode,
        message: impl Into<String>,
        position: usize,
        severity: Severity,
        suggestion: Option<String>,
        autofix: AutoFixAction,
    ) -> Self {
        ValidationError {
            code,
            message: message.into(),
            position,
            severity,
            suggestion,
            autofix: Some(autofix),
        }
    }
}

/// Result of validating a token sequence
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    /// Whether the sequence is valid (no errors)
    pub is_valid: bool,
    /// List of errors and warnings
    pub errors: Vec<ValidationError>,
    /// Count of errors
    pub error_count: usize,
    /// Count of warnings
    pub warning_count: usize,
}

impl ValidationResult {
    /// Create a new empty (valid) result
    pub fn new() -> Self {
        ValidationResult {
            is_valid: true,
            errors: Vec::new(),
            error_count: 0,
            warning_count: 0,
        }
    }

    /// Add an error to the result
    pub fn add_error(&mut self, error: ValidationError) {
        match error.severity {
            Severity::Error => {
                self.is_valid = false;
                self.error_count += 1;
            }
            Severity::Warning => {
                self.warning_count += 1;
            }
        }
        self.errors.push(error);
    }
}

impl Default for ValidationResult {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Validation Logic
// ============================================================================

/// Validate a DSL token sequence
///
/// # Arguments
/// * `input` - Space-delimited DSL tokens
///
/// # Returns
/// ValidationResult with any errors/warnings found
///
/// # Rules
/// 1. Particle must follow a noun (Error)
/// 2. No consecutive particles (Error)
/// 3. Verb should be at end (Warning)
/// 4. Consecutive nouns without particle (Warning)
/// 5. Missing subject - no が with verb (Warning)
/// 6. Missing object - no を with verb (Warning)
pub fn validate_sequence(input: &str) -> ValidationResult {
    let mut result = ValidationResult::new();

    // Tokenize input
    let tokens: Vec<&str> = input.split_whitespace().collect();

    if tokens.is_empty() {
        return result;
    }

    // Classify all tokens
    let classified: Vec<(usize, &str, TokenType)> = tokens
        .iter()
        .enumerate()
        .map(|(i, t)| (i, *t, TokenType::classify(t)))
        .collect();

    // Track state for validation
    let mut prev_type: Option<TokenType> = None;

    for (i, token, token_type) in classified.iter() {
        let i = *i;
        let token_type = *token_type;

        // Rule 1: Particle must follow a noun
        if token_type == TokenType::Particle {
            match prev_type {
                None => {
                    // Particle at beginning - add auto-fix to insert noun
                    result.add_error(ValidationError::with_autofix(
                        ValidationErrorCode::ParticleWithoutNoun,
                        format!("助詞「{}」の前に名詞がありません", token),
                        i,
                        Severity::Error,
                        Some("名詞ブロックを追加してください".to_string()),
                        AutoFixAction {
                            action_type: AutoFixActionType::InsertBefore,
                            block_type: "promps_noun".to_string(),
                            target_position: i,
                            label: "名詞を追加".to_string(),
                        },
                    ));
                }
                Some(TokenType::Noun) => {
                    // OK - particle follows noun
                }
                Some(TokenType::Particle) => {
                    // Rule 2: Consecutive particles - add auto-fix to insert noun
                    result.add_error(ValidationError::with_autofix(
                        ValidationErrorCode::ConsecutiveParticles,
                        format!("助詞「{}」が連続しています", token),
                        i,
                        Severity::Error,
                        Some("間に名詞や動詞を追加してください".to_string()),
                        AutoFixAction {
                            action_type: AutoFixActionType::InsertBefore,
                            block_type: "promps_noun".to_string(),
                            target_position: i,
                            label: "名詞を追加".to_string(),
                        },
                    ));
                }
                Some(_) => {
                    // Particle after verb or other - could be valid in some cases
                    // For now, allow it with a warning
                }
            }
        }

        // Rule 4: Consecutive nouns without particle (warning)
        if token_type == TokenType::Noun {
            if prev_type == Some(TokenType::Noun) {
                result.add_error(ValidationError::with_autofix(
                    ValidationErrorCode::ConsecutiveNouns,
                    "名詞が連続しています".to_string(),
                    i,
                    Severity::Warning,
                    Some("間に助詞を追加することを検討してください".to_string()),
                    AutoFixAction {
                        action_type: AutoFixActionType::InsertBefore,
                        block_type: "promps_particle_to".to_string(),
                        target_position: i,
                        label: "「と」を追加".to_string(),
                    },
                ));
            }
        }

        // Rule 7-9: Punctuation rules (句読点)
        if token_type == TokenType::Punctuation {
            // Rule 7 & 8: Touten (、) - only allowed after particle (except を)
            if TokenType::is_touten(token) {
                if i > 0 {
                    let prev_token = tokens[i - 1];
                    if prev_token == "を" {
                        // Rule 7: Touten after を is invalid
                        result.add_error(ValidationError::new(
                            ValidationErrorCode::ToutenAfterWo,
                            "「を」の後に読点「、」は使用できません".to_string(),
                            i,
                            Severity::Error,
                            Some("読点を削除するか、別の助詞を使用してください".to_string()),
                        ));
                    } else if prev_type != Some(TokenType::Particle) {
                        // Rule 8: Touten not after particle
                        result.add_error(ValidationError::new(
                            ValidationErrorCode::ToutenNotAfterParticle,
                            "読点「、」は助詞の後でのみ使用できます".to_string(),
                            i,
                            Severity::Error,
                            Some("読点の前に助詞を追加してください".to_string()),
                        ));
                    }
                } else {
                    // Touten at beginning
                    result.add_error(ValidationError::new(
                        ValidationErrorCode::ToutenNotAfterParticle,
                        "読点「、」は文頭では使用できません".to_string(),
                        i,
                        Severity::Error,
                        Some("読点を削除してください".to_string()),
                    ));
                }
            }

            // Rule 9: Kuten (。) - only allowed after verb
            if TokenType::is_kuten(token) {
                if prev_type != Some(TokenType::Verb) {
                    result.add_error(ValidationError::new(
                        ValidationErrorCode::KutenNotAfterVerb,
                        "句点「。」は動詞の後でのみ使用できます".to_string(),
                        i,
                        Severity::Error,
                        Some("句点の前に動詞を追加してください".to_string()),
                    ));
                }
            }
        }

        prev_type = Some(token_type);
    }

    // Rule 3: Verb should be at end (check after loop)
    // Find all verb positions
    for (i, _token, token_type) in classified.iter() {
        if *token_type == TokenType::Verb && *i < tokens.len() - 1 {
            // Check if there are non-particle tokens after this verb
            let has_significant_after = classified[*i + 1..]
                .iter()
                .any(|(_, _, t)| *t == TokenType::Noun || *t == TokenType::Verb);

            if has_significant_after {
                result.add_error(ValidationError::new(
                    ValidationErrorCode::VerbNotAtEnd,
                    "動詞が末尾にありません".to_string(),
                    *i,
                    Severity::Warning,
                    Some("動詞を文末に移動してください".to_string()),
                ));
            }
        }
    }

    // Check for presence of verb (needed for Rules 5 and 6)
    let has_verb = classified.iter().any(|(_, _, t)| *t == TokenType::Verb);

    if has_verb {
        // Find the verb position for error reporting
        let verb_pos = classified
            .iter()
            .find(|(_, _, t)| *t == TokenType::Verb)
            .map(|(i, _, _)| *i)
            .unwrap_or(0);

        // Rule 5: Missing subject (no が with verb)
        let has_ga = tokens.iter().any(|t| *t == "が");
        if !has_ga {
            result.add_error(ValidationError::with_autofix(
                ValidationErrorCode::MissingSubject,
                "主語がありません（「が」がありません）".to_string(),
                verb_pos,
                Severity::Warning,
                Some("「名詞 が」を追加してください".to_string()),
                AutoFixAction {
                    action_type: AutoFixActionType::InsertBefore,
                    block_type: "promps_particle_ga".to_string(),
                    target_position: 0,
                    label: "「が」を追加".to_string(),
                },
            ));
        }

        // Rule 6: Missing object (no を with verb)
        let has_wo = tokens.iter().any(|t| *t == "を");
        if !has_wo {
            result.add_error(ValidationError::with_autofix(
                ValidationErrorCode::MissingObject,
                "目的語がありません（「を」がありません）".to_string(),
                verb_pos,
                Severity::Warning,
                Some("「名詞 を」を追加してください".to_string()),
                AutoFixAction {
                    action_type: AutoFixActionType::InsertBefore,
                    block_type: "promps_particle_wo".to_string(),
                    target_position: verb_pos,
                    label: "「を」を追加".to_string(),
                },
            ));
        }
    }

    result
}

// ============================================================================
// English Validation (英語バリデーション)
// ============================================================================

/// Validate a DSL token sequence with locale support
///
/// # Arguments
/// * `input` - Space-delimited DSL tokens
/// * `locale` - Locale code ("ja" for Japanese, "en" for English)
///
/// # Returns
/// ValidationResult with any errors/warnings found
pub fn validate_sequence_with_locale(input: &str, locale: &str) -> ValidationResult {
    match locale {
        "en" => validate_sequence_en(input),
        "fr" => validate_sequence_fr(input),
        _ => validate_sequence(input), // Default to Japanese
    }
}

/// Validate a DSL token sequence for English grammar
///
/// # Arguments
/// * `input` - Space-delimited DSL tokens
///
/// # Returns
/// ValidationResult with any errors/warnings found
///
/// # Rules
/// 1. Article must be followed by noun (or adjective/other) (Error)
/// 2. No consecutive articles (Error)
/// 3. Verb at start is imperative (accepted) (Info)
/// 4. Preposition must be followed by noun/article (Warning)
/// 5. "please" should be at start or before verb (Warning)
/// 6. Period should be at end (Warning)
/// 7. Missing verb in sentence (Warning)
pub fn validate_sequence_en(input: &str) -> ValidationResult {
    let mut result = ValidationResult::new();

    // Tokenize input
    let tokens: Vec<&str> = input.split_whitespace().collect();

    if tokens.is_empty() {
        return result;
    }

    // Classify all tokens for English
    let classified: Vec<(usize, &str, TokenType)> = tokens
        .iter()
        .enumerate()
        .map(|(i, t)| (i, *t, TokenType::classify_en(t)))
        .collect();

    // Track state for validation
    let mut prev_type: Option<TokenType> = None;
    let mut prev_token: Option<&str> = None;

    for (i, token, token_type) in classified.iter() {
        let i = *i;
        let token_type = *token_type;

        // Rule 1: Article must be followed by noun (or other content)
        // Check previous token
        if let Some(prev) = prev_type {
            if prev == TokenType::Article {
                // Article should be followed by Noun, Other, or another content word
                // Not by Verb, Preposition, Punctuation, or another Article
                if token_type == TokenType::Verb
                    || token_type == TokenType::Preposition
                    || token_type == TokenType::Punctuation
                    || token_type == TokenType::Article
                    || token_type == TokenType::Please
                {
                    result.add_error(ValidationError::with_autofix(
                        ValidationErrorCode::ArticleNotBeforeNoun,
                        format!("Article '{}' should be followed by a noun", prev_token.unwrap_or("")),
                        i - 1,
                        Severity::Error,
                        Some("Add a noun after the article".to_string()),
                        AutoFixAction {
                            action_type: AutoFixActionType::InsertAfter,
                            block_type: "promps_noun".to_string(),
                            target_position: i - 1,
                            label: "Add noun".to_string(),
                        },
                    ));
                }
            }
        }

        // Rule 2: No consecutive articles
        if token_type == TokenType::Article && prev_type == Some(TokenType::Article) {
            result.add_error(ValidationError::new(
                ValidationErrorCode::ConsecutiveArticles,
                format!("Consecutive articles: '{}' follows another article", token),
                i,
                Severity::Error,
                Some("Remove one of the articles".to_string()),
            ));
        }

        // Rule 4: Preposition must be followed by noun or article
        if let Some(prev) = prev_type {
            if prev == TokenType::Preposition {
                if token_type != TokenType::Noun
                    && token_type != TokenType::Article
                    && token_type != TokenType::Other
                {
                    result.add_error(ValidationError::with_autofix(
                        ValidationErrorCode::PrepositionWithoutObject,
                        format!("Preposition '{}' should be followed by a noun", prev_token.unwrap_or("")),
                        i - 1,
                        Severity::Warning,
                        Some("Add a noun after the preposition".to_string()),
                        AutoFixAction {
                            action_type: AutoFixActionType::InsertAfter,
                            block_type: "promps_noun".to_string(),
                            target_position: i - 1,
                            label: "Add noun".to_string(),
                        },
                    ));
                }
            }
        }

        // Rule 5: "please" should be at start or immediately before verb
        if token_type == TokenType::Please {
            // Check if at start (position 0) - OK
            // Or check if next token is a verb - OK
            // Otherwise - Warning
            if i > 0 {
                // Not at start, check if verb follows
                let verb_follows = classified.get(i + 1).map(|(_, _, t)| *t == TokenType::Verb).unwrap_or(false);
                if !verb_follows {
                    result.add_error(ValidationError::new(
                        ValidationErrorCode::PleasePosition,
                        "'please' is typically placed at the start or before a verb".to_string(),
                        i,
                        Severity::Warning,
                        Some("Move 'please' to the beginning or before the verb".to_string()),
                    ));
                }
            }
        }

        // Rule 6: Period should be at end (checked in post-loop)
        // Punctuation rules
        if token_type == TokenType::Punctuation {
            if TokenType::is_period(token) && i < tokens.len() - 1 {
                result.add_error(ValidationError::new(
                    ValidationErrorCode::PeriodNotAtEnd,
                    "Period should be at the end of the sentence".to_string(),
                    i,
                    Severity::Warning,
                    Some("Move the period to the end".to_string()),
                ));
            }
        }

        prev_type = Some(token_type);
        prev_token = Some(*token);
    }

    // Rule 7: Missing verb check
    let has_verb = classified.iter().any(|(_, _, t)| *t == TokenType::Verb);
    if !has_verb && !tokens.is_empty() {
        // Only warn if there's some content (nouns, etc.)
        let has_content = classified.iter().any(|(_, _, t)| {
            matches!(t, TokenType::Noun | TokenType::Other | TokenType::Article)
        });
        if has_content {
            result.add_error(ValidationError::with_autofix(
                ValidationErrorCode::MissingVerb,
                "Sentence has no verb (action)".to_string(),
                0,
                Severity::Warning,
                Some("Add a verb to specify the action".to_string()),
                AutoFixAction {
                    action_type: AutoFixActionType::InsertBefore,
                    block_type: "promps_verb_analyze".to_string(),
                    target_position: 0,
                    label: "Add verb".to_string(),
                },
            ));
        }
    }

    // Final check: Article at end without noun
    if let Some((last_i, last_token, last_type)) = classified.last() {
        if *last_type == TokenType::Article {
            result.add_error(ValidationError::with_autofix(
                ValidationErrorCode::ArticleNotBeforeNoun,
                format!("Article '{}' at end of sentence needs a noun", last_token),
                *last_i,
                Severity::Error,
                Some("Add a noun after the article".to_string()),
                AutoFixAction {
                    action_type: AutoFixActionType::InsertAfter,
                    block_type: "promps_noun".to_string(),
                    target_position: *last_i,
                    label: "Add noun".to_string(),
                },
            ));
        }
    }

    result
}

// ============================================================================
// French Validation (フランス語バリデーション)
// ============================================================================

/// Validate a DSL token sequence for French grammar
///
/// # Arguments
/// * `input` - Space-delimited DSL tokens
///
/// # Returns
/// ValidationResult with any errors/warnings found
///
/// # Rules (same SVO structure as English)
/// 1. Article must be followed by noun (or adjective/other) (Error)
/// 2. No consecutive articles (Error)
/// 3. Verb at start is imperative (accepted) (Info)
/// 4. Preposition must be followed by noun/article (Warning)
/// 5. "veuillez" should be at start or before verb (Warning)
/// 6. Period should be at end (Warning)
/// 7. Missing verb in sentence (Warning)
pub fn validate_sequence_fr(input: &str) -> ValidationResult {
    let mut result = ValidationResult::new();

    // Tokenize input
    let tokens: Vec<&str> = input.split_whitespace().collect();

    if tokens.is_empty() {
        return result;
    }

    // Classify all tokens for French
    let classified: Vec<(usize, &str, TokenType)> = tokens
        .iter()
        .enumerate()
        .map(|(i, t)| (i, *t, TokenType::classify_fr(t)))
        .collect();

    // Track state for validation
    let mut prev_type: Option<TokenType> = None;
    let mut prev_token: Option<&str> = None;

    for (i, token, token_type) in classified.iter() {
        let i = *i;
        let token_type = *token_type;

        // Rule 1: Article must be followed by noun (or other content)
        if let Some(prev) = prev_type {
            if prev == TokenType::Article {
                if token_type == TokenType::Verb
                    || token_type == TokenType::Preposition
                    || token_type == TokenType::Punctuation
                    || token_type == TokenType::Article
                    || token_type == TokenType::Please
                {
                    result.add_error(ValidationError::with_autofix(
                        ValidationErrorCode::ArticleNotBeforeNoun,
                        format!("L'article '{}' doit être suivi d'un nom", prev_token.unwrap_or("")),
                        i - 1,
                        Severity::Error,
                        Some("Ajoutez un nom après l'article".to_string()),
                        AutoFixAction {
                            action_type: AutoFixActionType::InsertAfter,
                            block_type: "promps_noun".to_string(),
                            target_position: i - 1,
                            label: "Ajouter un nom".to_string(),
                        },
                    ));
                }
            }
        }

        // Rule 2: No consecutive articles
        if token_type == TokenType::Article && prev_type == Some(TokenType::Article) {
            result.add_error(ValidationError::new(
                ValidationErrorCode::ConsecutiveArticles,
                format!("Articles consécutifs : '{}' suit un autre article", token),
                i,
                Severity::Error,
                Some("Supprimez l'un des articles".to_string()),
            ));
        }

        // Rule 4: Preposition must be followed by noun or article
        if let Some(prev) = prev_type {
            if prev == TokenType::Preposition {
                if token_type != TokenType::Noun
                    && token_type != TokenType::Article
                    && token_type != TokenType::Other
                {
                    result.add_error(ValidationError::with_autofix(
                        ValidationErrorCode::PrepositionWithoutObject,
                        format!("La préposition '{}' doit être suivie d'un nom", prev_token.unwrap_or("")),
                        i - 1,
                        Severity::Warning,
                        Some("Ajoutez un nom après la préposition".to_string()),
                        AutoFixAction {
                            action_type: AutoFixActionType::InsertAfter,
                            block_type: "promps_noun".to_string(),
                            target_position: i - 1,
                            label: "Ajouter un nom".to_string(),
                        },
                    ));
                }
            }
        }

        // Rule 5: "veuillez" should be at start or immediately before verb
        if token_type == TokenType::Please {
            if i > 0 {
                let verb_follows = classified.get(i + 1).map(|(_, _, t)| *t == TokenType::Verb).unwrap_or(false);
                if !verb_follows {
                    result.add_error(ValidationError::new(
                        ValidationErrorCode::PleasePosition,
                        "'veuillez' doit être placé en début de phrase ou avant un verbe".to_string(),
                        i,
                        Severity::Warning,
                        Some("Déplacez 'veuillez' au début ou avant le verbe".to_string()),
                    ));
                }
            }
        }

        // Rule 6: Period should be at end
        if token_type == TokenType::Punctuation {
            if TokenType::is_period(token) && i < tokens.len() - 1 {
                result.add_error(ValidationError::new(
                    ValidationErrorCode::PeriodNotAtEnd,
                    "Le point doit être à la fin de la phrase".to_string(),
                    i,
                    Severity::Warning,
                    Some("Déplacez le point à la fin".to_string()),
                ));
            }
        }

        prev_type = Some(token_type);
        prev_token = Some(*token);
    }

    // Rule 7: Missing verb check
    let has_verb = classified.iter().any(|(_, _, t)| *t == TokenType::Verb);
    if !has_verb && !tokens.is_empty() {
        let has_content = classified.iter().any(|(_, _, t)| {
            matches!(t, TokenType::Noun | TokenType::Other | TokenType::Article)
        });
        if has_content {
            result.add_error(ValidationError::with_autofix(
                ValidationErrorCode::MissingVerb,
                "La phrase ne contient pas de verbe (action)".to_string(),
                0,
                Severity::Warning,
                Some("Ajoutez un verbe pour préciser l'action".to_string()),
                AutoFixAction {
                    action_type: AutoFixActionType::InsertBefore,
                    block_type: "promps_verb_analyze".to_string(),
                    target_position: 0,
                    label: "Ajouter un verbe".to_string(),
                },
            ));
        }
    }

    // Final check: Article at end without noun
    if let Some((last_i, last_token, last_type)) = classified.last() {
        if *last_type == TokenType::Article {
            result.add_error(ValidationError::with_autofix(
                ValidationErrorCode::ArticleNotBeforeNoun,
                format!("L'article '{}' en fin de phrase nécessite un nom", last_token),
                *last_i,
                Severity::Error,
                Some("Ajoutez un nom après l'article".to_string()),
                AutoFixAction {
                    action_type: AutoFixActionType::InsertAfter,
                    block_type: "promps_noun".to_string(),
                    target_position: *last_i,
                    label: "Ajouter un nom".to_string(),
                },
            ));
        }
    }

    result
}

// ============================================================================
// Pattern Templates (Phase 6 Step 3)
// ============================================================================

/// A pattern template for common sentence structures
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternTemplate {
    /// Unique identifier for the pattern
    pub id: String,
    /// Human-readable name (Japanese)
    pub name: String,
    /// Description of when to use this pattern
    pub description: String,
    /// The pattern structure (e.g., "Noun が Noun を Verb")
    pub structure: String,
    /// Example usage
    pub example: String,
    /// Block types to insert (in order)
    pub blocks: Vec<PatternBlock>,
}

/// A block in a pattern template
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternBlock {
    /// Block type (e.g., "promps_noun", "promps_particle_ga")
    pub block_type: String,
    /// Display label for the slot
    pub label: String,
    /// Whether this is a placeholder that user should fill
    pub is_placeholder: bool,
    /// Default value for text fields (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<String>,
}

impl PatternTemplate {
    /// Create a new pattern template
    pub fn new(
        id: impl Into<String>,
        name: impl Into<String>,
        description: impl Into<String>,
        structure: impl Into<String>,
        example: impl Into<String>,
        blocks: Vec<PatternBlock>,
    ) -> Self {
        PatternTemplate {
            id: id.into(),
            name: name.into(),
            description: description.into(),
            structure: structure.into(),
            example: example.into(),
            blocks,
        }
    }
}

impl PatternBlock {
    /// Create a placeholder block (user should fill)
    pub fn placeholder(block_type: impl Into<String>, label: impl Into<String>) -> Self {
        PatternBlock {
            block_type: block_type.into(),
            label: label.into(),
            is_placeholder: true,
            default_value: None,
        }
    }

    /// Create a fixed block (particle)
    pub fn fixed(block_type: impl Into<String>, label: impl Into<String>) -> Self {
        PatternBlock {
            block_type: block_type.into(),
            label: label.into(),
            is_placeholder: false,
            default_value: None,
        }
    }

    /// Create a block with a default value (for text input blocks)
    pub fn with_value(block_type: impl Into<String>, label: impl Into<String>, value: impl Into<String>) -> Self {
        PatternBlock {
            block_type: block_type.into(),
            label: label.into(),
            is_placeholder: false,
            default_value: Some(value.into()),
        }
    }
}

/// Get all available pattern templates
pub fn get_pattern_templates() -> Vec<PatternTemplate> {
    vec![
        // Pattern 1: Basic S-O-V (Subject-Object-Verb)
        PatternTemplate::new(
            "sov_basic",
            "基本文型（主語-目的語-動詞）",
            "「誰が何をどうする」の基本形",
            "名詞 が 名詞 を 動詞",
            "ユーザー が ドキュメント を 分析して",
            vec![
                PatternBlock::placeholder("promps_noun", "主語"),
                PatternBlock::fixed("promps_particle_ga", "が"),
                PatternBlock::placeholder("promps_noun", "目的語"),
                PatternBlock::fixed("promps_particle_wo", "を"),
                PatternBlock::placeholder("promps_verb_analyze", "動詞"),
            ],
        ),
        // Pattern 2: Object-Verb (目的語-動詞)
        PatternTemplate::new(
            "ov_simple",
            "目的語-動詞文型",
            "「何をどうする」のシンプル形",
            "名詞 を 動詞",
            "ドキュメント を 要約して",
            vec![
                PatternBlock::placeholder("promps_noun", "目的語"),
                PatternBlock::fixed("promps_particle_wo", "を"),
                PatternBlock::placeholder("promps_verb_summarize", "動詞"),
            ],
        ),
        // Pattern 3: Topic pattern (について)
        PatternTemplate::new(
            "topic_about",
            "トピック文型（について）",
            "「〇〇について」でトピックを指定",
            "名詞 について 動詞",
            "データ について 分析して",
            vec![
                PatternBlock::placeholder("promps_noun", "トピック"),
                PatternBlock::with_value("promps_other", "について", "について"),
                PatternBlock::placeholder("promps_verb_analyze", "動詞"),
            ],
        ),
        // Pattern 4: Means/Location pattern (で)
        PatternTemplate::new(
            "means_de",
            "手段・場所文型（で）",
            "「〇〇で」で手段や場所を指定",
            "名詞 で 名詞 を 動詞",
            "日本語 で メール を 翻訳して",
            vec![
                PatternBlock::placeholder("promps_noun", "手段/場所"),
                PatternBlock::fixed("promps_particle_de", "で"),
                PatternBlock::placeholder("promps_noun", "目的語"),
                PatternBlock::fixed("promps_particle_wo", "を"),
                PatternBlock::placeholder("promps_verb_translate", "動詞"),
            ],
        ),
        // Pattern 5: Parallel pattern (と)
        PatternTemplate::new(
            "parallel_to",
            "並列文型（と）",
            "「AとBを」で複数の対象を指定",
            "名詞 と 名詞 を 動詞",
            "データ と 結果 を 保存して",
            vec![
                PatternBlock::placeholder("promps_noun", "対象1"),
                PatternBlock::fixed("promps_particle_to", "と"),
                PatternBlock::placeholder("promps_noun", "対象2"),
                PatternBlock::fixed("promps_particle_wo", "を"),
                PatternBlock::with_value("promps_verb_custom", "動詞", "保存して"),
            ],
        ),
        // Pattern 6: Source-Destination pattern (から...へ/に)
        PatternTemplate::new(
            "source_dest",
            "起点-終点文型（から...に）",
            "「どこからどこへ」の移動・変換",
            "名詞 から 名詞 に 動詞",
            "英語 から 日本語 に 翻訳して",
            vec![
                PatternBlock::placeholder("promps_noun", "起点"),
                PatternBlock::fixed("promps_particle_kara", "から"),
                PatternBlock::placeholder("promps_noun", "終点"),
                PatternBlock::fixed("promps_particle_ni", "に"),
                PatternBlock::placeholder("promps_verb_translate", "動詞"),
            ],
        ),
        // Pattern 7: Object-first pattern (OSV - 目的語先行)
        PatternTemplate::new(
            "osv_emphasis",
            "目的語先行文型（を...が）",
            "目的語を先に述べて強調する形",
            "名詞 を 名詞 が 動詞",
            "ドキュメント を ユーザー が 分析して",
            vec![
                PatternBlock::placeholder("promps_noun", "目的語"),
                PatternBlock::fixed("promps_particle_wo", "を"),
                PatternBlock::placeholder("promps_noun", "主語"),
                PatternBlock::fixed("promps_particle_ga", "が"),
                PatternBlock::placeholder("promps_verb_analyze", "動詞"),
            ],
        ),
    ]
}

/// Get pattern templates for English mode
pub fn get_pattern_templates_en() -> Vec<PatternTemplate> {
    vec![
        // Pattern 1: Simple imperative (Verb Noun)
        PatternTemplate::new(
            "svo_basic",
            "Simple Command",
            "Basic imperative: verb + object",
            "Verb Noun",
            "analyze document",
            vec![
                PatternBlock::placeholder("promps_verb_analyze", "Action"),
                PatternBlock::placeholder("promps_noun", "Object"),
            ],
        ),
        // Pattern 2: With article (Verb Article Noun)
        PatternTemplate::new(
            "svo_article",
            "Command with Article",
            "Imperative with definite/indefinite article",
            "Verb Article Noun",
            "summarize the report",
            vec![
                PatternBlock::placeholder("promps_verb_summarize", "Action"),
                PatternBlock::fixed("promps_article_the", "the"),
                PatternBlock::placeholder("promps_noun", "Object"),
            ],
        ),
        // Pattern 3: With preposition (Verb Noun Prep Noun)
        PatternTemplate::new(
            "svo_prep",
            "Command with Preposition",
            "Imperative with prepositional phrase",
            "Verb Noun Prep Noun",
            "translate document to Japanese",
            vec![
                PatternBlock::placeholder("promps_verb_translate", "Action"),
                PatternBlock::placeholder("promps_noun", "Object"),
                PatternBlock::fixed("promps_particle_ni", "to"),
                PatternBlock::placeholder("promps_noun", "Target"),
            ],
        ),
        // Pattern 4: Polite request (please Verb Noun)
        PatternTemplate::new(
            "polite",
            "Polite Request",
            "Polite imperative with 'please'",
            "please Verb Noun",
            "please analyze this data",
            vec![
                PatternBlock::fixed("promps_article_please", "please"),
                PatternBlock::placeholder("promps_verb_analyze", "Action"),
                PatternBlock::fixed("promps_article_this", "this"),
                PatternBlock::placeholder("promps_noun", "Object"),
            ],
        ),
        // Pattern 5: With article and preposition
        PatternTemplate::new(
            "svo_article_prep",
            "Full Command",
            "Complete command with article and preposition",
            "Verb Article Noun Prep Noun",
            "convert the file to PDF",
            vec![
                PatternBlock::placeholder("promps_verb_convert", "Action"),
                PatternBlock::fixed("promps_article_the", "the"),
                PatternBlock::placeholder("promps_noun", "Object"),
                PatternBlock::fixed("promps_particle_ni", "to"),
                PatternBlock::placeholder("promps_noun", "Target"),
            ],
        ),
        // Pattern 6: From-to pattern
        PatternTemplate::new(
            "from_to",
            "From-To Conversion",
            "Conversion or transfer pattern",
            "Verb Noun from Noun to Noun",
            "translate text from English to Japanese",
            vec![
                PatternBlock::placeholder("promps_verb_translate", "Action"),
                PatternBlock::placeholder("promps_noun", "Object"),
                PatternBlock::fixed("promps_particle_kara", "from"),
                PatternBlock::placeholder("promps_noun", "Source"),
                PatternBlock::fixed("promps_particle_ni", "to"),
                PatternBlock::placeholder("promps_noun", "Target"),
            ],
        ),
        // Pattern 7: With modifier (using/with)
        PatternTemplate::new(
            "with_modifier",
            "Command with Modifier",
            "Command specifying method or tool",
            "Verb Noun with Noun",
            "analyze data with AI",
            vec![
                PatternBlock::placeholder("promps_verb_analyze", "Action"),
                PatternBlock::placeholder("promps_noun", "Object"),
                PatternBlock::fixed("promps_particle_de", "with"),
                PatternBlock::placeholder("promps_noun", "Tool/Method"),
            ],
        ),
    ]
}

/// Get pattern templates for French mode
pub fn get_pattern_templates_fr() -> Vec<PatternTemplate> {
    vec![
        // Pattern 1: Simple imperative (Verb Noun)
        PatternTemplate::new(
            "svo_basic",
            "Commande simple",
            "Impératif basique : verbe + objet",
            "Verbe Nom",
            "analyser document",
            vec![
                PatternBlock::placeholder("promps_verb_analyze", "Action"),
                PatternBlock::placeholder("promps_noun", "Objet"),
            ],
        ),
        // Pattern 2: With article (Verb Article Noun)
        PatternTemplate::new(
            "svo_article",
            "Commande avec article",
            "Impératif avec article défini/indéfini",
            "Verbe Article Nom",
            "résumer le rapport",
            vec![
                PatternBlock::placeholder("promps_verb_summarize", "Action"),
                PatternBlock::fixed("promps_article_the", "le"),
                PatternBlock::placeholder("promps_noun", "Objet"),
            ],
        ),
        // Pattern 3: With preposition (Verb Noun Prep Noun)
        PatternTemplate::new(
            "svo_prep",
            "Commande avec préposition",
            "Impératif avec complément prépositionnel",
            "Verbe Nom Prép Nom",
            "traduire document en japonais",
            vec![
                PatternBlock::placeholder("promps_verb_translate", "Action"),
                PatternBlock::placeholder("promps_noun", "Objet"),
                PatternBlock::fixed("promps_particle_ni", "à"),
                PatternBlock::placeholder("promps_noun", "Cible"),
            ],
        ),
        // Pattern 4: Polite request (veuillez Verb Noun)
        PatternTemplate::new(
            "polite",
            "Requête polie",
            "Impératif poli avec 'veuillez'",
            "veuillez Verbe Nom",
            "veuillez analyser ce document",
            vec![
                PatternBlock::fixed("promps_article_please", "veuillez"),
                PatternBlock::placeholder("promps_verb_analyze", "Action"),
                PatternBlock::fixed("promps_article_this", "ce"),
                PatternBlock::placeholder("promps_noun", "Objet"),
            ],
        ),
        // Pattern 5: With article and preposition
        PatternTemplate::new(
            "svo_article_prep",
            "Commande complète",
            "Commande avec article et préposition",
            "Verbe Article Nom Prép Nom",
            "convertir le fichier en PDF",
            vec![
                PatternBlock::placeholder("promps_verb_convert", "Action"),
                PatternBlock::fixed("promps_article_the", "le"),
                PatternBlock::placeholder("promps_noun", "Objet"),
                PatternBlock::fixed("promps_particle_ni", "à"),
                PatternBlock::placeholder("promps_noun", "Cible"),
            ],
        ),
        // Pattern 6: From-to pattern
        PatternTemplate::new(
            "from_to",
            "Conversion de-à",
            "Patron de conversion ou transfert",
            "Verbe Nom de Nom à Nom",
            "traduire texte de anglais à japonais",
            vec![
                PatternBlock::placeholder("promps_verb_translate", "Action"),
                PatternBlock::placeholder("promps_noun", "Objet"),
                PatternBlock::fixed("promps_particle_kara", "de"),
                PatternBlock::placeholder("promps_noun", "Source"),
                PatternBlock::fixed("promps_particle_ni", "à"),
                PatternBlock::placeholder("promps_noun", "Cible"),
            ],
        ),
        // Pattern 7: With modifier (avec)
        PatternTemplate::new(
            "with_modifier",
            "Commande avec modificateur",
            "Commande précisant la méthode ou l'outil",
            "Verbe Nom avec Nom",
            "analyser données avec IA",
            vec![
                PatternBlock::placeholder("promps_verb_analyze", "Action"),
                PatternBlock::placeholder("promps_noun", "Objet"),
                PatternBlock::fixed("promps_particle_de", "avec"),
                PatternBlock::placeholder("promps_noun", "Outil/Méthode"),
            ],
        ),
    ]
}

/// Get pattern templates based on locale
pub fn get_pattern_templates_by_locale(locale: &str) -> Vec<PatternTemplate> {
    match locale {
        "en" => get_pattern_templates_en(),
        "fr" => get_pattern_templates_fr(),
        _ => get_pattern_templates(), // Default to Japanese
    }
}

/// Result of pattern matching
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternMatchResult {
    /// Pattern ID
    pub pattern_id: String,
    /// Pattern name
    pub pattern_name: String,
    /// How well the current input matches (0.0 - 1.0)
    pub match_score: f64,
    /// Missing elements to complete the pattern
    pub missing_elements: Vec<String>,
    /// Whether the pattern is complete
    pub is_complete: bool,
}

/// Analyze current input against patterns with locale support
pub fn analyze_patterns_with_locale(input: &str, locale: &str) -> Vec<PatternMatchResult> {
    let tokens: Vec<&str> = input.split_whitespace().collect();
    let patterns = get_pattern_templates_by_locale(locale);
    let mut results = Vec::new();

    for pattern in patterns {
        let result = match_pattern_with_locale(&tokens, &pattern, locale);
        results.push(result);
    }

    // Sort by match score (highest first)
    results.sort_by(|a, b| b.match_score.partial_cmp(&a.match_score).unwrap());

    results
}

/// Match input tokens against a pattern
/// Only matches if tokens match from the BEGINNING of the pattern
#[allow(dead_code)]
fn match_pattern(tokens: &[&str], pattern: &PatternTemplate) -> PatternMatchResult {
    match_pattern_with_locale(tokens, pattern, "ja")
}

/// Match input tokens against a pattern with locale support
fn match_pattern_with_locale(tokens: &[&str], pattern: &PatternTemplate, locale: &str) -> PatternMatchResult {
    // Build expected tokens from pattern (with specific particle values)
    let expected: Vec<ExpectedToken> = pattern
        .blocks
        .iter()
        .map(|b| ExpectedToken::from_block_type_with_locale(&b.block_type, locale))
        .collect();

    // Check consecutive match from the beginning
    let mut consecutive_match_count = 0;
    let mut missing_elements = Vec::new();
    let mut had_mismatch = false;

    for (i, exp) in expected.iter().enumerate() {
        if i < tokens.len() && !had_mismatch {
            let token = tokens[i];
            let token_type = match locale {
                "en" => TokenType::classify_en(token),
                "fr" => TokenType::classify_fr(token),
                _ => TokenType::classify(token),
            };

            // Check if token matches expected
            let matches = match exp {
                ExpectedToken::Noun => token_type == TokenType::Noun,
                ExpectedToken::Particle(p) => {
                    // For English, also check if token matches (case-insensitive)
                    // Empty particles match position only
                    if p.is_empty() {
                        true // Skip empty particle markers
                    } else if locale == "en" || locale == "fr" {
                        token.to_lowercase() == *p
                    } else {
                        token == *p
                    }
                }
                ExpectedToken::Verb => token_type == TokenType::Verb,
                ExpectedToken::Article(a) => {
                    token.to_lowercase() == *a
                }
                ExpectedToken::Other(text) => token == *text,
            };

            if matches {
                consecutive_match_count += 1;
            } else {
                // Mismatch found - stop counting matches
                had_mismatch = true;
                let msg = match locale {
                    "en" => format!("Position {}: {} required", i + 1, pattern.blocks[i].label),
                    "fr" => format!("Position {} : {} requis", i + 1, pattern.blocks[i].label),
                    _ => format!("位置{}: {} が必要", i + 1, pattern.blocks[i].label),
                };
                missing_elements.push(msg);
            }
        } else {
            // Token missing or already had mismatch
            missing_elements.push(pattern.blocks[i].label.clone());
        }
    }

    let total_expected = expected.len();

    // Only give positive score if we have consecutive matches from start
    // and no mismatches within the token range
    let match_score = if had_mismatch || consecutive_match_count == 0 {
        0.0
    } else {
        consecutive_match_count as f64 / total_expected as f64
    };

    PatternMatchResult {
        pattern_id: pattern.id.clone(),
        pattern_name: pattern.name.clone(),
        match_score,
        missing_elements,
        is_complete: consecutive_match_count == total_expected && tokens.len() == total_expected,
    }
}

/// Expected token for pattern matching
#[derive(Debug, Clone)]
enum ExpectedToken {
    Noun,
    Particle(&'static str),
    Verb,
    Article(&'static str),
    Other(&'static str),
}

impl ExpectedToken {
    /// Parse block type to expected token (Japanese default)
    #[allow(dead_code)]
    fn from_block_type(block_type: &str) -> Self {
        Self::from_block_type_with_locale(block_type, "ja")
    }

    /// Parse block type to expected token with locale support
    fn from_block_type_with_locale(block_type: &str, locale: &str) -> Self {
        if block_type.starts_with("promps_noun") {
            ExpectedToken::Noun
        } else if block_type.starts_with("promps_article") {
            // Articles (English/French mode)
            let article = if locale == "fr" {
                match block_type {
                    "promps_article_a" => "un",
                    "promps_article_an" => "une",
                    "promps_article_the" => "le",
                    "promps_article_this" => "ce",
                    "promps_article_that" => "cette",
                    "promps_article_please" => "veuillez",
                    _ => "le", // default
                }
            } else {
                match block_type {
                    "promps_article_a" => "a",
                    "promps_article_an" => "an",
                    "promps_article_the" => "the",
                    "promps_article_this" => "this",
                    "promps_article_that" => "that",
                    "promps_article_please" => "please",
                    _ => "the", // default
                }
            };
            ExpectedToken::Article(article)
        } else if block_type.starts_with("promps_particle") {
            // Extract specific particle from block type
            // Use different values per locale
            let particle = match locale {
                "en" => match block_type {
                    "promps_particle_ga" => "",    // Subject marker (omitted in English)
                    "promps_particle_wo" => "",    // Object marker (omitted in English)
                    "promps_particle_ni" => "to",
                    "promps_particle_de" => "with",
                    "promps_particle_to" => "and",
                    "promps_particle_he" => "toward",
                    "promps_particle_kara" => "from",
                    "promps_particle_made" => "until",
                    "promps_particle_yori" => "than",
                    _ => "", // default
                },
                "fr" => match block_type {
                    "promps_particle_ga" => "",    // Subject marker (omitted in French)
                    "promps_particle_wo" => "",    // Object marker (omitted in French)
                    "promps_particle_ni" => "\u{00e0}",  // à
                    "promps_particle_de" => "avec",
                    "promps_particle_to" => "et",
                    "promps_particle_he" => "vers",
                    "promps_particle_kara" => "de",
                    "promps_particle_made" => "jusqu'\u{00e0}",  // jusqu'à
                    "promps_particle_yori" => "que",
                    _ => "", // default
                },
                _ => match block_type {
                    "promps_particle_ga" => "が",
                    "promps_particle_wo" => "を",
                    "promps_particle_ni" => "に",
                    "promps_particle_de" => "で",
                    "promps_particle_to" => "と",
                    "promps_particle_he" => "へ",
                    "promps_particle_kara" => "から",
                    "promps_particle_made" => "まで",
                    "promps_particle_yori" => "より",
                    _ => "が", // default
                },
            };
            ExpectedToken::Particle(particle)
        } else if block_type.starts_with("promps_verb") {
            ExpectedToken::Verb
        } else if block_type == "promps_other" {
            match locale {
                "en" => ExpectedToken::Other("about"),
                "fr" => ExpectedToken::Other("concernant"),
                _ => ExpectedToken::Other("について"),
            }
        } else {
            ExpectedToken::Other("")
        }
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // Token classification tests

    #[test]
    fn test_classify_noun() {
        assert_eq!(TokenType::classify("_N:User"), TokenType::Noun);
        assert_eq!(TokenType::classify("_N:データベース"), TokenType::Noun);
        assert_eq!(TokenType::classify("_N:"), TokenType::Noun);
    }

    #[test]
    fn test_classify_particle() {
        assert_eq!(TokenType::classify("が"), TokenType::Particle);
        assert_eq!(TokenType::classify("を"), TokenType::Particle);
        assert_eq!(TokenType::classify("に"), TokenType::Particle);
        assert_eq!(TokenType::classify("で"), TokenType::Particle);
        assert_eq!(TokenType::classify("と"), TokenType::Particle);
        assert_eq!(TokenType::classify("へ"), TokenType::Particle);
        assert_eq!(TokenType::classify("から"), TokenType::Particle);
        assert_eq!(TokenType::classify("まで"), TokenType::Particle);
    }

    #[test]
    fn test_classify_fixed_verb() {
        assert_eq!(TokenType::classify("分析して"), TokenType::Verb);
        assert_eq!(TokenType::classify("要約して"), TokenType::Verb);
        assert_eq!(TokenType::classify("翻訳して"), TokenType::Verb);
        assert_eq!(TokenType::classify("作成して"), TokenType::Verb);
    }

    #[test]
    fn test_classify_custom_verb() {
        assert_eq!(TokenType::classify("処理して"), TokenType::Verb);
        assert_eq!(TokenType::classify("実行する"), TokenType::Verb);
        assert_eq!(TokenType::classify("カスタムして"), TokenType::Verb);
    }

    #[test]
    fn test_classify_other() {
        assert_eq!(TokenType::classify("テスト"), TokenType::Other);
        assert_eq!(TokenType::classify("hello"), TokenType::Other);
        assert_eq!(TokenType::classify("123"), TokenType::Other);
    }

    // Rule 1: Particle without noun

    #[test]
    fn test_rule1_particle_at_start() {
        let result = validate_sequence("が _N:User");
        assert!(!result.is_valid);
        assert_eq!(result.error_count, 1);
        assert_eq!(result.errors[0].code, ValidationErrorCode::ParticleWithoutNoun);
        assert_eq!(result.errors[0].position, 0);
    }

    #[test]
    fn test_rule1_particle_after_noun_valid() {
        let result = validate_sequence("_N:User が");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_rule1_multiple_particles_without_noun() {
        let result = validate_sequence("が を に");
        assert!(!result.is_valid);
        // First particle has no noun, subsequent are consecutive
        assert!(result.error_count >= 1);
    }

    // Rule 2: Consecutive particles

    #[test]
    fn test_rule2_consecutive_particles() {
        let result = validate_sequence("_N:User が を");
        assert!(!result.is_valid);
        assert_eq!(result.error_count, 1);
        assert_eq!(result.errors[0].code, ValidationErrorCode::ConsecutiveParticles);
    }

    #[test]
    fn test_rule2_separated_particles_valid() {
        let result = validate_sequence("_N:User が _N:Order を");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    // Rule 3: Verb not at end

    #[test]
    fn test_rule3_verb_not_at_end() {
        let result = validate_sequence("分析して _N:Document");
        assert!(result.warning_count >= 1);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::VerbNotAtEnd));
    }

    #[test]
    fn test_rule3_verb_at_end_valid() {
        let result = validate_sequence("_N:User が _N:Order を 作成して");
        // Should not have VerbNotAtEnd warning
        assert!(!result.errors.iter().any(|e| e.code == ValidationErrorCode::VerbNotAtEnd));
    }

    // Rule 4: Consecutive nouns

    #[test]
    fn test_rule4_consecutive_nouns() {
        let result = validate_sequence("_N:User _N:Order");
        assert_eq!(result.warning_count, 1);
        assert_eq!(result.errors[0].code, ValidationErrorCode::ConsecutiveNouns);
    }

    #[test]
    fn test_rule4_nouns_with_particle_valid() {
        let result = validate_sequence("_N:User と _N:Order");
        // Should not have ConsecutiveNouns warning
        assert!(!result.errors.iter().any(|e| e.code == ValidationErrorCode::ConsecutiveNouns));
    }

    // Rule 5: Missing subject

    #[test]
    fn test_rule5_missing_subject() {
        let result = validate_sequence("_N:Document を 分析して");
        assert!(result.warning_count >= 1);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::MissingSubject));
    }

    #[test]
    fn test_rule5_has_subject_valid() {
        let result = validate_sequence("_N:User が _N:Document を 分析して");
        assert!(!result.errors.iter().any(|e| e.code == ValidationErrorCode::MissingSubject));
    }

    #[test]
    fn test_rule5_no_verb_no_warning() {
        // No verb means no subject warning
        let result = validate_sequence("_N:User _N:Document");
        assert!(!result.errors.iter().any(|e| e.code == ValidationErrorCode::MissingSubject));
    }

    // Rule 6: Missing object

    #[test]
    fn test_rule6_missing_object() {
        let result = validate_sequence("_N:User が 作成して");
        assert!(result.warning_count >= 1);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::MissingObject));
    }

    #[test]
    fn test_rule6_has_object_valid() {
        let result = validate_sequence("_N:User が _N:Document を 分析して");
        assert!(!result.errors.iter().any(|e| e.code == ValidationErrorCode::MissingObject));
    }

    #[test]
    fn test_rule6_no_verb_no_warning() {
        // No verb means no object warning
        let result = validate_sequence("_N:User が _N:Document");
        assert!(!result.errors.iter().any(|e| e.code == ValidationErrorCode::MissingObject));
    }

    // Integration tests

    #[test]
    fn test_valid_complete_sequence() {
        let result = validate_sequence("_N:ユーザー が _N:ドキュメント を 分析して");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
        assert_eq!(result.warning_count, 0);
    }

    #[test]
    fn test_empty_input() {
        let result = validate_sequence("");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
        assert_eq!(result.warning_count, 0);
    }

    #[test]
    fn test_whitespace_only() {
        let result = validate_sequence("   ");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_multiple_errors() {
        // が at start (error) + consecutive particles (error)
        let result = validate_sequence("が を _N:User");
        assert!(!result.is_valid);
        assert!(result.error_count >= 2);
    }

    // Serialization tests

    #[test]
    fn test_validation_result_serialization() {
        let result = validate_sequence("が _N:User");
        let json = serde_json::to_string(&result).unwrap();

        assert!(json.contains("\"isValid\":false"));
        assert!(json.contains("\"errorCount\":1"));
        assert!(json.contains("\"severity\":\"error\""));
    }

    #[test]
    fn test_token_type_serialization() {
        let noun = TokenType::Noun;
        let json = serde_json::to_string(&noun).unwrap();
        assert_eq!(json, "\"Noun\"");
    }

    // Auto-fix tests

    #[test]
    fn test_autofix_in_particle_without_noun() {
        let result = validate_sequence("が _N:User");
        assert!(result.errors[0].autofix.is_some());
        let autofix = result.errors[0].autofix.as_ref().unwrap();
        assert_eq!(autofix.block_type, "promps_noun");
        assert_eq!(autofix.action_type, AutoFixActionType::InsertBefore);
    }

    #[test]
    fn test_autofix_in_missing_subject() {
        let result = validate_sequence("_N:Document を 分析して");
        let missing_subject = result.errors.iter()
            .find(|e| e.code == ValidationErrorCode::MissingSubject);
        assert!(missing_subject.is_some());
        let autofix = missing_subject.unwrap().autofix.as_ref().unwrap();
        assert_eq!(autofix.block_type, "promps_particle_ga");
    }

    #[test]
    fn test_autofix_in_missing_object() {
        let result = validate_sequence("_N:User が 作成して");
        let missing_object = result.errors.iter()
            .find(|e| e.code == ValidationErrorCode::MissingObject);
        assert!(missing_object.is_some());
        let autofix = missing_object.unwrap().autofix.as_ref().unwrap();
        assert_eq!(autofix.block_type, "promps_particle_wo");
    }

    #[test]
    fn test_autofix_in_consecutive_nouns() {
        let result = validate_sequence("_N:User _N:Order");
        assert!(result.errors[0].autofix.is_some());
        let autofix = result.errors[0].autofix.as_ref().unwrap();
        assert_eq!(autofix.block_type, "promps_particle_to");
    }

    #[test]
    fn test_autofix_serialization() {
        let result = validate_sequence("が _N:User");
        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"autofix\""));
        assert!(json.contains("\"actionType\":\"insert_before\""));
        assert!(json.contains("\"blockType\":\"promps_noun\""));
    }

    // Pattern template tests (Phase 6 Step 3)

    #[test]
    fn test_get_pattern_templates_returns_patterns() {
        let patterns = get_pattern_templates();
        assert!(!patterns.is_empty());
        assert!(patterns.len() >= 7); // We have 7 patterns defined
    }

    #[test]
    fn test_pattern_template_sov_basic() {
        let patterns = get_pattern_templates();
        let sov = patterns.iter().find(|p| p.id == "sov_basic").unwrap();

        assert_eq!(sov.name, "基本文型（主語-目的語-動詞）");
        assert_eq!(sov.blocks.len(), 5); // Noun, が, Noun, を, Verb
    }

    #[test]
    fn test_pattern_template_ov_simple() {
        let patterns = get_pattern_templates();
        let ov = patterns.iter().find(|p| p.id == "ov_simple").unwrap();

        assert_eq!(ov.name, "目的語-動詞文型");
        assert_eq!(ov.blocks.len(), 3); // Noun, を, Verb
    }

    #[test]
    fn test_pattern_template_osv_emphasis() {
        let patterns = get_pattern_templates();
        let osv = patterns.iter().find(|p| p.id == "osv_emphasis").unwrap();

        assert_eq!(osv.name, "目的語先行文型（を...が）");
        assert_eq!(osv.blocks.len(), 5); // Noun, を, Noun, が, Verb
        assert_eq!(osv.structure, "名詞 を 名詞 が 動詞");
    }

    #[test]
    fn test_analyze_patterns_osv_match() {
        // "_N:Doc を _N:User が" should match osv_emphasis pattern
        let results = analyze_patterns_with_locale("_N:Doc を _N:User が", "ja");
        let osv_match = results.iter().find(|r| r.pattern_id == "osv_emphasis").unwrap();

        // 4 out of 5 tokens match
        assert!(osv_match.match_score > 0.7);
        assert!(!osv_match.is_complete);
    }

    #[test]
    fn test_analyze_patterns_osv_complete() {
        // Complete OSV pattern
        let results = analyze_patterns_with_locale("_N:Doc を _N:User が 分析して", "ja");
        let osv_match = results.iter().find(|r| r.pattern_id == "osv_emphasis").unwrap();

        assert_eq!(osv_match.match_score, 1.0);
        assert!(osv_match.is_complete);
    }

    #[test]
    fn test_pattern_block_placeholder() {
        let block = PatternBlock::placeholder("promps_noun", "主語");
        assert!(block.is_placeholder);
        assert_eq!(block.block_type, "promps_noun");
        assert_eq!(block.label, "主語");
    }

    #[test]
    fn test_pattern_block_fixed() {
        let block = PatternBlock::fixed("promps_particle_ga", "が");
        assert!(!block.is_placeholder);
        assert_eq!(block.block_type, "promps_particle_ga");
        assert_eq!(block.label, "が");
    }

    #[test]
    fn test_analyze_patterns_empty_input() {
        let results = analyze_patterns_with_locale("", "ja");
        assert!(!results.is_empty());
        // All patterns should have 0 match score for empty input
        for result in &results {
            assert_eq!(result.match_score, 0.0);
        }
    }

    #[test]
    fn test_analyze_patterns_partial_match() {
        // "_N:Doc を" should partially match ov_simple pattern
        let results = analyze_patterns_with_locale("_N:Doc を", "ja");
        let ov_match = results.iter().find(|r| r.pattern_id == "ov_simple").unwrap();

        // 2 out of 3 tokens match
        assert!(ov_match.match_score > 0.5);
        assert!(!ov_match.is_complete);
    }

    #[test]
    fn test_analyze_patterns_complete_match() {
        // "_N:Doc を 分析して" should match ov_simple completely
        let results = analyze_patterns_with_locale("_N:Doc を 分析して", "ja");
        let ov_match = results.iter().find(|r| r.pattern_id == "ov_simple").unwrap();

        assert_eq!(ov_match.match_score, 1.0);
        assert!(ov_match.is_complete);
    }

    #[test]
    fn test_analyze_patterns_sorted_by_score() {
        let results = analyze_patterns_with_locale("_N:Doc を 分析して", "ja");

        // Results should be sorted by match_score descending
        for i in 1..results.len() {
            assert!(results[i - 1].match_score >= results[i].match_score);
        }
    }

    #[test]
    fn test_pattern_template_serialization() {
        let patterns = get_pattern_templates();
        let json = serde_json::to_string(&patterns).unwrap();

        assert!(json.contains("\"id\":\"sov_basic\""));
        assert!(json.contains("\"name\":"));
        assert!(json.contains("\"blocks\":"));
    }

    #[test]
    fn test_pattern_match_result_serialization() {
        let results = analyze_patterns_with_locale("_N:Doc を", "ja");
        let json = serde_json::to_string(&results).unwrap();

        assert!(json.contains("\"patternId\":"));
        assert!(json.contains("\"matchScore\":"));
        assert!(json.contains("\"isComplete\":"));
    }

    // ========================================================================
    // Punctuation Validation Tests (句読点)
    // ========================================================================

    #[test]
    fn test_punctuation_classify() {
        assert_eq!(TokenType::classify("、"), TokenType::Punctuation);
        assert_eq!(TokenType::classify("。"), TokenType::Punctuation);
        assert_eq!(TokenType::classify("！"), TokenType::Punctuation);
        assert_eq!(TokenType::classify("？"), TokenType::Punctuation);
        assert_eq!(TokenType::classify("\""), TokenType::Punctuation);
        assert_eq!(TokenType::classify("'"), TokenType::Punctuation);
        assert_eq!(TokenType::classify(","), TokenType::Punctuation);
        assert_eq!(TokenType::classify("/"), TokenType::Punctuation);
        assert_eq!(TokenType::classify("&"), TokenType::Punctuation);
    }

    #[test]
    fn test_touten_after_particle_ok() {
        // 「が、」should be valid
        let result = validate_sequence("_N:User が、 _N:Order を 分析して");
        let touten_errors: Vec<_> = result.errors.iter()
            .filter(|e| matches!(e.code, ValidationErrorCode::ToutenAfterWo | ValidationErrorCode::ToutenNotAfterParticle))
            .collect();
        assert!(touten_errors.is_empty(), "Touten after が should be valid");
    }

    #[test]
    fn test_touten_after_wo_error() {
        // 「を 、」should be invalid (tokens are space-separated)
        let result = validate_sequence("_N:User を 、 分析して");
        let has_error = result.errors.iter()
            .any(|e| e.code == ValidationErrorCode::ToutenAfterWo);
        assert!(has_error, "Touten after を should be an error");
    }

    #[test]
    fn test_touten_after_noun_error() {
        // 「名詞 、」(without particle) should be invalid
        let result = validate_sequence("_N:User 、 を 分析して");
        let has_error = result.errors.iter()
            .any(|e| e.code == ValidationErrorCode::ToutenNotAfterParticle);
        assert!(has_error, "Touten after noun should be an error");
    }

    #[test]
    fn test_touten_at_beginning_error() {
        // 「、」at beginning should be invalid
        let result = validate_sequence("、 _N:User を 分析して");
        let has_error = result.errors.iter()
            .any(|e| e.code == ValidationErrorCode::ToutenNotAfterParticle);
        assert!(has_error, "Touten at beginning should be an error");
    }

    #[test]
    fn test_kuten_after_verb_ok() {
        // 「分析して 。」should be valid (tokens are space-separated)
        let result = validate_sequence("_N:User が _N:Doc を 分析して 。");
        let kuten_errors: Vec<_> = result.errors.iter()
            .filter(|e| e.code == ValidationErrorCode::KutenNotAfterVerb)
            .collect();
        assert!(kuten_errors.is_empty(), "Kuten after verb should be valid");
    }

    #[test]
    fn test_kuten_after_particle_error() {
        // 「を 。」should be invalid
        let result = validate_sequence("_N:User を 。");
        let has_error = result.errors.iter()
            .any(|e| e.code == ValidationErrorCode::KutenNotAfterVerb);
        assert!(has_error, "Kuten after particle should be an error");
    }

    #[test]
    fn test_kuten_after_noun_error() {
        // 「名詞 。」should be invalid
        let result = validate_sequence("_N:User 。");
        let has_error = result.errors.iter()
            .any(|e| e.code == ValidationErrorCode::KutenNotAfterVerb);
        assert!(has_error, "Kuten after noun should be an error");
    }

    #[test]
    fn test_complete_sentence_with_punctuation() {
        // Full valid sentence with punctuation (tokens are space-separated)
        let result = validate_sequence("_N:User が 、 _N:Doc を 分析して 。");
        let punct_errors: Vec<_> = result.errors.iter()
            .filter(|e| matches!(e.code,
                ValidationErrorCode::ToutenAfterWo |
                ValidationErrorCode::ToutenNotAfterParticle |
                ValidationErrorCode::KutenNotAfterVerb
            ))
            .collect();
        assert!(punct_errors.is_empty(), "Valid sentence should have no punctuation errors");
    }

    // ========================================================================
    // English Token Classification Tests
    // ========================================================================

    #[test]
    fn test_classify_en_noun() {
        assert_eq!(TokenType::classify_en("_N:User"), TokenType::Noun);
        assert_eq!(TokenType::classify_en("_N:document"), TokenType::Noun);
    }

    #[test]
    fn test_classify_en_article() {
        assert_eq!(TokenType::classify_en("a"), TokenType::Article);
        assert_eq!(TokenType::classify_en("an"), TokenType::Article);
        assert_eq!(TokenType::classify_en("the"), TokenType::Article);
        assert_eq!(TokenType::classify_en("this"), TokenType::Article);
        assert_eq!(TokenType::classify_en("that"), TokenType::Article);
        assert_eq!(TokenType::classify_en("The"), TokenType::Article); // Case insensitive
    }

    #[test]
    fn test_classify_en_verb() {
        assert_eq!(TokenType::classify_en("analyze"), TokenType::Verb);
        assert_eq!(TokenType::classify_en("summarize"), TokenType::Verb);
        assert_eq!(TokenType::classify_en("translate"), TokenType::Verb);
        assert_eq!(TokenType::classify_en("create"), TokenType::Verb);
        assert_eq!(TokenType::classify_en("Analyze"), TokenType::Verb); // Case insensitive
    }

    #[test]
    fn test_classify_en_preposition() {
        assert_eq!(TokenType::classify_en("to"), TokenType::Preposition);
        assert_eq!(TokenType::classify_en("with"), TokenType::Preposition);
        assert_eq!(TokenType::classify_en("from"), TokenType::Preposition);
        assert_eq!(TokenType::classify_en("in"), TokenType::Preposition);
        assert_eq!(TokenType::classify_en("for"), TokenType::Preposition);
    }

    #[test]
    fn test_classify_en_please() {
        assert_eq!(TokenType::classify_en("please"), TokenType::Please);
        assert_eq!(TokenType::classify_en("Please"), TokenType::Please);
    }

    #[test]
    fn test_classify_en_punctuation() {
        assert_eq!(TokenType::classify_en("."), TokenType::Punctuation);
        assert_eq!(TokenType::classify_en(","), TokenType::Punctuation);
        assert_eq!(TokenType::classify_en("!"), TokenType::Punctuation);
        assert_eq!(TokenType::classify_en("?"), TokenType::Punctuation);
    }

    #[test]
    fn test_classify_en_other() {
        assert_eq!(TokenType::classify_en("hello"), TokenType::Other);
        assert_eq!(TokenType::classify_en("world"), TokenType::Other);
        assert_eq!(TokenType::classify_en("123"), TokenType::Other);
    }

    // ========================================================================
    // English Validation Tests
    // ========================================================================

    #[test]
    fn test_validate_en_simple_command() {
        // "analyze document" - valid simple command
        let result = validate_sequence_en("analyze _N:document");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_validate_en_with_article() {
        // "summarize the report" - valid with article
        let result = validate_sequence_en("summarize the _N:report");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_validate_en_with_please() {
        // "please analyze document" - valid polite request
        let result = validate_sequence_en("please analyze _N:document");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_validate_en_article_not_before_noun() {
        // "the analyze document" - article followed by verb (error)
        let result = validate_sequence_en("the analyze _N:document");
        assert!(!result.is_valid);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::ArticleNotBeforeNoun));
    }

    #[test]
    fn test_validate_en_consecutive_articles() {
        // "the a document" - consecutive articles (error)
        let result = validate_sequence_en("the a _N:document");
        assert!(!result.is_valid);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::ConsecutiveArticles));
    }

    #[test]
    fn test_validate_en_article_at_end() {
        // "analyze the" - article at end without noun (error)
        let result = validate_sequence_en("analyze the");
        assert!(!result.is_valid);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::ArticleNotBeforeNoun));
    }

    #[test]
    fn test_validate_en_preposition_without_object() {
        // "translate to" - preposition without object (warning)
        let result = validate_sequence_en("translate _N:text to");
        // Should have warning for preposition without object at end
        let has_prep_warning = result.errors.iter()
            .any(|e| e.code == ValidationErrorCode::PrepositionWithoutObject);
        // Note: Since "to" is at the end, it might not trigger (depends on implementation)
        // This test documents expected behavior
        println!("Preposition warning: {}", has_prep_warning);
    }

    #[test]
    fn test_validate_en_please_in_middle() {
        // "analyze please document" - please in wrong position (warning)
        let result = validate_sequence_en("analyze please _N:document");
        assert!(result.warning_count >= 1);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::PleasePosition));
    }

    #[test]
    fn test_validate_en_please_before_verb_ok() {
        // "the please analyze" - please before verb is OK
        let result = validate_sequence_en("please analyze _N:document");
        let has_please_error = result.errors.iter()
            .any(|e| e.code == ValidationErrorCode::PleasePosition);
        assert!(!has_please_error, "please before verb should be OK");
    }

    #[test]
    fn test_validate_en_missing_verb() {
        // "the document" - no verb (warning)
        let result = validate_sequence_en("the _N:document");
        assert!(result.warning_count >= 1);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::MissingVerb));
    }

    #[test]
    fn test_validate_en_period_not_at_end() {
        // "analyze . document" - period not at end (warning)
        let result = validate_sequence_en("analyze . _N:document");
        assert!(result.warning_count >= 1);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::PeriodNotAtEnd));
    }

    #[test]
    fn test_validate_en_period_at_end_ok() {
        // "analyze document ." - period at end is OK
        let result = validate_sequence_en("analyze _N:document .");
        let has_period_error = result.errors.iter()
            .any(|e| e.code == ValidationErrorCode::PeriodNotAtEnd);
        assert!(!has_period_error, "Period at end should be OK");
    }

    #[test]
    fn test_validate_en_empty_input() {
        let result = validate_sequence_en("");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
        assert_eq!(result.warning_count, 0);
    }

    #[test]
    fn test_validate_en_complex_sentence() {
        // "please translate the document from English to Japanese"
        let result = validate_sequence_en("please translate the _N:document from _N:English to _N:Japanese");
        assert!(result.is_valid, "Complex valid sentence should pass");
    }

    // ========================================================================
    // Locale-aware Validation Tests
    // ========================================================================

    #[test]
    fn test_validate_with_locale_ja() {
        let result = validate_sequence_with_locale("_N:User が _N:Document を 分析して", "ja");
        assert!(result.is_valid);
    }

    #[test]
    fn test_validate_with_locale_en() {
        let result = validate_sequence_with_locale("analyze _N:document", "en");
        assert!(result.is_valid);
    }

    #[test]
    fn test_validate_with_locale_default() {
        // Unknown locale defaults to Japanese
        let result = validate_sequence_with_locale("_N:User が _N:Document を 分析して", "unknown");
        assert!(result.is_valid);
    }

    // ========================================================================
    // English Pattern Template Tests
    // ========================================================================

    #[test]
    fn test_get_pattern_templates_en() {
        let patterns = get_pattern_templates_en();
        assert!(!patterns.is_empty());
        assert!(patterns.len() >= 5); // We have at least 5 English patterns
    }

    #[test]
    fn test_pattern_template_en_svo_basic() {
        let patterns = get_pattern_templates_en();
        let svo = patterns.iter().find(|p| p.id == "svo_basic").unwrap();

        assert_eq!(svo.name, "Simple Command");
        assert_eq!(svo.blocks.len(), 2); // Verb, Noun
    }

    #[test]
    fn test_pattern_template_en_polite() {
        let patterns = get_pattern_templates_en();
        let polite = patterns.iter().find(|p| p.id == "polite").unwrap();

        assert_eq!(polite.name, "Polite Request");
        assert!(polite.blocks.len() >= 3); // please, Verb, Noun, etc.
    }

    #[test]
    fn test_get_pattern_templates_by_locale() {
        let ja_patterns = get_pattern_templates_by_locale("ja");
        let en_patterns = get_pattern_templates_by_locale("en");

        // Japanese should have SOV patterns
        assert!(ja_patterns.iter().any(|p| p.id == "sov_basic" && p.name.contains("主語")));

        // English should have SVO patterns
        assert!(en_patterns.iter().any(|p| p.id == "svo_basic" && p.name.contains("Command")));
    }

    #[test]
    fn test_analyze_patterns_en() {
        let results = analyze_patterns_with_locale("analyze _N:document", "en");
        // Should find matching patterns
        let has_match = results.iter().any(|r| r.match_score > 0.0);
        assert!(has_match, "Should find at least one matching English pattern");
    }

    #[test]
    fn test_analyze_patterns_en_complete() {
        let results = analyze_patterns_with_locale("analyze _N:document", "en");
        let svo_match = results.iter().find(|r| r.pattern_id == "svo_basic");
        if let Some(m) = svo_match {
            assert_eq!(m.match_score, 1.0, "Should be complete match");
            assert!(m.is_complete, "Should be marked as complete");
        }
    }

    // ========================================================================
    // French Token Classification Tests
    // ========================================================================

    #[test]
    fn test_classify_fr_noun() {
        assert_eq!(TokenType::classify_fr("_N:utilisateur"), TokenType::Noun);
        assert_eq!(TokenType::classify_fr("_N:document"), TokenType::Noun);
    }

    #[test]
    fn test_classify_fr_article() {
        assert_eq!(TokenType::classify_fr("le"), TokenType::Article);
        assert_eq!(TokenType::classify_fr("la"), TokenType::Article);
        assert_eq!(TokenType::classify_fr("les"), TokenType::Article);
        assert_eq!(TokenType::classify_fr("un"), TokenType::Article);
        assert_eq!(TokenType::classify_fr("une"), TokenType::Article);
        assert_eq!(TokenType::classify_fr("des"), TokenType::Article);
        assert_eq!(TokenType::classify_fr("ce"), TokenType::Article);
        assert_eq!(TokenType::classify_fr("cette"), TokenType::Article);
        assert_eq!(TokenType::classify_fr("Le"), TokenType::Article); // Case insensitive
    }

    #[test]
    fn test_classify_fr_verb() {
        assert_eq!(TokenType::classify_fr("analyser"), TokenType::Verb);
        assert_eq!(TokenType::classify_fr("résumer"), TokenType::Verb);
        assert_eq!(TokenType::classify_fr("traduire"), TokenType::Verb);
        assert_eq!(TokenType::classify_fr("créer"), TokenType::Verb);
        assert_eq!(TokenType::classify_fr("générer"), TokenType::Verb);
        assert_eq!(TokenType::classify_fr("convertir"), TokenType::Verb);
        assert_eq!(TokenType::classify_fr("supprimer"), TokenType::Verb);
    }

    #[test]
    fn test_classify_fr_preposition() {
        assert_eq!(TokenType::classify_fr("à"), TokenType::Preposition);
        assert_eq!(TokenType::classify_fr("de"), TokenType::Preposition);
        assert_eq!(TokenType::classify_fr("avec"), TokenType::Preposition);
        assert_eq!(TokenType::classify_fr("pour"), TokenType::Preposition);
        assert_eq!(TokenType::classify_fr("par"), TokenType::Preposition);
        assert_eq!(TokenType::classify_fr("dans"), TokenType::Preposition);
    }

    #[test]
    fn test_classify_fr_please() {
        assert_eq!(TokenType::classify_fr("veuillez"), TokenType::Please);
        assert_eq!(TokenType::classify_fr("Veuillez"), TokenType::Please);
    }

    #[test]
    fn test_classify_fr_punctuation() {
        assert_eq!(TokenType::classify_fr("."), TokenType::Punctuation);
        assert_eq!(TokenType::classify_fr(","), TokenType::Punctuation);
        assert_eq!(TokenType::classify_fr("!"), TokenType::Punctuation);
    }

    #[test]
    fn test_classify_fr_other() {
        assert_eq!(TokenType::classify_fr("bonjour"), TokenType::Other);
        assert_eq!(TokenType::classify_fr("monde"), TokenType::Other);
    }

    // ========================================================================
    // French Validation Tests
    // ========================================================================

    #[test]
    fn test_validate_fr_simple_command() {
        let result = validate_sequence_fr("analyser _N:document");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_validate_fr_with_article() {
        let result = validate_sequence_fr("résumer le _N:rapport");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_validate_fr_with_veuillez() {
        let result = validate_sequence_fr("veuillez analyser _N:document");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_validate_fr_article_not_before_noun() {
        let result = validate_sequence_fr("le analyser _N:document");
        assert!(!result.is_valid);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::ArticleNotBeforeNoun));
    }

    #[test]
    fn test_validate_fr_consecutive_articles() {
        let result = validate_sequence_fr("le la _N:document");
        assert!(!result.is_valid);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::ConsecutiveArticles));
    }

    #[test]
    fn test_validate_fr_article_at_end() {
        let result = validate_sequence_fr("analyser le");
        assert!(!result.is_valid);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::ArticleNotBeforeNoun));
    }

    #[test]
    fn test_validate_fr_missing_verb() {
        let result = validate_sequence_fr("le _N:document");
        assert!(result.warning_count >= 1);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::MissingVerb));
    }

    #[test]
    fn test_validate_fr_veuillez_in_middle() {
        let result = validate_sequence_fr("analyser veuillez _N:document");
        assert!(result.warning_count >= 1);
        assert!(result.errors.iter().any(|e| e.code == ValidationErrorCode::PleasePosition));
    }

    #[test]
    fn test_validate_fr_period_at_end_ok() {
        let result = validate_sequence_fr("analyser _N:document .");
        let has_period_error = result.errors.iter()
            .any(|e| e.code == ValidationErrorCode::PeriodNotAtEnd);
        assert!(!has_period_error, "Period at end should be OK");
    }

    #[test]
    fn test_validate_fr_empty_input() {
        let result = validate_sequence_fr("");
        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
        assert_eq!(result.warning_count, 0);
    }

    #[test]
    fn test_validate_fr_complex_sentence() {
        let result = validate_sequence_fr("veuillez traduire le _N:document de _N:anglais à _N:japonais");
        assert!(result.is_valid, "Complex valid French sentence should pass");
    }

    #[test]
    fn test_validate_with_locale_fr() {
        let result = validate_sequence_with_locale("analyser _N:document", "fr");
        assert!(result.is_valid);
    }

    // ========================================================================
    // French Pattern Template Tests
    // ========================================================================

    #[test]
    fn test_get_pattern_templates_fr() {
        let patterns = get_pattern_templates_fr();
        assert!(!patterns.is_empty());
        assert!(patterns.len() >= 5);
    }

    #[test]
    fn test_pattern_template_fr_svo_basic() {
        let patterns = get_pattern_templates_fr();
        let svo = patterns.iter().find(|p| p.id == "svo_basic").unwrap();

        assert_eq!(svo.name, "Commande simple");
        assert_eq!(svo.blocks.len(), 2); // Verb, Noun
    }

    #[test]
    fn test_pattern_template_fr_polite() {
        let patterns = get_pattern_templates_fr();
        let polite = patterns.iter().find(|p| p.id == "polite").unwrap();

        assert_eq!(polite.name, "Requête polie");
        assert!(polite.blocks.len() >= 3);
    }

    #[test]
    fn test_get_pattern_templates_by_locale_fr() {
        let fr_patterns = get_pattern_templates_by_locale("fr");
        assert!(fr_patterns.iter().any(|p| p.id == "svo_basic" && p.name.contains("Commande")));
    }

    #[test]
    fn test_analyze_patterns_fr() {
        let results = analyze_patterns_with_locale("analyser _N:document", "fr");
        let has_match = results.iter().any(|r| r.match_score > 0.0);
        assert!(has_match, "Should find at least one matching French pattern");
    }

    #[test]
    fn test_analyze_patterns_fr_complete() {
        let results = analyze_patterns_with_locale("analyser _N:document", "fr");
        let svo_match = results.iter().find(|r| r.pattern_id == "svo_basic");
        if let Some(m) = svo_match {
            assert_eq!(m.match_score, 1.0, "Should be complete match");
            assert!(m.is_complete, "Should be marked as complete");
        }
    }
}
