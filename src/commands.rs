/// Tauri Commands for Promps
///
/// This module defines all Tauri commands that bridge the frontend (JS)
/// and backend (Rust) logic.

use promps::{parse_input, generate_prompt, generate_prompt_raw};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

// Phase 5-6: Validation module
use crate::modules::validation::{
    validate_sequence_with_locale, ValidationResult,
    get_pattern_templates_by_locale,
    analyze_patterns_with_locale,
    PatternTemplate, PatternMatchResult,
};

// v2.1.0: Wizard Templates
use crate::modules::wizard::get_wizard_templates_by_locale;

/// Generate prompt from DSL input text (with grammar markers)
///
/// # Arguments
/// * `input` - Raw DSL text (with _N: markers, space-delimited)
///
/// # Returns
/// Formatted prompt string with (NOUN) markers
#[tauri::command]
pub fn generate_prompt_from_text(input: String) -> String {
    let parts = parse_input(&input);
    generate_prompt(&parts)
}

/// Generate raw prompt from DSL input text (without grammar markers)
///
/// Used for sending to AI - no annotations
///
/// # Arguments
/// * `input` - Raw DSL text (with _N: markers, space-delimited)
///
/// # Returns
/// Clean prompt string without markers
#[tauri::command]
pub fn generate_raw_prompt_from_text(input: String) -> String {
    let parts = parse_input(&input);
    generate_prompt_raw(&parts)
}

/// Health check command
///
/// Simple command to verify Tauri communication is working
#[tauri::command]
pub fn greet(name: String) -> String {
    format!("Hello, {}! Welcome to Promps.", name)
}

// ============================================================================
// Phase 5: Grammar Validation
// ============================================================================

/// Validate DSL sequence for grammar errors
///
/// # Arguments
/// * `input` - Space-delimited DSL tokens
/// * `locale` - Optional locale code ("ja" for Japanese, "en" for English)
///
/// # Returns
/// ValidationResult with errors and warnings
#[tauri::command]
pub fn validate_dsl_sequence(input: String, locale: Option<String>) -> ValidationResult {
    let locale_str = locale.as_deref().unwrap_or("ja");
    validate_sequence_with_locale(&input, locale_str)
}

// ============================================================================
// Phase 6 Step 3: Pattern Templates
// ============================================================================

/// Get all available pattern templates
///
/// # Arguments
/// * `locale` - Optional locale code ("ja" for Japanese, "en" for English)
///
/// # Returns
/// List of pattern templates for sentence structures
#[tauri::command]
pub fn get_patterns(locale: Option<String>) -> Vec<PatternTemplate> {
    let locale_str = locale.as_deref().unwrap_or("ja");
    get_pattern_templates_by_locale(locale_str)
}

/// Analyze current input against pattern templates
///
/// # Arguments
/// * `input` - Space-delimited DSL tokens
/// * `locale` - Optional locale code ("ja" for Japanese, "en" for English)
///
/// # Returns
/// List of pattern match results sorted by match score
#[tauri::command]
pub fn analyze_dsl_patterns(input: String, locale: Option<String>) -> Vec<PatternMatchResult> {
    let locale_str = locale.as_deref().unwrap_or("ja");
    analyze_patterns_with_locale(&input, locale_str)
}

// ============================================================================
// Phase 4: Project Persistence
// ============================================================================

/// Project metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMetadata {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub created_at: String,
    pub modified_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
}

/// Promps project file structure (.promps)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrompProject {
    pub version: String,
    pub metadata: ProjectMetadata,
    pub workspace: serde_json::Value,
    pub settings: serde_json::Value,
}

impl PrompProject {
    /// Create a new project with default values
    pub fn new(name: String) -> Self {
        let now = chrono_now();
        PrompProject {
            version: "1.0.0".to_string(),
            metadata: ProjectMetadata {
                name,
                description: None,
                created_at: now.clone(),
                modified_at: now,
                author: None,
                tags: Vec::new(),
            },
            workspace: serde_json::json!({}),
            settings: serde_json::json!({
                "zoom": 1.0,
                "scrollX": 0,
                "scrollY": 0
            }),
        }
    }
}

/// Get current timestamp in ISO 8601 format
fn chrono_now() -> String {
    // Simple ISO 8601 timestamp without external chrono dependency
    // Format: 2026-01-23T10:00:00Z
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();

    // Calculate date/time components (simplified UTC)
    let days = secs / 86400;
    let time_secs = secs % 86400;
    let hours = time_secs / 3600;
    let minutes = (time_secs % 3600) / 60;
    let seconds = time_secs % 60;

    // Days since 1970-01-01
    let mut year = 1970;
    let mut remaining_days = days as i64;

    loop {
        let days_in_year = if is_leap_year(year) { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        year += 1;
    }

    let month_days = if is_leap_year(year) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut month = 1;
    for &days_in_month in &month_days {
        if remaining_days < days_in_month as i64 {
            break;
        }
        remaining_days -= days_in_month as i64;
        month += 1;
    }

    let day = remaining_days + 1;

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hours, minutes, seconds
    )
}

fn is_leap_year(year: i64) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}

/// Save project to file
///
/// # Arguments
/// * `path` - File path to save to
/// * `project` - Project data to save
///
/// # Returns
/// Result indicating success or error message
#[tauri::command]
pub fn save_project(path: String, project: PrompProject) -> Result<(), String> {
    // Validate path has .promps extension
    if !path.to_lowercase().ends_with(".promps") {
        return Err("File must have .promps extension".to_string());
    }

    // Serialize project to JSON
    let json = serde_json::to_string_pretty(&project)
        .map_err(|e| format!("Failed to serialize project: {}", e))?;

    // Write to file
    fs::write(&path, json)
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

/// Load project from file
///
/// # Arguments
/// * `path` - File path to load from
///
/// # Returns
/// Result containing project data or error message
#[tauri::command]
pub fn load_project(path: String) -> Result<PrompProject, String> {
    // Check if file exists
    if !Path::new(&path).exists() {
        return Err(format!("File not found: {}", path));
    }

    // Validate path has .promps extension
    if !path.to_lowercase().ends_with(".promps") {
        return Err("File must have .promps extension".to_string());
    }

    // Read file contents
    let contents = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Parse JSON
    let project: PrompProject = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse project file: {}", e))?;

    Ok(project)
}

/// Create a new empty project
///
/// # Arguments
/// * `name` - Project name
///
/// # Returns
/// New project with default values
#[tauri::command]
pub fn create_new_project(name: String) -> PrompProject {
    PrompProject::new(name)
}

/// Update project modified timestamp
///
/// # Arguments
/// * `project` - Project to update
///
/// # Returns
/// Updated project with new modified_at timestamp
#[tauri::command]
pub fn update_project_timestamp(mut project: PrompProject) -> PrompProject {
    project.metadata.modified_at = chrono_now();
    project
}

/// Show open file dialog and return selected path
#[tauri::command]
pub async fn show_open_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app.dialog()
        .file()
        .add_filter("Promps Project", &["promps"])
        .set_title("Open Project")
        .blocking_pick_file();

    match file_path {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Show save file dialog and return selected path
#[tauri::command]
pub async fn show_save_dialog(app: tauri::AppHandle, default_name: String) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app.dialog()
        .file()
        .add_filter("Promps Project", &["promps"])
        .set_title("Save Project")
        .set_file_name(&default_name)
        .blocking_save_file();

    match file_path {
        Some(path) => {
            let mut path_str = path.to_string();
            // Ensure .promps extension
            if !path_str.to_lowercase().ends_with(".promps") {
                path_str.push_str(".promps");
            }
            Ok(Some(path_str))
        },
        None => Ok(None),
    }
}

/// Show confirmation dialog
#[tauri::command]
pub async fn show_confirm_dialog(app: tauri::AppHandle, title: String, message: String) -> bool {
    use tauri_plugin_dialog::DialogExt;
    use tauri_plugin_dialog::MessageDialogKind;

    app.dialog()
        .message(&message)
        .title(&title)
        .kind(MessageDialogKind::Warning)
        .blocking_show()
}

/// Set window title
#[tauri::command]
pub async fn set_window_title(window: tauri::Window, title: String) -> Result<(), String> {
    window.set_title(&title).map_err(|e| e.to_string())
}

// ============================================================================
// Ent: Project Scanning (Tags & Search Feature)
// ============================================================================

/// Project index entry for search results
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectIndexEntry {
    pub path: String,
    pub name: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub modified_at: String,
}

/// Show folder picker dialog
#[tauri::command]
pub async fn show_folder_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let folder_path = app.dialog()
        .file()
        .set_title("Select Folder to Scan")
        .blocking_pick_folder();

    match folder_path {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Scan a folder for .promps files
///
/// # Arguments
/// * `folder_path` - Path to the folder to scan
///
/// # Returns
/// List of project index entries found in the folder
#[tauri::command]
pub async fn scan_projects_folder(folder_path: String) -> Result<Vec<ProjectIndexEntry>, String> {
    let path = Path::new(&folder_path);

    if !path.exists() {
        return Err(format!("Folder not found: {}", folder_path));
    }

    if !path.is_dir() {
        return Err(format!("Not a directory: {}", folder_path));
    }

    let mut entries = Vec::new();

    // Recursively scan for .promps files
    scan_directory_recursive(path, &mut entries)?;

    // Sort by modified_at descending (most recent first)
    entries.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(entries)
}

/// Recursively scan directory for .promps files
fn scan_directory_recursive(dir: &Path, entries: &mut Vec<ProjectIndexEntry>) -> Result<(), String> {
    let read_dir = fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory {}: {}", dir.display(), e))?;

    for entry in read_dir.flatten() {
        let path = entry.path();

        if path.is_dir() {
            // Skip hidden directories and common non-project directories
            let dir_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if !dir_name.starts_with('.') && dir_name != "node_modules" && dir_name != "target" {
                // Recursively scan subdirectory (ignore errors in subdirectories)
                let _ = scan_directory_recursive(&path, entries);
            }
        } else if path.extension().and_then(|e| e.to_str()) == Some("promps") {
            // Try to parse the .promps file
            if let Ok(entry) = parse_promps_file(&path) {
                entries.push(entry);
            }
        }
    }

    Ok(())
}

/// Parse a .promps file and extract index entry
fn parse_promps_file(path: &Path) -> Result<ProjectIndexEntry, String> {
    let contents = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let project: PrompProject = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse project: {}", e))?;

    Ok(ProjectIndexEntry {
        path: path.to_string_lossy().to_string(),
        name: project.metadata.name,
        description: project.metadata.description,
        tags: project.metadata.tags,
        modified_at: project.metadata.modified_at,
    })
}

// ============================================================================
// Ent: API Key Management
// ============================================================================

use crate::modules::api_keys::{
    self, AiProvider, ApiKeyEntry, ApiKeyResult,
};

/// Save an API key for the specified provider
///
/// # Arguments
/// * `provider` - AI provider name ("openai", "anthropic", "google")
/// * `api_key` - The API key to save
///
/// # Returns
/// Result with success/error message
#[tauri::command]
pub fn save_api_key(provider: String, api_key: String) -> ApiKeyResult {
    let ai_provider = match provider.to_lowercase().as_str() {
        "openai" => AiProvider::OpenAI,
        "anthropic" => AiProvider::Anthropic,
        "google" => AiProvider::Google,
        other => AiProvider::Custom(other.to_string()),
    };

    api_keys::save_api_key(&ai_provider, &api_key)
}

/// Get an API key for the specified provider
///
/// # Arguments
/// * `provider` - AI provider name
///
/// # Returns
/// The API key if set, None otherwise
#[tauri::command]
pub fn get_api_key(provider: String) -> Option<String> {
    let ai_provider = match provider.to_lowercase().as_str() {
        "openai" => AiProvider::OpenAI,
        "anthropic" => AiProvider::Anthropic,
        "google" => AiProvider::Google,
        other => AiProvider::Custom(other.to_string()),
    };

    api_keys::get_api_key(&ai_provider)
}

/// Delete an API key for the specified provider
///
/// # Arguments
/// * `provider` - AI provider name
///
/// # Returns
/// Result with success/error message
#[tauri::command]
pub fn delete_api_key(provider: String) -> ApiKeyResult {
    let ai_provider = match provider.to_lowercase().as_str() {
        "openai" => AiProvider::OpenAI,
        "anthropic" => AiProvider::Anthropic,
        "google" => AiProvider::Google,
        other => AiProvider::Custom(other.to_string()),
    };

    api_keys::delete_api_key(&ai_provider)
}

/// List all API key entries with their status (key is masked)
///
/// # Returns
/// List of API key entries with provider info and masked key
#[tauri::command]
pub fn list_api_keys() -> Vec<ApiKeyEntry> {
    api_keys::list_api_keys()
}

/// Check if an API key is set for the specified provider
///
/// # Arguments
/// * `provider` - AI provider name
///
/// # Returns
/// true if key is set, false otherwise
#[tauri::command]
pub fn has_api_key(provider: String) -> bool {
    let ai_provider = match provider.to_lowercase().as_str() {
        "openai" => AiProvider::OpenAI,
        "anthropic" => AiProvider::Anthropic,
        "google" => AiProvider::Google,
        other => AiProvider::Custom(other.to_string()),
    };

    api_keys::has_api_key(&ai_provider)
}

// ============================================================================
// Ent: Direct AI Send
// ============================================================================

use crate::modules::ai_client::{
    self, AiProviderType, AiRequest, AiResponse, AnalysisResponse, MorphemeToken,
};

// ============================================================================
// Ent: Export Feature
// ============================================================================

/// Export format options
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Txt,
    Md,
    Json,
}

/// Export result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub success: bool,
    pub path: Option<String>,
    pub message: String,
}

/// Send a prompt to the specified AI provider
///
/// # Arguments
/// * `provider` - AI provider name ("openai", "anthropic", "google")
/// * `prompt` - The prompt to send
/// * `model` - Optional model override
///
/// # Returns
/// AiResponse with success/error and content
#[tauri::command]
pub async fn send_to_ai(
    provider: String,
    prompt: String,
    model: Option<String>,
) -> AiResponse {
    // Determine AI provider type
    let provider_type = match provider.to_lowercase().as_str() {
        "openai" => AiProviderType::OpenAI,
        "anthropic" => AiProviderType::Anthropic,
        "google" => AiProviderType::Google,
        _ => return AiResponse::error(&format!("Unknown provider: {}", provider), &provider),
    };

    // Get API key for this provider
    let ai_provider = match provider.to_lowercase().as_str() {
        "openai" => AiProvider::OpenAI,
        "anthropic" => AiProvider::Anthropic,
        "google" => AiProvider::Google,
        _ => return AiResponse::error("Unknown provider", &provider),
    };

    let api_key = match api_keys::get_api_key(&ai_provider) {
        Some(key) => key,
        None => return AiResponse::error(
            &format!("No API key set for {}. Please configure it in Settings.", provider_type.display_name()),
            provider_type.display_name(),
        ),
    };

    // Create request
    let request = AiRequest {
        provider: provider_type,
        prompt,
        model,
        max_tokens: Some(4096),
    };

    // Send to AI
    ai_client::send_prompt(request, &api_key).await
}

// ============================================================================
// Ent: AI Import Hub (Morpheme Analysis)
// ============================================================================

/// Generate morpheme analysis prompt based on locale
fn generate_analysis_prompt(text: &str, locale: &str) -> String {
    if locale == "ja" {
        format!(
            r#"以下のテキストを形態素解析し、JSONのみで返してください。
各トークンには以下のtypeを付与:
- noun: 名詞、固有名詞
- particle: 助詞 (が、を、に、で、と、へ、の、も、は、か、から、まで、より)
- verb: 動詞、動詞句
- other: その他

出力形式 (JSONのみ、説明不要):
[{{"text": "単語", "type": "noun"}}, ...]

テキスト: "{}""#,
            text
        )
    } else {
        format!(
            r#"Analyze this text and return JSON only.
Assign types:
- noun: nouns, proper nouns
- article: articles (a, an, the)
- verb: verbs
- other: other

Format (JSON only, no explanation):
[{{"text": "word", "type": "noun"}}, ...]

Text: "{}""#,
            text
        )
    }
}

/// Parse JSON array from AI response (handles markdown code blocks)
fn parse_tokens_from_response(content: &str) -> Result<Vec<MorphemeToken>, String> {
    // Try to extract JSON from the response
    let json_str = if content.contains("```") {
        // Extract content between code blocks
        let start = content.find('[').ok_or("No JSON array found")?;
        let end = content.rfind(']').ok_or("No closing bracket found")?;
        &content[start..=end]
    } else if content.trim().starts_with('[') {
        content.trim()
    } else {
        // Try to find JSON array in the response
        let start = content.find('[').ok_or("No JSON array found")?;
        let end = content.rfind(']').ok_or("No closing bracket found")?;
        &content[start..=end]
    };

    serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse JSON: {}", e))
}

/// Analyze text using AI for morpheme analysis (tokenization)
///
/// # Arguments
/// * `provider` - AI provider name ("openai", "anthropic", "google")
/// * `text` - The text to analyze
/// * `locale` - Locale for analysis prompt ("ja" or "en")
///
/// # Returns
/// AnalysisResponse with tokens or error
#[tauri::command]
pub async fn analyze_text_with_ai(
    provider: String,
    text: String,
    locale: String,
) -> AnalysisResponse {
    // Validate input
    if text.trim().is_empty() {
        return AnalysisResponse::error("Text is empty", &provider);
    }

    // Determine AI provider type
    let provider_type = match provider.to_lowercase().as_str() {
        "openai" => AiProviderType::OpenAI,
        "anthropic" => AiProviderType::Anthropic,
        "google" => AiProviderType::Google,
        _ => return AnalysisResponse::error(&format!("Unknown provider: {}", provider), &provider),
    };

    // Get API key for this provider
    let ai_provider = match provider.to_lowercase().as_str() {
        "openai" => AiProvider::OpenAI,
        "anthropic" => AiProvider::Anthropic,
        "google" => AiProvider::Google,
        _ => return AnalysisResponse::error("Unknown provider", &provider),
    };

    let api_key = match api_keys::get_api_key(&ai_provider) {
        Some(key) => key,
        None => return AnalysisResponse::error(
            &format!("No API key set for {}. Please configure it in Settings.", provider_type.display_name()),
            provider_type.display_name(),
        ),
    };

    // Generate the analysis prompt
    let prompt = generate_analysis_prompt(&text, &locale);

    // Create request
    let request = AiRequest {
        provider: provider_type.clone(),
        prompt,
        model: None,  // Use default model
        max_tokens: Some(2048),
    };

    // Send to AI
    let response = ai_client::send_prompt(request, &api_key).await;

    if !response.success {
        return AnalysisResponse::error(
            response.error.as_deref().unwrap_or("AI request failed"),
            &response.provider,
        );
    }

    // Parse the response
    match response.content {
        Some(content) => {
            match parse_tokens_from_response(&content) {
                Ok(tokens) => AnalysisResponse::success(tokens, &response.provider),
                Err(e) => AnalysisResponse::error(&e, &response.provider),
            }
        }
        None => AnalysisResponse::error("No content in response", &response.provider),
    }
}

/// Get list of available AI providers
#[tauri::command]
pub fn get_ai_providers() -> Vec<serde_json::Value> {
    vec![
        serde_json::json!({
            "id": "openai",
            "name": "OpenAI",
            "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
            "defaultModel": "gpt-4o-mini"
        }),
        serde_json::json!({
            "id": "anthropic",
            "name": "Anthropic",
            "models": ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-3-5-haiku-20241022"],
            "defaultModel": "claude-sonnet-4-20250514"
        }),
        serde_json::json!({
            "id": "google",
            "name": "Google AI",
            "models": ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"],
            "defaultModel": "gemini-2.5-flash"
        }),
    ]
}

// ============================================================================
// Ent: AI Compare (Multi-AI)
// ============================================================================

/// Request item for AI compare (one per provider)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCompareRequest {
    pub provider: String,
    pub model: Option<String>,
}

/// Result from a single AI provider in compare mode
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCompareResult {
    pub provider: String,
    pub model: String,
    pub success: bool,
    pub content: Option<String>,
    pub error: Option<String>,
    pub elapsed_ms: u64,
}

/// Response containing all compare results
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCompareResponse {
    pub results: Vec<AiCompareResult>,
    pub prompt: String,
    pub total_elapsed_ms: u64,
}

/// Send the same prompt to multiple AI providers in parallel
///
/// # Arguments
/// * `prompt` - The prompt to send to all providers
/// * `requests` - List of provider/model pairs to send to
///
/// # Returns
/// AiCompareResponse with results from all providers
#[tauri::command]
pub async fn send_to_multiple_ai(
    prompt: String,
    requests: Vec<AiCompareRequest>,
) -> AiCompareResponse {
    use std::time::Instant;
    use tokio::task::JoinSet;

    let total_start = Instant::now();
    let mut join_set = JoinSet::new();

    for (index, req) in requests.into_iter().enumerate() {
        let prompt_clone = prompt.clone();
        join_set.spawn(async move {
            let start = Instant::now();

            let provider_type = match req.provider.to_lowercase().as_str() {
                "openai" => AiProviderType::OpenAI,
                "anthropic" => AiProviderType::Anthropic,
                "google" => AiProviderType::Google,
                _ => {
                    return (index, AiCompareResult {
                        provider: req.provider,
                        model: String::new(),
                        success: false,
                        content: None,
                        error: Some("Unknown provider".to_string()),
                        elapsed_ms: start.elapsed().as_millis() as u64,
                    });
                }
            };

            let ai_provider = match req.provider.to_lowercase().as_str() {
                "openai" => AiProvider::OpenAI,
                "anthropic" => AiProvider::Anthropic,
                "google" => AiProvider::Google,
                _ => {
                    return (index, AiCompareResult {
                        provider: req.provider,
                        model: String::new(),
                        success: false,
                        content: None,
                        error: Some("Unknown provider".to_string()),
                        elapsed_ms: start.elapsed().as_millis() as u64,
                    });
                }
            };

            let api_key = match api_keys::get_api_key(&ai_provider) {
                Some(key) => key,
                None => {
                    return (index, AiCompareResult {
                        provider: provider_type.display_name().to_string(),
                        model: String::new(),
                        success: false,
                        content: None,
                        error: Some(format!("No API key set for {}", provider_type.display_name())),
                        elapsed_ms: start.elapsed().as_millis() as u64,
                    });
                }
            };

            let model = req.model.unwrap_or_else(|| provider_type.default_model().to_string());
            let ai_request = AiRequest {
                provider: provider_type.clone(),
                prompt: prompt_clone,
                model: Some(model.clone()),
                max_tokens: Some(4096),
            };

            let response = ai_client::send_prompt(ai_request, &api_key).await;
            let elapsed = start.elapsed().as_millis() as u64;

            (index, AiCompareResult {
                provider: provider_type.display_name().to_string(),
                model,
                success: response.success,
                content: response.content,
                error: response.error,
                elapsed_ms: elapsed,
            })
        });
    }

    let mut indexed_results = Vec::new();
    while let Some(result) = join_set.join_next().await {
        match result {
            Ok((idx, compare_result)) => indexed_results.push((idx, compare_result)),
            Err(e) => indexed_results.push((usize::MAX, AiCompareResult {
                provider: "Unknown".to_string(),
                model: String::new(),
                success: false,
                content: None,
                error: Some(format!("Task failed: {}", e)),
                elapsed_ms: 0,
            })),
        }
    }

    // Sort by original request order
    indexed_results.sort_by_key(|(idx, _)| *idx);
    let results: Vec<AiCompareResult> = indexed_results.into_iter().map(|(_, r)| r).collect();

    let total_elapsed = total_start.elapsed().as_millis() as u64;

    AiCompareResponse {
        results,
        prompt,
        total_elapsed_ms: total_elapsed,
    }
}

// ============================================================================
// Ent: Export Commands
// ============================================================================

/// Show export file dialog and return selected path
///
/// # Arguments
/// * `default_name` - Default file name without extension
/// * `format` - Export format (txt, md, json)
///
/// # Returns
/// Selected file path or None if cancelled
#[tauri::command]
pub async fn show_export_dialog(
    app: tauri::AppHandle,
    default_name: String,
    format: ExportFormat,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let (extension, filter_name) = match format {
        ExportFormat::Txt => ("txt", "Text Files"),
        ExportFormat::Md => ("md", "Markdown Files"),
        ExportFormat::Json => ("json", "JSON Files"),
    };

    let file_name = format!("{}.{}", default_name, extension);

    let file_path = app.dialog()
        .file()
        .add_filter(filter_name, &[extension])
        .set_title("Export")
        .set_file_name(&file_name)
        .blocking_save_file();

    match file_path {
        Some(path) => {
            let mut path_str = path.to_string();
            // Ensure correct extension
            let ext_with_dot = format!(".{}", extension);
            if !path_str.to_lowercase().ends_with(&ext_with_dot) {
                path_str.push_str(&ext_with_dot);
            }
            Ok(Some(path_str))
        },
        None => Ok(None),
    }
}

/// Export prompt to file
///
/// # Arguments
/// * `path` - File path to export to
/// * `content` - Prompt content to export
/// * `format` - Export format (txt, md, json)
///
/// # Returns
/// ExportResult with success status and message
#[tauri::command]
pub fn export_prompt(
    path: String,
    content: String,
    format: ExportFormat,
) -> ExportResult {
    let formatted_content = match format {
        ExportFormat::Txt => content,
        ExportFormat::Md => format!("# Generated Prompt\n\n{}\n", content),
        ExportFormat::Json => {
            let timestamp = chrono_now();
            match serde_json::to_string_pretty(&serde_json::json!({
                "type": "prompt",
                "version": "1.0.0",
                "exportedAt": timestamp,
                "content": content
            })) {
                Ok(json) => json,
                Err(e) => return ExportResult {
                    success: false,
                    path: None,
                    message: format!("Failed to serialize JSON: {}", e),
                },
            }
        }
    };

    match fs::write(&path, formatted_content) {
        Ok(()) => ExportResult {
            success: true,
            path: Some(path),
            message: "Export successful".to_string(),
        },
        Err(e) => ExportResult {
            success: false,
            path: None,
            message: format!("Failed to write file: {}", e),
        },
    }
}

/// Export full project to file
///
/// # Arguments
/// * `path` - File path to export to
/// * `project` - Project data to export
/// * `prompt` - Generated prompt content
///
/// # Returns
/// ExportResult with success status and message
#[tauri::command]
pub fn export_project(
    path: String,
    project: PrompProject,
    prompt: String,
) -> ExportResult {
    let timestamp = chrono_now();

    let export_data = serde_json::json!({
        "type": "project_export",
        "version": "1.0.0",
        "exportedAt": timestamp,
        "project": project,
        "generatedPrompt": prompt
    });

    match serde_json::to_string_pretty(&export_data) {
        Ok(json) => {
            match fs::write(&path, json) {
                Ok(()) => ExportResult {
                    success: true,
                    path: Some(path),
                    message: "Project export successful".to_string(),
                },
                Err(e) => ExportResult {
                    success: false,
                    path: None,
                    message: format!("Failed to write file: {}", e),
                },
            }
        },
        Err(e) => ExportResult {
            success: false,
            path: None,
            message: format!("Failed to serialize project: {}", e),
        },
    }
}

// ============================================================================
// v1.2.0: Template Export/Import Commands
// ============================================================================

/// Show template export file dialog and return selected path
///
/// # Arguments
/// * `default_name` - Default file name without extension
///
/// # Returns
/// Selected file path or None if cancelled
#[tauri::command]
pub async fn show_template_export_dialog(
    app: tauri::AppHandle,
    default_name: String,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_name = format!("{}.promps-template", default_name);

    let file_path = app.dialog()
        .file()
        .add_filter("Promps Template", &["promps-template"])
        .set_title("Export Template")
        .set_file_name(&file_name)
        .blocking_save_file();

    match file_path {
        Some(path) => {
            let mut path_str = path.to_string();
            // Ensure correct extension
            if !path_str.to_lowercase().ends_with(".promps-template") {
                path_str.push_str(".promps-template");
            }
            Ok(Some(path_str))
        },
        None => Ok(None),
    }
}

/// Show template import file dialog and return selected path
///
/// # Returns
/// Selected file path or None if cancelled
#[tauri::command]
pub async fn show_template_import_dialog(
    app: tauri::AppHandle,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app.dialog()
        .file()
        .add_filter("Promps Template", &["promps-template"])
        .set_title("Import Template")
        .blocking_pick_file();

    match file_path {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Export template to file
///
/// # Arguments
/// * `path` - File path to export to
/// * `template` - Template data (JSON value from frontend)
///
/// # Returns
/// ExportResult with success status and message
#[tauri::command]
pub fn export_template(
    path: String,
    template: serde_json::Value,
) -> ExportResult {
    // Validate path extension
    if !path.to_lowercase().ends_with(".promps-template") {
        return ExportResult {
            success: false,
            path: None,
            message: "File must have .promps-template extension".to_string(),
        };
    }

    match serde_json::to_string_pretty(&template) {
        Ok(json) => {
            match fs::write(&path, json) {
                Ok(()) => ExportResult {
                    success: true,
                    path: Some(path),
                    message: "Template export successful".to_string(),
                },
                Err(e) => ExportResult {
                    success: false,
                    path: None,
                    message: format!("Failed to write file: {}", e),
                },
            }
        },
        Err(e) => ExportResult {
            success: false,
            path: None,
            message: format!("Failed to serialize template: {}", e),
        },
    }
}

/// Import template from file
///
/// # Arguments
/// * `path` - File path to import from
///
/// # Returns
/// Result containing template data or error message
#[tauri::command]
pub fn import_template(path: String) -> Result<serde_json::Value, String> {
    // Validate path extension
    if !path.to_lowercase().ends_with(".promps-template") {
        return Err("File must have .promps-template extension".to_string());
    }

    // Check if file exists
    if !Path::new(&path).exists() {
        return Err(format!("File not found: {}", path));
    }

    // Read file contents
    let contents = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Parse JSON
    let template: serde_json::Value = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse template file: {}", e))?;

    // Validate structure
    if template.get("type").and_then(|v| v.as_str()) != Some("promps-template") {
        return Err("Invalid template file format: missing or incorrect type field".to_string());
    }

    if template.get("template").is_none() {
        return Err("Invalid template file format: missing template data".to_string());
    }

    Ok(template)
}

// ============================================================================
// v2.0.0: QR Code Sharing
// ============================================================================

use crate::modules::qr_share::{
    self, QrGenerateResult, QrDecodeResult,
};

/// Generate QR code from prompt DSL as base64 PNG
///
/// # Arguments
/// * `name` - Project name
/// * `dsl` - DSL text (block sequence)
/// * `locale` - Locale code (ja, en, fr)
///
/// # Returns
/// QrGenerateResult with base64 PNG data or error
#[tauri::command]
pub fn generate_qr_code(name: String, workspace_state: String, locale: String) -> QrGenerateResult {
    qr_share::generate_qr_from_prompt(&name, &workspace_state, &locale)
}

/// Save QR code to a PNG file
///
/// # Arguments
/// * `name` - Project name
/// * `workspace_state` - Blockly workspace state JSON
/// * `locale` - Locale code
/// * `path` - File path to save to
///
/// # Returns
/// QrGenerateResult with success/error
#[tauri::command]
pub fn save_qr_code(name: String, workspace_state: String, locale: String, path: String) -> QrGenerateResult {
    qr_share::save_qr_to_file(&name, &workspace_state, &locale, &path)
}

/// Decode QR code from a PNG image file
///
/// # Arguments
/// * `path` - Path to the PNG image file
///
/// # Returns
/// QrDecodeResult with decoded prompt data or error
#[tauri::command]
pub fn decode_qr_code(path: String) -> QrDecodeResult {
    qr_share::decode_qr_from_file(&path)
}

/// Show file dialog for opening a QR code image
///
/// # Returns
/// Selected file path or None if cancelled
#[tauri::command]
pub async fn show_qr_open_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app.dialog()
        .file()
        .add_filter("PNG Images", &["png"])
        .set_title("Open QR Code Image")
        .blocking_pick_file();

    match file_path {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Show save dialog for QR code PNG
///
/// # Arguments
/// * `default_name` - Default file name without extension
///
/// # Returns
/// Selected file path or None if cancelled
#[tauri::command]
pub async fn show_qr_save_dialog(
    app: tauri::AppHandle,
    default_name: String,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_name = format!("{}.png", default_name);

    let file_path = app.dialog()
        .file()
        .add_filter("PNG Images", &["png"])
        .set_title("Save QR Code")
        .set_file_name(&file_name)
        .blocking_save_file();

    match file_path {
        Some(path) => {
            let mut path_str = path.to_string();
            if !path_str.to_lowercase().ends_with(".png") {
                path_str.push_str(".png");
            }
            Ok(Some(path_str))
        },
        None => Ok(None),
    }
}

// ============================================================================
// v2.0.0: LAN P2P File Exchange
// ============================================================================

use crate::modules::lan_discovery::{
    self, DiscoveryState, LanPeer,
};
use crate::modules::lan_transfer::{
    self, TransferResult, TransferState,
};
use mdns_sd::ServiceDaemon;
use std::collections::HashMap;
use std::net::TcpStream;
use std::sync::{Arc, Mutex};

/// Application state for LAN sharing
pub struct AppState {
    pub discovery: DiscoveryState,
    pub transfer: TransferState,
    /// mDNS service daemon handle
    pub mdns_daemon: Arc<Mutex<Option<ServiceDaemon>>>,
    /// TCP listener shutdown sender
    pub tcp_shutdown: Arc<Mutex<Option<std::sync::mpsc::Sender<()>>>>,
    /// Active TCP connections keyed by transfer_id (for accept/reject completion)
    pub active_connections: Arc<Mutex<HashMap<String, TcpStream>>>,
    /// Unique instance ID for this running instance
    pub instance_id: String,
    /// Display name for this instance
    pub instance_name: String,
}

// --- Response wrapper types for FE⇔BE field mapping ---

/// Peer response wrapper (FE expects `result.peers` and `peer.address`)
#[derive(Serialize)]
pub struct PeersResponse {
    pub peers: Vec<PeerInfo>,
}

/// Peer info mapped for frontend consumption
#[derive(Serialize)]
pub struct PeerInfo {
    pub id: String,
    pub name: String,
    /// Frontend expects "address" (backend LanPeer uses "ip")
    pub address: String,
    pub port: u16,
    pub version: String,
}

impl From<LanPeer> for PeerInfo {
    fn from(p: LanPeer) -> Self {
        PeerInfo {
            id: p.id,
            name: p.name,
            address: p.ip,
            port: p.port,
            version: p.version,
        }
    }
}

/// Transfers response wrapper (FE expects `result.offers`)
#[derive(Serialize)]
pub struct TransfersResponse {
    pub offers: Vec<OfferInfo>,
}

/// Offer info mapped for frontend consumption
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OfferInfo {
    /// FE expects "id" (backend PendingOffer uses "transfer_id")
    pub id: String,
    /// FE expects "fromPeer" (backend PendingOffer uses "peer_name")
    pub from_peer: String,
    pub file_name: String,
    pub file_size: u64,
}

/// Accept transfer response (FE expects `result.data.dsl`)
#[derive(Serialize)]
pub struct AcceptTransferResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<AcceptTransferData>,
}

#[derive(Serialize)]
pub struct AcceptTransferData {
    pub dsl: String,
}

// --- LAN Commands ---

/// Start LAN sharing (mDNS advertisement + TCP listener)
#[tauri::command]
pub async fn start_lan_sharing(state: tauri::State<'_, AppState>) -> Result<TransferResult, String> {
    {
        let is_running = state.discovery.is_running.lock().unwrap();
        if *is_running {
            return Ok(TransferResult {
                success: false,
                message: "LAN sharing is already running".to_string(),
                transfer_id: None,
            });
        }
    }

    // Find available port
    let port = lan_discovery::find_available_port()?;

    // Start mDNS service
    let version = env!("CARGO_PKG_VERSION");
    let daemon = lan_discovery::start_mdns_service(
        &state.instance_id,
        &state.instance_name,
        port,
        version,
        &state.discovery,
    )?;

    // Store daemon handle
    {
        let mut daemon_opt = state.mdns_daemon.lock().unwrap();
        *daemon_opt = Some(daemon);
    }

    // Start TCP listener
    let shutdown_tx = lan_transfer::start_tcp_listener(
        port,
        state.instance_id.clone(),
        state.instance_name.clone(),
        version.to_string(),
        Arc::clone(&state.transfer.pending_offers),
        Arc::clone(&state.active_connections),
    )?;

    // Store shutdown handle
    {
        let mut shutdown_opt = state.tcp_shutdown.lock().unwrap();
        *shutdown_opt = Some(shutdown_tx);
    }

    // Update state flags
    {
        let mut is_running = state.discovery.is_running.lock().unwrap();
        *is_running = true;
    }
    {
        let mut server_port = state.transfer.port.lock().unwrap();
        *server_port = port;
    }
    {
        let mut transfer_running = state.transfer.is_running.lock().unwrap();
        *transfer_running = true;
    }

    Ok(TransferResult {
        success: true,
        message: format!("LAN sharing started on port {}", port),
        transfer_id: None,
    })
}

/// Stop LAN sharing
#[tauri::command]
pub async fn stop_lan_sharing(state: tauri::State<'_, AppState>) -> Result<TransferResult, String> {
    {
        let is_running = state.discovery.is_running.lock().unwrap();
        if !*is_running {
            return Ok(TransferResult {
                success: false,
                message: "LAN sharing is not running".to_string(),
                transfer_id: None,
            });
        }
    }

    // Stop mDNS
    {
        let mut daemon_opt = state.mdns_daemon.lock().unwrap();
        if let Some(daemon) = daemon_opt.take() {
            lan_discovery::stop_mdns_service(daemon);
        }
    }

    // Stop TCP listener
    {
        let mut shutdown_opt = state.tcp_shutdown.lock().unwrap();
        if let Some(tx) = shutdown_opt.take() {
            let _ = tx.send(());
        }
    }

    // Clear active connections
    {
        let mut conns = state.active_connections.lock().unwrap();
        conns.clear();
    }

    // Update state flags
    {
        let mut is_running = state.discovery.is_running.lock().unwrap();
        *is_running = false;
    }
    {
        let mut transfer_running = state.transfer.is_running.lock().unwrap();
        *transfer_running = false;
    }

    // Clear peers
    {
        let mut peers = state.discovery.peers.lock().unwrap();
        peers.clear();
    }

    // Clear pending offers
    {
        let mut offers = state.transfer.pending_offers.lock().unwrap();
        offers.clear();
    }

    Ok(TransferResult {
        success: true,
        message: "LAN sharing stopped".to_string(),
        transfer_id: None,
    })
}

/// Get list of discovered LAN peers
#[tauri::command]
pub fn get_lan_peers(state: tauri::State<'_, AppState>) -> PeersResponse {
    let peers = lan_discovery::get_peers(&state.discovery);
    PeersResponse {
        peers: peers.into_iter().map(PeerInfo::from).collect(),
    }
}

/// Get LAN sharing status
#[tauri::command]
pub fn get_lan_sharing_status(state: tauri::State<'_, AppState>) -> serde_json::Value {
    let is_running = *state.discovery.is_running.lock().unwrap();
    let port = *state.transfer.port.lock().unwrap();
    let peer_count = state.discovery.peers.lock().unwrap().len();

    serde_json::json!({
        "isRunning": is_running,
        "port": port,
        "peerCount": peer_count
    })
}

/// Send a project file to a LAN peer via TCP
///
/// FE sends: { peerAddress, peerPort, projectName, projectData }
#[tauri::command]
pub async fn send_project_to_peer(
    state: tauri::State<'_, AppState>,
    peer_address: String,
    peer_port: u16,
    project_name: String,
    project_data: String,
) -> Result<TransferResult, String> {
    {
        let is_running = state.discovery.is_running.lock().unwrap();
        if !*is_running {
            return Ok(TransferResult {
                success: false,
                message: "LAN sharing is not running. Start sharing first.".to_string(),
                transfer_id: None,
            });
        }
    }

    let my_id = state.instance_id.clone();
    let my_name = state.instance_name.clone();
    let version = env!("CARGO_PKG_VERSION").to_string();

    // Run blocking TCP send in a spawned task
    let result = tokio::task::spawn_blocking(move || {
        lan_transfer::send_to_peer(
            &peer_address,
            peer_port,
            &my_id,
            &my_name,
            &version,
            &project_name,
            &project_data,
        )
    })
    .await
    .map_err(|e| format!("Send task failed: {}", e))?;

    Ok(result)
}

/// Get pending transfer offers
#[tauri::command]
pub fn get_pending_transfers(state: tauri::State<'_, AppState>) -> TransfersResponse {
    let offers = lan_transfer::get_pending_offers(&state.transfer);
    TransfersResponse {
        offers: offers
            .into_iter()
            .map(|o| OfferInfo {
                id: o.transfer_id,
                from_peer: o.peer_name,
                file_name: o.file_name,
                file_size: o.file_size,
            })
            .collect(),
    }
}

/// Accept a pending transfer
///
/// FE sends: { offerId }
#[tauri::command]
pub async fn accept_transfer(
    state: tauri::State<'_, AppState>,
    offer_id: String,
) -> Result<AcceptTransferResponse, String> {
    // First update status in pending_offers
    let accept_result = lan_transfer::accept_offer(&state.transfer, &offer_id);
    if !accept_result.success {
        return Ok(AcceptTransferResponse {
            success: false,
            error: Some(accept_result.message),
            data: None,
        });
    }

    // Clone Arcs for spawn_blocking (blocking TCP I/O)
    let connections = Arc::clone(&state.active_connections);
    let offers = Arc::clone(&state.transfer.pending_offers);
    let oid = offer_id.clone();

    let result = tokio::task::spawn_blocking(move || {
        lan_transfer::complete_accepted_transfer(&oid, &connections, &offers)
    })
    .await
    .map_err(|e| format!("Accept task failed: {}", e))?;

    match result {
        Ok(dsl) => Ok(AcceptTransferResponse {
            success: true,
            error: None,
            data: Some(AcceptTransferData { dsl }),
        }),
        Err(e) => Ok(AcceptTransferResponse {
            success: false,
            error: Some(e),
            data: None,
        }),
    }
}

/// Reject a pending transfer
///
/// FE sends: { offerId }
#[tauri::command]
pub async fn reject_transfer(
    state: tauri::State<'_, AppState>,
    offer_id: String,
) -> Result<TransferResult, String> {
    // Update status in pending_offers
    let reject_result = lan_transfer::reject_offer(&state.transfer, &offer_id);
    if !reject_result.success {
        return Ok(reject_result);
    }

    // Clone Arc for spawn_blocking (blocking TCP I/O)
    let connections = Arc::clone(&state.active_connections);
    let oid = offer_id.clone();

    let _ = tokio::task::spawn_blocking(move || {
        lan_transfer::complete_rejected_transfer(
            &oid,
            Some("User rejected".to_string()),
            &connections,
        )
    })
    .await;

    Ok(reject_result)
}

// ============================================================================
// v2.1.0: Wizard Templates
// ============================================================================

/// Get wizard templates for the current locale
#[tauri::command]
pub fn get_wizard_templates(locale: Option<String>) -> Vec<crate::modules::wizard::WizardTemplate> {
    let loc = locale.unwrap_or_else(|| "ja".to_string());
    get_wizard_templates_by_locale(&loc)
}

/// Show save dialog for custom wizard export
#[tauri::command]
pub async fn show_wizard_export_dialog(app: tauri::AppHandle, default_name: String) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app.dialog()
        .file()
        .add_filter("Wizard JSON", &["json"])
        .set_title("Export Custom Wizards")
        .set_file_name(&default_name)
        .blocking_save_file();

    match file_path {
        Some(path) => {
            let mut path_str = path.to_string();
            if !path_str.to_lowercase().ends_with(".json") {
                path_str.push_str(".json");
            }
            Ok(Some(path_str))
        },
        None => Ok(None),
    }
}

/// Show open dialog for custom wizard import
#[tauri::command]
pub async fn show_wizard_import_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app.dialog()
        .file()
        .add_filter("Wizard JSON", &["json"])
        .set_title("Import Custom Wizards")
        .blocking_pick_file();

    match file_path {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

/// Export custom wizards JSON to file
#[tauri::command]
pub fn export_custom_wizards(path: String, data: String) -> Result<(), String> {
    fs::write(&path, data)
        .map_err(|e| format!("Failed to write wizard file: {}", e))
}

/// Import custom wizards JSON from file
#[tauri::command]
pub fn import_custom_wizards(path: String) -> Result<String, String> {
    if !Path::new(&path).exists() {
        return Err(format!("File not found: {}", path));
    }
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read wizard file: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_prompt_from_text() {
        let input = "_N:ユーザー が _N:注文 を 作成".to_string();
        let result = generate_prompt_from_text(input);

        // Each noun gets its own (NOUN) marker
        assert!(result.contains("ユーザー (NOUN)"));
        assert!(result.contains("注文 (NOUN)"));
        assert!(result.contains("が"));
        assert!(result.contains("を 作成"));
    }

    #[test]
    fn test_greet() {
        let result = greet("World".to_string());
        assert_eq!(result, "Hello, World! Welcome to Promps.");
    }

    // Phase 1 Integration Tests

    #[test]
    fn test_single_noun_block() {
        let input = "_N:User".to_string();
        let result = generate_prompt_from_text(input);

        assert!(result.contains("User"));
        assert!(result.contains("(NOUN)"));
    }

    #[test]
    fn test_multiple_noun_blocks() {
        // Phase 0-1: token-level is_noun detection
        // Each _N: token gets its own (NOUN) marker
        let input = "_N:User _N:Order".to_string();
        let result = generate_prompt_from_text(input);

        assert!(result.contains("User"));
        assert!(result.contains("Order"));
        // Each noun gets its own marker
        let noun_count = result.matches("(NOUN)").count();
        assert_eq!(noun_count, 2);
    }

    #[test]
    fn test_japanese_noun_blocks() {
        // Phase 0-1: token-level is_noun detection
        let input = "_N:データベース _N:テーブル _N:ブロック".to_string();
        let result = generate_prompt_from_text(input);

        assert!(result.contains("データベース"));
        assert!(result.contains("テーブル"));
        assert!(result.contains("ブロック"));
        // Each noun gets its own marker
        let noun_count = result.matches("(NOUN)").count();
        assert_eq!(noun_count, 3);
    }

    #[test]
    fn test_empty_input() {
        let input = "".to_string();
        let result = generate_prompt_from_text(input);

        assert_eq!(result, "");
    }

    #[test]
    fn test_whitespace_only_input() {
        let input = "   ".to_string();
        let result = generate_prompt_from_text(input);

        // Empty parts should result in empty output
        assert_eq!(result, "");
    }

    #[test]
    fn test_complex_sentence_structure() {
        // Note: _N: only applies to the token immediately after it
        let input = "_N:GUI ブロック ビルダー 機能  ドラッグ アンド ドロップ で ブロック を 配置 する".to_string();
        let result = generate_prompt_from_text(input);

        // Only "GUI" is marked as noun
        assert!(result.contains("GUI (NOUN)"));

        // Rest of the tokens are not nouns
        assert!(result.contains("ブロック ビルダー 機能"));
        assert!(result.contains("ドラッグ アンド ドロップ で ブロック を 配置 する"));
    }

    #[test]
    fn test_noun_and_description_alternating() {
        let input = "_N:機能  説明文  _N:対象ユーザー  開発者向け".to_string();
        let result = generate_prompt_from_text(input);

        // Nouns should be marked
        assert!(result.contains("機能"));
        assert!(result.contains("対象ユーザー"));

        // Descriptions should be present
        assert!(result.contains("説明文"));
        assert!(result.contains("開発者向け"));

        // Should have exactly 2 noun markers
        let noun_count = result.matches("(NOUN)").count();
        assert_eq!(noun_count, 2);
    }

    #[test]
    fn test_blockly_generated_code_pattern() {
        // Simulate code generated by Blockly.js workspace
        // Phase 0-1: token-level is_noun detection
        let input = "_N:User _N:Order _N:Product ".to_string();
        let result = generate_prompt_from_text(input);

        // All three nouns should be present
        assert!(result.contains("User"));
        assert!(result.contains("Order"));
        assert!(result.contains("Product"));

        // Each noun gets its own marker
        let noun_count = result.matches("(NOUN)").count();
        assert_eq!(noun_count, 3);
    }

    #[test]
    fn test_special_characters_in_noun() {
        let input = "_N:User123 _N:Order_ID".to_string();
        let result = generate_prompt_from_text(input);

        assert!(result.contains("User123"));
        assert!(result.contains("Order_ID"));
    }

    #[test]
    fn test_greet_with_empty_name() {
        let result = greet("".to_string());
        assert_eq!(result, "Hello, ! Welcome to Promps.");
    }

    #[test]
    fn test_greet_with_japanese_name() {
        let result = greet("太郎".to_string());
        assert_eq!(result, "Hello, 太郎! Welcome to Promps.");
    }

    // Phase 4: Project Persistence Tests

    #[test]
    fn test_create_new_project() {
        let project = create_new_project("Test Project".to_string());

        assert_eq!(project.version, "1.0.0");
        assert_eq!(project.metadata.name, "Test Project");
        assert!(project.metadata.description.is_none());
        assert!(project.metadata.author.is_none());
        assert!(!project.metadata.created_at.is_empty());
        assert!(!project.metadata.modified_at.is_empty());
    }

    #[test]
    fn test_project_serialization() {
        let project = create_new_project("Serialization Test".to_string());

        // Test serialization
        let json = serde_json::to_string(&project).unwrap();

        // Verify JSON contains expected fields
        assert!(json.contains("\"version\":\"1.0.0\""));
        assert!(json.contains("\"name\":\"Serialization Test\""));
        assert!(json.contains("\"workspace\":"));
        assert!(json.contains("\"settings\":"));
    }

    #[test]
    fn test_project_deserialization() {
        let json = r#"{
            "version": "1.0.0",
            "metadata": {
                "name": "Deserialize Test",
                "description": "Test description",
                "createdAt": "2026-01-23T10:00:00Z",
                "modifiedAt": "2026-01-23T11:00:00Z",
                "author": "Test Author"
            },
            "workspace": {"blocks": []},
            "settings": {"zoom": 1.5, "scrollX": 100, "scrollY": 200}
        }"#;

        let project: PrompProject = serde_json::from_str(json).unwrap();

        assert_eq!(project.version, "1.0.0");
        assert_eq!(project.metadata.name, "Deserialize Test");
        assert_eq!(project.metadata.description, Some("Test description".to_string()));
        assert_eq!(project.metadata.author, Some("Test Author".to_string()));
        assert_eq!(project.metadata.created_at, "2026-01-23T10:00:00Z");
        assert_eq!(project.metadata.modified_at, "2026-01-23T11:00:00Z");
    }

    #[test]
    fn test_update_project_timestamp() {
        let project = create_new_project("Timestamp Test".to_string());
        let _original_modified = project.metadata.modified_at.clone();

        // Small delay to ensure different timestamp
        std::thread::sleep(std::time::Duration::from_millis(10));

        let updated = update_project_timestamp(project);

        // The timestamp should be different (or at least not fail)
        assert!(!updated.metadata.modified_at.is_empty());
    }

    #[test]
    fn test_chrono_now_format() {
        let timestamp = chrono_now();

        // Verify ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
        assert!(timestamp.len() == 20);
        assert!(timestamp.contains('T'));
        assert!(timestamp.ends_with('Z'));
    }

    #[test]
    fn test_save_project_invalid_extension() {
        let project = create_new_project("Test".to_string());
        let result = save_project("/tmp/test.txt".to_string(), project);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("extension"));
    }

    #[test]
    fn test_load_project_nonexistent_file() {
        let result = load_project("/nonexistent/path/file.promps".to_string());

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    fn test_load_project_invalid_extension() {
        // Create a temp file to test extension validation (cross-platform)
        let temp_dir = std::env::temp_dir();
        let temp_file = temp_dir.join("promps_test_invalid_ext.txt");
        fs::write(&temp_file, "test content").unwrap();

        let result = load_project(temp_file.to_string_lossy().to_string());

        // Clean up
        let _ = fs::remove_file(&temp_file);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("extension"));
    }

    // Phase 5: Grammar Validation Tests

    #[test]
    fn test_validate_dsl_sequence_valid() {
        let result = validate_dsl_sequence("_N:User が _N:Document を 分析して".to_string(), None);

        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
        assert_eq!(result.warning_count, 0);
    }

    #[test]
    fn test_validate_dsl_sequence_particle_without_noun() {
        let result = validate_dsl_sequence("が _N:User".to_string(), None);

        assert!(!result.is_valid);
        assert_eq!(result.error_count, 1);
        assert!(result.errors[0].message.contains("助詞"));
    }

    #[test]
    fn test_validate_dsl_sequence_consecutive_particles() {
        let result = validate_dsl_sequence("_N:User が を".to_string(), None);

        assert!(!result.is_valid);
        assert!(result.error_count >= 1);
    }

    #[test]
    fn test_validate_dsl_sequence_empty() {
        let result = validate_dsl_sequence("".to_string(), None);

        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    // Phase 5: English Grammar Validation Tests

    #[test]
    fn test_validate_dsl_sequence_en_valid() {
        let result = validate_dsl_sequence("analyze _N:document".to_string(), Some("en".to_string()));

        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_validate_dsl_sequence_en_with_article() {
        let result = validate_dsl_sequence("summarize the _N:report".to_string(), Some("en".to_string()));

        assert!(result.is_valid);
        assert_eq!(result.error_count, 0);
    }

    #[test]
    fn test_validate_dsl_sequence_en_article_error() {
        // Article not followed by noun
        let result = validate_dsl_sequence("the analyze _N:document".to_string(), Some("en".to_string()));

        assert!(!result.is_valid);
        assert!(result.error_count >= 1);
    }

    #[test]
    fn test_validate_dsl_sequence_en_consecutive_articles() {
        let result = validate_dsl_sequence("the a _N:document".to_string(), Some("en".to_string()));

        assert!(!result.is_valid);
        // Should have consecutive articles error
        assert!(result.errors.iter().any(|e| format!("{:?}", e.code).contains("ConsecutiveArticles")));
    }

    // Ent: Export Feature Tests

    #[test]
    fn test_export_prompt_txt() {
        let temp_dir = std::env::temp_dir();
        let temp_file = temp_dir.join("promps_export_test.txt");
        let path = temp_file.to_string_lossy().to_string();

        let result = export_prompt(
            path.clone(),
            "Test prompt content".to_string(),
            ExportFormat::Txt,
        );

        assert!(result.success);
        assert_eq!(result.path, Some(path.clone()));

        // Verify content
        let content = fs::read_to_string(&temp_file).unwrap();
        assert_eq!(content, "Test prompt content");

        // Clean up
        let _ = fs::remove_file(&temp_file);
    }

    #[test]
    fn test_export_prompt_md() {
        let temp_dir = std::env::temp_dir();
        let temp_file = temp_dir.join("promps_export_test.md");
        let path = temp_file.to_string_lossy().to_string();

        let result = export_prompt(
            path.clone(),
            "Test prompt content".to_string(),
            ExportFormat::Md,
        );

        assert!(result.success);
        assert_eq!(result.path, Some(path.clone()));

        // Verify content has markdown header
        let content = fs::read_to_string(&temp_file).unwrap();
        assert!(content.contains("# Generated Prompt"));
        assert!(content.contains("Test prompt content"));

        // Clean up
        let _ = fs::remove_file(&temp_file);
    }

    #[test]
    fn test_export_prompt_json() {
        let temp_dir = std::env::temp_dir();
        let temp_file = temp_dir.join("promps_export_test.json");
        let path = temp_file.to_string_lossy().to_string();

        let result = export_prompt(
            path.clone(),
            "Test prompt content".to_string(),
            ExportFormat::Json,
        );

        assert!(result.success);
        assert_eq!(result.path, Some(path.clone()));

        // Verify JSON structure
        let content = fs::read_to_string(&temp_file).unwrap();
        let json: serde_json::Value = serde_json::from_str(&content).unwrap();

        assert_eq!(json["type"], "prompt");
        assert_eq!(json["version"], "1.0.0");
        assert_eq!(json["content"], "Test prompt content");
        assert!(json["exportedAt"].is_string());

        // Clean up
        let _ = fs::remove_file(&temp_file);
    }

    #[test]
    fn test_export_project_json() {
        let temp_dir = std::env::temp_dir();
        let temp_file = temp_dir.join("promps_project_export_test.json");
        let path = temp_file.to_string_lossy().to_string();

        let project = create_new_project("Test Export Project".to_string());

        let result = export_project(
            path.clone(),
            project,
            "Generated prompt text".to_string(),
        );

        assert!(result.success);
        assert_eq!(result.path, Some(path.clone()));

        // Verify JSON structure
        let content = fs::read_to_string(&temp_file).unwrap();
        let json: serde_json::Value = serde_json::from_str(&content).unwrap();

        assert_eq!(json["type"], "project_export");
        assert_eq!(json["version"], "1.0.0");
        assert_eq!(json["generatedPrompt"], "Generated prompt text");
        assert_eq!(json["project"]["metadata"]["name"], "Test Export Project");
        assert!(json["exportedAt"].is_string());

        // Clean up
        let _ = fs::remove_file(&temp_file);
    }

    // Ent: Tags & Search Feature Tests

    #[test]
    fn test_project_metadata_with_tags() {
        let mut project = create_new_project("Tag Test".to_string());

        // Add tags to the project
        project.metadata.tags = vec!["work".to_string(), "ai".to_string(), "prompts".to_string()];

        // Serialize
        let json = serde_json::to_string(&project).unwrap();

        // Verify tags are serialized
        assert!(json.contains("\"tags\""));
        assert!(json.contains("work"));
        assert!(json.contains("ai"));
        assert!(json.contains("prompts"));
    }

    #[test]
    fn test_project_metadata_empty_tags_not_serialized() {
        let project = create_new_project("Empty Tags Test".to_string());

        // Empty tags should not appear in JSON (skip_serializing_if = "Vec::is_empty")
        let json = serde_json::to_string(&project).unwrap();

        // The "tags" field should not appear in the output
        assert!(!json.contains("\"tags\""));
    }

    #[test]
    fn test_project_deserialization_with_tags() {
        let json = r#"{
            "version": "1.0.0",
            "metadata": {
                "name": "Tagged Project",
                "description": "A project with tags",
                "createdAt": "2026-01-23T10:00:00Z",
                "modifiedAt": "2026-01-23T11:00:00Z",
                "author": "Test Author",
                "tags": ["feature", "v1.4"]
            },
            "workspace": {},
            "settings": {}
        }"#;

        let project: PrompProject = serde_json::from_str(json).unwrap();

        assert_eq!(project.metadata.tags.len(), 2);
        assert!(project.metadata.tags.contains(&"feature".to_string()));
        assert!(project.metadata.tags.contains(&"v1.4".to_string()));
    }

    #[test]
    fn test_project_deserialization_without_tags() {
        // Old project format without tags field (backward compatibility)
        let json = r#"{
            "version": "1.0.0",
            "metadata": {
                "name": "Old Project",
                "createdAt": "2026-01-23T10:00:00Z",
                "modifiedAt": "2026-01-23T11:00:00Z"
            },
            "workspace": {},
            "settings": {}
        }"#;

        let project: PrompProject = serde_json::from_str(json).unwrap();

        // Tags should default to empty vec
        assert!(project.metadata.tags.is_empty());
    }

    #[test]
    fn test_project_index_entry_serialization() {
        let entry = ProjectIndexEntry {
            path: "/home/user/projects/test.promps".to_string(),
            name: "Test Project".to_string(),
            description: Some("A test project".to_string()),
            tags: vec!["test".to_string(), "demo".to_string()],
            modified_at: "2026-01-23T10:00:00Z".to_string(),
        };

        let json = serde_json::to_string(&entry).unwrap();

        // Verify camelCase serialization
        assert!(json.contains("\"modifiedAt\""));
        assert!(json.contains("\"path\""));
        assert!(json.contains("\"tags\""));
    }

    // Ent: AI Import Hub Tests

    #[test]
    fn test_generate_analysis_prompt_ja() {
        let prompt = generate_analysis_prompt("ユーザーを分析して", "ja");
        assert!(prompt.contains("形態素解析"));
        assert!(prompt.contains("ユーザーを分析して"));
        assert!(prompt.contains("noun"));
        assert!(prompt.contains("particle"));
        assert!(prompt.contains("verb"));
    }

    #[test]
    fn test_generate_analysis_prompt_en() {
        let prompt = generate_analysis_prompt("analyze the document", "en");
        assert!(prompt.contains("Analyze this text"));
        assert!(prompt.contains("analyze the document"));
        assert!(prompt.contains("noun"));
        assert!(prompt.contains("article"));
        assert!(prompt.contains("verb"));
    }

    #[test]
    fn test_parse_tokens_from_response_simple() {
        let json = r#"[{"text": "ユーザー", "type": "noun"}, {"text": "を", "type": "particle"}]"#;
        let tokens = parse_tokens_from_response(json).unwrap();
        assert_eq!(tokens.len(), 2);
        assert_eq!(tokens[0].text, "ユーザー");
        assert_eq!(tokens[0].token_type, "noun");
        assert_eq!(tokens[1].text, "を");
        assert_eq!(tokens[1].token_type, "particle");
    }

    #[test]
    fn test_parse_tokens_from_response_with_codeblock() {
        let content = "Here's the analysis:\n```json\n[{\"text\": \"test\", \"type\": \"noun\"}]\n```";
        let tokens = parse_tokens_from_response(content).unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(tokens[0].text, "test");
    }

    #[test]
    fn test_parse_tokens_from_response_with_explanation() {
        let content = "I analyzed the text and here is the result: [{\"text\": \"hello\", \"type\": \"other\"}]";
        let tokens = parse_tokens_from_response(content).unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(tokens[0].text, "hello");
    }

    #[test]
    fn test_parse_tokens_from_response_invalid() {
        let content = "This is not valid JSON";
        let result = parse_tokens_from_response(content);
        assert!(result.is_err());
    }

    // v1.2.0: Template Export/Import Tests

    #[test]
    fn test_export_template_success() {
        use std::env::temp_dir;

        let template = serde_json::json!({
            "type": "promps-template",
            "version": "1.0.0",
            "exportedAt": "2026-02-04T12:00:00Z",
            "exportedFrom": "Promps Ent v1.2.0",
            "template": {
                "name": "Test Template",
                "description": "A test template",
                "color": 330,
                "icon": "star",
                "category": "default",
                "blocks": {"type": "promps_noun"},
                "blockCount": 1,
                "previewText": "Test"
            }
        });

        let path = temp_dir().join("test_template.promps-template");
        let path_str = path.to_string_lossy().to_string();

        let result = export_template(path_str.clone(), template);

        assert!(result.success);
        assert_eq!(result.path, Some(path_str.clone()));
        assert_eq!(result.message, "Template export successful");

        // Cleanup
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn test_export_template_wrong_extension() {
        let template = serde_json::json!({
            "type": "promps-template",
            "template": {}
        });

        let result = export_template("/tmp/test.json".to_string(), template);

        assert!(!result.success);
        assert!(result.message.contains(".promps-template extension"));
    }

    #[test]
    fn test_import_template_success() {
        use std::env::temp_dir;

        // Create a valid template file
        let template_data = serde_json::json!({
            "type": "promps-template",
            "version": "1.0.0",
            "exportedAt": "2026-02-04T12:00:00Z",
            "template": {
                "name": "Import Test",
                "blocks": {"type": "promps_noun"}
            }
        });

        let path = temp_dir().join("import_test.promps-template");
        let path_str = path.to_string_lossy().to_string();

        // Write the file
        fs::write(&path, serde_json::to_string_pretty(&template_data).unwrap()).unwrap();

        // Test import
        let result = import_template(path_str);

        assert!(result.is_ok());
        let imported = result.unwrap();
        assert_eq!(imported["type"], "promps-template");
        assert_eq!(imported["template"]["name"], "Import Test");

        // Cleanup
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn test_import_template_wrong_extension() {
        let result = import_template("/tmp/test.json".to_string());

        assert!(result.is_err());
        assert!(result.unwrap_err().contains(".promps-template extension"));
    }

    #[test]
    fn test_import_template_file_not_found() {
        let result = import_template("/nonexistent/path/test.promps-template".to_string());

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("File not found"));
    }

    #[test]
    fn test_import_template_invalid_json() {
        use std::env::temp_dir;

        let path = temp_dir().join("invalid.promps-template");
        let path_str = path.to_string_lossy().to_string();

        // Write invalid JSON
        fs::write(&path, "not valid json content").unwrap();

        let result = import_template(path_str);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to parse"));

        // Cleanup
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn test_import_template_invalid_type() {
        use std::env::temp_dir;

        let template_data = serde_json::json!({
            "type": "wrong-type",
            "template": {}
        });

        let path = temp_dir().join("wrong_type.promps-template");
        let path_str = path.to_string_lossy().to_string();

        fs::write(&path, serde_json::to_string(&template_data).unwrap()).unwrap();

        let result = import_template(path_str);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid template file format"));

        // Cleanup
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn test_import_template_missing_template_data() {
        use std::env::temp_dir;

        let template_data = serde_json::json!({
            "type": "promps-template",
            "version": "1.0.0"
        });

        let path = temp_dir().join("no_template.promps-template");
        let path_str = path.to_string_lossy().to_string();

        fs::write(&path, serde_json::to_string(&template_data).unwrap()).unwrap();

        let result = import_template(path_str);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing template data"));

        // Cleanup
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn test_export_import_roundtrip() {
        use std::env::temp_dir;

        // Create original template
        let original_template = serde_json::json!({
            "type": "promps-template",
            "version": "1.0.0",
            "exportedAt": "2026-02-04T12:00:00Z",
            "exportedFrom": "Promps Ent v1.2.0",
            "template": {
                "name": "Roundtrip Test",
                "description": "Testing export and import",
                "color": 230,
                "icon": "rocket",
                "category": "favorites",
                "blocks": {
                    "type": "promps_noun",
                    "fields": {"TEXT": "Test"}
                },
                "blockCount": 1,
                "previewText": "Test"
            }
        });

        let path = temp_dir().join("roundtrip.promps-template");
        let path_str = path.to_string_lossy().to_string();

        // Export
        let export_result = export_template(path_str.clone(), original_template.clone());
        assert!(export_result.success);

        // Import
        let import_result = import_template(path_str);
        assert!(import_result.is_ok());

        let imported = import_result.unwrap();

        // Verify data integrity
        assert_eq!(imported["type"], "promps-template");
        assert_eq!(imported["template"]["name"], "Roundtrip Test");
        assert_eq!(imported["template"]["color"], 230);
        assert_eq!(imported["template"]["icon"], "rocket");
        assert_eq!(imported["template"]["category"], "favorites");

        // Cleanup
        let _ = fs::remove_file(&path);
    }

    // Ent: AI Compare Tests

    #[test]
    fn test_ai_compare_request_deserialization() {
        let json = r#"{"provider": "openai", "model": "gpt-4o"}"#;
        let req: AiCompareRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.provider, "openai");
        assert_eq!(req.model, Some("gpt-4o".to_string()));
    }

    #[test]
    fn test_ai_compare_request_without_model() {
        let json = r#"{"provider": "anthropic"}"#;
        let req: AiCompareRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.provider, "anthropic");
        assert!(req.model.is_none());
    }

    #[test]
    fn test_ai_compare_result_serialization() {
        let result = AiCompareResult {
            provider: "OpenAI".to_string(),
            model: "gpt-4o".to_string(),
            success: true,
            content: Some("Hello world".to_string()),
            error: None,
            elapsed_ms: 1234,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"provider\":\"OpenAI\""));
        assert!(json.contains("\"elapsedMs\":1234"));
        assert!(json.contains("\"success\":true"));
    }

    #[test]
    fn test_ai_compare_response_serialization() {
        let response = AiCompareResponse {
            results: vec![
                AiCompareResult {
                    provider: "OpenAI".to_string(),
                    model: "gpt-4o".to_string(),
                    success: true,
                    content: Some("Response 1".to_string()),
                    error: None,
                    elapsed_ms: 500,
                },
                AiCompareResult {
                    provider: "Anthropic".to_string(),
                    model: "claude-sonnet-4-20250514".to_string(),
                    success: true,
                    content: Some("Response 2".to_string()),
                    error: None,
                    elapsed_ms: 800,
                },
            ],
            prompt: "Test prompt".to_string(),
            total_elapsed_ms: 800,
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"totalElapsedMs\":800"));
        assert!(json.contains("\"prompt\":\"Test prompt\""));
        assert!(json.contains("\"results\""));
    }

    #[test]
    fn test_ai_compare_result_error() {
        let result = AiCompareResult {
            provider: "Google AI".to_string(),
            model: String::new(),
            success: false,
            content: None,
            error: Some("No API key set".to_string()),
            elapsed_ms: 1,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"success\":false"));
        assert!(json.contains("No API key set"));
    }
}
