#include <pebble.h>
#include "windows/win_main.h"

static void init(void);
static void deinit(void);

// -------------------------------------------------------------- //

static void init() {
    // Create main window
    win_main_create();
}

static void deinit() {
    // Destroy main window
    win_main_destroy();
}

int main(void) {
    init();
    app_event_loop();
    deinit();
}