// Common modules for Promps
//
// This directory contains shared logic that will be extracted
// as commonalities are discovered during development.
//
// Modules will be added incrementally following the principle:
// "See duplication, fix immediately"

// Phase 5: Grammar Validation
pub mod validation;

// Ent: API Key Management
pub mod api_keys;

// Ent: AI Client
pub mod ai_client;

// v2.0.0: QR Code Sharing
pub mod qr_share;

// v2.0.0: LAN Peer Discovery
pub mod lan_discovery;

// v2.0.0: LAN File Transfer
pub mod lan_transfer;

// v2.1.0: Wizard Templates
pub mod wizard;
