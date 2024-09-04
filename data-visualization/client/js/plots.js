// Plantilla para la generación de bar plot simple
// elaborado por Anrés Felipe Sánchez Patarroyo
// a partir de el ejemplo de la sesión 7

// data load
const main_user = "naquerf"
const base_url = new URL("http://127.0.0.1:8000/");
const month_ids = Array.from({length: 12}, (_, i) => i + 1)
const color_palette = [
  "#FF4A2E",
  "#6E46FD",
  "#FF8121",
  "#1CCAF1",
  "#FFCC14",
]

function escapeChars(input){
  return input.replace(/[^A-Z0-9]/ig, "_")
}

function minToHours(min) {
  let hours = Math.floor((min / 60));
  let remainingMin = Math.floor(min - (hours*60));
  let total = ""
  if (hours>0) { total=  [total, [hours, "hrs"].join(" ")].join("")+", ";}
  if (remainingMin>0) { total=  [total, [remainingMin, "min"].join(" ")].join("");}
  return total
}

function barplot () {
  const bar_url = new URL(main_user + '/top-songs', base_url)
  d3.json(bar_url.href).then(function (data_file) {
    // common function
    function getFields (input, field) {
      var output = []
      for (var i = 0; i < input.length; ++i)
        output.unshift(input[i][field])
      return output
    }

    // relevant data for graph
    var bar_info = {
      tittle: 'barras',
      y_info: 'track',
      y_tittle: 'canción',
      x_info: 'minutes_listened',
      x_tittle: 'minutos_escuchados',
      color_info: 'top',
      text_info: 'username'
    }
    var data_list = JSON.parse(data_file).items

    // canvas dimensions
    var height = 400
    var width = 500

    var margin = {
      top: 50,
      botton: 50,
      left: 30,
      right: 75
    }

    var canvas = d3.select('#barplot')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'barplot')

    // dimension scales
    // x scale
    var y_scale = d3
      .scaleBand()
      .domain(getFields(data_list, bar_info.y_info))
      .range([height - margin.botton, 0 + margin.top])
      .padding(0.15)

    // y scale
    var x_scale = d3.scaleLinear()
      .domain([0, d3.extent(data_list, d => d[bar_info.x_info])[1]])
      .range([0 + margin.left, width - margin.right - 20])

    // color scale

    var color_scale = d3.scaleOrdinal()
      .domain([d3.extent(data_list, d => d[bar_info.color_info])[0],
        d3.mean(data_list, d => d[bar_info.color_info]),
        d3.extent(data_list, d => d[bar_info.color_info])[1]])
      .range(color_palette)

    // y axis
    var x_axis = d3.axisBottom(x_scale)

    // canvas
    //   .append('g')
    //   .attr('transform', 'translate (0,' + (height - margin.botton) + ')')
    //   .attr('stroke', '#d4d4d4')
    //   .transition()
    //   .duration(500)
    //   .ease(d3.easeBackIn)
    //   .delay(50)
    //   .call(x_axis)

    var bigbar = function(d){
      canvas.select("g."+escapeChars(d[bar_info.y_info])).select('rect')
        .attr('id', 'active')
        .attr('height', y_scale.bandwidth() + 10)
        .attr('y', y_scale(d[bar_info.y_info]))
    }

    var normalbar = function(d){
      canvas.select("g."+escapeChars(d[bar_info.y_info])).select('rect')
        .attr('id', 'active')
        .attr('height', y_scale.bandwidth())
        .attr('y', y_scale(d[bar_info.y_info])+5)
    }

    var mouseover = function (d) {
      bigbar(d)

      d3.selectAll('rect:not(#active)')
        .classed('not-hover', true)

      let bar = canvas.select("g."+escapeChars(d[bar_info.y_info])).select('rect')
      let bar_name = canvas.select("g."+escapeChars(d[bar_info.y_info])).select('text.bar-name')
      let bar_width = bar.node().getBBox().width
      let bar_name_width = bar_name.node().getBBox().width
      let ratio = (bar_name_width/(bar_width-20))
      if (ratio>1){
        bar_name
        .transition()
        .attr("x", bar_name.node().getBBox().x - ((ratio-1)*bar_width))
        .ease(d3.easeLinear)
        .duration(1000*(ratio*3))
        .on("end", function(){bar_name.attr("x", margin.left+10)})
      }
    }


    var mouseout = function (d) {
        normalbar(d)

      d3.selectAll('rect').classed('not-hover', false)
      canvas.select("g."+escapeChars(d[bar_info.y_info])).select('text.bar-name').attr("x", margin.left+10)
    }

    var deselect = function(){
      d3.selectAll(".no-selected").classed("no-selected", false)
      d3.selectAll(".bar-selected").classed("bar-selected",false)
      mapplot("#1db954");
    }

    var select = function(d){
      deselect()
      bigbar(d)
      canvas.select("."+escapeChars(d[bar_info.y_info])).classed("bar-selected",true)
      d3.selectAll(".no-selected").classed("no-selected", false)
      d3.selectAll(".line-area:not(."+escapeChars(d[bar_info.y_info])+")").classed("no-selected", true).classed("to-delete", true)
      .transition()
      .style('opacity', "0")
      .ease(d3.easeCubicOut)
      .duration(30)
      .on("end", function(){d3.selectAll("to-delete").remove()})
      d3.selectAll(".bar-group:not(."+escapeChars(d[bar_info.y_info])+")").classed("no-selected", true)
      d3.selectAll(".line:not(."+escapeChars(d[bar_info.y_info])+")").classed("no-selected", true)
      d3.selectAll("circle:not(."+escapeChars(d[bar_info.y_info])+")").classed("no-selected", true)
      mapplot(color_scale(d[bar_info.color_info]));
    }

    d3.select(".flex-container").on('dblclick', deselect)

    canvas
      .selectAll('rect')
      .data(data_list)
      .enter()
      .append('g')
      .attr('class', d => escapeChars(d[bar_info.y_info]))
      .classed('bar-group', true)
      .on('click', select)
      .append('rect')
      .attr('height', y_scale.bandwidth())
      .attr('y', d => y_scale(d[bar_info.y_info]) + 5)
      .attr('x', d => margin.left)
      .attr('fill', d => color_scale(d[bar_info.color_info]))
      .attr('width', function (d) {return x_scale(d[bar_info.x_info]) - margin.left})
      .classed('bar', true)
      .on('mouseenter ', mouseover)
      .on('mouseleave', mouseout)
    canvas
      .selectAll('.bar-group')
      .data(data_list)
      .append('text')
      .text(d => d[bar_info.y_info])
      .attr('y', d => y_scale(d[bar_info.y_info]) + (y_scale.bandwidth() / 2))
      .attr('x', margin.left + 10)
      .style('fill', '#212121')
      .classed('bar-name', true)

    canvas
      .selectAll('.bar-group')
      .data(data_list)
      .append('text')
      .text(d => minToHours(d[bar_info.x_info]))
      .attr('y', d => y_scale(d[bar_info.y_info]) + (y_scale.bandwidth() / 2) + 20)
      .attr('x', d => margin.left + 10)
      .style('fill', '#212121')
      .classed('bar-value', true)
  })
}


function lineplot(){
  // Plantilla para la generación de grafica de lineas multiples
// elaborado por Anrés Felipe Sánchez Patarroyo

// data load
const line_url = new URL(main_user+"/top-songs/monthly",base_url)
d3.json(line_url.href).then(function(data_file) {

    // relevant data for graph
    var line_info = {
      tittle: 'grafica 1',
      x_info: 'month',
      x_tittle: 'mes',
      y_info: 'minutes_listened',
      y_tittle: 'minutos',
      color_info: 'top',
      class_info: 'track',
      text_info: 'artist',
    }

  var data_list = data_file.items
  function getFields(input, field) {
    var output = []
    for (var i = 0; i < input.length; ++i)
        output.push(input[i][field])
    return output
}

var fill_value = d3.map()
data_list.forEach((d) => {fill_value.set(escapeChars(d[line_info.class_info]), d[line_info.color_info])});

var item_names = d3.map()
data_list.forEach((d) => {item_names.set(escapeChars(d[line_info.class_info]), d[line_info.class_info])});

for (const item_name of item_names.values()){
  var registered_months = data_list.filter(inner_d=>inner_d[line_info.class_info]==item_name)
  var actual_months_ids = registered_months.map(d=>d.month)
  let missing_month_ids = month_ids.filter(x => !actual_months_ids.includes(x));
  var missing_months = missing_month_ids.map(function(d) {return{...registered_months[0], ...{"month":d, "minutes_listened":0}};})
  data_list= data_list.concat(missing_months)
}

  data_list = data_list.sort((a, b) => b.month - a.month)

// canvas dimensions
var height = 400
var width = 500

var margin = {
  top: 50,
  botton: 50,
  left: 30,
  right: 75
}

var canvas = d3.select('#lineplot')
    .append('svg')
    .attr('width', width)
    .attr('height', height)

// group the data for lines
var sumstat = d3.nest() 
    .key(function (d) { return escapeChars(d[line_info.class_info]); })
    .entries(data_list);

// dimension scales
var x_scale = d3.scaleLinear()
    .domain(d3.extent(data_list, d => parseInt(d[line_info.x_info])))
    .range([0 + margin.left, width - margin.right]);

var y_scale = d3.scaleLinear()
    .domain([0, d3.max(data_list, d => parseInt(d[line_info.y_info]))])
    .range([height - margin.botton, 0 + margin.top]);

// color palette
var res = getFields(sumstat, "key") // list of group names
var color_scale = d3.scaleOrdinal()
    .domain([d3.extent(res, d => fill_value.get(d))[0],
    d3.mean(res, d => fill_value.get(d)),
    d3.extent(res, d => fill_value.get(d))[1]])
    .range(color_palette)


// x axis

var x_axis = d3.axisBottom(x_scale)
    .ticks(5)

canvas
    .append('g')
    .attr('transform', 'translate (0,' + (height - margin.botton + 5) + ')')
    .transition()
    .duration(500)
    .ease(d3.easeBackIn)
    .delay(50)
    .call(x_axis)
    
// y axis
var y_axis = d3.axisLeft(y_scale)

// canvas.append('g')
//     .attr('transform', 'translate (' + margin.left + ',0)')
//     .transition()
//     .duration(500)
//     .ease(d3.easeBackIn)
//     .delay(50)
//     .call(y_axis)


  // create a tooltip
  var Tooltip = d3.select('#lineplot')
  .append('div')
  .style('opacity', 0)
  .style('font-family', 'Montserrat')
  .attr('class', 'tooltip')

  // functions for lines
var linemouseover = function (d) {
  Tooltip
    .style('opacity', 1)

  d3.select(this)
    .attr('id', 'active')
    .attr('stroke-width', "3px")

  d3.selectAll('circle:not(.'+d.key+'), path:not(.'+d.key+')')
    .classed('not-hover', true)

  d3.selectAll('circle.'+d.key)
    .classed("selected",true)
    .attr('r', 5)
}
var linemousemove = function (d) {
  console.log(d)
  Tooltip
        .html(line_info.text_info + ': ' + d.key+ '<br>' +
          line_info.color_info + ': ' + d[line_info.x_info] + '<br>' +
          line_info.y_info + ': ' + d[line_info.y_info] + '<br>')
        .style('left', width + 'px')
        .style('top', (d3.mouse(this)[1]+400) + 'px')
}
var linemouseout = function (d) {
  Tooltip
    .style('opacity', 0)
  d3.select(this)
    .attr('id', 'inactive')
    .attr('stroke-width', 2.5)

  d3.selectAll('circle, path')
    .classed('not-hover', false)
    .classed("selected",false)

  d3.selectAll('circle')
    .attr('r', 3)
}

    // functions for circles
    var circlemouseover = function (d) {
      Tooltip
        .style('opacity', 1)

      d3.selectAll('circle.'+escapeChars(d[line_info.class_info]))
        .attr('r', 5)

      d3.select(this)
        .attr('id', 'active')
        .attr('r', 10)
  
      d3.selectAll('circle:not(.'+escapeChars(d[line_info.class_info])+'), path:not(.'+escapeChars(d[line_info.class_info])+')')
        .classed('not-hover', true)

      d3.selectAll('path.'+escapeChars(d[line_info.class_info]))
      .attr('stroke-width', 3)
    }
    var circlemousemove = function (d) {
      Tooltip
        .html(line_info.color_info + ': ' + d[line_info.color_info]+ '<br>' +
          line_info.x_info + ': ' + d[line_info.x_info] + '<br>' +
          line_info.y_info + ': ' + d[line_info.y_info] + '<br>')
        .style('left', width + 'px')
        .style('top', (d3.mouse(this)[1]+400) + 'px')
        
        d3.selectAll('circle.'+escapeChars(d[line_info.class_info]))
        .attr('r', 5)

        d3.select(this)
          .attr('id', 'active')
          .attr('r', 10)

    }
    var circlemouseout = function (d) {
      Tooltip
        .style('opacity', 0)
      d3.select(this)
        .attr('id', 'inactive')
        .attr("r", 3)
  
      d3.selectAll('circle, path')
        .classed('not-hover', false)
  
      d3.selectAll('circle')
      .attr("r", 3)

      d3.selectAll('path.'+escapeChars(d[line_info.class_info]))
      .attr('stroke-width', 2.5)
    } 
    
    var resetarea = function(){
    d3.selectAll(".line-area")
    .classed("to-delete", true)
    .transition()
    .style('opacity', "0")
    .ease(d3.easeCubicOut)
    .duration(30)
    .on("end", function(){d3.selectAll("to-delete") .remove()})
    }

    var generatearea = function(d){
    resetarea();
    canvas
    .data([d])
    .insert("path",":first-child")
    .attr("fill", function (d) { return color_scale(fill_value.get(d.key)) })
    .attr("stroke", "none")
    .attr("d", function (d) {
        return d3.area()
            .x(function (d) { return x_scale(d[line_info.x_info]); })
            .y1(function (d) { return y_scale(d[line_info.y_info]); })
            .y0(height-margin.botton)
            .curve(d3.curveCardinal.tension(0.1))
            (d.values)
    })
    .attr("class", d=>d.key)
    .classed("line-area", true)
    .style('opacity', "0.0")
    .transition()
    .style('opacity', "0.5")
    .ease(d3.easeCubicOut)
    .duration(10)
  }

  var select = function(d){
    d3.selectAll(".no-selected").classed("no-selected", false)
    d3.selectAll(".bar-group:not(."+d.key+")").classed("no-selected", true)
    d3.selectAll(".line-area:not(."+d.key+")").classed("no-selected", true)
    d3.selectAll(".line-area:not(."+d.key+")").classed("no-selected", true)
    d3.selectAll(".line:not(."+d.key+")").classed("no-selected", true)
    d3.selectAll("circle:not(."+d.key+")").classed("no-selected", true)
    generatearea(d)
    mapplot(color_scale(fill_value.get(d.key)));
  }

  var deselect = function(d){
    d3.selectAll(".no-selected").classed("no-selected", false)
    resetarea(d)
    mapplot("#1db954");
  }

// Draw the line

d3.select(".flex-container").on('dblclick', deselect)

canvas.selectAll(".line")
    .data(sumstat)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", function (d) { return color_scale(fill_value.get(d.key)) })
    .attr("stroke-width", 2.5)
    .attr("d", function (d) {
        return d3.line()
            .x(function (d) { return x_scale(d[line_info.x_info]); })
            .y(function (d) { return y_scale(d[line_info.y_info]); })
            .curve(d3.curveCardinal.tension(0.1))
            (d.values)
    })
    .attr('class', d => d.key)
    .classed('line', true)
    .on('mouseover', linemouseover)
    .on('mousemove', linemousemove)
    .on('mouseout', linemouseout)
    .on('click', select)

canvas.selectAll("myCircles")
    .data(data_list)
    .enter()
    .append("circle")
    .attr("fill", function (d) { return color_scale(d[line_info.color_info]) })
    .attr("cx", d => x_scale(d[line_info.x_info]))
    .attr("cy", d => y_scale(d[line_info.y_info]))
    .attr('class', d => escapeChars(d[line_info.class_info]))
    .attr("r", 3)
    .on('mouseover', circlemouseover)
    .on('mousemove', circlemousemove)
    .on('mouseout', circlemouseout)
    .on('click', function(d) { return select(sumstat.filter(in_d=>in_d.key==escapeChars(d[line_info.class_info]))[0])})

})
}


var map_height = 600
var map_width = 500
var map_canvas = d3.select('#mapplot')
  .append('svg')
  .attr('width', map_width)
  .attr('height', map_height)


function mapplot (top_color) {

  const map_url = new URL('by-country', base_url)
  

  const country_codes_a2_convertion = {
    'AR':'ARG',
    'BO':'BOL',
    'BR':'BRA',
    'CL':'CHL',
    'CO':'COL',
    'EC':'ECU',
    'GF':'GUF',
    'GY':'GUY',
    'PY':'PRY',
    'PE':'PER',
    'SR':'SUR',
    'UY':'URY',
    'VE':'VEN'
  }

  const countries_names = {
    'ARG':'Argentina',
    'BOL':'Bolivia',
    'BRA':'Brasil',
    'CHL':'Chile',
    'COL':'Colombia',
    'ECU':'Ecuador',
    'GUF':'Guyana francesa',
    'GUY':'Guyana',
    'PRY':'Paraguay',
    'PER':'Perú',
    'SUR':'Suriname',
    'URY':'Uruguay',
    'VEN':'Venezuela'
  }

  const country_codes_a3 = [
    'ARG',
    'BOL',
    'BRA',
    'CHL',
    'COL',
    'ECU',
    'GUF',
    'GUY',
    'PRY',
    'PER',
    'SUR',
    'URY',
    'VEN'
  ]
  var path = d3.geoPath()
  var projection = d3.geoMercator()
    .scale(400)
    .center([-60, -25])
    .translate([map_width / 2, map_height / 2])

  // Data and color scale
  var data = d3.map()

  var promises = [
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'),
    d3.json(map_url.href)
  ]
  Promise.all(promises).then(ready)

  function ready ([topo, data]) {
    topo.features = topo.features.filter(function (d) {return country_codes_a3.includes(d.id)})
    var fill_value = d3.map()
    data.items.forEach((d) => {
      fill_value.set(country_codes_a2_convertion[d.country], d.minutes_listened)})

    var Tooltip = d3.select('#mapplot')
      .append('div')
      .style('opacity', 0)
      .style('font-family', 'Montserrat')
      .attr('class', 'tooltip')

    let mouseOver = function (d) {
      Tooltip
        .style('opacity', 1)
      d3.selectAll('.Country')
        .transition()
        .duration(200)
        .style('opacity', .5)
        .style('stroke', 'none')
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 1)
        .style('stroke', 'none')
    }

    var mouseMove = function (d) {
      Tooltip
        .html(countries_names[d.id]+":<br>"+minToHours(fill_value.get(d.id)))
        .style('left', (d3.mouse(document.body)[0] - 100) + 'px')
        .style('top', (d3.mouse(document.body)[1]-50) + 'px')
    }

    let mouseLeave = function (d) {
      Tooltip
        .style('opacity', 0)
      d3.selectAll('.Country')
        .transition()
        .duration(200)
        .style('opacity', .8)
        .attr("stroke-width", 2.5)
        .style('stroke', '#212121')
      d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke-width", 2.5)
        .style('stroke', '#212121')
    }

    // color scale
    var color_scale = d3.scaleSequential(d3.interpolate('#ffffff', top_color))
      .domain([d3.extent(data.items, d => d.minutes_listened)[0],
        d3.extent(data.items, d => d.minutes_listened)[1]])

    function get_color(d){
      var value = color_scale(fill_value.get(d.id)||0)
      if(value == undefined){value="#000000"}
      return value
    }
    // Draw the map
    map_canvas
      .append('g')
      .selectAll('path')
      .data(topo.features)
      .enter()
      .append('path')
      .attr('d', d3.geoPath().projection(projection))
      .attr('fill', d => get_color(d))
      .attr("stroke-width", 2.5)
      .style('stroke', '#212121')
      .attr('class', 'country')
      .style('opacity', .8)
      .on('mouseover', mouseOver)
      .on('mouseleave', mouseLeave)
      .on('mousemove', mouseMove)
  }
}


window.onload = function() {
  barplot();
  lineplot();
  mapplot("#1db954");
};