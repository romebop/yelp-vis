console.log('hi');

var map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json?key=997897f9-01f4-4f12-9a64-6e44afc95262',
  center: [-115.1439, 36.1615],
  zoom: 13.5,
  minZoom: 10,
  maxZoom: 16,
  maxBounds: [
    [-115.85180521108714, 35.811059547051386], // SW
    [-114.45832924688042, 36.44166719811932],  // NE
  ],
});

map.addControl(new maplibregl.NavigationControl());

var container = map.getCanvasContainer();
var svg = d3.select(container).append('svg');

function project(d) {
  const ll = new maplibregl.LngLat(+d.longitude, +d.latitude);
  return map.project(ll);
}

d3.csv('vegas-businesses.csv', function(err, data) {

  var originalData = data;

  var tooltip = d3.select('#map')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'tooltip');

  function render() {

    var bounds = map.getBounds();
    var west = bounds.getWest();
    var east = bounds.getEast();
    var north = bounds.getNorth();
    var south = bounds.getSouth();

    function inBounds(d) {
      var lat = d.latitude;
      var lon = d.longitude;
      return (lon <= east) && (lon >= west) && (lat <= north) && (lat >= south);
    }

    var filteredData = originalData
      .filter(inBounds)
      .filter(_.partial(minStars, getMinStars(map.getZoom())))
      .filter(twentyReviews);

    var businesses = svg.selectAll('circle.business')
      .data(filteredData, key);

    businesses.enter().append('circle')
      .classed('business', true)
      .attr('r', 1)
      .style({
        fill: '#0082a3',
        'fill-opacity': 0.6,
        stroke: '#004d60',
        'stroke-width': 1,
        cursor: 'pointer',
      })
      .on('mouseover', function(d) {
        tooltip.style('opacity', 1)

        d3.select(this)
          .transition()
            .attr('r', 10)
            .style({
              fill: 'orange',
              'fill-opacity': 1,
            })
            .duration(250);
      })
      .on('mousemove', function(d) {
        tooltip.html(`<div class='name'>${d.name}</div><div>${getStarEmojis(d.stars)} (${d.review_count})</div>`)
          .style('left', `${project(d).x}px`)
          .style('top', `${project(d).y}px`)
      })
      .on('mouseout', function(d) {
        tooltip.style('opacity', 0)

        d3.select(this)
          .transition()
          .attr('r', 5)
          .style({
            fill: '#0082a3',
            'fill-opacity': 0.6,
          })
          .duration(250);
      })
      .transition().duration(500)
        .attr('r', 5);

    businesses.exit()
        .remove();

    businesses
      .attr({
        cx: function(d) {
          return project(d).x;
        },
        cy: function(d) {
          return project(d).y;
        },
      });

  }

  map.on('move', function() {
    render();
  });

  map.on('zoom', function() {
    // console.log('bounds', map.getBounds());
    // console.log('zoom', map.getZoom());
  });

  // initial render 
  render();

});

function key(d) {
  return d.name;
}

function minStars(min, d) {
  return d.stars >= min;
}

// 16 closest; 10 farthest
function getMinStars(zoom) {
  if (zoom > 15) return 3;
  if (zoom > 14) return 4;
  return 5;
}

function getStarEmojis(stars) {
  return '★'.repeat(Math.round(stars)).padEnd(5, '☆');
}

function minReviews(min, d) {
  return d.review_count >= min;
}

var twentyReviews = _.partial(minReviews, 20);