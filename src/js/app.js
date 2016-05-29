/******************************************
* Global Variables
*******************************************/
var offsetFromUTC = 0;
var apiKey = '';
var timetables = [];

var dict = {
    'TYPE' : '',
    'DAY_OF_WEEK': 0,
    'TIMETABLE_NAMES': '',
    'SELECTED_TIMETABLE': 0,
    'SELECTED_WEEK': 0,
    'SELECTED_DAY': 0
};

/******************************************
* App Message Handlers
*******************************************/
function sendSetupRequiredAppMessage() {

}

/******************************************
* API Functions
*******************************************/
function getTimetables() {
    
}

function setPins(timetableId, week, day) {
    
}

/******************************************
* Pebble Events
*******************************************/
Pebble.addEventListener('ready', function() {
    // PebbleKit JS is ready!
    console.log('PebbleKit JS ready');

    // Get the UTC offset
    offsetFromUTC = 0 - (new Date()).getTimezoneOffset();
    console.log('UTC offset: ' + offsetFromUTC);

    // Get the day of the week
    var d = new Date();
    var dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
    dict.DAY_OF_WEEK = dayOfWeek;
    console.log('Day of week (0-6): ' + dayOfWeek);

    // Ensure that the API key is available
    var storedApiKey = localStorage.getItem("apiKey");
    if (typeof(storedApiKey) === 'undefined' || storedApiKey === '') {
        sendSetupRequiredAppMessage();
    } else {
        apiKey = storedApiKey;
        getTimetables();
    }
});

