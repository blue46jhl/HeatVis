/* * * * * * * * * * * * * *
*      class DotVis        *
* * * * * * * * * * * * * */


class DotVis {

    constructor(parentElement, heatData) {
        this.parentElement = parentElement;
        this.heatData = heatData;
        // this.avgData = avgData;

        // parse date method
        this.parseDate = d3.timeParse("%Y");

        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 80, right: 0, bottom: 60, left: 60};

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = 400 - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.wrangleData();
    }

    /*
     *  Data wrangling
     */
    wrangleData () {
        let vis = this;

        // create empty data structure
        vis.myData = [];

        // Prepare data by looping over stations and populating empty data structure
        vis.heatData.forEach(d => {
            console.log(d);
            vis.myData.push(
                {
                    year: vis.parseDate(d.year),
                    total: +d.total,
                    female: +d.female,
                    male: +d.male
                }
            );
        })

        vis.annualAverage = Math.round(vis.myData.reduce((acc, b) => acc + b.total, 0)/vis.myData.length);
        vis.avgFemale = Math.round(vis.myData.reduce((acc, b) => acc + b.female, 0)/vis.myData.length);
        vis.avgMale = Math.round(vis.myData.reduce((acc, b) => acc + b.male, 0)/vis.myData.length);

        vis.absDeathsByGender = [vis.avgFemale, vis.avgMale];
        console.log(vis.absDeathsByGender);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // average number of deaths by gender
        let xCenter = [vis.width/20 + 40, vis.width/2 + 40];
        let colorScale = ["#C79A7C", '#50787A'];

        vis.clusterNumber = vis.absDeathsByGender;
        vis.numNodes = vis.annualAverage;
        vis.m = vis.clusterNumber.length;

        // https://stackoverflow.com/questions/33022857/specifying-a-number-of-nodes-in-each-cluster-of-clustered-force-layout-in-d3js
        // The largest node for each cluster.
        vis.clusters = new Array(vis.m);

        vis.nodes = [];
        vis.clusterNumber.forEach(function (cn, i) {
            //this will make a cluster
            let r = 8;
            for (let j = 0; j < cn; j++) {
                //this loop will make all the nodes
                let d = {
                    cluster: i,
                    radius: r,
                    x: Math.cos(i / vis.m * 2) * 200 + vis.width / 2 + Math.random(),
                    y: Math.sin(i / vis.m * 2) * 200 + vis.height / 2 + Math.random()
                };
                if (!vis.clusters[i] || (r > vis.clusters[i].radius)) vis.clusters[i] = d;
                vis.nodes.push(d);
            }

            console.log(vis.nodes);
        });

        vis.simulation = d3.forceSimulation(vis.nodes)
            .force('charge', d3.forceManyBody().strength(5))
            .force('x', d3.forceX().x(function(d) {
                    return xCenter[d.cluster];
                }
            ))
            .force('y', d3.forceY().y(function(d) {
                    return 150;
                }
            ))
            .force('collision', d3.forceCollide().radius(function(d) {
                return d.radius;
            }))
            .on('tick', ticked);

        function ticked() {
            let u = vis.svg.selectAll("circle")
                .data(vis.nodes);

            u.enter()
                .append('circle')
                .attr('r', function(d) {
                    return d.radius;
                })
                .style('fill', function(d) {
                    return colorScale[d.cluster];
                })
                .merge(u)
                .attr('cx', function(d) {
                    return d.x;
                })
                .attr('cy', function(d) {
                    return d.y;
                })
                .attr('opacity', 0.9);

            u.exit().remove();
        }

        // Legend
        vis.legendFemale = vis.svg.append("g")
            .attr('class', 'legendFemale');

        vis.legendFemale
            .append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("x", 225)
            .attr("y", 0)
            .style("fill", "#C79A7C")
            .attr("opacity", 0.8);

        vis.legendFemale
            .append("text")
            .attr("x", 250)
            .attr("y", 10)
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .text("Female: 217");

        vis.legendMale = vis.svg.append("g")
            .attr('class', 'legendBusiness');

        vis.legendMale
            .append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("x", 725)
            .attr("y", 0)
            .style("fill", "#50787A")
            .attr("opacity", 0.8);

        vis.legendMale
            .append("text")
            .attr("x", 750)
            .attr("y", 10)
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .text("Male: 471");

        // bubble charts average across 1999-2018
        // vis.numNodes = vis.annualAverage;
        // vis.nodesTotal = d3.range(vis.numNodes).map(function(d) {
        //     return {radius: 8}
        // })
        //
        // vis.simulationTotal = d3.forceSimulation(vis.nodesTotal)
        //     .force('charge', d3.forceManyBody().strength(5))
        //     .force('center', d3.forceCenter(vis.width / 2, vis.height / 2 - 80))
        //     .force('collision', d3.forceCollide().radius(function(d) {
        //         // console.log(d);
        //         return d.radius
        //     }))
        //     .on('tick', ticked);
        //
        // function ticked() {
        //     let t = vis.svg.selectAll('circle')
        //         .data(vis.nodesTotal)
        //
        //     t.enter()
        //         .append('circle')
        //         .attr('r', function(d) {
        //             return d.radius
        //         })
        //         .merge(t)
        //         .attr('cx', function(d) {
        //             return d.x
        //         })
        //         .attr('cy', function(d) {
        //             return d.y
        //         })
        //         .style("fill", "#6E6E6E")
        //         .attr("opacity", 0.9);
        //
        //     t.exit().remove()
        // }
        //
        // vis.legendAvg = vis.svg.append("g")
        //             .attr('class', 'legendAvg');
        //
        //         vis.legendAvg
        //             .append("rect")
        //             .attr("width", 15)
        //             .attr("height", 15)
        //             .attr("x", 725)
        //             .attr("y", 0)
        //             .style("fill", "#6E6E6E")
        //             .attr("opacity", 0.8);
        //
        //         vis.legendAvg
        //             .append("text")
        //             .attr("x", 750)
        //             .attr("y", 10)
        //             .attr("font-family", "sans-serif")
        //             .attr("font-size", "12px")
        //             .text("Average Death per Year: 688");

    }

    onSelectionChange (rangeStart, rangeEnd){
        let vis = this;
        // Filter data depending on selected time period (brush)

        vis.filteredData = vis.myData.filter(function(d){
            // console.log(d);
            return (d.year) >= rangeStart && (d.year) <= rangeEnd;
        })

        console.log(vis.filteredData);
        console.log(Math.round(vis.filteredData.reduce((acc, b) => acc + b.total, 0)/vis.filteredData.length));
        console.log(Math.round(vis.filteredData.reduce((acc, b) => acc + b.female, 0)/vis.filteredData.length));
        console.log(Math.round(vis.filteredData.reduce((acc, b) => acc + b.male, 0)/vis.filteredData.length));

        // vis.wrangleData();
    }
}
