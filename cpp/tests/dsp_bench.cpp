#include "harborglow_dsp.h"

#include <chrono>
#include <cmath>
#include <cstdio>
#include <vector>

namespace {

double now_us() {
    using clock = std::chrono::steady_clock;
    return std::chrono::duration<double, std::micro>(clock::now().time_since_epoch()).count();
}

}  // namespace

int main() {
    constexpr int batch_count = 256;
    constexpr int rms_count = 1024;
    constexpr int log2n = 11;  // 2048
    constexpr int fft_n = 1 << log2n;
    constexpr int iters = 400;

    std::vector<float> xs(batch_count);
    std::vector<float> zs(batch_count);
    std::vector<float> heights(batch_count);
    std::vector<float> audio(rms_count);
    std::vector<float> fft_in(fft_n);
    std::vector<float> fft_re(fft_n);
    std::vector<float> fft_im(fft_n);

    for (int i = 0; i < batch_count; ++i) {
        xs[static_cast<std::size_t>(i)] = static_cast<float>(i) * 0.37f;
        zs[static_cast<std::size_t>(i)] = static_cast<float>(i) * 0.11f;
    }
    for (int i = 0; i < rms_count; ++i) {
        audio[static_cast<std::size_t>(i)] = std::sin(0.015f * static_cast<float>(i));
    }
    for (int i = 0; i < fft_n; ++i) {
        fft_in[static_cast<std::size_t>(i)] = std::sin(0.02f * static_cast<float>(i));
    }

    dsp_wave_height_batch(xs.data(), zs.data(), 1.0f, 0.8f, 0.4f, 1.2f, 0.6f, 0.8f,
        heights.data(), batch_count);
    dsp_audio_rms(audio.data(), rms_count);
    dsp_fft_r2c(fft_in.data(), fft_re.data(), fft_im.data(), log2n);

    const double t0 = now_us();
    for (int n = 0; n < iters; ++n) {
        dsp_wave_height_batch(xs.data(), zs.data(), 1.0f, 0.8f, 0.4f, 1.2f, 0.6f, 0.8f,
            heights.data(), batch_count);
    }
    const double wave_us = (now_us() - t0) / iters;

    const double t1 = now_us();
    for (int n = 0; n < iters; ++n) {
        dsp_audio_rms(audio.data(), rms_count);
    }
    const double rms_us = (now_us() - t1) / iters;

    const double t2 = now_us();
    for (int n = 0; n < iters; ++n) {
        dsp_fft_r2c(fft_in.data(), fft_re.data(), fft_im.data(), log2n);
    }
    const double fft_us = (now_us() - t2) / iters;

    std::printf("native scalar (host c++ -O3)\n");
    std::printf("  wave_height_batch n=%d:  %.3f µs/call\n", batch_count, wave_us);
    std::printf("  audio_rms n=%d:          %.3f µs/call\n", rms_count, rms_us);
    std::printf("  fft_r2c N=%d:            %.3f µs/call\n", fft_n, fft_us);
    return 0;
}
