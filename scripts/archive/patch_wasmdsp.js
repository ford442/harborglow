import fs from 'fs';
let code = fs.readFileSync('src/systems/wasmDSP.ts', 'utf8');

// 1. Add to HarborGlowDSPExports
code = code.replace(
`  dsp_audio_rms(dataPtr: number, count: number): number
}`,
`  dsp_audio_rms(dataPtr: number, count: number): number

  dsp_fft_r2c(inputPtr: number, outRealPtr: number, outImagPtr: number, log2N: number): void
}`
);

// 2. Add to RawWasmInstance
code = code.replace(
`  dsp_audio_rms: (dataPtr: number, count: number) => number
}`,
`  dsp_audio_rms: (dataPtr: number, count: number) => number
  dsp_fft_r2c: HarborGlowDSPExports['dsp_fft_r2c']
}`
);

// 3. Add to jsExports
code = code.replace(
`  dsp_audio_rms: (_dataPtr, count) => {
    void _dataPtr
    return count <= 0 ? 0 : 0
  },
}`,
`  dsp_audio_rms: (_dataPtr, count) => {
    void _dataPtr
    return count <= 0 ? 0 : 0
  },
  dsp_fft_r2c: (inputPtr, outRealPtr, outImagPtr, log2N) => {
    // Basic fallback stub
  },
}`
);

// 4. Add to required exports
code = code.replace(
`        'dsp_additive_synth_sample', 'dsp_audio_rms',
      ]`,
`        'dsp_additive_synth_sample', 'dsp_audio_rms', 'dsp_fft_r2c',
      ]`
);

// 5. Add to WasmDSPSystem
code = code.replace(
`  audioRms(data: Float32Array): number {`,
`  fftR2C(input: Float32Array, log2N: number): { real: Float32Array, imag: Float32Array } {
    const N = 1 << log2N;
    const real = new Float32Array(N);
    const imag = new Float32Array(N);
    if (this._raw) {
      const raw = this._raw;
      const inputPtr = raw.malloc(N * 4);
      const outRealPtr = raw.malloc(N * 4);
      const outImagPtr = raw.malloc(N * 4);
      try {
        new Float32Array(raw.memory.buffer, inputPtr, N).set(input);
        raw.dsp_fft_r2c(inputPtr, outRealPtr, outImagPtr, log2N);
        real.set(new Float32Array(raw.memory.buffer, outRealPtr, N));
        imag.set(new Float32Array(raw.memory.buffer, outImagPtr, N));
      } finally {
        raw.free(inputPtr);
        raw.free(outRealPtr);
        raw.free(outImagPtr);
      }
    }
    return { real, imag };
  }

  audioRms(data: Float32Array): number {`
);

fs.writeFileSync('src/systems/wasmDSP.ts', code);
