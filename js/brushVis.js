/* * * * * * * * * * * * * *
*     class BrushVis       *
* * * * * * * * * * * * * */

BrushVis = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.parseDate = d3.timeParse("%Y");

    // call method initVis
    this.initVis();
};

// init brushVis
BrushVis.prototype.initVis = function() {
    let vis = this;

    vis.margin = {top: 20, right: 50, bottom: 20, left: 50};
    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // clip path
    vis.svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // add title
    vis.svg.append('g')
        .attr('class', 'title')
        .append('text')
        .text('Carbon Dioxide Emissions 1981-2010')
        .attr("z-index", 1)
        .attr("font-family", "Gothic")
        .attr("font-weight", 900)
        .attr("font-size", "16px")
        .attr('transform', `translate(${vis.width/2}, 20)`)
        .attr('text-anchor', 'middle');

    // init scales
    vis.x = d3.scaleTime().range([0, vis.width]);
    vis.y = d3.scaleLinear().range([vis.height, 0]);

    // init x & y axis
    vis.xAxis = vis.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + vis.height + ")");
    vis.yAxis = vis.svg.append("g")
        .attr("class", "axis axis--y");

    // init pathGroup
    vis.pathGroup = vis.svg.append('g').attr('class','pathGroup');

    // init path one (average)
    vis.pathOne = vis.pathGroup
        .append('path')
        .attr("class", "pathOne");

    // init path generator
    vis.area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return vis.x(d.year); })
        .y0(vis.y(0))
        .y1(function(d) { return vis.y(d.co2); });

    // init brushGroup:
    vis.brushGroup = vis.svg.append("g")
        .attr("class", "brush");

    // init brush
    vis.brush = d3.brushX()
        .extent([[0, 0], [vis.width, vis.height]])
        .on("brush end", function(event){
            selectedTimeRange = [vis.x.invert(event.selection[0]), vis.x.invert(event.selection[1])];
            myCarbonVis.wrangleData();
        });

    // init basic data processing
    this.wrangleDataStatic();
};

// init basic data processing - prepares data for brush - done only once
BrushVis.prototype.wrangleDataStatic = function() {
    let vis = this;

    // merge

    vis.displayData = []
    vis.data.forEach( d => {
        // populate the final data structure
        d.co2 = +d.co2;
        d.share_global_cumulative_co2 = +d.share_global_cumulative_co2;
        vis.displayData.push(
            {
                year: vis.parseDate(d.year),
                co2: d.co2,
                share_co2: d.share_global_cumulative_co2
            }
        )
    })
    // get dates between 1981-2010
    vis.finalData = vis.displayData.slice(230, 263)
    this.wrangleData();
};


// wrangleData - gets called whenever a state is selected
BrushVis.prototype.wrangleData = function(){
    let vis = this;

    // Update the visualization
    this.updateVis();
};

// updateVis
BrushVis.prototype.updateVis = function() {
    let vis = this;

    // update domains
    vis.x.domain( d3.extent(vis.finalData, function(d) { return d.year }) );
    vis.y.domain( d3.extent(vis.finalData, function(d) { return d.co2 }) );

    console.log("test")

    // draw x & y axis
    vis.xAxis.transition().duration(400).call(d3.axisBottom(vis.x));
    vis.yAxis.transition().duration(400).call(d3.axisLeft(vis.y).ticks(5));


    // draw pathOne
    vis.pathOne.datum(vis.finalData)
        .transition().duration(400)
        .attr("d", vis.area)
        .attr("fill", "#428A8D")
        .attr("stroke", "#136D70")
        .attr("opacity", .3)
        .attr("clip-path", "url(#clip)");

    vis.brushGroup
        .call(vis.brush);
};