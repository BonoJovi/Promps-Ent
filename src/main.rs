// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod modules;

use commands::{
    generate_prompt_from_text,
    generate_raw_prompt_from_text,
    greet,
    validate_dsl_sequence,
    get_patterns,
    analyze_dsl_patterns,
    save_project,
    load_project,
    create_new_project,
    update_project_timestamp,
    show_open_dialog,
    show_save_dialog,
    show_confirm_dialog,
    set_window_title,
    // Ent: Project Scanning (Tags & Search)
    show_folder_dialog,
    scan_projects_folder,
    // Ent: API Key Management
    save_api_key,
    get_api_key,
    delete_api_key,
    list_api_keys,
    has_api_key,
    // Ent: Direct AI Send
    send_to_ai,
    get_ai_providers,
    // Ent: AI Import Hub
    analyze_text_with_ai,
    // Ent: AI Compare
    send_to_multiple_ai,
// Ent: Export
    show_export_dialog,
    export_prompt,
    export_project,
    // v1.2.0: Template Export/Import
    show_template_export_dialog,
    show_template_import_dialog,
    export_template,
    import_template,
    // v2.0.0: QR Code Sharing
    generate_qr_code,
    save_qr_code,
    decode_qr_code,
    show_qr_open_dialog,
    show_qr_save_dialog,
    // v2.0.0: LAN P2P File Exchange
    AppState,
    start_lan_sharing,
    stop_lan_sharing,
    get_lan_peers,
    get_lan_sharing_status,
    send_project_to_peer,
    get_pending_transfers,
    accept_transfer,
    reject_transfer,
    // v2.1.0: Wizard Templates
    get_wizard_templates,
    show_wizard_export_dialog,
    show_wizard_import_dialog,
    export_custom_wizards,
    import_custom_wizards,
};

use modules::lan_discovery::DiscoveryState;
use modules::lan_transfer::TransferState;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

fn main() {
    let instance_id = uuid::Uuid::new_v4().to_string();
    let instance_name = modules::lan_discovery::get_machine_name();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            discovery: DiscoveryState::new(),
            transfer: TransferState::new(),
            mdns_daemon: Arc::new(Mutex::new(None)),
            tcp_shutdown: Arc::new(Mutex::new(None)),
            active_connections: Arc::new(Mutex::new(HashMap::new())),
            instance_id,
            instance_name,
        })
        .invoke_handler(tauri::generate_handler![
            generate_prompt_from_text,
            generate_raw_prompt_from_text,
            greet,
            validate_dsl_sequence,
            get_patterns,
            analyze_dsl_patterns,
            save_project,
            load_project,
            create_new_project,
            update_project_timestamp,
            show_open_dialog,
            show_save_dialog,
            show_confirm_dialog,
            set_window_title,
            // Ent: Project Scanning (Tags & Search)
            show_folder_dialog,
            scan_projects_folder,
            // Ent: API Key Management
            save_api_key,
            get_api_key,
            delete_api_key,
            list_api_keys,
            has_api_key,
            // Ent: Direct AI Send
            send_to_ai,
            get_ai_providers,
            // Ent: AI Import Hub
            analyze_text_with_ai,
            // Ent: AI Compare
            send_to_multiple_ai,
// Ent: Export
            show_export_dialog,
            export_prompt,
            export_project,
            // v1.2.0: Template Export/Import
            show_template_export_dialog,
            show_template_import_dialog,
            export_template,
            import_template,
            // v2.0.0: QR Code Sharing
            generate_qr_code,
            save_qr_code,
            decode_qr_code,
            show_qr_open_dialog,
            show_qr_save_dialog,
            // v2.0.0: LAN P2P File Exchange
            start_lan_sharing,
            stop_lan_sharing,
            get_lan_peers,
            get_lan_sharing_status,
            send_project_to_peer,
            get_pending_transfers,
            accept_transfer,
            reject_transfer,
            // v2.1.0: Wizard Templates
            get_wizard_templates,
            show_wizard_export_dialog,
            show_wizard_import_dialog,
            export_custom_wizards,
            import_custom_wizards,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
