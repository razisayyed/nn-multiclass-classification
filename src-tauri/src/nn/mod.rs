use activation_functions::ActivationFunction;
use layer::{Layer, LayerType};
use rand::seq::SliceRandom;

pub mod activation_functions;
pub mod layer;
pub mod neuron;

#[derive(Clone, Debug)]
pub struct NeuralNetwork {
    pub layers: Vec<Layer>,
    pub mse: f64,
    pub mse_validation: f64,
    pub training_data: Vec<(Vec<f64>, Vec<f64>)>,
    #[allow(dead_code)]
    pub validation_data: Vec<(Vec<f64>, Vec<f64>)>,
    #[allow(dead_code)]
    pub testing_data: Vec<(Vec<f64>, Vec<f64>)>,
    pub normalization_factors: Vec<(f64, f64)>,
}

impl NeuralNetwork {
    pub fn new<I: Clone + Copy + Into<f64>, O: Clone + Copy + Into<f64>>(
        inputs_count: usize,
        hidden_layers_topology: Vec<usize>,
        hidden_layers_activation_functions: &[ActivationFunction],
        outputs_count: usize,
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
            .map(|(index, (w, activation_function))| {
                Layer::new(
                    index + 1,
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

        let training_data = training_data
            .iter()
            .map(|(inputs, y_desired)| {
                let inputs = inputs.iter().map(|&i| i.into()).collect::<Vec<f64>>();
                let y_desired = y_desired.iter().map(|&i| i.into()).collect::<Vec<f64>>();
                (inputs, y_desired)
            })
            .collect::<Vec<_>>();

        let validation_data = validation_data
            .iter()
            .map(|(inputs, y_desired)| {
                let inputs = inputs.iter().map(|&i| i.into()).collect::<Vec<f64>>();
                let y_desired = y_desired.iter().map(|&i| i.into()).collect::<Vec<f64>>();
                (inputs, y_desired)
            })
            .collect::<Vec<_>>();

        let testing_data = testing_data
            .iter()
            .map(|(inputs, y_desired)| {
                let inputs = inputs.iter().map(|&i| i.into()).collect::<Vec<f64>>();
                let y_desired = y_desired.iter().map(|&i| i.into()).collect::<Vec<f64>>();
                (inputs, y_desired)
            })
            .collect::<Vec<_>>();

        let mut nn = NeuralNetwork {
            layers,
            mse: 0.0,
            mse_validation: 0.0,
            training_data: training_data.to_vec(),
            validation_data: validation_data.to_vec(), // validation_data.to_vec(),
            testing_data: testing_data.to_vec(),       // test_data.to_vec(),
            normalization_factors: vec![],
        };

        nn.normalize(inputs_count);
        nn
    }

    fn normalize(&mut self, inputs_count: usize) {
        self.normalization_factors = vec![(f64::MAX, f64::MIN); inputs_count];
        self.training_data
            .iter()
            .chain(self.validation_data.iter())
            .chain(self.testing_data.iter())
            .for_each(|(inputs, _)| {
                inputs.iter().enumerate().for_each(|(i, x)| {
                    if let Some(nf) = self.normalization_factors.get_mut(i) {
                        if *x < nf.0 {
                            nf.0 = *x;
                        }
                        if *x > nf.1 {
                            nf.1 = *x;
                        }
                    }
                });
            });

        // normalize training data
        self.training_data.iter_mut().for_each(|(inputs, _)| {
            inputs.iter_mut().enumerate().for_each(|(i, x)| {
                if let Some(nf) = self.normalization_factors.get(i) {
                    *x = (*x - nf.0) / (nf.1 - nf.0);
                }
            });
        });

        // normalize validation data
        self.validation_data.iter_mut().for_each(|(inputs, _)| {
            inputs.iter_mut().enumerate().for_each(|(i, x)| {
                if let Some(nf) = self.normalization_factors.get(i) {
                    *x = (*x - nf.0) / (nf.1 - nf.0);
                }
            });
        });

        // normalize testing data
        self.testing_data.iter_mut().for_each(|(inputs, _)| {
            inputs.iter_mut().enumerate().for_each(|(i, x)| {
                if let Some(nf) = self.normalization_factors.get(i) {
                    *x = (*x - nf.0) / (nf.1 - nf.0);
                }
            });
        });
    }

    fn normalize_input(&self, inputs: &Vec<f64>) -> Vec<f64> {
        inputs
            .iter()
            .enumerate()
            .map(|(i, x)| {
                if let Some(nf) = self.normalization_factors.get(i) {
                    (*x - nf.0) / (nf.1 - nf.0)
                } else {
                    *x
                }
            })
            .collect()
    }

    pub fn forward(&mut self, index: usize) -> Vec<f64> {
        // convert inputs to f64
        let (inputs, _) = self.training_data.get(index).unwrap();
        // let inputs = inputs.iter().map(|&i| i.into()).collect::<Vec<f64>>();

        // iterate over all layers and feed each layer with the previous layer outputs.
        self.layers
            .iter_mut()
            .fold(inputs.clone(), |layer_inputs, layer| {
                layer.forward(&layer_inputs)
            })
    }

    pub fn backward(&mut self, index: usize) {
        let (_, y_desired) = self.training_data.get(index).unwrap();
        // let y_desired = y_desired.iter().map(|&i| i.into()).collect::<Vec<f64>>();

        self.layers
            .iter_mut()
            .rev()
            .fold(None, |nl: Option<&Layer>, l| {
                l.backward(y_desired, nl);
                Some(l)
            });
    }

    pub fn commit(&mut self) {
        self.layers.iter_mut().for_each(|l| l.commit());
    }

    pub fn epoch(&mut self) -> (f64, f64) {
        self.mse = 0.0;
        self.mse_validation = 0.0;

        let n = self.training_data.len() as f64;
        // let training_data = self.training_data.clone();
        let len = self.training_data.len();
        (0..len).for_each(|i| {
            self.mse += self.iteration(i);
        });
        // self.training_data.iter().for_each(|(inputs, y_desired)| {
        //     self.mse += self.next_iter(inputs, y_desired);
        // });
        self.mse /= n;

        self.mse_validation = self.calculate_mse(&self.validation_data);

        (self.mse, self.mse_validation)
    }

    pub fn iteration(&mut self, index: usize) -> f64 {
        self.forward(index);
        self.backward(index);
        self.commit();

        let (_, y_desired) = self.training_data.get(index).unwrap();

        // return mse for this iteration
        self.layers
            .iter()
            .last()
            .unwrap()
            .neurons
            .iter()
            .zip(y_desired)
            .fold(0.0, |acc, (n, &y_desired)| acc + (y_desired - n.y).powi(2))
    }

    pub fn predict<I: Clone + Copy + Into<f64>>(&self, inputs: &Vec<I>) -> Vec<f64> {
        let inputs = inputs.iter().map(|&i| i.into()).collect::<Vec<f64>>();
        let inputs = self.normalize_input(&inputs);
        self.predict_normalized(&inputs)
    }

    pub fn predict_normalized(&self, inputs: &Vec<f64>) -> Vec<f64> {
        self.layers
            .iter()
            .fold(inputs.clone(), |layer_inputs, layer| {
                layer.predict(&layer_inputs)
            })
    }

    fn calculate_mse(&self, data: &Vec<(Vec<f64>, Vec<f64>)>) -> f64 {
        let mut result = 0.0;
        let n = data.len() as f64;

        data.iter().for_each(|(inputs, y_desired)| {
            result += self.calculate_mse_for_one_row(inputs, y_desired);
        });
        result /= n;
        result
    }

    fn calculate_mse_for_one_row(&self, inputs: &Vec<f64>, y_desired: &Vec<f64>) -> f64 {
        let outputs = self.predict_normalized(inputs);
        outputs
            .iter()
            .zip(y_desired)
            .fold(0.0, |acc, (output, &desired)| {
                acc + (desired - output).powi(2)
            })
    }

    pub fn confusion_matrix(&self) -> Vec<Vec<usize>> {
        let output_len = self.layers.iter().last().unwrap().neurons.len();
        self.testing_data
            .iter()
            .map(|(inputs, y_desired)| {
                let outputs = self.predict_normalized(inputs);
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

    pub fn cross_entropy_loss(&self) -> f64 {
        let mut total_loss = 0.0;

        self.training_data.iter().for_each(|(inputs, y_desired)| {
            let mut sample_loss = 0.0;
            let y_actual = self.predict_normalized(inputs);
            for (j, &target_value) in y_desired.iter().enumerate() {
                if target_value == 1.0 {
                    sample_loss -= y_actual[j].ln(); // Only take log of the predicted probability where target is 1
                }
            }
            total_loss += sample_loss;
        });

        total_loss / self.training_data.len() as f64
    }

    // pub fn results(&self) -> Vec<Vec<(Vec<(usize, f64)>, f64)>> {
    //     self.layers.iter().map(|l| l.results()).collect()
    // }
}
