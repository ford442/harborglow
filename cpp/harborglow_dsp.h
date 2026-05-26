// =============================================================================
// harborglow_dsp.h — HarborGlow C++ DSP / Simulation Utilities
// Compiled to WebAssembly via Emscripten (emcc).
//
// Exposes performance-critical math helpers for:
//   • Real-time audio DSP (mixing, clamping, additive synthesis)
//   • Gerstner wave height queries used by Ship buoyancy and Water shaders
//   • Fast trigonometry approximations (sin, smoothstep, etc.)
//
// All exported symbols use C linkage and EMSCRIPTEN_KEEPALIVE so that they
// are reachable from JavaScript via Module.cwrap() / Module._function().
// =============================================================================

#pragma once

#include <cstdint>

// =============================================================================
// ARITHMETIC / INTERPOLATION
// =============================================================================

/** Linear interpolation between a and b at position t ∈ [0, 1]. */
extern "C" float dsp_mix(float a, float b, float t);

/** Clamp x to the closed interval [lo, hi]. */
extern "C" float dsp_clamp(float x, float lo, float hi);

/** Remap v from input range [lo1, hi1] to output range [lo2, hi2]. */
extern "C" float dsp_remap(float v, float lo1, float hi1, float lo2, float hi2);

/** Cubic smoothstep for t ∈ [0, 1]: 3t² − 2t³. */
extern "C" float dsp_smooth_step(float t);

/** Ken Perlin's smoother-step: 6t⁵ − 15t⁴ + 10t³. */
extern "C" float dsp_smoother_step(float t);

// =============================================================================
// FAST TRIGONOMETRY
// =============================================================================

/**
 * Fast sine approximation (Bhaskara I) for x in [0, π].
 * Accuracy: ~0.1 % max relative error across the domain.
 * Wrap x into [0, 2π] before calling for full-cycle support.
 */
extern "C" float dsp_sin_approx(float x);

/**
 * Full-cycle fast sine approximation.
 * Accepts any x (radians); wraps automatically to [0, 2π].
 */
extern "C" float dsp_sin_full(float x);

// =============================================================================
// OCEAN / WAVE SIMULATION
// =============================================================================

/**
 * Single Gerstner wave contribution at world position (x, z) and time t.
 *
 * @param x      World X coordinate (metres).
 * @param z      World Z coordinate (metres).
 * @param time   Simulation time (seconds).
 * @param amp    Wave amplitude (metres).
 * @param freq   Angular frequency (2π / wavelength, rad/m).
 * @param speed  Phase speed (m/s).
 * @param dirX   Normalised direction X component.
 * @param dirZ   Normalised direction Z component.
 * @return       Vertical displacement (metres).
 */
extern "C" float dsp_wave_height(
    float x, float z, float time,
    float amp, float freq, float speed,
    float dirX, float dirZ);

// =============================================================================
// AUDIO SYNTHESIS
// =============================================================================

/**
 * Additive synthesizer — sum of @p harmonics sine partials.
 *
 * Each partial k (k = 1 … harmonics) contributes:
 *   sin(2π × freq × k × time) / k^decay
 *
 * @param freq      Fundamental frequency (Hz).
 * @param time      Sample time (seconds).
 * @param harmonics Number of partials to sum (1 … 64).
 * @param decay     Harmonic decay exponent (1 = 1/k, 2 = 1/k², …).
 * @return          Normalised sample in the range [−1, 1].
 */
extern "C" float dsp_additive_synth_sample(
    float freq, float time, int harmonics, float decay);

/**
 * Compute the RMS (root mean square) of a float32 buffer.
 *
 * @param data    Pointer to interleaved f32 audio samples.
 * @param count   Number of samples.
 * @return        RMS value ≥ 0.
 */
extern "C" float dsp_audio_rms(const float* data, int count);

// =============================================================================
// BATCH / SIMD-FRIENDLY HELPERS
// =============================================================================

/**
 * Compute the Gerstner wave height for @p count world positions in one call.
 * Results are written into @p out_heights.
 *
 * This avoids JS↔WASM call overhead when querying many positions per frame
 * (e.g. a 16×16 grid of foam simulation points).
 *
 * @param xs         Array of X coordinates (length ≥ count).
 * @param zs         Array of Z coordinates (length ≥ count).
 * @param time       Shared simulation time.
 * @param amp        Wave amplitude.
 * @param freq       Angular frequency.
 * @param speed      Phase speed.
 * @param dirX       Direction X.
 * @param dirZ       Direction Z.
 * @param out_heights Output array (length ≥ count); written in place.
 * @param count      Number of positions to evaluate.
 */
extern "C" void dsp_wave_height_batch(
    const float* xs, const float* zs, float time,
    float amp, float freq, float speed, float dirX, float dirZ,
    float* out_heights, int count);
