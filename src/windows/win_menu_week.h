#pragma once
#include <pebble.h>

void win_menu_week_create(int selected_timetable);
void win_menu_week_destroy(void);
Window* get_menu_week_window(void);