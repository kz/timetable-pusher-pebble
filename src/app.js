var UI = require('ui');
var Settings = require('settings');
var ajax = require('ajax');

var BASE_URL = 'https://timetablepush.me/';
var API_BASE_URL = BASE_URL + 'api/v1/';
var CONFIGURATION_URL = BASE_URL + 'app/config';
var API_KEY;

var timelines = [];

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
    body: 'Your API token is missing or required. \n\nOpen this app\'s configuration page on the Pebble watchapp and enter your API token.'
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
    body: 'An unknown error occured.'
});


var viewHomeMenu = new UI.Menu({
    sections: [
        {
            title: 'Timetable Pusher'
        },
        {
            title: 'Select Timeline',
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
            title: 'Timetable Pusher'
        },
        {
            title: 'Add entries for',
            items: [
                {
                    title: 'Current week'
                },
                {
                    title: 'Next week'
                }
            ]
        }
    ]
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
        API_KEY = Settings.option('apiKey');
        getTimelines();
    }

    viewMain.hide();
};

Pebble.addEventListener("ready", function () {
    checkReady();
});

/*
 * View Handlers
 */

viewHomeMenu.on('select', function (e) {
    if (e.item.title === 'Current week') {

    } else if (e.item.title === 'Next week') {

    } else if (e.item.title === 'Delete all pins') {

    }
});

/*
 * Internet-dependent functions
 */

function getTimelines() {
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
                for (var i = 0; i < Object.keys(data).length; i++) {
                    timelines.push({
                        id: data[i].id,
                        title: data[i].name
                    });
                }
                for (i = 0; i < Object.keys(timelines).length; i++) {
                    viewHomeMenu.item(1, i, {title: timelines[i].title});
                }
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
}