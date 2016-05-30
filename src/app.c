#include <pebble.h>
#include "windows/win_main.h"
#include "windows/win_setup.h"
#include "windows/win_loading.h"
#include "windows/win_tutorial.h"
#include "windows/win_no_bt_connection.h"
#include "windows/win_error.h"

#define KEY_TYPE 0
#define KEY_DAY_OF_WEEK 1
#define KEY_TIMETABLE_NAMES 2
#define KEY_SELECTED_TIMETABLE 3
#define KEY_SELECTED_WEEK 4
#define KEY_SELECTED_DAY 5

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
    Tuple *type_tuple = dict_find(iter, KEY_TYPE);
    if (!type_tuple) {
        win_error_create();
        window_stack_pop_all(false);
    }
    char *type = type_tuple->value->cstring;
    
    if (strcmp(type, "ERROR") == 0) {
        
    }
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