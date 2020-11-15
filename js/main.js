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
    d3.csv("data/north_america_co2.csv"),
    d3.csv("data/disasters.csv")
];

Promise.all(promises)
    .then( function(data){ initMainPage(data) })
    .catch( function (err){console.log(err)} );

// initMainPage
function initMainPage(allDataArray) {
    console.log("test")
    // myCarbonChart = new CarbonChart('climateSection', allDataArray[0])
}
