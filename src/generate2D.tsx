export const loadPreset = (dispatch: React.Dispatch<{
    type: string;
    payload?: any;
}>, n: number | null, density: number, noise: number) => {
    if (n === null) {
        return
    }
    let trainingDensity = Math.ceil(density * 0.7);
    let validationDensity = Math.ceil(density * 0.15);
    let testingDensity = Math.ceil(density * 0.15);
    dispatch({ type: "SET_TRAINING_DATA", payload: { trainingData: preset(n, trainingDensity, noise) } });
    dispatch({ type: "SET_VALIDATION_DATA", payload: { validationData: preset(n, validationDensity, noise) } });
    dispatch({ type: "SET_TESTING_DATA", payload: { testingData: preset(n, testingDensity, noise) } });
    dispatch({ type: "SET_PRESET", payload: { preset: n } });
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
        dispatch({ type: "SET_OUTPUT_LAYER_NEURONS", payload: { neuronsCount: 6 } });
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
        [10, 10, 90, 40 + noise, [1, 0]],
        [10, 60 - noise, 90, 90, [0, 1]],
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
        [10, 80, 60, 62 + noise, [1, 0]],
        [10, 80, 78 - noise, 80, [0, 1]],
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
        [30, 32, -10, 100, [1, 0]],
        [50, 52, -10, 100, [0, 1]],
        [70, 72, -10, 100, [1, 0]],
    ];

    groups.forEach(([minRadius, maxRadius, minAngle, maxAngle, output], _index) => {
        for (let i = 0; i < density; i++) {
            let [x, y] = radiusRandom(20, minRadius, maxRadius, minAngle, maxAngle, noise);
            data.push([x, y].concat(output));
        }
    });

    return data;
}

const preset4 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, [number, number]][] = [
        [10, 10, 40 + noise, 25 + noise, [1, 0]],
        [60 - noise, 10, 90, 25 + noise, [0, 1]],
        [10, 40, 40 + noise, 55 + noise, [0, 1]],
        [60 - noise, 40, 90, 55 + noise, [1, 0]],
        [10, 70, 40 + noise, 85 + noise, [1, 0]],
        [60 - noise, 70, 90, 85 + noise, [0, 1]],
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
        [10, 10, 40 + noise, 25 + noise, [1, 0, 0]],
        [60 - noise, 10, 90, 25 + noise, [0, 1, 0]],
        [10, 40, 40 + noise, 55 + noise, [0, 0, 1]],
        [60 - noise, 40, 90, 55 + noise, [1, 0, 0]],
        [10, 70, 40 + noise, 85 + noise, [0, 1, 0]],
        [60 - noise, 70, 90, 85 + noise, [0, 0, 1]],
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
        [10, 10, 40 + noise, 25 + noise, [1, 0, 0, 0, 0, 0]],
        [60 - noise, 10, 90, 25 + noise, [0, 1, 0, 0, 0, 0]],
        [10, 40, 40 + noise, 55 + noise, [0, 0, 1, 0, 0, 0]],
        [60 - noise, 40, 90, 55 + noise, [0, 0, 0, 1, 0, 0]],
        [10, 70, 40 + noise, 85 + noise, [0, 0, 0, 0, 1, 0]],
        [60 - noise, 70, 90, 85 + noise, [0, 0, 0, 0, 0, 1]],
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
        [10, 10, 30 + noise, 30 + noise, [1, 0, 0, 0, 0, 0, 0, 0, 0]],
        [40 - noise, 10, 60 + noise, 30 + noise, [0, 1, 0, 0, 0, 0, 0, 0, 0]],
        [70 - noise, 10, 90, 30 + noise, [0, 0, 1, 0, 0, 0, 0, 0, 0]],
        [10, 40, 30 + noise, 60 + noise, [0, 0, 0, 1, 0, 0, 0, 0, 0]],
        [40 - noise, 40, 60 + noise, 60 + noise, [0, 0, 0, 0, 1, 0, 0, 0, 0]],
        [70 - noise, 40, 90, 60 + noise, [0, 0, 0, 0, 0, 1, 0, 0, 0]],
        [10, 70, 30 + noise, 90, [0, 0, 0, 0, 0, 0, 1, 0, 0]],
        [40 - noise, 70, 60 + noise, 90, [0, 0, 0, 0, 0, 0, 0, 1, 0]],
        [70 - noise, 70, 90, 90, [0, 0, 0, 0, 0, 0, 0, 0, 1]],
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
        [0, 15, 0, 360, [1, 0]],
        [25, 30, 0, 360, [0, 1]],
    ];

    groups.forEach(([minRadius, maxRadius, minAngle, maxAngle, output], index) => {
        for (let i = 0; i < density * (index + 1); i++) {
            let [x, y] = radiusRandom(50, minRadius, maxRadius, minAngle, maxAngle, noise);
            data.push([x, y].concat(output));
        }
    });

    return data;
}

const preset9 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, number[]][] = [
        [0, 15, 0, 360, [1, 0, 0]],
        [25, 30, 0, 360, [0, 1, 0]],
        [40, 45, 0, 360, [0, 0, 1]],
    ];

    groups.forEach(([minRadius, maxRadius, minAngle, maxAngle, output], index) => {
        for (let i = 0; i < density * (index + 1); i++) {
            let [x, y] = radiusRandom(50, minRadius, maxRadius, minAngle, maxAngle, noise);
            data.push([x, y].concat(output));
        }
    });

    return data;
}

const preset10 = (density: number, noise: number) => {
    let data: number[][] = [];
    let groups: [number, number, number, number, number, number[]][] = [
        [10, 30, 32, 0, 90, [1, 0, 0, 0, 0, 0]],
        [10, 40, 42, 0, 90, [0, 1, 0, 0, 0, 0]],
        [90, 40, 42, 180, 270, [0, 0, 1, 0, 0, 0]],
        [90, 30, 32, 180, 270, [0, 0, 0, 1, 0, 0]],
    ];

    groups.forEach(([center, minRadius, maxRadius, minAngle, maxAngle, output], _index) => {
        for (let i = 0; i < density; i++) {
            let [x, y] = radiusRandom(center, minRadius, maxRadius, minAngle, maxAngle, noise);
            data.push([x, y].concat(output));
        }
    });

    let groups2: [number, number, number, number, number[]][] = [
        [60, 10, 90, 40, [0, 0, 0, 0, 1, 0]],
        [10, 60, 40, 90, [0, 0, 0, 0, 0, 1]],
    ];

    groups2.forEach(([x1, y1, x2, y2, output], _index) => {
        for (let i = 0; i < density; i++) {
            let x = randomBetween(x1, x2);
            let y = randomBetween(y1, y2);
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
