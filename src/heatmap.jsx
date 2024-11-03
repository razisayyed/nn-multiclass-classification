import { useEffect, useState, useRef } from "react";
import * as d3 from 'd3';


export function HeatMap({ data }) {

    const n = 50,
        m = 50,
        width = 300,
        height = 300;

    const ref = useRef();

    let [svg, setSvg] = useState(null);
    let [contours, setContours] = useState([]);

    useEffect(() => {
        const svg = d3.select(ref.current)
            .attr("style", "transform: rotate(-90deg) scaleX(-1);")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        setSvg(svg);
    }, []);


    useEffect(() => {
        let min = 0, max = 1;
        if (data.length > 0) {
            min = data.reduce((a, b) => Math.min(a, b));
            max = data.reduce((a, b) => Math.max(a, b));

        }
        const path = d3.geoPath().projection(d3.geoIdentity().scale(width / n));
        const contours = d3.contours().size([n, m]);
        const color = d3.scaleSequential(d3.interpolateCool).domain([Math.floor(min), Math.ceil(max)]).nice();

        if (svg == null) {
            return;
        }
        svg.selectAll("*").remove();

        svg.append("g")
            // .attr("stroke", "black")
            .selectAll()
            .data(color.ticks(27))
            .join("path")
            .attr("d", d => path(contours.contour(data, d)))
            .attr("fill", color);

    }, [svg, data]);

    return (
        <div>
            <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`} />
            {/* <svg width="400" height="400" viewBox="0 0 100 100" >
                <g>
                    {
                        contours.map((contour, i) => (
                            <path
                                key={`contour-path-${i}`}
                                d={d3.geoPath()(contour) ?? ""}
                                fill={d3.schemeTableau10[i]}
                            />
                        ))
                    }
                </g>
            </svg> */}
        </div>
    );
}