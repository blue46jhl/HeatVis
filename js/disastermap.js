/* * * * * * * * * * * * * *
*          DisasterMapVis          *
* * * * * * * * * * * * * */


class DisasterMapVis{

    // constructor method to initialize Timeline object
    constructor(parentElement, parentElement2, disasterData, geoData, heatData, zipData) {
        this.parentElement = parentElement;
        this.parentElement2 = parentElement2;
        this.disasterData = disasterData;
        this.geoData = geoData;
        this.heatData = heatData;
        this.zipData = zipData;
        this.displayData = [];

        this.initMap()
    }

    initMap(){
        let vis = this;
        
        // defining margins and dimensions for map vis
        vis.margin = {top: 10, right:40, bottom: 10, left: 60};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;
        // defining margins and dimensions for line vis
        vis.margin_2 = {top: 10, right:40, bottom: 10, left: 60};
        vis.width_2 = $("#" + vis.parentElement2).width() - vis.margin_2.left - vis.margin_2.right;
        vis.height_2 = $("#" + vis.parentElement2).height() - vis.margin_2.top - vis.margin_2.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.svg_2 = d3.select("#" + vis.parentElement2).append("svg")
            .attr("width", vis.width_2)
            .attr("height", vis.height_2)
            .attr('transform', `translate (${vis.margin_2.left}, ${vis.margin_2.top})`);
        
        vis.disasterLine = vis.svg_2.append("rect")
            .attr("class", "disaster_line")
            .attr("stroke", "black")
            .attr("fill", "lightblue")
            .attr("height", 30)
            .attr("stroke-width", 1)
            .attr("transform", "translate(5,0)")

        // add title
        vis.svg.append('g')
            .attr('class', 'title map-title')
            .append('text')
            .text('Historical Natural Disaster Trends 1930-2010')
            .attr("font-family", "Gothic")
            .attr("font-weight", 900)
            .attr("font-size", "20px")
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // // define a geo generator
        vis.path = d3.geoPath()

        // convert TopoJSON data into GeoJSON data
        vis.country = topojson.feature(vis.geoData,vis.geoData.objects.states).features;

        // define viewpoint and zoom
        vis.viewpoint = {'width': 975, 'height': 510};
            vis.zoom = vis.width / vis.viewpoint.width;

        // Draw states
        vis.states = vis.svg.selectAll(".state")
            .data(vis.country)
            .enter().append("path")
            .attr('class', 'state map')
            .attr("d", vis.path)
            .style("fill", "steelblue")
            .attr("opacity", .9)
            .attr("stroke", "black")
            .attr("transform", `scale(${vis.zoom} ${vis.zoom})`)

        // define a color scale
        vis.colorScale = d3.scaleLinear()
            .range(["orange", "darkred"])

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

        vis.x_2 = d3.scaleLinear()
            .domain([0, 3832])
            .range([0,1000])
        
        vis.xAxis_2 = vis.svg_2.append("g")
            .attr("transform", "translate(5,30)")
            .call(d3.axisBottom(vis.x_2))
            .attr("class", "x_axis_2")

        vis.x = d3.scaleLinear()
            .range([0,vis.width / 4])

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format(".2s"))

        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width * 2.8 / 4}, ${vis.height-20})`)
            .style("fill", "url(#linear-gradient)")
          

        vis.fips_code = {
            "01": "Alabama",
            "02": "Alaska",
            "04": "Arizona",
            "05": "Arkansas",
            "06": "California",
            "08": "Colorado",
            "09": "Conneticut",
            "10": "Delaware",
            "12": "Florida",
            "13": "Georgia",
            "15": "Hawaii",
            "16": "Idaho",
            "17": "Illinois",
            "18": "Indiana",
            "19": "Iowa",
            "20": "Kansas",
            "21": "Kentucky",
            "22": "Louisiana",
            "23": "Maine",
            "24": "Maryland",
            "25": "Massachussetts",
            "26": "Michigan",
            "27": "Minnesota",
            "28": "Mississippi",
            "29": "Missouri",
            "30": "Montana",
            "31": "Nebraska",
            "32": "Nevada",
            "33": "New Hampshire",
            "34": "New Jersey",
            "35": "New Mexico",
            "36": "New York",
            "37": "North Carolina",
            "38": "North Dakota",
            "39": "Ohio",
            "40": "Oklahoma",
            "41": "Oregon",
            "42": "Pennsylvania",
            "44": "Rhode Island",
            "45": "South Carolina",
            "46": "South Dakota",
            "47": "Tennessee",
            "48": "Texas",
            "49": "Utah",
            "50": "Vermont",
            "51": "Virginia",
            "53": "Washington",
            "54": "West Virginia",
            "55": "Wisconsin",
            "56": "Wyoming",
            "60": "American Samoa",
            "66": "Guam",
            "69": "Northern Mariana Islands",
            "72": "Puerto Rico",
            "78": "Virgin Islands"
        };

        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip')

        vis.wrangleData()
    }

    wrangleData(){
        let vis = this

        // init final data structure in which both data sets will be merged into
    
        vis.stateInfo = {};

        let stationData = {};
        let filtered_disaster_data = [];
        let stateDisastersCount = {};

        // rolling up county data into a state dataset
        vis.disasterData.forEach(function(row) {
            let fips = row.fips_new.toString().slice(0,2)
            filtered_disaster_data.push({
                fips_code: fips,
                disaster_count: row.disaster
            })
        })
        // group data by state
        let disasterDataByState = Array.from(d3.group(filtered_disaster_data, d =>d.fips_code), ([key, value]) => ({key, value}))

        // merge disaster state data
        disasterDataByState.forEach(state => {
            let stateName =  vis.fips_code[state.key]
            let disasters = 0;
            state.value.forEach(row => {
                disasters += +row.disaster_count
            })
            stateDisastersCount[stateName] = disasters
        })

        // get average heat index for each station in the station-heat-index dataset
        Object.entries(vis.heatData).forEach(([k,v]) => {
            stationData[k] = d3.mean(v)
        })

        // building a map for each state key and average heat index value
        vis.zipData.forEach(function(row) {
            if (row.Station_Name in stationData) {
                vis.stateInfo[row.State] = 
                {
                    state: row.State,
                    heat_index: stationData[row.Station_Name],
                    disaster_count: stateDisastersCount[row.State]
                }
            }
        })

        console.log("final data set", vis.stateInfo)

        // fetching disaster count average 
        let counter = 0;
        let total = 0; 

        Object.entries(vis.stateInfo).forEach(([k,v]) => {
            counter += 1 
            if (typeof v.disaster_count !== 'undefined') {
                total += v.disaster_count
            }
        })

        vis.disaster_count_avg = total/counter

        vis.updateMap()

    }

    updateMap(){
        let vis = this;

        vis.disasterAvgLine = vis.svg_2.append("rect")
            .attr("class", "disaster_avg_line")
            .attr("stroke", "black")
            .attr("fill", "indigo")
            .attr("opacity", 1)
            .attr("width", vis.x_2(vis.disaster_count_avg))
            .attr("height", 30)
            .attr("stroke-width", 4)
            .attr("transform", "translate(5,0)")
            

        vis.colorScale.domain([0,d3.max(Object.entries(vis.stateInfo), d => d[1].heat_index)])
        vis.states
                .style("fill", function(d, index) { 
                    return vis.colorScale(vis.stateInfo[d.properties.name].heat_index)
                })
                .on('mouseover', function(event, d){
                    d3.select(this)
                        .attr('stroke-width', '2px')
                        .attr('stroke', 'black')
                        .style("fill", "lightblue")
                        .attr("opacity", .5)
                    vis.tooltip
                        .style("opacity", 1)
                        .style("left", event.pageX + 10 + "px")
                        .style("top", event.pageY + "px")
                        .html(`
                            <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                                <h3>${d.properties.name}<h3>
                                <h4> Heat Index: ${(vis.stateInfo[d.properties.name].heat_index).toFixed(2)}</h4>      
                                <h4> Disaster Count: ${vis.stateInfo[d.properties.name].disaster_count}</h4>    
                            </div>`)
                    vis.disasterLine
                        .transition()
                        .duration(300)
                        .attr("width", vis.x_2(vis.stateInfo[d.properties.name].disaster_count))
                    vis.disasterAvgLine
                        .transition()
                        .duration(100)
                        .attr("opacity", .2)
                })
                .on('mouseout', function(event, d){
                    d3.select(this)
                        .attr('stroke-width', '1px')
                        .attr("stroke", "black")
                        .attr("opacity", 1)
                        .style("fill", d => vis.colorScale(vis.stateInfo[d.properties.name].heat_index))
                    vis.tooltip
                        .style("opacity", 0)
                        .style("left", 0)
                        .style("top", 0)
                        .html(``)
                    vis.disasterLine
                        .attr("width", 0)
                    vis.disasterAvgLine
                        .attr("opacity", .8)
                })
        vis.xAxis.tickValues([0,d3.max(Object.entries(vis.stateInfo), d => d[1].heat_index)])
        vis.x.domain([0,d3.max(Object.entries(vis.stateInfo), d => d[1].heat_index)])

        vis.svg.selectAll(".legend")
            .call(vis.xAxis)
    }
}
