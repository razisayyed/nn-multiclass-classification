use calamine::{open_workbook, DataType, HeaderRow, Reader, Xlsx};
use lazy_static::lazy_static;
use rayon::prelude::*;
use std::{sync::RwLock, thread::sleep, time::Duration};
use tauri::{AppHandle, Builder, Emitter, Manager};

use nn::{activation_functions::ActivationFunction, layer::LayerType, NeuralNetwork};

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
    static ref DEFAULT_NN: NeuralNetwork = NeuralNetwork::new::<f64, f64>(
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
    static ref DEFAULT_STATS: ClientState = ClientState {
        is_learning: false,
        epoch: None,
        mse: None,
        mse_validation: None,
        mse_history: None,
        mse_validation_history: None,
        cross_entropy_loss: None,
        confusion_matrix: None,
        predicted: None,
        parameters: None,
        heatmap: Some(get_dummy_heatmap_data()),
    };
}

// static HEATMAP_DATA: &'static str = include_str!("../heatmap.json");

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ClientState {
    is_learning: bool,
    mse: Option<f64>,
    mse_validation: Option<f64>,
    mse_history: Option<Vec<f64>>,
    mse_validation_history: Option<Vec<f64>>,
    epoch: Option<usize>,
    confusion_matrix: Option<Vec<Vec<usize>>>,
    cross_entropy_loss: Option<f64>,
    predicted: Option<Vec<f64>>,
    parameters: Option<Vec<Vec<(Vec<f64>, f64, LayerType)>>>,
    heatmap: Option<Vec<Vec<f64>>>,
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

    state.client_state = DEFAULT_STATS.clone();
    reset_client_state(&app, Some(&state.client_state));

    Ok(())
}

#[tauri::command]
async fn stop(app: AppHandle) -> Result<(), String> {
    {
        let state = app.state::<RwLock<AppState>>();
        let mut state = state.write().unwrap();
        state.client_state.is_learning = false;
    }
    // allow the learn function to break the loop
    sleep(Duration::from_millis(100));
    {
        let state = app.state::<RwLock<AppState>>();
        let mut state = state.write().unwrap();
        state.client_state.confusion_matrix = Some(state.nn.confusion_matrix());
        state.client_state.cross_entropy_loss = Some(state.nn.cross_entropy_loss());
        state.client_state.parameters = Some(state.nn.get_parameters());
        app.emit("UPDATE_CLIENT_STATE", state.client_state.clone())
            .unwrap();
    }
    Ok(())
}

#[tauri::command]
async fn learn(app: AppHandle, max_epoch_count: usize, desired_mse: f64) -> Result<(), String> {
    {
        // aquire the state and update the training data
        let state = app.state::<RwLock<AppState>>();
        let mut state = state.write().unwrap();
        state.client_state = DEFAULT_STATS.clone();
        state.client_state.is_learning = true;
        reset_client_state(&app, Some(&state.client_state));
        // state aquiration ends here
    }

    let _ = (0..=max_epoch_count).into_iter().try_for_each(|epoch| {
        {
            let state = app.state::<RwLock<AppState>>();
            let mut state = state.write().unwrap();
            if state.client_state.is_learning == false {
                return Err("Learning stopped!".to_string());
            }

            let (mse, mse_validation) = state.nn.epoch();
            state.client_state.epoch = Some(epoch);
            state.client_state.mse = Some(mse);
            state.client_state.mse_validation = Some(mse_validation);
            if let Some(v) = state.client_state.mse_history.as_mut() {
                v.push(mse);
            } else {
                state.client_state.mse_history = Some(vec![mse]);
            }
            if let Some(v) = state.client_state.mse_validation_history.as_mut() {
                v.push(mse_validation);
            } else {
                state.client_state.mse_validation_history = Some(vec![mse_validation]);
            }
            state.client_state.heatmap = Some(get_heatmap_data(&state.nn));
            app.emit("UPDATE_CLIENT_STATE", &state.client_state)
                .unwrap();
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
        let mut state = state.write().unwrap();
        let confusion_matrix = state.nn.confusion_matrix();
        state.client_state = ClientState {
            is_learning: false,
            confusion_matrix: Some(confusion_matrix),
            cross_entropy_loss: Some(state.nn.cross_entropy_loss()),
            parameters: Some(state.nn.get_parameters()),
            ..state.client_state.clone()
        };
        app.emit("UPDATE_CLIENT_STATE", state.client_state.clone())
            .unwrap();
        // state aquiration ends here
    }

    Ok(())
}

#[tauri::command]
async fn load_custom_data(app: AppHandle, path: String) -> Result<Vec<Vec<f64>>, String> {
    reset_client_state(&app, None);
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
    let mut state = state.write().unwrap();
    state.client_state.predicted = Some(state.nn.predict(&inputs));
    app.emit("UPDATE_CLIENT_STATE", state.client_state.clone())
        .unwrap();

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

fn reset_client_state(app: &AppHandle, stats: Option<&ClientState>) {
    app.emit(
        "UPDATE_CLIENT_STATE",
        stats.unwrap_or(&DEFAULT_STATS.clone()),
    )
    .unwrap();
}

struct AppState {
    nn: NeuralNetwork,
    client_state: ClientState,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .setup(|app| {
            let nn = DEFAULT_NN.clone();
            let state = AppState {
                nn,
                client_state: DEFAULT_STATS.clone(),
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
