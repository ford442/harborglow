#pragma once

extern "C" {

int dsp_audio_engine_init(float sample_rate);
void dsp_audio_engine_note_on(
    int voice_id, float frequency, float velocity, int waveform,
    float attack, float decay, float sustain, float release);
void dsp_audio_engine_note_off(int voice_id);
void dsp_audio_engine_set_effects(
    float lowpass_hz, float distortion, int bit_depth,
    float delay_seconds, float delay_feedback, float chorus_depth,
    int room_preset, float room_mix);
void dsp_audio_engine_render(float* out_left, float* out_right, int frame_count);
void dsp_audio_engine_stop_all(void);
float dsp_audio_engine_rms(void);
float dsp_audio_engine_peak(void);

}
