import { useDeferredValue, useEffect, useReducer, useState, useTransition } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';

// import { LineChart, Line } from 'recharts';
// import * as d3 from "d3";
// import * as d3Contour from "d3-contour";

import "./App.css";
import { Circle, FortyFiveDegRect, Rect, TestPointsPlot, Triangle } from "./testpoints";
import { settingsReducer } from "./settings";
import { stateReducer } from "./state";
import { HeatMap } from "./heatmap";
import { loadPreset, preset } from "./generate2D";
import { ConfusionMatrixTable } from "./confusionMatrix";
import { COLORS, SHAPES } from "./constants";

const PRESET_1 = preset(1, 15, 0);
const PRESET_2 = preset(2, 15, 0);
const PRESET_3 = preset(3, 15, 0);
const PRESET_4 = preset(4, 15, 0);
const PRESET_5 = preset(5, 15, 0);
const PRESET_6 = preset(6, 15, 0);
const PRESET_7 = preset(7, 15, 0);
const PRESET_8 = preset(8, 15, 0);
const PRESET_9 = preset(9, 15, 0);
const PRESET_10 = preset(10, 15, 0);
// const TWO_CLASSES = getTestPointsTowClasses();
// const THREE_CLASSES = getTestPointsThreeClasses();
// const SIX_CLASSES = getTestPointsSixClasses();
// const NINE_CLASSES = getTestPointsNineClasses();

interface EpochStats {
  mse: number | null;
  mseValidation: number | null;
  epoch: number | null;
  crossEntropyLoss: number | null;
  confusionMatrix: number[][] | null;
  predicted: number[] | null;
}

function App() {

  const [settings, dispatchSettings] = useReducer(settingsReducer, {
    layersCount: 2,
    hiddenLayers: [
      { neuronsCount: 16, activationFunction: "relu" },
      { neuronsCount: 8, activationFunction: "relu" },
    ],
    outputLayer: { neuronsCount: 2, activationFunction: "softmax" },
    alpha: 0.03,
    maxEpochs: 500,
    desiredMse: 0.01,
    trainingData: preset(8, 56, 0), // 70%
    validationData: preset(8, 12, 0), // 15%
    testingData: preset(8, 12, 0), // 15%
    noise: 0,
    density: 80,
    preset: 8,
    scale: [3, 3],
  });

  const [state, dispatchState] = useReducer(stateReducer, {
    mse: null,
    mseValidation: null,
    epoch: null,
    confusionMatrix: null,
    crossEntropyLoss: null,
    predicted: null,
    isLearning: false,
  });


  const [_isPending, startTransition] = useTransition();

  const [heatmapData, setHeatmapData] = useState<number[]>([]);
  const [showValidationPoints, setShowValidationPoints] = useState(false);
  const [showTestingPoints, setShowTestingPoints] = useState(false);

  const deferredHeatmapData = useDeferredValue(heatmapData);


  useEffect(() => {
    let epochUnlisten = listen<EpochStats>("EPOCH", (event) => {
      startTransition(() => {
        dispatchState({ type: "SET_MSE", payload: { mse: event.payload.mse } });
        dispatchState({ type: "SET_MSE_VALIDATION", payload: { mseValidation: event.payload.mseValidation } });
        dispatchState({ type: "SET_EPOCH", payload: { epoch: event.payload.epoch } });
        dispatchState({ type: "SET_CROSS_ENTROPY_LOSS", payload: { crossEntropyLoss: event.payload.crossEntropyLoss } });
        dispatchState({ type: "SET_CONFUSION_MATRIX", payload: { confusionMatrix: event.payload.confusionMatrix } });
        dispatchState({ type: "SET_PREDICTED", payload: { predicted: event.payload.predicted } });
      });
    });

    let crossEntropyLossUnlisten = listen<number>("CROSS_ENTROPY_LOSS", (event) => {
      dispatchState({ type: "SET_CROSS_ENTROPY_LOSS", payload: { crossEntropyLoss: event.payload } });
    });
    // listen to mse event from rust and update mse
    // listen to output event from rust and update heatmapData
    let heatmapUnlestin = listen<number[][]>("HEATMAP", (event) => {
      let heatmapData = event.payload.map((r: number[], _index: number) => {
        let clz = r.reduce(({ clz, max }, value, index) => {
          if (value > max) {
            // val = index + value;
            // return { clz: index, max: value };
            return { clz: index, max: value };
          }
          return { clz, max };
        }, { clz: 0, max: -100 });

        return clz.clz + (1 - clz.max);
        // return clz.clz;
      });

      startTransition(() => setHeatmapData(heatmapData));
      // setHeatmapData(heatmapData);
    });

    let predictedUnlisten = listen<number[]>("PREDICTED", (event) => {
      dispatchState({ type: "SET_PREDICTED", payload: { predicted: event.payload } });
    });

    let confusionMatrixUnlisten = listen("CONFUSION_MATRIX", (event) => {
      // console.log("CONFUSION_MATRIX", event.payload);
      dispatchState({ type: "SET_CONFUSION_MATRIX", payload: { confusionMatrix: event.payload } });
    });

    let isRunningUnlisten = listen<boolean>("IS_LEARNING", (event) => {
      dispatchState({ type: "SET_IS_LEARNING", payload: { isLearning: event.payload } });
    });

    return () => {
      epochUnlisten.then(f => f());
      crossEntropyLossUnlisten.then(f => f());
      heatmapUnlestin.then(f => f());
      confusionMatrixUnlisten.then(f => f());
      predictedUnlisten.then(f => f());
      isRunningUnlisten.then(f => f());
    };
  }, [])

  useEffect(() => {
    // invoke reset command to initialize the state
    invoke("reset", { settings: settings });

  }, [settings]);

  async function loadCustomTrainingData() {
    const result = await open({ directory: false, multiple: false });
    if (result) {
      let data: number[][] = await invoke("load_custom_data", { path: result });
      // get the min and max of x and y
      let xMin = Math.min(...data.map(d => d[0]));
      let xMax = Math.max(...data.map(d => d[0]));
      let yMin = Math.min(...data.map(d => d[1]));
      let yMax = Math.max(...data.map(d => d[1]));
      // scale the data to [0, 100]
      data = data.map(d => {
        let x = (d[0] - xMin) / (xMax - xMin) * 100;
        let y = (d[1] - yMin) / (yMax - yMin) * 100;
        return [x, y, ...d.slice(2)];
      });
      // split the data per output class and shuffle
      let classes = Array.from(new Set(data.map(d => d.slice(2).indexOf(1))));
      let dataPerClass = classes.map(clz => data.filter(d => d.slice(2).indexOf(1) === clz));
      // devide each class data between 70% training, 15% validation and 15% testing
      let trainingData: number[][] = [];
      let validationData: number[][] = [];
      let testingData: number[][] = [];
      dataPerClass.forEach(d => {
        // shuffle the data
        d = d.sort(() => Math.random() - 0.5);
        let training = d.slice(0, Math.floor(d.length * 0.7));
        let validation = d.slice(Math.floor(d.length * 0.7), Math.floor(d.length * 0.85));
        let testing = d.slice(Math.floor(d.length * 0.85));
        trainingData = trainingData.concat(training);
        validationData = validationData.concat(validation);
        testingData = testingData.concat(testing);
      });
      // shuffle the data
      // devide data between 70% training, 15% validation and 15% testing
      // let trainingData = data.slice(0, Math.floor(data.length * 0.7));
      // let validationData = data.slice(Math.floor(data.length * 0.7), Math.floor(data.length * 0.85));
      // let testingData = data.slice(Math.floor(data.length * 0.85));
      dispatchSettings({ type: "SET_TRAINING_DATA", payload: { trainingData: trainingData } });
      dispatchSettings({ type: "SET_VALIDATION_DATA", payload: { validationData: validationData } });
      dispatchSettings({ type: "SET_TESTING_DATA", payload: { testingData: testingData } });
    }
  }


  async function stop() {
    await invoke("stop");
  }

  async function learn() {
    // reset heatMapData and mse
    await invoke("reset", { settings: settings });

    invoke("learn", {
      maxEpochCount: settings.maxEpochs,
      desiredMse: settings.desiredMse,
    })
  }

  return (
    <div className="flex justify-stretch items-stretch gap-3 h-screen overflow-hidden p-3 select-none">
      <div className="bg-gray-100 p-3 w-[300px] grid grid-cols-2 gap-3 content-start">
        <div className="flex flex-col gap-2">
          <div className="text-center">Density</div>
          <input type="range" min={40} max={120} step={1} className="slider" value={settings.density} onChange={(e) => {
            loadPreset(dispatchSettings, settings.preset, settings.density, settings.noise);
            dispatchSettings({ type: "SET_DENSITY", payload: { density: +e.target.value } })
          }
          } />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-center">Noise</div>
          <input type="range" min={0} max={10} step={0.5} className="slider" value={settings.noise} onChange={(e) => {
            loadPreset(dispatchSettings, settings.preset, settings.density, settings.noise);
            dispatchSettings({ type: "SET_NOISE", payload: { noise: +e.target.value } })
          }
          } />
        </div>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 1, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_1} bigPoints />
        </button>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 2, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_2} bigPoints />
        </button>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 3, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_3} bigPoints />
        </button>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 4, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_4} bigPoints />
        </button>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 5, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_5} bigPoints />
        </button>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 6, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_6} bigPoints />
        </button>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 7, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_7} bigPoints />
        </button>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 8, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_8} bigPoints />
        </button>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 9, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_9} bigPoints />
        </button>
        <button className="aspect-square bg-white w-full" onClick={_ => loadPreset(dispatchSettings, 10, settings.density, settings.noise)}>
          <TestPointsPlot trainingPoints={PRESET_10} bigPoints />
        </button>
        <button className="col-span-2 py-2.5 px-1.5 text-white bg-gray-600 hover:bg-gray-700 uppercase" onClick={loadCustomTrainingData}>Load from Excel</button>
      </div>
      <main className="h-screen overflow-auto w-full">
        <div className="bg-gray-100 p-3 w-full mb-3">
          <div className="grid grid-cols-6 gap-2 items-end">
            <div className="flex flex-col items-stretch gap-2">
              <div className="text-center">Max Epochs</div>
              <input type="number" value={settings.maxEpochs} onChange={(e) => dispatchSettings({ type: "SET_MAX_EPOCHS", payload: { maxEpochs: +e.target.value } })} />
            </div>
            <div className="flex flex-col items-stretch gap-2">
              <div className="text-center">Desired MSE</div>
              <input type="number" value={settings.desiredMse} onChange={(e) => dispatchSettings({ type: "SET_DESIRED_MSE", payload: { desiredMse: +e.target.value } })} />
            </div>
            <div className="flex flex-col items-stretch gap-2">
              <div className="text-center">Alpha</div>
              <select value={settings.alpha} onChange={(e) => dispatchSettings({ type: "SET_ALPHA", payload: { alpha: +e.target.value } })}>
                <option value="0.0001">0.0001</option>
                <option value="0.001">0.001</option>
                <option value="0.003">0.003</option>
                <option value="0.005">0.005</option>
                <option value="0.01">0.01</option>
                <option value="0.02">0.02</option>
                <option value="0.03">0.03</option>
                <option value="0.05">0.05</option>
                <option value="0.07">0.07</option>
                <option value="0.1">0.1</option>
                <option value="0.2">0.2</option>
              </select>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              <div className="text-center">Output Layer</div>
              <select value={settings.outputLayer.activationFunction} onChange={(e) => dispatchSettings({ type: "SET_OUTPUT_LAYER_ACTIVATION", payload: { activationFunction: e.target.value } })}>
                <option value="softmax">Softmax</option>
                <option value="tanh">Tanh</option>
                <option value="sigmoid">Sigmoid</option>
              </select>
            </div>
            <div className="col-span-2 flex justify-end items-end gap-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  learn();
                }}
              >
                <button type="submit" className="px-2.5 py-1.5 text-white bg-blue-600 hover:bg-blue-700 uppercase">Learn</button>
              </form>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  stop();
                }}
              >
                <button type="submit" className="px-2.5 py-1.5 text-white bg-red-600 hover:bg-red-700 uppercase">Stop</button>
              </form>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 p-3 w-full mb-3">
          <div className="flex justify-center items-center gap-2 mb-3">
            <button type="button" className="h-6 w-6 rounded-full bg-gray-300 hover:bg-gray-400"
              onClick={() => dispatchSettings({ type: "REMOVE_LAYER" })}>-</button>
            <div className="text-lg text-center uppercase">{settings.layersCount} Hidden Layers</div>
            <button type="button" className="h-6 w-6 rounded-full bg-gray-300 hover:bg-gray-400"
              onClick={() => dispatchSettings({ type: "ADD_LAYER" })}>+</button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {settings.hiddenLayers.map((layer, index) => (
              <div key={index} className="flex flex-col items-stretch gap-2">
                <div className="text-center">L{index + 1}</div>
                <select value={layer.activationFunction} onChange={(e) => dispatchSettings({ type: "SET_LAYERS_ACTIVATION", payload: { layer: index, activationFunction: e.target.value } })}>
                  <option value="tanh">Tanh</option>
                  <option value="sigmoid">Sigmoid</option>
                  <option value="relu">Relu</option>
                  <option value="leakyRelu">Leaky Relu</option>
                </select>
                <select value={layer.neuronsCount} onChange={(e) => dispatchSettings({ type: "SET_LAYERS_NEURONS", payload: { layer: index, neuronsCount: +e.target.value } })}>
                  {Array.from({ length: 129 }, (_x, i) => i).slice(1).map(i => (
                    <option key={i} value={i}>{`${i} Neuron`}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-100 p-3 w-full mb-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-stretch gap-2">
              <div>Epoch</div>
              <div>{state.epoch === null ? '-' : state.epoch}</div>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              <div>MSE (TRAINING)</div>
              <div>{state.mse === null ? '-' : state.mse}</div>
            </div>
            <div className="flex flex-col items-stretch gap-2">
              <div>MSE (VALIDATION)</div>
              <div>{state.mseValidation === null ? '-' : state.mseValidation}</div>
            </div>
          </div>
        </div>
        <div className="flex items-stretch gap-3">
          <div className="width-[300px]">
            <div className="w-[300px] h-[300px] relative">
              {heatmapData.length > 0 && (
                <HeatMap data={deferredHeatmapData} />
              )}
              {settings.trainingData.length > 0 && (
                <div className="absolute inset-0">
                  <TestPointsPlot trainingPoints={settings.trainingData}
                    validationPoints={settings.validationData} showValidationPoints={showValidationPoints}
                    testingPoints={settings.testingData} showTestingPoints={showTestingPoints}
                    predictEnabled={state.isLearning == false}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-start items-center gap-3 mt-3 w-[300px]">
              <div className="ml-auto flex items-center gap-2">
                <input id="testing_set_input" type="checkbox" checked={showTestingPoints} onChange={(e) => setShowTestingPoints(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                <label htmlFor="testing_set_input">Testing Set</label>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <input id="validation_set_input" type="checkbox" checked={showValidationPoints} onChange={(e) => setShowValidationPoints(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                <label htmlFor="validation_set_input">Validation Set</label>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 p-3 w-full mb-3">
            <div className="flex flex-col items-stretch gap-2">
              <div className="text-center">CROSS ENTROPY LOSS (TEST)</div>
              <div className="text-center">{state.crossEntropyLoss === null ? '-' : state.crossEntropyLoss}</div>
              <div className="text-center">CONFUSION MATRIX (TEST)</div>
              <ConfusionMatrixTable confusionMatrix={state.confusionMatrix || []} />
            </div>
          </div>
        </div>
        <div className="bg-gray-100 p-3 w-full mb-3">
          <div className="flex flex-col items-stretch gap-2">
            <div className="text-center">PREDICTED CLASSES</div>
            {state.predicted === null ? (
              state.isLearning == false ? (
                <div className="text-center">
                  To test the model, click on the <strong>Heatmap</strong> to predict the classes.
                </div>
              ) : (
                <div className="text-center">
                  The model is running...
                </div>
              )

            ) : (
              <div className="grid grid-cols-3 gap-2">
                {state.predicted.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <svg className="w-[16px] h-[16px] inline-block mr-2 shrink-0" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                      {SHAPES[i] === "circle" && <Circle f={() => 7} point={{ x: 8, y: 8, color: COLORS[i], shape: "circle" }} pointType="training" />}
                      {SHAPES[i] === "rect" && <Rect f={() => 7} point={{ x: 8, y: 8, color: COLORS[i], shape: "rect" }} pointType="training" />}
                      {SHAPES[i] === "triangle" && <Triangle f={() => 7} point={{ x: 8, y: 8, color: COLORS[i], shape: "triangle" }} pointType="training" />}
                      {SHAPES[i] === "45degrect" && <FortyFiveDegRect f={() => 7} point={{ x: 8, y: 8, color: COLORS[i], shape: "45degrect" }} pointType="training" />}
                    </svg>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main >

    </div >
  );
}



export default App;
