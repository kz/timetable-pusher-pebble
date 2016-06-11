/******************************************
* Libraries
*******************************************/
var ajax = require('./lib/ajax');

/******************************************
* Global Variables
*******************************************/
// API
var BASE_URL = 'https://timetablepush.me/';
var API_BASE_URL = BASE_URL + 'api/v1/';
var CONFIGURATION_URL = BASE_URL + 'app/config';
var TIMELINE_TOKEN;
var API_KEY;

// C SDK
var BASE_TIMETABLE_KEY = 100;
var TYPE;
var DAY_OF_WEEK;
var SELECTED_TIMETABLE;
var SELECTED_WEEK;
var SELECTED_DAY;

// Data
var offsetFromUTC = 0;
var timetables = [];

/*
* Possible AppMessage keys:
* 'TYPE': '',
* 'DAY_OF_WEEK': 0,
* 'SELECTED_TIMETABLE': 0,
* 'SELECTED_WEEK': 0,
* 'SELECTED_DAY': 0,
* 'TIMETABLE_COUNT': 0
* BASE_TIMETABLE_KEY + n : ''
*
* SELECTED_WEEK = 0 is for current week; SELECTED_WEEK = 1 is for next week
* SELECTED_DAY = 7 means that pins are being pushed to the whole week
*/


/******************************************
* App Message Functions
*******************************************/
function sendAppMessage(outgoingDict) {
    Pebble.sendAppMessage(outgoingDict, function() {
        console.log('Message sent successfully: ' + JSON.stringify(outgoingDict));
    }, function(e) {
        console.log('Message failed: ' + JSON.stringify(e));
    });
}

function sendSetupRequiredAppMessage() {
    var outgoingDict = {
        'TYPE': 'SETUP_REQUIRED',
    };
    sendAppMessage(outgoingDict);
}

function sendListTimetablesAppMessage() {
    var outgoingDict = {
        'TYPE': 'LIST_TIMETABLES',
        'DAY_OF_WEEK': DAY_OF_WEEK,
        'TIMETABLE_COUNT': timetables.length,
    };
    
    // Populate list of timetable names
    for(var i = 0; i < timetables.length; i++) {
        outgoingDict[BASE_TIMETABLE_KEY + i] = timetables[i].name;
    }

    console.log(outgoingDict);
    
    sendAppMessage(outgoingDict);
}

function sendLoadingAppMessage() {
    var outgoingDict = {
        'TYPE': 'LOADING',
    };
    sendAppMessage(outgoingDict);
}

function sendErrorAppMessage() {
    var outgoingDict = {
        'TYPE': 'ERROR',
    };
    sendAppMessage(outgoingDict);
}

function sendSuccessAppMessage() {
    var outgoingDict = {
        'TYPE': 'SUCCESS',
    };
    sendAppMessage(outgoingDict);
}

function handleSendPinsAppMessage() {
    // Validation
    if (typeof timetables[SELECTED_TIMETABLE] === 'undefined' ||
        (SELECTED_WEEK !== 0 && SELECTED_WEEK !== 1) || 
        SELECTED_DAY < 0 || SELECTED_DAY > 7) {
        sendErrorAppMessage();
    }

    var selectedTimetableId = timetables[SELECTED_TIMETABLE].id;
    var selectedWeek = SELECTED_WEEK === 0 ? 'current' : 'next';
    var selectedDay = SELECTED_DAY < 7 ? SELECTED_DAY : null;

    sendPinsCreate(selectedTimetableId,
                   selectedWeek,
                   selectedDay);
}

function handleDeletePinsAppMessage() {
    sendPinsDelete();
}

/******************************************
* API Functions
*******************************************/
function handleAjaxError(error, status, request) {
    console.log('AJAX error occured:');
    console.log('Error: ' + JSON.stringify(error));
    console.log('Status: ' + JSON.stringify(status));
    console.log('Request: ' + JSON.stringify(request));

    if (status === 401) {
        sendSetupRequiredAppMessage();
    } else {
        sendErrorAppMessage();
    }
}

function getTimetables() {
    ajax(
        {
            url: API_BASE_URL + 'timetable',
            type: 'json',
            method: 'GET',
            headers: {
                Authorization: 'Bearer: ' + API_KEY
            }
        },
        function (data, status, request) {
            if (status === 200) {
                data.forEach(function(timetable) {
                    timetables.push({
                        id: timetable.id,
                        name: timetable.name
                    });
                });
                sendListTimetablesAppMessage();
            } else {
                handleAjaxError(data, status, request);
            }
        },
        function (error, status, request) {
            handleAjaxError(error, status, request);
        }
    );
}

function sendPinsCreate(timetableId, week, day) {
    var data = {
        timetable_id: timetableId,
        timeline_token: TIMELINE_TOKEN,
        offset_from_utc: offsetFromUTC,
        week: week
    };

    if (day !== null) {
        data.day = day;
    }

    ajax(
        {
            url: API_BASE_URL + 'job/create',
            method: 'POST',
            headers: {
                Authorization: 'Bearer: ' + API_KEY
            },
            data: data
        },
        function (data, status, request) {
            if (status === 200) {
                sendSuccessAppMessage();
            } else {
                handleAjaxError(data, status, request);
            }
        },
        function (error, status, request) {
            handleAjaxError(error, status, request);
        }
    );
}

function sendPinsDelete() {
    ajax(
        {
            url: API_BASE_URL + 'job',
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer: ' + API_KEY
            },
            data: {
                timeline_token: TIMELINE_TOKEN
            }
        },
        function (data, status, request) {
            if (status === 200) {
                sendSuccessAppMessage();
            } else {
                handleAjaxError(data, status, request);
            }
        },
        function (error, status, request) {
            handleAjaxError(error, status, request);
        }
    );
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
    DAY_OF_WEEK = dayOfWeek;
    console.log('Day of week (0-6): ' + DAY_OF_WEEK);

    // Get timeline token
    Pebble.getTimelineToken(
        function (token) {
            TIMELINE_TOKEN = token;
            console.log('Got timeline token: ' + TIMELINE_TOKEN);
        },
        function (error) {
            console.log('Error getting timeline token: ' + error);
            sendErrorAppMessage();
        }
    );

    // Ensure that the API key is available
    var storedApiKey = localStorage.getItem("apiKey");
    console.log('Stored API key: ' + storedApiKey);
    if (typeof(storedApiKey) === 'undefined') {
        sendSetupRequiredAppMessage();
    } else if (storedApiKey === '' || storedApiKey === null) {
        sendSetupRequiredAppMessage();
    } else {
        API_KEY = storedApiKey;
        getTimetables();
    }
});

Pebble.addEventListener('appmessage', function(e) {
    // Get the dictionary from the message
    var receivedDict = e.payload;
    console.log('Received AppMessage: ' + JSON.stringify(receivedDict));

    if(!receivedDict.TYPE) {
        sendErrorAppMessage();
        return;
    }

    TYPE = String(receivedDict.TYPE);
    
    if (TYPE === 'SEND_PINS') {
        if (receivedDict.SELECTED_TIMETABLE) {
            SELECTED_TIMETABLE = Number(receivedDict.SELECTED_TIMETABLE);
        }
        if (receivedDict.SELECTED_WEEK) {
            SELECTED_WEEK = Number(receivedDict.SELECTED_WEEK);
        }
        if (receivedDict.SELECTED_DAY) {
            SELECTED_DAY = Number(receivedDict.SELECTED_DAY);
        }
        handleSendPinsAppMessage();
    } else if (TYPE === 'DELETE_PINS') {
        handleDeletePinsAppMessage();
    } else {
        sendErrorAppMessage();
        return;
    }
});

Pebble.addEventListener("showConfiguration", function(e) {
    Pebble.openURL(CONFIGURATION_URL);
});

Pebble.addEventListener("webviewclosed", function(e) {
    var configuration = JSON.parse(decodeURIComponent(e.response));
    console.log("Configuration window returned: " + JSON.stringify(configuration));

    if (typeof(configuration.apiKey) === undefined) {
        sendSetupRequiredAppMessage();
    } else if(configuration.apiKey === '' || configuration.apiKey === null) {
        sendSetupRequiredAppMessage();
    } else {
        // Save to localStorage
        API_KEY = configuration.apiKey;
        localStorage.setItem("apiKey", API_KEY);
        console.log('API key stored in localStorage');
        sendLoadingAppMessage();
        getTimetables();
    }
});