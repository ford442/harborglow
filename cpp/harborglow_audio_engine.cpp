#include "harborglow_audio_engine.h"
#include "harborglow_dsp.h"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>

#ifdef __EMSCRIPTEN__
#  include <emscripten.h>
#  define AUDIO_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#  define AUDIO_EXPORT
#endif

namespace {

constexpr float PI = 3.14159265358979f;
constexpr float TWO_PI = 6.28318530717959f;
constexpr int MAX_VOICES = 64;
constexpr int MAX_DELAY_SAMPLES = 192000;
constexpr int MAX_RENDER_BLOCK = 1024;
constexpr int ROOM_IR_CAPACITY = 4096;

enum class EnvelopeStage : std::uint8_t {
    Idle,
    Attack,
    Decay,
    Sustain,
    Release,
};

struct Voice {
    float frequency = 440.0f;
    float velocity = 0.0f;
    float phase = 0.0f;
    float mod_phase = 0.0f;
    float envelope = 0.0f;
    float attack = 0.01f;
    float decay = 0.1f;
    float sustain = 0.7f;
    float release = 0.2f;
    int waveform = 0;
    EnvelopeStage stage = EnvelopeStage::Idle;
    std::uint32_t noise = 1U;
};

std::array<Voice, MAX_VOICES> voices;
std::array<float, MAX_DELAY_SAMPLES> delay_left{};
std::array<float, MAX_DELAY_SAMPLES> delay_right{};
std::array<float, MAX_RENDER_BLOCK> dry_block{};
std::array<float, MAX_RENDER_BLOCK> wet_block{};
std::array<float, ROOM_IR_CAPACITY> room_ir{};

float engine_sample_rate = 48000.0f;
float lowpass_hz = 20000.0f;
float distortion_amount = 0.0f;
int bit_depth = 24;
float delay_seconds = 0.0f;
float delay_feedback = 0.0f;
float chorus_depth = 0.0f;
float room_mix = 0.0f;
int room_preset = 0;
int room_handle = 0;
int delay_cursor = 0;
float filter_left = 0.0f;
float filter_right = 0.0f;
float chorus_phase = 0.0f;
float last_rms = 0.0f;
float last_peak = 0.0f;

float wrap_phase(float phase) {
    phase -= TWO_PI * std::floor(phase / TWO_PI);
    return phase;
}

float next_noise(Voice& voice) {
    voice.noise ^= voice.noise << 13U;
    voice.noise ^= voice.noise >> 17U;
    voice.noise ^= voice.noise << 5U;
    return static_cast<float>(static_cast<std::int32_t>(voice.noise)) /
        2147483648.0f;
}

float oscillator_sample(Voice& voice) {
    const float normalised = voice.phase / TWO_PI;
    switch (voice.waveform) {
        case 1:
            return voice.phase < PI ? 1.0f : -1.0f;
        case 2:
            return normalised * 2.0f - 1.0f;
        case 3:
            return 1.0f - 4.0f * std::fabs(normalised - 0.5f);
        case 4:
            return normalised < 0.2f ? 1.0f : -1.0f;
        case 5:
            return next_noise(voice);
        case 6:
            return std::sin(voice.phase + std::sin(voice.mod_phase) * 5.0f);
        case 7:
            return std::sin(voice.phase) +
                std::sin(voice.phase * 2.01f) * 0.16f;
        case 8:
            return (std::sin(voice.phase * 5.1f) +
                std::sin(voice.phase * 7.13f) +
                std::sin(voice.phase * 9.17f)) * 0.28f;
        case 9:
            return (std::sin(voice.phase) +
                std::sin(voice.phase * 0.994f) +
                std::sin(voice.phase * 1.006f)) / 3.0f;
        default:
            return std::sin(voice.phase);
    }
}

float advance_envelope(Voice& voice) {
    const float sample_rate = std::max(engine_sample_rate, 1.0f);
    switch (voice.stage) {
        case EnvelopeStage::Attack:
            voice.envelope += 1.0f / (std::max(voice.attack, 0.0001f) * sample_rate);
            if (voice.envelope >= 1.0f) {
                voice.envelope = 1.0f;
                voice.stage = EnvelopeStage::Decay;
            }
            break;
        case EnvelopeStage::Decay:
            voice.envelope -= (1.0f - voice.sustain) /
                (std::max(voice.decay, 0.0001f) * sample_rate);
            if (voice.envelope <= voice.sustain) {
                voice.envelope = voice.sustain;
                voice.stage = EnvelopeStage::Sustain;
            }
            break;
        case EnvelopeStage::Release:
            voice.envelope -= 1.0f /
                (std::max(voice.release, 0.0001f) * sample_rate);
            if (voice.envelope <= 0.0f) {
                voice.envelope = 0.0f;
                voice.stage = EnvelopeStage::Idle;
            }
            break;
        case EnvelopeStage::Idle:
            return 0.0f;
        case EnvelopeStage::Sustain:
            break;
    }
    return voice.envelope;
}

void rebuild_room() {
    if (room_handle) {
        dsp_convolver_destroy(room_handle);
        room_handle = 0;
    }
    if (room_preset <= 0 || room_mix <= 0.0f) {
        return;
    }
    const int length = dsp_generate_room_ir(
        room_ir.data(), ROOM_IR_CAPACITY, room_preset, engine_sample_rate,
        0x48415242U + static_cast<unsigned>(room_preset));
    if (length > 0) {
        room_handle = dsp_convolver_create(room_ir.data(), length);
    }
}

}  // namespace

extern "C" AUDIO_EXPORT
int dsp_audio_engine_init(float sample_rate) {
    if (sample_rate < 8000.0f || sample_rate > 192000.0f) {
        return 0;
    }
    engine_sample_rate = sample_rate;
    dsp_audio_engine_stop_all();
    std::fill(delay_left.begin(), delay_left.end(), 0.0f);
    std::fill(delay_right.begin(), delay_right.end(), 0.0f);
    delay_cursor = 0;
    filter_left = filter_right = 0.0f;
    rebuild_room();
    return 1;
}

extern "C" AUDIO_EXPORT
void dsp_audio_engine_note_on(
        int voice_id, float frequency, float velocity, int waveform,
        float attack, float decay, float sustain, float release) {
    if (voice_id < 0 || voice_id >= MAX_VOICES || frequency <= 0.0f) {
        return;
    }
    Voice& voice = voices[static_cast<std::size_t>(voice_id)];
    voice.frequency = frequency;
    voice.velocity = std::clamp(velocity, 0.0f, 1.0f);
    voice.waveform = waveform;
    voice.attack = std::max(attack, 0.0001f);
    voice.decay = std::max(decay, 0.0001f);
    voice.sustain = std::clamp(sustain, 0.0f, 1.0f);
    voice.release = std::max(release, 0.0001f);
    voice.phase = 0.0f;
    voice.mod_phase = 0.0f;
    voice.envelope = 0.0f;
    voice.stage = EnvelopeStage::Attack;
    voice.noise = 0x9e3779b9U ^ static_cast<std::uint32_t>(voice_id + 1);
}

extern "C" AUDIO_EXPORT
void dsp_audio_engine_note_off(int voice_id) {
    if (voice_id >= 0 && voice_id < MAX_VOICES) {
        Voice& voice = voices[static_cast<std::size_t>(voice_id)];
        if (voice.stage != EnvelopeStage::Idle) {
            voice.stage = EnvelopeStage::Release;
        }
    }
}

extern "C" AUDIO_EXPORT
void dsp_audio_engine_set_effects(
        float requested_lowpass_hz, float requested_distortion, int requested_bit_depth,
        float requested_delay_seconds, float requested_delay_feedback,
        float requested_chorus_depth, int requested_room_preset,
        float requested_room_mix) {
    lowpass_hz = std::clamp(requested_lowpass_hz, 20.0f, engine_sample_rate * 0.49f);
    distortion_amount = std::clamp(requested_distortion, 0.0f, 1.0f);
    bit_depth = std::clamp(requested_bit_depth, 2, 24);
    delay_seconds = std::clamp(requested_delay_seconds, 0.0f, 2.0f);
    delay_feedback = std::clamp(requested_delay_feedback, 0.0f, 0.95f);
    chorus_depth = std::clamp(requested_chorus_depth, 0.0f, 1.0f);
    requested_room_preset = std::clamp(requested_room_preset, 0, 4);
    requested_room_mix = std::clamp(requested_room_mix, 0.0f, 1.0f);
    const bool room_changed =
        requested_room_preset != room_preset || requested_room_mix != room_mix;
    room_preset = requested_room_preset;
    room_mix = requested_room_mix;
    if (room_changed) {
        rebuild_room();
    }
}

extern "C" AUDIO_EXPORT
void dsp_audio_engine_render(float* out_left, float* out_right, int frame_count) {
    if (!out_left || !out_right || frame_count <= 0) {
        return;
    }

    float sum_squares = 0.0f;
    float peak = 0.0f;
    int rendered = 0;
    while (rendered < frame_count) {
        const int block = std::min(MAX_RENDER_BLOCK, frame_count - rendered);
        for (int frame = 0; frame < block; ++frame) {
            float mixed = 0.0f;
            for (Voice& voice : voices) {
                const float envelope = advance_envelope(voice);
                if (envelope <= 0.0f) {
                    continue;
                }
                mixed += oscillator_sample(voice) * envelope * voice.velocity * 0.16f;
                voice.phase = wrap_phase(
                    voice.phase + TWO_PI * voice.frequency / engine_sample_rate);
                voice.mod_phase = wrap_phase(
                    voice.mod_phase + TWO_PI * voice.frequency * 3.0f /
                    engine_sample_rate);
            }
            dry_block[static_cast<std::size_t>(frame)] = mixed;
        }

        if (room_handle && room_mix > 0.0f) {
            dsp_convolver_process(
                room_handle, dry_block.data(), wet_block.data(), block);
        } else {
            std::fill(wet_block.begin(), wet_block.begin() + block, 0.0f);
        }

        const float filter_coefficient = 1.0f -
            std::exp(-TWO_PI * lowpass_hz / engine_sample_rate);
        const int base_delay = std::clamp(
            static_cast<int>(delay_seconds * engine_sample_rate),
            1, MAX_DELAY_SAMPLES - 1024);
        const float quantisation = static_cast<float>(1U << std::min(bit_depth, 23));

        for (int frame = 0; frame < block; ++frame) {
            const float chorus_offset = chorus_depth * 0.004f * engine_sample_rate *
                (0.5f + 0.5f * std::sin(chorus_phase));
            chorus_phase = wrap_phase(chorus_phase + TWO_PI * 0.8f / engine_sample_rate);
            const int delay_samples = std::clamp(
                base_delay + static_cast<int>(chorus_offset),
                1, MAX_DELAY_SAMPLES - 1);
            const int read = (delay_cursor - delay_samples + MAX_DELAY_SAMPLES) %
                MAX_DELAY_SAMPLES;

            float left = dry_block[static_cast<std::size_t>(frame)] +
                wet_block[static_cast<std::size_t>(frame)] * room_mix +
                delay_left[static_cast<std::size_t>(read)];
            float right = dry_block[static_cast<std::size_t>(frame)] +
                wet_block[static_cast<std::size_t>(frame)] * room_mix +
                delay_right[static_cast<std::size_t>(read)];

            filter_left += filter_coefficient * (left - filter_left);
            filter_right += filter_coefficient * (right - filter_right);
            left = filter_left;
            right = filter_right;
            if (distortion_amount > 0.0f) {
                const float drive = 1.0f + distortion_amount * 12.0f;
                left = std::tanh(left * drive) / std::tanh(drive);
                right = std::tanh(right * drive) / std::tanh(drive);
            }
            if (bit_depth < 24) {
                left = std::round(left * quantisation) / quantisation;
                right = std::round(right * quantisation) / quantisation;
            }

            delay_left[static_cast<std::size_t>(delay_cursor)] =
                dry_block[static_cast<std::size_t>(frame)] +
                delay_right[static_cast<std::size_t>(read)] * delay_feedback;
            delay_right[static_cast<std::size_t>(delay_cursor)] =
                dry_block[static_cast<std::size_t>(frame)] +
                delay_left[static_cast<std::size_t>(read)] * delay_feedback;
            delay_cursor = (delay_cursor + 1) % MAX_DELAY_SAMPLES;

            left = std::clamp(left, -1.0f, 1.0f);
            right = std::clamp(right, -1.0f, 1.0f);
            out_left[rendered + frame] = left;
            out_right[rendered + frame] = right;
            const float mono = (left + right) * 0.5f;
            sum_squares += mono * mono;
            peak = std::max(peak, std::fabs(mono));
        }
        rendered += block;
    }

    last_rms = std::sqrt(sum_squares / static_cast<float>(frame_count));
    last_peak = peak;
}

extern "C" AUDIO_EXPORT
void dsp_audio_engine_stop_all(void) {
    for (Voice& voice : voices) {
        voice.stage = EnvelopeStage::Idle;
        voice.envelope = 0.0f;
    }
}

extern "C" AUDIO_EXPORT
float dsp_audio_engine_rms(void) {
    return last_rms;
}

extern "C" AUDIO_EXPORT
float dsp_audio_engine_peak(void) {
    return last_peak;
}
