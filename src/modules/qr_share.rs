/// QR Code Sharing Module for Promps Ent
///
/// Provides QR code generation and decoding for sharing prompt DSL data.
/// Uses flate2 compression to fit data within QR Version 40 limits (~2,953 bytes).

use base64::Engine;
use flate2::read::DeflateDecoder;
use flate2::write::DeflateEncoder;
use flate2::Compression;
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};

/// Maximum bytes for QR Version 40 binary mode
const QR_MAX_BYTES: usize = 2953;

/// QR prompt data structure for sharing
///
/// v1: `dsl` field contains DSL text (legacy, cannot reconstruct blocks)
/// v2: `ws` field contains Blockly workspace state JSON
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QrPromptData {
    /// Data format version (1 = DSL text, 2 = workspace state)
    pub v: u8,
    /// Project name
    pub name: String,
    /// DSL text (v1 legacy, kept for backward compat)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dsl: Option<String>,
    /// Blockly workspace state JSON string (v2)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ws: Option<String>,
    /// Locale code (ja, en, fr)
    pub locale: String,
}

/// Result of QR code generation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QrGenerateResult {
    /// Whether generation was successful
    pub success: bool,
    /// Base64-encoded PNG image data (data:image/png;base64,...)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_data: Option<String>,
    /// Error message if generation failed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    /// Size of the compressed data in bytes
    #[serde(default)]
    pub data_size: usize,
}

/// Result of QR code decoding
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QrDecodeResult {
    /// Whether decoding was successful
    pub success: bool,
    /// Decoded prompt data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<QrPromptData>,
    /// Error message if decoding failed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Compress data using DEFLATE
fn compress_data(data: &[u8]) -> Result<Vec<u8>, String> {
    let mut encoder = DeflateEncoder::new(Vec::new(), Compression::best());
    encoder
        .write_all(data)
        .map_err(|e| format!("Compression write failed: {}", e))?;
    encoder
        .finish()
        .map_err(|e| format!("Compression finish failed: {}", e))
}

/// Decompress DEFLATE data
fn decompress_data(data: &[u8]) -> Result<Vec<u8>, String> {
    let mut decoder = DeflateDecoder::new(data);
    let mut result = Vec::new();
    decoder
        .read_to_end(&mut result)
        .map_err(|e| format!("Decompression failed: {}", e))?;
    Ok(result)
}

/// Generate a QR code PNG image as base64 from prompt data
///
/// # Arguments
/// * `name` - Project name
/// * `workspace_state` - Blockly workspace state JSON string
/// * `locale` - Locale code
///
/// # Returns
/// QrGenerateResult with base64 PNG data or error
pub fn generate_qr_from_prompt(name: &str, workspace_state: &str, locale: &str) -> QrGenerateResult {
    let prompt_data = QrPromptData {
        v: 2,
        name: name.to_string(),
        dsl: None,
        ws: Some(workspace_state.to_string()),
        locale: locale.to_string(),
    };

    // Serialize to JSON
    let json = match serde_json::to_string(&prompt_data) {
        Ok(j) => j,
        Err(e) => {
            return QrGenerateResult {
                success: false,
                image_data: None,
                error: Some(format!("Failed to serialize data: {}", e)),
                data_size: 0,
            }
        }
    };

    // Compress
    let compressed = match compress_data(json.as_bytes()) {
        Ok(c) => c,
        Err(e) => {
            return QrGenerateResult {
                success: false,
                image_data: None,
                error: Some(e),
                data_size: 0,
            }
        }
    };

    let data_size = compressed.len();

    // Check QR capacity
    if data_size > QR_MAX_BYTES {
        return QrGenerateResult {
            success: false,
            image_data: None,
            error: Some(format!(
                "Data too large for QR code: {} bytes (max: {} bytes). Simplify your prompt.",
                data_size, QR_MAX_BYTES
            )),
            data_size,
        };
    }

    // Encode as base64 for QR storage
    let b64 = base64::engine::general_purpose::STANDARD.encode(&compressed);

    // Generate QR code
    let qr = match qrcode::QrCode::new(b64.as_bytes()) {
        Ok(q) => q,
        Err(e) => {
            return QrGenerateResult {
                success: false,
                image_data: None,
                error: Some(format!("QR generation failed: {}", e)),
                data_size,
            }
        }
    };

    // Render to image
    let image = qr.render::<image::Luma<u8>>().quiet_zone(true).build();

    // Encode to PNG bytes
    let mut png_bytes: Vec<u8> = Vec::new();
    {
        use image::ImageEncoder;
        let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
        match encoder.write_image(
            image.as_raw(),
            image.width(),
            image.height(),
            image::ExtendedColorType::L8,
        ) {
            Ok(()) => {}
            Err(e) => {
                return QrGenerateResult {
                    success: false,
                    image_data: None,
                    error: Some(format!("PNG encoding failed: {}", e)),
                    data_size,
                }
            }
        }
    }

    // Convert to data URI
    let b64_png = base64::engine::general_purpose::STANDARD.encode(&png_bytes);
    let data_uri = format!("data:image/png;base64,{}", b64_png);

    QrGenerateResult {
        success: true,
        image_data: Some(data_uri),
        error: None,
        data_size,
    }
}

/// Save QR code PNG to a file
///
/// # Arguments
/// * `name` - Project name
/// * `workspace_state` - Blockly workspace state JSON string
/// * `locale` - Locale code
/// * `path` - File path to save to
///
/// # Returns
/// QrGenerateResult with success/error
pub fn save_qr_to_file(name: &str, workspace_state: &str, locale: &str, path: &str) -> QrGenerateResult {
    let prompt_data = QrPromptData {
        v: 2,
        name: name.to_string(),
        dsl: None,
        ws: Some(workspace_state.to_string()),
        locale: locale.to_string(),
    };

    // Serialize to JSON
    let json = match serde_json::to_string(&prompt_data) {
        Ok(j) => j,
        Err(e) => {
            return QrGenerateResult {
                success: false,
                image_data: None,
                error: Some(format!("Failed to serialize data: {}", e)),
                data_size: 0,
            }
        }
    };

    // Compress
    let compressed = match compress_data(json.as_bytes()) {
        Ok(c) => c,
        Err(e) => {
            return QrGenerateResult {
                success: false,
                image_data: None,
                error: Some(e),
                data_size: 0,
            }
        }
    };

    let data_size = compressed.len();

    if data_size > QR_MAX_BYTES {
        return QrGenerateResult {
            success: false,
            image_data: None,
            error: Some(format!(
                "Data too large for QR code: {} bytes (max: {} bytes)",
                data_size, QR_MAX_BYTES
            )),
            data_size,
        };
    }

    let b64 = base64::engine::general_purpose::STANDARD.encode(&compressed);

    let qr = match qrcode::QrCode::new(b64.as_bytes()) {
        Ok(q) => q,
        Err(e) => {
            return QrGenerateResult {
                success: false,
                image_data: None,
                error: Some(format!("QR generation failed: {}", e)),
                data_size,
            }
        }
    };

    let image = qr.render::<image::Luma<u8>>().quiet_zone(true).build();

    match image.save(path) {
        Ok(()) => QrGenerateResult {
            success: true,
            image_data: None,
            error: None,
            data_size,
        },
        Err(e) => QrGenerateResult {
            success: false,
            image_data: None,
            error: Some(format!("Failed to save PNG: {}", e)),
            data_size,
        },
    }
}

/// Decode a QR code from a PNG image file
///
/// # Arguments
/// * `path` - Path to the PNG image file
///
/// # Returns
/// QrDecodeResult with decoded prompt data or error
pub fn decode_qr_from_file(path: &str) -> QrDecodeResult {
    // Load image
    let img = match image::open(path) {
        Ok(i) => i,
        Err(e) => {
            return QrDecodeResult {
                success: false,
                data: None,
                error: Some(format!("Failed to open image: {}", e)),
            }
        }
    };

    let gray = img.to_luma8();

    // Prepare image for rqrr
    let mut prepared = rqrr::PreparedImage::prepare(gray);
    let grids = prepared.detect_grids();

    if grids.is_empty() {
        return QrDecodeResult {
            success: false,
            data: None,
            error: Some("No QR code found in image".to_string()),
        };
    }

    // Decode the first QR code found
    let (_, content) = match grids[0].decode() {
        Ok(result) => result,
        Err(e) => {
            return QrDecodeResult {
                success: false,
                data: None,
                error: Some(format!("QR decode failed: {}", e)),
            }
        }
    };

    // Decode base64
    let compressed = match base64::engine::general_purpose::STANDARD.decode(&content) {
        Ok(c) => c,
        Err(e) => {
            return QrDecodeResult {
                success: false,
                data: None,
                error: Some(format!("Base64 decode failed: {}", e)),
            }
        }
    };

    // Decompress
    let json_bytes = match decompress_data(&compressed) {
        Ok(d) => d,
        Err(e) => {
            return QrDecodeResult {
                success: false,
                data: None,
                error: Some(e),
            }
        }
    };

    // Parse JSON
    let json_str = match std::str::from_utf8(&json_bytes) {
        Ok(s) => s,
        Err(e) => {
            return QrDecodeResult {
                success: false,
                data: None,
                error: Some(format!("Invalid UTF-8: {}", e)),
            }
        }
    };

    let prompt_data: QrPromptData = match serde_json::from_str(json_str) {
        Ok(d) => d,
        Err(e) => {
            return QrDecodeResult {
                success: false,
                data: None,
                error: Some(format!("Invalid QR data format: {}", e)),
            }
        }
    };

    QrDecodeResult {
        success: true,
        data: Some(prompt_data),
        error: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compress_decompress_roundtrip() {
        let data = b"Hello, World! This is a test of compression.";
        let compressed = compress_data(data).unwrap();
        let decompressed = decompress_data(&compressed).unwrap();
        assert_eq!(data.to_vec(), decompressed);
    }

    #[test]
    fn test_compress_decompress_unicode() {
        let data = "ユーザー が ドキュメント を 分析して".as_bytes();
        let compressed = compress_data(data).unwrap();
        let decompressed = decompress_data(&compressed).unwrap();
        assert_eq!(data.to_vec(), decompressed);
    }

    #[test]
    fn test_compress_decompress_french() {
        let data = "Veuillez analyser le document résumé".as_bytes();
        let compressed = compress_data(data).unwrap();
        let decompressed = decompress_data(&compressed).unwrap();
        assert_eq!(data.to_vec(), decompressed);
    }

    #[test]
    fn test_generate_qr_simple() {
        let ws = r#"{"blocks":{"blocks":[{"type":"noun_block","fields":{"TEXT":"User"}}]}}"#;
        let result = generate_qr_from_prompt("Test", ws, "ja");
        assert!(result.success);
        assert!(result.image_data.is_some());
        assert!(result.image_data.unwrap().starts_with("data:image/png;base64,"));
        assert!(result.data_size > 0);
    }

    #[test]
    fn test_generate_qr_english() {
        let ws = r#"{"blocks":{"blocks":[{"type":"noun_block","fields":{"TEXT":"document"}}]}}"#;
        let result = generate_qr_from_prompt("Test", ws, "en");
        assert!(result.success);
        assert!(result.image_data.is_some());
    }

    #[test]
    fn test_generate_qr_french() {
        let ws = r#"{"blocks":{"blocks":[{"type":"noun_block","fields":{"TEXT":"document"}}]}}"#;
        let result = generate_qr_from_prompt("Test", ws, "fr");
        assert!(result.success);
        assert!(result.image_data.is_some());
    }

    #[test]
    fn test_generate_qr_empty_workspace() {
        let result = generate_qr_from_prompt("Empty", "{}", "ja");
        assert!(result.success);
        assert!(result.image_data.is_some());
    }

    #[test]
    fn test_generate_qr_capacity_check() {
        // Create a large workspace state that won't compress well
        let mut large_ws = String::from(r#"{"blocks":{"blocks":["#);
        for i in 0..3000 {
            if i > 0 { large_ws.push(','); }
            large_ws.push_str(&format!(r#"{{"type":"noun_{:04x}","fields":{{"TEXT":"N{:04x}"}}}}"#, i, i));
        }
        large_ws.push_str("]}}");
        let result = generate_qr_from_prompt("Large", &large_ws, "ja");
        assert!(!result.success, "Expected failure for large data, got success with data_size={}", result.data_size);
        assert!(result.error.is_some());
        assert!(result.error.unwrap().contains("too large"));
    }

    #[test]
    fn test_qr_save_and_decode_roundtrip() {
        let temp_dir = std::env::temp_dir();
        let temp_file = temp_dir.join("promps_qr_test.png");
        let path = temp_file.to_string_lossy().to_string();

        let name = "Roundtrip Test";
        let ws = r#"{"blocks":{"blocks":[{"type":"noun_block","fields":{"TEXT":"ユーザー"}}]}}"#;
        let locale = "ja";

        // Save QR
        let save_result = save_qr_to_file(name, ws, locale, &path);
        assert!(save_result.success, "Save failed: {:?}", save_result.error);

        // Decode QR
        let decode_result = decode_qr_from_file(&path);
        assert!(
            decode_result.success,
            "Decode failed: {:?}",
            decode_result.error
        );

        let data = decode_result.data.unwrap();
        assert_eq!(data.v, 2);
        assert_eq!(data.name, name);
        assert_eq!(data.ws.as_deref(), Some(ws));
        assert_eq!(data.locale, locale);

        // Cleanup
        let _ = std::fs::remove_file(&temp_file);
    }

    #[test]
    fn test_decode_qr_nonexistent_file() {
        let result = decode_qr_from_file("/nonexistent/qr.png");
        assert!(!result.success);
        assert!(result.error.is_some());
        assert!(result.error.unwrap().contains("Failed to open"));
    }

    #[test]
    fn test_qr_prompt_data_v2_serialization() {
        let data = QrPromptData {
            v: 2,
            name: "Test".to_string(),
            dsl: None,
            ws: Some(r#"{"blocks":{}}"#.to_string()),
            locale: "en".to_string(),
        };

        let json = serde_json::to_string(&data).unwrap();
        assert!(json.contains("\"v\":2"));
        assert!(json.contains("\"name\":\"Test\""));
        assert!(json.contains("\"ws\":"));
        assert!(!json.contains("\"dsl\""));
        assert!(json.contains("\"locale\":\"en\""));
    }

    #[test]
    fn test_qr_prompt_data_v1_deserialization() {
        // v1 format (legacy) should still deserialize
        let json = r#"{"v":1,"name":"Import","dsl":"_N:Data を 分析して","locale":"ja"}"#;
        let data: QrPromptData = serde_json::from_str(json).unwrap();
        assert_eq!(data.v, 1);
        assert_eq!(data.name, "Import");
        assert_eq!(data.dsl.as_deref(), Some("_N:Data を 分析して"));
        assert!(data.ws.is_none());
        assert_eq!(data.locale, "ja");
    }

    #[test]
    fn test_qr_prompt_data_v2_deserialization() {
        let json = r#"{"v":2,"name":"Import","ws":"{\"blocks\":{}}","locale":"ja"}"#;
        let data: QrPromptData = serde_json::from_str(json).unwrap();
        assert_eq!(data.v, 2);
        assert_eq!(data.name, "Import");
        assert!(data.dsl.is_none());
        assert!(data.ws.is_some());
        assert_eq!(data.locale, "ja");
    }

    #[test]
    fn test_qr_generate_result_serialization() {
        let result = QrGenerateResult {
            success: true,
            image_data: Some("data:image/png;base64,abc".to_string()),
            error: None,
            data_size: 42,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"success\":true"));
        assert!(json.contains("\"imageData\""));
        assert!(json.contains("\"dataSize\":42"));
        assert!(!json.contains("\"error\""));
    }

    #[test]
    fn test_qr_decode_result_error_serialization() {
        let result = QrDecodeResult {
            success: false,
            data: None,
            error: Some("No QR found".to_string()),
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"success\":false"));
        assert!(json.contains("No QR found"));
        assert!(!json.contains("\"data\""));
    }
}
