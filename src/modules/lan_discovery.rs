/// LAN Peer Discovery Module for Promps Ent
///
/// Uses mDNS (Bonjour/Avahi) to discover other Promps instances on the
/// local network. Service type: _promps._tcp.local.
/// Only accepts connections from private IP addresses for security.

use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::IpAddr;
use std::sync::{Arc, Mutex};

/// mDNS service type for Promps
pub const SERVICE_TYPE: &str = "_promps._tcp.local.";

/// Default port for Promps LAN sharing
pub const DEFAULT_PORT: u16 = 19750;

/// Maximum port attempts for fallback
pub const MAX_PORT_ATTEMPTS: u16 = 10;

/// Information about a discovered LAN peer
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LanPeer {
    /// Unique peer identifier
    pub id: String,
    /// Display name of the peer
    pub name: String,
    /// IP address of the peer
    pub ip: String,
    /// TCP port for file transfer
    pub port: u16,
    /// Promps version running on the peer
    pub version: String,
}

/// Shared state for discovered peers
#[derive(Debug, Clone)]
pub struct DiscoveryState {
    /// Map of peer ID to peer info
    pub peers: Arc<Mutex<HashMap<String, LanPeer>>>,
    /// Whether discovery is currently running
    pub is_running: Arc<Mutex<bool>>,
}

impl DiscoveryState {
    /// Create a new discovery state
    pub fn new() -> Self {
        DiscoveryState {
            peers: Arc::new(Mutex::new(HashMap::new())),
            is_running: Arc::new(Mutex::new(false)),
        }
    }
}

impl Default for DiscoveryState {
    fn default() -> Self {
        Self::new()
    }
}

/// Check if an IP address is a private/local network address
///
/// # Arguments
/// * `ip` - IP address string to check
///
/// # Returns
/// true if the IP is in a private range (RFC 1918 / link-local)
pub fn is_private_ip(ip: &str) -> bool {
    match ip.parse::<IpAddr>() {
        Ok(IpAddr::V4(addr)) => {
            let octets = addr.octets();
            // 10.0.0.0/8
            octets[0] == 10
            // 172.16.0.0/12
            || (octets[0] == 172 && (16..=31).contains(&octets[1]))
            // 192.168.0.0/16
            || (octets[0] == 192 && octets[1] == 168)
            // 169.254.0.0/16 (link-local)
            || (octets[0] == 169 && octets[1] == 254)
            // 127.0.0.0/8 (loopback)
            || octets[0] == 127
        }
        Ok(IpAddr::V6(addr)) => {
            // ::1 loopback
            addr.is_loopback()
            // fe80::/10 link-local
            || (addr.segments()[0] & 0xffc0) == 0xfe80
            // fc00::/7 unique-local
            || (addr.segments()[0] & 0xfe00) == 0xfc00
        }
        Err(_) => false,
    }
}

/// Get discovered peers as a sorted list
///
/// # Arguments
/// * `state` - Discovery state
///
/// # Returns
/// List of discovered peers sorted by name
pub fn get_peers(state: &DiscoveryState) -> Vec<LanPeer> {
    let peers = state.peers.lock().unwrap();
    let mut list: Vec<LanPeer> = peers.values().cloned().collect();
    list.sort_by(|a, b| a.name.cmp(&b.name));
    list
}

/// Find an available port starting from DEFAULT_PORT
///
/// # Returns
/// Available port number or error
pub fn find_available_port() -> Result<u16, String> {
    for offset in 0..MAX_PORT_ATTEMPTS {
        let port = DEFAULT_PORT + offset;
        match std::net::TcpListener::bind(("0.0.0.0", port)) {
            Ok(listener) => {
                drop(listener);
                return Ok(port);
            }
            Err(_) => continue,
        }
    }
    Err(format!(
        "No available port found in range {}-{}",
        DEFAULT_PORT,
        DEFAULT_PORT + MAX_PORT_ATTEMPTS - 1
    ))
}

/// Get the machine's display name for mDNS
///
/// Uses the system hostname. Falls back to a UUID if hostname
/// cannot be retrieved.
///
/// # Returns
/// Machine name string
pub fn get_machine_name() -> String {
    let hostname = gethostname::gethostname();
    let name = hostname.to_string_lossy().to_string();
    if name.is_empty() {
        uuid::Uuid::new_v4().to_string()
    } else {
        name
    }
}

/// Start mDNS service registration and peer discovery
///
/// Registers this instance on the local network and starts browsing
/// for other Promps instances. Discovered peers are added to the
/// shared DiscoveryState.
///
/// # Arguments
/// * `instance_id` - Unique ID for this instance
/// * `instance_name` - Display name for this instance
/// * `port` - TCP port this instance listens on
/// * `version` - Promps version string
/// * `discovery` - Shared discovery state for storing found peers
///
/// # Returns
/// ServiceDaemon handle (needed for shutdown)
pub fn start_mdns_service(
    instance_id: &str,
    instance_name: &str,
    port: u16,
    version: &str,
    discovery: &DiscoveryState,
) -> Result<ServiceDaemon, String> {
    let daemon = ServiceDaemon::new().map_err(|e| format!("Failed to create mDNS daemon: {}", e))?;

    // Register our service
    let properties = [
        ("id", instance_id),
        ("name", instance_name),
        ("version", version),
    ];
    let hostname = format!("{}.local.", instance_name);
    let service_info = ServiceInfo::new(
        SERVICE_TYPE,
        instance_id,
        &hostname,
        "",
        port,
        &properties[..],
    )
    .map_err(|e| format!("Failed to create service info: {}", e))?
    .enable_addr_auto();

    daemon
        .register(service_info)
        .map_err(|e| format!("Failed to register mDNS service: {}", e))?;

    // Start browsing for other instances
    let receiver = daemon
        .browse(SERVICE_TYPE)
        .map_err(|e| format!("Failed to start mDNS browse: {}", e))?;

    // Spawn a thread to handle discovery events (blocking recv)
    let peers = Arc::clone(&discovery.peers);
    let is_running = Arc::clone(&discovery.is_running);
    let my_id = instance_id.to_string();

    std::thread::spawn(move || {
        loop {
            match receiver.recv() {
                Ok(ServiceEvent::ServiceResolved(info)) => {
                    // Extract peer info from service properties
                    let props = info.get_properties();
                    let peer_id = props
                        .get_property_val_str("id")
                        .unwrap_or_default()
                        .to_string();

                    // Skip ourselves
                    if peer_id == my_id || peer_id.is_empty() {
                        continue;
                    }

                    let peer_name = props
                        .get_property_val_str("name")
                        .unwrap_or_default()
                        .to_string();
                    let peer_version = props
                        .get_property_val_str("version")
                        .unwrap_or_default()
                        .to_string();

                    // Get address (prefer IPv4 for compatibility)
                    let addresses = info.get_addresses();
                    let ip = match addresses.iter().find(|a| a.is_ipv4())
                        .or_else(|| addresses.iter().next())
                    {
                        Some(addr) => addr.to_string(),
                        None => continue,
                    };

                    // Only accept private IPs
                    if !is_private_ip(&ip) {
                        continue;
                    }

                    let peer = LanPeer {
                        id: peer_id.clone(),
                        name: peer_name,
                        ip,
                        port: info.get_port(),
                        version: peer_version,
                    };

                    if let Ok(mut map) = peers.lock() {
                        map.insert(peer_id, peer);
                    }
                }
                Ok(ServiceEvent::ServiceRemoved(_service_type, fullname)) => {
                    // Remove peer whose fullname matches
                    if let Ok(mut map) = peers.lock() {
                        map.retain(|id, _| !fullname.contains(id));
                    }
                }
                Ok(ServiceEvent::SearchStopped(_)) => {
                    break;
                }
                Ok(_) => {
                    // Ignore SearchStarted, ServiceFound
                }
                Err(_) => {
                    // Channel closed, daemon shut down
                    break;
                }
            }

            // Check if we should stop
            if let Ok(running) = is_running.lock() {
                if !*running {
                    break;
                }
            }
        }
    });

    Ok(daemon)
}

/// Stop the mDNS service daemon
///
/// # Arguments
/// * `daemon` - The ServiceDaemon to shut down
pub fn stop_mdns_service(daemon: ServiceDaemon) {
    let _ = daemon.shutdown();
}

#[cfg(test)]
mod tests {
    use super::*;

    // Private IPv4 addresses
    #[test]
    fn test_is_private_ip_10_range() {
        assert!(is_private_ip("10.0.0.1"));
        assert!(is_private_ip("10.255.255.255"));
        assert!(is_private_ip("10.1.2.3"));
    }

    #[test]
    fn test_is_private_ip_172_range() {
        assert!(is_private_ip("172.16.0.1"));
        assert!(is_private_ip("172.31.255.255"));
        assert!(is_private_ip("172.20.10.5"));
    }

    #[test]
    fn test_is_private_ip_192_168_range() {
        assert!(is_private_ip("192.168.0.1"));
        assert!(is_private_ip("192.168.1.100"));
        assert!(is_private_ip("192.168.255.255"));
    }

    #[test]
    fn test_is_private_ip_loopback() {
        assert!(is_private_ip("127.0.0.1"));
        assert!(is_private_ip("127.0.1.1"));
    }

    #[test]
    fn test_is_private_ip_link_local() {
        assert!(is_private_ip("169.254.0.1"));
        assert!(is_private_ip("169.254.255.255"));
    }

    // Public IPs should NOT be private
    #[test]
    fn test_is_private_ip_public() {
        assert!(!is_private_ip("8.8.8.8"));
        assert!(!is_private_ip("1.1.1.1"));
        assert!(!is_private_ip("203.0.113.1"));
        assert!(!is_private_ip("172.32.0.1")); // Just outside 172.16-31 range
        assert!(!is_private_ip("172.15.0.1")); // Just below 172.16 range
    }

    #[test]
    fn test_is_private_ip_invalid() {
        assert!(!is_private_ip("not-an-ip"));
        assert!(!is_private_ip(""));
        assert!(!is_private_ip("256.1.2.3"));
    }

    #[test]
    fn test_is_private_ip_ipv6_loopback() {
        assert!(is_private_ip("::1"));
    }

    // Discovery state
    #[test]
    fn test_discovery_state_new() {
        let state = DiscoveryState::new();
        let peers = state.peers.lock().unwrap();
        assert!(peers.is_empty());
        let running = state.is_running.lock().unwrap();
        assert!(!*running);
    }

    #[test]
    fn test_get_peers_empty() {
        let state = DiscoveryState::new();
        let peers = get_peers(&state);
        assert!(peers.is_empty());
    }

    #[test]
    fn test_get_peers_sorted() {
        let state = DiscoveryState::new();
        {
            let mut peers = state.peers.lock().unwrap();
            peers.insert(
                "b".to_string(),
                LanPeer {
                    id: "b".to_string(),
                    name: "Bob".to_string(),
                    ip: "192.168.1.2".to_string(),
                    port: 19750,
                    version: "2.0.0".to_string(),
                },
            );
            peers.insert(
                "a".to_string(),
                LanPeer {
                    id: "a".to_string(),
                    name: "Alice".to_string(),
                    ip: "192.168.1.1".to_string(),
                    port: 19750,
                    version: "2.0.0".to_string(),
                },
            );
        }

        let peers = get_peers(&state);
        assert_eq!(peers.len(), 2);
        assert_eq!(peers[0].name, "Alice");
        assert_eq!(peers[1].name, "Bob");
    }

    #[test]
    fn test_lan_peer_serialization() {
        let peer = LanPeer {
            id: "abc-123".to_string(),
            name: "My PC".to_string(),
            ip: "192.168.1.10".to_string(),
            port: 19750,
            version: "2.0.0".to_string(),
        };

        let json = serde_json::to_string(&peer).unwrap();
        assert!(json.contains("\"id\":\"abc-123\""));
        assert!(json.contains("\"name\":\"My PC\""));
        assert!(json.contains("\"ip\":\"192.168.1.10\""));
        assert!(json.contains("\"port\":19750"));
        assert!(json.contains("\"version\":\"2.0.0\""));
    }

    #[test]
    fn test_find_available_port() {
        // Should find at least one port in the range
        let result = find_available_port();
        assert!(result.is_ok());
        let port = result.unwrap();
        assert!(port >= DEFAULT_PORT);
        assert!(port < DEFAULT_PORT + MAX_PORT_ATTEMPTS);
    }
}
