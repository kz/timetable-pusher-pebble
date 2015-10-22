var UI = require('ui');
var Settings = require('settings');
var ajax = require('ajax');

var BASE_URL = 'https://timetablepush.me/';
var API_BASE_URL = BASE_URL + 'api/v1/';
var CONFIGURATION_URL = BASE_URL + 'app/config';
var TIMELINE_TOKEN;
var API_KEY;

var timetables = [];
var selectedTimetable = {
    id: 0,
    title: 'Undefined'
};
var selectedWeek = 'Undefined';
var selectedDay = -1;

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
        function (e) {
            viewConfigurationCard.show();
        },
        function (e) {
            viewConfigurationCard.hide();
            checkReady();
        }
);

// Listen for configuration complete
Settings.config(
        {
            url: CONFIGURATION_URL,
            autoSave: true
        },
        function (e) {
            viewConfigurationCard.hide();
            checkReady();
        }
);

/*
 * Views
 */

var viewSetupCard = new UI.Card({
    title: 'Setup Required',
    body: 'Your API token is missing or required. \nOpen this app\'s configuration page on the Pebble phone app and enter your API token.',
    scrollable: true
});

var viewConfigurationCard = new UI.Card({
    title: 'Configuration Opened',
    body: 'You must close the configuration window on your phone before you can use the watchapp.'
});

var viewLoadingCard = new UI.Card({
    title: 'Loading...',
    body: 'If this is still loading after some time, ensure you have a valid Internet connection and restart the app.'
});

var viewErrorCard = new UI.Card({
    title: 'Error',
    body: 'An unknown error occured. Restart the app and try again.'
});

var viewCreatedCard = new UI.Card({
    title: 'Pins Created',
    body: 'Your timeline pins have been created. It may take up to 15 minutes for the changes to take effect.'
});

var viewDeletedCard = new UI.Card({
    title: 'Pins Deleted',
    body: 'All pins have been deleted. It may take up to 15 minutes for the changes to to take effect.'
});

var viewHomeMenu = new UI.Menu({
    sections: [
        {
            title: 'Timetable Pusher'
        },
        {
            title: 'Select Timetable',
            items: []
        },
        {
            title: 'Advanced',
            items: [
                {
                    title: 'Delete all pins'
                }
            ]
        }
    ]
});

var viewWeekMenu = new UI.Menu({
    sections: [
        {
            title: selectedTimetable.title
        },
        {
            title: 'Add entries to',
            items: [
                {
                    title: 'This week'
                },
                {
                    title: 'Next week'
                }
            ]
        }
    ]
});

var viewDayMenu = new UI.Menu({
    section: [
        {
            title: 'Push pins for:',
            items: [
                {
                    title: 'Whole week'
                }
            ]
        },
        {
            title: 'Specific day:',
            items: []
        }
    ]
});

/*
 * App Ready
 */

// Check whether the API key is set
function checkReady() {
    if (typeof Settings.option('apiKey') === 'undefined') {
        viewSetupCard.show();
    } else {
        viewSetupCard.hide();
        API_KEY = Settings.option('apiKey');
        getTimetables();
    }

    viewMain.hide();
};

Pebble.addEventListener("ready", function () {
    Pebble.getTimelineToken(
            function (token) {
                TIMELINE_TOKEN = token;
            },
            function (error) {
                console.log('Error getting timeline token: ' + error);
            }
    );

    /*
     * View Handlers
     */

    viewHomeMenu.on('longClick', 'click', function (e) {
        if (e.item.title === 'Delete all pins') {
            deletePins();
        } else if(e.sectionIndex === 1) {
            selectedTimetable = timetables[e.itemIndex];
            viewWeekMenu.show();
        }
    });

    viewWeekMenu.on('longClick', 'click', function(e) {
        if (e.sectionIndex === 1) {
            if (e.item.index === 0) {
                selectedWeek = 'current';
            } else {
                selectedWeek = 'next';
            }
            viewDayMenu.show();
        }
    });

    checkReady();
});

/*
 * Internet-dependent functions
 */

function getTimetables() {
    viewLoadingCard.show();

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
                viewHomeMenu.show();
                viewLoadingCard.hide();

                timetables = [];
                for (var i = 0; i < Object.keys(data).length; i++) {
                    timetables.push({
                        id: data[i].id,
                        title: data[i].name
                    });
                }
                for (i = 0; i < Object.keys(timetables).length; i++) {
                    viewHomeMenu.item(1, i, {title: timetables[i].title});
                }
            },
            function (error, status, request) {
                handleError(error, status, request);
            }
    );
}

function createPins(timetableId, week, day) {
    viewLoadingCard.show();

    var offsetFromUTC = 0 - (new Date()).getTimezoneOffset();

    ajax(
            {
                url: API_BASE_URL + 'job',
                method: 'POST',
                headers: {
                    Authorization: 'Bearer: ' + API_KEY
                },
                data: {
                    timetable_id: timetableId,
                    timeline_token: TIMELINE_TOKEN,
                    offset_from_utc: offsetFromUTC,
                    week: week,
                    day: day
                }
            },
            function (data, status, request) {
                viewCreatedCard.show();
                viewLoadingCard.hide();
            },
            function (error, status, request) {
                handleError(error, status, request);
            }
    );
}

function deletePins() {
    viewLoadingCard.show();

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
                viewDeletedCard.show();
                viewLoadingCard.hide();
            },
            function (error, status, request) {
                handleError(error, status, request);
            }
    );
}

/*
 * Error Handlers
 */

function handleError(error, status, request) {
    if (status === 401) {
        viewSetupCard.show();
    } else {
        console.log(error, status, request);
        viewErrorCard.show();
    }

    // Hide all other cards
    viewLoadingCard.hide();
    viewHomeMenu.hide();
    viewWeekMenu.hide();
    viewCreatedCard.hide();
    viewDeletedCard.hide();
    viewDayMenu.hide();
}