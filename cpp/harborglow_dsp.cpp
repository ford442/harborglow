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

#if defined(__wasm_simd128__)
#  include <wasm_simd128.h>
#  define DSP_HAS_SIMD 1
#else
#  define DSP_HAS_SIMD 0
#endif

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
    const float span = hi1 - lo1;
    if (std::fabs(span) < 1e-20f) return lo2;
    return lo2 + (v - lo1) / span * (hi2 - lo2);
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
    if (!data || count <= 0) return 0.0f;
    int i = 0;
    float sum = 0.0f;
#if DSP_HAS_SIMD
    v128_t acc = wasm_f32x4_splat(0.0f);
    for (; i + 4 <= count; i += 4) {
        v128_t v = wasm_v128_load(data + i);
        acc = wasm_f32x4_add(acc, wasm_f32x4_mul(v, v));
    }
    alignas(16) float lanes[4];
    wasm_v128_store(lanes, acc);
    sum = lanes[0] + lanes[1] + lanes[2] + lanes[3];
#endif
    for (; i < count; ++i) {
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
            early_delays[reflection] * sample_rate *
            (1.0f + static_cast<float>(room_index) * 0.35f));
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
    if (!xs || !zs || !out_heights || count <= 0) return;
    int i = 0;
#if DSP_HAS_SIMD
    const v128_t vdirX = wasm_f32x4_splat(dirX);
    const v128_t vdirZ = wasm_f32x4_splat(dirZ);
    const v128_t vfreq = wasm_f32x4_splat(freq);
    const v128_t vphase0 = wasm_f32x4_splat(speed * time);
    for (; i + 4 <= count; i += 4) {
        v128_t xs4 = wasm_v128_load(xs + i);
        v128_t zs4 = wasm_v128_load(zs + i);
        v128_t dot = wasm_f32x4_add(
            wasm_f32x4_mul(xs4, vdirX), wasm_f32x4_mul(zs4, vdirZ));
        v128_t phase = wasm_f32x4_add(wasm_f32x4_mul(dot, vfreq), vphase0);
        alignas(16) float phases[4];
        wasm_v128_store(phases, phase);
        out_heights[i]     = amp * std::sin(phases[0]);
        out_heights[i + 1] = amp * std::sin(phases[1]);
        out_heights[i + 2] = amp * std::sin(phases[2]);
        out_heights[i + 3] = amp * std::sin(phases[3]);
    }
#endif
    for (; i < count; ++i) {
        out_heights[i] = dsp_wave_height(
            xs[i], zs[i], time, amp, freq, speed, dirX, dirZ);
    }
}

// ---------------------------------------------------------------------------
// FFT (packed real-to-complex, precomputed tables)
// ---------------------------------------------------------------------------

namespace {

constexpr int FFT_MIN_LOG2 = 1;
constexpr int FFT_MAX_LOG2 = 12;  // N ≤ 4096

struct FftTables {
    std::vector<int> bitrev;
    std::vector<float> tw_re;
    std::vector<float> tw_im;
    std::vector<float> unpack_re;
    std::vector<float> unpack_im;
    bool ready = false;
};

FftTables fft_tables[FFT_MAX_LOG2 + 1];

void ensure_fft_tables(int log2N) {
    FftTables& tables = fft_tables[log2N];
    if (tables.ready) return;

    const int N = 1 << log2N;
    const int M = N / 2;
    const int log2M = log2N - 1;

    tables.bitrev.resize(static_cast<std::size_t>(M));
    for (int i = 0; i < M; ++i) {
        int rev = 0;
        for (int bit = 0; bit < log2M; ++bit) {
            if ((i >> bit) & 1) rev |= 1 << (log2M - 1 - bit);
        }
        tables.bitrev[static_cast<std::size_t>(i)] = rev;
    }

    tables.tw_re.resize(static_cast<std::size_t>(M));
    tables.tw_im.resize(static_cast<std::size_t>(M));
    for (int i = 0; i < M; ++i) {
        const double theta = -2.0 * static_cast<double>(PI) * static_cast<double>(i) /
            static_cast<double>(M);
        tables.tw_re[static_cast<std::size_t>(i)] = static_cast<float>(std::cos(theta));
        tables.tw_im[static_cast<std::size_t>(i)] = static_cast<float>(std::sin(theta));
    }

    tables.unpack_re.resize(static_cast<std::size_t>(M));
    tables.unpack_im.resize(static_cast<std::size_t>(M));
    for (int k = 0; k < M; ++k) {
        const double theta = -2.0 * static_cast<double>(PI) * static_cast<double>(k) /
            static_cast<double>(N);
        tables.unpack_re[static_cast<std::size_t>(k)] = static_cast<float>(std::cos(theta));
        tables.unpack_im[static_cast<std::size_t>(k)] = static_cast<float>(std::sin(theta));
    }

    tables.ready = true;
}

void complex_fft(float* re, float* im, int log2N, const FftTables& tables) {
    const int N = 1 << log2N;
    for (int s = 1; s <= log2N; ++s) {
        const int m = 1 << s;
        const int half = m / 2;
        const int stride = N / m;
        for (int k = 0; k < N; k += m) {
            int j = 0;
#if DSP_HAS_SIMD
            for (; j + 4 <= half; j += 4) {
                const int tw0 = j * stride;
                const int tw1 = (j + 1) * stride;
                const int tw2 = (j + 2) * stride;
                const int tw3 = (j + 3) * stride;
                alignas(16) float wr_lanes[4] = {
                    tables.tw_re[static_cast<std::size_t>(tw0)],
                    tables.tw_re[static_cast<std::size_t>(tw1)],
                    tables.tw_re[static_cast<std::size_t>(tw2)],
                    tables.tw_re[static_cast<std::size_t>(tw3)],
                };
                alignas(16) float wi_lanes[4] = {
                    tables.tw_im[static_cast<std::size_t>(tw0)],
                    tables.tw_im[static_cast<std::size_t>(tw1)],
                    tables.tw_im[static_cast<std::size_t>(tw2)],
                    tables.tw_im[static_cast<std::size_t>(tw3)],
                };
                v128_t wr = wasm_v128_load(wr_lanes);
                v128_t wi = wasm_v128_load(wi_lanes);
                v128_t br = wasm_v128_load(re + k + j + half);
                v128_t bi = wasm_v128_load(im + k + j + half);
                v128_t ur = wasm_v128_load(re + k + j);
                v128_t ui = wasm_v128_load(im + k + j);
                v128_t tr = wasm_f32x4_sub(wasm_f32x4_mul(wr, br), wasm_f32x4_mul(wi, bi));
                v128_t ti = wasm_f32x4_add(wasm_f32x4_mul(wr, bi), wasm_f32x4_mul(wi, br));
                wasm_v128_store(re + k + j, wasm_f32x4_add(ur, tr));
                wasm_v128_store(im + k + j, wasm_f32x4_add(ui, ti));
                wasm_v128_store(re + k + j + half, wasm_f32x4_sub(ur, tr));
                wasm_v128_store(im + k + j + half, wasm_f32x4_sub(ui, ti));
            }
#endif
            for (; j < half; ++j) {
                const int tw = j * stride;
                const float wr = tables.tw_re[static_cast<std::size_t>(tw)];
                const float wi = tables.tw_im[static_cast<std::size_t>(tw)];
                const int hi = k + j + half;
                const int lo = k + j;
                const float t_real = wr * re[hi] - wi * im[hi];
                const float t_imag = wr * im[hi] + wi * re[hi];
                const float u_real = re[lo];
                const float u_imag = im[lo];
                re[lo] = u_real + t_real;
                im[lo] = u_imag + t_imag;
                re[hi] = u_real - t_real;
                im[hi] = u_imag - t_imag;
            }
        }
    }
}

}  // namespace

extern "C" DSP_EXPORT
void dsp_fft_r2c(const float* input, float* out_real, float* out_imag, int log2N) {
    if (!input || !out_real || !out_imag) return;
    if (log2N < FFT_MIN_LOG2 || log2N > FFT_MAX_LOG2) return;

    const int N = 1 << log2N;
    if (log2N == 1) {
        out_real[0] = input[0] + input[1];
        out_imag[0] = 0.0f;
        out_real[1] = input[0] - input[1];
        out_imag[1] = 0.0f;
        return;
    }

    ensure_fft_tables(log2N);
    const FftTables& tables = fft_tables[log2N];
    const int M = N / 2;
    const int log2M = log2N - 1;

    std::vector<float> work_re(static_cast<std::size_t>(M));
    std::vector<float> work_im(static_cast<std::size_t>(M));
    for (int i = 0; i < M; ++i) {
        const int rev = tables.bitrev[static_cast<std::size_t>(i)];
        work_re[static_cast<std::size_t>(rev)] = input[2 * i];
        work_im[static_cast<std::size_t>(rev)] = input[2 * i + 1];
    }

    complex_fft(work_re.data(), work_im.data(), log2M, tables);

    out_real[0] = work_re[0] + work_im[0];
    out_imag[0] = 0.0f;
    out_real[M] = work_re[0] - work_im[0];
    out_imag[M] = 0.0f;

    for (int k = 1; k < M; ++k) {
        const float zr = work_re[static_cast<std::size_t>(k)];
        const float zi = work_im[static_cast<std::size_t>(k)];
        const float znr = work_re[static_cast<std::size_t>(M - k)];
        const float zni = work_im[static_cast<std::size_t>(M - k)];
        const float xr = 0.5f * (zr + znr);
        const float xi = 0.5f * (zi - zni);
        const float yr = 0.5f * (zi + zni);
        const float yi = 0.5f * (znr - zr);
        const float wr = tables.unpack_re[static_cast<std::size_t>(k)];
        const float wi = tables.unpack_im[static_cast<std::size_t>(k)];
        const float re = xr + wr * yr - wi * yi;
        const float im = xi + wr * yi + wi * yr;
        out_real[k] = re;
        out_imag[k] = im;
        out_real[N - k] = re;
        out_imag[N - k] = -im;
    }
}
