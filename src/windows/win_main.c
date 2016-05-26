#include <pebble.h>

#define NUM_MENU_SECTIONS 1
#define NUM_FIRST_SECTION_ITEMS 1

static Window *s_main_window;
static SimpleMenuLayer *s_simple_menu_layer;
static SimpleMenuSection s_menu_sections[NUM_MENU_SECTIONS];
static SimpleMenuItem s_first_section_items[NUM_FIRST_SECTION_ITEMS];

static void window_load(Window* window);
static void window_unload(Window* window);

void win_main_create(void) {
    s_main_window = window_create();
    window_set_window_handlers(s_main_window, (WindowHandlers) {
        .load = window_load,
        .unload = window_unload,
    });
    window_stack_push(s_main_window, true);
}

void win_main_destroy(void) {
    window_destroy(s_main_window);
}

// -------------------------------------------------------------- //

static void window_load(Window *window) {
    // Create window's child layers

    // Create the items under the main section
    s_first_section_items[0] = (SimpleMenuItem) {
        .title = "Test",
    };

    // Create the main section
    s_menu_sections[0] = (SimpleMenuSection) {
        .num_items = NUM_FIRST_SECTION_ITEMS,
        .items = s_first_section_items,
    };  
    // Create the simple menu layer under the root window layer
    Layer *window_layer = window_get_root_layer(window);
    GRect bounds = layer_get_frame(window_layer);
    s_simple_menu_layer = simple_menu_layer_create(bounds, window, s_menu_sections, NUM_MENU_SECTIONS, NULL);
    layer_add_child(window_layer, simple_menu_layer_get_layer(s_simple_menu_layer));
}

static void window_unload(Window *window) {
    // Destroy window's child layers

    // Destroy the simple menu layer
    simple_menu_layer_destroy(s_simple_menu_layer);
}