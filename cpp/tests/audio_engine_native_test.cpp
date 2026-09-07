#include "harborglow_audio_engine.h"
#include "harborglow_dsp.h"

#include <cmath>
#include <cstdio>
#include <vector>

namespace {

int failures = 0;

void expect_true(const char* label, bool condition) {
    if (!condition) {
        std::fprintf(stderr, "FAIL %s\n", label);
        ++failures;
    }
}

void expect_near(const char* label, float actual, float expected, float tolerance) {
    if (!(std::fabs(actual - expected) <= tolerance)) {
        std::fprintf(stderr, "FAIL %s: expected %g, got %g (tol %g)\n",
            label, expected, actual, tolerance);
        ++failures;
    }
}

bool rms_sane(float rms) {
    return std::isfinite(rms) && rms > 1e-4f && rms <= 1.5f;
}

}  // namespace

int main() {
    expect_true("init", dsp_audio_engine_init(48000.0f) == 1);
    dsp_audio_engine_note_on(0, 440.0f, 0.9f, 0, 0.001f, 0.05f, 0.8f, 0.05f);

    std::vector<float> left(512);
    std::vector<float> right(512);
    dsp_audio_engine_render(left.data(), right.data(), 512);

    const float buf_rms_l = dsp_audio_rms(left.data(), 512);
    const float buf_rms_r = dsp_audio_rms(right.data(), 512);
    expect_true("note-on left rms sane", rms_sane(buf_rms_l));
    expect_true("note-on right rms sane", rms_sane(buf_rms_r));
    expect_true("note-on non-silent", buf_rms_l > 0.001f && buf_rms_r > 0.001f);

    const float rms_on = dsp_audio_engine_rms();
    const float peak_on = dsp_audio_engine_peak();
    expect_true("engine rms finite", std::isfinite(rms_on) && rms_sane(rms_on));
    expect_true("engine peak finite",
        std::isfinite(peak_on) && peak_on > 0.0f && peak_on <= 1.0f);

    dsp_audio_engine_note_off(0);
    dsp_audio_engine_render(left.data(), right.data(), 512);
    dsp_audio_engine_stop_all();
    dsp_audio_engine_render(left.data(), right.data(), 512);
    dsp_audio_engine_render(left.data(), right.data(), 512);
    expect_near("stop-all rms", dsp_audio_engine_rms(), 0.0f, 1e-4f);

    if (failures) {
        std::fprintf(stderr, "%d assertion(s) failed\n", failures);
        return 1;
    }
    std::puts("audio_engine_native_test: OK");
    return 0;
}
