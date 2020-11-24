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
            vis.height = 800 - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // Cluster labels
        vis.svg.append("text")
            .attr("id", "cluster-1")
            .attr("fill", "black")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr('x', 40)
            .attr('y', 10);

        vis.svg.append("text")
            .attr("id", "cluster-2")
            .attr("fill", "black")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr('x', 255)
            .attr('y', 10);

        vis.svg.append("text")
            .attr("id", "cluster-3")
            .attr("fill", "black")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr('x', 410)
            .attr('y', 10);

        vis.svg.append("text")
            .attr("id", "cluster-4")
            .attr("fill", "black")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr('x', 610)
            .attr('y', 10);

        vis.svg.append("text")
            .attr("id", "cluster-5")
            .attr("fill", "black")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr('x', 810)
            .attr('y', 10);

        vis.wrangleData();
    }

    /*
     *  Data wrangling
     */
    wrangleData () {
        let vis = this;

        // first, filter according to selectedTimeRange, init empty array
        let filteredData = [];

        // if there is a region selected
        if (filteredTimeRange.length !== 0) {
            //console.log('region selected', tableObject.selectedTimeRange, tableObject.selectedTimeRange[0].getTime() )

            // iterate over all rows the csv (dataFill)
            vis.heatData.forEach(row => {
                // and push rows with proper dates into filteredData
                if (filteredTimeRange[0].getTime() <= vis.parseDate(row.year).getTime() && vis.parseDate(row.year).getTime() <= filteredTimeRange[1].getTime()) {
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.heatData;
        }

        console.log(filteredData);

        // create empty data structure
        let displayData = [];

        // Prepare data by looping over stations and populating empty data structure
        filteredData.forEach(d => {
            // console.log(d);
            displayData.push(
                {
                    year: vis.parseDate(d.year),
                    total: +d.total,
                    female: +d.female,
                    male: +d.male,
                    Indian: +d.Indian,
                    Asian: +d.Asian,
                    Black: +d.Black,
                    White: +d.White,
                    yearRangeOne: +d.yearRangeOne,
                    yearRangeTwo: +d.yearRangeTwo,
                    yearRangeThree: +d.yearRangeThree,
                    yearRangeFour: +d.yearRangeFour,
                    yearRangeFive: +d.yearRangeFive
                }
            );
        })

        // check out the global variable
        console.log("check out filtered data", displayData);

        annualAverage = Math.round(displayData.reduce((acc, b) => acc + b.total, 0)/displayData.length);
        avgFemale = Math.round(displayData.reduce((acc, b) => acc + b.female, 0)/displayData.length);
        avgMale = Math.round(displayData.reduce((acc, b) => acc + b.male, 0)/displayData.length);
        avgIndian = Math.round(displayData.reduce((acc, b) => acc + b.Indian, 0)/displayData.length);
        avgAsian = Math.round(displayData.reduce((acc, b) => acc + b.Asian, 0)/displayData.length);
        avgBlack = Math.round(displayData.reduce((acc, b) => acc + b.Black, 0)/displayData.length);
        avgWhite = Math.round(displayData.reduce((acc, b) => acc + b.White, 0)/displayData.length);
        avgYearRangeOne = Math.round(displayData.reduce((acc, b) => acc + b.yearRangeOne, 0)/displayData.length);
        avgYearRangeTwo = Math.round(displayData.reduce((acc, b) => acc + b.yearRangeTwo, 0)/displayData.length);
        avgYearRangeThree = Math.round(displayData.reduce((acc, b) => acc + b.yearRangeThree, 0)/displayData.length);
        avgYearRangeFour = Math.round(displayData.reduce((acc, b) => acc + b.yearRangeFour, 0)/displayData.length);
        avgYearRangeFive = Math.round(displayData.reduce((acc, b) => acc + b.yearRangeFive, 0)/displayData.length);


        // console.log("check out annual average", annualAverage);

        absDeaths = [annualAverage];
        absDeathsByGender = [avgMale, avgFemale];
        absDeathsByRace = [avgWhite,avgBlack,avgAsian,avgIndian];
        absDeathsByAge = [avgYearRangeOne, avgYearRangeTwo, avgYearRangeThree, avgYearRangeFour, avgYearRangeFive];

        // console.log(absDeaths);
        // console.log(absDeathsByGender);
        // console.log(absDeathsByRace);
        console.log(absDeathsByRace);

        // react to category change
        let selectedCategory = d3.select("#categorySelector").property("value");

       // Prepare data for the bubble charts

        dotData = {absDeaths, absDeathsByGender, absDeathsByRace, absDeathsByAge};
        console.log(dotData);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // react to category change
        let selectedCategory = d3.select("#categorySelector").property("value");

        // define x centers and colors for clusters
        let xCenter = [80, 300, 450, 650, 850];
        let colorScale = d3.scaleOrdinal().range(["#465D99", '#728C9E', "#854852", "#948482", "#9DA275"]);


        // prep for clusters
        let clusterNumber = dotData[selectedCategory];
        console.log(clusterNumber);

        let numNodes = absDeaths;
        console.log(numNodes);

        let m = clusterNumber.length;
        console.log(m);

        // https://stackoverflow.com/questions/33022857/specifying-a-number-of-nodes-in-each-cluster-of-clustered-force-layout-in-d3js
        // The largest node for each cluster.
        let clusters = new Array(m);

        let nodes = [];

        clusterNumber.forEach(function (cn, i) {
            //this will make a cluster
            let r = 4;
            for (let j = 0; j < cn; j++) {
                //this loop will make all the nodes
                let d = {
                    cluster: i,
                    radius: r,
                    x: Math.cos(i / m * 2) * 200 + vis.width / 2 + Math.random(),
                    y: Math.sin(i / m * 2) * 200 + vis.height / 2 + Math.random()
                };
                if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
                nodes.push(d);
            }

            // console.log(nodes);
        });

        // Assign each cluster a color
        nodes.map(d => d.color = colorScale(d.cluster));
        console.log(nodes);

        let simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(1))
            .force('x', d3.forceX().x(function (d) {
                    // console.log(d);
                    return xCenter[d.cluster];
                }
            ))
            .force('y', d3.forceY().y(function (d) {
                    return 130
                }
            ))
            .force('collision', d3.forceCollide().radius(function (d) {
                return d.radius;
            }))
            .on('tick', ticked);

        function ticked() {
            let u = vis.svg.selectAll("circle")
                .data(nodes);

            u.exit().remove();

            u.enter()
                .append('circle')
                .attr('r', function (d) {
                    return d.radius;
                })
                .merge(u)
                .attr('fill', function (d) {
                    return d.color;
                })
                .attr('cx', function (d) {
                    return d.x;
                })
                .attr('cy', function (d) {
                    return d.y;
                })
                .attr('opacity', 0.9);

            u.exit().remove();

        }

        // Prep data for cluster titles
        let myObject = {
            absDeaths: ["Annual Average"],
            absDeathsByGender: ["Male", "Female"],
            absDeathsByRace: ["White", "Black", "Asian", "Indian"],
            absDeathsByAge: ["0 to 24 years", "25 to 44 years", "45 to 64 years", "64 to 84 years", "85+ years"]
        }
        console.log(myObject[selectedCategory][0]);

        // Update cluster titles
        vis.svg.select("#cluster-1")
            .text(myObject[selectedCategory][0] + ": " + clusterNumber[0]);

        vis.svg.select("#cluster-2")
            .text(myObject[selectedCategory][1] + ": " + clusterNumber[1]);

        vis.svg.select("#cluster-3")
            .text(myObject[selectedCategory][2] + ": " + clusterNumber[2]);

        vis.svg.select("#cluster-4")
            .text(myObject[selectedCategory][3] + ": " + clusterNumber[3]);

        vis.svg.select("#cluster-5")
            .text(myObject[selectedCategory][4] + ": " + clusterNumber[4]);

        // Check if some elements are undefined if so hide them
        if (myObject[selectedCategory][1] === undefined) {
            $('#cluster-2').html('');
        }

        if (myObject[selectedCategory][2] === undefined) {
            $('#cluster-3').html('');
        }

        if (myObject[selectedCategory][3] === undefined) {
            $('#cluster-4').html('');
        }

        if (myObject[selectedCategory][4] === undefined) {
            $('#cluster-5').html('');
        }

    }
}
