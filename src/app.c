#include <pebble.h>
#include "windows/win_main.h"
#include "windows/win_setup.h"
#include "windows/win_loading.h"
#include "windows/win_tutorial.h"

#define API_KEY 0
#define DAYS_IN_CURRENT_WEEK 1

static void init(void);
static void deinit(void);

int main(void) {
    init();
    app_event_loop();
    deinit();
}

// -------------------------------------------------------------- //

static void init() {
    win_loading_create();
//     app_message_open(64, 64);
//     if (!persist_exists(API_KEY)) {
//         APP_LOG(APP_LOG_LEVEL_INFO, "API KEY DOES NOT EXIST");
//         window_stack_pop_all(true);
//         win_setup_create();
//     } else {
//         window_stack_pop_all(true);
//         win_main_create();
//     }
}

static void deinit() {
    // Destroy main window
    win_main_destroy();
}