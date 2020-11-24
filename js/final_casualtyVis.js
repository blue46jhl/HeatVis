/* * * * * * * * * * * * * *
*      class TotalVis        *
* * * * * * * * * * * * * */


class CasualtyVis {

    constructor(parentElement, heatData) {
        this.parentElement = parentElement;
        this.heatData = heatData;

        // parse date method
        this.parseDate = d3.timeParse("%Y");
        this.dateFormatter = d3.timeFormat("%Y");

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 60, right: 80, bottom: 60, left: 80};

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = 400 - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // Scales
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        // Define x and y axis
        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.timeFormat("%Y"))
            .ticks(20);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        //Create X axis
        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (vis.height) + ")");

        //Create Y axis
        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(" + (-40) + ",0)");

        // // init brushGroup:
        vis.brushGroup = vis.svg.append("g")
            .attr("class", "brush");

        // init brush
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush end", function (event) {
                filteredTimeRange = [vis.x.invert(event.selection[0]), vis.x.invert(event.selection[1])];
                console.log(filteredTimeRange[0]);
                console.log(vis.dateFormatter(filteredTimeRange[0]));

                // update the year range in html
                d3.select("#start").text(vis.dateFormatter(filteredTimeRange[0]));
                d3.select("#end").text(vis.dateFormatter(filteredTimeRange[1]));


                myDotVis.wrangleData();
                // myBarVisTwo.wrangleData()
            });

        // Append brush component here
        vis.svg.append("g")
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", vis.height + 7);

        // Add a tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'circleTooltip');

        vis.wrangleData();
    }

    /*
     *  Data wrangling
     */
    wrangleData() {
        let vis = this;

        // create empty data structure
        vis.myData = [];

        // Prepare data by looping over stations and populating empty data structure
        vis.heatData.forEach(d => {
            // console.log(d);
            vis.myData.push(
                {
                    time: d.year,
                    year: vis.parseDate(d.year),
                    total: +d.total,
                    population: +d.poplulation,
                    female: +d.female,
                    femalePopulation: +d.female_population,
                    male: +d.male,
                    malePopulation: +d.male_population
                }
            );
        })

        console.log(vis.myData);

        // Define displayData
        vis.displayData = [];

        let formatDecimalComma = d3.format(",.2f");
        vis.myData.forEach(d => {
            // console.log(d);
            vis.displayData.push(
                {
                    time: d.time,
                    year: d.year,
                    total: d.total,
                    population: d.population,
                    deathRate: formatDecimalComma(d.total / d.population * 1000000)
                }
            );
        })

        console.log(vis.displayData);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Dot size scale
        vis.totalScale = d3.scaleLinear()
            .domain([d3.min(vis.displayData, d => d.total), d3.max(vis.displayData, d => d.total)])
            .range([10, 30]);

        // define colors
        vis.col_range_low = "#FF8A8A";
        vis.col_range_high = "#791212";

        vis.colorScale = d3.scaleLinear()
            .domain([d3.min(vis.displayData, d => d.total), d3.max(vis.displayData, d => d.total)])
            .range([vis.col_range_low, vis.col_range_high]);

        // Draw dots
        vis.circles = vis.svg.selectAll("circle")
            .data(vis.displayData);

        // Create the initial plot
        vis.x.domain(d3.extent(vis.displayData, d => d.year))
        vis.y.domain([0, d3.max(vis.displayData, d => d.total)]);

        // Draw circles
        vis.circles.enter()
            .append("circle")
            .merge(vis.circles)
            .transition()
            .duration(800)
            .attr("class", "circle")
            .attr("fill", d => vis.colorScale(d.total))
            .attr("cx", d => vis.x(d.year))
            .attr("cy", d => vis.y(d.total))
            .attr("stroke", "grey")
            .attr("r", d => vis.totalScale(d.total));

        vis.circles
            .on('mouseover', function (event, d) {
                console.log(d);

                // update the area chart when selecting a year
                // selectedYear = d.year;

                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr("opacity", "0.7")
                    .attr("stroke", "darkred")
                    .attr("fill", d => vis.colorScale(d.total));

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px;">
                        <h3> ${d.time}<h3>
                        <h4> Population: ${d.population}</h4>      
                        <h4> Deaths (absolute): ${d.total}</h4>
                        <h4> Death per million: ${d.deathRate}</h4>                        
                        </div>`);
            })
            .on('mouseout', function (event, d) {
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr("fill", d => vis.colorScale(d.total))
                    .attr("opacity", "1")
                    .attr("stroke", "grey");

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        vis.svg.select(".y-axis")
            .transition()
            .duration(800)
            .call(vis.yAxis)

        vis.svg.select(".x-axis")
            .transition()
            .duration(800)
            .call(vis.xAxis);

        // Call brush component
        vis.brushGroup.call(vis.brush);
    }
}
