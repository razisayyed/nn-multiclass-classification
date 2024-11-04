use super::{
    activation_functions::ActivationFunctionWrapper,
    layer::{Layer, LayerType},
};
use rand::distributions::{Distribution, Uniform};

#[derive(Clone, Debug)]
pub struct Neuron {
    // #[allow(dead_code)]
    // layer: usize,
    layer_type: LayerType,
    weights: Vec<f64>,
    threshold: f64,
    activation_function: ActivationFunctionWrapper,
    alpha: f64,
    inputs: Vec<f64>,
    pub gradiant_error: f64,
    // SUM(Xi*Wi - THRESHOLD)
    pub x: f64,
    // ACTIVATION_FUNCTION(x)
    pub y: f64,
}

impl Neuron {
    pub fn new(
        layer_type: LayerType,
        inputs_count: usize,
        activation_function: ActivationFunctionWrapper,
        alpha: f64,
    ) -> Self {
        let step = Uniform::new(-2.4 / inputs_count as f64, 2.4 / inputs_count as f64);
        let mut rng = rand::thread_rng();

        let weights = (0..inputs_count)
            .into_iter()
            .map(|_| step.sample(&mut rng))
            .collect::<Vec<_>>();

        Neuron {
            layer_type,
            weights,
            threshold: step.sample(&mut rng),
            activation_function,
            alpha,
            inputs: vec![],
            gradiant_error: f64::MAX,
            x: f64::MAX,
            y: f64::MAX,
        }
    }

    // pub fn set_layer_type(&mut self, layer_type: LayerType) {
    //     self.layer_type = layer_type;
    // }

    /**
     * Updates y_actual for the current neuron
     *
     * Returns y_actual
     */
    pub fn forward(&mut self, inputs: &Vec<f64>) -> f64 {
        // we need to store inputs for backward step
        self.inputs = inputs.clone();

        // compute X
        self.x = self
            .weights
            .iter()
            .zip(inputs)
            .map(|(&w, i)| w * i)
            .sum::<f64>()
            - self.threshold;

        // compute actual Y
        self.y = self.activation_function.apply(self.x);

        // return actual Y for the layer so it can be passed to next layer as input
        self.y
    }

    pub fn backward(&mut self, input: GradiantErrorInput, index: usize, layer_outputs: &Vec<f64>) {
        match (self.layer_type, input) {
            (LayerType::Output, GradiantErrorInput::YDesired(y_desired)) => {
                self.compute_output_layer_gradiant_error(y_desired, layer_outputs)
            }
            (LayerType::Hidden, GradiantErrorInput::NextLayer(next_layer)) => {
                self.compute_hidden_layer_gradiant_error(&next_layer, index, layer_outputs)
            }
            _ => (),
        }
    }

    pub fn commit_activation_function(&mut self, layer_outputs: &Vec<f64>) {
        self.y = self.activation_function.commit(self.y, layer_outputs);
    }

    pub fn commit(&mut self, inputs: &Vec<f64>) {
        self.weights = inputs
            .iter()
            .zip(&self.weights)
            .map(|(&x, w)| w + (self.alpha * x * self.gradiant_error)) // W + ΔW
            .collect::<Vec<_>>();

        // ⍬ + Δ⍬
        self.threshold = self.threshold + (self.alpha * -1. * self.gradiant_error);
    }

    fn compute_output_layer_gradiant_error(&mut self, y_desired: f64, layer_outputs: &Vec<f64>) {
        let err = y_desired - self.y;
        self.gradiant_error = self.activation_function.derivative(self.x, layer_outputs) * err;
    }

    fn compute_hidden_layer_gradiant_error(
        &mut self,
        next_layer: &Layer,
        index: usize,
        layer_outputs: &Vec<f64>,
    ) {
        let err = next_layer
            .neurons
            .iter()
            .map(|neuron| neuron.get_prev_neuron_effect(index))
            .sum::<f64>();
        self.gradiant_error = self.activation_function.derivative(self.x, layer_outputs) * err;
    }

    pub fn predict(&self, inputs: &Vec<f64>) -> f64 {
        // compute X
        let x = self
            .weights
            .iter()
            .zip(inputs)
            .map(|(w, i)| w * i)
            .sum::<f64>()
            - self.threshold;

        // compute actual Y
        self.activation_function.apply(x)
    }

    pub fn get_prev_neuron_effect(&self, w_index: usize) -> f64 {
        self.gradiant_error * self.weights[w_index]
    }
}

#[derive(Clone, Debug)]
pub enum GradiantErrorInput {
    YDesired(f64),
    NextLayer(Layer),
    Error,
}
