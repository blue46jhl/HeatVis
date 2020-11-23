/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables, switches, helper functions
let carbonChart;

let selectedTimeRange = [];

function updateAllVisualizations(){
    carbonChart.wrangleData()
}

// load data using promises
let promises = [
    d3.csv("data/heat_final.csv"),
    // d3.json("data/totalDeathData.json")
    d3.csv("data/north_america_co2.csv"),
    d3.csv("data/disaster_1930.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"),
    d3.csv("data/heatwave_us_1981.csv"),
    d3.json("data/heat_index_celcius.json"),
    d3.csv("data/Zip_data+station.csv")
];

Promise.all(promises)
    .then( function(data){ initMainPage(data) })
    .catch( function (err){console.log(err)} );

// initMainPage
function initMainPage(dataArray) {
    // log data
    console.log('check out the data', dataArray);


    // (3) Create event handler
    let MyEventHandler = {};

    // init visualizations
    myCasualtyVis = new CasualtyVis('totaldiv', dataArray[0], MyEventHandler);
    myDotVis = new DotVis('dotdiv', dataArray[0]);
    myCarbonVis = new CarbonVis('carbondiv', dataArray[1], dataArray[4])
     // init brush
    myBrushVis = new BrushVis('brushDiv', dataArray[1]);
    myDisasterMapVis = new DisasterMapVis('disasterdiv', dataArray[2], dataArray[3], dataArray[5], dataArray[6])

    // (5) Bind event handler
    $(MyEventHandler).bind("selectionChanged", function(event, rangeStart, rangeEnd){
        myCasualtyVis.onSelectionChange(rangeStart, rangeEnd);
        myDotVis.onSelectionChange(rangeStart, rangeEnd);
    });
}

function categoryChange() {
    selectedCategory = $('#climateCategorySelector').val();
    myCarbonVis.wrangleData();
}

