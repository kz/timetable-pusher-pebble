var UI = require('ui');
var Settings = require('settings');

var BASE_URL = 'https://timetablepush.me/';
var API_BASE_URL = BASE_URL + 'api/v1/';
var CONFIGURATION_URL = BASE_URL + 'app/config';

/*
 * App Start
 */

var viewMain = new UI.Card({
  title: 'Timetable Pusher',
  subtitle: 'Loading...'
});
viewMain.show();

/*
 * Configuration
 */

// Listen for configuration start
Settings.config(
  { 
    url: CONFIGURATION_URL,
    autoSave: true
  },
  function(e) {
    
  },
  function(e) {
    console.log('Configuration closed');
    checkReady();
  }
);

// Listen for configuration complete
Settings.config(
  { url: CONFIGURATION_URL,
    autoSave: true },
  function(e) {
    console.log('Configuration closed');
    checkReady();
  }
);

/*
 * Views
 */

var viewSetupCard = new UI.Card({
  title: 'Setup Required',
  body: 'Open this app\'s configuration page on the Pebble watchapp.'
});

var viewHomeMenu = new UI.Menu({
  sections: [{
    title: 'Timetable Pusher',
  },
  {
    title: 'Add entries for',
    items: [{
      title: 'Current week'
    },
    {
      title: 'Next week'
    }]
  },  
  {
    title: 'Advanced',
    items: [{
      title: 'Delete all pins'
    }],
  }]
});

/*
 * App Ready
 */

// Check whether the API key is set
var checkReady = function () {
  if (typeof Settings.option('apiKey') === 'undefined') {
    viewSetupCard.show();
  } else {
    viewSetupCard.hide();
    viewHomeMenu.show();
  }
  
  viewMain.hide();
};

Pebble.addEventListener("ready", function() {
  checkReady();
});

viewSetupCard.on('select', function(e) {
  console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
  console.log('The item is titled "' + e.item.title + '"');
});

/*
 * Error Handlers
 */