/* * * * * * * * * * * * * *
*     class BrushVis       *
* * * * * * * * * * * * * */

class Brush1Vis {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];
        this.test = [];
        this.parseDate = d3.timeParse("%Y-%m");
        this.parseMonth = d3.timeParse("%b");
        this.parseYear = d3.timeParse("%Y");
        this.dateFormatter = d3.timeFormat("%Y-%b");


        // call method initVis
        this.initVis();
    }

// init brushVis

    initVis() {
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
            .text('Monthly Heat Index from 1999 - 2011')
            .attr('transform', `translate(${vis.width / 2}, 10)`)
            .attr('text-anchor', 'middle');

        // Axis title
        vis.svg.append("text")
            .attr("x", -50)
            .attr("y", -8)
            .text("Heat Index");

        // init scales
        vis.x = d3.scaleTime().range([0, vis.width]);
        vis.y = d3.scaleLinear().range([vis.height, 0]);

        // init x & y axis
        vis.xAxis = vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.yAxis = vis.svg.append("g")
            .attr("class", "y-axis axis");

        // Define the clipping region
        vis.svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);

        // init path group (IN CASE WE WANT TO ADD ADDITIONAL PATH LATER)
        vis.pathGroup = vis.svg.append('g').attr('class','pathGroup');

        // init path one
        vis.pathOne = vis.pathGroup
            .append('path')
            .attr("class", "pathOne");

        // init path generator
        vis.area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(function(d) { return vis.x(d.time); })
            .y0(vis.y(0))
            .y1(function(d) { return vis.y(d.heatIndex); });

        // init brushGroup:
        vis.brushGroup = vis.svg.append("g")
            .attr("class", "brush");

        // init brush
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            .on("brush end", function (event) {
                d3.select(".y-labels").remove();

                selectedTimeRange = [vis.x.invert(event.selection[0]), vis.x.invert(event.selection[1])];
                console.log(selectedTimeRange[0]);
                console.log(vis.dateFormatter(selectedTimeRange[0]));

                // update the year range in html
                d3.select("#startSecond").text(vis.dateFormatter(selectedTimeRange[0]));
                d3.select("#endSecond").text(vis.dateFormatter(selectedTimeRange[1]));


                myRadialBarVis.wrangleData();
                myMapVis.wrangleData();
                // myBarVisTwo.wrangleData()
            });


        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData() {

        let vis = this;

        // Prepare data for the area chart
        vis.data.forEach(d => {
            // console.log(d);
            vis.displayData.push(
                {
                    time: vis.parseDate(d.MonthCode),
                    heatIndex: +d.HeatIndex,
                    casualty: +d.Deaths,
                    year: d.Year,
                    month: d.Month
                }
            );
        })

        console.log(vis.displayData);

        this.updateVis();
    }

    updateVis(){

        let vis = this;

        // update domains
        vis.x.domain( d3.extent(vis.displayData, function(d) { return d.time }) );
        vis.y.domain( d3.extent(vis.displayData, function(d) { return d.heatIndex }) );

        // Add the area
        // draw pathOne
        vis.pathOne.datum(vis.displayData)
            .transition().duration(400)
            .attr("d", vis.area)
            .attr("fill", "#ffc6b1")
            .attr("stroke", "#ff6227")
            .attr("clip-path", "url(#clip)");

        // draw x & y axis
        vis.xAxis.transition().duration(400).call(d3.axisBottom(vis.x).tickFormat(d3.timeFormat("%b %Y")));
        vis.yAxis.transition().duration(400).call(d3.axisLeft(vis.y).ticks(5));

        vis.brushGroup
            .call(vis.brush);




    }
}
