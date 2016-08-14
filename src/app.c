#include <pebble.h>
#include "windows/win_main.h"
#include "windows/win_setup.h"
#include "windows/win_loading.h"
#include "windows/win_tutorial.h"
#include "windows/win_no_bt_connection.h"
#include "windows/win_error.h"
#include "windows/win_success.h"
#include "windows/win_menu_week.h"
#include "windows/win_menu_day.h"

#define BASE_TIMETABLE_KEY 100

int DAY_OF_WEEK;

static void init(void);
static void deinit(void);
static void inbox_received_handler(DictionaryIterator *iter, void *context);

int main(void) {
    init();
    app_event_loop();
    deinit();
}

void push_pins(int selected_timetable, int selected_week, int selected_day) {
    // Show loading screen
    win_loading_create();

    // Declare the dictionary's iterator
    DictionaryIterator *out_iter;
    // Prepare the outbox buffer for this message
    AppMessageResult result = app_message_outbox_begin(&out_iter);

    if(result != APP_MSG_OK) {
        // The outbox cannot be used right now
        win_loading_destroy();
        win_error_create();
        APP_LOG(APP_LOG_LEVEL_ERROR, "Error preparing the outbox: %d", (int) result);
        return;
    }

    // Construct the message
    dict_write_cstring(out_iter, MESSAGE_KEY_TYPE, "SEND_PINS");
    dict_write_int(out_iter, MESSAGE_KEY_SELECTED_TIMETABLE, &selected_timetable, sizeof(int), true);
    dict_write_int(out_iter, MESSAGE_KEY_SELECTED_WEEK, &selected_week, sizeof(int), true);
    dict_write_int(out_iter, MESSAGE_KEY_SELECTED_DAY, &selected_day, sizeof(int), true);

    // Send the message
    result = app_message_outbox_send();

    // Check the result
    if(result != APP_MSG_OK) {
        APP_LOG(APP_LOG_LEVEL_ERROR, "Error sending the outbox: %d", (int)result);
        win_loading_destroy();
        win_error_create();
        return;
    }

    window_stack_remove(get_menu_week_window(), false);
    window_stack_remove(get_menu_day_window(), false);
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Message sent to outbox");
}

void delete_pins(void) {
    // Show loading screen
    win_loading_create();

    // Declare the dictionary's iterator
    DictionaryIterator *out_iter;
    // Prepare the outbox buffer for this message
    AppMessageResult result = app_message_outbox_begin(&out_iter);

    if(result != APP_MSG_OK) {
        // The outbox cannot be used right now
        win_loading_destroy();
        win_error_create();
        APP_LOG(APP_LOG_LEVEL_ERROR, "Error preparing the outbox: %d", (int)result);
        return;
    }

    // Construct the message
    dict_write_cstring(out_iter, MESSAGE_KEY_TYPE, "DELETE_PINS");

    // Send the message
    result = app_message_outbox_send();

    // Check the result
    if(result != APP_MSG_OK) {
        APP_LOG(APP_LOG_LEVEL_ERROR, "Error sending the outbox: %d", (int)result);
        win_loading_destroy();
        win_error_create();
        return;
    }

    APP_LOG(APP_LOG_LEVEL_DEBUG, "Message sent to outbox");
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

    if (strcmp(type, "ERROR") == 0) {
        window_stack_pop_all(false);
        win_error_create();
        return;
    } else if (strcmp(type, "LIST_TIMETABLES") == 0) {

        Tuple *day_of_week_tuple = dict_find(iter, MESSAGE_KEY_DAY_OF_WEEK);
        Tuple *timetable_count_tuple = dict_find(iter, MESSAGE_KEY_TIMETABLE_COUNT);
        if (!day_of_week_tuple || !timetable_count_tuple) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "%s", "Day of week/timetable count not found.");
            window_stack_pop_all(false);
            win_error_create();
            return;
        }

        DAY_OF_WEEK = day_of_week_tuple->value->int32;
        int timetable_count = timetable_count_tuple->value->int32;

        // Create an array of timetable names
        char *timetable_names[timetable_count];

        for(int i = 0; i < timetable_count; i++) {
            APP_LOG(APP_LOG_LEVEL_DEBUG, "%s%d", "Attempting to retrieve key: ", BASE_TIMETABLE_KEY + i);
            Tuple *timetable_name_tuple = dict_find(iter, BASE_TIMETABLE_KEY + i);
            if(!timetable_name_tuple) {
                APP_LOG(APP_LOG_LEVEL_DEBUG, "%s%d", "Timetable tuple not found for index: ", i);
                window_stack_pop_all(false);
                win_error_create();
                return;
            }
            // Retrieve the name of the timetable
            char *timetable_name = timetable_name_tuple->value->cstring;
            timetable_names[i] = timetable_name;
        }

        win_main_destroy();
        window_stack_pop_all(true);
        win_main_create(timetable_count, timetable_names);

    } else if (strcmp(type, "SETUP_REQUIRED") == 0) {
        window_stack_pop_all(false);
        win_setup_create();
    } else if (strcmp(type, "LOADING") == 0) {
        window_stack_pop_all(false);
        win_loading_create();
    } else if (strcmp(type, "SUCCESS") == 0) {
        if(window_stack_contains_window(get_loading_window())) {
            window_stack_remove(get_loading_window(), false);
        }
        win_success_create();
    } else {
        window_stack_pop_all(false);
        win_error_create();
    }
}

static void init() {
    win_loading_create();
    app_message_register_inbox_received(inbox_received_handler);
    app_message_open(app_message_inbox_size_maximum(), 128);
}

static void deinit() {
    // Destroy main window
    win_main_destroy();
}