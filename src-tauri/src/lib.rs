use base64;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Voice {
    id: String,
    name: String,
    voice_id: String,
    created_at: String,
}

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn minimize_app(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn save_voice(voice: Voice) -> Result<(), String> {
    let data_dir = dirs::data_dir().ok_or_else(|| "Failed to get data directory".to_string())?;

    let voices_dir = data_dir.join("Dabroke").join("voices");
    if !voices_dir.exists() {
        fs::create_dir_all(&voices_dir)
            .map_err(|e| format!("Failed to create voices directory: {}", e))?;
    }

    let voices_path = voices_dir.join("voices.json");
    let mut voices = if voices_path.exists() {
        let voices_json = fs::read_to_string(&voices_path)
            .map_err(|e| format!("Failed to read voices file: {}", e))?;
        serde_json::from_str::<Vec<Voice>>(&voices_json)
            .map_err(|e| format!("Failed to parse voices JSON: {}", e))?
    } else {
        Vec::new()
    };

    if let Some(index) = voices.iter().position(|v| v.id == voice.id) {
        voices[index] = voice;
    } else {
        voices.push(voice);
    }

    let voices_json = serde_json::to_string_pretty(&voices)
        .map_err(|e| format!("Failed to serialize voices: {}", e))?;

    fs::write(&voices_path, voices_json)
        .map_err(|e| format!("Failed to write voices file: {}", e))?;

    Ok(())
}

#[tauri::command]
fn get_voices() -> Result<Vec<Voice>, String> {
    let data_dir = dirs::data_dir().ok_or_else(|| "Failed to get data directory".to_string())?;

    let voices_path = data_dir.join("Dabroke").join("voices").join("voices.json");
    if !voices_path.exists() {
        return Ok(Vec::new());
    }

    let voices_json = fs::read_to_string(&voices_path)
        .map_err(|e| format!("Failed to read voices file: {}", e))?;

    serde_json::from_str::<Vec<Voice>>(&voices_json)
        .map_err(|e| format!("Failed to parse voices JSON: {}", e))
}

#[tauri::command]
fn delete_voice(id: String) -> Result<(), String> {
    let data_dir = dirs::data_dir().ok_or_else(|| "Failed to get data directory".to_string())?;

    let voices_path = data_dir.join("Dabroke").join("voices").join("voices.json");
    if !voices_path.exists() {
        return Ok(());
    }

    let voices_json = fs::read_to_string(&voices_path)
        .map_err(|e| format!("Failed to read voices file: {}", e))?;

    let mut voices = serde_json::from_str::<Vec<Voice>>(&voices_json)
        .map_err(|e| format!("Failed to parse voices JSON: {}", e))?;

    voices.retain(|v| v.id != id);

    let updated_json = serde_json::to_string_pretty(&voices)
        .map_err(|e| format!("Failed to serialize voices: {}", e))?;

    fs::write(&voices_path, updated_json)
        .map_err(|e| format!("Failed to write voices file: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn save_audio(audio_data: Vec<u8>, filename: String) -> Result<String, String> {
    let downloads_dir =
        dirs::download_dir().ok_or_else(|| "Failed to get downloads directory".to_string())?;

    let dabroken_voices_dir = downloads_dir.join("Dabroken Voices");
    if !dabroken_voices_dir.exists() {
        fs::create_dir_all(&dabroken_voices_dir)
            .map_err(|e| format!("Failed to create Dabroken Voices directory: {}", e))?;
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let timestamped_filename = if filename.contains('.') {
        let parts: Vec<&str> = filename.rsplitn(2, '.').collect();
        format!("{}_{}.{}", parts[1], timestamp, parts[0])
    } else {
        format!("{}_{}.mp3", filename, timestamp)
    };

    let mut file_path = dabroken_voices_dir.join(&timestamped_filename);
    let mut counter = 1;

    while file_path.exists() {
        let stem = std::path::Path::new(&timestamped_filename)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("audio");
        let extension = std::path::Path::new(&timestamped_filename)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("mp3");

        let new_filename = format!("{}_{}.{}", stem, counter, extension);
        file_path = dabroken_voices_dir.join(new_filename);
        counter += 1;
    }

    fs::write(&file_path, audio_data).map_err(|e| format!("Failed to write file: {}", e))?;

    println!("Audio file saved to: {}", file_path.display());
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn save_audio_from_base64(base64_data: String, filename: String) -> Result<String, String> {
    use base64::Engine;
    let engine = base64::engine::general_purpose::STANDARD;
    let audio_data = engine
        .decode(&base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    save_audio(audio_data, filename).await
}

#[tauri::command]
async fn open_voices_folder() -> Result<(), String> {
    let downloads_dir =
        dirs::download_dir().ok_or_else(|| "Failed to get downloads directory".to_string())?;

    let dabroken_voices_dir = downloads_dir.join("Dabroken Voices");

    if !dabroken_voices_dir.exists() {
        fs::create_dir_all(&dabroken_voices_dir)
            .map_err(|e| format!("Failed to create Dabroken Voices directory: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&dabroken_voices_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            close_app,
            minimize_app,
            save_voice,
            get_voices,
            delete_voice,
            save_audio,
            save_audio_from_base64,
            open_voices_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
