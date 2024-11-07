import { preset } from "./generate2D";

export interface Settings {
    layersCount: number;
    hiddenLayers: {
        neuronsCount: number;
        activationFunction: string;
    }[];
    outputLayer: {
        neuronsCount: number;
        activationFunction: string;
    }
    alpha: number;
    maxEpochs: number;
    desiredMse: number;
    // validationRatio: number;
    // testingRatio: number;
    trainingData: number[][];
    validationData: number[][];
    testingData: number[][];
    noise: number;
    density: number;
    preset: number | null;
    scale: [number, number];
}

export const initialSettings: Settings = {
    layersCount: 2,
    hiddenLayers: [
        { neuronsCount: 16, activationFunction: "relu" },
        { neuronsCount: 8, activationFunction: "relu" },
    ],
    outputLayer: { neuronsCount: 2, activationFunction: "softmax" },
    alpha: 0.03,
    maxEpochs: 500,
    desiredMse: 0.01,
    trainingData: preset(9, 56, 0), // 70%
    validationData: preset(9, 12, 0), // 15%
    testingData: preset(9, 12, 0), // 15%
    noise: 0,
    density: 80,
    preset: 9,
    scale: [3, 3],
}

export function settingsReducer(state: Settings, action: { type: string, payload?: any }): Settings {
    if (action.type === 'ADD_LAYER') {
        let layers = [...state.hiddenLayers];
        layers.push({ neuronsCount: 4, activationFunction: 'relu' });
        return { ...state, layersCount: state.layersCount + 1, hiddenLayers: layers };
    } else if (action.type === 'REMOVE_LAYER') {
        let layers = [...state.hiddenLayers];
        layers.pop();
        return { ...state, layersCount: state.layersCount - 1, hiddenLayers: layers };
    } else if (action.type === 'SET_LAYERS_NEURONS') {
        let index = action.payload.layer;
        let layers = [...state.hiddenLayers];
        layers[index].neuronsCount = action.payload.neuronsCount;
        return { ...state, hiddenLayers: layers };
    } else if (action.type === 'SET_LAYERS_ACTIVATION') {
        let index = action.payload.layer;
        let layers = [...state.hiddenLayers];
        layers[index].activationFunction = action.payload.activationFunction;
        return { ...state, hiddenLayers: layers };
    } else if (action.type === 'SET_ALPHA') {
        return { ...state, alpha: action.payload.alpha };
    } else if (action.type === 'SET_MAX_EPOCHS') {
        return { ...state, maxEpochs: action.payload.maxEpochs };
    } else if (action.type === 'SET_DESIRED_MSE') {
        return { ...state, desiredMse: action.payload.desiredMse };
    } else if (action.type === 'SET_TRAINING_DATA') {
        return { ...state, trainingData: action.payload.trainingData };
    } else if (action.type === 'SET_VALIDATION_DATA') {
        return { ...state, validationData: action.payload.validationData };
    } else if (action.type === 'SET_TESTING_DATA') {
        return { ...state, testingData: action.payload.testingData };
    } else if (action.type === 'SET_NOISE') {
        return { ...state, noise: action.payload.noise };
    } else if (action.type === 'SET_DENSITY') {
        return { ...state, density: action.payload.density };
    } else if (action.type === 'SET_OUTPUT_LAYER_NEURONS') {
        return { ...state, outputLayer: { ...state.outputLayer, neuronsCount: action.payload.neuronsCount } };
    } else if (action.type === 'SET_OUTPUT_LAYER_ACTIVATION') {
        return { ...state, outputLayer: { ...state.outputLayer, activationFunction: action.payload.activationFunction } };
    } else if (action.type === 'SET_PRESET') {
        return { ...state, preset: action.payload.preset };
    } else if (action.type === 'SET_SCALE') {
        return { ...state, scale: action.payload.scale };
    } else {
        throw Error('Unknown action.');
    }
}
