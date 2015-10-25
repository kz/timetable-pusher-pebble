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
var selectedWeek = 'undefined';
var selectedDay = -1;

var DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];
    
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

var viewTimelineErrorCard = new UI.Card({
    title: 'Error',
    body: 'Your timeline token could not be retrieved. Restart the app and try again.'
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

var viewDayMenu = new UI.Menu({
    sections: [
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
        checkReady();
    },
    function (error) {
        console.log('Error getting timeline token: ' + error);
        viewTimelineErrorCard.show();
    }
);

/*
 * View Handlers
 */

viewHomeMenu.on('select', function (e) {
    if (e.sectionIndex === 2 && e.itemIndex === 0) {
        deletePins();
    } else if (e.sectionIndex === 1) {
        selectedTimetable.id = timetables[e.itemIndex].id;
        selectedTimetable.title = timetables[e.itemIndex].title;
        viewWeekMenu.section(0, { title: selectedTimetable.title });
        viewWeekMenu.show();
    }
});

viewWeekMenu.on('select', function (e) {
    if (e.sectionIndex === 1) {
        if (e.itemIndex === 0) {
            selectedWeek = 'current';
        } else {
            selectedWeek = 'next';
        }

        var days = [];
        if (selectedWeek === 'current') {
            var d = new Date();
            var dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;

            for (var i = dayOfWeek; i < 7; i++) {
                days.push({
                    title: DAYS_OF_WEEK[i]
                });
            }
        } else {
            for (var i = 0; i < 7; i++) {
                days.push({
                    title: DAYS_OF_WEEK[i]
                });
            }
        }
        viewDayMenu.items(1, days);
        viewDayMenu.show();
    }
});

viewDayMenu.on('select', function (e) {
    if (e.item.title == 'Whole week') {
        createPins(selectedTimetable.id, selectedWeek, null);
    } else if (e.sectionIndex === 1) {
        if (e.item.title === 'Monday') {
            selectedDay = 0;
        } else if (e.item.title === 'Tuesday') {
            selectedDay = 1;
        } else if (e.item.title === 'Wednesday') {
            selectedDay = 2;
        } else if (e.item.title === 'Thursday') {
            selectedDay = 3;
        } else if (e.item.title === 'Friday') {
            selectedDay = 4;
        } else if (e.item.title === 'Saturday') {
            selectedDay = 5;
        } else if (e.item.title === 'Sunday') {
            selectedDay = 6;
        }

        createPins(selectedTimetable.id, selectedWeek, selectedDay);
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

function createPins(timetableId, week, day) {
    viewLoadingCard.show();

    var offsetFromUTC = 0 - (new Date()).getTimezoneOffset();

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
                viewCreatedCard.show();
                viewLoadingCard.hide();
            },
            function (error, status, request) {
                viewLoadingCard.hide();
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
                viewLoadingCard.hide();
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