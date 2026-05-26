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
SRC        := harborglow_dsp.cpp
HEADER     := harborglow_dsp.h
OUT_DIR    := ../public/wasm
OUT_WASM   := $(OUT_DIR)/harborglow_dsp.wasm
OUT_JS     := $(OUT_DIR)/harborglow_dsp.js

# Exported C functions (keep in sync with harborglow_dsp.h)
EXPORTS := \
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
    _dsp_audio_rms

EXPORTED_FUNCTIONS := $(shell echo $(EXPORTS) | tr ' ' ',')

# Common flags
BASE_FLAGS := \
    -std=c++17 \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="HarborGlowDSP" \
    -s EXPORTED_FUNCTIONS="[$(EXPORTED_FUNCTIONS)]" \
    -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall']" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=65536 \
    -s ENVIRONMENT="web,worker" \
    -s NO_EXIT_RUNTIME=1

# ---------------------------------------------------------------------------
# Release build (default)
# ---------------------------------------------------------------------------
.PHONY: all
all: $(OUT_WASM)

$(OUT_WASM): $(SRC) $(HEADER) | $(OUT_DIR)
	$(CXX) $(SRC) $(BASE_FLAGS) \
	    -O3 \
	    -flto \
	    --closure 1 \
	    -o $(OUT_JS)
	@echo "✅  Release build → $(OUT_WASM)"

# ---------------------------------------------------------------------------
# Debug build
# ---------------------------------------------------------------------------
.PHONY: debug
debug: $(OUT_DIR)
	$(CXX) $(SRC) $(BASE_FLAGS) \
	    -O0 -g \
	    -s ASSERTIONS=2 \
	    -s SAFE_HEAP=1 \
	    -fsanitize=address \
	    -o $(OUT_JS)
	@echo "🐞  Debug build → $(OUT_WASM)"

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
$(OUT_DIR):
	mkdir -p $(OUT_DIR)

.PHONY: clean
clean:
	rm -f $(OUT_WASM) $(OUT_JS)
	@echo "🧹  Cleaned $(OUT_DIR)"
