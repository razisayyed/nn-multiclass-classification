import { useEffect, useState, useRef, useCallback } from "react";
import * as d3 from 'd3';
import { HEATMAP_COLORS } from "./constants";


export function HeatMap({ data, classesCount }) {

    const
        n = 50,
        m = 50,
        width = 300,
        height = 300;

    const ref = useRef();

    let [svg, setSvg] = useState(null);

    // construct svg
    useEffect(() => {
        const svg = d3.select(ref.current)
            .attr("style", "")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height]);

        setSvg(svg);
    }, []);

    let pathData = useCallback((i) => {
        if (data.length == 0) {
            return null;
        }
        return data.map(row => {
            return row[i] < 0 ? 0 : row[i];
        });
    }, [data, classesCount]);

    let pathColor = useCallback((i) => {

        let color = HEATMAP_COLORS[i];
        let colorsRange = ["transparent", "transparent", color];

        let tmpScaleDomain = [0, 0.4, 1];

        let tmpScale = d3.scaleLinear()
            .domain(tmpScaleDomain)
            .range(colorsRange)
            .clamp(true);

        let colors = d3.range(0, 1 + 1E-9, 0.05).map(a => {
            return tmpScale(a);
        });
        return d3.scaleQuantize(colors).domain([0, 1]).range(colors).nice();
    }, [classesCount]);

    useEffect(() => {
        if (svg == null || data == null || data.length == 0) {
            return;
        }

        const path = d3.geoPath().projection(d3.geoIdentity().scale(width / n));
        const contours = d3.contours().size([n, m]);

        svg.selectAll('*').remove();

        for (let i = 0; i < classesCount; i++) {
            svg.append("g")
                .selectAll()
                .data(pathColor(i).ticks(20))
                .join("path")
                .attr("d", d => path(contours.contour(pathData(i), d)))
                .attr("fill", pathColor(i));
        }

    }, [svg, data]);


    return (
        <div>
            <svg ref={ref} />
        </div>
    );
}