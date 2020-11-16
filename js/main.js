/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables, switches, helper functions
let carbonChart;

function updateAllVisualizations(){
    carbonChart.wrangleData()
}

// load data using promises
let promises = [
    d3.csv("data/heat_final.csv"),
    // d3.json("data/totalDeathData.json")
    // d3.csv("data/north_america_co2.csv"),
    // d3.csv("data/disasters_1930.csv")
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

    // init dot vis
    myCasualtyVis = new CasualtyVis('totaldiv', dataArray[0], MyEventHandler);
    myDotVis = new DotVis('dotdiv', dataArray[0]);

    // (5) Bind event handler
    $(MyEventHandler).bind("selectionChanged", function(event, rangeStart, rangeEnd){
        myCasualtyVis.onSelectionChange(rangeStart, rangeEnd);
        myDotVis.onSelectionChange(rangeStart, rangeEnd);
    });
    // myCarbonChart = new CarbonChart('climateSection', allDataArray[0])
}
