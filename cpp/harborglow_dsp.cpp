// =============================================================================
// harborglow_dsp.cpp — HarborGlow C++ DSP / Simulation Utilities
// Compiled to WebAssembly via Emscripten (emcc).
//
// Build:
//   cd cpp && ./build.sh   (requires Emscripten SDK ≥ 3.1)
//
// The generated output is placed in ../public/wasm/:
//   harborglow_dsp.wasm  — WASM binary (imported by wasmDSP.ts)
//   harborglow_dsp.js    — Emscripten JS glue (not used; raw WASM API used)
// =============================================================================

#include "harborglow_dsp.h"

#include <cmath>
#include <algorithm>

#ifdef __EMSCRIPTEN__
#  include <emscripten.h>
#  define DSP_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#  define DSP_EXPORT
#endif

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

static constexpr float PI    = 3.14159265358979f;
static constexpr float TWO_PI = 6.28318530717959f;

// ---------------------------------------------------------------------------
// ARITHMETIC / INTERPOLATION
// ---------------------------------------------------------------------------

extern "C" DSP_EXPORT
float dsp_mix(float a, float b, float t) {
    return a + (b - a) * t;
}

extern "C" DSP_EXPORT
float dsp_clamp(float x, float lo, float hi) {
    return std::min(std::max(x, lo), hi);
}

extern "C" DSP_EXPORT
float dsp_remap(float v, float lo1, float hi1, float lo2, float hi2) {
    return lo2 + (v - lo1) / (hi1 - lo1) * (hi2 - lo2);
}

extern "C" DSP_EXPORT
float dsp_smooth_step(float t) {
    t = dsp_clamp(t, 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
}

extern "C" DSP_EXPORT
float dsp_smoother_step(float t) {
    t = dsp_clamp(t, 0.0f, 1.0f);
    return t * t * t * (t * (t * 6.0f - 15.0f) + 10.0f);
}

// ---------------------------------------------------------------------------
// FAST TRIGONOMETRY
// ---------------------------------------------------------------------------

// Bhaskara I approximation: sin(x) ≈ 16x(π-x) / (5π²-4x(π-x))
// Valid for x ∈ [0, π].  Max relative error ≈ 0.10 %.
extern "C" DSP_EXPORT
float dsp_sin_approx(float x) {
    float xpix = x * (PI - x);
    return (16.0f * xpix) / (5.0f * PI * PI - 4.0f * xpix);
}

// Full-cycle version: wrap x to [0, 2π], then use half-cycle symmetry.
extern "C" DSP_EXPORT
float dsp_sin_full(float x) {
    // Wrap to [0, 2π)
    x = x - TWO_PI * std::floor(x / TWO_PI);
    if (x < PI) {
        return dsp_sin_approx(x);
    } else {
        return -dsp_sin_approx(x - PI);
    }
}

// ---------------------------------------------------------------------------
// OCEAN / WAVE SIMULATION
// ---------------------------------------------------------------------------

extern "C" DSP_EXPORT
float dsp_wave_height(
        float x, float z, float time,
        float amp, float freq, float speed,
        float dirX, float dirZ) {
    float phase = freq * (x * dirX + z * dirZ) - speed * time;
    return amp * std::cos(phase);
}

// ---------------------------------------------------------------------------
// AUDIO SYNTHESIS
// ---------------------------------------------------------------------------

extern "C" DSP_EXPORT
float dsp_additive_synth_sample(
        float freq, float time, int harmonics, float decay) {
    float sample = 0.0f;
    float norm   = 0.0f;
    int   n      = std::min(std::max(harmonics, 1), 64);

    for (int k = 1; k <= n; ++k) {
        float weight = 1.0f / std::pow(static_cast<float>(k), decay);
        sample      += std::sin(TWO_PI * freq * static_cast<float>(k) * time) * weight;
        norm        += weight;
    }

    return (norm > 0.0f) ? (sample / norm) : 0.0f;
}

extern "C" DSP_EXPORT
float dsp_audio_rms(const float* data, int count) {
    if (count <= 0) return 0.0f;
    float sum = 0.0f;
    for (int i = 0; i < count; ++i) {
        sum += data[i] * data[i];
    }
    return std::sqrt(sum / static_cast<float>(count));
}

// ---------------------------------------------------------------------------
// BATCH HELPERS
// ---------------------------------------------------------------------------

extern "C" DSP_EXPORT
void dsp_wave_height_batch(
        const float* xs, const float* zs, float time,
        float amp, float freq, float speed, float dirX, float dirZ,
        float* out_heights, int count) {
    for (int i = 0; i < count; ++i) {
        out_heights[i] = dsp_wave_height(
            xs[i], zs[i], time, amp, freq, speed, dirX, dirZ);
    }
}
