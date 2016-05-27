function getDaysInCurrentWeek() {
    var DAYS_OF_WEEK = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ];
    
    var d = new Date();
    var dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
    
    var days = [];
    for (var i = dayOfWeek; i < 7; i++) {
        days.push(DAYS_OF_WEEK[i]);
    }
    
    return days;
}

Pebble.addEventListener('ready', function() {
    // PebbleKit JS is ready!
    console.log('PebbleKit JS ready!');
    
    // Get the UTC offset
    var offsetFromUTC = 0 - (new Date()).getTimezoneOffset();
    console.log(offsetFromUTC);

    // Get days in current week
    var daysInCurrentWeek = getDaysInCurrentWeek();
    
    // Get user's list of timetables
    
    // Send AppMessage
    var dict = {
        'daysInCurrentWeek' : daysInCurrentWeek
    };
    Pebble.sendAppMessage(dict, function() {
      console.log('Message sent successfully: ' + JSON.stringify(dict));
    }, function(e) {
      console.log('Message failed: ' + JSON.stringify(e));
    });
    
});

