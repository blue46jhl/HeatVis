/* * * * * * * * * * * * * *
*          DisasterMapVis          *
* * * * * * * * * * * * * */


class DisasterMapVis{

    // constructor method to initialize Timeline object
    constructor(parentElement, disasterData, geoData) {
        this.parentElement = parentElement;
        this.disasterData = disasterData;
        this.geoData = geoData;
        this.displayData = [];

        this.initMap()
    }

    initMap(){
        let vis = this;
        
        vis.margin = {top: 40, right:40, bottom: 60, left: 60};
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
            .text('Disasters in the USA 1930-2010')
            .attr("font-family", "Gothic")
            .attr("font-weight", 900)
            .attr("font-size", "20px")
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // // define a geo generator
        vis.path = d3.geoPath()

        // convert TopoJSON data into GeoJSON data
        vis.country = topojson.feature(vis.geoData,vis.geoData.objects.counties).features;

        // define viewpoint and zoom
        vis.viewpoint = {'width': 975, 'height': 610};
            vis.zoom = vis.width / vis.viewpoint.width;

        // Draw states
        vis.counties = vis.svg.selectAll(".county")
            .data(vis.country)
            .enter().append("path")
            .attr('class', 'county map')
            .attr("d", vis.path)
            .style("fill", "steelblue")
            .attr("opacity", .9)
            .attr("stroke", "black")
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`)

        // define a color scale
        vis.colorScale = d3.scaleLinear()
            .range(["lightblue", "darkblue"])

        // // create a legend

        vis.defs = vis.svg.append("defs");
  
        // deining a linear gradient for continuous color legend
        vis.linearGradient = vis.defs.append("linearGradient")
            .attr("id", "linear-gradient");

        vis.linearGradient.selectAll("stop")
            .data(vis.colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: vis.colorScale(t) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        vis.x = d3.scaleLinear()
            .range([0,vis.width / 4])

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format(".2s"))

        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 2.8 / 4}, ${vis.height-20})`)
            .style("fill", "url(#linear-gradient)")
            .call(vis.xAxis)

        
        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip')
        vis.wrangleData()
    }

    wrangleData(){
        let vis = this

        // init final data structure in which both data sets will be merged into
        vis.countyInfo = {}

        vis.disasterData.forEach(county => {
            // populate the final data structure
            let countyName = county.NAME10
            vis.countyInfo[county.fips_new] =
                {
                    county: countyName,
                    numberOfDisasters: county.disaster,
                    category: county.disaster_category,
                    severeDisasters: county.severe,
                    superSevereDisasters: county.supersevere
                }
        })
        // log all of the data
        console.log('final data structure for myDataTable', vis.countyInfo);

        mapObject.updateMap()

    }

    updateMap(){
        let mapObject = this;

        let selectedCategory = $('#categorySelector').val()

        mapObject.colorScale.domain([0,d3.max(Object.entries(mapObject.stateInfo), d => d[1][selectedCategory])])
        mapObject.states
                .style("fill", function(d, index) { 
                    return mapObject.colorScale(mapObject.stateInfo[d.properties.name][selectedCategory])
                })
                .on('mouseover', function(event, d){
                    d3.select(this)
                        .attr('stroke-width', '2px')
                        .attr('stroke', 'black')
                        .style("fill", "red")
                        .attr("opacity", .5)
                    // attempt to link hover effects
                    // d3.selectAll(d=> "#" + "state" + d.properties.name)
                    //     .attr("fill", "purple")
                    mapObject.tooltip
                        .style("opacity", 1)
                        .style("left", event.pageX + 10 + "px")
                        .style("top", event.pageY + "px")
                        .html(`
                            <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                                <h3>${d.properties.name}<h3>
                                <h4> Population: ${mapObject.stateInfo[d.properties.name].population}</h4>      
                                <h4> Cases (Absolute): ${mapObject.stateInfo[d.properties.name].absCases}</h4> 
                                <h4> Deaths (Absolute): ${mapObject.stateInfo[d.properties.name].absDeaths}</h4>
                                <h4> Cases (Relative): ${d3.format(".3n")(mapObject.stateInfo[d.properties.name].relCases)}%</h4> 
                                <h4> Deaths (Relative): ${d3.format(".1n")(mapObject.stateInfo[d.properties.name].relDeaths)}% </h4>     
                            </div>`)
                })
                .on('mouseout', function(event, d){
                    d3.select(this)
                        .attr('stroke-width', '1px')
                        .attr("stroke", "black")
                        .attr("opacity", 1)
                        .style("fill", d => mapObject.colorScale(mapObject.stateInfo[d.properties.name][selectedCategory]))
       
                    mapObject.tooltip
                        .style("opacity", 0)
                        .style("left", 0)
                        .style("top", 0)
                        .html(``);
                })
        mapObject.xAxis.tickValues([0,d3.max(Object.entries(mapObject.stateInfo), d => d[1][selectedCategory])])
        mapObject.x.domain([0,d3.max(Object.entries(mapObject.stateInfo), d => d[1][selectedCategory])])

        mapObject.svg.selectAll(".legend")
            .call(mapObject.xAxis)
    }
}
