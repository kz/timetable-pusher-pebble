/******************************************
* Libraries
*******************************************/
var ajax = require('./lib/ajax');

/******************************************
* Global Variables
*******************************************/
var BASE_URL = 'https://timetablepush.me/';
var API_BASE_URL = BASE_URL + 'api/v1/';
var CONFIGURATION_URL = BASE_URL + 'app/config';
var TIMELINE_TOKEN;
var API_KEY;

var offsetFromUTC = 0;
var timetables = [];

/*
* SELECTED_WEEK = 0 is for current week; SELECTED_WEEK = 1 is for next week
* SELECTED_DAY = 7 means that pins are being pushed to the whole week
*/
var dict = {
    'TYPE': '',
    'DAY_OF_WEEK': 0,
    'TIMETABLE_NAMES': '',
    'SELECTED_TIMETABLE': 0,
    'SELECTED_WEEK': 0,
    'SELECTED_DAY': 0
};

/******************************************
* App Message Functions
*******************************************/
function sendAppMessage(outgoingDict) {
    Pebble.sendAppMessage(outgoingDict, function() {
        console.log('Message sent successfully: ' + JSON.stringify(dict));
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
    dict.TYPE = "LIST_TIMETABLES";
    
    // Populate list of timetable names
    var timetableNames = [];
    for (var timetable in timetables) {
        timetableNames.push(timetable.name);
    }
    dict.TIMETABLE_NAMES = timetableNames;
    
    var outgoingDict = {
        'TYPE': dict.TYPE,
        'DAY_OF_WEEK': dict.DAY_OF_WEEK,
        'TIMETABLE_NAMES': dict.TIMETABLE_NAMES
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
    if (typeof timetables[dict.SELECTED_TIMETABLE] === 'undefined' ||
        (dict.SELECTED_WEEK !== 0 && dict.SELECTED_WEEK !== 1) || 
        dict.SELECTED_DAY < 0 || dict.SELECTED_DAY > 7) {
        sendErrorAppMessage();
    }

    var selectedTimetableId = timetables[dict.SELECTED_TIMETABLE].id;
    var selectedWeek = dict.SELECTED_WEEK === 0 ? 'current' : 'next';
    var selectedDay = dict.SELECTED_DAY < 7 ? dict.SELECTED_DAY : null;

    sendPins(selectedTimetableId,
             selectedWeek,
             selectedDay);
}

/******************************************
* API Functions
*******************************************/
function handleAjaxError(error, status, request) {
    console.log(JSON.stringify(error));
    console.log(JSON.stringify(status));
    console.log(JSON.stringify(request));

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
                        title: timetable.name
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

function sendPins(timetableId, week, day) {
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

/******************************************
* Configuration Functions
*******************************************/

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
    if (typeof(storedApiKey) === 'undefined') {
        sendSetupRequiredAppMessage();
    } else if (storedApiKey === '') {
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
    } else {
        dict.TYPE = String(receivedDict.TYPE);
        if (receivedDict.SELECTED_TIMETABLE) {
            dict.SELECTED_TIMETABLE = Number(receivedDict.SELECTED_TIMETABLE);
        }
        if (receivedDict.SELECTED_WEEK) {
            dict.SELECTED_WEEK = Number(receivedDict.SELECTED_WEEK);
        }
        if (receivedDict.SELECTED_DAY) {
            dict.SELECTED_DAY = Number(receivedDict.SELECTED_DAY);
        }
    }

    if (dict.TYPE === 'SEND_PINS') {
        handleSendPinsAppMessage();
    } else {
        sendErrorAppMessage();
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
    } else if(configuration.apiKey === '') {
        sendSetupRequiredAppMessage();
    } else {
        // Save to localStorage
        API_KEY = configuration.apiKey;
        localStorage.setItem("apiKey", API_KEY);
        getTimetables();
    }
});