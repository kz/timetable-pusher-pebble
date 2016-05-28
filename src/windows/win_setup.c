#include <pebble.h>
#include "win_setup.h"

static Window *s_setup_window;
static TextLayer *s_title_layer, *s_body_layer;

static void window_load(Window* window);
static void window_unload(Window* window);

void win_setup_create(void) {
    s_setup_window = window_create();
    window_set_window_handlers(s_setup_window, (WindowHandlers) {
        .load = window_load,
        .unload = window_unload,
    });
    window_stack_push(s_setup_window, true);
}

void win_setup_destroy(void) {
    window_destroy(s_setup_window);
}

Window* get_setup_window(void) {
    return s_setup_window;
}

// -------------------------------------------------------------- //

static void window_load(Window *window) {  
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  s_title_layer = text_layer_create(bounds);
  text_layer_set_text(s_title_layer, "Setup required!");
  text_layer_set_text_alignment(s_title_layer, GTextAlignmentCenter);
  text_layer_set_font(s_title_layer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  text_layer_set_background_color(s_title_layer, GColorBlueMoon);
  text_layer_set_text_color(s_title_layer, GColorWhite);
  layer_add_child(window_layer, text_layer_get_layer(s_title_layer));

  text_layer_enable_screen_text_flow_and_paging(s_title_layer, 2);

  GSize title_size = text_layer_get_content_size(s_title_layer);

  s_body_layer = text_layer_create(GRect(bounds.origin.x, bounds.origin.y + title_size.h + 8, bounds.size.w, bounds.size.h));
  text_layer_set_text(s_body_layer, "Open this app\'s settings page under the Pebble phone app to get started.");
  text_layer_set_text_alignment(s_body_layer, GTextAlignmentCenter);
    text_layer_set_font(s_title_layer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  text_layer_set_background_color(s_body_layer, GColorPictonBlue);
  text_layer_set_text_color(s_body_layer, GColorWhite);
  layer_add_child(window_layer, text_layer_get_layer(s_body_layer));

  text_layer_enable_screen_text_flow_and_paging(s_body_layer, 2);
}

static void window_unload(Window *window) {
    // Destroy the used layers
  text_layer_destroy(s_title_layer);
  text_layer_destroy(s_body_layer);
}