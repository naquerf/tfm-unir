function lineplot(){
    // Plantilla para la generación de grafica de lineas multiples
  // elaborado por Anrés Felipe Sánchez Patarroyo
  
  // data load
  d3.json('http://127.0.0.1:8000/test/d3').then(function (data) {
  
    var data_list = data.partidos
  
    // relevant data for graph
    var line_info = {
      tittle: 'grafica 1',
      x_info: 'mediaAutoubicacion',
      x_tittle: 'media',
      y_info: 'votantes',
      y_tittle: 'votantes',
      color_info: 'grupo',
      text_info: 'partido',
    }
  
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
  
  
  
  function getFields(input, field) {
      var output = []
      for (var i = 0; i < input.length; ++i)
          output.push(input[i][field])
      return output
  }
  
  // group the data for lines
  var sumstat = d3.nest() 
      .key(function (d) { return d[line_info.color_info]; })
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
      .domain(res)
      .range(['#e41a1c', '#377eb8'])
  
  
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
      .attr('stroke-width', 3)
  
    d3.selectAll('circle:not(.'+d.key+'), path:not(.'+d.key+')')
      .classed('not-hover', true)
  
    d3.selectAll('circle.'+d.key)
      .attr('r', 5)
  }
  var linemousemove = function (d) {
    Tooltip
      .html(line_info.color_info + ': ' + d.key)
      .style('left', (d3.mouse(this)[0] + 70) + 'px')
      .style('top', (d3.mouse(this)[1]+400) + 'px')
  }
  var linemouseout = function (d) {
    Tooltip
      .style('opacity', 0)
    d3.select(this)
      .attr('id', 'inactive')
      .attr('stroke-width', 1.5)
  
    d3.selectAll('circle, path')
      .classed('not-hover', false)
  
    d3.selectAll('circle')
      .attr('r', 2)
  }
  
      // functions for circles
      var circlemouseover = function (d) {
        Tooltip
          .style('opacity', 1)
  
        d3.selectAll('circle.'+d[line_info.color_info])
          .attr('r', 5)
  
        d3.select(this)
          .attr('id', 'active')
          .attr('r', 10)
    
        d3.selectAll('circle:not(.'+d[line_info.color_info]+'), path:not(.'+d[line_info.color_info]+')')
          .classed('not-hover', true)
  
        d3.selectAll('path.'+d[line_info.color_info])
        .attr('stroke-width', 3)
      }
      var circlemousemove = function (d) {
        Tooltip
          .html(line_info.color_info + ': ' + d[line_info.color_info]+ '<br>' +
            line_info.x_info + ': ' + d[line_info.x_info] + '<br>' +
            line_info.y_info + ': ' + d[line_info.y_info] + '<br>')
          .style('left', (d3.mouse(this)[0] + 70) + 'px')
          .style('top', (d3.mouse(this)[1]+400) + 'px')
          
          d3.selectAll('circle.'+d[line_info.color_info])
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
          .attr("r", 2)
    
        d3.selectAll('circle, path')
          .classed('not-hover', false)
    
        d3.selectAll('circle')
        .attr("r", 2)
  
        d3.selectAll('path.'+d[line_info.color_info])
        .attr('stroke-width', 1.5)
      }
  
  // Draw the line
  
  canvas.selectAll(".line")
      .data(sumstat)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", function (d) { return color_scale(d.key) })
      .attr("stroke-width", 2)
      .attr("d", function (d) {
          return d3.line()
              .x(function (d) { return x_scale(d[line_info.x_info]); })
              .y(function (d) { return y_scale(d[line_info.y_info]); })
              (d.values)
      })
      .attr('class', d => d.key)
      .on('mouseover', linemouseover)
      .on('mousemove', linemousemove)
      .on('mouseout', linemouseout)
  
  canvas.selectAll("myCircles")
      .data(data_list)
      .enter()
      .append("circle")
      .attr("fill", function (d) { return color_scale(d[line_info.color_info]) })
      .attr("cx", d => x_scale(d[line_info.x_info]))
      .attr("cy", d => y_scale(d[line_info.y_info]))
      .attr('class', d => d[line_info.color_info])
      .attr("r", 2)
      .on('mouseover', circlemouseover)
      .on('mousemove', circlemousemove)
      .on('mouseout', circlemouseout)
  
  })
  }

  window.onpageshow = function() {
    lineplot();
  };