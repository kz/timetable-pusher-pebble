#include <pebble.h>
#include "win_menu_day.h"
#include "../app.h"

#define NUM_MENU_SECTIONS 2
#define NUM_WHOLE_WEEK_SECTION_ITEMS 1

extern int DAY_OF_WEEK;

static Window *s_menu_day_window;
static MenuLayer *s_menu_layer;

static void window_load(Window* window);
static void window_unload(Window* window);
static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data);
static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data);
static int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index, void *data);
static void menu_draw_header_callback(GContext* ctx, const Layer *cell_layer, uint16_t section_index, void *data);
static void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data);
static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data);
static void menu_cell_round_compatible_header_draw(GContext* ctx, const Layer *cell_layer, const char *title);

static const char *DAY_NAMES[7];
static int SELECTED_TIMETABLE;
static int SELECTED_WEEK;

void win_menu_day_create(int selected_timetable, int selected_week) {
    SELECTED_TIMETABLE = selected_timetable;
    SELECTED_WEEK = selected_week;
    DAY_NAMES[0] = "Monday";
    DAY_NAMES[1] = "Tuesday";
    DAY_NAMES[2] = "Wednesday";
    DAY_NAMES[3] = "Thursday";
    DAY_NAMES[4] = "Friday";
    DAY_NAMES[5] = "Saturday";
    DAY_NAMES[6] = "Sunday";

    s_menu_day_window = window_create();
    window_set_window_handlers(s_menu_day_window, (WindowHandlers) {
        .load = window_load,
        .unload = window_unload,
    });
    window_stack_push(s_menu_day_window, true);
}

void win_menu_day_destroy(void) {
    window_destroy(s_menu_day_window);
}

Window* get_menu_day_window(void) {
    return s_menu_day_window;
}

// -------------------------------------------------------------- //

static void menu_cell_round_compatible_header_draw(GContext* ctx, const Layer *cell_layer, const char *title) {
    graphics_context_set_text_color(ctx, GColorBlack);
    graphics_context_set_fill_color(ctx, GColorWhite);

    GRect layer_size = layer_get_bounds(cell_layer);
    graphics_fill_rect(ctx, GRect(0, 1, layer_size.size.w, 14), 0, GCornerNone);
    #ifdef PBL_RECT
    graphics_draw_text(ctx, title,
                       fonts_get_system_font(FONT_KEY_GOTHIC_14_BOLD),
                       GRect(3, -2, layer_size.size.w - 3, 14), GTextOverflowModeWordWrap,
                       GTextAlignmentLeft, NULL);
    #else
    graphics_draw_text(ctx, title,
                       fonts_get_system_font(FONT_KEY_GOTHIC_14_BOLD),
                       GRect(3, -2, layer_size.size.w - 3, 14), GTextOverflowModeWordWrap,
                       GTextAlignmentCenter, NULL);
    #endif
}

static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
    return NUM_MENU_SECTIONS;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
    switch (section_index) {
        case 0:
        return NUM_WHOLE_WEEK_SECTION_ITEMS;
        break;

        case 1:
        if (SELECTED_WEEK == 0) {
            return 7 - DAY_OF_WEEK;
        } else {
            return 7;
        }
        break;

        default:
        return 0;
    }
}

static int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
    return MENU_CELL_BASIC_HEADER_HEIGHT;
}

static void menu_draw_header_callback(GContext* ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
    switch (section_index) {
        case 0:
        menu_cell_round_compatible_header_draw(ctx, cell_layer, "Push pins for:");
        break;

        case 1:
        menu_cell_round_compatible_header_draw(ctx, cell_layer, "Specific day:");
        break;
    }
}

static void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
    switch (cell_index->section) {
        case 0:
        menu_cell_basic_draw(ctx, cell_layer, "Whole week", NULL, NULL);
        break;

        case 1:
        if (SELECTED_WEEK == 0) {
            menu_cell_basic_draw(ctx, cell_layer, DAY_NAMES[DAY_OF_WEEK + cell_index->row], NULL, NULL);
        } else {
            menu_cell_basic_draw(ctx, cell_layer, DAY_NAMES[cell_index->row], NULL, NULL);
        }
        break;
    }
}

static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
    int selected_day;
    switch (cell_index->section) {
        case 0:
        selected_day = 7;
        break;

        case 1:
        if (SELECTED_WEEK == 0) {
            selected_day = DAY_OF_WEEK + cell_index->row;
        } else {
            selected_day = cell_index->row;
        }
        break;

        default:
        selected_day = 7;
    }

    push_pins(SELECTED_TIMETABLE, SELECTED_WEEK, selected_day);
}

static void window_load(Window *window) {  
    // Create root window layer
    Layer *window_layer = window_get_root_layer(window);
    GRect bounds = layer_get_frame(window_layer);

    // Create menu layer
    s_menu_layer = menu_layer_create(bounds);
    menu_layer_set_highlight_colors(s_menu_layer, 
                                    PBL_IF_COLOR_ELSE(GColorJaegerGreen, GColorBlack), 
                                    PBL_IF_COLOR_ELSE(GColorWhite, GColorWhite));
    menu_layer_set_callbacks(s_menu_layer, NULL, (MenuLayerCallbacks) {
        .get_num_sections = menu_get_num_sections_callback,
        .get_num_rows = menu_get_num_rows_callback,
        .get_header_height = menu_get_header_height_callback,
        .draw_header = menu_draw_header_callback,
        .draw_row = menu_draw_row_callback,
        .select_click = menu_select_callback,
    });

    // Bind the menu layer's click config provider to the window for interactivity
    menu_layer_set_click_config_onto_window(s_menu_layer, window);

    // Add the menu layer to the window layer
    layer_add_child(window_layer, menu_layer_get_layer(s_menu_layer));
}

static void window_unload(Window *window) {
    // Destroy the menu layer
    menu_layer_destroy(s_menu_layer);
}