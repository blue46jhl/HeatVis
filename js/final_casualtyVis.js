/* * * * * * * * * * * * * *
*      class TotalVis        *
* * * * * * * * * * * * * */


class CasualtyVis {

    constructor(parentElement, heatData, MyEventHandler) {
        this.parentElement = parentElement;
        this.heatData = heatData;
        this.MyEventHandler = MyEventHandler;

        // parse date method
        this.parseDate = d3.timeParse("%Y");

        // define colors
        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 60, right: 40, bottom: 60, left: 80};

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
            .range([ 0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0 ]);

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

        // init brushGroup:
        vis.brushGroup = vis.svg.append("g")
            .attr("class", "brush");

        // Initialize brushing component
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush", function (event) {
                // User just selected a specific region
                vis.currentBrushRegion = event.selection;
                vis.currentBrushRegion = vis.currentBrushRegion.map(vis.x.invert);

                console.log(vis.currentBrushRegion);

                // 3. Trigger the event 'selectionChanged' of our event handler
                $(vis.MyEventHandler).trigger("selectionChanged", vis.currentBrushRegion);
            });

        // Append brush component here
        vis.svg.append("g")
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", vis.height + 7);

        vis.wrangleData();
    }

    /*
     *  Data wrangling
     */
    wrangleData () {
        let vis = this;

        // create empty data structure
        vis.displayData = [];

        // Prepare data by looping over stations and populating empty data structure
        vis.heatData.forEach(d => {
            // console.log(d);
            vis.displayData.push(
                {
                    year: vis.parseDate(d.year),
                    total: +d.total
                }
                );
        })

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Call brush component
        vis.brushGroup.call(vis.brush);

        // Dot size scale
        vis.totalScale = d3.scaleLinear()
            .domain([d3.min(vis.displayData, d=>d.total ), d3.max(vis.displayData, d=>d.total)])
            .range([10, 30]);

        // define colors
        vis.col_range_low = "#FF8A8A";
        vis.col_range_high = "#791212";

        vis.colorScale = d3.scaleLinear()
            .domain([d3.min(vis.displayData, d=>d.total ), d3.max(vis.displayData, d=>d.total)])
            .range([vis.col_range_low,vis.col_range_high]);

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

        vis.svg.select(".y-axis")
            .transition()
            .duration(800)
            .call(vis.yAxis)

        vis.svg.select(".x-axis")
            .transition()
            .duration(800)
            .call(vis.xAxis);
    }

    onSelectionChange (rangeStart, rangeEnd){
        let vis = this;
        let dateFormatter = d3.timeFormat("%Y")

        d3.select("#start").text(dateFormatter(rangeStart));
        d3.select("#end").text(dateFormatter(rangeEnd));

        vis.wrangleData();
    }
}
