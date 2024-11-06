use calamine::{open_workbook, DataType, HeaderRow, Reader, Xlsx};
use lazy_static::lazy_static;
use rayon::prelude::*;
use std::{sync::RwLock, thread::sleep, time::Duration};
use tauri::{AppHandle, Builder, Emitter, Manager};

use nn::{activation_functions::ActivationFunction, NeuralNetwork};

mod nn;

lazy_static! {
    static ref HEATMAP_DATA: Vec<Vec<f64>> = {
        let mut data = Vec::new();
        for i in 0..2500 {
            let x1 = (i as f64) % 50.0 * 2.0;
            let x2 = ((i as f64) / 50.0 * 2.0).floor();
            data.push(vec![x1, x2]);
        }
        data
    };
}

// static HEATMAP_DATA: &'static str = include_str!("../heatmap.json");

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct EpochStats {
    mse: Option<f64>,
    mse_validation: Option<f64>,
    epoch: Option<usize>,
    confusion_matrix: Option<Vec<Vec<usize>>>,
    cross_entropy_loss: Option<f64>,
    predicted: Option<Vec<f64>>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SettingsLayer {
    neurons_count: usize,
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
    desired_mse: f64,
    training_data: Vec<Vec<f64>>,
    validation_data: Vec<Vec<f64>>,
    testing_data: Vec<Vec<f64>>,
    noise: f64,
    density: f64,
    scale: (f64, f64),
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

    reset_client_state(&app, false);

    Ok(())
}

#[tauri::command]
async fn stop(app: AppHandle) -> Result<(), String> {
    let state = app.state::<RwLock<AppState>>();
    let mut state = state.write().unwrap();
    state.is_learning = false;
    let confusion_matrix = state.nn.confusion_matrix();
    app.emit("CONFUSION_MATRIX", confusion_matrix).unwrap();
    let cross_entropy_loss = state.nn.cross_entropy_loss();
    app.emit("CROSS_ENTROPY_LOSS", cross_entropy_loss).unwrap();
    app.emit("IS_LEARNING", false).unwrap();
    Ok(())
}

#[tauri::command]
async fn learn(app: AppHandle, max_epoch_count: usize, desired_mse: f64) -> Result<(), String> {
    {
        reset_client_state(&app, true);
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
                    // do we need cross_entropy_loss here?
                    cross_entropy_loss: None,
                    // do we need confusion_matrix here?
                    confusion_matrix: None,
                    predicted: None,
                },
            )
            .unwrap();
            let heatmap = get_heatmap_data(&state.nn);
            app.emit("HEATMAP", heatmap).unwrap();
            if mse <= desired_mse {
                return Err("Desired MSE reached!".to_string());
            }
            // state aquiration ends here
        }
        // allow the frontend to invoke stop/reset commands
        sleep(Duration::from_nanos(1000));
        Ok(())
    });

    {
        // aquire the state and update the training data
        let state = app.state::<RwLock<AppState>>();
        let state = state.read().unwrap();
        let confusion_matrix = state.nn.confusion_matrix();
        app.emit("CONFUSION_MATRIX", Some(confusion_matrix))
            .unwrap();
        let cross_entropy_loss = state.nn.cross_entropy_loss();
        app.emit("CROSS_ENTROPY_LOSS", cross_entropy_loss).unwrap();
        // state aquiration ends here
    }

    app.emit("IS_LEARNING", false).unwrap();

    Ok(())
}

#[tauri::command]
async fn load_custom_data(app: AppHandle, path: String) -> Result<Vec<Vec<f64>>, String> {
    reset_client_state(&app, false);
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

#[tauri::command]
async fn predict(app: AppHandle, inputs: Vec<f64>) -> Result<(), String> {
    let state = app.state::<RwLock<AppState>>();
    let state = state.read().unwrap();
    let outputs = state.nn.predict(&inputs);

    app.emit("PREDICTED", outputs).unwrap();

    Ok(())
}

fn get_heatmap_data(nn: &NeuralNetwork) -> Vec<Vec<f64>> {
    HEATMAP_DATA
        .par_iter()
        .map(|inputs| nn.predict(inputs))
        .collect::<Vec<_>>()
}

fn get_dummy_heatmap_data() -> Vec<Vec<f64>> {
    (0..2500)
        .into_par_iter()
        .map(|_| vec![0.0, 0.0])
        .collect::<Vec<_>>()
}

fn reset_client_state(app: &AppHandle, is_running: bool) {
    let heatmap: Vec<Vec<f64>> = get_dummy_heatmap_data();
    app.emit("HEATMAP", heatmap).unwrap();
    app.emit(
        "EPOCH",
        EpochStats {
            epoch: None,
            mse: None,
            mse_validation: None,
            cross_entropy_loss: None,
            confusion_matrix: None,
            predicted: None,
        },
    )
    .unwrap();
    app.emit::<Option<Vec<Vec<usize>>>>("CONFUSION_MATRIX", None)
        .unwrap();
    app.emit::<Option<f64>>("CROSS_ENTROPY_LOSS", None).unwrap();
    app.emit("IS_LEARNING", is_running).unwrap();
}

struct AppState {
    nn: NeuralNetwork,
    is_learning: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .setup(|app| {
            let nn = NeuralNetwork::new::<f64, f64>(
                2,
                vec![8, 4],
                &[ActivationFunction::Relu, ActivationFunction::Relu],
                2,
                ActivationFunction::Softmax,
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
            load_custom_data,
            predict
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
