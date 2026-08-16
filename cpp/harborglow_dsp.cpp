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
#include <array>
#include <cstdint>
#include <memory>
#include <vector>

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
void dsp_additive_block(
        float* out, int n_samples,
        const float* freqs, const float* amps, int n_harmonics,
        float sample_rate, float* phase_acc) {
    if (!out || !freqs || !amps || !phase_acc || n_samples <= 0 ||
        n_harmonics <= 0 || sample_rate <= 0.0f) {
        return;
    }

    const int harmonics = std::min(n_harmonics, 256);
    const float inv_rate = 1.0f / sample_rate;

    for (int sample_index = 0; sample_index < n_samples; ++sample_index) {
        float sample = 0.0f;
        for (int harmonic = 0; harmonic < harmonics; ++harmonic) {
            float phase = phase_acc[harmonic];
            sample += std::sin(phase) * amps[harmonic];
            phase += TWO_PI * freqs[harmonic] * inv_rate;
            phase -= TWO_PI * std::floor(phase / TWO_PI);
            phase_acc[harmonic] = phase;
        }
        out[sample_index] = sample;
    }
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
// STREAMING CONVOLUTION / PROCEDURAL ROOM IMPULSES
// ---------------------------------------------------------------------------

namespace {

struct StreamingConvolver {
    std::vector<float> impulse;
    std::vector<float> history;
    std::size_t cursor = 0;

    explicit StreamingConvolver(const float* ir, int length)
        : impulse(ir, ir + length), history(static_cast<std::size_t>(length), 0.0f) {}

    void reset() {
        std::fill(history.begin(), history.end(), 0.0f);
        cursor = 0;
    }
};

constexpr std::size_t MAX_CONVOLVERS = 32;
std::array<std::unique_ptr<StreamingConvolver>, MAX_CONVOLVERS> convolvers;

StreamingConvolver* get_convolver(int handle) {
    if (handle <= 0 || static_cast<std::size_t>(handle) > MAX_CONVOLVERS) {
        return nullptr;
    }
    return convolvers[static_cast<std::size_t>(handle - 1)].get();
}

std::uint32_t xorshift32(std::uint32_t& state) {
    state ^= state << 13U;
    state ^= state >> 17U;
    state ^= state << 5U;
    return state;
}

float random_bipolar(std::uint32_t& state) {
    constexpr float scale = 1.0f / 2147483648.0f;
    return static_cast<float>(static_cast<std::int32_t>(xorshift32(state))) * scale;
}

}  // namespace

extern "C" DSP_EXPORT
int dsp_convolver_create(const float* impulse, int impulse_length) {
    if (!impulse || impulse_length <= 0 || impulse_length > 262144) {
        return 0;
    }
    for (std::size_t index = 0; index < convolvers.size(); ++index) {
        if (!convolvers[index]) {
            convolvers[index] = std::make_unique<StreamingConvolver>(
                impulse, impulse_length);
            return static_cast<int>(index + 1);
        }
    }
    return 0;
}

extern "C" DSP_EXPORT
void dsp_convolver_process(
        int handle, const float* input, float* output, int count) {
    StreamingConvolver* convolver = get_convolver(handle);
    if (!convolver || !input || !output || count <= 0) {
        return;
    }

    const std::size_t length = convolver->impulse.size();
    for (int sample_index = 0; sample_index < count; ++sample_index) {
        convolver->history[convolver->cursor] = input[sample_index];

        float sum = 0.0f;
        std::size_t history_index = convolver->cursor;
        for (std::size_t tap = 0; tap < length; ++tap) {
            sum += convolver->impulse[tap] * convolver->history[history_index];
            history_index = history_index == 0 ? length - 1 : history_index - 1;
        }
        output[sample_index] = sum;
        convolver->cursor = (convolver->cursor + 1) % length;
    }
}

extern "C" DSP_EXPORT
void dsp_convolver_reset(int handle) {
    if (StreamingConvolver* convolver = get_convolver(handle)) {
        convolver->reset();
    }
}

extern "C" DSP_EXPORT
void dsp_convolver_destroy(int handle) {
    if (handle <= 0 || static_cast<std::size_t>(handle) > MAX_CONVOLVERS) {
        return;
    }
    convolvers[static_cast<std::size_t>(handle - 1)].reset();
}

extern "C" DSP_EXPORT
int dsp_generate_room_ir(
        float* output, int capacity, int preset, float sample_rate,
        unsigned seed) {
    if (!output || capacity <= 0 || sample_rate <= 0.0f) {
        return 0;
    }

    struct RoomParameters {
        float duration;
        float decay;
        float early_gain;
        float metallic;
    };
    static constexpr RoomParameters rooms[] = {
        {0.02f, 0.01f, 0.0f, 0.0f},
        {0.48f, 0.16f, 0.72f, 0.82f},
        {1.8f, 0.62f, 0.62f, 0.45f},
        {3.4f, 1.1f, 0.68f, 0.7f},
        {6.0f, 2.1f, 0.52f, 0.28f},
    };

    const int room_index = std::min(std::max(preset, 0), 4);
    const RoomParameters room = rooms[room_index];
    const int length = std::min(
        capacity, std::max(1, static_cast<int>(room.duration * sample_rate)));
    std::fill(output, output + length, 0.0f);
    output[0] = 1.0f;
    if (room_index == 0) {
        return length;
    }

    std::uint32_t random_state = seed == 0U
        ? 0x9e3779b9U ^ static_cast<std::uint32_t>(room_index)
        : seed;
    for (int index = 1; index < length; ++index) {
        const float time = static_cast<float>(index) / sample_rate;
        const float envelope = std::exp(-time / room.decay);
        const float noise = random_bipolar(random_state);
        const float metallic = std::sin(
            TWO_PI * (173.0f + 67.0f * room.metallic) * time);
        output[index] = envelope * (noise * (1.0f - room.metallic * 0.45f) +
            metallic * room.metallic * 0.28f) * 0.085f;
    }

    static constexpr float early_delays[] = {0.007f, 0.013f, 0.021f, 0.034f, 0.055f};
    for (std::size_t reflection = 0;
         reflection < sizeof(early_delays) / sizeof(early_delays[0]);
         ++reflection) {
        const int index = static_cast<int>(
            early_delays[reflection] * sample_rate * (1.0f + room_index * 0.35f));
        if (index < length) {
            output[index] += room.early_gain /
                static_cast<float>(reflection + 2);
        }
    }
    return length;
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
