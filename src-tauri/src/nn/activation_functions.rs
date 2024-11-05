// use std::f64::consts::E;

pub type ActivationFunctionWrapper = Box<&'static dyn ActivationFunctionTrait>;

// impl std::fmt::Debug for ActivationFunctionWrapper {
//     fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
//         write!(f, "Boxed Activation Function")
//     }
// }

#[derive(Debug, Copy, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ActivationFunction {
    Linear,
    Sigmoid,
    Relu,
    LeakyRelu,
    Tanh,
    Softmax,
}

pub fn get_activation_function(
    activation_function: ActivationFunction,
) -> ActivationFunctionWrapper {
    match activation_function {
        ActivationFunction::Linear => Box::new(&Linear {}),
        ActivationFunction::Sigmoid => Box::new(&Sigmoid {}),
        ActivationFunction::Relu => Box::new(&Relu {}),
        ActivationFunction::LeakyRelu => Box::new(&LeakyRelu {}),
        ActivationFunction::Tanh => Box::new(&Tanh {}),
        ActivationFunction::Softmax => Box::new(&Softmax {}),
    }
}

pub trait ActivationFunctionTrait
where
    Self: std::fmt::Debug + Send + Sync,
{
    fn apply(&self, big_x: f64) -> f64;
    fn commit(&self, big_x: f64, all_outputs: &Vec<f64>) -> f64;
    fn derivative(&self, big_x: f64, all_outputs: &Vec<f64>) -> f64;
}

#[derive(Debug, Clone)]
pub struct Linear;
impl ActivationFunctionTrait for Linear {
    fn apply(&self, x: f64) -> f64 {
        x
    }

    fn commit(&self, x: f64, _all_outputs: &Vec<f64>) -> f64 {
        self.apply(x)
    }

    fn derivative(&self, _x: f64, _all_outputs: &Vec<f64>) -> f64 {
        return 1.;
    }
}

#[derive(Debug, Clone)]
pub struct Sigmoid;
impl ActivationFunctionTrait for Sigmoid {
    fn apply(&self, x: f64) -> f64 {
        // 1.0 / (1.0 + E.powf(-1.0 * x));
        1. / (1. + (-1. * x).exp())
    }

    fn commit(&self, x: f64, _all_outputs: &Vec<f64>) -> f64 {
        self.apply(x)
    }

    fn derivative(&self, x: f64, _all_outputs: &Vec<f64>) -> f64 {
        let v = self.apply(x);
        v * (1. - v)
    }
}

#[derive(Debug, Clone)]
pub struct Relu;
impl ActivationFunctionTrait for Relu {
    fn apply(&self, x: f64) -> f64 {
        f64::max(0., x)
    }

    fn commit(&self, x: f64, _all_outputs: &Vec<f64>) -> f64 {
        self.apply(x)
    }

    fn derivative(&self, x: f64, _all_outputs: &Vec<f64>) -> f64 {
        if x < 0. {
            0.
        } else {
            1.
        }
    }
}

#[derive(Debug, Clone)]
pub struct LeakyRelu;
impl ActivationFunctionTrait for LeakyRelu {
    fn apply(&self, x: f64) -> f64 {
        if x < 0. {
            0.01 * x
        } else {
            x
        }
    }

    fn commit(&self, x: f64, _all_outputs: &Vec<f64>) -> f64 {
        self.apply(x)
    }

    fn derivative(&self, x: f64, _all_outputs: &Vec<f64>) -> f64 {
        if x < 0. {
            0.01
        } else {
            1.
        }
    }
}

#[derive(Debug, Clone)]
pub struct Tanh;
impl ActivationFunctionTrait for Tanh {
    fn apply(&self, x: f64) -> f64 {
        x.tanh()
        // 2. / (1. + (-2. * x).exp()) - 1.
    }

    fn commit(&self, x: f64, _all_outputs: &Vec<f64>) -> f64 {
        self.apply(x)
    }

    fn derivative(&self, x: f64, _all_outputs: &Vec<f64>) -> f64 {
        1. - x.tanh().powi(2)
    }
}

#[derive(Debug, Clone)]
pub struct Softmax;
impl ActivationFunctionTrait for Softmax {
    fn apply(&self, x: f64) -> f64 {
        x
    }

    fn commit(&self, x: f64, all_outputs: &Vec<f64>) -> f64 {
        let max_val = all_outputs.iter().cloned().reduce(f64::max).unwrap();
        // let max = all_outputs
        //     .iter()
        //     .fold(f64::MIN, |acc, &i| if acc > i { acc } else { i });
        (x - max_val).exp() / all_outputs.iter().map(|i| (i - max_val).exp()).sum::<f64>()
        // x.exp() / all_outputs.iter().map(|i| i.exp()).sum::<f64>()
    }

    fn derivative(&self, x: f64, all_outputs: &Vec<f64>) -> f64 {
        let y = self.commit(x, all_outputs);
        return y * (1. - y);
        // let index = all_outputs.iter().position(|&r| r == x).unwrap();
        // let all_y = all_outputs
        //     .iter()
        //     .map(|&x| self.commit(x, all_outputs))
        //     .collect::<Vec<f64>>();
        // let jacobian = all_y
        //     .clone()
        //     .into_iter()
        //     .enumerate()
        //     .map(|(i, y1)| {
        //         if i == index {
        //             all_y
        //                 .clone()
        //                 .into_iter()
        //                 .enumerate()
        //                 .map(|(j, y2)| if i != j { -y1 * y2 } else { y1 * (1. - y1) })
        //                 .collect::<Vec<f64>>()
        //         } else {
        //             vec![0.; all_y.len()]
        //         }
        //     })
        //     .collect::<Vec<Vec<f64>>>();
        // // dot product jacobian with gradiant error
        // let mut sum = 0.;
        // for row in jacobian {
        //     sum += row.iter().sum::<f64>();
        // }
        // sum
    }
}
