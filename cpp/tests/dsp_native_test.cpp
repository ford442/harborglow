#include "harborglow_dsp.h"

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <vector>

namespace {

int failures = 0;

void expect_near(const char* label, float actual, float expected, float tolerance) {
    if (!(std::fabs(actual - expected) <= tolerance)) {
        std::fprintf(stderr, "FAIL %s: expected %g, got %g (tol %g)\n",
            label, expected, actual, tolerance);
        ++failures;
    }
}

void expect_true(const char* label, bool condition) {
    if (!condition) {
        std::fprintf(stderr, "FAIL %s\n", label);
        ++failures;
    }
}

void naive_dft(const float* input, int n, float* out_re, float* out_im) {
    const double two_pi = 6.283185307179586;
    for (int k = 0; k < n; ++k) {
        double sum_re = 0.0;
        double sum_im = 0.0;
        for (int index = 0; index < n; ++index) {
            const double theta = -two_pi * static_cast<double>(k) *
                static_cast<double>(index) / static_cast<double>(n);
            sum_re += static_cast<double>(input[index]) * std::cos(theta);
            sum_im += static_cast<double>(input[index]) * std::sin(theta);
        }
        out_re[k] = static_cast<float>(sum_re);
        out_im[k] = static_cast<float>(sum_im);
    }
}

}  // namespace

int main() {
    expect_near("mix", dsp_mix(10.0f, 20.0f, 0.5f), 15.0f, 1e-6f);
    expect_near("clamp lo", dsp_clamp(-2.0f, 0.0f, 1.0f), 0.0f, 0.0f);
    expect_near("clamp hi", dsp_clamp(4.0f, 0.0f, 1.0f), 1.0f, 0.0f);
    expect_near("remap", dsp_remap(0.5f, 0.0f, 1.0f, 0.0f, 100.0f), 50.0f, 1e-5f);
    expect_near("smoothstep 0.5", dsp_smooth_step(0.5f), 0.5f, 1e-6f);
    expect_near("smootherstep 0.5", dsp_smoother_step(0.5f), 0.5f, 1e-6f);
    expect_near("sin_approx pi/2", dsp_sin_approx(1.57079632679f), 1.0f, 2e-3f);
    expect_near("sin_full 0", dsp_sin_full(0.0f), 0.0f, 2e-3f);

    const float height = dsp_wave_height(
        1.57079632679f, 0.0f, 0.0f, 2.5f, 1.0f, 0.0f, 1.0f, 0.0f);
    expect_near("wave_height", height, 2.5f, 1e-5f);

    float xs[4] = {0.0f, 1.0f, 2.0f, 3.0f};
    float zs[4] = {0.0f, 0.0f, 0.0f, 0.0f};
    float batch[4] = {};
    dsp_wave_height_batch(xs, zs, 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f, batch, 4);
    for (int i = 0; i < 4; ++i) {
        expect_near("batch", batch[i], dsp_wave_height(
            xs[i], zs[i], 0.0f, 1.0f, 1.0f, 0.0f, 1.0f, 0.0f), 1e-6f);
    }

    float ones[8];
    for (int i = 0; i < 8; ++i) ones[i] = 1.0f;
    expect_near("rms ones", dsp_audio_rms(ones, 8), 1.0f, 1e-6f);
    expect_near("rms empty", dsp_audio_rms(ones, 0), 0.0f, 0.0f);

    const int log2n = 3;
    const int n = 1 << log2n;
    std::vector<float> input(n);
    std::vector<float> re(n);
    std::vector<float> im(n);
    std::vector<float> naive_re(n);
    std::vector<float> naive_im(n);
    for (int i = 0; i < n; ++i) {
        input[static_cast<std::size_t>(i)] = (i % 3 == 0) ? 1.0f : 0.25f * static_cast<float>(i);
    }
    dsp_fft_r2c(input.data(), re.data(), im.data(), log2n);
    naive_dft(input.data(), n, naive_re.data(), naive_im.data());
    for (int k = 0; k < n; ++k) {
        char label[32];
        std::snprintf(label, sizeof(label), "fft re[%d]", k);
        expect_near(label, re[static_cast<std::size_t>(k)],
            naive_re[static_cast<std::size_t>(k)], 1e-4f);
        std::snprintf(label, sizeof(label), "fft im[%d]", k);
        expect_near(label, im[static_cast<std::size_t>(k)],
            naive_im[static_cast<std::size_t>(k)], 1e-4f);
    }
    expect_true("hermitian dc imag", std::fabs(im[0]) < 1e-5f);
    expect_true("hermitian nyquist imag", std::fabs(im[n / 2]) < 1e-5f);

    const int log2n2 = 1;
    float pair[2] = {3.0f, 1.0f};
    float pair_re[2] = {};
    float pair_im[2] = {};
    dsp_fft_r2c(pair, pair_re, pair_im, log2n2);
    expect_near("n=2 dc", pair_re[0], 4.0f, 1e-6f);
    expect_near("n=2 nyquist", pair_re[1], 2.0f, 1e-6f);

    if (failures) {
        std::fprintf(stderr, "%d assertion(s) failed\n", failures);
        return 1;
    }
    std::puts("dsp_native_test: OK");
    return 0;
}
