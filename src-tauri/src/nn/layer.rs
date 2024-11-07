use rayon::prelude::*;
use serde::{Deserialize, Serialize};

use super::{
    activation_functions::{get_activation_function, ActivationFunction},
    neuron::{GradiantErrorInput, Neuron},
};

#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum LayerType {
    Hidden,
    Output,
    #[allow(dead_code)]
    Error,
}

#[derive(Clone, Debug)]
pub struct Layer {
    #[allow(dead_code)]
    pub layer_id: usize,
    pub layer_type: LayerType,
    pub neurons: Vec<Neuron>,
    pub activation_function: ActivationFunction,
    pub current_inputs: Vec<f64>,
    pub current_outputs: Vec<f64>,
}

impl Layer {
    pub fn new(
        layer_id: usize,
        layer_type: LayerType,
        inputs_count: usize,
        neurons_count: usize,
        activation_function: ActivationFunction,
        alpha: f64,
    ) -> Self {
        let neurons = (0..neurons_count)
            .map(|_| {
                Neuron::new(
                    layer_type.clone(),
                    inputs_count,
                    get_activation_function(activation_function),
                    alpha,
                )
            })
            .collect::<Vec<_>>();

        Layer {
            layer_id,
            layer_type,
            neurons: neurons,
            activation_function,
            current_inputs: vec![],
            current_outputs: vec![],
        }
    }

    /**
     * return y_actual for all neurons in this layer.
     *
     * will be used as inputs for the next layer.
     */
    pub fn forward(&mut self, inputs: &Vec<f64>) -> Vec<f64> {
        // needed for backpropagation
        self.current_inputs = inputs.clone();
        self.current_outputs = self
            .neurons
            .par_iter_mut()
            .map(|n| n.forward(inputs))
            .collect::<Vec<_>>();

        // NEEDED FOR SOFTMAX ACTIVATION FUNCTION
        match self.activation_function {
            ActivationFunction::Softmax => self
                .neurons
                .par_iter_mut()
                .for_each(|n| n.commit_activation_function(&self.current_outputs)),
            _ => (),
        }

        // needed as inputs for the next layer
        self.current_outputs.clone()
    }

    // compute gradiant error for each weight and store it
    // (DO NOT UPDATE WEIGHTS)
    pub fn backward(&mut self, y_desired: &Vec<f64>, next_layer: Option<&Layer>) {
        // move to neuron.

        // IMPORTANT FOR SOFTMAX ACTIVATION FUNCTION
        // IT WAS Y. NOW IT IS X (2024-11-02)
        // let outputs = self.neurons.iter().map(|n: &Neuron| n.x).collect::<Vec<_>>();

        self.neurons.par_iter_mut().enumerate().for_each(|(i, n)| {
            let input = match (self.layer_type, &y_desired, next_layer) {
                (LayerType::Hidden, _, Some(next_layer)) => {
                    GradiantErrorInput::NextLayer(next_layer)
                }
                (LayerType::Output, y_desired, _) => GradiantErrorInput::YDesired(y_desired[i]),
                _ => GradiantErrorInput::Error,
            };
            n.backward(input, i, &self.current_outputs);
        });
    }

    pub fn commit(&mut self) {
        self.neurons
            .par_iter_mut()
            .for_each(|n| n.commit(&self.current_inputs));
    }

    #[allow(dead_code)]
    pub fn predict(&self, inputs: &Vec<f64>) -> Vec<f64> {
        let outputs = self
            .neurons
            .iter()
            .map(|n| n.predict(inputs))
            .collect::<Vec<_>>();

        // NEEDED FOR SOFTMAX ACTIVATION FUNCTION
        match self.activation_function {
            ActivationFunction::Softmax => outputs
                .iter()
                .map(|&o| get_activation_function(self.activation_function).commit(o, &outputs))
                .collect::<Vec<_>>(),
            _ => outputs,
            // ActivationFunction::Softmax => self
            //     .neurons
            //     .iter()
            //     .map(|n| get_activation_function(self.activation_function).commit(n.y, &outputs))
            //     .collect::<Vec<_>>(),
            // _ => outputs,
        }
    }

    pub fn get_parameters(&self) -> Vec<(Vec<f64>, f64, LayerType)> {
        self.neurons
            .iter()
            .map(|n| n.get_parameters())
            .map(|(weights, threshold)| (weights, threshold, self.layer_type))
            .collect::<Vec<_>>()
    }
}
