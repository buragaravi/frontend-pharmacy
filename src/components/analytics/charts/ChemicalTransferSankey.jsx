import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const ChemicalTransferSankey = ({ transferData, width = 800, height = 500 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!transferData || !transferData.nodes) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Set up sankey diagram
    const sankeyGenerator = sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 6]]);

    const { nodes, links } = sankeyGenerator(transferData);

    // Color scale for nodes
    const color = d3.scaleOrdinal()
      .domain(nodes.map(d => d.name))
      .range(d3.schemeTableau10);

    // Draw the nodes
    svg.append("g")
      .selectAll("rect")
      .data(nodes)
      .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => color(d.name))
        .attr("stroke", "#000");

    // Add labels
    svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => `${d.name} (${d.value})`)
        .style("font-size", "12px");

    // Draw the links
    svg.append("g")
      .selectAll("path")
      .data(links)
      .join("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("stroke", d => d3.interpolateRgb(
          color(d.source.name), 
          color(d.target.name)
        )(0.5))
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", d => Math.max(1, d.width));

    // Add link titles
    svg.append("g")
      .selectAll("title")
      .data(links)
      .join("title")
        .text(d => `${d.source.name} → ${d.target.name}\n${d.value} units`);

  }, [transferData, width, height]);

  return (
    <div className="chart-container">
      <h3>Chemical Transfers Between Labs</h3>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
};

export default ChemicalTransferSankey;