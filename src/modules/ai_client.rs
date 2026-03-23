//! AI Client Module
//!
//! Provides a unified interface for sending prompts to various AI providers.
//! Supports OpenAI, Anthropic, and Google AI.

use serde::{Deserialize, Serialize};

/// AI Provider selection
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AiProviderType {
    OpenAI,
    Anthropic,
    Google,
}

impl AiProviderType {
    /// Get the display name for this provider
    pub fn display_name(&self) -> &str {
        match self {
            AiProviderType::OpenAI => "OpenAI",
            AiProviderType::Anthropic => "Anthropic",
            AiProviderType::Google => "Google AI",
        }
    }

    /// Get the default model for this provider
    pub fn default_model(&self) -> &str {
        match self {
            AiProviderType::OpenAI => "gpt-4o-mini",
            AiProviderType::Anthropic => "claude-sonnet-4-20250514",
            AiProviderType::Google => "gemini-2.5-flash",
        }
    }
}

/// Request to send to AI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiRequest {
    pub provider: AiProviderType,
    pub prompt: String,
    pub model: Option<String>,
    pub max_tokens: Option<u32>,
}

/// Response from AI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiResponse {
    pub success: bool,
    pub content: Option<String>,
    pub error: Option<String>,
    pub model: String,
    pub provider: String,
}

// ============================================================================
// Ent: Morpheme Analysis (AI Import Hub)
// ============================================================================

/// Single morpheme token from AI analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MorphemeToken {
    pub text: String,
    #[serde(rename = "type")]
    pub token_type: String,  // "noun", "particle", "verb", "article", "other"
}

/// Response from morpheme analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResponse {
    pub success: bool,
    pub tokens: Option<Vec<MorphemeToken>>,
    pub error: Option<String>,
    pub provider: String,
}

impl AnalysisResponse {
    /// Create a successful analysis response
    pub fn success(tokens: Vec<MorphemeToken>, provider: &str) -> Self {
        Self {
            success: true,
            tokens: Some(tokens),
            error: None,
            provider: provider.to_string(),
        }
    }

    /// Create an error analysis response
    pub fn error(message: &str, provider: &str) -> Self {
        Self {
            success: false,
            tokens: None,
            error: Some(message.to_string()),
            provider: provider.to_string(),
        }
    }
}

impl AiResponse {
    pub fn success(content: String, model: &str, provider: &str) -> Self {
        Self {
            success: true,
            content: Some(content),
            error: None,
            model: model.to_string(),
            provider: provider.to_string(),
        }
    }

    pub fn error(message: &str, provider: &str) -> Self {
        Self {
            success: false,
            content: None,
            error: Some(message.to_string()),
            model: String::new(),
            provider: provider.to_string(),
        }
    }
}

// ============================================================================
// OpenAI API
// ============================================================================

#[derive(Debug, Serialize)]
struct OpenAiRequest {
    model: String,
    messages: Vec<OpenAiMessage>,
    max_tokens: Option<u32>,
}

#[derive(Debug, Serialize)]
struct OpenAiMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAiResponse {
    choices: Vec<OpenAiChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoice {
    message: OpenAiMessageResponse,
}

#[derive(Debug, Deserialize)]
struct OpenAiMessageResponse {
    content: String,
}

/// Send a prompt to OpenAI API
pub async fn send_to_openai(
    api_key: &str,
    prompt: &str,
    model: &str,
    max_tokens: Option<u32>,
) -> AiResponse {
    let client = reqwest::Client::new();

    let request = OpenAiRequest {
        model: model.to_string(),
        messages: vec![OpenAiMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        }],
        max_tokens,
    };

    match client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<OpenAiResponse>().await {
                    Ok(data) => {
                        if let Some(choice) = data.choices.first() {
                            AiResponse::success(choice.message.content.clone(), model, "OpenAI")
                        } else {
                            AiResponse::error("No response from OpenAI", "OpenAI")
                        }
                    }
                    Err(e) => AiResponse::error(&format!("Failed to parse response: {}", e), "OpenAI"),
                }
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                AiResponse::error(&format!("API error ({}): {}", status, error_text), "OpenAI")
            }
        }
        Err(e) => AiResponse::error(&format!("Request failed: {}", e), "OpenAI"),
    }
}

// ============================================================================
// Anthropic API
// ============================================================================

#[derive(Debug, Serialize)]
struct AnthropicRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<AnthropicMessage>,
}

#[derive(Debug, Serialize)]
struct AnthropicMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct AnthropicResponse {
    content: Vec<AnthropicContent>,
}

#[derive(Debug, Deserialize)]
struct AnthropicContent {
    text: String,
}

/// Send a prompt to Anthropic API
pub async fn send_to_anthropic(
    api_key: &str,
    prompt: &str,
    model: &str,
    max_tokens: Option<u32>,
) -> AiResponse {
    let client = reqwest::Client::new();

    let request = AnthropicRequest {
        model: model.to_string(),
        max_tokens: max_tokens.unwrap_or(4096),
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        }],
    };

    match client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<AnthropicResponse>().await {
                    Ok(data) => {
                        if let Some(content) = data.content.first() {
                            AiResponse::success(content.text.clone(), model, "Anthropic")
                        } else {
                            AiResponse::error("No response from Anthropic", "Anthropic")
                        }
                    }
                    Err(e) => AiResponse::error(&format!("Failed to parse response: {}", e), "Anthropic"),
                }
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                AiResponse::error(&format!("API error ({}): {}", status, error_text), "Anthropic")
            }
        }
        Err(e) => AiResponse::error(&format!("Request failed: {}", e), "Anthropic"),
    }
}

// ============================================================================
// Google AI (Gemini) API
// ============================================================================

#[derive(Debug, Serialize)]
struct GoogleRequest {
    contents: Vec<GoogleContent>,
}

#[derive(Debug, Serialize)]
struct GoogleContent {
    parts: Vec<GooglePart>,
}

#[derive(Debug, Serialize)]
struct GooglePart {
    text: String,
}

#[derive(Debug, Deserialize)]
struct GoogleResponse {
    candidates: Vec<GoogleCandidate>,
}

#[derive(Debug, Deserialize)]
struct GoogleCandidate {
    content: GoogleContentResponse,
}

#[derive(Debug, Deserialize)]
struct GoogleContentResponse {
    parts: Vec<GooglePartResponse>,
}

#[derive(Debug, Deserialize)]
struct GooglePartResponse {
    text: String,
}

/// Send a prompt to Google AI (Gemini) API
pub async fn send_to_google(
    api_key: &str,
    prompt: &str,
    model: &str,
    _max_tokens: Option<u32>,
) -> AiResponse {
    let client = reqwest::Client::new();

    let request = GoogleRequest {
        contents: vec![GoogleContent {
            parts: vec![GooglePart {
                text: prompt.to_string(),
            }],
        }],
    };

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    match client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<GoogleResponse>().await {
                    Ok(data) => {
                        if let Some(candidate) = data.candidates.first() {
                            if let Some(part) = candidate.content.parts.first() {
                                return AiResponse::success(part.text.clone(), model, "Google AI");
                            }
                        }
                        AiResponse::error("No response from Google AI", "Google AI")
                    }
                    Err(e) => AiResponse::error(&format!("Failed to parse response: {}", e), "Google AI"),
                }
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_default();
                AiResponse::error(&format!("API error ({}): {}", status, error_text), "Google AI")
            }
        }
        Err(e) => AiResponse::error(&format!("Request failed: {}", e), "Google AI"),
    }
}

// ============================================================================
// Unified Interface
// ============================================================================

/// Send a prompt to the specified AI provider
pub async fn send_prompt(request: AiRequest, api_key: &str) -> AiResponse {
    let model = request
        .model
        .unwrap_or_else(|| request.provider.default_model().to_string());

    match request.provider {
        AiProviderType::OpenAI => {
            send_to_openai(api_key, &request.prompt, &model, request.max_tokens).await
        }
        AiProviderType::Anthropic => {
            send_to_anthropic(api_key, &request.prompt, &model, request.max_tokens).await
        }
        AiProviderType::Google => {
            send_to_google(api_key, &request.prompt, &model, request.max_tokens).await
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_display_name() {
        assert_eq!(AiProviderType::OpenAI.display_name(), "OpenAI");
        assert_eq!(AiProviderType::Anthropic.display_name(), "Anthropic");
        assert_eq!(AiProviderType::Google.display_name(), "Google AI");
    }

    #[test]
    fn test_provider_default_model() {
        assert_eq!(AiProviderType::OpenAI.default_model(), "gpt-4o-mini");
        assert_eq!(AiProviderType::Anthropic.default_model(), "claude-sonnet-4-20250514");
        assert_eq!(AiProviderType::Google.default_model(), "gemini-2.5-flash");
    }

    #[test]
    fn test_ai_response_success() {
        let response = AiResponse::success("Hello".to_string(), "gpt-4", "OpenAI");
        assert!(response.success);
        assert_eq!(response.content, Some("Hello".to_string()));
        assert!(response.error.is_none());
    }

    #[test]
    fn test_ai_response_error() {
        let response = AiResponse::error("API key invalid", "OpenAI");
        assert!(!response.success);
        assert!(response.content.is_none());
        assert_eq!(response.error, Some("API key invalid".to_string()));
    }

    // Ent: Morpheme Analysis Tests

    #[test]
    fn test_morpheme_token_serialization() {
        let token = MorphemeToken {
            text: "ユーザー".to_string(),
            token_type: "noun".to_string(),
        };
        let json = serde_json::to_string(&token).unwrap();
        assert!(json.contains("\"text\":\"ユーザー\""));
        assert!(json.contains("\"type\":\"noun\""));
    }

    #[test]
    fn test_morpheme_token_deserialization() {
        let json = r#"{"text": "分析して", "type": "verb"}"#;
        let token: MorphemeToken = serde_json::from_str(json).unwrap();
        assert_eq!(token.text, "分析して");
        assert_eq!(token.token_type, "verb");
    }

    #[test]
    fn test_analysis_response_success() {
        let tokens = vec![
            MorphemeToken {
                text: "ユーザー".to_string(),
                token_type: "noun".to_string(),
            },
            MorphemeToken {
                text: "を".to_string(),
                token_type: "particle".to_string(),
            },
        ];
        let response = AnalysisResponse::success(tokens, "OpenAI");
        assert!(response.success);
        assert!(response.tokens.is_some());
        assert_eq!(response.tokens.as_ref().unwrap().len(), 2);
        assert!(response.error.is_none());
        assert_eq!(response.provider, "OpenAI");
    }

    #[test]
    fn test_analysis_response_error() {
        let response = AnalysisResponse::error("Failed to parse JSON", "Anthropic");
        assert!(!response.success);
        assert!(response.tokens.is_none());
        assert_eq!(response.error, Some("Failed to parse JSON".to_string()));
        assert_eq!(response.provider, "Anthropic");
    }
}
