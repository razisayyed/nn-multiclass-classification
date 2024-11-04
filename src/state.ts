
export interface State {
    mse: number | null;
    mseValidation: number | null;
    epoch: number | null;
    confusionMatrix: number[][] | null;
    crossEntropyLoss: number | null;
    predicted: number[] | null;
    isLearning: boolean;
}

export function stateReducer(state: State, action: { type: string, payload?: any }): State {
    if (action.type === 'OVERRIDE') {
        return action.payload;
    } else if (action.type === 'SET_MSE') {
        return { ...state, mse: action.payload.mse };
    } else if (action.type === 'SET_MSE_VALIDATION') {
        return { ...state, mseValidation: action.payload.mseValidation };
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
    }
    throw Error('Unknown action.');
}
