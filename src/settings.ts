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
}

export function settingsReducer(state: Settings, action: { type: string, payload?: any }): Settings {
    let newState = { ...state };
    if (action.type === 'ADD_LAYER') {
        let layers = [...state.hiddenLayers];
        layers.push({ neuronsCount: 4, activationFunction: 'relu' });
        newState = { ...state, layersCount: state.layersCount + 1, hiddenLayers: layers };
    } else if (action.type === 'REMOVE_LAYER') {
        let layers = [...state.hiddenLayers];
        layers.pop();
        newState = { ...state, layersCount: state.layersCount - 1, hiddenLayers: layers };
    } else if (action.type === 'SET_LAYERS_NEURONS') {
        let index = action.payload.layer;
        let layers = [...state.hiddenLayers];
        layers[index].neuronsCount = action.payload.neuronsCount;
        newState = { ...state, hiddenLayers: layers };
    } else if (action.type === 'SET_LAYERS_ACTIVATION') {
        let index = action.payload.layer;
        let layers = [...state.hiddenLayers];
        layers[index].activationFunction = action.payload.activationFunction;
        newState = { ...state, hiddenLayers: layers };
    } else if (action.type === 'SET_ALPHA') {
        newState = { ...state, alpha: action.payload.alpha };
    } else if (action.type === 'SET_MAX_EPOCHS') {
        newState = { ...state, maxEpochs: action.payload.maxEpochs };
    } else if (action.type === 'SET_DESIRED_MSE') {
        newState = { ...state, desiredMse: action.payload.desiredMse };
    } else if (action.type === 'SET_TRAINING_DATA') {
        newState = { ...state, trainingData: action.payload.trainingData };
    } else if (action.type === 'SET_VALIDATION_DATA') {
        newState = { ...state, validationData: action.payload.validationData };
    } else if (action.type === 'SET_TESTING_DATA') {
        newState = { ...state, testingData: action.payload.testingData };
    } else if (action.type === 'SET_NOISE') {
        newState = { ...state, noise: action.payload.noise };
    } else if (action.type === 'SET_DENSITY') {
        newState = { ...state, density: action.payload.density };
    } else if (action.type === 'SET_OUTPUT_LAYER_NEURONS') {
        newState = { ...state, outputLayer: { ...state.outputLayer, neuronsCount: action.payload.neuronsCount } };
    } else if (action.type === 'SET_OUTPUT_LAYER_ACTIVATION') {
        newState = { ...state, outputLayer: { ...state.outputLayer, activationFunction: action.payload.activationFunction } };
    } else {
        throw Error('Unknown action.');
    }
    // invoke('reset', { settings: newState });
    return newState;
}
