use super::{
    activation_functions::{get_activation_function, ActivationFunction},
    neuron::{GradiantErrorInput, Neuron},
};
use rayon::prelude::*;

#[derive(Copy, Clone, Debug)]
pub enum LayerType {
    Hidden,
    Output,
    #[allow(dead_code)]
    Error,
}

#[derive(Clone, Debug)]
pub struct Layer {
    #[allow(dead_code)]
    pub layer: usize,
    pub layer_type: LayerType,
    pub neurons: Vec<Neuron>,
    pub activation_function: ActivationFunction,
}

impl Layer {
    pub fn new(
        layer: usize,
        layer_type: LayerType,
        inputs_count: u32,
        neurons_count: u32,
        activation_function: ActivationFunction,
        alpha: f64,
    ) -> Self {
        let neurons = (0..neurons_count)
            .map(|_| {
                Neuron::new(
                    layer,
                    layer_type.clone(),
                    inputs_count,
                    get_activation_function(activation_function),
                    alpha,
                )
            })
            .collect::<Vec<_>>();

        Layer {
            layer,
            layer_type,
            neurons: neurons,
            activation_function,
        }
    }

    // pub fn set_layer_type(&mut self, layer_type: LayerType) {
    //     self.layer_type = layer_type;
    //     self.neurons
    //         .iter_mut()
    //         .for_each(|n| n.set_layer_type(layer_type));
    // }

    /**
     * return y_actual for all neurons in this layer.
     *
     * will be used as inputs for the next layer.
     */
    pub fn forward(&mut self, inputs: Vec<f64>) -> Vec<f64> {
        let outputs = self
            .neurons
            .par_iter_mut()
            .map(|n| n.forward(inputs.clone()))
            .collect::<Vec<_>>();

        // NEEDED FOR SOFTMAX ACTIVATION FUNCTION
        match self.activation_function {
            ActivationFunction::Softmax => self
                .neurons
                .par_iter_mut()
                .for_each(|n| n.commit_activation_function(&outputs)),
            _ => (),
        }

        outputs
    }

    // compute gradiant error for each weight and store it
    // (DO NOT UPDATE WEIGHTS)
    pub fn backward(&mut self, y_desired: Vec<f64>, next_layer: Option<Layer>) {
        // move to neuron.

        // IMPORTANT FOR SOFTMAX ACTIVATION FUNCTION
        // IT WAS Y. NOW IT IS X (2024-11-02)
        let outputs = self.neurons.iter().map(|n| n.x).collect::<Vec<_>>();

        self.neurons.par_iter_mut().enumerate().for_each(|(i, n)| {
            let input = match (self.layer_type, &y_desired, &next_layer) {
                (LayerType::Hidden, _, Some(next_layer)) => {
                    GradiantErrorInput::NextLayer(next_layer.clone())
                }
                (LayerType::Output, y_desired, _) => GradiantErrorInput::YDesired(y_desired[i]),
                _ => GradiantErrorInput::Error,
            };
            n.backward(input, i, &outputs);
        });
    }

    pub fn commit(&mut self) {
        self.neurons.par_iter_mut().for_each(|n| n.commit());
    }

    #[allow(dead_code)]
    pub fn predict(&self, inputs: Vec<f64>) -> Vec<f64> {
        let outputs = self
            .neurons
            .iter()
            .map(|n| n.predict(inputs.clone()))
            .collect::<Vec<_>>();

        // NEEDED FOR SOFTMAX ACTIVATION FUNCTION
        match self.activation_function {
            ActivationFunction::Softmax => outputs
                .clone()
                .into_iter()
                .map(|o| get_activation_function(self.activation_function).commit(o, &outputs))
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
}
