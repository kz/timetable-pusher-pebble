var UI = require('ui');
var Vector2 = require('vector2');
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
    autoSave: true,
  },
  function(e) {
    
  },
  function(e) {
    console.log('Configuration closed');
  }
);

// Listen for configuration complete
Settings.config(
  { url: CONFIGURATION_URL },
  function(e) {
    console.log('Configuration closed');
    Settings.option('apiKey', e.apiKey);
  }
);

/*
 * Views
 */

var createViewSetupCard = new UI.Card({
  title: 'Setup Required',
  body: 'Open this app\'s configuration page on the Pebble watchapp.'
});

var createViewHomeMenu = new UI.Menu({
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
Pebble.addEventListener("ready", function() {
  if (typeof Settings.option('apiKey') === 'undefined') {
    var viewSetupCard = createViewSetupCard;
    viewSetupCard.show();
  } else {
    var viewHomeMenu = createViewHomeMenu;
    viewHomeMenu.show();
  }
  
  viewMain.hide();
});

/*
 * Error Handlers
 */