/* Compile check: harborglow_audio_engine.h must be valid C (make header-c). */
#include "harborglow_audio_engine.h"

float (*const hg_header_c_probe)(void) = dsp_audio_engine_rms;
