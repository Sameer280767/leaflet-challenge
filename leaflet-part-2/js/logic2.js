// I first define the api link
const api_key = "pk.eyJ1IjoidGFsbGFudGo5NSIsImEiOiJjbGQwYmlicW0ydnZmM3BrNjhzcGxoMHVqIn0.NFVBr7AMOYS5BC5OwcXerA";

// I am setting up URLs for accessing earthquake and tectonic plate data
// 'queryUrl' points to the USGS earthquake data feed for the past week
// 'tectonicplatesUrl' references a GeoJSON file containing tectonic plate boundaries
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var tectonicplatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

//  I now use D3.js to make a GET request to the queryUrl endpoint, retrieving earthquake data as 'eqdata'
d3.json(queryUrl).then(function (eqdata) {
  // I then log the data defined as 'eqdata' to the console, 
  console.log(eqdata);
  // I then pass the 'eqdata' features object to a function called 'eqFeatures'
  eqFeatures(eqdata.features);
});

// I now define a function called eqcolDepth which determines marker color based on the depth of an earthquake
function eqcolDepth(depth){
  if (depth < 10) return "#00FF00";
  else if (depth < 30) return "greenyellow";
  else if (depth < 50) return "yellow";
  else if (depth < 70) return "orange";
  else if (depth < 90) return "orangered";
  else return "#FF0000";
}

// First I define a function called eqFeatures that will process earthquake data as 'alleqData'
// Inside this function I will define another function 'eaeqFeature'. This will add popups to each earthquake feature
// Popup will contain information on location, date, magnitude and depth of each earthquake
function eqFeatures(alleqData) {

  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>Location: ${feature.properties.place}</h3><hr><p>Date: ${new Date(feature.properties.time)}</p><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`);
  }

  // I now create a GeoJSON layer named 'earthquakes' that contains the features array on the alleqData object
  // I then apply 'eaeqFeature' function to each feature in this layer
  var earthquakes = L.geoJSON(alleqData, {
    onEachFeature: onEachFeature,

    // I use Point to layer option to customise appearance of markers based on earthquake properties
    pointToLayer: function(feature, latlng) {

      var markers = {
        radius: feature.properties.mag * 20000,
        fillColor: eqcolDepth(feature.geometry.coordinates[2]),
        fillOpacity: 0.7,
        color: "black",
        weight: 0.5
      }
      return L.circle(latlng,markers);
    }
  });

  // I call 'createMap' function, passing the earthquakes layer as an argument, to display the earthquakes on a map
  createMap(earthquakes);
}

// Here I define the 'createMap' function and add 3 tile layers
// 'satellite': A satellite imagery tile layer from Mapbox
// 'grayscale': A grayscale tile layer from Mapbox
// 'outdoors': An outdoors-themed tile layer from Mapbox

function createMap(earthquakes) {

  var satellite = L.tileLayer('https://api.mapbox.com/styles/v1/{style}/tiles/{z}/{x}/{y}?access_token={access_token}', {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    style:    'mapbox/satellite-v9',
    access_token: api_key
  });
  
  var grayscale = L.tileLayer('https://api.mapbox.com/styles/v1/{style}/tiles/{z}/{x}/{y}?access_token={access_token}', {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    style:    'mapbox/light-v11',
    access_token: api_key
  });

  var outdoors = L.tileLayer('https://api.mapbox.com/styles/v1/{style}/tiles/{z}/{x}/{y}?access_token={access_token}', {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    style:    'mapbox/outdoors-v12',
    access_token: api_key
  });

  // I create a layer for tectonic plates and add it to the map
  // I then perform a GET request to the 'tectonicplatesUrl' endpoint using D3.js to retrieve the tectonic plates data
  // I create a GeoJSON layer from the plates data and set the color to orange with a weight of 2
  // The layer is then added to the tectonicPlates layer group 
  // Layer defined previously are then added to variable 'basemaps'
  tectonicPlates = new L.layerGroup();

    d3.json(tectonicplatesUrl).then(function (plates) {

        console.log(plates);
        L.geoJSON(plates, {
            color: "orange",
            weight: 2
        }).addTo(tectonicPlates);
    });

    var baseMaps = {
        "Satellite": satellite,
        "Grayscale": grayscale,
        "Outdoors": outdoors
    };

    // Block of code below completes the creation of the map by adding overlay layers, a legend, and a layer control 
    var overlayMaps = {
        "Earthquakes": earthquakes,
        "Tectonic Plates": tectonicPlates
    };
    
    
  var myMap = L.map("map", {
    center: [
      -25.72, 133.78
    ],
    zoom: 5,
    layers: [satellite, earthquakes, tectonicPlates]
  });

  
  var legend = L.control({position: "bottomright"});
  legend.onAdd = function() {
    var div = L.DomUtil.create("div", "info legend"),
    depth = [-10, 10, 30, 50, 70, 90];

    div.innerHTML += "<h3 style='text-align: center'>Depth</h3>"

    for (var i = 0; i < depth.length; i++) {
      div.innerHTML +=
      '<i style="background:' + eqcolDepth(depth[i] + 1) + '"></i> ' + depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '<br>' : '+');
    }
    return div;
  };
  legend.addTo(myMap)

  // I create a new instance of the layer control, which allows users to toggle between different base maps and overlay layers on the map
  
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
};



