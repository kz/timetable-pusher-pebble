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
    id: -1,
    title: 'undefined'
};

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
        },
        function (e) {
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

var viewLoadingCard = new UI.Card({
    title: 'Loading...',
    body: 'If this is still loading after some time, ensure you have a valid Internet connection and restart the app.'
});

var viewErrorCard = new UI.Card({
    title: 'Error',
    body: 'An unknown error occured. Restart the app and try again.'
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
            items: [
                { title: 'Loading...' }
            ]
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
            title: ''
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

// Check whether the API key is set
function checkReady() {
    if (typeof Settings.option('apiKey') === 'undefined') {
        viewSetupCard.show();
    } else {
        viewSetupCard.hide();
        viewHomeMenu.show();
        API_KEY = Settings.option('apiKey');
        getTimetables();
    }
}

Pebble.getTimelineToken(
    function (token) {
        TIMELINE_TOKEN = token;
    },
    function (error) {
        console.log('Error getting timeline token: ' + error);
    }
);

checkReady();

/*
 * View Handlers
 */

viewHomeMenu.on('select', function (e) {
    console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
    console.log('The item is titled "' + e.item.title + '"');
    
    if (e.sectionIndex === 2 && e.itemIndex === 0) {
        deletePins();
    } else if (e.sectionIndex === 1) {
        selectedTimetable.id = timetables[e.itemIndex].id;
        selectedTimetable.title = timetables[e.itemIndex].title;
        viewWeekMenu.section(0, { title: selectedTimetable.title });
        viewWeekMenu.show();
    }
});

/*
 * Internet-dependent functions
 */

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
                data.forEach(function(timetable) {
                    timetables.push({
                        id: timetable.id,
                        title: timetable.name
                    });
                    viewHomeMenu.item(1, timetables.length - 1, {title: timetable.name});
                });
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
    console.log(JSON.stringify(error));
    console.log(JSON.stringify(status));
    console.log(JSON.stringify(request));

    if (status === 401) {
        viewSetupCard.show();
    } else {
        viewErrorCard.show();
    }
}