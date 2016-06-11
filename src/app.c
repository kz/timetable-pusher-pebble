#include <pebble.h>
#include "windows/win_main.h"
#include "windows/win_setup.h"
#include "windows/win_loading.h"
#include "windows/win_tutorial.h"
#include "windows/win_no_bt_connection.h"
#include "windows/win_error.h"

#define BASE_TIMETABLE_KEY 100

static void init(void);
static void deinit(void);
static void inbox_received_handler(DictionaryIterator *iter, void *context);

int main(void) {
    init();
    app_event_loop();
    deinit();
}

// -------------------------------------------------------------- //

static void inbox_received_handler(DictionaryIterator *iter, void *context) {
    Tuple *type_tuple = dict_find(iter, MESSAGE_KEY_TYPE);
    if (!type_tuple) {
        window_stack_pop_all(false);
        win_error_create();
        return;
    }
    char *type = type_tuple->value->cstring;

    // TODO: REMOVE DEBUG_
    if (strcmp(type, "DEBUG_ERROR") == 0) {
        window_stack_pop_all(false);
        win_error_create();
        return;
    } else if (strcmp(type, "LIST_TIMETABLES") == 0) {

        Tuple *day_of_week_tuple = dict_find(iter, MESSAGE_KEY_DAY_OF_WEEK);
        Tuple *timetable_count_tuple = dict_find(iter, MESSAGE_KEY_TIMETABLE_COUNT);
        if (!day_of_week_tuple || !timetable_count_tuple) {
            window_stack_pop_all(false);
            win_error_create();
            return;
        }
        int day_of_week = day_of_week_tuple->value->int32;
        int timetable_count = timetable_count_tuple->value->int32;

        // Loop through the COUNT of timetables
        for(int i = 0; i < timetable_count; i++) {
            // Each timetable is stored from message key 100 upwards: 100, 102, 103, etc.
            Tuple *timetable_name_tuple = dict_find(iter, BASE_TIMETABLE_KEY + i);
            if(!timetable_name_tuple) {
                window_stack_pop_all(false);
                win_error_create();
                return;
            }
            
            // Retrieve the name of the timetable
            
            
        }



    } else if (strcmp(type, "SETUP_REQUIRED") == 0) {
        window_stack_pop_all(false);
        win_setup_create();
    } else if (strcmp(type, "LOADING") == 0) {    
        window_stack_pop_all(false);
        win_loading_create();
    } else if (strcmp(type, "SUCCESS") == 0) {
        window_stack_pop_all(false);
        // win_success_create();
    } else {
        //         window_stack_pop_all(false);
        //         win_error_create();
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