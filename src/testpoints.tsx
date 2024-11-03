import { Fragment, useEffect, useState } from "react";



export interface TestPoint {
    x: number;
    y: number;
    color: string;
    shape: string;
}

const COLORS = [
    "fill-red-300",
    "fill-lime-300",
    "fill-cyan-300",
    "fill-violet-300",

    "fill-orange-300",
    "fill-emerald-300",
    "fill-sky-300",
    "fill-purple-300",

    "fill-yellow-300",
    "fill-teal-300",
    "fill-blue-300",
    "fill-fuchsia-300",
];

const SHAPES = [
    "circle",
    "rect",
    "triangle",
    "45degrect",

    "circle",
    "rect",
    "triangle",
    "45degrect",

    "circle",
    "rect",
    "triangle",
    "45degrect",
]

export function TestPointsPlot({ testPoints, validationPoints, bigPoints, showValidationPoints }: { testPoints: number[][], validationPoints?: number[][], bigPoints?: boolean, showValidationPoints?: boolean } = { testPoints: [], validationPoints: [], bigPoints: false, showValidationPoints: false }) {

    let [points, setPoints] = useState<TestPoint[]>([]);
    let [valPoints, setValPoints] = useState<TestPoint[]>([]);

    useEffect(() => {
        let points = testPoints.map((testPoint: number[]) => {
            let [x, y] = testPoint.slice(0, 2);
            let output = testPoint.slice(2);
            let color = COLORS[output.indexOf(1)];
            let shape = SHAPES[output.indexOf(1)];
            return { x: x * 100, y: y * 100, color, shape };

        });
        setPoints(points);
        let valPoints = validationPoints?.map((validationPoint: number[]) => {
            let [x, y] = validationPoint.slice(0, 2);
            let output = validationPoint.slice(2);
            let color = COLORS[output.indexOf(1)];
            let shape = SHAPES[output.indexOf(1)];
            return { x: x * 100, y: y * 100, color, shape };
        });
        setValPoints(valPoints || []);
    }, [testPoints, validationPoints, showValidationPoints]);

    let f = () => bigPoints ? 2 : 1;

    // return either circle, rect, or triangle based on index % 3
    return (
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
                    {point.shape === "circle" && <Circle f={f} point={point} isValidation={false} />}
                    {point.shape === "rect" && <Rect f={f} point={point} isValidation={false} />}
                    {point.shape === "triangle" && <Triangle f={f} point={point} isValidation={false} />}
                    {point.shape === "45degrect" && <FortyFiveDegRect f={f} point={point} isValidation={false} />}
                </Fragment>
            ))}
            {showValidationPoints === true && valPoints.map((point, index) => (
                <Fragment key={`val-point-${index}`}>
                    {point.shape === "circle" && <Circle f={f} point={point} isValidation={true} />}
                    {point.shape === "rect" && <Rect f={f} point={point} isValidation={true} />}
                    {point.shape === "triangle" && <Triangle f={f} point={point} isValidation={true} />}
                    {point.shape === "45degrect" && <FortyFiveDegRect f={f} point={point} isValidation={true} />}
                </Fragment>
            ))}
        </svg>
    )
}

function Circle({ point, isValidation, f }: { point: TestPoint, isValidation: boolean, f: () => number }) {
    return (
        <circle cx={point.x} cy={point.y} r={f()} className={point.color} stroke="black" strokeWidth={isValidation ? 0.5 : 0.1} />
    )
}

function Rect({ point, isValidation, f }: { point: TestPoint, isValidation: boolean, f: () => number }) {
    return (
        <rect x={point.x - f()} y={point.y - f()} width={f() * 2} height={f() * 2} className={point.color} stroke="black" strokeWidth={isValidation ? 0.5 : 0.1} />
    )
}

function Triangle({ point, isValidation, f }: { point: TestPoint, isValidation: boolean, f: () => number }) {
    return (
        <polygon points={`${point.x},${point.y - f()} ${point.x - f()},${point.y + f()} ${point.x + f()},${point.y + 1}`} className={point.color} stroke="black" strokeWidth={isValidation ? 0.5 : 0.1} />
    )
}

function FortyFiveDegRect({ point, isValidation, f }: { point: TestPoint, isValidation: boolean, f: () => number }) {
    return (
        <polygon points={`${point.x - f() * 1.2},${point.y} ${point.x},${point.y + f() * 1.2} ${point.x + f() * 1.2},${point.y} ${point.x},${point.y - f() * 1.2}`} className={point.color} stroke="black" strokeWidth={isValidation ? 0.5 : 0.1} />
    )
}