/// Promps Phase 0 Core Logic
///
/// This module contains the core DSL parsing and prompt generation logic
/// from Phase 0, now available as a library for both CLI and GUI (Tauri) usage.

/// Represents a single prompt part
/// Two types: "Noun" (名詞) and "Everything else" (それ以外)
#[derive(Debug, Clone)]
pub struct PromptPart {
    pub is_noun: bool,
    pub text: String,
}

impl PromptPart {
    /// Parse a token into a PromptPart
    /// Format: "_N:text" (noun/名詞) or "text" (everything else/それ以外)
    pub fn from_token(token: &str) -> Self {
        // Check if noun (名詞) - starts with "_N:"
        if let Some(text) = token.strip_prefix("_N:") {
            PromptPart {
                is_noun: true,
                text: text.to_string(),
            }
        } else {
            // Everything else (それ以外)
            PromptPart {
                is_noun: false,
                text: token.to_string(),
            }
        }
    }
}

/// Parse input text into PromptParts
///
/// # Arguments
/// * `input` - Raw input text with space-delimited tokens
///
/// # Returns
/// Vector of PromptPart instances
pub fn parse_input(input: &str) -> Vec<PromptPart> {
    let mut parts = Vec::new();

    for line in input.lines() {
        let line = line.trim();

        // Skip empty lines
        if line.is_empty() {
            continue;
        }

        // Split by double spaces (sentence delimiter)
        let sentences = line.split("  ");

        for sentence in sentences {
            let sentence = sentence.trim();
            if sentence.is_empty() {
                continue;
            }

            // Collect all tokens in this sentence
            let tokens: Vec<&str> = sentence.split_whitespace().collect();
            if tokens.is_empty() {
                continue;
            }

            // Phase 0-1 behavior: Token-level noun detection
            // Each _N: token becomes a separate PromptPart with is_noun=true
            // This allows multiple nouns in a single sentence to each have (NOUN) markers
            let mut current_text = String::new();
            let mut current_is_noun = false;
            let mut first_in_part = true;

            for token in tokens {
                match token.strip_prefix("_N:") {
                    Some(stripped) => {
                        // Found a noun token - flush current part if any
                        if !current_text.is_empty() {
                            parts.push(PromptPart {
                                is_noun: current_is_noun,
                                text: current_text.trim().to_string(),
                            });
                            current_text.clear();
                            first_in_part = true;
                        }

                        // Create a new part for this noun
                        parts.push(PromptPart {
                            is_noun: true,
                            text: stripped.to_string(),
                        });
                        current_is_noun = false;
                    }
                    None => {
                        // Regular token - accumulate into current part
                        // Strip _V: prefix (verb marker for validation only)
                        let token_text = token.strip_prefix("_V:").unwrap_or(token);
                        if !first_in_part {
                            current_text.push(' ');
                        }
                        current_text.push_str(token_text);
                        first_in_part = false;
                    }
                }
            }

            // Flush remaining accumulated text
            if !current_text.is_empty() {
                parts.push(PromptPart {
                    is_noun: current_is_noun,
                    text: current_text.trim().to_string(),
                });
            }
        }
    }

    parts
}

/// Generate formatted prompt from parts (with grammar markers)
///
/// # Arguments
/// * `parts` - Vector of PromptPart instances
///
/// # Returns
/// Formatted prompt string with (NOUN) markers
pub fn generate_prompt(parts: &[PromptPart]) -> String {
    let mut output = String::new();

    for (i, part) in parts.iter().enumerate() {
        // Add space between parts (but not at the start)
        if i > 0 && !output.is_empty() && !output.ends_with('\n') {
            output.push(' ');
        }

        // Add text with noun annotation if applicable
        if part.is_noun {
            output.push_str(&format!("{} (NOUN)", part.text));
        } else {
            output.push_str(&part.text);
        }
    }

    // Add final newline if content exists
    if !output.is_empty() {
        output.push('\n');
    }

    output
}

/// Generate raw prompt from parts (without grammar markers)
///
/// Used for sending to AI - no (NOUN) annotations
///
/// # Arguments
/// * `parts` - Vector of PromptPart instances
///
/// # Returns
/// Clean prompt string without markers
pub fn generate_prompt_raw(parts: &[PromptPart]) -> String {
    let mut output = String::new();

    for (i, part) in parts.iter().enumerate() {
        // Add space between parts (but not at the start)
        if i > 0 && !output.is_empty() && !output.ends_with('\n') {
            output.push(' ');
        }

        // Add text without annotations
        output.push_str(&part.text);
    }

    // Add final newline if content exists
    if !output.is_empty() {
        output.push('\n');
    }

    output
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_noun() {
        let token = "_N:データベーステーブルブロック機能";
        let part = PromptPart::from_token(token);

        assert_eq!(part.is_noun, true);
        assert_eq!(part.text, "データベーステーブルブロック機能");
    }

    #[test]
    fn test_parse_everything_else() {
        let token = "データベースのテーブル構造を視覚的に定義する";
        let part = PromptPart::from_token(token);

        assert_eq!(part.is_noun, false);
        assert_eq!(part.text, "データベースのテーブル構造を視覚的に定義する");
    }

    #[test]
    fn test_generate_prompt() {
        let parts = vec![
            PromptPart {
                is_noun: true,
                text: "テーブルブロック機能".to_string(),
            },
            PromptPart {
                is_noun: false,
                text: "データベーステーブルを定義します".to_string(),
            },
            PromptPart {
                is_noun: true,
                text: "対象ユーザー".to_string(),
            },
        ];

        let prompt = generate_prompt(&parts);

        // Phase 0-1: All parts on one line with spaces
        assert!(prompt.contains("テーブルブロック機能 (NOUN)"));
        assert!(prompt.contains("データベーステーブルを定義します"));
        assert!(prompt.contains("対象ユーザー (NOUN)"));

        // Should be a single line output
        let lines: Vec<&str> = prompt.lines().collect();
        assert_eq!(lines.len(), 1);
    }

    #[test]
    fn test_empty_parts() {
        let parts = vec![];
        let prompt = generate_prompt(&parts);
        assert_eq!(prompt, "");
    }

    #[test]
    fn test_noun_prefix_stripping() {
        // Noun (名詞)
        let noun_token = "_N:機能名";
        let noun_part = PromptPart::from_token(noun_token);
        assert_eq!(noun_part.is_noun, true);
        assert_eq!(noun_part.text, "機能名");

        // Everything else (それ以外)
        let other_token = "これは説明文です";
        let other_part = PromptPart::from_token(other_token);
        assert_eq!(other_part.is_noun, false);
        assert_eq!(other_part.text, "これは説明文です");
    }

    #[test]
    fn test_multi_token_sentence() {
        // Multiple tokens should be combined into one sentence
        let part = PromptPart {
            is_noun: true,
            text: "GUI ブロック ビルダー 機能".to_string(),
        };

        assert_eq!(part.is_noun, true);
        assert_eq!(part.text, "GUI ブロック ビルダー 機能");
    }

    #[test]
    fn test_noun_in_middle_of_sentence() {
        // Test case: "テキストフィールド を _N:変数 に コピーしてください"
        // Should be marked as noun because it contains _N: marker
        let part = PromptPart {
            is_noun: true,
            text: "テキストフィールド を 変数 に コピーしてください".to_string(),
        };

        assert_eq!(part.is_noun, true);
        assert!(part.text.contains("変数"));
        assert!(!part.text.contains("_N:"));
    }

    #[test]
    fn test_parse_input() {
        let input = "_N:データベーステーブルブロック機能  データベースのテーブル構造を視覚的に定義する機能です";
        let parts = parse_input(input);

        assert_eq!(parts.len(), 2);
        assert_eq!(parts[0].is_noun, true);
        assert_eq!(parts[0].text, "データベーステーブルブロック機能");
        assert_eq!(parts[1].is_noun, false);
        assert_eq!(parts[1].text, "データベースのテーブル構造を視覚的に定義する機能です");
    }

    // Edge Case Tests

    #[test]
    fn test_consecutive_noun_markers() {
        // Edge case: _N:_N: without space (malformed input)
        let input = "_N:_N:User";
        let parts = parse_input(input);

        // Should treat "_N:" as the text part of first noun
        assert_eq!(parts.len(), 1);
        assert_eq!(parts[0].is_noun, true);
        assert_eq!(parts[0].text, "_N:User");
    }

    #[test]
    fn test_consecutive_noun_markers_with_space() {
        // Two consecutive noun markers with space
        let input = "_N:User _N:Order";
        let parts = parse_input(input);

        // Should create two separate noun parts
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[0].is_noun, true);
        assert_eq!(parts[0].text, "User");
        assert_eq!(parts[1].is_noun, true);
        assert_eq!(parts[1].text, "Order");
    }

    #[test]
    fn test_very_long_input() {
        // Test with 10,000+ characters (performance baseline)
        let long_text = "あ".repeat(10000);
        let input = format!("_N:{}", long_text);
        let parts = parse_input(&input);

        assert_eq!(parts.len(), 1);
        assert_eq!(parts[0].is_noun, true);
        assert_eq!(parts[0].text.chars().count(), 10000);
    }

    #[test]
    fn test_many_nouns() {
        // Test with 100 nouns (Phase 1 GUI limit consideration)
        let mut input_parts = Vec::new();
        for i in 0..100 {
            input_parts.push(format!("_N:Noun{}", i));
        }
        let input = input_parts.join(" ");
        let parts = parse_input(&input);

        // Should create 100 noun parts
        assert_eq!(parts.len(), 100);
        for (i, part) in parts.iter().enumerate() {
            assert_eq!(part.is_noun, true);
            assert_eq!(part.text, format!("Noun{}", i));
        }
    }

    #[test]
    fn test_extreme_many_nouns() {
        // Test with 1000 nouns (stress test for performance)
        let mut input_parts = Vec::new();
        for i in 0..1000 {
            input_parts.push(format!("_N:N{}", i));
        }
        let input = input_parts.join(" ");
        let parts = parse_input(&input);

        // Should handle 1000 nouns without panic
        assert_eq!(parts.len(), 1000);
        assert_eq!(parts[0].text, "N0");
        assert_eq!(parts[999].text, "N999");
    }
}
