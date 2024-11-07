import { invoke } from "@tauri-apps/api/core";
import { Fragment, useEffect, useRef, useState } from "react";
import { COLORS, SHAPES } from "./constants";



export interface TestPoint {
    x: number;
    y: number;
    color: string;
    shape: string;
}


export function TestPointsPlot({
    trainingPoints,
    validationPoints,
    testingPoints,
    bigPoints,
    showValidationPoints,
    showTestingPoints,
    predictEnabled,
}: {
    trainingPoints: number[][],
    validationPoints?: number[][],
    testingPoints?: number[][],
    bigPoints?: boolean,
    showValidationPoints?: boolean,
    showTestingPoints?: boolean
    predictEnabled?: boolean
} = {
        trainingPoints: [],
        validationPoints: [],
        testingPoints: [],
        bigPoints: false,
        showValidationPoints: false,
        showTestingPoints: false,
        predictEnabled: false
    }
) {

    let [points, setPoints] = useState<TestPoint[]>([]);
    let [valPoints, setValPoints] = useState<TestPoint[]>([]);
    let [testPoints, setTestPoints] = useState<TestPoint[]>([]);

    let ref = useRef<SVGSVGElement>(null);

    let mouseDownEventFn = async (e: MouseEvent) => {
        let rect = ref.current?.getBoundingClientRect();
        if (rect) {
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            if (predictEnabled) {
                await invoke('predict', { inputs: [x / 3.0, y / 3.0] });
            }
        }
    }

    useEffect(() => {
        let points = trainingPoints.map((trainingPoint: number[]) => {
            let [x, y] = trainingPoint.slice(0, 2);
            let output = trainingPoint.slice(2);
            let color = COLORS[output.indexOf(1)];
            let shape = SHAPES[output.indexOf(1)];
            return { x: x, y: y, color, shape };

        });
        setPoints(points);
        let valPoints = validationPoints?.map((validationPoint: number[]) => {
            let [x, y] = validationPoint.slice(0, 2);
            let output = validationPoint.slice(2);
            let color = COLORS[output.indexOf(1)];
            let shape = SHAPES[output.indexOf(1)];
            return { x: x, y: y, color, shape };
        });
        setValPoints(valPoints || []);
        let testPoints = testingPoints?.map((testPoint: number[]) => {
            let [x, y] = testPoint.slice(0, 2);
            let output = testPoint.slice(2);
            let color = COLORS[output.indexOf(1)];
            let shape = SHAPES[output.indexOf(1)];
            return { x: x, y: y, color, shape };
        });
        setTestPoints(testPoints || []);

        // track mouse position for drawing
        let svg = ref.current;
        if (svg) {
            svg.addEventListener('mousedown', mouseDownEventFn);
        }

        return () => {
            let svg = ref.current;
            if (svg) {
                svg.removeEventListener('mousedown', mouseDownEventFn);
            }
        }
    }, [
        trainingPoints,
        validationPoints,
        showValidationPoints,
        testingPoints,
        showTestingPoints,
        predictEnabled,
    ]);

    let f = () => bigPoints ? 2 : 1;

    // return either circle, rect, or triangle based on index % 3
    return (
        <div className={predictEnabled ? "cursor-pointer" : ""}>
            <svg ref={ref} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="0" x2="100" y2="0" stroke="black" />
                <line x1="0" y1="0" x2="0" y2="100" stroke="black" />
                <line x1="100" y1="0" x2="100" y2="100" stroke="black" />
                <line x1="0" y1="100" x2="100" y2="100" stroke="black" />
                {/* split x and y to halfs */}
                <line x1="50" y1="0" x2="50" y2="100" stroke="black" strokeWidth={0.1} />
                <line x1="0" y1="50" x2="100" y2="50" stroke="black" strokeWidth={0.1} />
                {/* grid  */}
                <line x1="25" y1="0" x2="25" y2="100" stroke="black" strokeWidth={0.05} />
                <line x1="75" y1="0" x2="75" y2="100" stroke="black" strokeWidth={0.05} />
                <line x1="0" y1="25" x2="100" y2="25" stroke="black" strokeWidth={0.05} />
                <line x1="0" y1="75" x2="100" y2="75" stroke="black" strokeWidth={0.05} />
                {points.map((point, index) => (

                    // <circle key={`test-point-${index}`} cx={point.x} cy={point.y} r="1" fill={point.color} />
                    // <rect key={`test-point-${index}`} x={point.x - 1} y={point.y - 1} width="2" height="2" fill={point.color} />
                    <Fragment key={`test-point-${index}`}>
                        {point.shape === "circle" && <Circle f={f} point={point} pointType="training" />}
                        {point.shape === "rect" && <Rect f={f} point={point} pointType="training" />}
                        {point.shape === "triangle" && <Triangle f={f} point={point} pointType="training" />}
                        {point.shape === "45degrect" && <FortyFiveDegRect f={f} point={point} pointType="training" />}
                    </Fragment>
                ))}
                {showValidationPoints === true && valPoints.map((point, index) => (
                    <Fragment key={`val-point-${index}`}>
                        {point.shape === "circle" && <Circle f={f} point={point} pointType="validation" />}
                        {point.shape === "rect" && <Rect f={f} point={point} pointType="validation" />}
                        {point.shape === "triangle" && <Triangle f={f} point={point} pointType="validation" />}
                        {point.shape === "45degrect" && <FortyFiveDegRect f={f} point={point} pointType="validation" />}
                    </Fragment>
                ))}
                {showTestingPoints === true && testPoints.map((point, index) => (
                    <Fragment key={`test-point-${index}`}>
                        {point.shape === "circle" && <Circle f={f} point={point} pointType="testing" />}
                        {point.shape === "rect" && <Rect f={f} point={point} pointType="testing" />}
                        {point.shape === "triangle" && <Triangle f={f} point={point} pointType="testing" />}
                        {point.shape === "45degrect" && <FortyFiveDegRect f={f} point={point} pointType="testing" />}
                    </Fragment>
                ))}
            </svg>
        </div>
    )
}

export function Circle({ point, pointType, f }: { point: TestPoint, pointType: string, f: () => number }) {
    let strokeWidth = pointType === "training" ? 0.1 : 0.5;
    let strokeColor = pointType === "training" ? "black" : pointType == "validation" ? "red" : "blue";
    return (
        <circle cx={point.x} cy={point.y} r={f()} className={point.color} stroke={strokeColor} strokeWidth={strokeWidth} />
    )
}

export function Rect({ point, pointType, f }: { point: TestPoint, pointType: string, f: () => number }) {
    let strokeWidth = pointType === "training" ? 0.1 : 0.5;
    let strokeColor = pointType === "training" ? "black" : pointType == "validation" ? "red" : "blue";
    return (
        <rect x={point.x - f()} y={point.y - f()} width={f() * 2} height={f() * 2} className={point.color} stroke={strokeColor} strokeWidth={strokeWidth} />
    )
}

export function Triangle({ point, pointType, f }: { point: TestPoint, pointType: string, f: () => number }) {
    let strokeWidth = pointType === "training" ? 0.1 : 0.5;
    let strokeColor = pointType === "training" ? "black" : pointType == "validation" ? "red" : "blue";
    return (
        <polygon points={`${point.x},${point.y - f()} ${point.x - f()},${point.y + f()} ${point.x + f()},${point.y + f()}`} className={point.color} stroke={strokeColor} strokeWidth={strokeWidth} />
    )
}

export function FortyFiveDegRect({ point, pointType, f }: { point: TestPoint, pointType: string, f: () => number }) {
    let strokeWidth = pointType === "training" ? 0.1 : 0.5;
    let strokeColor = pointType === "training" ? "black" : pointType == "validation" ? "red" : "blue";
    return (
        <polygon points={`${point.x - f() * 1.2},${point.y} ${point.x},${point.y + f() * 1.2} ${point.x + f() * 1.2},${point.y} ${point.x},${point.y - f() * 1.2}`} className={point.color} stroke={strokeColor} strokeWidth={strokeWidth} />
    )
}