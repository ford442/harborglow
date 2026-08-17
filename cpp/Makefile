# =============================================================================
# Makefile — HarborGlow C++ → WebAssembly (Emscripten)
#
# Prerequisites:
#   • Emscripten SDK ≥ 3.1  (https://emscripten.org/docs/getting_started/)
#   • Run `source /path/to/emsdk/emsdk_env.sh` before invoking make
#   • Node.js (export lists are generated from public headers)
#
# Targets:
#   make          — build optimised WASM (output → ../public/wasm/)
#   make debug    — build with DWARF debug info and sanitizers
#   make test     — native assertion harness (host c++)
#   make bench    — native micro-benchmarks
#   make clean    — remove build artifacts
# =============================================================================

CXX        := em++
NATIVE_CXX ?= c++
NATIVE_CC  ?= cc
CORE_SRC   := harborglow_dsp.cpp dsp_ring_buffer.c
AUDIO_SRC  := $(CORE_SRC) harborglow_audio_engine.cpp
HEADER     := harborglow_dsp.h harborglow_audio_engine.h dsp_ring_buffer.h
OUT_DIR    := ../public/wasm
OUT_WASM   := $(OUT_DIR)/harborglow_dsp.wasm
OUT_WASM_SIMD := $(OUT_DIR)/harborglow_dsp_simd.wasm
OUT_AUDIO  := $(OUT_DIR)/harborglow_audio_shared.wasm
OUT_SIMD   := $(OUT_DIR)/harborglow_audio_shared_simd.wasm
EXPORTS_JS := ../scripts/wasm-exports.mjs

# Export lists are parsed from headers (see scripts/wasm-exports.mjs).
# Prefer values passed from build.sh so `make test` never shells out to Node.
CORE_EXPORTED_FUNCTIONS ?= $(shell node $(EXPORTS_JS) --emcc core)
AUDIO_EXPORTED_FUNCTIONS ?= $(shell node $(EXPORTS_JS) --emcc audio)

# INITIAL_MEMORY is 4 MiB: Emscripten reactor + 2048-point FFT scratch +
# 16×16 wave batch + a multi-second room IR without a per-scene heap copy.
# ALLOW_MEMORY_GROWTH remains on; wasmDSP.ts logs growth in DEV.
BASE_FLAGS = \
    -std=c++17 \
    -s WASM=1 \
    -s STANDALONE_WASM=1 \
    --no-entry \
    -s EXPORTED_FUNCTIONS="[$(CORE_EXPORTED_FUNCTIONS)]" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=4194304 \
    -s ENVIRONMENT="web,worker"

SHARED_FLAGS = \
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
all: $(OUT_WASM) $(OUT_WASM_SIMD) $(OUT_AUDIO) $(OUT_SIMD)

$(OUT_WASM): $(CORE_SRC) $(HEADER) $(EXPORTS_JS) | $(OUT_DIR)
	$(CXX) $(CORE_SRC) $(BASE_FLAGS) \
	    -O3 \
	    -flto \
	    -o $(OUT_WASM)
	@echo "✅  Release build → $(OUT_WASM)"

$(OUT_WASM_SIMD): $(CORE_SRC) $(HEADER) $(EXPORTS_JS) | $(OUT_DIR)
	$(CXX) $(CORE_SRC) $(BASE_FLAGS) \
	    -O3 \
	    -flto \
	    -msimd128 \
	    -o $(OUT_WASM_SIMD)
	@echo "✅  SIMD reactor build → $(OUT_WASM_SIMD)"

$(OUT_AUDIO): $(AUDIO_SRC) $(HEADER) $(EXPORTS_JS) | $(OUT_DIR)
	$(CXX) $(AUDIO_SRC) $(SHARED_FLAGS) \
	    -O3 \
	    -flto \
	    -o $(OUT_AUDIO)
	@echo "✅  Shared scalar audio build → $(OUT_AUDIO)"

$(OUT_SIMD): $(AUDIO_SRC) $(HEADER) $(EXPORTS_JS) | $(OUT_DIR)
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
# Native tests / benches (host compiler, no Emscripten)
# ---------------------------------------------------------------------------
TEST_BIN := tests/dsp_native_test
BENCH_BIN := tests/dsp_bench

.PHONY: test
test: $(TEST_BIN)
	./$(TEST_BIN)

$(TEST_BIN): tests/dsp_native_test.cpp harborglow_dsp.cpp dsp_ring_buffer.c $(HEADER)
	mkdir -p tests
	$(NATIVE_CC) -std=c11 -c dsp_ring_buffer.c -o tests/dsp_ring_buffer.o
	$(NATIVE_CXX) -std=c++17 -O2 -I. \
	    tests/dsp_native_test.cpp harborglow_dsp.cpp tests/dsp_ring_buffer.o \
	    -lm -o $(TEST_BIN)

.PHONY: bench
bench: $(BENCH_BIN)
	./$(BENCH_BIN)

$(BENCH_BIN): tests/dsp_bench.cpp harborglow_dsp.cpp dsp_ring_buffer.c $(HEADER)
	mkdir -p tests
	$(NATIVE_CC) -std=c11 -c dsp_ring_buffer.c -o tests/dsp_ring_buffer.o
	$(NATIVE_CXX) -std=c++17 -O3 -I. \
	    tests/dsp_bench.cpp harborglow_dsp.cpp tests/dsp_ring_buffer.o \
	    -lm -o $(BENCH_BIN)

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
$(OUT_DIR):
	mkdir -p $(OUT_DIR)

.PHONY: clean
clean:
	rm -f $(OUT_WASM) $(OUT_WASM_SIMD) $(OUT_AUDIO) $(OUT_SIMD) $(OUT_DIR)/harborglow_dsp.js
	rm -f $(TEST_BIN) $(BENCH_BIN) tests/dsp_ring_buffer.o
	@echo "🧹  Cleaned $(OUT_DIR)"
