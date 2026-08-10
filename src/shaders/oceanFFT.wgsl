// Two-pass Cooley-Tukey IFFT for 256x256 Ocean Simulation
struct OceanParams {
    time: f32,
    size: f32,
    passIndex: f32, // 0 for horizontal, 1 for vertical
}

@group(0) @binding(0) var<uniform> params: OceanParams;
@group(0) @binding(1) var h0_texture: texture_2d<f32>; 
@group(0) @binding(2) var buffer_in: texture_2d<f32>;
@group(0) @binding(3) var buffer_out: texture_storage_2d<rgba16float, write>;

const PI: f32 = 3.14159265359;
const G: f32 = 9.81;

fn cmul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return vec2<f32>(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

fn cexp(theta: f32) -> vec2<f32> {
    return vec2<f32>(cos(theta), sin(theta));
}

var<workgroup> shared_data: array<vec2<f32>, 256>;

@compute @workgroup_size(256, 1, 1)
fn main(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>,
    @builtin(workgroup_id) group_id: vec3<u32>
) {
    let N = u32(params.size);
    let tid = local_id.x;
    
    var pos: vec2<i32>;
    if (params.passIndex < 0.5) {
        pos = vec2<i32>(i32(tid), i32(group_id.y));
    } else {
        pos = vec2<i32>(i32(group_id.y), i32(tid));
    }
    
    // Load data
    if (params.passIndex < 0.5) {
        let k = vec2<f32>(f32(pos.x) - f32(N)/2.0, f32(pos.y) - f32(N)/2.0) * (2.0 * PI / 100.0);
        let k_len = length(k);
        let w = sqrt(G * k_len);
        
        let h0 = textureLoad(h0_texture, pos, 0);
        let phase = w * params.time;
        let c = cexp(phase);
        let c_conj = vec2<f32>(c.x, -c.y);
        
        shared_data[tid] = cmul(h0.rg, c) + cmul(h0.ba, c_conj);
    } else {
        shared_data[tid] = textureLoad(buffer_in, pos, 0).rg;
    }
    
    workgroupBarrier();
    
    // Bit reversal for N=256
    let reversed = reverseBits(tid) >> 24u;
    var current: vec2<f32> = shared_data[reversed];
    
    workgroupBarrier();
    shared_data[tid] = current;
    workgroupBarrier();
    
    // 8 stages
    for (var stage = 0u; stage < 8u; stage = stage + 1u) {
        let m = 1u << stage;
        let w_idx = tid % m;
        let twiddle = cexp(PI * f32(w_idx) / f32(m));
        
        workgroupBarrier();
        current = shared_data[tid];
        let pair_idx = tid ^ m;
        
        if ((tid & m) == 0u) {
            let t = cmul(twiddle, shared_data[pair_idx]);
            current = current + t;
        } else {
            let twiddle_pair = cexp(PI * f32(w_idx) / f32(m));
            let t = cmul(twiddle_pair, current);
            current = shared_data[pair_idx] - t;
        }
        
        workgroupBarrier();
        shared_data[tid] = current;
    }
    
    if (params.passIndex > 0.5) {
        var sign: f32 = 1.0;
        if ((pos.x + pos.y) % 2 != 0) {
            sign = -1.0;
        }
        let disp = shared_data[tid].x * sign / f32(N * N);
        textureStore(buffer_out, pos, vec4<f32>(0.0, disp * 2.0, 0.0, 1.0));
    } else {
        textureStore(buffer_out, pos, vec4<f32>(shared_data[tid], 0.0, 1.0));
    }
}
