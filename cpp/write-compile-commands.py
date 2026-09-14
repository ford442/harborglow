#!/usr/bin/env python3
"""Emit cpp/compile_commands.json for clangd (gitignored)."""
import json
import os
from pathlib import Path

cpp_dir = Path(__file__).resolve().parent
warn = ["-Wall", "-Wextra", "-Wshadow", "-Wconversion", "-Werror=return-type"]
native_cc = os.environ.get("NATIVE_CC", "cc")
native_cxx = os.environ.get("NATIVE_CXX", "c++")
emxx = os.environ.get("EMXX", "em++")

native_cpp = [
    "harborglow_dsp.cpp",
    "harborglow_audio_engine.cpp",
    "tests/dsp_native_test.cpp",
    "tests/dsp_bench.cpp",
    "tests/audio_engine_native_test.cpp",
]
native_c = ["dsp_ring_buffer.c"]
em_sources = [
    "harborglow_dsp.cpp",
    "harborglow_audio_engine.cpp",
    "dsp_ring_buffer.c",
]

entries = []
for file in native_cpp:
    entries.append({
        "directory": str(cpp_dir),
        "file": str(cpp_dir / file),
        "arguments": [native_cxx, "-std=c++17", "-I.", *warn, "-c", file],
    })
for file in native_c:
    entries.append({
        "directory": str(cpp_dir),
        "file": str(cpp_dir / file),
        "arguments": [native_cc, "-std=c11", "-I.", *warn, "-c", file],
    })
for file in em_sources:
    std = "-std=c11" if file.endswith(".c") else "-std=c++17"
    entries.append({
        "directory": str(cpp_dir),
        "file": str(cpp_dir / file),
        "arguments": [
            emxx, std, "-I.", *warn,
            "--target=wasm32", "-msimd128", "-matomics", "-mbulk-memory",
            "-DDSP_EXPORT=", "-DEMSCRIPTEN_KEEPALIVE=",
            "-s", "STANDALONE_WASM=1", "--no-entry", "-c", file,
        ],
    })

out = cpp_dir / "compile_commands.json"
out.write_text(json.dumps(entries, indent=2) + "\n")
print("wrote cpp/compile_commands.json")
