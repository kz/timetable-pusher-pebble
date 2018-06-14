#pragma once
#include <pebble.h>

void win_menu_day_create(int selected_timetable, int selected_week);
void win_menu_day_destroy(void);
Window* get_menu_day_window(void);