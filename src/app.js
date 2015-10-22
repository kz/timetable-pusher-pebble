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



/*
 * Error Handlers
 */