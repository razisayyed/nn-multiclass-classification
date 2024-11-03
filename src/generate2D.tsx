export const loadPreset = (dispatch: React.Dispatch<{
    type: string;
    payload?: any;
}>, n: number, density: number, noise: number) => {
    let trainingDensity = Math.ceil(density * 0.7);
    let validationDensity = Math.ceil(density * 0.15);
    let testingDensity = Math.ceil(density * 0.15);
    dispatch({ type: "SET_TRAINING_DATA", payload: { trainingData: preset(n, trainingDensity, noise) } });
    dispatch({ type: "SET_VALIDATION_DATA", payload: { validationData: preset(n, validationDensity, noise) } });
    dispatch({ type: "SET_TESTING_DATA", payload: { testingData: preset(n, testingDensity, noise) } });
    if (n <= 4) {
        dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 2 } });
    } else if (n === 5) {
        dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 3 } });
    } else if (n === 6) {
        dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 6 } });
    } else if (n === 7) {
        dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 9 } });
    } else if (n === 8) {
        dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 2 } });
    } else if (n === 9) {
        dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 3 } });
    } else if (n === 10) {
        dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 3 } });
    }
}

export const preset = (n: number, density: number, noise: number) => {
    // match n with corresponding preset
    switch (n) {
        case 1:
            return preset1(density, noise);
        case 2:
            return preset2(density, noise);
        case 3:
            return preset3(density, noise);
        case 4:
            return preset4(density, noise);
        case 5:
            return preset5(density, noise);
        case 6:
            return preset6(density, noise);
        case 7:
            return preset7(density, noise);
        case 8:
            return preset8(density, noise);
        case 9:
            return preset9(density, noise);
        case 10:
            return preset10(density, noise);
        default:
            return [];
    }
}


const preset1 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, [number, number]][] = [
        [0.10, 0.10, 0.90, 0.40 + noise, [1, 0]],
        [0.10, 0.60 - noise, 0.90, 0.90, [0, 1]],
    ];

    groups.forEach(([x1, y1, x2, y2, output], _index) => {
        for (let i = 0; i < density; i++) {
            let x = randomBetween(x1, x2);
            let y = randomBetween(y1, y2);
            data.push([x, y].concat(output));
        }
    });
    return data;
}

const preset2 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, [number, number]][] = [
        [10, 80, 0.6, 0.62, [1, 0]],
        [10, 80, 0.78, 0.8, [0, 1]],
    ];

    groups.forEach(([minAngle, maxAngle, minRadius, maxRadius, output], _index) => {
        for (let i = 0; i < density; i++) {
            let [x, y] = radiusRandom(0.0, minRadius, maxRadius, minAngle, maxAngle, noise);
            data.push([x, y].concat(output));
        }
    });

    return data;
}

const preset3 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, [number, number]][] = [
        [0.3, 0.32, -10, 100, [1, 0]],
        [0.5, 0.52, -10, 100, [0, 1]],
        [0.7, 0.72, -10, 100, [1, 0]],
    ];

    groups.forEach(([minRadius, maxRadius, minAngle, maxAngle, output], _index) => {
        for (let i = 0; i < density; i++) {
            let [x, y] = radiusRandom(0.2, minRadius, maxRadius, minAngle, maxAngle, noise);
            data.push([x, y].concat(output));
        }
    });

    return data;
}

const preset4 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, [number, number]][] = [
        [0.10, 0.10, 0.40 + noise, 0.25 + noise, [1, 0]],
        [0.60 - noise, 0.10, 0.90, 0.25 + noise, [0, 1]],
        [0.10, 0.40, 0.40 + noise, 0.55 + noise, [0, 1]],
        [0.60 - noise, 0.40, 0.90, 0.55 + noise, [1, 0]],
        [0.10, 0.70, 0.40 + noise, 0.85 + noise, [1, 0]],
        [0.60 - noise, 0.70, 0.90, 0.85 + noise, [0, 1]],
    ];

    groups.forEach(([x1, y1, x2, y2, output], _index) => {
        for (let i = 0; i < Math.ceil(density / 2.0); i++) {
            let x = randomBetween(x1, x2);
            let y = randomBetween(y1, y2);
            data.push([x, y].concat(output));
        }
    });
    return data;
}

const preset5 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, number[]][] = [
        [0.10, 0.10, 0.40 + noise, 0.25 + noise, [1, 0, 0]],
        [0.60 - noise, 0.10, 0.90, 0.25 + noise, [0, 1, 0]],
        [0.10, 0.40, 0.40 + noise, 0.55 + noise, [0, 0, 1]],
        [0.60 - noise, 0.40, 0.90, 0.55 + noise, [1, 0, 0]],
        [0.10, 0.70, 0.40 + noise, 0.85 + noise, [0, 1, 0]],
        [0.60 - noise, 0.70, 0.90, 0.85 + noise, [0, 0, 1]],
    ];

    groups.forEach(([x1, y1, x2, y2, output], _index) => {
        for (let i = 0; i < density; i++) {
            let x = randomBetween(x1, x2);
            let y = randomBetween(y1, y2);
            data.push([x, y].concat(output));
        }
    });
    return data;
}

const preset6 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, number[]][] = [
        [0.10, 0.10, 0.40 + noise, 0.25 + noise, [1, 0, 0, 0, 0, 0]],
        [0.60 - noise, 0.10, 0.90, 0.25 + noise, [0, 1, 0, 0, 0, 0]],
        [0.10, 0.40, 0.40 + noise, 0.55 + noise, [0, 0, 1, 0, 0, 0]],
        [0.60 - noise, 0.40, 0.90, 0.55 + noise, [0, 0, 0, 1, 0, 0]],
        [0.10, 0.70, 0.40 + noise, 0.85 + noise, [0, 0, 0, 0, 1, 0]],
        [0.60 - noise, 0.70, 0.90, 0.85 + noise, [0, 0, 0, 0, 0, 1]],
    ];

    groups.forEach(([x1, y1, x2, y2, output], _index) => {
        for (let i = 0; i < density; i++) {
            let x = randomBetween(x1, x2);
            let y = randomBetween(y1, y2);
            data.push([x, y].concat(output));
        }
    });
    return data;
}

const preset7 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, number[]][] = [
        [0.10, 0.10, 0.30 + noise, 0.30 + noise, [1, 0, 0, 0, 0, 0, 0, 0, 0]],
        [0.40 - noise, 0.10, 0.60 + noise, 0.30 + noise, [0, 1, 0, 0, 0, 0, 0, 0, 0]],
        [0.70 - noise, 0.10, 0.90, 0.30 + noise, [0, 0, 1, 0, 0, 0, 0, 0, 0]],
        [0.10, 0.40, 0.30 + noise, 0.60 + noise, [0, 0, 0, 1, 0, 0, 0, 0, 0]],
        [0.40 - noise, 0.40, 0.60 + noise, 0.60 + noise, [0, 0, 0, 0, 1, 0, 0, 0, 0]],
        [0.70 - noise, 0.40, 0.90, 0.60 + noise, [0, 0, 0, 0, 0, 1, 0, 0, 0]],
        [0.10, 0.70, 0.30 + noise, 0.90, [0, 0, 0, 0, 0, 0, 1, 0, 0]],
        [0.40 - noise, 0.70, 0.60 + noise, 0.90, [0, 0, 0, 0, 0, 0, 0, 1, 0]],
        [0.70 - noise, 0.70, 0.90, 0.90, [0, 0, 0, 0, 0, 0, 0, 0, 1]],
    ];

    groups.forEach(([x1, y1, x2, y2, output], _index) => {
        for (let i = 0; i < density; i++) {
            let x = randomBetween(x1, x2);
            let y = randomBetween(y1, y2);
            data.push([x, y].concat(output));
        }
    });
    return data;
}

const preset8 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, [number, number]][] = [
        [0.0, 0.15, 0, 360, [1, 0]],
        [0.25, 0.3, 0, 360, [0, 1]],
    ];

    groups.forEach(([minRadius, maxRadius, minAngle, maxAngle, output], index) => {
        for (let i = 0; i < density * (index + 1); i++) {
            let [x, y] = radiusRandom(0.5, minRadius, maxRadius, minAngle, maxAngle, noise);
            data.push([x, y].concat(output));
        }
    });

    return data;
}

const preset9 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, number[]][] = [
        [0.0, 0.15, 0, 360, [1, 0, 0]],
        [0.25, 0.3, 0, 360, [0, 1, 0]],
        [0.4, 0.45, 0, 360, [0, 0, 1]],
    ];

    groups.forEach(([minRadius, maxRadius, minAngle, maxAngle, output], index) => {
        for (let i = 0; i < density * (index + 1); i++) {
            let [x, y] = radiusRandom(0.5, minRadius, maxRadius, minAngle, maxAngle, noise);
            data.push([x, y].concat(output));
        }
    });

    return data;
}

const preset10 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, number, number[]][] = [
        [0.1, 0.4, 0.42, 0, 90, [1, 0, 0]],
        [0.2, 0.3, 0.32, -20, 90, [0, 1, 0]],
        [0.3, 0.2, 0.22, 0, 90, [0, 0, 1]],
    ];

    groups.forEach(([center, minRadius, maxRadius, minAngle, maxAngle, output], index) => {
        for (let i = 0; i < density * (index + 1); i++) {
            let [x, y] = radiusRandom(center, minRadius, maxRadius, minAngle, maxAngle, noise);
            data.push([x, y].concat(output));
        }
    });

    return data;
}

const randomBetween = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
}

const radiusRandom = (center: number, minRadius: number, maxRadius: number, minAngle: number, maxAngle: number, noise: number) => {
    let angle = randomBetween(minAngle, maxAngle) * Math.PI / 180;
    let radius = randomBetween(minRadius, maxRadius);
    let rand = Math.random();
    if (rand <= 0.15) {
        radius += noise;
    } else if (rand >= 0.85) {
        radius -= noise;
    }

    // return x, y
    return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)];
}

export const getTestPointsTowClasses = () => {
    let data: number[][] = [];

    let groups = [
        [0.10, 0.10],
        [0.10, 0.60],
        [0.40, 0.10],
        [0.40, 0.60],
        [0.70, 0.10],
        [0.70, 0.60],
    ]
    groups.forEach(([x, y], index) => {
        let output = [1, 0];
        if (index === 1 || index === 2 || index === 5) {
            output = [0, 1];
        }
        for (let i = 0; i < 25; i++) {
            let x1 = Math.random() * 0.20 + x; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
            let x2 = Math.random() * 0.30 + y; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
            data.push([x1, x2].concat(output));
        }
    });
    return data;
}

export const getTestPointsThreeClasses = () => {
    let data: number[][] = [];
    // CENTER DATA
    let groups = [
        [0.05, 0.05],
        [0.05, 0.4],
        [0.05, 0.75],
    ];
    groups.forEach(([x, y], index) => {
        let output = Array.from({ length: 3 }, (_x, i) => i === index ? 1 : 0);
        for (let i = 0; i < 25; i++) {
            let x1 = Math.random() * 0.9 + x; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
            let x2 = Math.random() * 0.2 + y; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
            data.push([x1, x2].concat(output));
        }
    });
    // // set noise
    // for (let i = 0; i < settings.noise; i++) {
    //     let x1 = Math.random(); //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
    //     let x2 = Math.random() * 0.15 + 0.25; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
    //     if (Math.random() > 0.5) {
    //         data.push([x1, x2].concat([1, 0, 0]));
    //     } else {
    //         data.push([x1, x2].concat([0, 1, 0]));
    //     }
    //     x1 = Math.random(); //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
    //     x2 = Math.random() * 0.15 + 0.5; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
    //     if (Math.random() > 0.5) {
    //         data.push([x1, x2].concat([0, 1, 0]));
    //     } else {
    //         data.push([x1, x2].concat([0, 0, 1]));
    //     }
    // }
    return data;

}
export const getTestPointsSixClasses = () => {
    let data: number[][] = [];
    let groups = [
        [0.05, 0.05],
        [0.05, 0.55],
        [0.38, 0.05],
        [0.38, 0.55],
        [0.71, 0.05],
        [0.71, 0.55],
    ];
    groups.forEach(([x, y], index) => {
        let output = Array.from({ length: 6 }, (_x, i) => i === index ? 1 : 0);
        for (let i = 0; i < 25; i++) {
            let x1 = Math.random() * 0.25 + x; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
            let x2 = Math.random() * 0.40 + y; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
            data.push([x1, x2].concat(output));
        }
    });
    return data;
}

export const getTestPointsNineClasses = () => {
    let data: number[][] = [];
    let groups = [
        [0.05, 0.05],
        [0.05, 0.38],
        [0.05, 0.71],
        [0.38, 0.05],
        [0.38, 0.38],
        [0.38, 0.71],
        [0.71, 0.05],
        [0.71, 0.38],
        [0.71, 0.71],
    ]
    groups.forEach(([x, y], index) => {
        let output = Array.from({ length: 9 }, (_x, i) => i === index ? 1 : 0);
        for (let i = 0; i < 25; i++) {
            let x1 = Math.random() * 0.25 + x; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
            let x2 = Math.random() * 0.25 + y; //  * 100.0; // randomInteger(0, 100) * (Math.random() > 0.5 ? -1 : 1);
            data.push([x1, x2].concat(output));
        }
    });
    return data;
}
export const loadTestPointsTwoClasses = (dispatch: React.Dispatch<{
    type: string;
    payload?: any;
}>) => {
    dispatch({ type: "SET_TRAINING_DATA", payload: { trainingData: getTestPointsTowClasses() } });
    dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 2 } });
}

export const loadTestPointsThreeClasses = (dispatch: React.Dispatch<{
    type: string;
    payload?: any;
}>) => {
    dispatch({ type: "SET_TRAINING_DATA", payload: { trainingData: getTestPointsThreeClasses() } });
    dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 3 } });
}

export const loadTestPointsSixClasses = (dispatch: React.Dispatch<{
    type: string;
    payload?: any;
}>) => {
    dispatch({ type: "SET_TRAINING_DATA", payload: { trainingData: getTestPointsSixClasses() } });
    dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 6 } });
}

export const loadTestPointsNineClasses = (dispatch: React.Dispatch<{
    type: string;
    payload?: any;
}>) => {
    dispatch({ type: "SET_TRAINING_DATA", payload: { trainingData: getTestPointsNineClasses() } });
    dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 9 } });
}

