/* * * * * * * * * * * * * *
*     class RadialBarVis       *
* * * * * * * * * * * * * */

class RadialBarVis {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];
        this.parseDate = d3.timeParse("%Y-%m");
        this.parseMonth = d3.timeParse("%b");

        // define colors
        this.col_range_low = "#fff1eb";
        this.col_range_high = "#ff4500";

        // call method initVis
        this.initVis();
    }

// init brushVis

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 50, bottom: 25, left: 50};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (vis.width / 2 + vis.margin.left) + "," + (vis.height / 2 + vis.margin.top) + ")");

        // add title
        vis.svg.append('g')
            .attr('class', 'title')
            .append('text')
            .text('What happens during summer time?')
            .attr('transform', `translate(${vis.width / 2 - 450}, 225)`)
            .attr('text-anchor', 'middle');

        // Axis title
        vis.svg.append("text")
            .attr("x", vis.width / 6 - 135)
            .attr("y", -225)
            .text("Heat-Related Death Toll")
            .attr("font-family", "sans-serif")
            .attr("font-size", "8px");

        // define radius for the radial chart
        vis.innerRadius = 90
        vis.outerRadius = Math.min(vis.width, vis.height) / 2;   // the outerRadius goes from the middle of the SVG area to the border

        // define x scale
        vis.x = d3.scaleBand()
            .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
            .align(0);             // This does nothing

        // define y scale
        vis.y = d3.scaleRadial()
            .range([vis.innerRadius, vis.outerRadius]);   // Domain will be define later.

        // Creat bar labels
        vis.barLabels = vis.svg.append("g")
            .attr('class', 'bar-labels');
            // .append("text");

        // Create a legend
        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width / 2 - 150}, 200)`);

        vis.defs = vis.legend.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        // http://bl.ocks.org/nbremer/5cd07f2cb4ad202a9facfbd5d2bc842e
        vis.linearGradient = vis.defs.append("linearGradient")
            .attr("id", "linear-gradient");

        //Horizontal gradient
        vis.linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        //Set the color for the start (0%)
        vis.linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#fff1eb");

        //Set the color for the end (100%)
        vis.linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#ff4500");

        // Draw rectangle
        vis.legendWidth = vis.width * 0.3;
        vis.legendHeight = 15;

        vis.legend
            .append("rect")
            .attr("width", vis.legendWidth)
            .attr("height", vis.legendHeight)
            .style("fill", "url(#linear-gradient)");

        // Legend Title
        vis.svg.append("text")
            .attr("id", "y-label")
            .attr("fill", "black")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr('transform', `translate(${vis.width / 2 - 150}, 195)`);

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData() {

        let vis = this;

        // first, filter according to selectedTimeRange, init empty array
        let selectedData = [];

        // if there is a region selected
        if (selectedTimeRange.length !== 0) {
            //console.log('region selected', tableObject.selectedTimeRange, tableObject.selectedTimeRange[0].getTime() )

            // iterate over all rows the csv (dataFill)
            vis.data.forEach(row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRange[0].getTime() <= vis.parseDate(row.MonthCode).getTime() && vis.parseDate(row.MonthCode).getTime() <= selectedTimeRange[1].getTime()) {
                    selectedData.push(row);
                }
            });
        } else {
            selectedData = vis.data;
        }

        console.log(selectedData);

        // prepare casualty data by grouping all rows by month
        let dataByMonth = Array.from(d3.group(selectedData, d =>d.Month), ([key, value]) => ({key, value}));
        console.log('check out data by month', dataByMonth);


        // initialize final data structure
        vis.preProcessedData = [];

        // iterate over each month
        let formatDecimalComma = d3.format(",.2f");
        dataByMonth.forEach( month => {
            //console.log(month);
            let tmpSumDeaths = 0;
            let heatSumIndex = 0;
            month.value.forEach( entry => {
                tmpSumDeaths += +entry['Deaths'];
                heatSumIndex += +entry['HeatIndex'];
            });

            vis.preProcessedData.push (
                {
                    Time: month.key,
                    Deaths: tmpSumDeaths,
                    AvgDeaths: +formatDecimalComma(tmpSumDeaths/month.value.length),
                    AvgIndex: +formatDecimalComma(heatSumIndex/month.value.length)
                }
            )
        });

       // check final data structure
        console.log('check out the data', vis.preProcessedData);

        this.updateVis();
    }

    updateVis(){

        let vis = this;

        // Color range and domain update
        vis.range_low = d3.min(vis.preProcessedData, function(d){return d.AvgIndex});
        vis.range_high = d3.max(vis.preProcessedData, function(d){return d.AvgIndex});
        // console.log(vis.range_low);

        let colorScale = d3.scaleLinear()
            .range([vis.col_range_low, vis.col_range_high])
            .domain([vis.range_low,vis.range_high])
            .interpolate(d3.interpolateLab);

        // assign color for each month
        vis.preProcessedData.map(d => d.color = colorScale(d.AvgIndex));

        // draw bars
        vis.bars = vis.svg.selectAll("path")
            .data(vis.preProcessedData);

        // update domains
        vis.x.domain(vis.preProcessedData.map(function(d) { return d.Time; })); // The domain of the X axis is the list of month.
        vis.y.domain([0, d3.max(vis.preProcessedData, d => d.AvgDeaths)]); // Domain of Y is from 0 to the max seen in the data

        // update the bars
        vis.bars
            .enter()
            .append("path")
            .attr("class", "bar")
            .merge(vis.bars)
            .transition()
            .duration(800)
            .style("fill", d => colorScale(d.AvgIndex))
            .attr("d", d3.arc()     // imagine your doing a part of a donut plot
                .innerRadius(vis.innerRadius)
                .outerRadius(function(d) { return vis.y(d.AvgDeaths); })
                .startAngle(function(d) { return vis.x(d.Time); })
                .endAngle(function(d) { return vis.x(d.Time) + vis.x.bandwidth(); })
                .padAngle(0.01)
                .padRadius(vis.innerRadius));

        // Add bar labels
        vis.labels = vis.barLabels.selectAll("g")
            .data(vis.preProcessedData, function(d){
                return d.Time;
            });

        // update bar labels
        vis.labels
            .enter()
            .append("g")
            .attr("class", "labels")
            .merge(vis.labels)
            .attr("text-anchor", function(d) { return (vis.x(d.Time) + vis.x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
            .attr("transform", function(d) {return "rotate(" + ((vis.x(d.Time) + vis.x.bandwidth() / 2) * 180 / Math.PI - 90) + ")"+"translate(" + (vis.innerRadius - 20) + ",0)"; })
            .append("text")
            .text(function(d){return(d.Time)})
            .attr("transform", function(d) { return (vis.x(d.Time) + vis.x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
            .style("font-size", "11px")
            .attr("alignment-baseline", "middle");

        vis.months = vis.labels.selectAll("text");

        vis.months
            .enter()
            .append("text")
            .attr("class", "month")
            .merge(vis.months)
            .text(function(d){
                // console.log(d)
                return(d.Time)})
            .attr("transform", function(d) { return (vis.x(d.Time) + vis.x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
            .style("font-size", "11px")
            .attr("alignment-baseline", "middle");

        // exit bar labels
        vis.labels.exit().remove();
        vis.months.exit().remove();

        // append  outer circles
        vis.circles = vis.svg.selectAll("circle").data(vis.y.ticks(5).slice(1));

        vis.circles
            .enter()
            .append("circle")
            .merge(vis.circles)
            .attr("class", "circle")
            .attr("fill", "none")
            .attr("stroke", "black")
            .style("stroke-dasharray", "2,2")
            .attr("opacity", 0.2)
            .attr("r", vis.y);

        vis.circles.exit().remove();

        // add y-labels
        vis.yLabelGroup = vis.svg.append("g")
            .attr("class", "y-labels")

        vis.ylabels = vis.yLabelGroup.selectAll("text").data(vis.y.ticks(5).slice(1));

        vis.ylabels
            .enter()
            .append("text")
            .merge(vis.ylabels)
            .attr("text-anchor", "middle")
            .attr("x",5)
            .attr("y", function(d) { return -vis.y(d); })
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .text(function(d) { return d; })
            .attr("stroke", "black");

        vis.ylabels.remove().exit();

        // Create a legend scale and axis
        vis.xScale = d3.scaleLinear()
            .range([0, vis.legendWidth])

        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale)
            .tickValues([vis.range_low,vis.range_high]);
        // console.log(vis.range_low);

        // Create a legend axis group
        vis.legendaxis = vis.svg.append("g")
            .attr('class', 'legend-axis')
            .attr('transform', `translate(${vis.width / 2 - 150}, 215)`);

        // Update the legend
        vis.xScale.domain([vis.range_low, vis.range_high]);

        vis.svg.select(".legend-axis")
            .transition()
            .duration(800)
            .call(vis.xAxis);

        // Update legend titles
        vis.svg.select("#y-label")
            .text("Average Heat Index (°C)");

    }
}
