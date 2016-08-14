#include <pebble.h>
#include "app.h"
#include "win_main.h"
#include "win_tutorial.h"
#include "win_menu_week.h"

#define NUM_MENU_SECTIONS 2
#define NUM_TIMETABLE_SECTION_ITEMS 1
#define NUM_ADVANCED_SECTION_ITEMS 1

static Window *s_main_window;
static MenuLayer *s_menu_layer;

static void window_load(Window* window);
static void window_unload(Window* window);
static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data);
static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data);
static int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index, void *data);
static void menu_draw_header_callback(GContext* ctx, const Layer *cell_layer, uint16_t section_index, void *data);
static void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data);
static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data);
void menu_cell_round_compatible_header_draw(GContext* ctx, const Layer *cell_layer, const char *title);

static bool has_timetables;
static int TIMETABLE_COUNT;
static char **TIMETABLE_NAMES;

void win_main_create(int count, char *timetable_names[]) {
    if (count > 0) {
        has_timetables = true;
    } else {
        has_timetables = false;
    }
    TIMETABLE_COUNT = count;
    TIMETABLE_NAMES = malloc(count * sizeof(char *));
    for (int i = 0; i < count; i++) {
        int str_length = strlen(timetable_names[i]) + 1;
        char* buffer = (char*) malloc(str_length);
        strncpy(buffer, timetable_names[i], str_length);
        TIMETABLE_NAMES[i] = buffer;
    }

    s_main_window = window_create();
    window_set_window_handlers(s_main_window, (WindowHandlers) {
        .load = window_load,
        .unload = window_unload,
    });
    window_stack_push(s_main_window, true);
}

void win_main_destroy(void) {
    free(TIMETABLE_NAMES);
    window_destroy(s_main_window);
}

Window* get_main_window(void) {
    return s_main_window;
}

// -------------------------------------------------------------- //

void menu_cell_round_compatible_header_draw(GContext* ctx, const Layer *cell_layer, const char *title) {
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
        if(has_timetables) {
            return TIMETABLE_COUNT;
        } else {
            return NUM_TIMETABLE_SECTION_ITEMS;
        }
        case 1:
        return NUM_ADVANCED_SECTION_ITEMS;
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
        menu_cell_round_compatible_header_draw(ctx, cell_layer, "Select Timetable");
        break;
        case 1:
        menu_cell_round_compatible_header_draw(ctx, cell_layer, "Advanced");
        break;
    }
}

static void menu_draw_row_callback(GContext* ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
    switch (cell_index->section) {
        case 0:
        if(!has_timetables && cell_index->row == 0) {
            menu_cell_basic_draw(ctx, cell_layer, "Create one now!", NULL, NULL);
        } else {
            menu_cell_basic_draw(ctx, cell_layer, TIMETABLE_NAMES[cell_index->row], NULL, NULL);
        }
        break;
        case 1:
        switch (cell_index->row) {
            case 0:
            menu_cell_basic_draw(ctx, cell_layer, "Delete all pins", NULL, NULL);
            break;
        }
        break;
    }
}

static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
    switch (cell_index->section) {
        case 0:
        if (!has_timetables) {
            win_tutorial_create();
        } else {
            int selected_timetable = cell_index->row;
            win_menu_week_create(selected_timetable);
        }
        break;

        case 1:
        switch (cell_index->row) {
            case 0:
            // Delete all pins selected
            delete_pins();
            break;
        }
        break;
    }
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