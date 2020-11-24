/* * * * * * * * * * * * * *
*      class CarbonVis        *
* * * * * * * * * * * * * */

class CarbonVis {

    constructor(parentElement, carbonData, heatData){
        this.parentElement = parentElement;
        this.carbonData = carbonData;
        this.heatData = heatData;

        // parse date method
        // Date parser
        this.formatDate = d3.timeFormat("%Y");
        this.parseDate = d3.timeParse("%Y");

        this.initVis()
    }

    initVis(){
        let vis = this;

        vis.margin = {top: 40, right: 40, bottom: 60, left: 60};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;
        console.log(vis.height)
        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text("Heat Waves in US by Year: 1981-2010")
            .attr("font-family", "Impact")
            .attr("font-weight", 300)
            .attr('transform', `translate(${vis.width * 3 / 6}, -10)`)
            .attr('text-anchor', 'middle');
        
        // init scales
        vis.x = d3.scaleTime()
            .rangeRound([0, vis.width])

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        // init x & y axis
        vis.xAxisGroup = vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
        vis.yAxisGroup = vis.svg.append("g")
            .attr("class", "axis y-axis");

        // init path
        vis.path = vis.svg.append("path")
            .attr("class", "line")
            .style("opacity", 1)
        
        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .style("z-index", 2)
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "5px")	
            .style("opacity", 0)

        this.wrangleData();
    }

    wrangleData(){
        let vis = this

        let selectedCategory = $('#climateCategorySelector').val()

        let filteredData = [];

        // if there is a region selected
        if (selectedTimeRangeCarbon.length !== 0){

            // iterate over all rows the csv (dataFill)
            vis.heatData.forEach( row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRangeCarbon[0].getTime() <= vis.parseDate(row.Year).getTime() && vis.parseDate(row.Year).getTime() <= selectedTimeRangeCarbon[1].getTime() ){
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.heatData;
        }
        // init final data structure in which both data sets will be merged into
        vis.displayData = []

        // merge
        filteredData.forEach( d => {
            // populate the final data structure
            d.hw_days_dailyMax = +d.hw_days_dailyMax;
            d.avg_hw_days_dailyMax = +d.avg_hw_days_dailyMax;
            vis.displayData.push(
                {
                    year: vis.parseDate(d.Year),
                    cum_heatwaves: d.hw_days_dailyMax,
                    avg_heatwaves: d.avg_hw_days_dailyMax
                }
            )
        })
        // sort the final data
        // vis.displayData.sort((a,b) => {return b[selectedCategory] - a[selectedCategory]})
        // check the final data
        console.log(vis.displayData)
        vis.updateVis()

    }

    updateVis(){
        let vis = this;
        let selectedCategory = $('#climateCategorySelector').val()
        console.log(selectedCategory)

        // update x and y domains
        vis.x.domain(d3.extent(vis.displayData, d => d.year))
        vis.y.domain([0, d3.max(vis.displayData, d => d[selectedCategory])]);

        vis.valueLine = d3.line()
            .x(d => vis.x(d.year))
            .y(d => vis.y(d[selectedCategory]))
            .curve(d3.curveLinear)

        let circle = vis.svg.selectAll("circle")
            .data(vis.displayData, d=>d.year)
        
        circle.enter().append("circle")
            .merge(circle)
            .on("mouseover", function(event,d) {
                console.log(event.pageX)
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'red')
                vis.tooltip	
                    .transition()
                    .duration(800)
                    .style("opacity", .9)
                // "Year: " + vis.formatDate(d.year) + "</br>" + selectedCategory + ": " + d[selectedCategory]
                vis.tooltip.html(
                    `<div style="border: thin solid grey; border-radius: 2px; background: lightgrey; padding: 10px">
                        <h3>${vis.formatDate(d.year)}<h3>
                        <h4> Total Number of Heat Waves: ${(d.cum_heatwaves).toLocaleString()}</h4>      
                        <h4> Average Number of Heat Waves: ${d.avg_heatwaves}</h4>    
                    </div>`
                )
                    .style("left", (event.pageX + 20) + "px")		
                    .style("top", (event.pageY - 100) + "px")
            })
            .on("mouseout", function(d) {
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr("stroke", "black")
                    .attr("fill", "lightgreen")
                vis.tooltip.style("opacity", 0)
            })
            .style("opacity", .6)
            .attr("fill", "lightgreen")
            .attr("stroke-width", "1px")
            .attr("stroke", "black")
            .attr("cy", d=> vis.y(d[selectedCategory]))
            .transition()
            .duration(800)
            .attr("cx", d=> vis.x(d.year))
            .attr("r", 8)
    
        circle.exit().remove();
        
         // draw x & y axis
         vis.xAxisGroup.transition().duration(400).call(d3.axisBottom(vis.x))
         .selectAll("text")  
         .attr("font-size", "7.5px")
         .style("text-anchor", "end")
         .attr("dx", "-.8em")
         .attr("dy", ".15em")
         .attr("transform", "rotate(-45)");

        vis.yAxisGroup.transition().duration(400).call(d3.axisLeft(vis.y))
            .selectAll("text")  
            .attr("font-size", "10px");
        
        vis.svg.select(".line")
            .datum(vis.displayData)
            .transition()
            .duration(800)
            .attr("d", vis.valueLine)
    }
}