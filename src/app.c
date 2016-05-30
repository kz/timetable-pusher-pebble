#include <pebble.h>
#include "windows/win_main.h"
#include "windows/win_setup.h"
#include "windows/win_loading.h"
#include "windows/win_tutorial.h"
#include "windows/win_no_bt_connection.h"
#include "windows/win_error.h"

static void init(void);
static void deinit(void);
static void inbox_received_handler(DictionaryIterator *iter, void *context);

int main(void) {
    init();
    app_event_loop();
    deinit();
}

// -------------------------------------------------------------- //

/*
* Sends the following types:
* SEND_PINS
* Receives the following types:
* SETUP_REQUIRED, LIST_TIMETABLES, ERROR, SUCCESS
*/
static void inbox_received_handler(DictionaryIterator *iter, void *context) {
    
}

static void init() {
    win_loading_create();
    app_message_register_inbox_received(inbox_received_handler);
    app_message_open(64, 64);
}

static void deinit() {
    // Destroy main window
    win_main_destroy();
}