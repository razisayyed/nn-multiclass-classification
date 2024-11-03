
export interface State {
    mse: number | null;
    mseValidation: number | null;
    epoch: number | null;
    confusionMatrix: number[][] | null;
}

export function stateReducer(state: State, action: { type: string, payload?: any }): State {
    if (action.type === 'SET_MSE') {
        return { ...state, mse: action.payload.mse };
    } else if (action.type === 'SET_MSE_VALIDATION') {
        return { ...state, mseValidation: action.payload.mseValidation };
    } else if (action.type === 'SET_EPOCH') {
        return { ...state, epoch: action.payload.epoch };
    } else if (action.type === 'SET_CONFUSION_MATRIX') {
        return { ...state, confusionMatrix: action.payload.confusionMatrix };
    }
    throw Error('Unknown action.');
}
