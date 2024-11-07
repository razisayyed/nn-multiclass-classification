
export interface State {
    mse: number | null;
    mseValidation: number | null;
    mseHistory: number[] | null;
    mseValidationHistory: number[] | null;
    epoch: number | null;
    confusionMatrix: number[][] | null;
    crossEntropyLoss: number | null;
    predicted: number[] | null;
    isLearning: boolean;
    parameters: [
        number[],
        number,
        string
    ][][] | null;
    heatmap: number[][] | null;
}

export const initialState: State = {
    mse: null,
    mseValidation: null,
    mseHistory: null,
    mseValidationHistory: null,
    epoch: null,
    confusionMatrix: null,
    crossEntropyLoss: null,
    predicted: null,
    isLearning: false,
    parameters: null,
    heatmap: null,
};

export function stateReducer(state: State, action: { type: string, payload?: any }): State {
    if (action.type === 'UPDATE') {
        console.debug('UPDATE', action.payload);
        return { ...state, ...action.payload };
    }
    else if (action.type === 'OVERRIDE') {
        return action.payload;
    } else if (action.type === 'SET_MSE') {
        console.log('SET_MSE', action.payload.mse);
        let mseHistory = state.mseHistory || [];
        if (action.payload.mse === null) {
            mseHistory = [];
        }
        else if (mseHistory.length == 0 || action.payload.mse != mseHistory[mseHistory.length - 1]) {
            mseHistory.push(action.payload.mse);
        }
        return { ...state, mse: action.payload.mse, mseHistory };
    } else if (action.type === 'SET_MSE_VALIDATION') {
        let mseValidationHistory = state.mseValidationHistory || [];
        if (action.payload.mseValidation === null) {
            mseValidationHistory = [];
        } else if (mseValidationHistory.length == 0 || action.payload.mseValidation != mseValidationHistory[mseValidationHistory.length - 1]) {
            mseValidationHistory.push(action.payload.mseValidation);
        }
        return { ...state, mseValidation: action.payload.mseValidation, mseValidationHistory };
    } else if (action.type === 'SET_EPOCH') {
        return { ...state, epoch: action.payload.epoch };
    } else if (action.type === 'SET_CONFUSION_MATRIX') {
        return { ...state, confusionMatrix: action.payload.confusionMatrix };
    } else if (action.type === 'SET_CROSS_ENTROPY_LOSS') {
        return { ...state, crossEntropyLoss: action.payload.crossEntropyLoss };
    } else if (action.type === 'SET_PREDICTED') {
        return { ...state, predicted: action.payload.predicted };
    } else if (action.type === 'SET_IS_LEARNING') {
        return { ...state, isLearning: action.payload.isLearning };
    } else if (action.type === 'SET_PARAMETERS') {
        return { ...state, parameters: action.payload.parameters };
    }
    throw Error('Unknown action.');
}
