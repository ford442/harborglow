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
    // Match WaveSystem.ts / Water.tsx: sin(dot * freq + time * speed)
    float dot = x * dirX + z * dirZ;
    float phase = dot * freq + speed * time;
    return amp * std::sin(phase);
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

// ---------------------------------------------------------------------------
// FFT (Fast Fourier Transform)
// ---------------------------------------------------------------------------

extern "C" DSP_EXPORT
void dsp_fft_r2c(const float* input, float* out_real, float* out_imag, int log2N) {
    int N = 1 << log2N;
    
    // Copy input to output, real only. Bit-reversal permutation.
    for (int i = 0; i < N; ++i) {
        int rev = 0;
        for (int j = 0; j < log2N; ++j) {
            if ((i >> j) & 1) rev |= (1 << (log2N - 1 - j));
        }
        out_real[rev] = input[i];
        out_imag[rev] = 0.0f;
    }

    // Cooley-Tukey Radix-2
    for (int s = 1; s <= log2N; ++s) {
        int m = 1 << s;
        float theta = -TWO_PI / m;
        float wm_real = std::cos(theta);
        float wm_imag = std::sin(theta);
        
        for (int k = 0; k < N; k += m) {
            float w_real = 1.0f;
            float w_imag = 0.0f;
            
            for (int j = 0; j < m / 2; ++j) {
                float t_real = w_real * out_real[k + j + m / 2] - w_imag * out_imag[k + j + m / 2];
                float t_imag = w_real * out_imag[k + j + m / 2] + w_imag * out_real[k + j + m / 2];
                float u_real = out_real[k + j];
                float u_imag = out_imag[k + j];
                
                out_real[k + j] = u_real + t_real;
                out_imag[k + j] = u_imag + t_imag;
                out_real[k + j + m / 2] = u_real - t_real;
                out_imag[k + j + m / 2] = u_imag - t_imag;
                
                float next_w_real = w_real * wm_real - w_imag * wm_imag;
                float next_w_imag = w_real * wm_imag + w_imag * wm_real;
                w_real = next_w_real;
                w_imag = next_w_imag;
            }
        }
    }
}
