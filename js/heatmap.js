// Zipcode나 경도,위도를 입력하면 Zip_data+station.csv 파일에서 station 이름을 따와서 station_name variable에 입력하게 할 계획이었습니다!

function saveUserData() {
    let zipcode = document.getElementById('userdata').value;

    let station_name
    d3.csv("data/Zip_data+station.csv", (row) => {
        row.Zip = +row.Zip
        return row
    }).then((data) => {
        dataset = data;
        for (var i=dataset.length; i--;) {
            if(dataset[i]["Zip"] == zipcode) {
                station_name = dataset[i]["Station_Name"];
            }
        }
        console.log(station_name)
        document.getElementById("title_location").innerHTML = "Heat index hour -  " + station_name;
    });


// hours를 매달별로 나눠놓은 array
    let hours = [[0,743], [744, 1415], [1416, 2159], [2160, 2879], [2880, 3623],
        [3624, 4343], [4344, 5087], [5088, 5831], [5832, 6551], [6552, 7295], [7296, 8015], [8016, 8759]];

    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// Annual chart 시작
    function chart1() {
        let margin = {top: 10, right: 60, bottom: 30, left: 60};

        let width = 1215 - margin.left - margin.right,
            height = 280 - margin.top - margin.bottom;

        let svg = d3.select("#Chart_1")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)

        // json파일 불러오기 (Array 앞뒤에 "" 떼어주는 단계 필요)


        d3.json("data/heat_index_celcius.json")
            .then(function(data) {
                dataset = data;
                draw(dataset, station_name);
            });




        function draw(data, location) {
            // 지정된 station의 NV hour 데이터 dataset variable로 저장
            let dataset = data[location];

            // 지정된 달의 NVhour 계산 (tooltip에 사용)
            function heat_month (d) {
                dataset_new = dataset.slice(hours[d-1][0], hours[d-1][1]);
                var count=0;
                for (var i=dataset_new.length; i--;) {
                    if(dataset_new[i] > 0) {
                        count++
                    }
                }
                return count;
            }

            // hour pixcel rectangle 생성
            svg.append("g")
                .selectAll("rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("class", "cell1")
                .attr("height", 10)
                .attr("width", 3)
                .attr("x", (d, i) => {

                    return Math.floor(i / 24) * 3 + margin.left
                })
                .attr("y", (d, i) => {

                    return i % 24 * 10 +margin.top
                })
                .style("fill", "white")
                .transition()
                .duration(1200)
                .style("fill", function (d) {
                    if (d >= 33 && d <= 39) {
                        return "#ffd700";
                    }
                    else if(d >= 40 && d <= 51) {
                        return "#ff8c00";
                    }
                    else if(d >= 52) {
                        return "#ff0000";
                    }
                    else {
                        return "white";
                    }
                });


            // Outline용 rectangle 생성
            svg.append("g")
                .append("rect")
                .attr("class", "outline")
                .attr("width", width)
                .attr("height", height)
                .attr("x", margin.left)
                .attr("y", margin.top)
                .style("fill", "none")

            // Axis를 위한 xScale 생성
            let xScale = d3.scaleBand()
                .domain(months)
                .range([margin.left, margin.left + width]);

            // x-axis 생성
            let xAxis = d3.axisBottom()
                .scale(xScale)
                .ticks(12);

            svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + (height + margin.top) + ")")
                .call(xAxis);


            // Axis를 위한 yScale 생성
            let yScale = d3.scaleTime()
                .domain([new Date("2019-01-01 00:00:00"), new Date("2019-01-02 00:00:00")])
                .range([margin.top, margin.top + height]);

            // y-axis 생성
            let yAxis = d3.axisLeft()
                .scale(yScale)
                .ticks(9)
                .tickFormat(d3.timeFormat('%I%p'));

            svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + (margin.left) + ",0)")
                .call(yAxis)


            // 각 month를 표현하는 interactivity rectangle 생성
            let dataset_month = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            svg.append("g")
                .selectAll("rect2")
                .data(dataset_month)
                .enter()
                .append("rect")
                .attr("class", "interactivity")
                .attr("x", (d, i) => {
                    return i * (width / 12) + margin.left;
                })
                .attr("y", margin.top)
                .attr("width", (width / 12))
                .attr("height", 240)
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mouseover", function(d) {
                    d3.select(this)
                        .style("fill", "#ffd700")
                        .style("opacity", 0.2);
                })
                .on("mouseleave", function(d) {
                    d3.select(this).style("fill", "none");
                })
                // 마우스 클릭하면 monthly chart 생성
                .on("click", (d, i) => {
                    let month_sub = "Heat index hour on " + months[i-1]
                    document.getElementById("month_subtitle").innerHTML = month_sub;
                    d3.select("#Chart_2")
                        .select("svg")
                        .remove()
                    chart2(i, month_sub);
                })
                // annual 차트 tooltip 생성
                .append("title")
                .text(function(d) {
                    return "Month: " + months[d-1]
                        + "\n" + "Total hours: " + (hours[d-1][1] - hours[d-1][0] + 1)
                        + "\n" + "Heat index hours: " + heat_month(d)
                        + "\n" + "Heat index percent: " + Math.round(heat_month(d) / (hours[d-1][1] - hours[d-1][0] + 1) * 100) + "%";
                });
            let count=0;
            for (var i=dataset.length; i--;) {
                if(dataset[i] > 0) {
                    count++
                }
            }
            document.getElementById("total_nv").innerHTML = "Total annual hour: 8,760 hours"
                + "<br>" + " Heat index hour: " + count + " hours"
                + "<br>" + " Heat index percent: " + Math.round(count / 8760 * 100) + "%";
        }
    }


// Monthly chart 시작
    function chart2(i, k) {
        let margin = {top: 20, right: 60, bottom: 40, left: 60};

        let width = 400 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;


        d3.json("data/heat_index_celcius.json", (row) => {
            return row
        }).then( data => {
            dataset = data;

            // i값 (annual chart에서의 month 값)이 없으면 기본 빈차트 생성
            if (i === undefined) {
                let svg = d3.select("#Chart_2")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")

                svg.append("text")
                    .text("Please select the month from the annual chart")
                    .attr("class", "message")
                    .attr("text-anchor", "middle")
                    .attr("x", width/2 + margin.left)
                    .attr("y", height/2 + margin.top)

            }
            // i값 (annual chart에서의 month 값)이 주어지면 monthly 차트 생성
            else {
                draw(dataset, station_name, i, k);
            }
        });

        function draw(data, location, i, k) {
            // i값 (annual chart에서의 month 값)에 따라 NV hour 데이터 슬라이싱
            let start = hours[i-1][0];
            let end = hours[i-1][1] + 1;
            let dataset = data[location].slice(start, end);

            let svg = d3.select("#Chart_2")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")

            d3.select("#Chart_2")
                .select(".message")
                .remove()

            // hour pixcel rectangle 생성
            svg.selectAll("rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("class", "cell2")
                .attr("height", 10)
                .attr("width", 10)
                .attr("x", (d, i) => {

                    return Math.floor(i / 24) * 10 + margin.left;
                })
                .attr("y", (d, i) => {

                    return i % 24 * 10 + margin.top;
                })
                .style("fill", "white")
                .transition()
                .duration(1200)
                .style("fill", function (d) {
                    if (d >= 33 && d <= 39) {
                        return "#ffd700";
                    }
                    else if(d >= 40 && d <= 51) {
                        return "#ff8c00";
                    }
                    else if(d >= 52) {
                        return "#ff0000";
                    }
                    else {
                        return "white";
                    }
                });

            // 각 day를 표현하는 interactivity rectangle 생성하기 전에 각 달별로 날짜 만큼 pixcel deduct
            let deduct = 0;
            if (i == 2) {
                deduct = 28;
            }
            else if (i == 4 || i == 6 || i == 9 || i == 11) {
                deduct = 30;
            }
            else {
                deduct = 31;
            }

            // Outline용 rectangle 생성
            svg.append("g")
                .append("rect")
                .attr("class", "outline")
                .attr("width", 10 * deduct)
                .attr("height", height)
                .attr("x", margin.left)
                .attr("y", margin.top)
                .style("fill", "none")

            // Axis를 위한 xScale 생성
            let xScale = d3.scaleTime()
                .domain([new Date("2019-01-01 00:00:00"), new Date("2019-01-31 23:59:59")])
                .range([margin.left, margin.left + 10 * deduct]);

            // x-axis 생성
            let xAxis = d3.axisBottom()
                .scale(xScale)
                .ticks(20)
                .tickFormat(d3.timeFormat('%d'));

            svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + (height + margin.top) + ")")
                .call(xAxis)

            // Axis를 위한 yScale 생성
            let yScale = d3.scaleTime()
                .domain([new Date("2019-01-01 00:00:00"), new Date("2019-01-02 00:00:00")])
                .range([margin.top, margin.top + height]);

            // y-axis 생성
            let yAxis = d3.axisLeft()
                .scale(yScale)
                .ticks(9)
                .tickFormat(d3.timeFormat('%I%p'));

            svg.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(" + (margin.left) + ",0)")
                .call(yAxis)


            let dataset_day = [];
            for (let i = 0; i< 28; i += 1) {
                dataset_day.push(i);
            }
            if (i == 4 || i == 6 || i == 9 || i == 11) {
                dataset_day.push(28)
                dataset_day.push(29);
            }
            else if (i == 1 || i == 3 || i == 5 || i == 7 || i == 8 || i == 10 || i == 12) {
                dataset_day.push(28)
                dataset_day.push(29)
                dataset_day.push(30);
            }

            // 지정된 날의 NVhour 계산 (tooltip에 사용)
            function heatindex_day (d) {
                dataset_new = dataset.slice(d * 24, d * 24 + 24)
                var count=0;
                for (var i=dataset_new.length; i--;) {
                    if(dataset_new[i] > 0) {
                        count++
                    }
                }
                return count;
            }
            // 각 day를 표현하는 interactivity rectangle 생성
            svg.append("g")
                .selectAll("rect")
                .data(dataset_day)
                .enter()
                .append("rect")
                .attr("class", "interactivity2")
                .attr("x", (d, i) => {
                    return i * 10 + margin.left;
                })
                .attr("y", margin.top)
                .attr("width", 10)
                .attr("height", 240)
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mouseover", function(d) {
                    d3.select(this)
                        .style("fill", "#ffd700")
                        .style("opacity", 0.3);
                })
                .on("mouseout", function(d) {
                    d3.select(this).style("fill", "none");
                })
                .on("click", (d, i) => {
                    let tag = "";
                    if (i == 0 || i == 20 || i == 30) {
                        tag = "st";
                    }
                    else if (i == 1 || i == 21) {
                        tag = "nd";
                    }
                    else if (i == 2 || i == 22) {
                        tag = "rd";
                    }
                    else {
                        tag = "th";
                    }
                    document.getElementById("day_subtitle").innerHTML = k + (i+1) + tag;
                    d3.select("#Chart_3")
                        .select("svg")
                        .remove()
                    chart3(start + i * 24);
                })
                // monthly 차트 tooltip 생성
                .append("title")
                .text(function(d) {
                    if (d == 0 || d == 20 || d == 30) {
                        return "Day: " + months[i-1] + " " + (d+1) + "st"
                            + "\n" + "Total hours: " + "24"
                            + "\n" + "Heat index hours: " + heatindex_day(d)
                            + "\n" + "Heat index percent: " + Math.round(heatindex_day(d) / 24 * 100) + "%";
                    }
                    else if (d == 1 || d == 21) {
                        return "Day: " + months[i-1] + " " + (d+1) + "nd"
                            + "\n" + "Total hours: " + "24"
                            + "\n" + "Heat index hours: " + heatindex_day(d)
                            + "\n" + "Heat index percent: " + Math.round(heatindex_day(d) / 24 * 100) + "%";
                    }
                    else if (d == 2 || d == 22) {
                        return "Day: " + months[i-1] + " " + (d+1) + "rd"
                            + "\n" + "Total hours: " + "24"
                            + "\n" + "Heat index hours: " + heatindex_day(d)
                            + "\n" + "Heat index percent: " + Math.round(heatindex_day(d) / 24 * 100) + "%";
                    }
                    else {
                        return "Day: " + months[i-1] + " " + (d+1) + "th"
                            + "\n" + "Total hours: " + "24"
                            + "\n" + "Heat index hours: " + heatindex_day(d)
                            + "\n" + "Heat index percent: " + Math.round(heatindex_day(d) / 24 * 100) + "%";
                    }});


        }
    }

// Daily chart 시작
    function chart3(i) {
        let margin = {top: 20, right: 60, bottom: 40, left: 60};

        let width = 360 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;



        d3.json("data/heat_index_celcius.json", (row) => {
            return row
        }).then( data => {
            dataset = data;

            // i값 (monthly chart에서의 day 값)이 없으면 기본 빈차트 생성
            if (i === undefined) {
                let svg = d3.select("#Chart_3")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")

                svg.append("text")
                    .text("Please select the day from the monthly chart")
                    .attr("class", "message")
                    .attr("text-anchor", "middle")
                    .attr("x", width/2 + margin.left)
                    .attr("y", height/2 + margin.top)
            }
            // i값 (monthly chart에서의 day 값)이 주어지면 daily 차트 생성
            else {
                draw(dataset, station_name, i);
            }
        });

        function draw(data, location, i) {
            // i값 (monthly chart에서의 day 값)에 따라 NV hour 데이터 슬라이싱
            let colorset = data[location].slice(i, i + 24);
            let dataset = Array(24).fill(1)
            let svg = d3.select("#Chart_3")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + (width + margin.left + margin.right) / 2 + "," + (height + margin.top + margin.bottom) / 2 + ")");

            // daily chart 생성
            var arc = d3.arc()
                .innerRadius(0)
                .outerRadius(120);

            // hourly NV data에 따라 색 지정
            var color = [];
            for (var i = 0; i < 24; i++) {
                if (colorset[i] >= 33 && colorset[i] <= 39) {
                    color.push("#ffd700");
                }
                else if (colorset[i] >= 40 && colorset[i] <= 51) {
                    color.push("#ff8c00");
                }
                else if (colorset[i] >= 52) {
                    color.push("#ff0000");
                }
                else {
                    color.push("white");
                }
            }


            // daily chart에 색 삽입
            var pie = d3.pie();
            svg.selectAll("g.arc")
                .data(pie(dataset))
                .enter()
                .append("g")
                .attr("class", "cell3")
                .append("path")
                .attr("class", "arc")
                .attr("d", arc)
                .attr("fill", function(d, i) {
                    return color[i];
                })
                .append("title")
                .text(function(d, i) {
                    if (colorset[i] >= 33 && colorset[i] <= 39) {
                        return "Heat index: " + colorset[i] + "°C" + "\n" + "Heat index condition: Extreme caution";
                    }
                    else if (colorset[i] >= 40 && colorset[i] <= 51) {
                        return "Heat index: " + colorset[i] + "°C" + "\n" + "Heat index condition: Danger";
                    }
                    else if (colorset[i] >= 52) {
                        return "Heat index: " + colorset[i] + "°C" + "\n" + "Heat index condition: Extreme danger";
                    }
                    else {
                        return "Safe to be outside";
                    }});

            // daily chart 시간 label 삽입
            svg.selectAll("g.arc")
                .data(pie(dataset))
                .enter()
                .append("g")
                .append("text")
                .attr("class", "clock")
                .attr("transform", function(d) {
                    let c = arc.centroid(d),
                        x = c[0],
                        y = c[1],
                        // pythagorean theorem for hypotenuse
                        h = Math.sqrt(x*x + y*y);
                    return "translate(" + (x/h * 135) +  ',' +
                        (y/h * 135 + 6) +  ")";
                })
                .attr("text-anchor", "middle")
                .text((d ,i) => {
                    if (i < 12) {
                        return i + "am";
                    }
                    else if (i == 12) {
                        return i + "pm";
                    }
                    else {
                        return (i - 12) + "pm";
                    }});


        }
    }

    function legend(i) {
        let margin = {top: 20, right: 10, bottom: 40, left: 10};

        let width = 270 - margin.left - margin.right,
            height = 140 - margin.top - margin.bottom;

        let svg = d3.select("#legend")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")

        svg.append("rect")
            .attr("class", "legend_square")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", 10)
            .attr("y", 10)
            .style("fill", "#ffd700")

        svg.append("text")
            .text("Extreme caution (heat index 33-39°C)")
            .attr("class", "legend")
            .attr("x", 40)
            .attr("y", 25)

        svg.append("rect")
            .attr("class", "legend_square")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", 10)
            .attr("y", 40)
            .style("fill", "#ff8c00")

        svg.append("text")
            .text("Danger (heat index 40-51°C)")
            .attr("class", "legend")
            .attr("x", 40)
            .attr("y", 55)

        svg.append("rect")
            .attr("class", "legend_square")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", 10)
            .attr("y", 70)
            .style("fill", "#ff0000")

        svg.append("text")
            .text("Extreme danger (heat index 51>°C)")
            .attr("class", "legend")
            .attr("x", 40)
            .attr("y", 85)

    }





    chart1()

    chart2()

    chart3()

    legend()
}
