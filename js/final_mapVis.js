/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */

class MapVis {

    // constructor method to initialize Timeline object
    constructor(parentElement, casualtyData, geoData) {
        this.parentElement = parentElement;
        this.casualtyData = casualtyData;
        this.geoData = geoData;
        this.displayData = [];

        // parse date method
        this.parseDate = d3.timeParse("%Y-%m");
        this.parseMonth = d3.timeParse("%b");
        this.parseYear = d3.timeParse("%Y");

        // define colors
        this.col_range_low = "#e0ecf4";
        this.col_range_high = "#8856a7";

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 5, left: 20};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title map-title')
            .append('text')
            .text('Which states in the US suffer the most from heat?')
            .attr("font-size", "18px")
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // Create an projection
        vis.projection = d3.geoMercator()
            // .translate([vis.width / 2, vis.height / 2])
            .translate([850, 440])
            .scale([350]);

        // Define path generator
        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Draw states
        vis.states = vis.svg.selectAll(".state")
            .data(vis.geoData.features)
            .enter().append("path")
            .attr('class', 'state')
            .attr("d", vis.path)
            .attr("stroke", "grey");

        // Add the labels
        vis.svg.append("g")
            .selectAll("labels")
            .data(vis.geoData.features)
            .enter()
            .append("text")
            .attr("x", function (d) {
                return vis.path.centroid(d)[0]
            })
            .attr("y", function (d) {
                return vis.path.centroid(d)[1]
            })
            .text(function (d) {
                return d.properties.iso3166_2
            })
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .style("font-size", 11)
            .style("fill", "black")

        // Create a legend
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 2.8 / 4 - 30}, ${vis.height - 35})`);

        vis.defs = vis.legend.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        // http://bl.ocks.org/nbremer/5cd07f2cb4ad202a9facfbd5d2bc842e
        vis.linearGradient = vis.defs.append("linearGradient")
            .attr("id", "linear-gradient-map");

        //Horizontal gradient
        vis.linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        //Set the color for the start (0%)
        vis.linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#e0ecf4");

        //Set the color for the end (100%)
        vis.linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#8856a7");

        // Draw rectangle
        vis.legendWidth = vis.width * 0.3;
        vis.legendHeight = 15;

        vis.legend
            .append("rect")
            .attr("width", vis.legendWidth)
            .attr("height", vis.legendHeight)
            .style("fill", "url(#linear-gradient-map)");

        // Legend Title
        vis.svg.append("text")
            .attr("id", "y-label")
            .attr("fill", "black")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr('transform', `translate(${vis.width * 2.8 / 4 - 30}, ${vis.height - 40})`);

        // Add a tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip');


        // wrangleData
        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;

        // first, filter according to selectedTimeRange, init empty array
        let filteredData = [];

        // if there is a region selected
        if (selectedTimeRange.length !== 0) {

            // iterate over all rows the csv (dataFill)
            vis.casualtyData.forEach(row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRange[0].getTime() <= vis.parseYear(row.Year).getTime() && vis.parseYear(row.Year).getTime() <= selectedTimeRange[1].getTime()) {
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.casualtyData;
        }

        console.log(filteredData);

        // prepare covid data by grouping all rows by state
        let heatDataByState = Array.from(d3.group(filteredData, d => d.StateCode), ([key, value]) => ({key, value}))

        // have a look
        console.log(heatDataByState);

        // initialize final data structure
        vis.preProcessedData = [];

        // iterate over each state
        let formatDecimalComma = d3.format(",.2f");
        heatDataByState.forEach(state => {
            // console.log(state);

            let tmpSumDeaths = 0;
            let populationSum = 0;
            let stateFull = [""];

            state.value.forEach(entry => {
                tmpSumDeaths += +entry['Deaths'];
                populationSum += +entry['Population'];
                stateFull = entry['State'];
            });

            vis.preProcessedData.push(
                {
                    state: state.key,
                    stateFull: stateFull,
                    deathSum: tmpSumDeaths,
                    populationSum: populationSum,
                    relDeath: +formatDecimalComma((tmpSumDeaths / populationSum) * 1000000)
                }
            )
        });
         console.log(vis.preProcessedData);

        // Add colors as a property to the final dataset
        vis.range_low = d3.min(vis.preProcessedData, function (d) {
            return d.relDeath
        });
        vis.range_high = d3.max(vis.preProcessedData, function (d) {
            return d.relDeath
        });

        let colorScale = d3.scaleLinear()
            .range([vis.col_range_low, vis.col_range_high])
            .domain([vis.range_low, vis.range_high])
            .interpolate(d3.interpolateLab);

        vis.preProcessedData.map(d => d.color = colorScale(d.relDeath));
        console.log(vis.preProcessedData);

        // Optimize the structure
        vis.stateMap = {}
        vis.preProcessedData.forEach(function (d) {
            vis.stateMap[d["state"]] = d;
        })

        console.log('final data structure for myMapVis', vis.stateMap);

        vis.updateVis()
    }

    updateVis() {

        let vis = this;

        vis.states
            .attr("fill", d => vis.stateMap[d.properties.iso3166_2].color)
            .on('mouseover', function (event, d) {

                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr("opacity", "0.7")
                    .attr("stroke", "darkred")
                    .attr('fill', '#b2182b');

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px;">
                        <h3> ${vis.stateMap[d.properties.iso3166_2].stateFull}<h3>
                        <h4> Deaths (absolute): ${vis.stateMap[d.properties.iso3166_2].deathSum}</h4>
                        <h4> Death (relative): ${vis.stateMap[d.properties.iso3166_2].relDeath}</h4>                        
                        </div>`);
            })
            .on('mouseout', function (event, d) {
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'grey')
                    .attr("fill", d => vis.stateMap[d.properties.iso3166_2].color)
                    .attr("opacity", "1")

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        // Create a legend scale and axis
        vis.xScale = d3.scaleLinear()
            .range([0, vis.legendWidth])

        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale)
            .tickValues([vis.range_low,vis.range_high]);
        // .tickFormat(d3.format("~s"));
        console.log(vis.range_low);

        // Create a legend axis group
        vis.legendaxis = vis.svg.append("g")
            .attr('class', 'legend-axis')
            .attr('transform', `translate(${vis.width * 2.8 / 4 - 30}, ${vis.height - 20})`);

        // Update the legend
        vis.xScale.domain([vis.range_low, vis.range_high]);

        vis.svg.select(".legend-axis")
            .transition()
            .duration(800)
            .call(vis.xAxis);

        // Update legend titles
        vis.svg.select("#y-label")
            .text("Heat-Related Deaths per Million")
            .attr("font-family", "sans-serif")
            .attr("font-size", "8px");

    }
}
