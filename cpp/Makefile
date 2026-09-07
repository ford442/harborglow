# =============================================================================
# Makefile — HarborGlow C++ → WebAssembly (Emscripten)
#
# Prerequisites:
#   • Emscripten SDK ≥ 3.1  (https://emscripten.org/docs/getting_started/)
#   • Run `source /path/to/emsdk/emsdk_env.sh` before invoking make
#   • Node.js (export lists are generated from public headers)
#
# Targets:
#   make                 — build optimised WASM (output → ../public/wasm/)
#   make debug / debug-wasm — DWARF + ASSERTIONS (no ASan on standalone WASM)
#   make debug-native    — host ASan/UBSan test binary
#   make test            — native assertion harness (host c++)
#   make bench           — native micro-benchmarks
#   make compile-commands — clangd database (gitignored compile_commands.json)
#   make tidy            — clang-tidy if installed (does not fail the build)
#   make clean           — remove build artifacts
# =============================================================================

CXX        := em++
EMCC       := emcc
NATIVE_CXX ?= c++
NATIVE_CC  ?= cc
CORE_CXX   := harborglow_dsp.cpp
AUDIO_CXX  := harborglow_dsp.cpp harborglow_audio_engine.cpp
HEADER     := harborglow_dsp.h harborglow_audio_engine.h dsp_ring_buffer.h
OUT_DIR    := ../public/wasm
OUT_WASM   := $(OUT_DIR)/harborglow_dsp.wasm
OUT_WASM_SIMD := $(OUT_DIR)/harborglow_dsp_simd.wasm
OUT_AUDIO  := $(OUT_DIR)/harborglow_audio_shared.wasm
OUT_SIMD   := $(OUT_DIR)/harborglow_audio_shared_simd.wasm
EXPORTS_JS := ../scripts/wasm-exports.mjs
BUILD_DIR  := .build
RING_CORE_O := $(BUILD_DIR)/dsp_ring_buffer.core.o
RING_SHARED_O := $(BUILD_DIR)/dsp_ring_buffer.shared.o

NATIVE_WARN := -Wall -Wextra -Wshadow -Wconversion -Werror=return-type -Werror
EM_WARN     := -Wall -Wextra -Wshadow -Wconversion

# Export lists are parsed from headers (see scripts/wasm-exports.mjs).
# Prefer values passed from build.sh so `make test` never shells out to Node.
CORE_EXPORTED_FUNCTIONS ?= $(shell node $(EXPORTS_JS) --emcc core)
AUDIO_EXPORTED_FUNCTIONS ?= $(shell node $(EXPORTS_JS) --emcc audio)

# INITIAL_MEMORY is 4 MiB: Emscripten reactor + 2048-point FFT scratch +
# 16×16 wave batch + a multi-second room IR without a per-scene heap copy.
# ALLOW_MEMORY_GROWTH remains on; wasmDSP.ts logs growth in DEV.
BASE_FLAGS = \
    -std=c++17 \
    $(EM_WARN) \
    -s WASM=1 \
    -s STANDALONE_WASM=1 \
    --no-entry \
    -s EXPORTED_FUNCTIONS="[$(CORE_EXPORTED_FUNCTIONS)]" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=4194304 \
    -s ENVIRONMENT="web,worker"

# SharedArrayBuffer AudioWorklet reactor.
# -pthread + PTHREAD_POOL_SIZE=0 links the atomics/shared-memory ABI without
# spawning a pthread worker pool. Dropping -pthread is a follow-up after an
# AudioWorklet regression test; -matomics -mbulk-memory are the actual needs.
SHARED_FLAGS = \
    -std=c++17 \
    $(EM_WARN) \
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

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(RING_CORE_O): dsp_ring_buffer.c dsp_ring_buffer.h | $(BUILD_DIR)
	$(EMCC) -std=c11 $(EM_WARN) -c dsp_ring_buffer.c -o $(RING_CORE_O)

$(RING_SHARED_O): dsp_ring_buffer.c dsp_ring_buffer.h | $(BUILD_DIR)
	$(EMCC) -std=c11 $(EM_WARN) -pthread -matomics -mbulk-memory \
	    -c dsp_ring_buffer.c -o $(RING_SHARED_O)

$(OUT_WASM): $(CORE_CXX) $(RING_CORE_O) $(HEADER) $(EXPORTS_JS) | $(OUT_DIR)
	$(CXX) $(CORE_CXX) $(RING_CORE_O) $(BASE_FLAGS) \
	    -O3 \
	    -flto \
	    -o $(OUT_WASM)
	@echo "✅  Release build → $(OUT_WASM)"

$(OUT_WASM_SIMD): $(CORE_CXX) $(RING_CORE_O) $(HEADER) $(EXPORTS_JS) | $(OUT_DIR)
	$(CXX) $(CORE_CXX) $(RING_CORE_O) $(BASE_FLAGS) \
	    -O3 \
	    -flto \
	    -msimd128 \
	    -o $(OUT_WASM_SIMD)
	@echo "✅  SIMD reactor build → $(OUT_WASM_SIMD)"

$(OUT_AUDIO): $(AUDIO_CXX) $(RING_SHARED_O) $(HEADER) $(EXPORTS_JS) | $(OUT_DIR)
	$(CXX) $(AUDIO_CXX) $(RING_SHARED_O) $(SHARED_FLAGS) \
	    -O3 \
	    -flto \
	    -o $(OUT_AUDIO)
	@echo "✅  Shared scalar audio build → $(OUT_AUDIO)"

$(OUT_SIMD): $(AUDIO_CXX) $(RING_SHARED_O) $(HEADER) $(EXPORTS_JS) | $(OUT_DIR)
	$(CXX) $(AUDIO_CXX) $(RING_SHARED_O) $(SHARED_FLAGS) \
	    -O3 \
	    -flto \
	    -msimd128 \
	    -mrelaxed-simd \
	    -o $(OUT_SIMD)
	@echo "✅  Shared SIMD audio build → $(OUT_SIMD)"

# ---------------------------------------------------------------------------
# Debug WASM — DWARF + assertions. ASan/SAFE_HEAP need JS glue and a growing
# memory model; they are not valid on STANDALONE_WASM --no-entry reactors.
# ---------------------------------------------------------------------------
.PHONY: debug debug-wasm
debug: debug-wasm
debug-wasm: $(RING_CORE_O) $(OUT_DIR)
	$(CXX) $(CORE_CXX) $(RING_CORE_O) $(BASE_FLAGS) \
	    -O0 -g \
	    -s ASSERTIONS=2 \
	    -o $(OUT_WASM)
	@echo "🐞  Debug WASM (DWARF + ASSERTIONS, no ASan) → $(OUT_WASM)"

# ---------------------------------------------------------------------------
# Native tests / benches (host compiler, no Emscripten)
# ---------------------------------------------------------------------------
TEST_BIN := tests/dsp_native_test
AUDIO_TEST_BIN := tests/audio_engine_native_test
BENCH_BIN := tests/dsp_bench
SANITIZE := -fsanitize=address,undefined

.PHONY: test
test: $(TEST_BIN) $(AUDIO_TEST_BIN)
	./$(TEST_BIN)
	./$(AUDIO_TEST_BIN)

$(TEST_BIN): tests/dsp_native_test.cpp harborglow_dsp.cpp dsp_ring_buffer.c $(HEADER)
	mkdir -p tests
	$(NATIVE_CC) -std=c11 $(NATIVE_WARN) -c dsp_ring_buffer.c -o tests/dsp_ring_buffer.o
	$(NATIVE_CXX) -std=c++17 -O2 -I. $(NATIVE_WARN) \
	    tests/dsp_native_test.cpp harborglow_dsp.cpp tests/dsp_ring_buffer.o \
	    -lm -o $(TEST_BIN)

$(AUDIO_TEST_BIN): tests/audio_engine_native_test.cpp harborglow_audio_engine.cpp \
		harborglow_dsp.cpp dsp_ring_buffer.c $(HEADER)
	mkdir -p tests
	$(NATIVE_CC) -std=c11 $(NATIVE_WARN) -c dsp_ring_buffer.c -o tests/dsp_ring_buffer.o
	$(NATIVE_CXX) -std=c++17 -O2 -I. $(NATIVE_WARN) \
	    tests/audio_engine_native_test.cpp harborglow_audio_engine.cpp \
	    harborglow_dsp.cpp tests/dsp_ring_buffer.o \
	    -lm -o $(AUDIO_TEST_BIN)

.PHONY: debug-native
debug-native: tests/dsp_ring_buffer_asan.o
	mkdir -p tests
	$(NATIVE_CXX) -std=c++17 -O1 -g -I. $(NATIVE_WARN) $(SANITIZE) \
	    tests/dsp_native_test.cpp harborglow_dsp.cpp tests/dsp_ring_buffer_asan.o \
	    -lm -o $(TEST_BIN)
	$(NATIVE_CXX) -std=c++17 -O1 -g -I. $(NATIVE_WARN) $(SANITIZE) \
	    tests/audio_engine_native_test.cpp harborglow_audio_engine.cpp \
	    harborglow_dsp.cpp tests/dsp_ring_buffer_asan.o \
	    -lm -o $(AUDIO_TEST_BIN)
	./$(TEST_BIN)
	./$(AUDIO_TEST_BIN)
	@echo "🐞  Native ASan/UBSan tests OK"

tests/dsp_ring_buffer_asan.o: dsp_ring_buffer.c dsp_ring_buffer.h
	mkdir -p tests
	$(NATIVE_CC) -std=c11 -O1 -g $(NATIVE_WARN) $(SANITIZE) -c dsp_ring_buffer.c \
	    -o tests/dsp_ring_buffer_asan.o

.PHONY: bench
bench: $(BENCH_BIN)
	./$(BENCH_BIN)

$(BENCH_BIN): tests/dsp_bench.cpp harborglow_dsp.cpp dsp_ring_buffer.c $(HEADER)
	mkdir -p tests
	$(NATIVE_CC) -std=c11 $(NATIVE_WARN) -c dsp_ring_buffer.c -o tests/dsp_ring_buffer.o
	$(NATIVE_CXX) -std=c++17 -O3 -I. $(NATIVE_WARN) \
	    tests/dsp_bench.cpp harborglow_dsp.cpp tests/dsp_ring_buffer.o \
	    -lm -o $(BENCH_BIN)

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
$(OUT_DIR):
	mkdir -p $(OUT_DIR)

.PHONY: compile-commands
compile-commands:
	python3 write-compile-commands.py

.PHONY: tidy
tidy: compile-commands
	@if command -v clang-tidy >/dev/null 2>&1; then \
	    clang-tidy -p . harborglow_dsp.cpp harborglow_audio_engine.cpp dsp_ring_buffer.c \
	        --quiet || true; \
	else \
	    echo "clang-tidy not found; skip (optional in PR 1)"; \
	fi

.PHONY: clean
clean:
	rm -f $(OUT_WASM) $(OUT_WASM_SIMD) $(OUT_AUDIO) $(OUT_SIMD) $(OUT_DIR)/harborglow_dsp.js
	rm -f $(TEST_BIN) $(AUDIO_TEST_BIN) $(BENCH_BIN) tests/dsp_ring_buffer.o tests/dsp_ring_buffer_asan.o
	rm -rf $(BUILD_DIR)
	rm -f compile_commands.json
	@echo "🧹  Cleaned $(OUT_DIR)"
