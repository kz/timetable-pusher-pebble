#include <pebble.h>
#include "win_error.h"

#define DIALOG_CONFIG_WINDOW_MESSAGE "Unknown error\noccurred\nRestart app"

static Window *s_error_window;

static TextLayer *s_body_layer;
static BitmapLayer *s_icon_layer;

static GBitmap *s_icon_bitmap;

static void window_load(Window* window);
static void window_unload(Window* window);

void win_error_create(void) {
    s_error_window = window_create();
    window_set_background_color(s_error_window, PBL_IF_COLOR_ELSE(GColorDarkGray, GColorWhite));
    window_set_window_handlers(s_error_window, (WindowHandlers) {
        .load = window_load,
        .unload = window_unload,
    });
    window_stack_push(s_error_window, false);
}

void win_error_destroy(void) {
    window_destroy(s_error_window);
}

Window* get_error_window(void) {
    return s_error_window;
}

// -------------------------------------------------------------- //

static void window_load(Window *window) {  
    Layer *window_layer = window_get_root_layer(window);
    GRect bounds = layer_get_bounds(window_layer);

    s_icon_bitmap = gbitmap_create_with_resource(RESOURCE_ID_IMG_WARNING);
    GRect bitmap_bounds = gbitmap_get_bounds(s_icon_bitmap);    
    bounds.size.h = PBL_IF_RECT_ELSE(bounds.size.h - 75, bounds.size.h - 90);
    
    const GEdgeInsets icon_insets = GEdgeInsets(
        (bounds.size.h - bitmap_bounds.size.h) / 2 ,
        (bounds.size.w - bitmap_bounds.size.w) / 2);
    s_icon_layer = bitmap_layer_create(grect_inset(bounds, icon_insets));
    bitmap_layer_set_bitmap(s_icon_layer, s_icon_bitmap);
    bitmap_layer_set_compositing_mode(s_icon_layer, GCompOpSet);
    layer_add_child(window_layer, bitmap_layer_get_layer(s_icon_layer));

    bounds.size.h = bounds.size.h + 50;
    const GEdgeInsets body_insets = {.top = 60, .right = 5, .left = 5};
    s_body_layer = text_layer_create(grect_inset(bounds, body_insets));
    text_layer_set_text(s_body_layer, DIALOG_CONFIG_WINDOW_MESSAGE);
    text_layer_set_text_color(s_body_layer, PBL_IF_COLOR_ELSE(GColorWhite, GColorBlack));
    text_layer_set_background_color(s_body_layer, GColorClear);
    text_layer_set_font(s_body_layer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
    text_layer_set_text_alignment(s_body_layer, GTextAlignmentCenter);
    layer_add_child(window_layer, text_layer_get_layer(s_body_layer));
    #ifdef PBL_ROUND
    const uint8_t inset = 2;
    text_layer_enable_screen_text_flow_and_paging(s_body_layer, inset);
    #endif
}

static void window_unload(Window *window) {
    text_layer_destroy(s_body_layer);
    bitmap_layer_destroy(s_icon_layer);
    gbitmap_destroy(s_icon_bitmap);
}