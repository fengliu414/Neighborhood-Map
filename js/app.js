// Create a global map
var map;
// Create a new blank array for all the listing markers.
var markers = [];
var largeInfowindow;
var innerHTML;
var errorCode;
// Style the markers a bit. This will be our listing marker icon.
var defaultColor = '0091ff';
// Create a "highlighted location" marker color for when the user
// mouses over the marker.
var highlightedColor = 'FFFF24';
var activatedColor = '6600cc';

var apiURL = 'https://api.foursquare.com/v2/venues/search?ll=';
var foursquareClientID = 'PCAZPIZVA3YEKZDPIQFR23RLNBPRD2FUCPPZBXRRXQYHDZQM'
var foursquareSecret ='0W3NQ5CHYEAT3ID4BSYNBKLGAPF1OUNWONXQ1VXGJ0NNGMAS';
var foursquareVersion = '20170112';
var ajaxContents = new Array();

function getAjaxContent() {
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var lat = locations[i].location.lat;
    var lng = locations[i].location.lng;
    var foursquareURL = apiURL + lat + ',' + lng + '&client_id=' +
    foursquareClientID +  '&client_secret=' + foursquareSecret +'&v=' + foursquareVersion;
    $.ajax({
      url: foursquareURL,
      success: function(data) {
        ajaxContent = {};
        ajaxContent['phone'] = data.response.venues[0].contact.formattedPhone;
        ajaxContent['users'] = data.response.venues[0].stats.usersCount;
        ajaxContent['url'] = data.response.venues[0].url;
        ajaxContents.push(ajaxContent);
      }
    }).fail(function(err) {
      window.vm.errorCode('Data from Foursquare API cannot be loaded');
    });
  }
}

// These are the real estate listings that will be shown to the user.
// Normally we'd have these in a database instead.
var locations = [
  {title: 'Red Rock Coffee', location: {lat: 37.393605, lng: -122.078757}, placeID: 'ChIJF8VqETS3j4ARxmLCuGE7dzk',
   id: '0'},
  {title: "Starbucks", location: {lat: 37.421811, lng: -122.096427}, placeID: 'ChIJgRfYFxC6j4ARIlJOMpxVRng',
  id: '1'},
  {title: 'Pearl Cafe', location: {lat: 37.402987, lng: -122.106671}, placeID: 'ChIJb6azp5iwj4ARJkf05cvTjbU',
   id: '2'},
  {title: 'Coffee Lab', location: {lat: 37.417963, lng: -122.07105}, placeID: 'ChIJZ8G4P1i3j4AROfHcuW0v50M',
   id: '3'},
  {title: 'Starbucks', location: {lat: 37.411317, lng: -122.094452}, placeID: 'ChIJW5IcPqiwj4AR3dux-nE8hG8',
   id: '4'},
  {title: 'Moksha Coffee Roasting LLC', location: {lat: 37.413786, lng: -122.088661},
   placeID: 'ChIJ59zoCKqwj4ARiPBNJAV9H5Q', id: '5'},
  {title: 'Starbucks', location: {lat: 37.415999, lng: -122.077131}, placeID: 'ChIJ0Ttxbla3j4AROkXAJNLP9bw',
   id: '6'},
  {title: 'Starbucks', location: {lat: 37.402724, lng: -122.112076}, placeID: 'ChIJJRCUp56wj4AR3VdlpTrpOco',
   id: '7'},
  {title: 'Starbucks', location: {lat: 37.402898, lng: -122.079455}, placeID: 'ChIJA-tWDUy3j4ARr-ooF1e_rHk',
   id: '8'},
  {title: "Peet's Coffee", location: {lat: 37.400653, lng: -122.113264}, placeID: 'ChIJK0H565uwj4ARb86UbwMJu-o',
   id: '9'},
  {title: "Peet's Coffee", location: {lat: 37.419108, lng: -122.110495}, placeID: 'ChIJ_XZttG26j4AR5fLRimOa0x4',
   id: '10'},
  {title: 'Verde Tea Cafe', location: {lat: 37.394164, lng: -122.079489}, placeID: 'ChIJmVifQDS3j4AR6M7kW4ikBTw',
   id: '11'}
];

// maps loading error handling
function mapError() {
  alert("Could not load Google Maps");
};

var coffeeShop = function(data) {
  var self = this;
  self.title = data.title;
  self.location = data.location;
  self.placeID = data.placeID;
  self.id = data.id;
};

var ViewModel = function() {
  var self = this;
  self.markers = markers;
  self.ismaploaded = false;
  self.errorCode = ko.observable();

  self.selectedCoffeeShop = function(coffeeShop) {
    populateInfoWindow(self.markers[coffeeShop.id], largeInfowindow, coffeeShop.id);
  };
  self.click = function(coffeeShop) {
    self.markers[coffeeShop.id].setIcon(makeMarkerIcon(activatedColor));
  };

  self.mouse_over = function(coffeeShop) {
    self.markers[coffeeShop.id].setIcon(makeMarkerIcon(highlightedColor));
  };

  self.mouse_out = function(coffeeShop) {
    self.markers[coffeeShop.id].setIcon(makeMarkerIcon(defaultColor));
  };

  self.coffeeShopList = ko.observableArray([]);
  locations.forEach(function(coffeeShopItem){
    self.coffeeShopList.push( new coffeeShop(coffeeShopItem) );
  });

  self.filter = ko.observable();
  self.applyFilter = function() {
    if (self.ismaploaded) {
      searchWithinFilter();
    }
  }

  //filter the items using the filter text
  self.filteredCoffeeShopList = ko.computed(function() {
    var filter = self.filter();
    if (!filter) {
        if (self.ismaploaded) {
          searchWithinFilter();
        }
        return self.coffeeShopList();
    } else {
        return ko.utils.arrayFilter(self.coffeeShopList(), function(item) {
            searchWithinFilter();
            self.ismaploaded = true;
            return item.title.toLowerCase().indexOf(filter.toLowerCase()) > -1;
        });
    }
  });
};

var lat = 37.3861;
var lng = -122.0839;
var maploaded = false;
function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: lat, lng: lng},
    zoom: 13,
    mapTypeControl: false
  });
  maploaded = true;
  getAjaxContent();
  var defaultIcon = makeMarkerIcon(defaultColor);
  largeInfowindow = new google.maps.InfoWindow();

  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;
    var place_id = locations[i].placeID;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: place_id,
    });

    // Push the marker to our array of markers.
    markers.push(marker);

    // Create an onclick event to open the large infowindow at each marker.
    marker.addListener('click', (function(iCopy) {
      return function() {
        this.setIcon(makeMarkerIcon(activatedColor));
        populateInfoWindow(this, largeInfowindow, iCopy);
      };
    })(i));
    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    marker.addListener('mouseover', function() {
      this.setIcon(makeMarkerIcon(highlightedColor));
    });
    marker.addListener('mouseout', function() {
      this.setIcon(makeMarkerIcon(defaultColor));
    });
  }
  showListings();
}

// This function will loop through the markers array and display them all.
function showListings() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map)
    markers[i].setVisible(true);
    bounds.extend(markers[i].position);
  }
  google.maps.event.addDomListener(window, 'resize', function() {
    map.fitBounds(bounds); // `bounds` is a `LatLngBounds` object
  });
}

// This function will loop through the listings and hide them all.
function hideMarkers() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setVisible(false);
  }
}
// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow, index) {

  // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;
    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    zoomToArea(marker);
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
    function getStreetView(data, status) {
      var ajaxLoaded = false;
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);

        // Get detail from google place API asynchronously
        getPlacesDetails(marker, infowindow);

        if (innerHTML) {
          innerHTML = '<div>' + marker.title + '</div><div id="pano"></div>' + innerHTML;
        } else {
          innerHTML = '<div>' + marker.title + '</div><div id="pano"></div>';
        }

        if (ajaxContents[index].url) {
          innerHTML += '<div><a href="' + ajaxContents[index].url + '">Go to store website</a></div>';
        }
        if (ajaxContents[index].phone) {
          innerHTML += '<div><strong>Phone:</strong>' + ajaxContents[index].phone + '</div>';
        }
        if (ajaxContents[index].users) {
          innerHTML += '<div><strong>Overall customers have been to the store:</strong>' + ajaxContents[index].users + '</div>';
        }

        infowindow.setContent(innerHTML);

        var panoramaOptions = {
          position: nearStreetViewLocation,
          pov: {
            heading: heading,
            pitch: 10
          }
        };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent('<div>' + marker.title + '</div>' +
          '<div>No Street View Found</div>');
      }
    }
    // Use streetview service to get the closest streetview image within
    // 50 meters of the markers position
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    // Open the infowindow on the correct marker.
    infowindow.open(map, marker);

    // Make sure the marker property is cleared if the infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
  }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}

// This function hides all markers outside the polygon,
// and shows only the ones within it. This is so that the
// user can specify an exact area of search.
function searchWithinFilter() {
  var bounds = new google.maps.LatLngBounds();
  var atleastOne = false;
  for (var i = 0; i < markers.length; i++) {
    var filter = window.vm.filter();
    if (markers[i].title.toLowerCase().indexOf(filter.toLowerCase()) != -1) {
      markers[i].setMap(map);
      bounds.extend(markers[i].position);
      atleastOne = true;
    } else {
      markers[i].setMap(null);
    }
  }
  if (atleastOne) {
    map.fitBounds(bounds);
  } else {
    map.setCenter({lat:lat, lng:lng});
  }
}
// This function takes the input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all listings, then decide to focus on one area of the map.
function zoomToArea(marker) {
    map.setCenter(marker.position);
    map.setZoom(15);
}

// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // Set the marker property on this infowindow so it isn't created again.
      infowindow.marker = marker;
      innerHTML = '<div>';
      if (place.name) {
        innerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        innerHTML += '<br>' + place.formatted_address;
      }
      if (place.formatted_phone_number) {
        innerHTML += '<br>' + place.formatted_phone_number;
      }
      if (place.opening_hours) {
        innerHTML += '<br><br><strong>Hours:</strong><br>' +
            place.opening_hours.weekday_text[0] + '<br>' +
            place.opening_hours.weekday_text[1] + '<br>' +
            place.opening_hours.weekday_text[2] + '<br>' +
            place.opening_hours.weekday_text[3] + '<br>' +
            place.opening_hours.weekday_text[4] + '<br>' +
            place.opening_hours.weekday_text[5] + '<br>' +
            place.opening_hours.weekday_text[6];
      }
      innerHTML += '</div>';
    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
      errorCode = 'No details found for this place';
    } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
      errorCode = 'Over query limit';
    } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
      errorCode = 'Request denied';
    } else if (status === google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
      errorCode = 'Required query parameter is missing';
    }
    window.vm.errorCode(errorCode);
  });
}


window.vm = new ViewModel();
ko.applyBindings(vm);

