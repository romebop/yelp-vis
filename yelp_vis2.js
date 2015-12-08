// Provide access token
mapboxgl.accessToken = 'pk.eyJ1Ijoicm9tZWJvcCIsImEiOiJjaWh2YTlpbmgwMjBtdGdtMWZ3bWQxbmx4In0.nrKajZ5GWytwUakC3YLvqQ';

// Setup mapbox-gl map
var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/basic-v8',
  center: [-115.1439, 36.1615],
  zoom: 13.5,
});
map.scrollZoom.disable();
map.addControl(new mapboxgl.Navigation());

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
d3.csv('vegas_businesses.csv', function(err, data) {

  var originalData = data;
  
  function render() {

    var west = map.getBounds().getWest(),
      east = map.getBounds().getEast(), 
      north = map.getBounds().getNorth(),
      south = map.getBounds().getSouth();

    function inBounds(d) {
      var lat = d.latitude,
        lon = d.longitude;
      if (lon > east || lon < west || lat > north || lat < south) {
        return false;
      } else {
        return true;
      }
    }

    var filteredData = originalData.filter(inBounds);

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
        'stroke-width': 1
      })
      .transition().duration(500)
        .attr('r', 5);

    businesses.exit()
        .remove();

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
  }

  // re-render our visualization whenever the view changes
  map.on('viewreset', function() {
    render()
  })
  map.on('move', function() {
    render()
  })

  // render our initial visualization
  render()
});

function key(d) {
  return d.name;
}