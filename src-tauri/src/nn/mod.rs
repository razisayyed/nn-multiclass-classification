use activation_functions::ActivationFunction;
use layer::{Layer, LayerType};
use rand::seq::SliceRandom;

pub mod activation_functions;
pub mod layer;
pub mod neuron;

#[derive(Clone, Debug)]
pub struct NeuralNetwork<I: Clone + Into<f64>, O: Clone + Into<f64>> {
    pub layers: Vec<Layer>,
    pub mse: f64,
    pub mse_validation: f64,
    pub training_data: Vec<(Vec<I>, Vec<O>)>,
    #[allow(dead_code)]
    pub validation_data: Vec<(Vec<I>, Vec<O>)>,
    #[allow(dead_code)]
    pub testing_data: Vec<(Vec<I>, Vec<O>)>,
}

impl<I: Clone + Copy + Into<f64>, O: Clone + Copy + Into<f64>> NeuralNetwork<I, O> {
    pub fn new(
        inputs_count: u32,
        hidden_layers_topology: Vec<u32>,
        hidden_layers_activation_functions: &[ActivationFunction],
        outputs_count: u32,
        output_layer_activation_function: ActivationFunction,
        alpha: f64,
        mut training_data: Vec<(Vec<I>, Vec<O>)>,
        mut validation_data: Vec<(Vec<I>, Vec<O>)>,
        mut testing_data: Vec<(Vec<I>, Vec<O>)>,
    ) -> Self {
        let mut rng = rand::thread_rng();
        training_data.shuffle(&mut rng);
        validation_data.shuffle(&mut rng);
        testing_data.shuffle(&mut rng);

        let topology = vec![inputs_count]
            .into_iter()
            .chain(hidden_layers_topology.clone().into_iter())
            .collect::<Vec<_>>();
        let mut layers = topology
            .windows(2)
            .into_iter()
            .zip(hidden_layers_activation_functions)
            .enumerate()
            .map(|(layer, (w, activation_function))| {
                Layer::new(
                    layer + 1,
                    LayerType::Hidden,
                    w[0],
                    w[1],
                    activation_function.clone(),
                    alpha,
                )
            })
            .collect::<Vec<_>>();

        layers.push(Layer::new(
            layers.len() + 1,
            LayerType::Output,
            *topology.last().unwrap(),
            outputs_count,
            output_layer_activation_function,
            alpha,
        ));

        // if let Some(output_layer) = layers.iter_mut().last() {
        //     output_layer.set_layer_type(LayerType::Output);
        // }

        NeuralNetwork {
            layers,
            mse: 0.0,
            mse_validation: 0.0,
            training_data: training_data.to_vec(),
            validation_data: validation_data.to_vec(), // validation_data.to_vec(),
            testing_data: testing_data.to_vec(),       // test_data.to_vec(),
        }
    }

    // pub fn set_data(&mut self, data: Vec<(Vec<I>, Vec<O>)>) {
    //     self.training_data = data;
    // }

    pub fn forward(&mut self, inputs: Vec<I>) -> Vec<f64> {
        // convert inputs to f64
        let inputs = inputs.iter().map(|&i| i.into()).collect::<Vec<f64>>();

        // iterate over all layers and feed each layer with the previous layer outputs.
        self.layers
            .iter_mut()
            .fold(inputs, |layer_inputs, layer| layer.forward(layer_inputs))
    }

    pub fn backward(&mut self, y_desired: Vec<O>) {
        let y_desired = y_desired.iter().map(|&i| i.into()).collect::<Vec<f64>>();

        self.layers
            .iter_mut()
            .rev()
            .fold(None, |nl: Option<Layer>, l| {
                match nl {
                    Some(nl) => l.backward(y_desired.clone(), Some(nl.clone())),
                    None => l.backward(y_desired.clone(), None),
                };
                Some(l.clone())
            });
    }

    pub fn commit(&mut self) {
        self.layers.iter_mut().for_each(|l| l.commit());
    }

    pub fn epoch(&mut self) -> (f64, f64) {
        self.mse = 0.0;
        self.mse_validation = 0.0;

        let n = self.training_data.len() as f64;
        let training_data = self.training_data.clone();
        training_data.into_iter().for_each(|(inputs, y_desired)| {
            self.mse += self.next_iter(inputs, y_desired.clone());
        });
        self.mse /= n;

        self.mse_validation = self.calculate_mse(&self.validation_data);

        (self.mse, self.mse_validation)
    }

    pub fn next_iter(&mut self, inputs: Vec<I>, y_desired: Vec<O>) -> f64 {
        self.forward(inputs);
        self.backward(y_desired.clone());
        self.commit();

        // return mse for this iteration
        self.layers
            .iter()
            .last()
            .unwrap()
            .neurons
            .iter()
            .zip(y_desired)
            .fold(0.0, |acc, (n, y_desired)| {
                acc + (y_desired.into() - n.y).powi(2)
            })
    }

    pub fn predict(&self, inputs: Vec<I>) -> Vec<f64> {
        let inputs = inputs
            .clone()
            .into_iter()
            .map(|i| i.into())
            .collect::<Vec<f64>>();
        let outputs = self
            .layers
            .iter()
            .fold(inputs, |layer_inputs, layer| layer.predict(layer_inputs));
        outputs
    }

    pub fn calculate_mse(&self, data: &Vec<(Vec<I>, Vec<O>)>) -> f64 {
        let mut result = 0.0;
        let n = data.len() as f64;
        let data = data.clone();

        data.into_iter().for_each(|(inputs, y_desired)| {
            result += self.calculate_mse_for_one_row(inputs, y_desired.clone());
        });
        result /= n;
        result
    }

    fn calculate_mse_for_one_row(&self, inputs: Vec<I>, y_desired: Vec<O>) -> f64 {
        let outputs = self.predict(inputs);
        outputs
            .iter()
            .zip(y_desired)
            .fold(0.0, |acc, (output, desired)| {
                acc + (desired.into() - output).powi(2)
            })
    }

    pub fn confusion_matrix(&self) -> Vec<Vec<usize>> {
        let output_len = self.layers.iter().last().unwrap().neurons.len();
        self.testing_data
            .iter()
            .map(|(inputs, y_desired)| {
                let outputs = self.predict(inputs.clone());
                let max_index = outputs
                    .iter()
                    .enumerate()
                    .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
                    .unwrap()
                    .0;
                let y_desired_index = y_desired
                    .clone()
                    .into_iter()
                    .map(|i| i.into())
                    .enumerate()
                    .max_by(|a: &(usize, f64), b: &(usize, f64)| a.1.partial_cmp(&b.1).unwrap())
                    .unwrap()
                    .0;
                return (max_index, y_desired_index);
            })
            .fold(
                vec![vec![0; output_len]; output_len],
                |mut acc: Vec<Vec<usize>>, (max_index, y_desired_index)| {
                    acc[y_desired_index][max_index] += 1;
                    acc
                },
            )
        // .collect::<Vec<(usize, usize)>>()
    }

    // pub fn cross_entropy(&self, y_desired: Vec<O>) -> f64 {
    //     let y_desired = y_desired
    //         .clone()
    //         .into_iter()
    //         .map(|i| i.into())
    //         .collect::<Vec<f64>>();
    //     let output_layer = self.layers.iter().last().unwrap();
    //     let outputs = output_layer.get_outputs();
    //     outputs
    //         .iter()
    //         .zip(y_desired)
    //         .fold(0.0, |acc, (output, desired)| acc + desired * output.ln())
    // }

    // pub fn results(&self) -> Vec<Vec<(Vec<(usize, f64)>, f64)>> {
    //     self.layers.iter().map(|l| l.results()).collect()
    // }
}
