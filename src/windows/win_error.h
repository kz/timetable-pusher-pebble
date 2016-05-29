#pragma once
#include <pebble.h>

void win_error_create(void);
void win_error_destroy(void);
Window* get_error_window(void);