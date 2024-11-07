import { useEffect, useState, useRef, useCallback } from "react";
import * as d3 from 'd3';
import { HEATMAP_COLORS } from "./constants";


export function LineChart({ mse, mseValidation }) {

    var margin = { top: 0, right: 0, bottom: 30, left: 30 },
        width = 220 - margin.left - margin.right,
        height = 90 - margin.top - margin.bottom;

    const ref = useRef();

    let [svg, setSvg] = useState(null);

    // construct svg
    useEffect(() => {
        const svg = d3.select(ref.current)
        setSvg(svg);
    }, []);


    useEffect(() => {
        if (svg == null) {
            return;
        }

        svg.selectAll('*').remove();

        if (mse == null || mse.length == 0 || mseValidation == null || mseValidation.length == 0) {
            return;
        }


        let line1 = mse.map((d, i) => ({ x: i, y: d }));
        let line2 = mseValidation.map((d, i) => ({ x: i, y: d }));

        let data = line1.concat(line2);

        let x = d3.scaleLinear()
            .domain([0, line1.length])
            .range([0, width]);

        let y = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return +d.y; })])
            .range([height, 0]);

        let line = d3.line().x(d => x(d.x)).y(d => y(d.y));


        svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(d3.axisLeft(y).ticks(2));

        svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + height + ")")
            .call(d3.axisBottom(x).ticks(4));

        svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        //     .append("g")
        //     .attr("transform",
        //         "translate(" + margin.left + "," + margin.top + ")");

        svg.append("path")
            .datum(line1)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("fill", "none")
            .attr("stroke", "#4338ca")
            .attr("stroke-width", 1)
            .attr("d", d => line(line1))

        svg.append("path")
            .datum(line2)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("fill", "none")
            .attr("stroke", "#b91c1c")
            .attr("stroke-width", 1)
            .attr("d", d => line(line2))


    }, [svg, mse?.length, mseValidation?.length]);


    return (
        <div>
            <svg ref={ref} />
        </div>
    );
}