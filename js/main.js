/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables, switches, helper functions
let myCasualtyVis;
let myDotVis;
let myBrush1Vis;
let myRadialBarVis;
let myMapVis;
let myBrushVis;
let myDisasterMapVis;
let myCarbonVis;


let selectedTimeRange = [];
let filteredTimeRange = [];
let annualAverage = [];
let avgFemale = [];
let avgMale = [];
let avgIndian = [];
let avgAsian = [];
let avgBlack = [];
let avgWhite = [];
let absDeaths = [];
let avgYearRangeOne = [];
let avgYearRangeTwo = [];
let avgYearRangeThree = [];
let avgYearRangeFour = [];
let avgYearRangeFive = [];
let absDeathsByGender = [];
let absDeathsByRace = [];
let absDeathsByAge = []
let dotData = {};

let selectedTimeRangeCarbon = [];

// load data using promises
let promises = [
    d3.csv("data/HeatCasualty.csv"),
    // d3.json("data/totalDeathData.json")
    d3.csv("data/north_america_co2.csv"),
    d3.csv("data/disaster_1930.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"),
    d3.csv("data/heatwave_us_1981.csv"),
    d3.json("data/heat_index_celcius.json"),
    d3.csv("data/Zip_data+station.csv"),
    d3.csv("data/HeatIndexXCasualty.csv"),
    d3.csv("data/statedata.csv"),
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/us_states_hexgrid.geojson.json")
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
    myDisasterMapVis = new DisasterMapVis('disasterdiv', 'lineDiv', dataArray[2], dataArray[3], dataArray[5], dataArray[6])
    myCarbonVis = new CarbonVis('carbondiv', dataArray[1], dataArray[4]);
    myBrushVis = new BrushVis('brushDiv', dataArray[1]);
    myCasualtyVis = new CasualtyVis('totalDiv', dataArray[0], MyEventHandler);
    myDotVis = new DotVis('dotDiv', dataArray[0]);
    myRadialBarVis = new RadialBarVis('radialbarDiv', dataArray[7]);
     // init brush
    myBrush1Vis = new Brush1Vis('brush1Div', dataArray[7]);

    // init maps
    myMapVis = new MapVis("map1Div", dataArray[8], dataArray[9]);

    // (5) Bind event handler
    $(MyEventHandler).bind("selectionChanged", function(event, rangeStart, rangeEnd){
        myCasualtyVis.onSelectionChange(rangeStart, rangeEnd);
        myDotVis.onSelectionChange(rangeStart, rangeEnd);
    });
}

function categoryChangeCarbon() {
    selectedCategory = $('#climateCategorySelector').val();
    myCarbonVis.wrangleData();
}

function categoryChange() {
    selectedCategory = $('#categorySelector').val();
    myDotVis.wrangleData(); // maybe you need to change this slightly depending on the name of your MapVis instance
}

$(document).ready(function() {
    $("#toggle").click(function() {
      var elem = $("#toggle").text();
      if (elem == "The Mission (click to read)") {
        //Stuff to do when btn is in the read more state
        $("#toggle").text("Close Note");
        $("#info").slideDown();
      } else {
        //Stuff to do when btn is in the read less state
        $("#toggle").text("The Mission (click to read)");
        $("#info").slideUp();
      }
    });
  });


