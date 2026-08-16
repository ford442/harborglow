# =============================================================================
# Makefile — HarborGlow C++ → WebAssembly (Emscripten)
#
# Prerequisites:
#   • Emscripten SDK ≥ 3.1  (https://emscripten.org/docs/getting_started/)
#   • Run `source /path/to/emsdk/emsdk_env.sh` before invoking make
#
# Targets:
#   make          — build optimised WASM (output → ../public/wasm/)
#   make debug    — build with DWARF debug info and sanitizers
#   make clean    — remove build artifacts
# =============================================================================

CXX        := em++
CORE_SRC   := harborglow_dsp.cpp dsp_ring_buffer.c
AUDIO_SRC  := $(CORE_SRC) harborglow_audio_engine.cpp
HEADER     := harborglow_dsp.h harborglow_audio_engine.h dsp_ring_buffer.h
OUT_DIR    := ../public/wasm
OUT_WASM   := $(OUT_DIR)/harborglow_dsp.wasm
OUT_AUDIO  := $(OUT_DIR)/harborglow_audio_shared.wasm
OUT_SIMD   := $(OUT_DIR)/harborglow_audio_shared_simd.wasm

# Exported C functions (keep in sync with harborglow_dsp.h)
CORE_EXPORTS := \
    _malloc \
    _free \
    _dsp_mix \
    _dsp_clamp \
    _dsp_remap \
    _dsp_smooth_step \
    _dsp_smoother_step \
    _dsp_sin_approx \
    _dsp_sin_full \
    _dsp_wave_height \
    _dsp_wave_height_batch \
    _dsp_additive_synth_sample \
    _dsp_additive_block \
    _dsp_audio_rms \
    _dsp_fft_r2c \
    _dsp_convolver_create \
    _dsp_convolver_process \
    _dsp_convolver_reset \
    _dsp_convolver_destroy \
    _dsp_generate_room_ir \
    _dsp_ring_required_bytes \
    _dsp_ring_data_offset \
    _dsp_ring_read_offset \
    _dsp_ring_write_offset \
    _dsp_ring_overflow_offset \
    _dsp_ring_init \
    _dsp_ring_push \
    _dsp_ring_pop \
    _dsp_ring_size \
    _dsp_ring_overflow_count \
    _dsp_ring_reset

AUDIO_EXPORTS := $(CORE_EXPORTS) \
    _dsp_audio_engine_init \
    _dsp_audio_engine_note_on \
    _dsp_audio_engine_note_off \
    _dsp_audio_engine_set_effects \
    _dsp_audio_engine_render \
    _dsp_audio_engine_stop_all \
    _dsp_audio_engine_rms \
    _dsp_audio_engine_peak

CORE_EXPORTED_FUNCTIONS := $(shell echo $(CORE_EXPORTS) | tr ' ' ',')
AUDIO_EXPORTED_FUNCTIONS := $(shell echo $(AUDIO_EXPORTS) | tr ' ' ',')

# Common flags
# STANDALONE_WASM + --no-entry produces a raw .wasm loadable via
# WebAssembly.instantiate (see src/systems/wasmDSP.ts). Requires a single env
# import stub: emscripten_notify_memory_growth. MODULARIZE glue is not used.
# INITIAL_MEMORY must cover Emscripten runtime + batch float buffers.
BASE_FLAGS := \
    -std=c++17 \
    -s WASM=1 \
    -s STANDALONE_WASM=1 \
    --no-entry \
    -s EXPORTED_FUNCTIONS="[$(CORE_EXPORTED_FUNCTIONS)]" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=262144 \
    -s ENVIRONMENT="web,worker"

SHARED_FLAGS := \
    -std=c++17 \
    -s WASM=1 \
    -s STANDALONE_WASM=1 \
    --no-entry \
    -s EXPORTED_FUNCTIONS="[$(AUDIO_EXPORTED_FUNCTIONS)]" \
    -s IMPORTED_MEMORY=1 \
    -s ALLOW_MEMORY_GROWTH=0 \
    -s INITIAL_MEMORY=33554432 \
    -s MAXIMUM_MEMORY=33554432 \
    -s ENVIRONMENT="web,worker" \
    -pthread \
    -s PTHREAD_POOL_SIZE=0 \
    -matomics \
    -mbulk-memory \
    -Wl,--shared-memory

# ---------------------------------------------------------------------------
# Release build (default)
# ---------------------------------------------------------------------------
.PHONY: all
all: $(OUT_WASM) $(OUT_AUDIO) $(OUT_SIMD)

$(OUT_WASM): $(CORE_SRC) $(HEADER) | $(OUT_DIR)
	$(CXX) $(CORE_SRC) $(BASE_FLAGS) \
	    -O3 \
	    -flto \
	    -o $(OUT_WASM)
	@echo "✅  Release build → $(OUT_WASM)"

$(OUT_AUDIO): $(AUDIO_SRC) $(HEADER) | $(OUT_DIR)
	$(CXX) $(AUDIO_SRC) $(SHARED_FLAGS) \
	    -O3 \
	    -flto \
	    -o $(OUT_AUDIO)
	@echo "✅  Shared scalar audio build → $(OUT_AUDIO)"

$(OUT_SIMD): $(AUDIO_SRC) $(HEADER) | $(OUT_DIR)
	$(CXX) $(AUDIO_SRC) $(SHARED_FLAGS) \
	    -O3 \
	    -flto \
	    -msimd128 \
	    -mrelaxed-simd \
	    -o $(OUT_SIMD)
	@echo "✅  Shared SIMD audio build → $(OUT_SIMD)"

# ---------------------------------------------------------------------------
# Debug build
# ---------------------------------------------------------------------------
.PHONY: debug
debug: $(OUT_DIR)
	$(CXX) $(CORE_SRC) $(BASE_FLAGS) \
	    -O0 -g \
	    -s ASSERTIONS=2 \
	    -s SAFE_HEAP=1 \
	    -fsanitize=address \
	    -o $(OUT_WASM)
	@echo "🐞  Debug build → $(OUT_WASM)"

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
$(OUT_DIR):
	mkdir -p $(OUT_DIR)

.PHONY: clean
clean:
	rm -f $(OUT_WASM) $(OUT_AUDIO) $(OUT_SIMD) $(OUT_DIR)/harborglow_dsp.js
	@echo "🧹  Cleaned $(OUT_DIR)"
