#include "harborglow_audio_engine.h"
#include "harborglow_dsp.h"
#include "dsp_ring_buffer.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
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

// Mirror of the v2 wire record (harborglow_audio_engine.h). The size check in
// main() fails if the engine's layout moves without this test.
struct Command {
    std::int32_t type = 0;
    std::int32_t voice_id = 0;
    float frequency = 0.0f;
    float velocity = 0.0f;
    std::int32_t waveform = 0;
    float attack = 0.01f;
    float decay = 0.1f;
    float sustain = 0.7f;
    float release = 0.2f;
    float lowpass_hz = 20000.0f;
    float distortion = 0.0f;
    std::int32_t bit_depth = 24;
    float delay_seconds = 0.0f;
    float delay_feedback = 0.0f;
    float chorus_depth = 0.0f;
    std::uint8_t room_preset = 0;
    std::uint8_t room_mix = 0;
    std::uint8_t reserved_a[2] = {0, 0};
    double frame = 0.0;
    std::uint32_t note_id = 0;
    std::uint32_t reserved_b = 0;
};

constexpr int QUANTUM = 128;

Command note_on(int voice_id, double frame, std::uint32_t note_id = 0) {
    Command command;
    command.type = 1;
    command.voice_id = voice_id;
    command.frequency = 440.0f;
    command.velocity = 1.0f;
    command.waveform = 1;  // square: full-scale from the first sample
    command.attack = 0.0001f;
    command.decay = 0.002f;
    command.sustain = 0.0f;
    command.release = 0.001f;
    command.frame = frame;
    command.note_id = note_id;
    return command;
}

Command note_off(int voice_id, double frame, std::uint32_t note_id) {
    Command command;
    command.type = 2;
    command.voice_id = voice_id;
    command.frame = frame;
    command.note_id = note_id;
    return command;
}

/** Render `frames` in 128-frame quanta through the scheduled path. */
void process_quanta(std::vector<float>& left, std::vector<float>& right,
        double& frame, int frames) {
    left.resize(static_cast<std::size_t>(frames));
    right.resize(static_cast<std::size_t>(frames));
    for (int offset = 0; offset < frames; offset += QUANTUM) {
        dsp_audio_engine_process(left.data() + offset, right.data() + offset,
            std::min(QUANTUM, frames - offset), frame);
        frame += std::min(QUANTUM, frames - offset);
    }
}

// 1,000 sixteenth notes at 140 BPM, fed through the shared-memory ring with a
// 100 ms look-ahead the way transport.ts does, while the "main thread" stalls
// on a pseudo-random subset of quanta. Every onset must land on its frame.
void test_scheduled_onsets() {
    dsp_audio_engine_init(48000.0f);
    const int notes = 1000;
    const double frames_per_step = 48000.0 * 60.0 / 140.0 / 4.0;
    const double first = 1000.3;
    const double lookahead = 4800.0;
    std::vector<double> targets;
    for (int i = 0; i < notes; ++i) {
        targets.push_back(std::floor(first + i * frames_per_step + 0.5));
    }

    const std::uint32_t capacity = 1024;
    const std::size_t ring_bytes = dsp_ring_required_bytes(capacity, 80);
    void* ring = std::calloc(1, ring_bytes);
    expect_true("onset ring init", dsp_ring_init(ring, capacity, 80) == 1);

    const int total = static_cast<int>(targets.back()) + 4 * QUANTUM;
    std::vector<float> left(static_cast<std::size_t>(total));
    std::vector<float> right(static_cast<std::size_t>(total));
    std::uint32_t seed = 0x2468ace1U;
    int next = 0;
    for (int start = 0; start < total; start += QUANTUM) {
        seed ^= seed << 13U;
        seed ^= seed >> 17U;
        seed ^= seed << 5U;
        const bool stalled = seed % 5U == 0U;  // pump missed this quantum
        if (!stalled) {
            // Push each look-ahead batch newest-first to exercise the sorted insert.
            int end = next;
            while (end < notes && targets[static_cast<std::size_t>(end)] < start + lookahead) {
                ++end;
            }
            for (int i = end - 1; i >= next; --i) {
                const Command command = note_on(i % 64, targets[static_cast<std::size_t>(i)]);
                dsp_ring_push(ring, &command);
            }
            next = end;
        }
        dsp_audio_engine_drain(ring);
        const int count = std::min(QUANTUM, total - start);
        dsp_audio_engine_process(left.data() + start, right.data() + start, count, start);
    }
    std::free(ring);

    std::vector<int> onsets;
    int quiet = 1000;
    for (int i = 0; i < total; ++i) {
        const float level = std::fabs(left[static_cast<std::size_t>(i)]);
        if (level > 1e-3f && quiet >= 1000) {
            onsets.push_back(i);
        }
        quiet = level < 1e-4f ? quiet + 1 : 0;
    }
    expect_true("onset count", onsets.size() == targets.size());
    int worst = 0;
    for (std::size_t i = 0; i < std::min(onsets.size(), targets.size()); ++i) {
        worst = std::max(worst,
            std::abs(onsets[i] - static_cast<int>(targets[i])));
    }
    if (worst > 1) {
        std::fprintf(stderr, "FAIL onset jitter: worst %d frames\n", worst);
        ++failures;
    }
    expect_true("queue drained", dsp_audio_engine_pending() == 0);
}

void test_note_id_guard() {
    dsp_audio_engine_init(48000.0f);
    Command on = note_on(3, 256.0, 7);
    on.waveform = 0;
    on.sustain = 1.0f;
    on.release = 0.001f;
    const Command stale_off = note_off(3, 512.0, 6);
    const Command off = note_off(3, 1024.0, 7);
    dsp_audio_engine_enqueue(&on);
    dsp_audio_engine_enqueue(&stale_off);
    dsp_audio_engine_enqueue(&off);

    std::vector<float> left;
    std::vector<float> right;
    double frame = 0.0;
    process_quanta(left, right, frame, 2048);
    const float before = dsp_audio_rms(left.data(), 256);
    const float held = dsp_audio_rms(left.data() + 640, 256);
    const float released = dsp_audio_rms(left.data() + 1536, 256);
    expect_true("silent before scheduled note-on", before < 1e-6f);
    expect_true("stale note-off ignored", held > 0.01f);
    expect_true("matching note-off releases", released < 1e-4f);
}

void test_stop_all_drops_queue() {
    dsp_audio_engine_init(48000.0f);
    const Command on = note_on(0, 2000.0);
    dsp_audio_engine_enqueue(&on);
    expect_true("queued", dsp_audio_engine_pending() == 1);
    Command stop;
    stop.type = 3;
    dsp_audio_engine_enqueue(&stop);
    expect_true("stop-all empties queue", dsp_audio_engine_pending() == 0);
    std::vector<float> left;
    std::vector<float> right;
    double frame = 0.0;
    process_quanta(left, right, frame, 4096);
    expect_true("stop-all silences scheduled notes",
        dsp_audio_rms(left.data(), 4096) < 1e-6f);
}

void test_queue_backpressure() {
    dsp_audio_engine_init(48000.0f);
    const Command on = note_on(0, 1.0e9);
    int accepted = 0;
    for (int i = 0; i < 1100; ++i) {
        accepted += dsp_audio_engine_enqueue(&on);
    }
    expect_true("queue caps at 1024", accepted == 1024);
    dsp_audio_engine_init(48000.0f);
    expect_true("init clears queue", dsp_audio_engine_pending() == 0);
}

}  // namespace

int main() {
    expect_true("protocol v2", dsp_audio_engine_protocol_version() == 2);
    expect_true("command record size",
        dsp_audio_engine_command_bytes() == static_cast<int>(sizeof(Command)));
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

    test_scheduled_onsets();
    test_note_id_guard();
    test_stop_all_drops_queue();
    test_queue_backpressure();

    if (failures) {
        std::fprintf(stderr, "%d assertion(s) failed\n", failures);
        return 1;
    }
    std::puts("audio_engine_native_test: OK");
    return 0;
}
