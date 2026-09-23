#pragma once

#include <stdint.h>

extern "C" {

/*
 * Command ring ABI, protocol v2 (mirrored in src/systems/audio/audioProtocol.ts).
 *
 * Every record is DSP_AUDIO_COMMAND_BYTES, little-endian:
 *
 *    0 int32   type            1 NoteOn, 2 NoteOff, 3 StopAll, 4 SetEffects
 *    4 int32   voice_id
 *    8 float   frequency       NoteOn
 *   12 float   velocity        NoteOn
 *   16 int32   waveform        NoteOn
 *   20 float   attack/decay/sustain/release (4 × float, NoteOn)
 *   36 float   lowpass_hz      SetEffects
 *   40 float   distortion      SetEffects
 *   44 int32   bit_depth       SetEffects
 *   48 float   delay_seconds / delay_feedback / chorus_depth (SetEffects)
 *   60 uint8   room_preset     SetEffects
 *   61 uint8   room_mix × 255  SetEffects
 *   64 double  frame           AudioContext frame the command takes effect at;
 *                              any frame at or before the current quantum
 *                              applies at the start of that quantum
 *   72 uint32  note_id         NoteOn tags the voice; a NoteOff with a nonzero
 *                              note_id only releases the note it tags
 *   76 uint32  reserved
 *
 * StopAll ignores `frame`: it silences every voice and drops every command
 * queued before it, at the start of the quantum that drains it.
 */
int dsp_audio_engine_protocol_version(void);
int dsp_audio_engine_command_bytes(void);

int dsp_audio_engine_init(float sample_rate);
void dsp_audio_engine_note_on(
    int voice_id, float frequency, float velocity, int waveform,
    float attack, float decay, float sustain, float release);
void dsp_audio_engine_note_off(int voice_id);
void dsp_audio_engine_set_effects(
    float lowpass_hz, float distortion, int bit_depth,
    float delay_seconds, float delay_feedback, float chorus_depth,
    int room_preset, float room_mix);
/** Render immediately, ignoring the scheduled command queue. */
void dsp_audio_engine_render(float* out_left, float* out_right, int frame_count);
void dsp_audio_engine_stop_all(void);
float dsp_audio_engine_rms(void);
float dsp_audio_engine_peak(void);

/** Queue one command record; returns 0 when the queue is full. */
int dsp_audio_engine_enqueue(const void* record);
/** Move records from a dsp_ring_* command ring into the queue; returns the count moved. */
int dsp_audio_engine_drain(void* command_ring);
/** Commands waiting for their frame. */
int dsp_audio_engine_pending(void);
/**
 * Render `frame_count` frames starting at absolute frame `start_frame`,
 * applying queued commands at their frames by splitting the block.
 */
void dsp_audio_engine_process(
    float* out_left, float* out_right, int frame_count, double start_frame);

}
