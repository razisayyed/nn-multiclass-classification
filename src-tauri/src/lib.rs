use calamine::{open_workbook, DataType, HeaderRow, Reader, Xlsx};
use rayon::prelude::*;
use std::{sync::RwLock, thread::sleep, time::Duration};
use tauri::{AppHandle, Builder, Emitter, Manager};

use nn::{activation_functions::ActivationFunction, NeuralNetwork};

mod nn;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct EpochStats {
    epoch: Option<usize>,
    mse: Option<f64>,
    mse_validation: Option<f64>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SettingsLayer {
    neurons_count: u32,
    activation_function: ActivationFunction,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct Settings {
    layers_count: usize,
    hidden_layers: Vec<SettingsLayer>,
    output_layer: SettingsLayer,
    alpha: f64,
    max_epochs: usize,
    training_data: Vec<Vec<f64>>,
    validation_data: Vec<Vec<f64>>,
    testing_data: Vec<Vec<f64>>,
    noise: f64,
    density: f64,
}

#[tauri::command]
async fn reset(app: AppHandle, settings: Settings) -> Result<(), String> {
    // aquire the state
    let state = app.state::<RwLock<AppState>>();
    let mut state = state.write().unwrap();

    state.is_learning = false;

    let hidden_layers_topology = settings
        .hidden_layers
        .iter()
        .map(|l| l.neurons_count)
        .collect::<Vec<_>>();

    let hidden_layers_activation_functions = settings
        .hidden_layers
        .iter()
        .map(|l| l.activation_function)
        .collect::<Vec<_>>();

    state.nn = NeuralNetwork::new(
        2,
        hidden_layers_topology,
        &hidden_layers_activation_functions,
        settings.output_layer.neurons_count,
        settings.output_layer.activation_function,
        settings.alpha,
        settings
            .training_data
            .into_iter()
            .map(|v| {
                let x = v.split_at(2);
                (x.0.to_vec(), x.1.to_vec())
            })
            .collect::<Vec<_>>(),
        settings
            .validation_data
            .into_iter()
            .map(|v| {
                let x = v.split_at(2);
                (x.0.to_vec(), x.1.to_vec())
            })
            .collect::<Vec<_>>(),
        settings
            .testing_data
            .into_iter()
            .map(|v| {
                let x = v.split_at(2);
                (x.0.to_vec(), x.1.to_vec())
            })
            .collect::<Vec<_>>(),
    );

    // update the heatmap
    // let output = get_heatmap_data(&state.nn);
    let heatmap = get_dummy_heatmap_data();
    app.emit("HEATMAP", heatmap).unwrap();
    app.emit(
        "EPOCH",
        EpochStats {
            epoch: None,
            mse: None,
            mse_validation: None,
        },
    )
    .unwrap();
    let confusion_matrix: Option<Vec<Vec<usize>>> = None;
    app.emit("CONFUSION_MATRIX", confusion_matrix).unwrap();

    Ok(())
}

#[tauri::command]
async fn stop(app: AppHandle) -> Result<(), String> {
    let state = app.state::<RwLock<AppState>>();
    let mut state = state.write().unwrap();
    state.is_learning = false;
    let confusion_matrix = state.nn.confusion_matrix();
    app.emit("CONFUSION_MATRIX", confusion_matrix).unwrap();
    Ok(())
}

#[tauri::command]
async fn learn(app: AppHandle, max_epoch_count: usize) -> Result<(), String> {
    {
        // aquire the state and update the training data
        let state = app.state::<RwLock<AppState>>();
        let mut state = state.write().unwrap();
        state.is_learning = true;
        // state aquiration ends here
    }

    let _ = (0..=max_epoch_count).into_iter().try_for_each(|epoch| {
        {
            let state = app.state::<RwLock<AppState>>();
            let mut state = state.write().unwrap();
            if state.is_learning == false {
                return Err("Learning stopped!".to_string());
            }

            let (mse, mse_validation) = state.nn.epoch();
            app.emit(
                "EPOCH",
                EpochStats {
                    epoch: Some(epoch),
                    mse: Some(mse),
                    mse_validation: Some(mse_validation),
                },
            )
            .unwrap();
            let heatmap = get_heatmap_data(&state.nn);
            app.emit("HEATMAP", heatmap).unwrap();
        }
        // allow the frontend to invoke stop command
        sleep(Duration::from_millis(1));
        Ok(())
    });

    {
        // aquire the state and update the training data
        let state = app.state::<RwLock<AppState>>();
        let state = state.read().unwrap();
        let confusion_matrix = state.nn.confusion_matrix();
        app.emit("CONFUSION_MATRIX", Some(confusion_matrix))
            .unwrap();
        // state aquiration ends here
    }
    Ok(())
}

#[tauri::command]
async fn load_custom_data(path: String) -> Result<Vec<Vec<f64>>, String> {
    let mut workbook: Xlsx<_> = open_workbook(path).expect("Cannot open file");
    if let Ok(range) = workbook
        .with_header_row(HeaderRow::FirstNonEmptyRow)
        .worksheet_range("Sheet1")
    {
        let data = range
            .rows()
            .map(|row| {
                row.iter()
                    .map(|cell| cell.as_f64().unwrap_or(-1.0))
                    .collect::<Vec<_>>()
            })
            .filter(|row| row.iter().all(|x| *x != -1.0))
            .collect::<Vec<_>>();
        return Ok(data);
    }

    Err("Cannot load data".to_string())
}

fn get_heatmap_data(nn: &NeuralNetwork<f64, f64>) -> Vec<Vec<f64>> {
    (0..2500)
        .into_par_iter()
        .map(|x| {
            let x1 = ((x as f64) / 50.0).floor() / 50.0;
            let x2 = (x as f64) % 50.0 / 50.0;
            vec![x1, x2]
        })
        .map(|inputs| nn.predict(inputs))
        .collect::<Vec<_>>()
}

fn get_dummy_heatmap_data() -> Vec<Vec<f64>> {
    (0..2500)
        .into_par_iter()
        .map(|_| vec![0.0, 0.0])
        .collect::<Vec<_>>()
}

struct AppState {
    nn: NeuralNetwork<f64, f64>,
    is_learning: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .setup(|app| {
            let nn = NeuralNetwork::<f64, f64>::new(
                2,
                vec![16, 8],
                &[ActivationFunction::Tanh, ActivationFunction::Tanh],
                2,
                ActivationFunction::Tanh,
                0.1,
                vec![],
                vec![],
                vec![],
            );
            let state = AppState {
                nn,
                is_learning: false,
            };
            app.manage(RwLock::new(state));
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            reset,
            learn,
            stop,
            load_custom_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
