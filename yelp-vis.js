// Provide access token
mapboxgl.accessToken = 'pk.eyJ1Ijoicm9tZWJvcCIsImEiOiJjaWh2YTlpbmgwMjBtdGdtMWZ3bWQxbmx4In0.nrKajZ5GWytwUakC3YLvqQ';

// Setup mapbox-gl map
var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/basic-v8',
  center: [-115.1439, 36.1615],
  zoom: 13.5,
  minZoom: 10,
  maxZoom: 16,
  maxBounds: [
    [-115.85180521108714, 35.811059547051386], // SW
    [-114.45832924688042, 36.44166719811932] // NE
  ],
});

map.addControl(new mapboxgl.NavigationControl());

// Setup our svg layer that we can manipulate with d3
var container = map.getCanvasContainer();
var svg = d3.select(container).append('svg');

function project(d) {
  return map.project(getLL(d));
}

function getLL(d) {
  return new mapboxgl.LngLat(+d.longitude, +d.latitude);
}

// Load in data
d3.csv('vegas-businesses.csv', function(err, data) {

  var originalData = data;

  function render() {

    var bounds = map.getBounds();
    var west = bounds.getWest()
      , east = bounds.getEast()
      , north = bounds.getNorth()
      , south = bounds.getSouth()
      ;

    function inBounds(d) {
      var lat = d.latitude,
        lon = d.longitude;
      if (lon > east || lon < west || lat > north || lat < south) {
        return false;
      } else {
        return true;
      }
    }

    var filteredData = originalData
      .filter(inBounds)
      .filter(fiveStars)
      .filter(twentyReviews)
      ;

    var businesses = svg.selectAll('circle.business')
      .data(filteredData, key);

    businesses.enter().append('circle')
      .classed('business', true)
      .attr('title', function(d) { return d.name })
      .attr('r', 1)
      .style({
        fill: '#0082a3',
        'fill-opacity': 0.6,
        stroke: '#004d60',
        'stroke-width': 1,
        cursor: 'pointer',
      })
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .transition().duration(500)
        .attr('r', 5)
      ;

    businesses.exit()
        .remove()
        ;

    businesses
      .attr({
        cx: function(d) {
          var x = project(d).x;
          return x
        },
        cy: function(d) {
          var y = project(d).y;
          return y
        },
      })
      ;

  }

  map.on('move', function() {
    render();
  });

  map.on('zoom', function() {
    // console.log('bounds', map.getBounds());
    // console.log('zoom', map.getZoom());
  });

  // render our initial visualization
  render();

});

function key(d) {
  return d.name;
}

function handleMouseOver(d, i) {
  // console.log(d);
  d3.select(this)
    .attr('r', 10)
    .style({
      fill: 'orange',
      'fill-opacity': 1,
    })
    ;
}

function handleMouseOut(d, i) {
  d3.select(this)
    .attr('r', 5)
    .style({
      fill: '#0082a3',
      'fill-opacity': 0.6,
    })
    ;
}

function minStars(min, d) {
  return d.stars >= min;
}

var fiveStars = _.partial(minStars, 5);

function minReviews(min, d) {
  return d.review_count >= min;
}

var twentyReviews = _.partial(minReviews, 20);