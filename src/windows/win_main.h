#pragma once
#include <pebble.h>

void win_main_create(int count, char *timetable_names[]);
void win_main_destroy(void);
Window* get_main_window(void);