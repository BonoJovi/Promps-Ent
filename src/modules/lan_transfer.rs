/// LAN File Transfer Module for Promps Ent
///
/// Implements TCP-based file transfer between Promps instances.
/// Protocol: Hello → FileOffer → Accept/Reject → FileData → Complete
/// Uses SHA256 hash for data integrity verification.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::{Arc, Mutex};

use crate::modules::lan_discovery::is_private_ip;

/// Transfer protocol message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum TransferMessage {
    /// Initial handshake
    Hello {
        peer_id: String,
        peer_name: String,
        version: String,
    },
    /// Acknowledgment of hello
    HelloAck {
        peer_id: String,
        peer_name: String,
        version: String,
    },
    /// Offer a file for transfer
    FileOffer {
        transfer_id: String,
        file_name: String,
        file_size: u64,
        file_type: String,
        sha256: String,
    },
    /// Accept the file offer
    Accept {
        transfer_id: String,
    },
    /// Reject the file offer
    Reject {
        transfer_id: String,
        reason: Option<String>,
    },
    /// File data payload (base64 encoded for JSON transport)
    FileData {
        transfer_id: String,
        data: String,
    },
    /// Transfer complete confirmation
    Complete {
        transfer_id: String,
        success: bool,
    },
}

/// Status of a transfer
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TransferStatus {
    /// Waiting for user to accept/reject
    Pending,
    /// User accepted, transfer in progress
    Accepted,
    /// User rejected
    Rejected,
    /// Transfer is in progress
    InProgress,
    /// Transfer completed successfully
    Completed,
    /// Transfer failed
    Failed,
}

/// A pending transfer offer from a remote peer
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingOffer {
    /// Unique transfer ID
    pub transfer_id: String,
    /// Name of the peer offering the file
    pub peer_name: String,
    /// IP of the peer
    pub peer_ip: String,
    /// File name being offered
    pub file_name: String,
    /// File size in bytes
    pub file_size: u64,
    /// File type description
    pub file_type: String,
    /// SHA256 hash for verification
    pub sha256: String,
    /// Current status
    pub status: TransferStatus,
    /// Received file data (base64, set after transfer)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<String>,
}

/// Shared state for the transfer server
#[derive(Debug, Clone)]
pub struct TransferState {
    /// Map of transfer ID to pending offer
    pub pending_offers: Arc<Mutex<HashMap<String, PendingOffer>>>,
    /// Whether the transfer server is running
    pub is_running: Arc<Mutex<bool>>,
    /// Port the server is listening on
    pub port: Arc<Mutex<u16>>,
}

impl TransferState {
    /// Create a new transfer state
    pub fn new() -> Self {
        TransferState {
            pending_offers: Arc::new(Mutex::new(HashMap::new())),
            is_running: Arc::new(Mutex::new(false)),
            port: Arc::new(Mutex::new(0)),
        }
    }
}

impl Default for TransferState {
    fn default() -> Self {
        Self::new()
    }
}

/// Transfer operation result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferResult {
    /// Whether the operation was successful
    pub success: bool,
    /// Message describing the result
    pub message: String,
    /// Transfer ID if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transfer_id: Option<String>,
}

/// Compute SHA256 hash of data
///
/// # Arguments
/// * `data` - Byte slice to hash
///
/// # Returns
/// Hex-encoded SHA256 hash string
pub fn compute_sha256(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    let result = hasher.finalize();
    hex_encode(&result)
}

/// Encode bytes as hex string
fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

/// Verify SHA256 hash of received data
///
/// # Arguments
/// * `data` - Received data bytes
/// * `expected_hash` - Expected SHA256 hash
///
/// # Returns
/// true if hash matches
pub fn verify_sha256(data: &[u8], expected_hash: &str) -> bool {
    compute_sha256(data) == expected_hash
}

/// Validate that a connection source is from a private IP
///
/// # Arguments
/// * `ip` - Source IP address
///
/// # Returns
/// Ok if private IP, Err with reason if not
#[allow(dead_code)]
pub fn validate_connection_source(ip: &str) -> Result<(), String> {
    if is_private_ip(ip) {
        Ok(())
    } else {
        Err(format!(
            "Connection rejected: {} is not a private IP address",
            ip
        ))
    }
}

/// Get list of pending offers for the frontend
///
/// # Arguments
/// * `state` - Transfer state
///
/// # Returns
/// List of pending offers sorted by transfer ID
pub fn get_pending_offers(state: &TransferState) -> Vec<PendingOffer> {
    let offers = state.pending_offers.lock().unwrap();
    let mut list: Vec<PendingOffer> = offers
        .values()
        .filter(|o| o.status == TransferStatus::Pending)
        .cloned()
        .collect();
    list.sort_by(|a, b| a.transfer_id.cmp(&b.transfer_id));
    list
}

/// Accept a pending transfer offer
///
/// # Arguments
/// * `state` - Transfer state
/// * `transfer_id` - ID of the transfer to accept
///
/// # Returns
/// TransferResult indicating success or failure
pub fn accept_offer(state: &TransferState, transfer_id: &str) -> TransferResult {
    let mut offers = state.pending_offers.lock().unwrap();
    match offers.get_mut(transfer_id) {
        Some(offer) if offer.status == TransferStatus::Pending => {
            offer.status = TransferStatus::Accepted;
            TransferResult {
                success: true,
                message: "Transfer accepted".to_string(),
                transfer_id: Some(transfer_id.to_string()),
            }
        }
        Some(_) => TransferResult {
            success: false,
            message: "Transfer is not in pending state".to_string(),
            transfer_id: Some(transfer_id.to_string()),
        },
        None => TransferResult {
            success: false,
            message: "Transfer not found".to_string(),
            transfer_id: Some(transfer_id.to_string()),
        },
    }
}

/// Reject a pending transfer offer
///
/// # Arguments
/// * `state` - Transfer state
/// * `transfer_id` - ID of the transfer to reject
///
/// # Returns
/// TransferResult indicating success or failure
pub fn reject_offer(state: &TransferState, transfer_id: &str) -> TransferResult {
    let mut offers = state.pending_offers.lock().unwrap();
    match offers.get_mut(transfer_id) {
        Some(offer) if offer.status == TransferStatus::Pending => {
            offer.status = TransferStatus::Rejected;
            TransferResult {
                success: true,
                message: "Transfer rejected".to_string(),
                transfer_id: Some(transfer_id.to_string()),
            }
        }
        Some(_) => TransferResult {
            success: false,
            message: "Transfer is not in pending state".to_string(),
            transfer_id: Some(transfer_id.to_string()),
        },
        None => TransferResult {
            success: false,
            message: "Transfer not found".to_string(),
            transfer_id: Some(transfer_id.to_string()),
        },
    }
}

// ============================================================================
// TCP Transfer Protocol
// ============================================================================

/// Read a length-prefixed JSON message from a TCP stream
///
/// Protocol: 4-byte big-endian length prefix followed by JSON bytes
///
/// # Arguments
/// * `stream` - TCP stream to read from
///
/// # Returns
/// Deserialized TransferMessage
pub fn read_message(stream: &mut TcpStream) -> Result<TransferMessage, String> {
    let mut len_buf = [0u8; 4];
    stream
        .read_exact(&mut len_buf)
        .map_err(|e| format!("Failed to read message length: {}", e))?;
    let len = u32::from_be_bytes(len_buf) as usize;

    if len > 50 * 1024 * 1024 {
        return Err(format!("Message too large: {} bytes", len));
    }

    let mut buf = vec![0u8; len];
    stream
        .read_exact(&mut buf)
        .map_err(|e| format!("Failed to read message body: {}", e))?;

    serde_json::from_slice(&buf).map_err(|e| format!("Failed to parse message: {}", e))
}

/// Write a length-prefixed JSON message to a TCP stream
///
/// # Arguments
/// * `stream` - TCP stream to write to
/// * `msg` - TransferMessage to send
pub fn write_message(stream: &mut TcpStream, msg: &TransferMessage) -> Result<(), String> {
    let data =
        serde_json::to_vec(msg).map_err(|e| format!("Failed to serialize message: {}", e))?;
    let len = (data.len() as u32).to_be_bytes();

    stream
        .write_all(&len)
        .map_err(|e| format!("Failed to write message length: {}", e))?;
    stream
        .write_all(&data)
        .map_err(|e| format!("Failed to write message body: {}", e))?;
    stream
        .flush()
        .map_err(|e| format!("Failed to flush stream: {}", e))?;

    Ok(())
}

/// Start a TCP listener for incoming file transfers
///
/// Accepts connections, performs Hello handshake, receives FileOffer,
/// stores the offer as pending, and keeps the TcpStream alive for
/// later Accept/Reject completion.
///
/// # Arguments
/// * `port` - Port to bind on
/// * `my_id` - This instance's peer ID
/// * `my_name` - This instance's display name
/// * `version` - Promps version string
/// * `pending_offers` - Shared map to store incoming offers
/// * `active_connections` - Shared map to store live TcpStreams
///
/// # Returns
/// A shutdown sender to stop the listener
pub fn start_tcp_listener(
    port: u16,
    my_id: String,
    my_name: String,
    version: String,
    pending_offers: Arc<Mutex<HashMap<String, PendingOffer>>>,
    active_connections: Arc<Mutex<HashMap<String, TcpStream>>>,
) -> Result<std::sync::mpsc::Sender<()>, String> {
    let listener = TcpListener::bind(("0.0.0.0", port))
        .map_err(|e| format!("Failed to bind TCP listener on port {}: {}", port, e))?;

    // Set non-blocking so we can check the shutdown channel
    listener
        .set_nonblocking(true)
        .map_err(|e| format!("Failed to set non-blocking: {}", e))?;

    let (shutdown_tx, shutdown_rx) = std::sync::mpsc::channel::<()>();

    std::thread::spawn(move || {
        loop {
            // Check for shutdown signal
            if shutdown_rx.try_recv().is_ok() {
                break;
            }

            match listener.accept() {
                Ok((mut stream, addr)) => {
                    let peer_ip = addr.ip().to_string();

                    // Only accept private IPs
                    if !is_private_ip(&peer_ip) {
                        let _ = stream.shutdown(std::net::Shutdown::Both);
                        continue;
                    }

                    // Set blocking for the connection handling
                    let _ = stream.set_nonblocking(false);
                    let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(30)));

                    // Handle connection in a separate thread
                    let my_id = my_id.clone();
                    let my_name = my_name.clone();
                    let version = version.clone();
                    let offers = Arc::clone(&pending_offers);
                    let connections = Arc::clone(&active_connections);

                    std::thread::spawn(move || {
                        if let Err(e) = handle_incoming_connection(
                            &mut stream,
                            &peer_ip,
                            &my_id,
                            &my_name,
                            &version,
                            &offers,
                            &connections,
                        ) {
                            eprintln!("LAN transfer connection error: {}", e);
                        }
                    });
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    // No pending connection, sleep briefly
                    std::thread::sleep(std::time::Duration::from_millis(100));
                }
                Err(e) => {
                    eprintln!("TCP accept error: {}", e);
                    std::thread::sleep(std::time::Duration::from_millis(100));
                }
            }
        }
    });

    Ok(shutdown_tx)
}

/// Handle an incoming TCP connection: Hello handshake + FileOffer
fn handle_incoming_connection(
    stream: &mut TcpStream,
    peer_ip: &str,
    my_id: &str,
    my_name: &str,
    version: &str,
    pending_offers: &Arc<Mutex<HashMap<String, PendingOffer>>>,
    active_connections: &Arc<Mutex<HashMap<String, TcpStream>>>,
) -> Result<(), String> {
    // Step 1: Receive Hello
    let hello = read_message(stream)?;
    let (_remote_id, remote_name) = match &hello {
        TransferMessage::Hello {
            peer_id, peer_name, ..
        } => (peer_id.clone(), peer_name.clone()),
        _ => return Err("Expected Hello message".to_string()),
    };

    // Step 2: Send HelloAck
    write_message(
        stream,
        &TransferMessage::HelloAck {
            peer_id: my_id.to_string(),
            peer_name: my_name.to_string(),
            version: version.to_string(),
        },
    )?;

    // Step 3: Receive FileOffer
    let offer_msg = read_message(stream)?;
    let (transfer_id, file_name, file_size, file_type, sha256) = match &offer_msg {
        TransferMessage::FileOffer {
            transfer_id,
            file_name,
            file_size,
            file_type,
            sha256,
        } => (
            transfer_id.clone(),
            file_name.clone(),
            *file_size,
            file_type.clone(),
            sha256.clone(),
        ),
        _ => return Err("Expected FileOffer message".to_string()),
    };

    // Step 4: Store as pending offer
    let offer = PendingOffer {
        transfer_id: transfer_id.clone(),
        peer_name: remote_name,
        peer_ip: peer_ip.to_string(),
        file_name,
        file_size,
        file_type,
        sha256,
        status: TransferStatus::Pending,
        data: None,
    };

    if let Ok(mut offers) = pending_offers.lock() {
        offers.insert(transfer_id.clone(), offer);
    }

    // Step 5: Clone the stream and store it for later Accept/Reject
    let stream_clone = stream
        .try_clone()
        .map_err(|e| format!("Failed to clone stream: {}", e))?;

    if let Ok(mut conns) = active_connections.lock() {
        conns.insert(transfer_id, stream_clone);
    }

    Ok(())
}

/// Send a project to a remote peer via TCP
///
/// Connects, performs Hello handshake, sends FileOffer, waits for
/// Accept/Reject, then sends FileData and waits for Complete.
///
/// # Arguments
/// * `addr` - Remote peer IP address
/// * `port` - Remote peer port
/// * `my_id` - This instance's peer ID
/// * `my_name` - This instance's display name
/// * `version` - Promps version string
/// * `project_name` - Name of the project being sent
/// * `project_data` - DSL data to send
///
/// # Returns
/// TransferResult indicating success or failure
pub fn send_to_peer(
    addr: &str,
    port: u16,
    my_id: &str,
    my_name: &str,
    version: &str,
    project_name: &str,
    project_data: &str,
) -> TransferResult {
    // Connect with timeout
    let ip: std::net::IpAddr = match addr.parse() {
        Ok(ip) => ip,
        Err(e) => {
            return TransferResult {
                success: false,
                message: format!("Invalid peer IP address '{}': {}", addr, e),
                transfer_id: None,
            }
        }
    };
    let socket_addr = std::net::SocketAddr::new(ip, port);
    let mut stream = match TcpStream::connect_timeout(
        &socket_addr,
        std::time::Duration::from_secs(10),
    ) {
        Ok(s) => s,
        Err(e) => {
            return TransferResult {
                success: false,
                message: format!("Failed to connect to {}: {}", socket_addr, e),
                transfer_id: None,
            }
        }
    };

    let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(60)));

    // Step 1: Send Hello
    if let Err(e) = write_message(
        &mut stream,
        &TransferMessage::Hello {
            peer_id: my_id.to_string(),
            peer_name: my_name.to_string(),
            version: version.to_string(),
        },
    ) {
        return TransferResult {
            success: false,
            message: format!("Hello failed: {}", e),
            transfer_id: None,
        };
    }

    // Step 2: Wait for HelloAck
    match read_message(&mut stream) {
        Ok(TransferMessage::HelloAck { .. }) => {}
        Ok(_) => {
            return TransferResult {
                success: false,
                message: "Unexpected response (expected HelloAck)".to_string(),
                transfer_id: None,
            }
        }
        Err(e) => {
            return TransferResult {
                success: false,
                message: format!("HelloAck failed: {}", e),
                transfer_id: None,
            }
        }
    }

    // Step 3: Send FileOffer
    let transfer_id = uuid::Uuid::new_v4().to_string();
    let data_bytes = project_data.as_bytes();
    let hash = compute_sha256(data_bytes);

    if let Err(e) = write_message(
        &mut stream,
        &TransferMessage::FileOffer {
            transfer_id: transfer_id.clone(),
            file_name: format!("{}.promps", project_name),
            file_size: data_bytes.len() as u64,
            file_type: "project".to_string(),
            sha256: hash.clone(),
        },
    ) {
        return TransferResult {
            success: false,
            message: format!("FileOffer failed: {}", e),
            transfer_id: Some(transfer_id),
        };
    }

    // Step 4: Wait for Accept/Reject (with 5 min timeout)
    let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(300)));
    let response = match read_message(&mut stream) {
        Ok(msg) => msg,
        Err(e) => {
            return TransferResult {
                success: false,
                message: format!("No response from peer: {}", e),
                transfer_id: Some(transfer_id),
            }
        }
    };

    match response {
        TransferMessage::Accept { .. } => {
            // Peer accepted - send file data
        }
        TransferMessage::Reject { reason, .. } => {
            return TransferResult {
                success: false,
                message: format!(
                    "Transfer rejected: {}",
                    reason.unwrap_or_else(|| "No reason given".to_string())
                ),
                transfer_id: Some(transfer_id),
            }
        }
        _ => {
            return TransferResult {
                success: false,
                message: "Unexpected response (expected Accept/Reject)".to_string(),
                transfer_id: Some(transfer_id),
            }
        }
    }

    // Step 5: Send FileData (base64 encoded)
    let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(60)));
    let encoded = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, data_bytes);
    if let Err(e) = write_message(
        &mut stream,
        &TransferMessage::FileData {
            transfer_id: transfer_id.clone(),
            data: encoded,
        },
    ) {
        return TransferResult {
            success: false,
            message: format!("FileData send failed: {}", e),
            transfer_id: Some(transfer_id),
        };
    }

    // Step 6: Wait for Complete
    match read_message(&mut stream) {
        Ok(TransferMessage::Complete { success, .. }) => {
            if success {
                TransferResult {
                    success: true,
                    message: "Transfer completed successfully".to_string(),
                    transfer_id: Some(transfer_id),
                }
            } else {
                TransferResult {
                    success: false,
                    message: "Peer reported transfer failure".to_string(),
                    transfer_id: Some(transfer_id),
                }
            }
        }
        Ok(_) => TransferResult {
            success: false,
            message: "Unexpected response (expected Complete)".to_string(),
            transfer_id: Some(transfer_id),
        },
        Err(e) => TransferResult {
            success: false,
            message: format!("Complete response failed: {}", e),
            transfer_id: Some(transfer_id),
        },
    }
}

/// Complete an accepted transfer: send Accept, receive FileData, verify, send Complete
///
/// # Arguments
/// * `transfer_id` - ID of the accepted transfer
/// * `active_connections` - Map of transfer_id → TcpStream
/// * `pending_offers` - Map of transfer_id → PendingOffer
///
/// # Returns
/// Ok(dsl_data) on success, Err on failure
pub fn complete_accepted_transfer(
    transfer_id: &str,
    active_connections: &Arc<Mutex<HashMap<String, TcpStream>>>,
    pending_offers: &Arc<Mutex<HashMap<String, PendingOffer>>>,
) -> Result<String, String> {
    // Get stream from active connections
    let mut stream = {
        let mut conns = active_connections
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        conns
            .remove(transfer_id)
            .ok_or_else(|| "Connection not found for transfer".to_string())?
    };

    // Get the expected hash from the offer
    let expected_hash = {
        let offers = pending_offers
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        match offers.get(transfer_id) {
            Some(offer) => offer.sha256.clone(),
            None => return Err("Offer not found".to_string()),
        }
    };

    // Send Accept
    let _ = stream.set_read_timeout(Some(std::time::Duration::from_secs(60)));
    write_message(
        &mut stream,
        &TransferMessage::Accept {
            transfer_id: transfer_id.to_string(),
        },
    )?;

    // Receive FileData
    let file_data = match read_message(&mut stream) {
        Ok(TransferMessage::FileData { data, .. }) => data,
        Ok(_) => return Err("Unexpected message (expected FileData)".to_string()),
        Err(e) => return Err(format!("Failed to receive file data: {}", e)),
    };

    // Decode base64
    let decoded = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &file_data)
        .map_err(|e| format!("Base64 decode failed: {}", e))?;

    // Verify SHA256
    if !verify_sha256(&decoded, &expected_hash) {
        write_message(
            &mut stream,
            &TransferMessage::Complete {
                transfer_id: transfer_id.to_string(),
                success: false,
            },
        )?;
        return Err("SHA256 verification failed".to_string());
    }

    // Send Complete (success)
    write_message(
        &mut stream,
        &TransferMessage::Complete {
            transfer_id: transfer_id.to_string(),
            success: true,
        },
    )?;

    // Convert to string (DSL data)
    let dsl = String::from_utf8(decoded)
        .map_err(|e| format!("Failed to decode transfer data as UTF-8: {}", e))?;

    // Update offer status
    if let Ok(mut offers) = pending_offers.lock() {
        if let Some(offer) = offers.get_mut(transfer_id) {
            offer.status = TransferStatus::Completed;
        }
    }

    Ok(dsl)
}

/// Complete a rejected transfer: send Reject message to sender
///
/// # Arguments
/// * `transfer_id` - ID of the rejected transfer
/// * `reason` - Optional rejection reason
/// * `active_connections` - Map of transfer_id → TcpStream
pub fn complete_rejected_transfer(
    transfer_id: &str,
    reason: Option<String>,
    active_connections: &Arc<Mutex<HashMap<String, TcpStream>>>,
) -> Result<(), String> {
    let mut stream = {
        let mut conns = active_connections
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        conns
            .remove(transfer_id)
            .ok_or_else(|| "Connection not found for transfer".to_string())?
    };

    write_message(
        &mut stream,
        &TransferMessage::Reject {
            transfer_id: transfer_id.to_string(),
            reason,
        },
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_sha256() {
        let data = b"Hello, World!";
        let hash = compute_sha256(data);
        assert_eq!(hash.len(), 64); // SHA256 = 32 bytes = 64 hex chars
        // Known hash for "Hello, World!"
        assert_eq!(
            hash,
            "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"
        );
    }

    #[test]
    fn test_verify_sha256_valid() {
        let data = b"Test data";
        let hash = compute_sha256(data);
        assert!(verify_sha256(data, &hash));
    }

    #[test]
    fn test_verify_sha256_invalid() {
        let data = b"Test data";
        assert!(!verify_sha256(data, "invalid_hash"));
    }

    #[test]
    fn test_verify_sha256_tampered() {
        let data = b"Original data";
        let hash = compute_sha256(data);
        let tampered = b"Tampered data";
        assert!(!verify_sha256(tampered, &hash));
    }

    #[test]
    fn test_validate_connection_private() {
        assert!(validate_connection_source("192.168.1.1").is_ok());
        assert!(validate_connection_source("10.0.0.1").is_ok());
        assert!(validate_connection_source("172.16.0.1").is_ok());
    }

    #[test]
    fn test_validate_connection_public() {
        assert!(validate_connection_source("8.8.8.8").is_err());
        assert!(validate_connection_source("1.1.1.1").is_err());
    }

    #[test]
    fn test_transfer_state_new() {
        let state = TransferState::new();
        let offers = state.pending_offers.lock().unwrap();
        assert!(offers.is_empty());
        let running = state.is_running.lock().unwrap();
        assert!(!*running);
    }

    #[test]
    fn test_get_pending_offers_empty() {
        let state = TransferState::new();
        let offers = get_pending_offers(&state);
        assert!(offers.is_empty());
    }

    #[test]
    fn test_get_pending_offers_filters_non_pending() {
        let state = TransferState::new();
        {
            let mut offers = state.pending_offers.lock().unwrap();
            offers.insert(
                "t1".to_string(),
                PendingOffer {
                    transfer_id: "t1".to_string(),
                    peer_name: "Peer 1".to_string(),
                    peer_ip: "192.168.1.1".to_string(),
                    file_name: "test.promps".to_string(),
                    file_size: 100,
                    file_type: "project".to_string(),
                    sha256: "abc".to_string(),
                    status: TransferStatus::Pending,
                    data: None,
                },
            );
            offers.insert(
                "t2".to_string(),
                PendingOffer {
                    transfer_id: "t2".to_string(),
                    peer_name: "Peer 2".to_string(),
                    peer_ip: "192.168.1.2".to_string(),
                    file_name: "done.promps".to_string(),
                    file_size: 200,
                    file_type: "project".to_string(),
                    sha256: "def".to_string(),
                    status: TransferStatus::Completed,
                    data: None,
                },
            );
        }

        let pending = get_pending_offers(&state);
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].transfer_id, "t1");
    }

    #[test]
    fn test_accept_offer_success() {
        let state = TransferState::new();
        {
            let mut offers = state.pending_offers.lock().unwrap();
            offers.insert(
                "t1".to_string(),
                PendingOffer {
                    transfer_id: "t1".to_string(),
                    peer_name: "Peer".to_string(),
                    peer_ip: "192.168.1.1".to_string(),
                    file_name: "test.promps".to_string(),
                    file_size: 100,
                    file_type: "project".to_string(),
                    sha256: "abc".to_string(),
                    status: TransferStatus::Pending,
                    data: None,
                },
            );
        }

        let result = accept_offer(&state, "t1");
        assert!(result.success);

        let offers = state.pending_offers.lock().unwrap();
        assert_eq!(offers["t1"].status, TransferStatus::Accepted);
    }

    #[test]
    fn test_accept_offer_not_found() {
        let state = TransferState::new();
        let result = accept_offer(&state, "nonexistent");
        assert!(!result.success);
        assert!(result.message.contains("not found"));
    }

    #[test]
    fn test_reject_offer_success() {
        let state = TransferState::new();
        {
            let mut offers = state.pending_offers.lock().unwrap();
            offers.insert(
                "t1".to_string(),
                PendingOffer {
                    transfer_id: "t1".to_string(),
                    peer_name: "Peer".to_string(),
                    peer_ip: "192.168.1.1".to_string(),
                    file_name: "test.promps".to_string(),
                    file_size: 100,
                    file_type: "project".to_string(),
                    sha256: "abc".to_string(),
                    status: TransferStatus::Pending,
                    data: None,
                },
            );
        }

        let result = reject_offer(&state, "t1");
        assert!(result.success);

        let offers = state.pending_offers.lock().unwrap();
        assert_eq!(offers["t1"].status, TransferStatus::Rejected);
    }

    #[test]
    fn test_reject_already_accepted() {
        let state = TransferState::new();
        {
            let mut offers = state.pending_offers.lock().unwrap();
            offers.insert(
                "t1".to_string(),
                PendingOffer {
                    transfer_id: "t1".to_string(),
                    peer_name: "Peer".to_string(),
                    peer_ip: "192.168.1.1".to_string(),
                    file_name: "test.promps".to_string(),
                    file_size: 100,
                    file_type: "project".to_string(),
                    sha256: "abc".to_string(),
                    status: TransferStatus::Accepted,
                    data: None,
                },
            );
        }

        let result = reject_offer(&state, "t1");
        assert!(!result.success);
        assert!(result.message.contains("not in pending"));
    }

    #[test]
    fn test_transfer_message_serialization_hello() {
        let msg = TransferMessage::Hello {
            peer_id: "123".to_string(),
            peer_name: "Test".to_string(),
            version: "2.0.0".to_string(),
        };

        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"hello\""));
        assert!(json.contains("\"peer_id\":\"123\""));
    }

    #[test]
    fn test_transfer_message_serialization_file_offer() {
        let msg = TransferMessage::FileOffer {
            transfer_id: "t1".to_string(),
            file_name: "test.promps".to_string(),
            file_size: 1024,
            file_type: "project".to_string(),
            sha256: "abc123".to_string(),
        };

        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"file_offer\""));
        assert!(json.contains("\"file_size\":1024"));
    }

    #[test]
    fn test_pending_offer_serialization() {
        let offer = PendingOffer {
            transfer_id: "t1".to_string(),
            peer_name: "Peer".to_string(),
            peer_ip: "192.168.1.1".to_string(),
            file_name: "test.promps".to_string(),
            file_size: 512,
            file_type: "project".to_string(),
            sha256: "abc".to_string(),
            status: TransferStatus::Pending,
            data: None,
        };

        let json = serde_json::to_string(&offer).unwrap();
        assert!(json.contains("\"transferId\":\"t1\""));
        assert!(json.contains("\"peerName\":\"Peer\""));
        assert!(json.contains("\"fileSize\":512"));
        assert!(json.contains("\"status\":\"pending\""));
        assert!(!json.contains("\"data\""));
    }
}
