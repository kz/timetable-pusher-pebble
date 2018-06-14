#include <pebble.h>
#include "win_success.h"

static Window *s_success_window;
static TextLayer *s_text_layer;
static StatusBarLayer *s_status_bar;

static void window_load(Window* window);
static void window_unload(Window* window);

void win_success_create(void) {
    s_success_window = window_create();
    window_set_background_color(s_success_window, PBL_IF_COLOR_ELSE(GColorJaegerGreen, GColorWhite));
    window_set_window_handlers(s_success_window, (WindowHandlers) {
        .load = window_load,
        .unload = window_unload,
    });
    window_stack_push(s_success_window, true);
}

void win_success_destroy(void) {
    window_destroy(s_success_window);
}

Window* get_success_window(void) {
    return s_success_window;
}

// -------------------------------------------------------------- //

static void window_load(Window *window) {  
    Layer *window_layer = window_get_root_layer(window);
    GRect bounds = layer_get_bounds(window_layer);
    
    s_text_layer = text_layer_create(grect_inset(bounds, GEdgeInsets(PBL_IF_ROUND_ELSE(45, 30), 0)));
    text_layer_set_text(s_text_layer, "Success\nChanges will be made within 15 minutes");
    text_layer_set_text_color(s_text_layer, PBL_IF_COLOR_ELSE(GColorWhite, GColorBlack));
    text_layer_set_background_color(s_text_layer, GColorClear);
    text_layer_set_font(s_text_layer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
    text_layer_set_text_alignment(s_text_layer, GTextAlignmentCenter);
    layer_add_child(window_layer, text_layer_get_layer(s_text_layer));
    #ifdef PBL_ROUND
    const uint8_t inset = 2;
    text_layer_enable_screen_text_flow_and_paging(s_text_layer, inset);
    #endif
}

static void window_unload(Window *window) {
    status_bar_layer_destroy(s_status_bar);
    text_layer_destroy(s_text_layer);
}