const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./EffectComposer-CeHmhoIr.js","./index-CAH71QjH.js","./index-DfcyvFeZ.css","./CopyShader-BWJjsCP-.js","./ShaderPass-B-A7CtId.js","./Pass-B5HoFM4g.js","./RenderPass-DGRu1HwP.js","./UnrealBloomPass-DFiFqqNJ.js"])))=>i.map(i=>d[i]);
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { R as REVISION, M as Mesh, I as IcosahedronGeometry, S as ShaderMaterial, D as DoubleSide, V as Vector3, a as Spherical, Q as Quaternion, O as OrthographicCamera, b as Vector2, P as PerspectiveCamera$1, c as MOUSE, T as TOUCH, d as Ray, e as Plane$1, f as DataTextureLoader, H as HalfFloatType, F as FloatType, g as DataUtils, L as LinearFilter, h as RGBAFormat, i as RedFormat, j as ToneAudioNode, o as optionsFromArguments, k as Param, r as readOnly, l as FrequencyClass, m as ftom, n as mtof, p as Source, q as assert, s as ToneBufferSource, t as ToneAudioBuffer, u as Signal, G as Gain, v as connectSeries, w as SignalOperator, x as Multiply, y as connect, z as disconnect, A as Oscillator, B as AudioToGain, C as connectSignal, W as WaveShaper, E as Monophonic, J as Synth, K as omitFromObject, N as Envelope, U as OmniOscillator, X as writable, Y as isNumber, Z as Pow, _ as assertRange, $ as AmplitudeEnvelope, a0 as FMOscillator, a1 as noOp, a2 as deepMerge, a3 as Instrument, a4 as getWorkletGlobalScope, a5 as warn, a6 as isArray$1, a7 as ToneWithContext, a8 as StateTimeline, a9 as TicksClass, aa as isBoolean, ab as defaultArg, ac as TransportTimeClass, ad as isDefined, ae as isObject, af as isUndef, ag as isString, ah as workletName, ai as __awaiter, aj as OfflineContext, ak as gainToDb, al as dbToGain, am as reactExports, an as useThree, ao as createRoot, ap as useFrame, aq as _extends, ar as MathUtils, as as UniformsUtils, at as WebGLRenderTarget, au as DepthTexture, av as ClampToEdgeWrapping, aw as Scene, ax as PlaneGeometry, ay as UVMapping, az as WebGLRenderer, aA as DataTexture, aB as LinearSRGBColorSpace, aC as Texture, aD as MeshBasicMaterial, aE as IntType, aF as ShortType, aG as ByteType, aH as UnsignedIntType, aI as UnsignedByteType, aJ as Loader, aK as LoadingManager, aL as LinearMipMapLinearFilter, aM as SRGBColorSpace, aN as FileLoader, aO as NoBlending, aP as useLoader, aQ as CubeReflectionMapping, aR as EquirectangularReflectionMapping, aS as CubeTextureLoader, aT as extend, aU as WebGLCubeRenderTarget, aV as createPortal, aW as applyProps, aX as Object3D, aY as start, aZ as MembraneSynth, a_ as getTransport, a$ as Time, b0 as useGameStore, b1 as CatmullRomCurve3, b2 as Destination, b3 as jsxRuntimeExports, b4 as BoxGeometry, b5 as ConeGeometry, b6 as CylinderGeometry, b7 as RigidBody, b8 as BufferGeometry, b9 as BufferAttribute, ba as Color, bb as AdditiveBlending, bc as BackSide, bd as TubeGeometry, be as LineCurve3, bf as SphereGeometry, bg as Shape, bh as ExtrudeGeometry, bi as WireframeGeometry, bj as CanvasTexture, bk as RepeatWrapping, bl as NormalBlending, bm as __vitePreload, bn as MeshStandardMaterial, bo as MeshPhysicalMaterial, bp as FogExp2, bq as useControls } from "./index-CAH71QjH.js";
const version = /* @__PURE__ */ (() => parseInt(REVISION.replace(/\D+/g, "")))();
var u8 = Uint8Array, u16 = Uint16Array, u32 = Uint32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start2) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start2 += 1 << eb[i - 1];
  }
  var r = new u32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return [b, r];
};
var _a = freb(fleb, 2), fl = _a[0], revfl = _a[1];
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0), fd = _b[0];
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
  var x = (i & 43690) >>> 1 | (i & 21845) << 1;
  x = (x & 52428) >>> 2 | (x & 13107) << 2;
  x = (x & 61680) >>> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >>> 8 | (x & 255) << 8) >>> 1;
}
var hMap = function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i)
    ++l[cd[i] - 1];
  var le = new u16(mb);
  for (i = 0; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >>> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >>> 15 - cd[i];
      }
    }
  }
  return co;
};
var flt = new u8(288);
for (var i = 0; i < 144; ++i)
  flt[i] = 8;
for (var i = 144; i < 256; ++i)
  flt[i] = 9;
for (var i = 256; i < 280; ++i)
  flt[i] = 7;
for (var i = 280; i < 288; ++i)
  flt[i] = 8;
var fdt = new u8(32);
for (var i = 0; i < 32; ++i)
  fdt[i] = 5;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p / 8 | 0) + (p & 7 && 1);
};
var slc = function(v, s, e) {
  if (e == null || e > v.length)
    e = v.length;
  var n = new (v instanceof u16 ? u16 : v instanceof u32 ? u32 : u8)(e - s);
  n.set(v.subarray(s, e));
  return n;
};
var inflt = function(dat, buf, st) {
  var sl = dat.length;
  if (!sl || st && !st.l && sl < 5)
    return buf || new u8(0);
  var noBuf = !buf || st;
  var noSt = !st || st.i;
  if (!st)
    st = {};
  if (!buf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      st.f = final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            throw "unexpected EOF";
          break;
        }
        if (noBuf)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >>> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        throw "invalid block type";
      if (pos > tbts) {
        if (noSt)
          throw "unexpected EOF";
        break;
      }
    }
    if (noBuf)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >>> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          throw "unexpected EOF";
        break;
      }
      if (!c)
        throw "invalid length/literal";
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >>> 4;
        if (!d)
          throw "invalid distance";
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            throw "unexpected EOF";
          break;
        }
        if (noBuf)
          cbuf(bt + 131072);
        var end = bt + add;
        for (; bt < end; bt += 4) {
          buf[bt] = buf[bt - dt];
          buf[bt + 1] = buf[bt + 1 - dt];
          buf[bt + 2] = buf[bt + 2 - dt];
          buf[bt + 3] = buf[bt + 3 - dt];
        }
        bt = end;
      }
    }
    st.l = lm, st.p = lpos, st.b = bt;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt == buf.length ? buf : slc(buf, 0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var zlv = function(d) {
  if ((d[0] & 15) != 8 || d[0] >>> 4 > 7 || (d[0] << 8 | d[1]) % 31)
    throw "invalid zlib data";
  if (d[1] & 32)
    throw "invalid zlib data: preset dictionaries not supported";
};
function unzlibSync(data, out) {
  return inflt((zlv(data), data.subarray(2, -4)), out);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
const isCubeTexture = (def) => def && def.isCubeTexture;
class GroundProjectedEnv extends Mesh {
  constructor(texture, options) {
    var _a2, _b2;
    const isCubeMap = isCubeTexture(texture);
    const w = (_b2 = isCubeMap ? (_a2 = texture.image[0]) == null ? void 0 : _a2.width : texture.image.width) != null ? _b2 : 1024;
    const cubeSize = w / 4;
    const _lodMax = Math.floor(Math.log2(cubeSize));
    const _cubeSize = Math.pow(2, _lodMax);
    const width = 3 * Math.max(_cubeSize, 16 * 7);
    const height = 4 * _cubeSize;
    const defines = [
      isCubeMap ? "#define ENVMAP_TYPE_CUBE" : "",
      `#define CUBEUV_TEXEL_WIDTH ${1 / width}`,
      `#define CUBEUV_TEXEL_HEIGHT ${1 / height}`,
      `#define CUBEUV_MAX_MIP ${_lodMax}.0`
    ];
    const vertexShader2 = (
      /* glsl */
      `
        varying vec3 vWorldPosition;
        void main() 
        {
            vec4 worldPosition = ( modelMatrix * vec4( position, 1.0 ) );
            vWorldPosition = worldPosition.xyz;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
        `
    );
    const fragmentShader2 = defines.join("\n") + /* glsl */
    `
        #define ENVMAP_TYPE_CUBE_UV
        varying vec3 vWorldPosition;
        uniform float radius;
        uniform float height;
        uniform float angle;
        #ifdef ENVMAP_TYPE_CUBE
            uniform samplerCube map;
        #else
            uniform sampler2D map;
        #endif
        // From: https://www.shadertoy.com/view/4tsBD7
        float diskIntersectWithBackFaceCulling( vec3 ro, vec3 rd, vec3 c, vec3 n, float r ) 
        {
            float d = dot ( rd, n );
            
            if( d > 0.0 ) { return 1e6; }
            
            vec3  o = ro - c;
            float t = - dot( n, o ) / d;
            vec3  q = o + rd * t;
            
            return ( dot( q, q ) < r * r ) ? t : 1e6;
        }
        // From: https://www.iquilezles.org/www/articles/intersectors/intersectors.htm
        float sphereIntersect( vec3 ro, vec3 rd, vec3 ce, float ra ) 
        {
            vec3 oc = ro - ce;
            float b = dot( oc, rd );
            float c = dot( oc, oc ) - ra * ra;
            float h = b * b - c;
            
            if( h < 0.0 ) { return -1.0; }
            
            h = sqrt( h );
            
            return - b + h;
        }
        vec3 project() 
        {
            vec3 p = normalize( vWorldPosition );
            vec3 camPos = cameraPosition;
            camPos.y -= height;
            float intersection = sphereIntersect( camPos, p, vec3( 0.0 ), radius );
            if( intersection > 0.0 ) {
                
                vec3 h = vec3( 0.0, - height, 0.0 );
                float intersection2 = diskIntersectWithBackFaceCulling( camPos, p, h, vec3( 0.0, 1.0, 0.0 ), radius );
                p = ( camPos + min( intersection, intersection2 ) * p ) / radius;
            } else {
                p = vec3( 0.0, 1.0, 0.0 );
            }
            return p;
        }
        #include <common>
        #include <cube_uv_reflection_fragment>
        void main() 
        {
            vec3 projectedWorldPosition = project();
            
            #ifdef ENVMAP_TYPE_CUBE
                vec3 outcolor = textureCube( map, projectedWorldPosition ).rgb;
            #else
                vec3 direction = normalize( projectedWorldPosition );
                vec2 uv = equirectUv( direction );
                vec3 outcolor = texture2D( map, uv ).rgb;
            #endif
            gl_FragColor = vec4( outcolor, 1.0 );
            #include <tonemapping_fragment>
            #include <${version >= 154 ? "colorspace_fragment" : "encodings_fragment"}>
        }
        `;
    const uniforms = {
      map: { value: texture },
      height: { value: (options == null ? void 0 : options.height) || 15 },
      radius: { value: (options == null ? void 0 : options.radius) || 100 }
    };
    const geometry = new IcosahedronGeometry(1, 16);
    const material = new ShaderMaterial({
      uniforms,
      fragmentShader: fragmentShader2,
      vertexShader: vertexShader2,
      side: DoubleSide
    });
    super(geometry, material);
  }
  set radius(radius) {
    this.material.uniforms.radius.value = radius;
  }
  get radius() {
    return this.material.uniforms.radius.value;
  }
  set height(height) {
    this.material.uniforms.height.value = height;
  }
  get height() {
    return this.material.uniforms.height.value;
  }
}
var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, key + "", value);
  return value;
};
class EventDispatcher {
  constructor() {
    __publicField$1(this, "_listeners");
  }
  /**
   * Adds a listener to an event type.
   * @param type The type of event to listen to.
   * @param listener The function that gets called when the event is fired.
   */
  addEventListener(type, listener) {
    if (this._listeners === void 0)
      this._listeners = {};
    const listeners = this._listeners;
    if (listeners[type] === void 0) {
      listeners[type] = [];
    }
    if (listeners[type].indexOf(listener) === -1) {
      listeners[type].push(listener);
    }
  }
  /**
      * Checks if listener is added to an event type.
      * @param type The type of event to listen to.
      * @param listener The function that gets called when the event is fired.
      */
  hasEventListener(type, listener) {
    if (this._listeners === void 0)
      return false;
    const listeners = this._listeners;
    return listeners[type] !== void 0 && listeners[type].indexOf(listener) !== -1;
  }
  /**
      * Removes a listener from an event type.
      * @param type The type of the listener that gets removed.
      * @param listener The listener function that gets removed.
      */
  removeEventListener(type, listener) {
    if (this._listeners === void 0)
      return;
    const listeners = this._listeners;
    const listenerArray = listeners[type];
    if (listenerArray !== void 0) {
      const index = listenerArray.indexOf(listener);
      if (index !== -1) {
        listenerArray.splice(index, 1);
      }
    }
  }
  /**
      * Fire an event type.
      * @param event The event that gets fired.
      */
  dispatchEvent(event) {
    if (this._listeners === void 0)
      return;
    const listeners = this._listeners;
    const listenerArray = listeners[event.type];
    if (listenerArray !== void 0) {
      event.target = this;
      const array = listenerArray.slice(0);
      for (let i = 0, l = array.length; i < l; i++) {
        array[i].call(this, event);
      }
      event.target = null;
    }
  }
}
var __defProp2 = Object.defineProperty;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField2 = (obj, key, value) => {
  __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const _ray = /* @__PURE__ */ new Ray();
const _plane = /* @__PURE__ */ new Plane$1();
const TILT_LIMIT = Math.cos(70 * (Math.PI / 180));
const moduloWrapAround = (offset, capacity) => (offset % capacity + capacity) % capacity;
let OrbitControls$1 = class OrbitControls extends EventDispatcher {
  constructor(object, domElement) {
    super();
    __publicField2(this, "object");
    __publicField2(this, "domElement");
    __publicField2(this, "enabled", true);
    __publicField2(this, "target", new Vector3());
    __publicField2(this, "minDistance", 0);
    __publicField2(this, "maxDistance", Infinity);
    __publicField2(this, "minZoom", 0);
    __publicField2(this, "maxZoom", Infinity);
    __publicField2(this, "minPolarAngle", 0);
    __publicField2(this, "maxPolarAngle", Math.PI);
    __publicField2(this, "minAzimuthAngle", -Infinity);
    __publicField2(this, "maxAzimuthAngle", Infinity);
    __publicField2(this, "enableDamping", false);
    __publicField2(this, "dampingFactor", 0.05);
    __publicField2(this, "enableZoom", true);
    __publicField2(this, "zoomSpeed", 1);
    __publicField2(this, "enableRotate", true);
    __publicField2(this, "rotateSpeed", 1);
    __publicField2(this, "enablePan", true);
    __publicField2(this, "panSpeed", 1);
    __publicField2(this, "screenSpacePanning", true);
    __publicField2(this, "keyPanSpeed", 7);
    __publicField2(this, "zoomToCursor", false);
    __publicField2(this, "autoRotate", false);
    __publicField2(this, "autoRotateSpeed", 2);
    __publicField2(this, "reverseOrbit", false);
    __publicField2(this, "reverseHorizontalOrbit", false);
    __publicField2(this, "reverseVerticalOrbit", false);
    __publicField2(this, "keys", { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" });
    __publicField2(this, "mouseButtons", {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN
    });
    __publicField2(this, "touches", { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN });
    __publicField2(this, "target0");
    __publicField2(this, "position0");
    __publicField2(this, "zoom0");
    __publicField2(this, "_domElementKeyEvents", null);
    __publicField2(this, "getPolarAngle");
    __publicField2(this, "getAzimuthalAngle");
    __publicField2(this, "setPolarAngle");
    __publicField2(this, "setAzimuthalAngle");
    __publicField2(this, "getDistance");
    __publicField2(this, "getZoomScale");
    __publicField2(this, "listenToKeyEvents");
    __publicField2(this, "stopListenToKeyEvents");
    __publicField2(this, "saveState");
    __publicField2(this, "reset");
    __publicField2(this, "update");
    __publicField2(this, "connect");
    __publicField2(this, "dispose");
    __publicField2(this, "dollyIn");
    __publicField2(this, "dollyOut");
    __publicField2(this, "getScale");
    __publicField2(this, "setScale");
    this.object = object;
    this.domElement = domElement;
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;
    this.getPolarAngle = () => spherical.phi;
    this.getAzimuthalAngle = () => spherical.theta;
    this.setPolarAngle = (value) => {
      let phi = moduloWrapAround(value, 2 * Math.PI);
      let currentPhi = spherical.phi;
      if (currentPhi < 0)
        currentPhi += 2 * Math.PI;
      if (phi < 0)
        phi += 2 * Math.PI;
      let phiDist = Math.abs(phi - currentPhi);
      if (2 * Math.PI - phiDist < phiDist) {
        if (phi < currentPhi) {
          phi += 2 * Math.PI;
        } else {
          currentPhi += 2 * Math.PI;
        }
      }
      sphericalDelta.phi = phi - currentPhi;
      scope.update();
    };
    this.setAzimuthalAngle = (value) => {
      let theta = moduloWrapAround(value, 2 * Math.PI);
      let currentTheta = spherical.theta;
      if (currentTheta < 0)
        currentTheta += 2 * Math.PI;
      if (theta < 0)
        theta += 2 * Math.PI;
      let thetaDist = Math.abs(theta - currentTheta);
      if (2 * Math.PI - thetaDist < thetaDist) {
        if (theta < currentTheta) {
          theta += 2 * Math.PI;
        } else {
          currentTheta += 2 * Math.PI;
        }
      }
      sphericalDelta.theta = theta - currentTheta;
      scope.update();
    };
    this.getDistance = () => scope.object.position.distanceTo(scope.target);
    this.listenToKeyEvents = (domElement2) => {
      domElement2.addEventListener("keydown", onKeyDown);
      this._domElementKeyEvents = domElement2;
    };
    this.stopListenToKeyEvents = () => {
      this._domElementKeyEvents.removeEventListener("keydown", onKeyDown);
      this._domElementKeyEvents = null;
    };
    this.saveState = () => {
      scope.target0.copy(scope.target);
      scope.position0.copy(scope.object.position);
      scope.zoom0 = scope.object.zoom;
    };
    this.reset = () => {
      scope.target.copy(scope.target0);
      scope.object.position.copy(scope.position0);
      scope.object.zoom = scope.zoom0;
      scope.object.updateProjectionMatrix();
      scope.dispatchEvent(changeEvent);
      scope.update();
      state = STATE.NONE;
    };
    this.update = (() => {
      const offset = new Vector3();
      const up = new Vector3(0, 1, 0);
      const quat = new Quaternion().setFromUnitVectors(object.up, up);
      const quatInverse = quat.clone().invert();
      const lastPosition = new Vector3();
      const lastQuaternion = new Quaternion();
      const twoPI = 2 * Math.PI;
      return function update() {
        const position = scope.object.position;
        quat.setFromUnitVectors(object.up, up);
        quatInverse.copy(quat).invert();
        offset.copy(position).sub(scope.target);
        offset.applyQuaternion(quat);
        spherical.setFromVector3(offset);
        if (scope.autoRotate && state === STATE.NONE) {
          rotateLeft(getAutoRotationAngle());
        }
        if (scope.enableDamping) {
          spherical.theta += sphericalDelta.theta * scope.dampingFactor;
          spherical.phi += sphericalDelta.phi * scope.dampingFactor;
        } else {
          spherical.theta += sphericalDelta.theta;
          spherical.phi += sphericalDelta.phi;
        }
        let min = scope.minAzimuthAngle;
        let max2 = scope.maxAzimuthAngle;
        if (isFinite(min) && isFinite(max2)) {
          if (min < -Math.PI)
            min += twoPI;
          else if (min > Math.PI)
            min -= twoPI;
          if (max2 < -Math.PI)
            max2 += twoPI;
          else if (max2 > Math.PI)
            max2 -= twoPI;
          if (min <= max2) {
            spherical.theta = Math.max(min, Math.min(max2, spherical.theta));
          } else {
            spherical.theta = spherical.theta > (min + max2) / 2 ? Math.max(min, spherical.theta) : Math.min(max2, spherical.theta);
          }
        }
        spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
        spherical.makeSafe();
        if (scope.enableDamping === true) {
          scope.target.addScaledVector(panOffset, scope.dampingFactor);
        } else {
          scope.target.add(panOffset);
        }
        if (scope.zoomToCursor && performCursorZoom || scope.object.isOrthographicCamera) {
          spherical.radius = clampDistance(spherical.radius);
        } else {
          spherical.radius = clampDistance(spherical.radius * scale);
        }
        offset.setFromSpherical(spherical);
        offset.applyQuaternion(quatInverse);
        position.copy(scope.target).add(offset);
        if (!scope.object.matrixAutoUpdate)
          scope.object.updateMatrix();
        scope.object.lookAt(scope.target);
        if (scope.enableDamping === true) {
          sphericalDelta.theta *= 1 - scope.dampingFactor;
          sphericalDelta.phi *= 1 - scope.dampingFactor;
          panOffset.multiplyScalar(1 - scope.dampingFactor);
        } else {
          sphericalDelta.set(0, 0, 0);
          panOffset.set(0, 0, 0);
        }
        let zoomChanged = false;
        if (scope.zoomToCursor && performCursorZoom) {
          let newRadius = null;
          if (scope.object instanceof PerspectiveCamera$1 && scope.object.isPerspectiveCamera) {
            const prevRadius = offset.length();
            newRadius = clampDistance(prevRadius * scale);
            const radiusDelta = prevRadius - newRadius;
            scope.object.position.addScaledVector(dollyDirection, radiusDelta);
            scope.object.updateMatrixWorld();
          } else if (scope.object.isOrthographicCamera) {
            const mouseBefore = new Vector3(mouse.x, mouse.y, 0);
            mouseBefore.unproject(scope.object);
            scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / scale));
            scope.object.updateProjectionMatrix();
            zoomChanged = true;
            const mouseAfter = new Vector3(mouse.x, mouse.y, 0);
            mouseAfter.unproject(scope.object);
            scope.object.position.sub(mouseAfter).add(mouseBefore);
            scope.object.updateMatrixWorld();
            newRadius = offset.length();
          } else {
            console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.");
            scope.zoomToCursor = false;
          }
          if (newRadius !== null) {
            if (scope.screenSpacePanning) {
              scope.target.set(0, 0, -1).transformDirection(scope.object.matrix).multiplyScalar(newRadius).add(scope.object.position);
            } else {
              _ray.origin.copy(scope.object.position);
              _ray.direction.set(0, 0, -1).transformDirection(scope.object.matrix);
              if (Math.abs(scope.object.up.dot(_ray.direction)) < TILT_LIMIT) {
                object.lookAt(scope.target);
              } else {
                _plane.setFromNormalAndCoplanarPoint(scope.object.up, scope.target);
                _ray.intersectPlane(_plane, scope.target);
              }
            }
          }
        } else if (scope.object instanceof OrthographicCamera && scope.object.isOrthographicCamera) {
          zoomChanged = scale !== 1;
          if (zoomChanged) {
            scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / scale));
            scope.object.updateProjectionMatrix();
          }
        }
        scale = 1;
        performCursorZoom = false;
        if (zoomChanged || lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
          scope.dispatchEvent(changeEvent);
          lastPosition.copy(scope.object.position);
          lastQuaternion.copy(scope.object.quaternion);
          zoomChanged = false;
          return true;
        }
        return false;
      };
    })();
    this.connect = (domElement2) => {
      scope.domElement = domElement2;
      scope.domElement.style.touchAction = "none";
      scope.domElement.addEventListener("contextmenu", onContextMenu);
      scope.domElement.addEventListener("pointerdown", onPointerDown);
      scope.domElement.addEventListener("pointercancel", onPointerUp);
      scope.domElement.addEventListener("wheel", onMouseWheel);
    };
    this.dispose = () => {
      var _a2, _b2, _c, _d, _e, _f;
      if (scope.domElement) {
        scope.domElement.style.touchAction = "auto";
      }
      (_a2 = scope.domElement) == null ? void 0 : _a2.removeEventListener("contextmenu", onContextMenu);
      (_b2 = scope.domElement) == null ? void 0 : _b2.removeEventListener("pointerdown", onPointerDown);
      (_c = scope.domElement) == null ? void 0 : _c.removeEventListener("pointercancel", onPointerUp);
      (_d = scope.domElement) == null ? void 0 : _d.removeEventListener("wheel", onMouseWheel);
      (_e = scope.domElement) == null ? void 0 : _e.ownerDocument.removeEventListener("pointermove", onPointerMove);
      (_f = scope.domElement) == null ? void 0 : _f.ownerDocument.removeEventListener("pointerup", onPointerUp);
      if (scope._domElementKeyEvents !== null) {
        scope._domElementKeyEvents.removeEventListener("keydown", onKeyDown);
      }
    };
    const scope = this;
    const changeEvent = { type: "change" };
    const startEvent = { type: "start" };
    const endEvent = { type: "end" };
    const STATE = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_PAN: 4,
      TOUCH_DOLLY_PAN: 5,
      TOUCH_DOLLY_ROTATE: 6
    };
    let state = STATE.NONE;
    const EPS = 1e-6;
    const spherical = new Spherical();
    const sphericalDelta = new Spherical();
    let scale = 1;
    const panOffset = new Vector3();
    const rotateStart = new Vector2();
    const rotateEnd = new Vector2();
    const rotateDelta = new Vector2();
    const panStart = new Vector2();
    const panEnd = new Vector2();
    const panDelta = new Vector2();
    const dollyStart = new Vector2();
    const dollyEnd = new Vector2();
    const dollyDelta = new Vector2();
    const dollyDirection = new Vector3();
    const mouse = new Vector2();
    let performCursorZoom = false;
    const pointers = [];
    const pointerPositions = {};
    function getAutoRotationAngle() {
      return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
    }
    function getZoomScale() {
      return Math.pow(0.95, scope.zoomSpeed);
    }
    function rotateLeft(angle) {
      if (scope.reverseOrbit || scope.reverseHorizontalOrbit) {
        sphericalDelta.theta += angle;
      } else {
        sphericalDelta.theta -= angle;
      }
    }
    function rotateUp(angle) {
      if (scope.reverseOrbit || scope.reverseVerticalOrbit) {
        sphericalDelta.phi += angle;
      } else {
        sphericalDelta.phi -= angle;
      }
    }
    const panLeft = (() => {
      const v = new Vector3();
      return function panLeft2(distance, objectMatrix) {
        v.setFromMatrixColumn(objectMatrix, 0);
        v.multiplyScalar(-distance);
        panOffset.add(v);
      };
    })();
    const panUp = (() => {
      const v = new Vector3();
      return function panUp2(distance, objectMatrix) {
        if (scope.screenSpacePanning === true) {
          v.setFromMatrixColumn(objectMatrix, 1);
        } else {
          v.setFromMatrixColumn(objectMatrix, 0);
          v.crossVectors(scope.object.up, v);
        }
        v.multiplyScalar(distance);
        panOffset.add(v);
      };
    })();
    const pan = (() => {
      const offset = new Vector3();
      return function pan2(deltaX, deltaY) {
        const element = scope.domElement;
        if (element && scope.object instanceof PerspectiveCamera$1 && scope.object.isPerspectiveCamera) {
          const position = scope.object.position;
          offset.copy(position).sub(scope.target);
          let targetDistance = offset.length();
          targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180);
          panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
          panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
        } else if (element && scope.object instanceof OrthographicCamera && scope.object.isOrthographicCamera) {
          panLeft(
            deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth,
            scope.object.matrix
          );
          panUp(
            deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight,
            scope.object.matrix
          );
        } else {
          console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
          scope.enablePan = false;
        }
      };
    })();
    function setScale(newScale) {
      if (scope.object instanceof PerspectiveCamera$1 && scope.object.isPerspectiveCamera || scope.object instanceof OrthographicCamera && scope.object.isOrthographicCamera) {
        scale = newScale;
      } else {
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
        scope.enableZoom = false;
      }
    }
    function dollyOut(dollyScale) {
      setScale(scale / dollyScale);
    }
    function dollyIn(dollyScale) {
      setScale(scale * dollyScale);
    }
    function updateMouseParameters(event) {
      if (!scope.zoomToCursor || !scope.domElement) {
        return;
      }
      performCursorZoom = true;
      const rect = scope.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      mouse.x = x / w * 2 - 1;
      mouse.y = -(y / h) * 2 + 1;
      dollyDirection.set(mouse.x, mouse.y, 1).unproject(scope.object).sub(scope.object.position).normalize();
    }
    function clampDistance(dist) {
      return Math.max(scope.minDistance, Math.min(scope.maxDistance, dist));
    }
    function handleMouseDownRotate(event) {
      rotateStart.set(event.clientX, event.clientY);
    }
    function handleMouseDownDolly(event) {
      updateMouseParameters(event);
      dollyStart.set(event.clientX, event.clientY);
    }
    function handleMouseDownPan(event) {
      panStart.set(event.clientX, event.clientY);
    }
    function handleMouseMoveRotate(event) {
      rotateEnd.set(event.clientX, event.clientY);
      rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
      const element = scope.domElement;
      if (element) {
        rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight);
        rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
      }
      rotateStart.copy(rotateEnd);
      scope.update();
    }
    function handleMouseMoveDolly(event) {
      dollyEnd.set(event.clientX, event.clientY);
      dollyDelta.subVectors(dollyEnd, dollyStart);
      if (dollyDelta.y > 0) {
        dollyOut(getZoomScale());
      } else if (dollyDelta.y < 0) {
        dollyIn(getZoomScale());
      }
      dollyStart.copy(dollyEnd);
      scope.update();
    }
    function handleMouseMovePan(event) {
      panEnd.set(event.clientX, event.clientY);
      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x, panDelta.y);
      panStart.copy(panEnd);
      scope.update();
    }
    function handleMouseWheel(event) {
      updateMouseParameters(event);
      if (event.deltaY < 0) {
        dollyIn(getZoomScale());
      } else if (event.deltaY > 0) {
        dollyOut(getZoomScale());
      }
      scope.update();
    }
    function handleKeyDown(event) {
      let needsUpdate = false;
      switch (event.code) {
        case scope.keys.UP:
          pan(0, scope.keyPanSpeed);
          needsUpdate = true;
          break;
        case scope.keys.BOTTOM:
          pan(0, -scope.keyPanSpeed);
          needsUpdate = true;
          break;
        case scope.keys.LEFT:
          pan(scope.keyPanSpeed, 0);
          needsUpdate = true;
          break;
        case scope.keys.RIGHT:
          pan(-scope.keyPanSpeed, 0);
          needsUpdate = true;
          break;
      }
      if (needsUpdate) {
        event.preventDefault();
        scope.update();
      }
    }
    function handleTouchStartRotate() {
      if (pointers.length == 1) {
        rotateStart.set(pointers[0].pageX, pointers[0].pageY);
      } else {
        const x = 0.5 * (pointers[0].pageX + pointers[1].pageX);
        const y = 0.5 * (pointers[0].pageY + pointers[1].pageY);
        rotateStart.set(x, y);
      }
    }
    function handleTouchStartPan() {
      if (pointers.length == 1) {
        panStart.set(pointers[0].pageX, pointers[0].pageY);
      } else {
        const x = 0.5 * (pointers[0].pageX + pointers[1].pageX);
        const y = 0.5 * (pointers[0].pageY + pointers[1].pageY);
        panStart.set(x, y);
      }
    }
    function handleTouchStartDolly() {
      const dx = pointers[0].pageX - pointers[1].pageX;
      const dy = pointers[0].pageY - pointers[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      dollyStart.set(0, distance);
    }
    function handleTouchStartDollyPan() {
      if (scope.enableZoom)
        handleTouchStartDolly();
      if (scope.enablePan)
        handleTouchStartPan();
    }
    function handleTouchStartDollyRotate() {
      if (scope.enableZoom)
        handleTouchStartDolly();
      if (scope.enableRotate)
        handleTouchStartRotate();
    }
    function handleTouchMoveRotate(event) {
      if (pointers.length == 1) {
        rotateEnd.set(event.pageX, event.pageY);
      } else {
        const position = getSecondPointerPosition(event);
        const x = 0.5 * (event.pageX + position.x);
        const y = 0.5 * (event.pageY + position.y);
        rotateEnd.set(x, y);
      }
      rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
      const element = scope.domElement;
      if (element) {
        rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight);
        rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
      }
      rotateStart.copy(rotateEnd);
    }
    function handleTouchMovePan(event) {
      if (pointers.length == 1) {
        panEnd.set(event.pageX, event.pageY);
      } else {
        const position = getSecondPointerPosition(event);
        const x = 0.5 * (event.pageX + position.x);
        const y = 0.5 * (event.pageY + position.y);
        panEnd.set(x, y);
      }
      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x, panDelta.y);
      panStart.copy(panEnd);
    }
    function handleTouchMoveDolly(event) {
      const position = getSecondPointerPosition(event);
      const dx = event.pageX - position.x;
      const dy = event.pageY - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      dollyEnd.set(0, distance);
      dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));
      dollyOut(dollyDelta.y);
      dollyStart.copy(dollyEnd);
    }
    function handleTouchMoveDollyPan(event) {
      if (scope.enableZoom)
        handleTouchMoveDolly(event);
      if (scope.enablePan)
        handleTouchMovePan(event);
    }
    function handleTouchMoveDollyRotate(event) {
      if (scope.enableZoom)
        handleTouchMoveDolly(event);
      if (scope.enableRotate)
        handleTouchMoveRotate(event);
    }
    function onPointerDown(event) {
      var _a2, _b2;
      if (scope.enabled === false)
        return;
      if (pointers.length === 0) {
        (_a2 = scope.domElement) == null ? void 0 : _a2.ownerDocument.addEventListener("pointermove", onPointerMove);
        (_b2 = scope.domElement) == null ? void 0 : _b2.ownerDocument.addEventListener("pointerup", onPointerUp);
      }
      addPointer(event);
      if (event.pointerType === "touch") {
        onTouchStart(event);
      } else {
        onMouseDown(event);
      }
    }
    function onPointerMove(event) {
      if (scope.enabled === false)
        return;
      if (event.pointerType === "touch") {
        onTouchMove(event);
      } else {
        onMouseMove(event);
      }
    }
    function onPointerUp(event) {
      var _a2, _b2, _c;
      removePointer(event);
      if (pointers.length === 0) {
        (_a2 = scope.domElement) == null ? void 0 : _a2.releasePointerCapture(event.pointerId);
        (_b2 = scope.domElement) == null ? void 0 : _b2.ownerDocument.removeEventListener("pointermove", onPointerMove);
        (_c = scope.domElement) == null ? void 0 : _c.ownerDocument.removeEventListener("pointerup", onPointerUp);
      }
      scope.dispatchEvent(endEvent);
      state = STATE.NONE;
    }
    function onMouseDown(event) {
      let mouseAction;
      switch (event.button) {
        case 0:
          mouseAction = scope.mouseButtons.LEFT;
          break;
        case 1:
          mouseAction = scope.mouseButtons.MIDDLE;
          break;
        case 2:
          mouseAction = scope.mouseButtons.RIGHT;
          break;
        default:
          mouseAction = -1;
      }
      switch (mouseAction) {
        case MOUSE.DOLLY:
          if (scope.enableZoom === false)
            return;
          handleMouseDownDolly(event);
          state = STATE.DOLLY;
          break;
        case MOUSE.ROTATE:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enablePan === false)
              return;
            handleMouseDownPan(event);
            state = STATE.PAN;
          } else {
            if (scope.enableRotate === false)
              return;
            handleMouseDownRotate(event);
            state = STATE.ROTATE;
          }
          break;
        case MOUSE.PAN:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enableRotate === false)
              return;
            handleMouseDownRotate(event);
            state = STATE.ROTATE;
          } else {
            if (scope.enablePan === false)
              return;
            handleMouseDownPan(event);
            state = STATE.PAN;
          }
          break;
        default:
          state = STATE.NONE;
      }
      if (state !== STATE.NONE) {
        scope.dispatchEvent(startEvent);
      }
    }
    function onMouseMove(event) {
      if (scope.enabled === false)
        return;
      switch (state) {
        case STATE.ROTATE:
          if (scope.enableRotate === false)
            return;
          handleMouseMoveRotate(event);
          break;
        case STATE.DOLLY:
          if (scope.enableZoom === false)
            return;
          handleMouseMoveDolly(event);
          break;
        case STATE.PAN:
          if (scope.enablePan === false)
            return;
          handleMouseMovePan(event);
          break;
      }
    }
    function onMouseWheel(event) {
      if (scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE && state !== STATE.ROTATE) {
        return;
      }
      event.preventDefault();
      scope.dispatchEvent(startEvent);
      handleMouseWheel(event);
      scope.dispatchEvent(endEvent);
    }
    function onKeyDown(event) {
      if (scope.enabled === false || scope.enablePan === false)
        return;
      handleKeyDown(event);
    }
    function onTouchStart(event) {
      trackPointer(event);
      switch (pointers.length) {
        case 1:
          switch (scope.touches.ONE) {
            case TOUCH.ROTATE:
              if (scope.enableRotate === false)
                return;
              handleTouchStartRotate();
              state = STATE.TOUCH_ROTATE;
              break;
            case TOUCH.PAN:
              if (scope.enablePan === false)
                return;
              handleTouchStartPan();
              state = STATE.TOUCH_PAN;
              break;
            default:
              state = STATE.NONE;
          }
          break;
        case 2:
          switch (scope.touches.TWO) {
            case TOUCH.DOLLY_PAN:
              if (scope.enableZoom === false && scope.enablePan === false)
                return;
              handleTouchStartDollyPan();
              state = STATE.TOUCH_DOLLY_PAN;
              break;
            case TOUCH.DOLLY_ROTATE:
              if (scope.enableZoom === false && scope.enableRotate === false)
                return;
              handleTouchStartDollyRotate();
              state = STATE.TOUCH_DOLLY_ROTATE;
              break;
            default:
              state = STATE.NONE;
          }
          break;
        default:
          state = STATE.NONE;
      }
      if (state !== STATE.NONE) {
        scope.dispatchEvent(startEvent);
      }
    }
    function onTouchMove(event) {
      trackPointer(event);
      switch (state) {
        case STATE.TOUCH_ROTATE:
          if (scope.enableRotate === false)
            return;
          handleTouchMoveRotate(event);
          scope.update();
          break;
        case STATE.TOUCH_PAN:
          if (scope.enablePan === false)
            return;
          handleTouchMovePan(event);
          scope.update();
          break;
        case STATE.TOUCH_DOLLY_PAN:
          if (scope.enableZoom === false && scope.enablePan === false)
            return;
          handleTouchMoveDollyPan(event);
          scope.update();
          break;
        case STATE.TOUCH_DOLLY_ROTATE:
          if (scope.enableZoom === false && scope.enableRotate === false)
            return;
          handleTouchMoveDollyRotate(event);
          scope.update();
          break;
        default:
          state = STATE.NONE;
      }
    }
    function onContextMenu(event) {
      if (scope.enabled === false)
        return;
      event.preventDefault();
    }
    function addPointer(event) {
      pointers.push(event);
    }
    function removePointer(event) {
      delete pointerPositions[event.pointerId];
      for (let i = 0; i < pointers.length; i++) {
        if (pointers[i].pointerId == event.pointerId) {
          pointers.splice(i, 1);
          return;
        }
      }
    }
    function trackPointer(event) {
      let position = pointerPositions[event.pointerId];
      if (position === void 0) {
        position = new Vector2();
        pointerPositions[event.pointerId] = position;
      }
      position.set(event.pageX, event.pageY);
    }
    function getSecondPointerPosition(event) {
      const pointer = event.pointerId === pointers[0].pointerId ? pointers[1] : pointers[0];
      return pointerPositions[pointer.pointerId];
    }
    this.dollyIn = (dollyScale = getZoomScale()) => {
      dollyIn(dollyScale);
      scope.update();
    };
    this.dollyOut = (dollyScale = getZoomScale()) => {
      dollyOut(dollyScale);
      scope.update();
    };
    this.getScale = () => {
      return scale;
    };
    this.setScale = (newScale) => {
      setScale(newScale);
      scope.update();
    };
    this.getZoomScale = () => {
      return getZoomScale();
    };
    if (domElement !== void 0)
      this.connect(domElement);
    this.update();
  }
};
class RGBELoader extends DataTextureLoader {
  constructor(manager) {
    super(manager);
    this.type = HalfFloatType;
  }
  // adapted from http://www.graphics.cornell.edu/~bjw/rgbe.html
  parse(buffer) {
    const rgbe_read_error = 1, rgbe_write_error = 2, rgbe_format_error = 3, rgbe_memory_error = 4, rgbe_error = function(rgbe_error_code, msg) {
      switch (rgbe_error_code) {
        case rgbe_read_error:
          throw new Error("THREE.RGBELoader: Read Error: " + (msg || ""));
        case rgbe_write_error:
          throw new Error("THREE.RGBELoader: Write Error: " + (msg || ""));
        case rgbe_format_error:
          throw new Error("THREE.RGBELoader: Bad File Format: " + (msg || ""));
        default:
        case rgbe_memory_error:
          throw new Error("THREE.RGBELoader: Memory Error: " + (msg || ""));
      }
    }, RGBE_VALID_PROGRAMTYPE = 1, RGBE_VALID_FORMAT = 2, RGBE_VALID_DIMENSIONS = 4, NEWLINE = "\n", fgets = function(buffer2, lineLimit, consume) {
      const chunkSize = 128;
      lineLimit = !lineLimit ? 1024 : lineLimit;
      let p = buffer2.pos, i = -1, len = 0, s = "", chunk = String.fromCharCode.apply(null, new Uint16Array(buffer2.subarray(p, p + chunkSize)));
      while (0 > (i = chunk.indexOf(NEWLINE)) && len < lineLimit && p < buffer2.byteLength) {
        s += chunk;
        len += chunk.length;
        p += chunkSize;
        chunk += String.fromCharCode.apply(null, new Uint16Array(buffer2.subarray(p, p + chunkSize)));
      }
      if (-1 < i) {
        buffer2.pos += len + i + 1;
        return s + chunk.slice(0, i);
      }
      return false;
    }, RGBE_ReadHeader = function(buffer2) {
      const magic_token_re = /^#\?(\S+)/, gamma_re = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/, exposure_re = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/, format_re = /^\s*FORMAT=(\S+)\s*$/, dimensions_re = /^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/, header = {
        valid: 0,
        string: "",
        comments: "",
        programtype: "RGBE",
        format: "",
        gamma: 1,
        exposure: 1,
        width: 0,
        height: 0
      };
      let line, match;
      if (buffer2.pos >= buffer2.byteLength || !(line = fgets(buffer2))) {
        rgbe_error(rgbe_read_error, "no header found");
      }
      if (!(match = line.match(magic_token_re))) {
        rgbe_error(rgbe_format_error, "bad initial token");
      }
      header.valid |= RGBE_VALID_PROGRAMTYPE;
      header.programtype = match[1];
      header.string += line + "\n";
      while (true) {
        line = fgets(buffer2);
        if (false === line)
          break;
        header.string += line + "\n";
        if ("#" === line.charAt(0)) {
          header.comments += line + "\n";
          continue;
        }
        if (match = line.match(gamma_re)) {
          header.gamma = parseFloat(match[1]);
        }
        if (match = line.match(exposure_re)) {
          header.exposure = parseFloat(match[1]);
        }
        if (match = line.match(format_re)) {
          header.valid |= RGBE_VALID_FORMAT;
          header.format = match[1];
        }
        if (match = line.match(dimensions_re)) {
          header.valid |= RGBE_VALID_DIMENSIONS;
          header.height = parseInt(match[1], 10);
          header.width = parseInt(match[2], 10);
        }
        if (header.valid & RGBE_VALID_FORMAT && header.valid & RGBE_VALID_DIMENSIONS)
          break;
      }
      if (!(header.valid & RGBE_VALID_FORMAT)) {
        rgbe_error(rgbe_format_error, "missing format specifier");
      }
      if (!(header.valid & RGBE_VALID_DIMENSIONS)) {
        rgbe_error(rgbe_format_error, "missing image size specifier");
      }
      return header;
    }, RGBE_ReadPixels_RLE = function(buffer2, w2, h2) {
      const scanline_width = w2;
      if (
        // run length encoding is not allowed so read flat
        scanline_width < 8 || scanline_width > 32767 || // this file is not run length encoded
        2 !== buffer2[0] || 2 !== buffer2[1] || buffer2[2] & 128
      ) {
        return new Uint8Array(buffer2);
      }
      if (scanline_width !== (buffer2[2] << 8 | buffer2[3])) {
        rgbe_error(rgbe_format_error, "wrong scanline width");
      }
      const data_rgba = new Uint8Array(4 * w2 * h2);
      if (!data_rgba.length) {
        rgbe_error(rgbe_memory_error, "unable to allocate buffer space");
      }
      let offset = 0, pos = 0;
      const ptr_end = 4 * scanline_width;
      const rgbeStart = new Uint8Array(4);
      const scanline_buffer = new Uint8Array(ptr_end);
      let num_scanlines = h2;
      while (num_scanlines > 0 && pos < buffer2.byteLength) {
        if (pos + 4 > buffer2.byteLength) {
          rgbe_error(rgbe_read_error);
        }
        rgbeStart[0] = buffer2[pos++];
        rgbeStart[1] = buffer2[pos++];
        rgbeStart[2] = buffer2[pos++];
        rgbeStart[3] = buffer2[pos++];
        if (2 != rgbeStart[0] || 2 != rgbeStart[1] || (rgbeStart[2] << 8 | rgbeStart[3]) != scanline_width) {
          rgbe_error(rgbe_format_error, "bad rgbe scanline format");
        }
        let ptr = 0, count;
        while (ptr < ptr_end && pos < buffer2.byteLength) {
          count = buffer2[pos++];
          const isEncodedRun = count > 128;
          if (isEncodedRun)
            count -= 128;
          if (0 === count || ptr + count > ptr_end) {
            rgbe_error(rgbe_format_error, "bad scanline data");
          }
          if (isEncodedRun) {
            const byteValue = buffer2[pos++];
            for (let i = 0; i < count; i++) {
              scanline_buffer[ptr++] = byteValue;
            }
          } else {
            scanline_buffer.set(buffer2.subarray(pos, pos + count), ptr);
            ptr += count;
            pos += count;
          }
        }
        const l = scanline_width;
        for (let i = 0; i < l; i++) {
          let off = 0;
          data_rgba[offset] = scanline_buffer[i + off];
          off += scanline_width;
          data_rgba[offset + 1] = scanline_buffer[i + off];
          off += scanline_width;
          data_rgba[offset + 2] = scanline_buffer[i + off];
          off += scanline_width;
          data_rgba[offset + 3] = scanline_buffer[i + off];
          offset += 4;
        }
        num_scanlines--;
      }
      return data_rgba;
    };
    const RGBEByteToRGBFloat = function(sourceArray, sourceOffset, destArray, destOffset) {
      const e = sourceArray[sourceOffset + 3];
      const scale = Math.pow(2, e - 128) / 255;
      destArray[destOffset + 0] = sourceArray[sourceOffset + 0] * scale;
      destArray[destOffset + 1] = sourceArray[sourceOffset + 1] * scale;
      destArray[destOffset + 2] = sourceArray[sourceOffset + 2] * scale;
      destArray[destOffset + 3] = 1;
    };
    const RGBEByteToRGBHalf = function(sourceArray, sourceOffset, destArray, destOffset) {
      const e = sourceArray[sourceOffset + 3];
      const scale = Math.pow(2, e - 128) / 255;
      destArray[destOffset + 0] = DataUtils.toHalfFloat(Math.min(sourceArray[sourceOffset + 0] * scale, 65504));
      destArray[destOffset + 1] = DataUtils.toHalfFloat(Math.min(sourceArray[sourceOffset + 1] * scale, 65504));
      destArray[destOffset + 2] = DataUtils.toHalfFloat(Math.min(sourceArray[sourceOffset + 2] * scale, 65504));
      destArray[destOffset + 3] = DataUtils.toHalfFloat(1);
    };
    const byteArray = new Uint8Array(buffer);
    byteArray.pos = 0;
    const rgbe_header_info = RGBE_ReadHeader(byteArray);
    const w = rgbe_header_info.width, h = rgbe_header_info.height, image_rgba_data = RGBE_ReadPixels_RLE(byteArray.subarray(byteArray.pos), w, h);
    let data, type;
    let numElements;
    switch (this.type) {
      case FloatType:
        numElements = image_rgba_data.length / 4;
        const floatArray = new Float32Array(numElements * 4);
        for (let j = 0; j < numElements; j++) {
          RGBEByteToRGBFloat(image_rgba_data, j * 4, floatArray, j * 4);
        }
        data = floatArray;
        type = FloatType;
        break;
      case HalfFloatType:
        numElements = image_rgba_data.length / 4;
        const halfArray = new Uint16Array(numElements * 4);
        for (let j = 0; j < numElements; j++) {
          RGBEByteToRGBHalf(image_rgba_data, j * 4, halfArray, j * 4);
        }
        data = halfArray;
        type = HalfFloatType;
        break;
      default:
        throw new Error("THREE.RGBELoader: Unsupported type: " + this.type);
    }
    return {
      width: w,
      height: h,
      data,
      header: rgbe_header_info.string,
      gamma: rgbe_header_info.gamma,
      exposure: rgbe_header_info.exposure,
      type
    };
  }
  setDataType(value) {
    this.type = value;
    return this;
  }
  load(url, onLoad, onProgress, onError) {
    function onLoadCallback(texture, texData) {
      switch (texture.type) {
        case FloatType:
        case HalfFloatType:
          if ("colorSpace" in texture)
            texture.colorSpace = "srgb-linear";
          else
            texture.encoding = 3e3;
          texture.minFilter = LinearFilter;
          texture.magFilter = LinearFilter;
          texture.generateMipmaps = false;
          texture.flipY = true;
          break;
      }
      if (onLoad)
        onLoad(texture, texData);
    }
    return super.load(url, onLoadCallback, onProgress, onError);
  }
}
const hasColorSpace = version >= 152;
class EXRLoader extends DataTextureLoader {
  constructor(manager) {
    super(manager);
    this.type = HalfFloatType;
  }
  parse(buffer) {
    const USHORT_RANGE = 1 << 16;
    const BITMAP_SIZE = USHORT_RANGE >> 3;
    const HUF_ENCBITS = 16;
    const HUF_DECBITS = 14;
    const HUF_ENCSIZE = (1 << HUF_ENCBITS) + 1;
    const HUF_DECSIZE = 1 << HUF_DECBITS;
    const HUF_DECMASK = HUF_DECSIZE - 1;
    const NBITS = 16;
    const A_OFFSET = 1 << NBITS - 1;
    const MOD_MASK = (1 << NBITS) - 1;
    const SHORT_ZEROCODE_RUN = 59;
    const LONG_ZEROCODE_RUN = 63;
    const SHORTEST_LONG_RUN = 2 + LONG_ZEROCODE_RUN - SHORT_ZEROCODE_RUN;
    const ULONG_SIZE = 8;
    const FLOAT32_SIZE = 4;
    const INT32_SIZE = 4;
    const INT16_SIZE = 2;
    const INT8_SIZE = 1;
    const STATIC_HUFFMAN = 0;
    const DEFLATE = 1;
    const UNKNOWN = 0;
    const LOSSY_DCT = 1;
    const RLE = 2;
    const logBase = Math.pow(2.7182818, 2.2);
    function reverseLutFromBitmap(bitmap, lut) {
      var k = 0;
      for (var i = 0; i < USHORT_RANGE; ++i) {
        if (i == 0 || bitmap[i >> 3] & 1 << (i & 7)) {
          lut[k++] = i;
        }
      }
      var n = k - 1;
      while (k < USHORT_RANGE)
        lut[k++] = 0;
      return n;
    }
    function hufClearDecTable(hdec) {
      for (var i = 0; i < HUF_DECSIZE; i++) {
        hdec[i] = {};
        hdec[i].len = 0;
        hdec[i].lit = 0;
        hdec[i].p = null;
      }
    }
    const getBitsReturn = { l: 0, c: 0, lc: 0 };
    function getBits(nBits, c, lc, uInt8Array2, inOffset) {
      while (lc < nBits) {
        c = c << 8 | parseUint8Array(uInt8Array2, inOffset);
        lc += 8;
      }
      lc -= nBits;
      getBitsReturn.l = c >> lc & (1 << nBits) - 1;
      getBitsReturn.c = c;
      getBitsReturn.lc = lc;
    }
    const hufTableBuffer = new Array(59);
    function hufCanonicalCodeTable(hcode) {
      for (var i = 0; i <= 58; ++i)
        hufTableBuffer[i] = 0;
      for (var i = 0; i < HUF_ENCSIZE; ++i)
        hufTableBuffer[hcode[i]] += 1;
      var c = 0;
      for (var i = 58; i > 0; --i) {
        var nc = c + hufTableBuffer[i] >> 1;
        hufTableBuffer[i] = c;
        c = nc;
      }
      for (var i = 0; i < HUF_ENCSIZE; ++i) {
        var l = hcode[i];
        if (l > 0)
          hcode[i] = l | hufTableBuffer[l]++ << 6;
      }
    }
    function hufUnpackEncTable(uInt8Array2, inDataView, inOffset, ni, im, iM, hcode) {
      var p = inOffset;
      var c = 0;
      var lc = 0;
      for (; im <= iM; im++) {
        if (p.value - inOffset.value > ni)
          return false;
        getBits(6, c, lc, uInt8Array2, p);
        var l = getBitsReturn.l;
        c = getBitsReturn.c;
        lc = getBitsReturn.lc;
        hcode[im] = l;
        if (l == LONG_ZEROCODE_RUN) {
          if (p.value - inOffset.value > ni) {
            throw "Something wrong with hufUnpackEncTable";
          }
          getBits(8, c, lc, uInt8Array2, p);
          var zerun = getBitsReturn.l + SHORTEST_LONG_RUN;
          c = getBitsReturn.c;
          lc = getBitsReturn.lc;
          if (im + zerun > iM + 1) {
            throw "Something wrong with hufUnpackEncTable";
          }
          while (zerun--)
            hcode[im++] = 0;
          im--;
        } else if (l >= SHORT_ZEROCODE_RUN) {
          var zerun = l - SHORT_ZEROCODE_RUN + 2;
          if (im + zerun > iM + 1) {
            throw "Something wrong with hufUnpackEncTable";
          }
          while (zerun--)
            hcode[im++] = 0;
          im--;
        }
      }
      hufCanonicalCodeTable(hcode);
    }
    function hufLength(code) {
      return code & 63;
    }
    function hufCode(code) {
      return code >> 6;
    }
    function hufBuildDecTable(hcode, im, iM, hdecod) {
      for (; im <= iM; im++) {
        var c = hufCode(hcode[im]);
        var l = hufLength(hcode[im]);
        if (c >> l) {
          throw "Invalid table entry";
        }
        if (l > HUF_DECBITS) {
          var pl = hdecod[c >> l - HUF_DECBITS];
          if (pl.len) {
            throw "Invalid table entry";
          }
          pl.lit++;
          if (pl.p) {
            var p = pl.p;
            pl.p = new Array(pl.lit);
            for (var i = 0; i < pl.lit - 1; ++i) {
              pl.p[i] = p[i];
            }
          } else {
            pl.p = new Array(1);
          }
          pl.p[pl.lit - 1] = im;
        } else if (l) {
          var plOffset = 0;
          for (var i = 1 << HUF_DECBITS - l; i > 0; i--) {
            var pl = hdecod[(c << HUF_DECBITS - l) + plOffset];
            if (pl.len || pl.p) {
              throw "Invalid table entry";
            }
            pl.len = l;
            pl.lit = im;
            plOffset++;
          }
        }
      }
      return true;
    }
    const getCharReturn = { c: 0, lc: 0 };
    function getChar(c, lc, uInt8Array2, inOffset) {
      c = c << 8 | parseUint8Array(uInt8Array2, inOffset);
      lc += 8;
      getCharReturn.c = c;
      getCharReturn.lc = lc;
    }
    const getCodeReturn = { c: 0, lc: 0 };
    function getCode(po, rlc, c, lc, uInt8Array2, inDataView, inOffset, outBuffer, outBufferOffset, outBufferEndOffset) {
      if (po == rlc) {
        if (lc < 8) {
          getChar(c, lc, uInt8Array2, inOffset);
          c = getCharReturn.c;
          lc = getCharReturn.lc;
        }
        lc -= 8;
        var cs = c >> lc;
        var cs = new Uint8Array([cs])[0];
        if (outBufferOffset.value + cs > outBufferEndOffset) {
          return false;
        }
        var s = outBuffer[outBufferOffset.value - 1];
        while (cs-- > 0) {
          outBuffer[outBufferOffset.value++] = s;
        }
      } else if (outBufferOffset.value < outBufferEndOffset) {
        outBuffer[outBufferOffset.value++] = po;
      } else {
        return false;
      }
      getCodeReturn.c = c;
      getCodeReturn.lc = lc;
    }
    function UInt16(value) {
      return value & 65535;
    }
    function Int16(value) {
      var ref = UInt16(value);
      return ref > 32767 ? ref - 65536 : ref;
    }
    const wdec14Return = { a: 0, b: 0 };
    function wdec14(l, h) {
      var ls = Int16(l);
      var hs = Int16(h);
      var hi = hs;
      var ai = ls + (hi & 1) + (hi >> 1);
      var as = ai;
      var bs = ai - hi;
      wdec14Return.a = as;
      wdec14Return.b = bs;
    }
    function wdec16(l, h) {
      var m = UInt16(l);
      var d = UInt16(h);
      var bb = m - (d >> 1) & MOD_MASK;
      var aa = d + bb - A_OFFSET & MOD_MASK;
      wdec14Return.a = aa;
      wdec14Return.b = bb;
    }
    function wav2Decode(buffer2, j, nx, ox, ny, oy, mx) {
      var w14 = mx < 1 << 14;
      var n = nx > ny ? ny : nx;
      var p = 1;
      var p2;
      while (p <= n)
        p <<= 1;
      p >>= 1;
      p2 = p;
      p >>= 1;
      while (p >= 1) {
        var py = 0;
        var ey = py + oy * (ny - p2);
        var oy1 = oy * p;
        var oy2 = oy * p2;
        var ox1 = ox * p;
        var ox2 = ox * p2;
        var i00, i01, i10, i11;
        for (; py <= ey; py += oy2) {
          var px = py;
          var ex = py + ox * (nx - p2);
          for (; px <= ex; px += ox2) {
            var p01 = px + ox1;
            var p10 = px + oy1;
            var p11 = p10 + ox1;
            if (w14) {
              wdec14(buffer2[px + j], buffer2[p10 + j]);
              i00 = wdec14Return.a;
              i10 = wdec14Return.b;
              wdec14(buffer2[p01 + j], buffer2[p11 + j]);
              i01 = wdec14Return.a;
              i11 = wdec14Return.b;
              wdec14(i00, i01);
              buffer2[px + j] = wdec14Return.a;
              buffer2[p01 + j] = wdec14Return.b;
              wdec14(i10, i11);
              buffer2[p10 + j] = wdec14Return.a;
              buffer2[p11 + j] = wdec14Return.b;
            } else {
              wdec16(buffer2[px + j], buffer2[p10 + j]);
              i00 = wdec14Return.a;
              i10 = wdec14Return.b;
              wdec16(buffer2[p01 + j], buffer2[p11 + j]);
              i01 = wdec14Return.a;
              i11 = wdec14Return.b;
              wdec16(i00, i01);
              buffer2[px + j] = wdec14Return.a;
              buffer2[p01 + j] = wdec14Return.b;
              wdec16(i10, i11);
              buffer2[p10 + j] = wdec14Return.a;
              buffer2[p11 + j] = wdec14Return.b;
            }
          }
          if (nx & p) {
            var p10 = px + oy1;
            if (w14)
              wdec14(buffer2[px + j], buffer2[p10 + j]);
            else
              wdec16(buffer2[px + j], buffer2[p10 + j]);
            i00 = wdec14Return.a;
            buffer2[p10 + j] = wdec14Return.b;
            buffer2[px + j] = i00;
          }
        }
        if (ny & p) {
          var px = py;
          var ex = py + ox * (nx - p2);
          for (; px <= ex; px += ox2) {
            var p01 = px + ox1;
            if (w14)
              wdec14(buffer2[px + j], buffer2[p01 + j]);
            else
              wdec16(buffer2[px + j], buffer2[p01 + j]);
            i00 = wdec14Return.a;
            buffer2[p01 + j] = wdec14Return.b;
            buffer2[px + j] = i00;
          }
        }
        p2 = p;
        p >>= 1;
      }
      return py;
    }
    function hufDecode(encodingTable, decodingTable, uInt8Array2, inDataView, inOffset, ni, rlc, no, outBuffer, outOffset) {
      var c = 0;
      var lc = 0;
      var outBufferEndOffset = no;
      var inOffsetEnd = Math.trunc(inOffset.value + (ni + 7) / 8);
      while (inOffset.value < inOffsetEnd) {
        getChar(c, lc, uInt8Array2, inOffset);
        c = getCharReturn.c;
        lc = getCharReturn.lc;
        while (lc >= HUF_DECBITS) {
          var index = c >> lc - HUF_DECBITS & HUF_DECMASK;
          var pl = decodingTable[index];
          if (pl.len) {
            lc -= pl.len;
            getCode(pl.lit, rlc, c, lc, uInt8Array2, inDataView, inOffset, outBuffer, outOffset, outBufferEndOffset);
            c = getCodeReturn.c;
            lc = getCodeReturn.lc;
          } else {
            if (!pl.p) {
              throw "hufDecode issues";
            }
            var j;
            for (j = 0; j < pl.lit; j++) {
              var l = hufLength(encodingTable[pl.p[j]]);
              while (lc < l && inOffset.value < inOffsetEnd) {
                getChar(c, lc, uInt8Array2, inOffset);
                c = getCharReturn.c;
                lc = getCharReturn.lc;
              }
              if (lc >= l) {
                if (hufCode(encodingTable[pl.p[j]]) == (c >> lc - l & (1 << l) - 1)) {
                  lc -= l;
                  getCode(
                    pl.p[j],
                    rlc,
                    c,
                    lc,
                    uInt8Array2,
                    inDataView,
                    inOffset,
                    outBuffer,
                    outOffset,
                    outBufferEndOffset
                  );
                  c = getCodeReturn.c;
                  lc = getCodeReturn.lc;
                  break;
                }
              }
            }
            if (j == pl.lit) {
              throw "hufDecode issues";
            }
          }
        }
      }
      var i = 8 - ni & 7;
      c >>= i;
      lc -= i;
      while (lc > 0) {
        var pl = decodingTable[c << HUF_DECBITS - lc & HUF_DECMASK];
        if (pl.len) {
          lc -= pl.len;
          getCode(pl.lit, rlc, c, lc, uInt8Array2, inDataView, inOffset, outBuffer, outOffset, outBufferEndOffset);
          c = getCodeReturn.c;
          lc = getCodeReturn.lc;
        } else {
          throw "hufDecode issues";
        }
      }
      return true;
    }
    function hufUncompress(uInt8Array2, inDataView, inOffset, nCompressed, outBuffer, nRaw) {
      var outOffset = { value: 0 };
      var initialInOffset = inOffset.value;
      var im = parseUint32(inDataView, inOffset);
      var iM = parseUint32(inDataView, inOffset);
      inOffset.value += 4;
      var nBits = parseUint32(inDataView, inOffset);
      inOffset.value += 4;
      if (im < 0 || im >= HUF_ENCSIZE || iM < 0 || iM >= HUF_ENCSIZE) {
        throw "Something wrong with HUF_ENCSIZE";
      }
      var freq = new Array(HUF_ENCSIZE);
      var hdec = new Array(HUF_DECSIZE);
      hufClearDecTable(hdec);
      var ni = nCompressed - (inOffset.value - initialInOffset);
      hufUnpackEncTable(uInt8Array2, inDataView, inOffset, ni, im, iM, freq);
      if (nBits > 8 * (nCompressed - (inOffset.value - initialInOffset))) {
        throw "Something wrong with hufUncompress";
      }
      hufBuildDecTable(freq, im, iM, hdec);
      hufDecode(freq, hdec, uInt8Array2, inDataView, inOffset, nBits, iM, nRaw, outBuffer, outOffset);
    }
    function applyLut(lut, data, nData) {
      for (var i = 0; i < nData; ++i) {
        data[i] = lut[data[i]];
      }
    }
    function predictor(source) {
      for (var t = 1; t < source.length; t++) {
        var d = source[t - 1] + source[t] - 128;
        source[t] = d;
      }
    }
    function interleaveScalar(source, out) {
      var t1 = 0;
      var t2 = Math.floor((source.length + 1) / 2);
      var s = 0;
      var stop = source.length - 1;
      while (true) {
        if (s > stop)
          break;
        out[s++] = source[t1++];
        if (s > stop)
          break;
        out[s++] = source[t2++];
      }
    }
    function decodeRunLength(source) {
      var size = source.byteLength;
      var out = new Array();
      var p = 0;
      var reader = new DataView(source);
      while (size > 0) {
        var l = reader.getInt8(p++);
        if (l < 0) {
          var count = -l;
          size -= count + 1;
          for (var i = 0; i < count; i++) {
            out.push(reader.getUint8(p++));
          }
        } else {
          var count = l;
          size -= 2;
          var value = reader.getUint8(p++);
          for (var i = 0; i < count + 1; i++) {
            out.push(value);
          }
        }
      }
      return out;
    }
    function lossyDctDecode(cscSet, rowPtrs, channelData, acBuffer, dcBuffer, outBuffer) {
      var dataView = new DataView(outBuffer.buffer);
      var width = channelData[cscSet.idx[0]].width;
      var height = channelData[cscSet.idx[0]].height;
      var numComp = 3;
      var numFullBlocksX = Math.floor(width / 8);
      var numBlocksX = Math.ceil(width / 8);
      var numBlocksY = Math.ceil(height / 8);
      var leftoverX = width - (numBlocksX - 1) * 8;
      var leftoverY = height - (numBlocksY - 1) * 8;
      var currAcComp = { value: 0 };
      var currDcComp = new Array(numComp);
      var dctData = new Array(numComp);
      var halfZigBlock = new Array(numComp);
      var rowBlock = new Array(numComp);
      var rowOffsets = new Array(numComp);
      for (let comp2 = 0; comp2 < numComp; ++comp2) {
        rowOffsets[comp2] = rowPtrs[cscSet.idx[comp2]];
        currDcComp[comp2] = comp2 < 1 ? 0 : currDcComp[comp2 - 1] + numBlocksX * numBlocksY;
        dctData[comp2] = new Float32Array(64);
        halfZigBlock[comp2] = new Uint16Array(64);
        rowBlock[comp2] = new Uint16Array(numBlocksX * 64);
      }
      for (let blocky = 0; blocky < numBlocksY; ++blocky) {
        var maxY = 8;
        if (blocky == numBlocksY - 1)
          maxY = leftoverY;
        var maxX = 8;
        for (let blockx = 0; blockx < numBlocksX; ++blockx) {
          if (blockx == numBlocksX - 1)
            maxX = leftoverX;
          for (let comp2 = 0; comp2 < numComp; ++comp2) {
            halfZigBlock[comp2].fill(0);
            halfZigBlock[comp2][0] = dcBuffer[currDcComp[comp2]++];
            unRleAC(currAcComp, acBuffer, halfZigBlock[comp2]);
            unZigZag(halfZigBlock[comp2], dctData[comp2]);
            dctInverse(dctData[comp2]);
          }
          {
            csc709Inverse(dctData);
          }
          for (let comp2 = 0; comp2 < numComp; ++comp2) {
            convertToHalf(dctData[comp2], rowBlock[comp2], blockx * 64);
          }
        }
        let offset2 = 0;
        for (let comp2 = 0; comp2 < numComp; ++comp2) {
          const type2 = channelData[cscSet.idx[comp2]].type;
          for (let y2 = 8 * blocky; y2 < 8 * blocky + maxY; ++y2) {
            offset2 = rowOffsets[comp2][y2];
            for (let blockx = 0; blockx < numFullBlocksX; ++blockx) {
              const src = blockx * 64 + (y2 & 7) * 8;
              dataView.setUint16(offset2 + 0 * INT16_SIZE * type2, rowBlock[comp2][src + 0], true);
              dataView.setUint16(offset2 + 1 * INT16_SIZE * type2, rowBlock[comp2][src + 1], true);
              dataView.setUint16(offset2 + 2 * INT16_SIZE * type2, rowBlock[comp2][src + 2], true);
              dataView.setUint16(offset2 + 3 * INT16_SIZE * type2, rowBlock[comp2][src + 3], true);
              dataView.setUint16(offset2 + 4 * INT16_SIZE * type2, rowBlock[comp2][src + 4], true);
              dataView.setUint16(offset2 + 5 * INT16_SIZE * type2, rowBlock[comp2][src + 5], true);
              dataView.setUint16(offset2 + 6 * INT16_SIZE * type2, rowBlock[comp2][src + 6], true);
              dataView.setUint16(offset2 + 7 * INT16_SIZE * type2, rowBlock[comp2][src + 7], true);
              offset2 += 8 * INT16_SIZE * type2;
            }
          }
          if (numFullBlocksX != numBlocksX) {
            for (let y2 = 8 * blocky; y2 < 8 * blocky + maxY; ++y2) {
              const offset3 = rowOffsets[comp2][y2] + 8 * numFullBlocksX * INT16_SIZE * type2;
              const src = numFullBlocksX * 64 + (y2 & 7) * 8;
              for (let x2 = 0; x2 < maxX; ++x2) {
                dataView.setUint16(offset3 + x2 * INT16_SIZE * type2, rowBlock[comp2][src + x2], true);
              }
            }
          }
        }
      }
      var halfRow = new Uint16Array(width);
      var dataView = new DataView(outBuffer.buffer);
      for (var comp = 0; comp < numComp; ++comp) {
        channelData[cscSet.idx[comp]].decoded = true;
        var type = channelData[cscSet.idx[comp]].type;
        if (channelData[comp].type != 2)
          continue;
        for (var y = 0; y < height; ++y) {
          const offset2 = rowOffsets[comp][y];
          for (var x = 0; x < width; ++x) {
            halfRow[x] = dataView.getUint16(offset2 + x * INT16_SIZE * type, true);
          }
          for (var x = 0; x < width; ++x) {
            dataView.setFloat32(offset2 + x * INT16_SIZE * type, decodeFloat16(halfRow[x]), true);
          }
        }
      }
    }
    function unRleAC(currAcComp, acBuffer, halfZigBlock) {
      var acValue;
      var dctComp = 1;
      while (dctComp < 64) {
        acValue = acBuffer[currAcComp.value];
        if (acValue == 65280) {
          dctComp = 64;
        } else if (acValue >> 8 == 255) {
          dctComp += acValue & 255;
        } else {
          halfZigBlock[dctComp] = acValue;
          dctComp++;
        }
        currAcComp.value++;
      }
    }
    function unZigZag(src, dst) {
      dst[0] = decodeFloat16(src[0]);
      dst[1] = decodeFloat16(src[1]);
      dst[2] = decodeFloat16(src[5]);
      dst[3] = decodeFloat16(src[6]);
      dst[4] = decodeFloat16(src[14]);
      dst[5] = decodeFloat16(src[15]);
      dst[6] = decodeFloat16(src[27]);
      dst[7] = decodeFloat16(src[28]);
      dst[8] = decodeFloat16(src[2]);
      dst[9] = decodeFloat16(src[4]);
      dst[10] = decodeFloat16(src[7]);
      dst[11] = decodeFloat16(src[13]);
      dst[12] = decodeFloat16(src[16]);
      dst[13] = decodeFloat16(src[26]);
      dst[14] = decodeFloat16(src[29]);
      dst[15] = decodeFloat16(src[42]);
      dst[16] = decodeFloat16(src[3]);
      dst[17] = decodeFloat16(src[8]);
      dst[18] = decodeFloat16(src[12]);
      dst[19] = decodeFloat16(src[17]);
      dst[20] = decodeFloat16(src[25]);
      dst[21] = decodeFloat16(src[30]);
      dst[22] = decodeFloat16(src[41]);
      dst[23] = decodeFloat16(src[43]);
      dst[24] = decodeFloat16(src[9]);
      dst[25] = decodeFloat16(src[11]);
      dst[26] = decodeFloat16(src[18]);
      dst[27] = decodeFloat16(src[24]);
      dst[28] = decodeFloat16(src[31]);
      dst[29] = decodeFloat16(src[40]);
      dst[30] = decodeFloat16(src[44]);
      dst[31] = decodeFloat16(src[53]);
      dst[32] = decodeFloat16(src[10]);
      dst[33] = decodeFloat16(src[19]);
      dst[34] = decodeFloat16(src[23]);
      dst[35] = decodeFloat16(src[32]);
      dst[36] = decodeFloat16(src[39]);
      dst[37] = decodeFloat16(src[45]);
      dst[38] = decodeFloat16(src[52]);
      dst[39] = decodeFloat16(src[54]);
      dst[40] = decodeFloat16(src[20]);
      dst[41] = decodeFloat16(src[22]);
      dst[42] = decodeFloat16(src[33]);
      dst[43] = decodeFloat16(src[38]);
      dst[44] = decodeFloat16(src[46]);
      dst[45] = decodeFloat16(src[51]);
      dst[46] = decodeFloat16(src[55]);
      dst[47] = decodeFloat16(src[60]);
      dst[48] = decodeFloat16(src[21]);
      dst[49] = decodeFloat16(src[34]);
      dst[50] = decodeFloat16(src[37]);
      dst[51] = decodeFloat16(src[47]);
      dst[52] = decodeFloat16(src[50]);
      dst[53] = decodeFloat16(src[56]);
      dst[54] = decodeFloat16(src[59]);
      dst[55] = decodeFloat16(src[61]);
      dst[56] = decodeFloat16(src[35]);
      dst[57] = decodeFloat16(src[36]);
      dst[58] = decodeFloat16(src[48]);
      dst[59] = decodeFloat16(src[49]);
      dst[60] = decodeFloat16(src[57]);
      dst[61] = decodeFloat16(src[58]);
      dst[62] = decodeFloat16(src[62]);
      dst[63] = decodeFloat16(src[63]);
    }
    function dctInverse(data) {
      const a = 0.5 * Math.cos(3.14159 / 4);
      const b = 0.5 * Math.cos(3.14159 / 16);
      const c = 0.5 * Math.cos(3.14159 / 8);
      const d = 0.5 * Math.cos(3 * 3.14159 / 16);
      const e = 0.5 * Math.cos(5 * 3.14159 / 16);
      const f = 0.5 * Math.cos(3 * 3.14159 / 8);
      const g = 0.5 * Math.cos(7 * 3.14159 / 16);
      var alpha = new Array(4);
      var beta = new Array(4);
      var theta = new Array(4);
      var gamma = new Array(4);
      for (var row = 0; row < 8; ++row) {
        var rowPtr = row * 8;
        alpha[0] = c * data[rowPtr + 2];
        alpha[1] = f * data[rowPtr + 2];
        alpha[2] = c * data[rowPtr + 6];
        alpha[3] = f * data[rowPtr + 6];
        beta[0] = b * data[rowPtr + 1] + d * data[rowPtr + 3] + e * data[rowPtr + 5] + g * data[rowPtr + 7];
        beta[1] = d * data[rowPtr + 1] - g * data[rowPtr + 3] - b * data[rowPtr + 5] - e * data[rowPtr + 7];
        beta[2] = e * data[rowPtr + 1] - b * data[rowPtr + 3] + g * data[rowPtr + 5] + d * data[rowPtr + 7];
        beta[3] = g * data[rowPtr + 1] - e * data[rowPtr + 3] + d * data[rowPtr + 5] - b * data[rowPtr + 7];
        theta[0] = a * (data[rowPtr + 0] + data[rowPtr + 4]);
        theta[3] = a * (data[rowPtr + 0] - data[rowPtr + 4]);
        theta[1] = alpha[0] + alpha[3];
        theta[2] = alpha[1] - alpha[2];
        gamma[0] = theta[0] + theta[1];
        gamma[1] = theta[3] + theta[2];
        gamma[2] = theta[3] - theta[2];
        gamma[3] = theta[0] - theta[1];
        data[rowPtr + 0] = gamma[0] + beta[0];
        data[rowPtr + 1] = gamma[1] + beta[1];
        data[rowPtr + 2] = gamma[2] + beta[2];
        data[rowPtr + 3] = gamma[3] + beta[3];
        data[rowPtr + 4] = gamma[3] - beta[3];
        data[rowPtr + 5] = gamma[2] - beta[2];
        data[rowPtr + 6] = gamma[1] - beta[1];
        data[rowPtr + 7] = gamma[0] - beta[0];
      }
      for (var column = 0; column < 8; ++column) {
        alpha[0] = c * data[16 + column];
        alpha[1] = f * data[16 + column];
        alpha[2] = c * data[48 + column];
        alpha[3] = f * data[48 + column];
        beta[0] = b * data[8 + column] + d * data[24 + column] + e * data[40 + column] + g * data[56 + column];
        beta[1] = d * data[8 + column] - g * data[24 + column] - b * data[40 + column] - e * data[56 + column];
        beta[2] = e * data[8 + column] - b * data[24 + column] + g * data[40 + column] + d * data[56 + column];
        beta[3] = g * data[8 + column] - e * data[24 + column] + d * data[40 + column] - b * data[56 + column];
        theta[0] = a * (data[column] + data[32 + column]);
        theta[3] = a * (data[column] - data[32 + column]);
        theta[1] = alpha[0] + alpha[3];
        theta[2] = alpha[1] - alpha[2];
        gamma[0] = theta[0] + theta[1];
        gamma[1] = theta[3] + theta[2];
        gamma[2] = theta[3] - theta[2];
        gamma[3] = theta[0] - theta[1];
        data[0 + column] = gamma[0] + beta[0];
        data[8 + column] = gamma[1] + beta[1];
        data[16 + column] = gamma[2] + beta[2];
        data[24 + column] = gamma[3] + beta[3];
        data[32 + column] = gamma[3] - beta[3];
        data[40 + column] = gamma[2] - beta[2];
        data[48 + column] = gamma[1] - beta[1];
        data[56 + column] = gamma[0] - beta[0];
      }
    }
    function csc709Inverse(data) {
      for (var i = 0; i < 64; ++i) {
        var y = data[0][i];
        var cb = data[1][i];
        var cr = data[2][i];
        data[0][i] = y + 1.5747 * cr;
        data[1][i] = y - 0.1873 * cb - 0.4682 * cr;
        data[2][i] = y + 1.8556 * cb;
      }
    }
    function convertToHalf(src, dst, idx) {
      for (var i = 0; i < 64; ++i) {
        dst[idx + i] = DataUtils.toHalfFloat(toLinear(src[i]));
      }
    }
    function toLinear(float) {
      if (float <= 1) {
        return Math.sign(float) * Math.pow(Math.abs(float), 2.2);
      } else {
        return Math.sign(float) * Math.pow(logBase, Math.abs(float) - 1);
      }
    }
    function uncompressRAW(info) {
      return new DataView(info.array.buffer, info.offset.value, info.size);
    }
    function uncompressRLE(info) {
      var compressed = info.viewer.buffer.slice(info.offset.value, info.offset.value + info.size);
      var rawBuffer = new Uint8Array(decodeRunLength(compressed));
      var tmpBuffer = new Uint8Array(rawBuffer.length);
      predictor(rawBuffer);
      interleaveScalar(rawBuffer, tmpBuffer);
      return new DataView(tmpBuffer.buffer);
    }
    function uncompressZIP(info) {
      var compressed = info.array.slice(info.offset.value, info.offset.value + info.size);
      var rawBuffer = unzlibSync(compressed);
      var tmpBuffer = new Uint8Array(rawBuffer.length);
      predictor(rawBuffer);
      interleaveScalar(rawBuffer, tmpBuffer);
      return new DataView(tmpBuffer.buffer);
    }
    function uncompressPIZ(info) {
      var inDataView = info.viewer;
      var inOffset = { value: info.offset.value };
      var outBuffer = new Uint16Array(info.width * info.scanlineBlockSize * (info.channels * info.type));
      var bitmap = new Uint8Array(BITMAP_SIZE);
      var outBufferEnd = 0;
      var pizChannelData = new Array(info.channels);
      for (var i = 0; i < info.channels; i++) {
        pizChannelData[i] = {};
        pizChannelData[i]["start"] = outBufferEnd;
        pizChannelData[i]["end"] = pizChannelData[i]["start"];
        pizChannelData[i]["nx"] = info.width;
        pizChannelData[i]["ny"] = info.lines;
        pizChannelData[i]["size"] = info.type;
        outBufferEnd += pizChannelData[i].nx * pizChannelData[i].ny * pizChannelData[i].size;
      }
      var minNonZero = parseUint16(inDataView, inOffset);
      var maxNonZero = parseUint16(inDataView, inOffset);
      if (maxNonZero >= BITMAP_SIZE) {
        throw "Something is wrong with PIZ_COMPRESSION BITMAP_SIZE";
      }
      if (minNonZero <= maxNonZero) {
        for (var i = 0; i < maxNonZero - minNonZero + 1; i++) {
          bitmap[i + minNonZero] = parseUint8(inDataView, inOffset);
        }
      }
      var lut = new Uint16Array(USHORT_RANGE);
      var maxValue = reverseLutFromBitmap(bitmap, lut);
      var length = parseUint32(inDataView, inOffset);
      hufUncompress(info.array, inDataView, inOffset, length, outBuffer, outBufferEnd);
      for (var i = 0; i < info.channels; ++i) {
        var cd = pizChannelData[i];
        for (var j = 0; j < pizChannelData[i].size; ++j) {
          wav2Decode(outBuffer, cd.start + j, cd.nx, cd.size, cd.ny, cd.nx * cd.size, maxValue);
        }
      }
      applyLut(lut, outBuffer, outBufferEnd);
      var tmpOffset2 = 0;
      var tmpBuffer = new Uint8Array(outBuffer.buffer.byteLength);
      for (var y = 0; y < info.lines; y++) {
        for (var c = 0; c < info.channels; c++) {
          var cd = pizChannelData[c];
          var n = cd.nx * cd.size;
          var cp = new Uint8Array(outBuffer.buffer, cd.end * INT16_SIZE, n * INT16_SIZE);
          tmpBuffer.set(cp, tmpOffset2);
          tmpOffset2 += n * INT16_SIZE;
          cd.end += n;
        }
      }
      return new DataView(tmpBuffer.buffer);
    }
    function uncompressPXR(info) {
      var compressed = info.array.slice(info.offset.value, info.offset.value + info.size);
      var rawBuffer = unzlibSync(compressed);
      const sz = info.lines * info.channels * info.width;
      const tmpBuffer = info.type == 1 ? new Uint16Array(sz) : new Uint32Array(sz);
      let tmpBufferEnd = 0;
      let writePtr = 0;
      const ptr = new Array(4);
      for (let y = 0; y < info.lines; y++) {
        for (let c = 0; c < info.channels; c++) {
          let pixel = 0;
          switch (info.type) {
            case 1:
              ptr[0] = tmpBufferEnd;
              ptr[1] = ptr[0] + info.width;
              tmpBufferEnd = ptr[1] + info.width;
              for (let j = 0; j < info.width; ++j) {
                const diff = rawBuffer[ptr[0]++] << 8 | rawBuffer[ptr[1]++];
                pixel += diff;
                tmpBuffer[writePtr] = pixel;
                writePtr++;
              }
              break;
            case 2:
              ptr[0] = tmpBufferEnd;
              ptr[1] = ptr[0] + info.width;
              ptr[2] = ptr[1] + info.width;
              tmpBufferEnd = ptr[2] + info.width;
              for (let j = 0; j < info.width; ++j) {
                const diff = rawBuffer[ptr[0]++] << 24 | rawBuffer[ptr[1]++] << 16 | rawBuffer[ptr[2]++] << 8;
                pixel += diff;
                tmpBuffer[writePtr] = pixel;
                writePtr++;
              }
              break;
          }
        }
      }
      return new DataView(tmpBuffer.buffer);
    }
    function uncompressDWA(info) {
      var inDataView = info.viewer;
      var inOffset = { value: info.offset.value };
      var outBuffer = new Uint8Array(info.width * info.lines * (info.channels * info.type * INT16_SIZE));
      var dwaHeader = {
        version: parseInt64(inDataView, inOffset),
        unknownUncompressedSize: parseInt64(inDataView, inOffset),
        unknownCompressedSize: parseInt64(inDataView, inOffset),
        acCompressedSize: parseInt64(inDataView, inOffset),
        dcCompressedSize: parseInt64(inDataView, inOffset),
        rleCompressedSize: parseInt64(inDataView, inOffset),
        rleUncompressedSize: parseInt64(inDataView, inOffset),
        rleRawSize: parseInt64(inDataView, inOffset),
        totalAcUncompressedCount: parseInt64(inDataView, inOffset),
        totalDcUncompressedCount: parseInt64(inDataView, inOffset),
        acCompression: parseInt64(inDataView, inOffset)
      };
      if (dwaHeader.version < 2) {
        throw "EXRLoader.parse: " + EXRHeader.compression + " version " + dwaHeader.version + " is unsupported";
      }
      var channelRules = new Array();
      var ruleSize = parseUint16(inDataView, inOffset) - INT16_SIZE;
      while (ruleSize > 0) {
        var name = parseNullTerminatedString(inDataView.buffer, inOffset);
        var value = parseUint8(inDataView, inOffset);
        var compression = value >> 2 & 3;
        var csc = (value >> 4) - 1;
        var index = new Int8Array([csc])[0];
        var type = parseUint8(inDataView, inOffset);
        channelRules.push({
          name,
          index,
          type,
          compression
        });
        ruleSize -= name.length + 3;
      }
      var channels = EXRHeader.channels;
      var channelData = new Array(info.channels);
      for (var i = 0; i < info.channels; ++i) {
        var cd = channelData[i] = {};
        var channel = channels[i];
        cd.name = channel.name;
        cd.compression = UNKNOWN;
        cd.decoded = false;
        cd.type = channel.pixelType;
        cd.pLinear = channel.pLinear;
        cd.width = info.width;
        cd.height = info.lines;
      }
      var cscSet = {
        idx: new Array(3)
      };
      for (var offset2 = 0; offset2 < info.channels; ++offset2) {
        var cd = channelData[offset2];
        for (var i = 0; i < channelRules.length; ++i) {
          var rule = channelRules[i];
          if (cd.name == rule.name) {
            cd.compression = rule.compression;
            if (rule.index >= 0) {
              cscSet.idx[rule.index] = offset2;
            }
            cd.offset = offset2;
          }
        }
      }
      if (dwaHeader.acCompressedSize > 0) {
        switch (dwaHeader.acCompression) {
          case STATIC_HUFFMAN:
            var acBuffer = new Uint16Array(dwaHeader.totalAcUncompressedCount);
            hufUncompress(
              info.array,
              inDataView,
              inOffset,
              dwaHeader.acCompressedSize,
              acBuffer,
              dwaHeader.totalAcUncompressedCount
            );
            break;
          case DEFLATE:
            var compressed = info.array.slice(inOffset.value, inOffset.value + dwaHeader.totalAcUncompressedCount);
            var data = unzlibSync(compressed);
            var acBuffer = new Uint16Array(data.buffer);
            inOffset.value += dwaHeader.totalAcUncompressedCount;
            break;
        }
      }
      if (dwaHeader.dcCompressedSize > 0) {
        var zlibInfo = {
          array: info.array,
          offset: inOffset,
          size: dwaHeader.dcCompressedSize
        };
        var dcBuffer = new Uint16Array(uncompressZIP(zlibInfo).buffer);
        inOffset.value += dwaHeader.dcCompressedSize;
      }
      if (dwaHeader.rleRawSize > 0) {
        var compressed = info.array.slice(inOffset.value, inOffset.value + dwaHeader.rleCompressedSize);
        var data = unzlibSync(compressed);
        var rleBuffer = decodeRunLength(data.buffer);
        inOffset.value += dwaHeader.rleCompressedSize;
      }
      var outBufferEnd = 0;
      var rowOffsets = new Array(channelData.length);
      for (var i = 0; i < rowOffsets.length; ++i) {
        rowOffsets[i] = new Array();
      }
      for (var y = 0; y < info.lines; ++y) {
        for (var chan = 0; chan < channelData.length; ++chan) {
          rowOffsets[chan].push(outBufferEnd);
          outBufferEnd += channelData[chan].width * info.type * INT16_SIZE;
        }
      }
      lossyDctDecode(cscSet, rowOffsets, channelData, acBuffer, dcBuffer, outBuffer);
      for (var i = 0; i < channelData.length; ++i) {
        var cd = channelData[i];
        if (cd.decoded)
          continue;
        switch (cd.compression) {
          case RLE:
            var row = 0;
            var rleOffset = 0;
            for (var y = 0; y < info.lines; ++y) {
              var rowOffsetBytes = rowOffsets[i][row];
              for (var x = 0; x < cd.width; ++x) {
                for (var byte = 0; byte < INT16_SIZE * cd.type; ++byte) {
                  outBuffer[rowOffsetBytes++] = rleBuffer[rleOffset + byte * cd.width * cd.height];
                }
                rleOffset++;
              }
              row++;
            }
            break;
          case LOSSY_DCT:
          default:
            throw "EXRLoader.parse: unsupported channel compression";
        }
      }
      return new DataView(outBuffer.buffer);
    }
    function parseNullTerminatedString(buffer2, offset2) {
      var uintBuffer = new Uint8Array(buffer2);
      var endOffset = 0;
      while (uintBuffer[offset2.value + endOffset] != 0) {
        endOffset += 1;
      }
      var stringValue = new TextDecoder().decode(uintBuffer.slice(offset2.value, offset2.value + endOffset));
      offset2.value = offset2.value + endOffset + 1;
      return stringValue;
    }
    function parseFixedLengthString(buffer2, offset2, size) {
      var stringValue = new TextDecoder().decode(new Uint8Array(buffer2).slice(offset2.value, offset2.value + size));
      offset2.value = offset2.value + size;
      return stringValue;
    }
    function parseRational(dataView, offset2) {
      var x = parseInt32(dataView, offset2);
      var y = parseUint32(dataView, offset2);
      return [x, y];
    }
    function parseTimecode(dataView, offset2) {
      var x = parseUint32(dataView, offset2);
      var y = parseUint32(dataView, offset2);
      return [x, y];
    }
    function parseInt32(dataView, offset2) {
      var Int32 = dataView.getInt32(offset2.value, true);
      offset2.value = offset2.value + INT32_SIZE;
      return Int32;
    }
    function parseUint32(dataView, offset2) {
      var Uint32 = dataView.getUint32(offset2.value, true);
      offset2.value = offset2.value + INT32_SIZE;
      return Uint32;
    }
    function parseUint8Array(uInt8Array2, offset2) {
      var Uint8 = uInt8Array2[offset2.value];
      offset2.value = offset2.value + INT8_SIZE;
      return Uint8;
    }
    function parseUint8(dataView, offset2) {
      var Uint8 = dataView.getUint8(offset2.value);
      offset2.value = offset2.value + INT8_SIZE;
      return Uint8;
    }
    const parseInt64 = function(dataView, offset2) {
      let int;
      if ("getBigInt64" in DataView.prototype) {
        int = Number(dataView.getBigInt64(offset2.value, true));
      } else {
        int = dataView.getUint32(offset2.value + 4, true) + Number(dataView.getUint32(offset2.value, true) << 32);
      }
      offset2.value += ULONG_SIZE;
      return int;
    };
    function parseFloat32(dataView, offset2) {
      var float = dataView.getFloat32(offset2.value, true);
      offset2.value += FLOAT32_SIZE;
      return float;
    }
    function decodeFloat32(dataView, offset2) {
      return DataUtils.toHalfFloat(parseFloat32(dataView, offset2));
    }
    function decodeFloat16(binary) {
      var exponent = (binary & 31744) >> 10, fraction = binary & 1023;
      return (binary >> 15 ? -1 : 1) * (exponent ? exponent === 31 ? fraction ? NaN : Infinity : Math.pow(2, exponent - 15) * (1 + fraction / 1024) : 6103515625e-14 * (fraction / 1024));
    }
    function parseUint16(dataView, offset2) {
      var Uint16 = dataView.getUint16(offset2.value, true);
      offset2.value += INT16_SIZE;
      return Uint16;
    }
    function parseFloat16(buffer2, offset2) {
      return decodeFloat16(parseUint16(buffer2, offset2));
    }
    function parseChlist(dataView, buffer2, offset2, size) {
      var startOffset = offset2.value;
      var channels = [];
      while (offset2.value < startOffset + size - 1) {
        var name = parseNullTerminatedString(buffer2, offset2);
        var pixelType = parseInt32(dataView, offset2);
        var pLinear = parseUint8(dataView, offset2);
        offset2.value += 3;
        var xSampling = parseInt32(dataView, offset2);
        var ySampling = parseInt32(dataView, offset2);
        channels.push({
          name,
          pixelType,
          pLinear,
          xSampling,
          ySampling
        });
      }
      offset2.value += 1;
      return channels;
    }
    function parseChromaticities(dataView, offset2) {
      var redX = parseFloat32(dataView, offset2);
      var redY = parseFloat32(dataView, offset2);
      var greenX = parseFloat32(dataView, offset2);
      var greenY = parseFloat32(dataView, offset2);
      var blueX = parseFloat32(dataView, offset2);
      var blueY = parseFloat32(dataView, offset2);
      var whiteX = parseFloat32(dataView, offset2);
      var whiteY = parseFloat32(dataView, offset2);
      return {
        redX,
        redY,
        greenX,
        greenY,
        blueX,
        blueY,
        whiteX,
        whiteY
      };
    }
    function parseCompression(dataView, offset2) {
      var compressionCodes = [
        "NO_COMPRESSION",
        "RLE_COMPRESSION",
        "ZIPS_COMPRESSION",
        "ZIP_COMPRESSION",
        "PIZ_COMPRESSION",
        "PXR24_COMPRESSION",
        "B44_COMPRESSION",
        "B44A_COMPRESSION",
        "DWAA_COMPRESSION",
        "DWAB_COMPRESSION"
      ];
      var compression = parseUint8(dataView, offset2);
      return compressionCodes[compression];
    }
    function parseBox2i(dataView, offset2) {
      var xMin = parseUint32(dataView, offset2);
      var yMin = parseUint32(dataView, offset2);
      var xMax = parseUint32(dataView, offset2);
      var yMax = parseUint32(dataView, offset2);
      return { xMin, yMin, xMax, yMax };
    }
    function parseLineOrder(dataView, offset2) {
      var lineOrders = ["INCREASING_Y"];
      var lineOrder = parseUint8(dataView, offset2);
      return lineOrders[lineOrder];
    }
    function parseV2f(dataView, offset2) {
      var x = parseFloat32(dataView, offset2);
      var y = parseFloat32(dataView, offset2);
      return [x, y];
    }
    function parseV3f(dataView, offset2) {
      var x = parseFloat32(dataView, offset2);
      var y = parseFloat32(dataView, offset2);
      var z = parseFloat32(dataView, offset2);
      return [x, y, z];
    }
    function parseValue(dataView, buffer2, offset2, type, size) {
      if (type === "string" || type === "stringvector" || type === "iccProfile") {
        return parseFixedLengthString(buffer2, offset2, size);
      } else if (type === "chlist") {
        return parseChlist(dataView, buffer2, offset2, size);
      } else if (type === "chromaticities") {
        return parseChromaticities(dataView, offset2);
      } else if (type === "compression") {
        return parseCompression(dataView, offset2);
      } else if (type === "box2i") {
        return parseBox2i(dataView, offset2);
      } else if (type === "lineOrder") {
        return parseLineOrder(dataView, offset2);
      } else if (type === "float") {
        return parseFloat32(dataView, offset2);
      } else if (type === "v2f") {
        return parseV2f(dataView, offset2);
      } else if (type === "v3f") {
        return parseV3f(dataView, offset2);
      } else if (type === "int") {
        return parseInt32(dataView, offset2);
      } else if (type === "rational") {
        return parseRational(dataView, offset2);
      } else if (type === "timecode") {
        return parseTimecode(dataView, offset2);
      } else if (type === "preview") {
        offset2.value += size;
        return "skipped";
      } else {
        offset2.value += size;
        return void 0;
      }
    }
    function parseHeader(dataView, buffer2, offset2) {
      const EXRHeader2 = {};
      if (dataView.getUint32(0, true) != 20000630) {
        throw "THREE.EXRLoader: provided file doesn't appear to be in OpenEXR format.";
      }
      EXRHeader2.version = dataView.getUint8(4);
      const spec = dataView.getUint8(5);
      EXRHeader2.spec = {
        singleTile: !!(spec & 2),
        longName: !!(spec & 4),
        deepFormat: !!(spec & 8),
        multiPart: !!(spec & 16)
      };
      offset2.value = 8;
      var keepReading = true;
      while (keepReading) {
        var attributeName = parseNullTerminatedString(buffer2, offset2);
        if (attributeName == 0) {
          keepReading = false;
        } else {
          var attributeType = parseNullTerminatedString(buffer2, offset2);
          var attributeSize = parseUint32(dataView, offset2);
          var attributeValue = parseValue(dataView, buffer2, offset2, attributeType, attributeSize);
          if (attributeValue === void 0) {
            console.warn(`EXRLoader.parse: skipped unknown header attribute type '${attributeType}'.`);
          } else {
            EXRHeader2[attributeName] = attributeValue;
          }
        }
      }
      if ((spec & -5) != 0) {
        console.error("EXRHeader:", EXRHeader2);
        throw "THREE.EXRLoader: provided file is currently unsupported.";
      }
      return EXRHeader2;
    }
    function setupDecoder(EXRHeader2, dataView, uInt8Array2, offset2, outputType) {
      const EXRDecoder2 = {
        size: 0,
        viewer: dataView,
        array: uInt8Array2,
        offset: offset2,
        width: EXRHeader2.dataWindow.xMax - EXRHeader2.dataWindow.xMin + 1,
        height: EXRHeader2.dataWindow.yMax - EXRHeader2.dataWindow.yMin + 1,
        channels: EXRHeader2.channels.length,
        bytesPerLine: null,
        lines: null,
        inputSize: null,
        type: EXRHeader2.channels[0].pixelType,
        uncompress: null,
        getter: null,
        format: null,
        [hasColorSpace ? "colorSpace" : "encoding"]: null
      };
      switch (EXRHeader2.compression) {
        case "NO_COMPRESSION":
          EXRDecoder2.lines = 1;
          EXRDecoder2.uncompress = uncompressRAW;
          break;
        case "RLE_COMPRESSION":
          EXRDecoder2.lines = 1;
          EXRDecoder2.uncompress = uncompressRLE;
          break;
        case "ZIPS_COMPRESSION":
          EXRDecoder2.lines = 1;
          EXRDecoder2.uncompress = uncompressZIP;
          break;
        case "ZIP_COMPRESSION":
          EXRDecoder2.lines = 16;
          EXRDecoder2.uncompress = uncompressZIP;
          break;
        case "PIZ_COMPRESSION":
          EXRDecoder2.lines = 32;
          EXRDecoder2.uncompress = uncompressPIZ;
          break;
        case "PXR24_COMPRESSION":
          EXRDecoder2.lines = 16;
          EXRDecoder2.uncompress = uncompressPXR;
          break;
        case "DWAA_COMPRESSION":
          EXRDecoder2.lines = 32;
          EXRDecoder2.uncompress = uncompressDWA;
          break;
        case "DWAB_COMPRESSION":
          EXRDecoder2.lines = 256;
          EXRDecoder2.uncompress = uncompressDWA;
          break;
        default:
          throw "EXRLoader.parse: " + EXRHeader2.compression + " is unsupported";
      }
      EXRDecoder2.scanlineBlockSize = EXRDecoder2.lines;
      if (EXRDecoder2.type == 1) {
        switch (outputType) {
          case FloatType:
            EXRDecoder2.getter = parseFloat16;
            EXRDecoder2.inputSize = INT16_SIZE;
            break;
          case HalfFloatType:
            EXRDecoder2.getter = parseUint16;
            EXRDecoder2.inputSize = INT16_SIZE;
            break;
        }
      } else if (EXRDecoder2.type == 2) {
        switch (outputType) {
          case FloatType:
            EXRDecoder2.getter = parseFloat32;
            EXRDecoder2.inputSize = FLOAT32_SIZE;
            break;
          case HalfFloatType:
            EXRDecoder2.getter = decodeFloat32;
            EXRDecoder2.inputSize = FLOAT32_SIZE;
        }
      } else {
        throw "EXRLoader.parse: unsupported pixelType " + EXRDecoder2.type + " for " + EXRHeader2.compression + ".";
      }
      EXRDecoder2.blockCount = (EXRHeader2.dataWindow.yMax + 1) / EXRDecoder2.scanlineBlockSize;
      for (var i = 0; i < EXRDecoder2.blockCount; i++)
        parseInt64(dataView, offset2);
      EXRDecoder2.outputChannels = EXRDecoder2.channels == 3 ? 4 : EXRDecoder2.channels;
      const size = EXRDecoder2.width * EXRDecoder2.height * EXRDecoder2.outputChannels;
      switch (outputType) {
        case FloatType:
          EXRDecoder2.byteArray = new Float32Array(size);
          if (EXRDecoder2.channels < EXRDecoder2.outputChannels)
            EXRDecoder2.byteArray.fill(1, 0, size);
          break;
        case HalfFloatType:
          EXRDecoder2.byteArray = new Uint16Array(size);
          if (EXRDecoder2.channels < EXRDecoder2.outputChannels)
            EXRDecoder2.byteArray.fill(15360, 0, size);
          break;
        default:
          console.error("THREE.EXRLoader: unsupported type: ", outputType);
          break;
      }
      EXRDecoder2.bytesPerLine = EXRDecoder2.width * EXRDecoder2.inputSize * EXRDecoder2.channels;
      if (EXRDecoder2.outputChannels == 4)
        EXRDecoder2.format = RGBAFormat;
      else
        EXRDecoder2.format = RedFormat;
      if (hasColorSpace)
        EXRDecoder2.colorSpace = "srgb-linear";
      else
        EXRDecoder2.encoding = 3e3;
      return EXRDecoder2;
    }
    const bufferDataView = new DataView(buffer);
    const uInt8Array = new Uint8Array(buffer);
    const offset = { value: 0 };
    const EXRHeader = parseHeader(bufferDataView, buffer, offset);
    const EXRDecoder = setupDecoder(EXRHeader, bufferDataView, uInt8Array, offset, this.type);
    const tmpOffset = { value: 0 };
    const channelOffsets = { R: 0, G: 1, B: 2, A: 3, Y: 0 };
    for (let scanlineBlockIdx = 0; scanlineBlockIdx < EXRDecoder.height / EXRDecoder.scanlineBlockSize; scanlineBlockIdx++) {
      const line = parseUint32(bufferDataView, offset);
      EXRDecoder.size = parseUint32(bufferDataView, offset);
      EXRDecoder.lines = line + EXRDecoder.scanlineBlockSize > EXRDecoder.height ? EXRDecoder.height - line : EXRDecoder.scanlineBlockSize;
      const isCompressed = EXRDecoder.size < EXRDecoder.lines * EXRDecoder.bytesPerLine;
      const viewer = isCompressed ? EXRDecoder.uncompress(EXRDecoder) : uncompressRAW(EXRDecoder);
      offset.value += EXRDecoder.size;
      for (let line_y = 0; line_y < EXRDecoder.scanlineBlockSize; line_y++) {
        const true_y = line_y + scanlineBlockIdx * EXRDecoder.scanlineBlockSize;
        if (true_y >= EXRDecoder.height)
          break;
        for (let channelID = 0; channelID < EXRDecoder.channels; channelID++) {
          const cOff = channelOffsets[EXRHeader.channels[channelID].name];
          for (let x = 0; x < EXRDecoder.width; x++) {
            tmpOffset.value = (line_y * (EXRDecoder.channels * EXRDecoder.width) + channelID * EXRDecoder.width + x) * EXRDecoder.inputSize;
            const outIndex = (EXRDecoder.height - 1 - true_y) * (EXRDecoder.width * EXRDecoder.outputChannels) + x * EXRDecoder.outputChannels + cOff;
            EXRDecoder.byteArray[outIndex] = EXRDecoder.getter(viewer, tmpOffset);
          }
        }
      }
    }
    return {
      header: EXRHeader,
      width: EXRDecoder.width,
      height: EXRDecoder.height,
      data: EXRDecoder.byteArray,
      format: EXRDecoder.format,
      [hasColorSpace ? "colorSpace" : "encoding"]: EXRDecoder[hasColorSpace ? "colorSpace" : "encoding"],
      type: this.type
    };
  }
  setDataType(value) {
    this.type = value;
    return this;
  }
  load(url, onLoad, onProgress, onError) {
    function onLoadCallback(texture, texData) {
      if (hasColorSpace)
        texture.colorSpace = texData.colorSpace;
      else
        texture.encoding = texData.encoding;
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      texture.generateMipmaps = false;
      texture.flipY = false;
      if (onLoad)
        onLoad(texture, texData);
    }
    return super.load(url, onLoadCallback, onProgress, onError);
  }
}
class Delay extends ToneAudioNode {
  constructor() {
    super(optionsFromArguments(Delay.getDefaults(), arguments, ["delayTime", "maxDelay"]));
    this.name = "Delay";
    const options = optionsFromArguments(Delay.getDefaults(), arguments, ["delayTime", "maxDelay"]);
    const maxDelayInSeconds = this.toSeconds(options.maxDelay);
    this._maxDelay = Math.max(maxDelayInSeconds, this.toSeconds(options.delayTime));
    this._delayNode = this.input = this.output = this.context.createDelay(maxDelayInSeconds);
    this.delayTime = new Param({
      context: this.context,
      param: this._delayNode.delayTime,
      units: "time",
      value: options.delayTime,
      minValue: 0,
      maxValue: this.maxDelay
    });
    readOnly(this, "delayTime");
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      delayTime: 0,
      maxDelay: 1
    });
  }
  /**
   * The maximum delay time. This cannot be changed after
   * the value is passed into the constructor.
   */
  get maxDelay() {
    return this._maxDelay;
  }
  /**
   * Clean up.
   */
  dispose() {
    super.dispose();
    this._delayNode.disconnect();
    this.delayTime.dispose();
    return this;
  }
}
class MidiClass extends FrequencyClass {
  constructor() {
    super(...arguments);
    this.name = "MidiClass";
    this.defaultUnits = "midi";
  }
  /**
   * Returns the value of a frequency in the current units
   */
  _frequencyToUnits(freq) {
    return ftom(super._frequencyToUnits(freq));
  }
  /**
   * Returns the value of a tick in the current time units
   */
  _ticksToUnits(ticks) {
    return ftom(super._ticksToUnits(ticks));
  }
  /**
   * Return the value of the beats in the current units
   */
  _beatsToUnits(beats) {
    return ftom(super._beatsToUnits(beats));
  }
  /**
   * Returns the value of a second in the current units
   */
  _secondsToUnits(seconds) {
    return ftom(super._secondsToUnits(seconds));
  }
  /**
   * Return the value of the frequency as a MIDI note
   * @example
   * Tone.Midi(60).toMidi(); // 60
   */
  toMidi() {
    return this.valueOf();
  }
  /**
   * Return the value of the frequency as a MIDI note
   * @example
   * Tone.Midi(60).toFrequency(); // 261.6255653005986
   */
  toFrequency() {
    return mtof(this.toMidi());
  }
  /**
   * Transposes the frequency by the given number of semitones.
   * @return A new transposed MidiClass
   * @example
   * Tone.Midi("A4").transpose(3); // "C5"
   */
  transpose(interval) {
    return new MidiClass(this.context, this.toMidi() + interval);
  }
}
class Noise extends Source {
  constructor() {
    super(optionsFromArguments(Noise.getDefaults(), arguments, ["type"]));
    this.name = "Noise";
    this._source = null;
    const options = optionsFromArguments(Noise.getDefaults(), arguments, ["type"]);
    this._playbackRate = options.playbackRate;
    this.type = options.type;
    this._fadeIn = options.fadeIn;
    this._fadeOut = options.fadeOut;
  }
  static getDefaults() {
    return Object.assign(Source.getDefaults(), {
      fadeIn: 0,
      fadeOut: 0,
      playbackRate: 1,
      type: "white"
    });
  }
  /**
   * The type of the noise. Can be "white", "brown", or "pink".
   * @example
   * const noise = new Tone.Noise().toDestination().start();
   * noise.type = "brown";
   */
  get type() {
    return this._type;
  }
  set type(type) {
    assert(type in _noiseBuffers, "Noise: invalid type: " + type);
    if (this._type !== type) {
      this._type = type;
      if (this.state === "started") {
        const now = this.now();
        this._stop(now);
        this._start(now);
      }
    }
  }
  /**
   * The playback rate of the noise. Affects
   * the "frequency" of the noise.
   */
  get playbackRate() {
    return this._playbackRate;
  }
  set playbackRate(rate) {
    this._playbackRate = rate;
    if (this._source) {
      this._source.playbackRate.value = rate;
    }
  }
  /**
   * internal start method
   */
  _start(time) {
    const buffer = _noiseBuffers[this._type];
    this._source = new ToneBufferSource({
      url: buffer,
      context: this.context,
      fadeIn: this._fadeIn,
      fadeOut: this._fadeOut,
      loop: true,
      onended: () => this.onstop(this),
      playbackRate: this._playbackRate
    }).connect(this.output);
    this._source.start(this.toSeconds(time), Math.random() * (buffer.duration - 1e-3));
  }
  /**
   * internal stop method
   */
  _stop(time) {
    if (this._source) {
      this._source.stop(this.toSeconds(time));
      this._source = null;
    }
  }
  /**
   * The fadeIn time of the amplitude envelope.
   */
  get fadeIn() {
    return this._fadeIn;
  }
  set fadeIn(time) {
    this._fadeIn = time;
    if (this._source) {
      this._source.fadeIn = this._fadeIn;
    }
  }
  /**
   * The fadeOut time of the amplitude envelope.
   */
  get fadeOut() {
    return this._fadeOut;
  }
  set fadeOut(time) {
    this._fadeOut = time;
    if (this._source) {
      this._source.fadeOut = this._fadeOut;
    }
  }
  _restart(time) {
    this._stop(time);
    this._start(time);
  }
  /**
   * Clean up.
   */
  dispose() {
    super.dispose();
    if (this._source) {
      this._source.disconnect();
    }
    return this;
  }
}
const BUFFER_LENGTH = 44100 * 5;
const NUM_CHANNELS = 2;
const _noiseCache = {
  brown: null,
  pink: null,
  white: null
};
const _noiseBuffers = {
  get brown() {
    if (!_noiseCache.brown) {
      const buffer = [];
      for (let channelNum = 0; channelNum < NUM_CHANNELS; channelNum++) {
        const channel = new Float32Array(BUFFER_LENGTH);
        buffer[channelNum] = channel;
        let lastOut = 0;
        for (let i = 0; i < BUFFER_LENGTH; i++) {
          const white = Math.random() * 2 - 1;
          channel[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = channel[i];
          channel[i] *= 3.5;
        }
      }
      _noiseCache.brown = new ToneAudioBuffer().fromArray(buffer);
    }
    return _noiseCache.brown;
  },
  get pink() {
    if (!_noiseCache.pink) {
      const buffer = [];
      for (let channelNum = 0; channelNum < NUM_CHANNELS; channelNum++) {
        const channel = new Float32Array(BUFFER_LENGTH);
        buffer[channelNum] = channel;
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0;
        for (let i = 0; i < BUFFER_LENGTH; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          channel[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          channel[i] *= 0.11;
          b6 = white * 0.115926;
        }
      }
      _noiseCache.pink = new ToneAudioBuffer().fromArray(buffer);
    }
    return _noiseCache.pink;
  },
  get white() {
    if (!_noiseCache.white) {
      const buffer = [];
      for (let channelNum = 0; channelNum < NUM_CHANNELS; channelNum++) {
        const channel = new Float32Array(BUFFER_LENGTH);
        buffer[channelNum] = channel;
        for (let i = 0; i < BUFFER_LENGTH; i++) {
          channel[i] = Math.random() * 2 - 1;
        }
      }
      _noiseCache.white = new ToneAudioBuffer().fromArray(buffer);
    }
    return _noiseCache.white;
  }
};
class Add extends Signal {
  constructor() {
    super(Object.assign(optionsFromArguments(Add.getDefaults(), arguments, ["value"])));
    this.override = false;
    this.name = "Add";
    this._sum = new Gain({ context: this.context });
    this.input = this._sum;
    this.output = this._sum;
    this.addend = this._param;
    connectSeries(this._constantSource, this._sum);
  }
  static getDefaults() {
    return Object.assign(Signal.getDefaults(), {
      value: 0
    });
  }
  dispose() {
    super.dispose();
    this._sum.dispose();
    return this;
  }
}
class Scale extends SignalOperator {
  constructor() {
    super(Object.assign(optionsFromArguments(Scale.getDefaults(), arguments, ["min", "max"])));
    this.name = "Scale";
    const options = optionsFromArguments(Scale.getDefaults(), arguments, ["min", "max"]);
    this._mult = this.input = new Multiply({
      context: this.context,
      value: options.max - options.min
    });
    this._add = this.output = new Add({
      context: this.context,
      value: options.min
    });
    this._min = options.min;
    this._max = options.max;
    this.input.connect(this.output);
  }
  static getDefaults() {
    return Object.assign(SignalOperator.getDefaults(), {
      max: 1,
      min: 0
    });
  }
  /**
   * The minimum output value. This number is output when the value input value is 0.
   */
  get min() {
    return this._min;
  }
  set min(min) {
    this._min = min;
    this._setRange();
  }
  /**
   * The maximum output value. This number is output when the value input value is 1.
   */
  get max() {
    return this._max;
  }
  set max(max2) {
    this._max = max2;
    this._setRange();
  }
  /**
   * set the values
   */
  _setRange() {
    this._add.value = this._min;
    this._mult.value = this._max - this._min;
  }
  dispose() {
    super.dispose();
    this._add.dispose();
    this._mult.dispose();
    return this;
  }
}
class Zero extends SignalOperator {
  constructor() {
    super(Object.assign(optionsFromArguments(Zero.getDefaults(), arguments)));
    this.name = "Zero";
    this._gain = new Gain({ context: this.context });
    this.output = this._gain;
    this.input = void 0;
    connect(this.context.getConstant(0), this._gain);
  }
  /**
   * clean up
   */
  dispose() {
    super.dispose();
    disconnect(this.context.getConstant(0), this._gain);
    return this;
  }
}
class LFO extends ToneAudioNode {
  constructor() {
    super(optionsFromArguments(LFO.getDefaults(), arguments, ["frequency", "min", "max"]));
    this.name = "LFO";
    this._stoppedValue = 0;
    this._units = "number";
    this.convert = true;
    this._fromType = Param.prototype._fromType;
    this._toType = Param.prototype._toType;
    this._is = Param.prototype._is;
    this._clampValue = Param.prototype._clampValue;
    const options = optionsFromArguments(LFO.getDefaults(), arguments, ["frequency", "min", "max"]);
    this._oscillator = new Oscillator(options);
    this.frequency = this._oscillator.frequency;
    this._amplitudeGain = new Gain({
      context: this.context,
      gain: options.amplitude,
      units: "normalRange"
    });
    this.amplitude = this._amplitudeGain.gain;
    this._stoppedSignal = new Signal({
      context: this.context,
      units: "audioRange",
      value: 0
    });
    this._zeros = new Zero({ context: this.context });
    this._a2g = new AudioToGain({ context: this.context });
    this._scaler = this.output = new Scale({
      context: this.context,
      max: options.max,
      min: options.min
    });
    this.units = options.units;
    this.min = options.min;
    this.max = options.max;
    this._oscillator.chain(this._amplitudeGain, this._a2g, this._scaler);
    this._zeros.connect(this._a2g);
    this._stoppedSignal.connect(this._a2g);
    readOnly(this, ["amplitude", "frequency"]);
    this.phase = options.phase;
  }
  static getDefaults() {
    return Object.assign(Oscillator.getDefaults(), {
      amplitude: 1,
      frequency: "4n",
      max: 1,
      min: 0,
      type: "sine",
      units: "number"
    });
  }
  /**
   * Start the LFO.
   * @param time The time the LFO will start
   */
  start(time) {
    time = this.toSeconds(time);
    this._stoppedSignal.setValueAtTime(0, time);
    this._oscillator.start(time);
    return this;
  }
  /**
   * Stop the LFO.
   * @param  time The time the LFO will stop
   */
  stop(time) {
    time = this.toSeconds(time);
    this._stoppedSignal.setValueAtTime(this._stoppedValue, time);
    this._oscillator.stop(time);
    return this;
  }
  /**
   * Sync the start/stop/pause to the transport
   * and the frequency to the bpm of the transport
   * @example
   * const lfo = new Tone.LFO("8n");
   * lfo.sync().start(0);
   * // the rate of the LFO will always be an eighth note, even as the tempo changes
   */
  sync() {
    this._oscillator.sync();
    this._oscillator.syncFrequency();
    return this;
  }
  /**
   * unsync the LFO from transport control
   */
  unsync() {
    this._oscillator.unsync();
    this._oscillator.unsyncFrequency();
    return this;
  }
  /**
   * After the oscillator waveform is updated, reset the `_stoppedSignal` value to match the updated waveform
   */
  _setStoppedValue() {
    this._stoppedValue = this._oscillator.getInitialValue();
    this._stoppedSignal.value = this._stoppedValue;
  }
  /**
   * The minimum output of the LFO.
   */
  get min() {
    return this._toType(this._scaler.min);
  }
  set min(min) {
    min = this._fromType(min);
    this._scaler.min = min;
  }
  /**
   * The maximum output of the LFO.
   */
  get max() {
    return this._toType(this._scaler.max);
  }
  set max(max2) {
    max2 = this._fromType(max2);
    this._scaler.max = max2;
  }
  /**
   * The type of the oscillator.
   * @see {@link Oscillator.type}
   */
  get type() {
    return this._oscillator.type;
  }
  set type(type) {
    this._oscillator.type = type;
    this._setStoppedValue();
  }
  /**
   * The oscillator's partials array.
   * @see {@link Oscillator.partials}
   */
  get partials() {
    return this._oscillator.partials;
  }
  set partials(partials) {
    this._oscillator.partials = partials;
    this._setStoppedValue();
  }
  /**
   * The phase of the LFO.
   */
  get phase() {
    return this._oscillator.phase;
  }
  set phase(phase) {
    this._oscillator.phase = phase;
    this._setStoppedValue();
  }
  /**
   * The output units of the LFO.
   */
  get units() {
    return this._units;
  }
  set units(val) {
    const currentMin = this.min;
    const currentMax = this.max;
    this._units = val;
    this.min = currentMin;
    this.max = currentMax;
  }
  /**
   * Returns the playback state of the source, either "started" or "stopped".
   */
  get state() {
    return this._oscillator.state;
  }
  /**
   * @param node the destination to connect to
   * @param outputNum the optional output number
   * @param inputNum the input number
   */
  connect(node, outputNum, inputNum) {
    if (node instanceof Param || node instanceof Signal) {
      this.convert = node.convert;
      this.units = node.units;
    }
    connectSignal(this, node, outputNum, inputNum);
    return this;
  }
  dispose() {
    super.dispose();
    this._oscillator.dispose();
    this._stoppedSignal.dispose();
    this._zeros.dispose();
    this._scaler.dispose();
    this._a2g.dispose();
    this._amplitudeGain.dispose();
    this.amplitude.dispose();
    return this;
  }
}
class GainToAudio extends SignalOperator {
  constructor() {
    super(...arguments);
    this.name = "GainToAudio";
    this._norm = new WaveShaper({
      context: this.context,
      mapping: (x) => Math.abs(x) * 2 - 1
    });
    this.input = this._norm;
    this.output = this._norm;
  }
  /**
   * clean up
   */
  dispose() {
    super.dispose();
    this._norm.dispose();
    return this;
  }
}
class ModulationSynth extends Monophonic {
  constructor() {
    super(optionsFromArguments(ModulationSynth.getDefaults(), arguments));
    this.name = "ModulationSynth";
    const options = optionsFromArguments(ModulationSynth.getDefaults(), arguments);
    this._carrier = new Synth({
      context: this.context,
      oscillator: options.oscillator,
      envelope: options.envelope,
      onsilence: () => this.onsilence(this),
      volume: -10
    });
    this._modulator = new Synth({
      context: this.context,
      oscillator: options.modulation,
      envelope: options.modulationEnvelope,
      volume: -10
    });
    this.oscillator = this._carrier.oscillator;
    this.envelope = this._carrier.envelope;
    this.modulation = this._modulator.oscillator;
    this.modulationEnvelope = this._modulator.envelope;
    this.frequency = new Signal({
      context: this.context,
      units: "frequency"
    });
    this.detune = new Signal({
      context: this.context,
      value: options.detune,
      units: "cents"
    });
    this.harmonicity = new Multiply({
      context: this.context,
      value: options.harmonicity,
      minValue: 0
    });
    this._modulationNode = new Gain({
      context: this.context,
      gain: 0
    });
    readOnly(this, ["frequency", "harmonicity", "oscillator", "envelope", "modulation", "modulationEnvelope", "detune"]);
  }
  static getDefaults() {
    return Object.assign(Monophonic.getDefaults(), {
      harmonicity: 3,
      oscillator: Object.assign(omitFromObject(OmniOscillator.getDefaults(), [
        ...Object.keys(Source.getDefaults()),
        "frequency",
        "detune"
      ]), {
        type: "sine"
      }),
      envelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
        attack: 0.01,
        decay: 0.01,
        sustain: 1,
        release: 0.5
      }),
      modulation: Object.assign(omitFromObject(OmniOscillator.getDefaults(), [
        ...Object.keys(Source.getDefaults()),
        "frequency",
        "detune"
      ]), {
        type: "square"
      }),
      modulationEnvelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
        attack: 0.5,
        decay: 0,
        sustain: 1,
        release: 0.5
      })
    });
  }
  /**
   * Trigger the attack portion of the note
   */
  _triggerEnvelopeAttack(time, velocity) {
    this._carrier._triggerEnvelopeAttack(time, velocity);
    this._modulator._triggerEnvelopeAttack(time, velocity);
  }
  /**
   * Trigger the release portion of the note
   */
  _triggerEnvelopeRelease(time) {
    this._carrier._triggerEnvelopeRelease(time);
    this._modulator._triggerEnvelopeRelease(time);
    return this;
  }
  getLevelAtTime(time) {
    time = this.toSeconds(time);
    return this.envelope.getValueAtTime(time);
  }
  dispose() {
    super.dispose();
    this._carrier.dispose();
    this._modulator.dispose();
    this.frequency.dispose();
    this.detune.dispose();
    this.harmonicity.dispose();
    this._modulationNode.dispose();
    return this;
  }
}
class BiquadFilter extends ToneAudioNode {
  constructor() {
    super(optionsFromArguments(BiquadFilter.getDefaults(), arguments, ["frequency", "type"]));
    this.name = "BiquadFilter";
    const options = optionsFromArguments(BiquadFilter.getDefaults(), arguments, ["frequency", "type"]);
    this._filter = this.context.createBiquadFilter();
    this.input = this.output = this._filter;
    this.Q = new Param({
      context: this.context,
      units: "number",
      value: options.Q,
      param: this._filter.Q
    });
    this.frequency = new Param({
      context: this.context,
      units: "frequency",
      value: options.frequency,
      param: this._filter.frequency
    });
    this.detune = new Param({
      context: this.context,
      units: "cents",
      value: options.detune,
      param: this._filter.detune
    });
    this.gain = new Param({
      context: this.context,
      units: "decibels",
      convert: false,
      value: options.gain,
      param: this._filter.gain
    });
    this.type = options.type;
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      Q: 1,
      type: "lowpass",
      frequency: 350,
      detune: 0,
      gain: 0
    });
  }
  /**
   * The type of this BiquadFilterNode. For a complete list of types and their attributes, see the
   * [Web Audio API](https://webaudio.github.io/web-audio-api/#dom-biquadfiltertype-lowpass)
   */
  get type() {
    return this._filter.type;
  }
  set type(type) {
    const types = [
      "lowpass",
      "highpass",
      "bandpass",
      "lowshelf",
      "highshelf",
      "notch",
      "allpass",
      "peaking"
    ];
    assert(types.indexOf(type) !== -1, `Invalid filter type: ${type}`);
    this._filter.type = type;
  }
  /**
   * Get the frequency response curve. This curve represents how the filter
   * responses to frequencies between 20hz-20khz.
   * @param  len The number of values to return
   * @return The frequency response curve between 20-20kHz
   */
  getFrequencyResponse(len = 128) {
    const freqValues = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const norm = Math.pow(i / len, 2);
      const freq = norm * (2e4 - 20) + 20;
      freqValues[i] = freq;
    }
    const magValues = new Float32Array(len);
    const phaseValues = new Float32Array(len);
    const filterClone = this.context.createBiquadFilter();
    filterClone.type = this.type;
    filterClone.Q.value = this.Q.value;
    filterClone.frequency.value = this.frequency.value;
    filterClone.gain.value = this.gain.value;
    filterClone.getFrequencyResponse(freqValues, magValues, phaseValues);
    return magValues;
  }
  dispose() {
    super.dispose();
    this._filter.disconnect();
    this.Q.dispose();
    this.frequency.dispose();
    this.gain.dispose();
    this.detune.dispose();
    return this;
  }
}
class Filter extends ToneAudioNode {
  constructor() {
    super(optionsFromArguments(Filter.getDefaults(), arguments, ["frequency", "type", "rolloff"]));
    this.name = "Filter";
    this.input = new Gain({ context: this.context });
    this.output = new Gain({ context: this.context });
    this._filters = [];
    const options = optionsFromArguments(Filter.getDefaults(), arguments, ["frequency", "type", "rolloff"]);
    this._filters = [];
    this.Q = new Signal({
      context: this.context,
      units: "positive",
      value: options.Q
    });
    this.frequency = new Signal({
      context: this.context,
      units: "frequency",
      value: options.frequency
    });
    this.detune = new Signal({
      context: this.context,
      units: "cents",
      value: options.detune
    });
    this.gain = new Signal({
      context: this.context,
      units: "decibels",
      convert: false,
      value: options.gain
    });
    this._type = options.type;
    this.rolloff = options.rolloff;
    readOnly(this, ["detune", "frequency", "gain", "Q"]);
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      Q: 1,
      detune: 0,
      frequency: 350,
      gain: 0,
      rolloff: -12,
      type: "lowpass"
    });
  }
  /**
   * The type of the filter. Types: "lowpass", "highpass",
   * "bandpass", "lowshelf", "highshelf", "notch", "allpass", or "peaking".
   */
  get type() {
    return this._type;
  }
  set type(type) {
    const types = [
      "lowpass",
      "highpass",
      "bandpass",
      "lowshelf",
      "highshelf",
      "notch",
      "allpass",
      "peaking"
    ];
    assert(types.indexOf(type) !== -1, `Invalid filter type: ${type}`);
    this._type = type;
    this._filters.forEach((filter) => filter.type = type);
  }
  /**
   * The rolloff of the filter which is the drop in db
   * per octave. Implemented internally by cascading filters.
   * Only accepts the values -12, -24, -48 and -96.
   */
  get rolloff() {
    return this._rolloff;
  }
  set rolloff(rolloff) {
    const rolloffNum = isNumber(rolloff) ? rolloff : parseInt(rolloff, 10);
    const possibilities = [-12, -24, -48, -96];
    let cascadingCount = possibilities.indexOf(rolloffNum);
    assert(cascadingCount !== -1, `rolloff can only be ${possibilities.join(", ")}`);
    cascadingCount += 1;
    this._rolloff = rolloffNum;
    this.input.disconnect();
    this._filters.forEach((filter) => filter.disconnect());
    this._filters = new Array(cascadingCount);
    for (let count = 0; count < cascadingCount; count++) {
      const filter = new BiquadFilter({
        context: this.context
      });
      filter.type = this._type;
      this.frequency.connect(filter.frequency);
      this.detune.connect(filter.detune);
      this.Q.connect(filter.Q);
      this.gain.connect(filter.gain);
      this._filters[count] = filter;
    }
    this._internalChannels = this._filters;
    connectSeries(this.input, ...this._internalChannels, this.output);
  }
  /**
   * Get the frequency response curve. This curve represents how the filter
   * responses to frequencies between 20hz-20khz.
   * @param  len The number of values to return
   * @return The frequency response curve between 20-20kHz
   */
  getFrequencyResponse(len = 128) {
    const filterClone = new BiquadFilter({
      frequency: this.frequency.value,
      gain: this.gain.value,
      Q: this.Q.value,
      type: this._type,
      detune: this.detune.value
    });
    const totalResponse = new Float32Array(len).map(() => 1);
    this._filters.forEach(() => {
      const response = filterClone.getFrequencyResponse(len);
      response.forEach((val, i) => totalResponse[i] *= val);
    });
    filterClone.dispose();
    return totalResponse;
  }
  /**
   * Clean up.
   */
  dispose() {
    super.dispose();
    this._filters.forEach((filter) => {
      filter.dispose();
    });
    writable(this, ["detune", "frequency", "gain", "Q"]);
    this.frequency.dispose();
    this.Q.dispose();
    this.detune.dispose();
    this.gain.dispose();
    return this;
  }
}
class FrequencyEnvelope extends Envelope {
  constructor() {
    super(optionsFromArguments(FrequencyEnvelope.getDefaults(), arguments, ["attack", "decay", "sustain", "release"]));
    this.name = "FrequencyEnvelope";
    const options = optionsFromArguments(FrequencyEnvelope.getDefaults(), arguments, ["attack", "decay", "sustain", "release"]);
    this._octaves = options.octaves;
    this._baseFrequency = this.toFrequency(options.baseFrequency);
    this._exponent = this.input = new Pow({
      context: this.context,
      value: options.exponent
    });
    this._scale = this.output = new Scale({
      context: this.context,
      min: this._baseFrequency,
      max: this._baseFrequency * Math.pow(2, this._octaves)
    });
    this._sig.chain(this._exponent, this._scale);
  }
  static getDefaults() {
    return Object.assign(Envelope.getDefaults(), {
      baseFrequency: 200,
      exponent: 1,
      octaves: 4
    });
  }
  /**
   * The envelope's minimum output value. This is the value which it
   * starts at.
   */
  get baseFrequency() {
    return this._baseFrequency;
  }
  set baseFrequency(min) {
    const freq = this.toFrequency(min);
    assertRange(freq, 0);
    this._baseFrequency = freq;
    this._scale.min = this._baseFrequency;
    this.octaves = this._octaves;
  }
  /**
   * The number of octaves above the baseFrequency that the
   * envelope will scale to.
   */
  get octaves() {
    return this._octaves;
  }
  set octaves(octaves) {
    this._octaves = octaves;
    this._scale.max = this._baseFrequency * Math.pow(2, octaves);
  }
  /**
   * The envelope's exponent value.
   */
  get exponent() {
    return this._exponent.value;
  }
  set exponent(exponent) {
    this._exponent.value = exponent;
  }
  /**
   * Clean up
   */
  dispose() {
    super.dispose();
    this._exponent.dispose();
    this._scale.dispose();
    return this;
  }
}
class MonoSynth extends Monophonic {
  constructor() {
    super(optionsFromArguments(MonoSynth.getDefaults(), arguments));
    this.name = "MonoSynth";
    const options = optionsFromArguments(MonoSynth.getDefaults(), arguments);
    this.oscillator = new OmniOscillator(Object.assign(options.oscillator, {
      context: this.context,
      detune: options.detune,
      onstop: () => this.onsilence(this)
    }));
    this.frequency = this.oscillator.frequency;
    this.detune = this.oscillator.detune;
    this.filter = new Filter(Object.assign(options.filter, { context: this.context }));
    this.filterEnvelope = new FrequencyEnvelope(Object.assign(options.filterEnvelope, { context: this.context }));
    this.envelope = new AmplitudeEnvelope(Object.assign(options.envelope, { context: this.context }));
    this.oscillator.chain(this.filter, this.envelope, this.output);
    this.filterEnvelope.connect(this.filter.frequency);
    readOnly(this, ["oscillator", "frequency", "detune", "filter", "filterEnvelope", "envelope"]);
  }
  static getDefaults() {
    return Object.assign(Monophonic.getDefaults(), {
      envelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
        attack: 5e-3,
        decay: 0.1,
        release: 1,
        sustain: 0.9
      }),
      filter: Object.assign(omitFromObject(Filter.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
        Q: 1,
        rolloff: -12,
        type: "lowpass"
      }),
      filterEnvelope: Object.assign(omitFromObject(FrequencyEnvelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
        attack: 0.6,
        baseFrequency: 200,
        decay: 0.2,
        exponent: 2,
        octaves: 3,
        release: 2,
        sustain: 0.5
      }),
      oscillator: Object.assign(omitFromObject(OmniOscillator.getDefaults(), Object.keys(Source.getDefaults())), {
        type: "sawtooth"
      })
    });
  }
  /**
   * start the attack portion of the envelope
   * @param time the time the attack should start
   * @param velocity the velocity of the note (0-1)
   */
  _triggerEnvelopeAttack(time, velocity = 1) {
    this.envelope.triggerAttack(time, velocity);
    this.filterEnvelope.triggerAttack(time);
    this.oscillator.start(time);
    if (this.envelope.sustain === 0) {
      const computedAttack = this.toSeconds(this.envelope.attack);
      const computedDecay = this.toSeconds(this.envelope.decay);
      this.oscillator.stop(time + computedAttack + computedDecay);
    }
  }
  /**
   * start the release portion of the envelope
   * @param time the time the release should start
   */
  _triggerEnvelopeRelease(time) {
    this.envelope.triggerRelease(time);
    this.filterEnvelope.triggerRelease(time);
    this.oscillator.stop(time + this.toSeconds(this.envelope.release));
  }
  getLevelAtTime(time) {
    time = this.toSeconds(time);
    return this.envelope.getValueAtTime(time);
  }
  dispose() {
    super.dispose();
    this.oscillator.dispose();
    this.envelope.dispose();
    this.filterEnvelope.dispose();
    this.filter.dispose();
    return this;
  }
}
class FMSynth extends ModulationSynth {
  constructor() {
    super(optionsFromArguments(FMSynth.getDefaults(), arguments));
    this.name = "FMSynth";
    const options = optionsFromArguments(FMSynth.getDefaults(), arguments);
    this.modulationIndex = new Multiply({
      context: this.context,
      value: options.modulationIndex
    });
    this.frequency.connect(this._carrier.frequency);
    this.frequency.chain(this.harmonicity, this._modulator.frequency);
    this.frequency.chain(this.modulationIndex, this._modulationNode);
    this.detune.fan(this._carrier.detune, this._modulator.detune);
    this._modulator.connect(this._modulationNode.gain);
    this._modulationNode.connect(this._carrier.frequency);
    this._carrier.connect(this.output);
  }
  static getDefaults() {
    return Object.assign(ModulationSynth.getDefaults(), {
      modulationIndex: 10
    });
  }
  dispose() {
    super.dispose();
    this.modulationIndex.dispose();
    return this;
  }
}
const inharmRatios = [1, 1.483, 1.932, 2.546, 2.63, 3.897];
class MetalSynth extends Monophonic {
  constructor() {
    super(optionsFromArguments(MetalSynth.getDefaults(), arguments));
    this.name = "MetalSynth";
    this._oscillators = [];
    this._freqMultipliers = [];
    const options = optionsFromArguments(MetalSynth.getDefaults(), arguments);
    this.detune = new Signal({
      context: this.context,
      units: "cents",
      value: options.detune
    });
    this.frequency = new Signal({
      context: this.context,
      units: "frequency"
    });
    this._amplitude = new Gain({
      context: this.context,
      gain: 0
    }).connect(this.output);
    this._highpass = new Filter({
      // Q: -3.0102999566398125,
      Q: 0,
      context: this.context,
      type: "highpass"
    }).connect(this._amplitude);
    for (let i = 0; i < inharmRatios.length; i++) {
      const osc = new FMOscillator({
        context: this.context,
        harmonicity: options.harmonicity,
        modulationIndex: options.modulationIndex,
        modulationType: "square",
        onstop: i === 0 ? () => this.onsilence(this) : noOp,
        type: "square"
      });
      osc.connect(this._highpass);
      this._oscillators[i] = osc;
      const mult = new Multiply({
        context: this.context,
        value: inharmRatios[i]
      });
      this._freqMultipliers[i] = mult;
      this.frequency.chain(mult, osc.frequency);
      this.detune.connect(osc.detune);
    }
    this._filterFreqScaler = new Scale({
      context: this.context,
      max: 7e3,
      min: this.toFrequency(options.resonance)
    });
    this.envelope = new Envelope({
      attack: options.envelope.attack,
      attackCurve: "linear",
      context: this.context,
      decay: options.envelope.decay,
      release: options.envelope.release,
      sustain: 0
    });
    this.envelope.chain(this._filterFreqScaler, this._highpass.frequency);
    this.envelope.connect(this._amplitude.gain);
    this._octaves = options.octaves;
    this.octaves = options.octaves;
  }
  static getDefaults() {
    return deepMerge(Monophonic.getDefaults(), {
      envelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
        attack: 1e-3,
        decay: 1.4,
        release: 0.2
      }),
      harmonicity: 5.1,
      modulationIndex: 32,
      octaves: 1.5,
      resonance: 4e3
    });
  }
  /**
   * Trigger the attack.
   * @param time When the attack should be triggered.
   * @param velocity The velocity that the envelope should be triggered at.
   */
  _triggerEnvelopeAttack(time, velocity = 1) {
    this.envelope.triggerAttack(time, velocity);
    this._oscillators.forEach((osc) => osc.start(time));
    if (this.envelope.sustain === 0) {
      this._oscillators.forEach((osc) => {
        osc.stop(time + this.toSeconds(this.envelope.attack) + this.toSeconds(this.envelope.decay));
      });
    }
    return this;
  }
  /**
   * Trigger the release of the envelope.
   * @param time When the release should be triggered.
   */
  _triggerEnvelopeRelease(time) {
    this.envelope.triggerRelease(time);
    this._oscillators.forEach((osc) => osc.stop(time + this.toSeconds(this.envelope.release)));
    return this;
  }
  getLevelAtTime(time) {
    time = this.toSeconds(time);
    return this.envelope.getValueAtTime(time);
  }
  /**
   * The modulationIndex of the oscillators which make up the source.
   * see {@link FMOscillator.modulationIndex}
   * @min 1
   * @max 100
   */
  get modulationIndex() {
    return this._oscillators[0].modulationIndex.value;
  }
  set modulationIndex(val) {
    this._oscillators.forEach((osc) => osc.modulationIndex.value = val);
  }
  /**
   * The harmonicity of the oscillators which make up the source.
   * see Tone.FMOscillator.harmonicity
   * @min 0.1
   * @max 10
   */
  get harmonicity() {
    return this._oscillators[0].harmonicity.value;
  }
  set harmonicity(val) {
    this._oscillators.forEach((osc) => osc.harmonicity.value = val);
  }
  /**
   * The lower level of the highpass filter which is attached to the envelope.
   * This value should be between [0, 7000]
   * @min 0
   * @max 7000
   */
  get resonance() {
    return this._filterFreqScaler.min;
  }
  set resonance(val) {
    this._filterFreqScaler.min = this.toFrequency(val);
    this.octaves = this._octaves;
  }
  /**
   * The number of octaves above the "resonance" frequency
   * that the filter ramps during the attack/decay envelope
   * @min 0
   * @max 8
   */
  get octaves() {
    return this._octaves;
  }
  set octaves(val) {
    this._octaves = val;
    this._filterFreqScaler.max = this._filterFreqScaler.min * Math.pow(2, val);
  }
  dispose() {
    super.dispose();
    this._oscillators.forEach((osc) => osc.dispose());
    this._freqMultipliers.forEach((freqMult) => freqMult.dispose());
    this.frequency.dispose();
    this.detune.dispose();
    this._filterFreqScaler.dispose();
    this._amplitude.dispose();
    this.envelope.dispose();
    this._highpass.dispose();
    return this;
  }
}
class NoiseSynth extends Instrument {
  constructor() {
    super(optionsFromArguments(NoiseSynth.getDefaults(), arguments));
    this.name = "NoiseSynth";
    const options = optionsFromArguments(NoiseSynth.getDefaults(), arguments);
    this.noise = new Noise(Object.assign({
      context: this.context
    }, options.noise));
    this.envelope = new AmplitudeEnvelope(Object.assign({
      context: this.context
    }, options.envelope));
    this.noise.chain(this.envelope, this.output);
  }
  static getDefaults() {
    return Object.assign(Instrument.getDefaults(), {
      envelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
        decay: 0.1,
        sustain: 0
      }),
      noise: Object.assign(omitFromObject(Noise.getDefaults(), Object.keys(Source.getDefaults())), {
        type: "white"
      })
    });
  }
  /**
   * Start the attack portion of the envelopes. Unlike other
   * instruments, Tone.NoiseSynth doesn't have a note.
   * @example
   * const noiseSynth = new Tone.NoiseSynth().toDestination();
   * noiseSynth.triggerAttack();
   */
  triggerAttack(time, velocity = 1) {
    time = this.toSeconds(time);
    this.envelope.triggerAttack(time, velocity);
    this.noise.start(time);
    if (this.envelope.sustain === 0) {
      this.noise.stop(time + this.toSeconds(this.envelope.attack) + this.toSeconds(this.envelope.decay));
    }
    return this;
  }
  /**
   * Start the release portion of the envelopes.
   */
  triggerRelease(time) {
    time = this.toSeconds(time);
    this.envelope.triggerRelease(time);
    this.noise.stop(time + this.toSeconds(this.envelope.release));
    return this;
  }
  sync() {
    if (this._syncState()) {
      this._syncMethod("triggerAttack", 0);
      this._syncMethod("triggerRelease", 0);
    }
    return this;
  }
  /**
   * Trigger the attack and then the release after the duration.
   * @param duration The amount of time to hold the note for
   * @param time The time the note should start
   * @param velocity The volume of the note (0-1)
   * @example
   * const noiseSynth = new Tone.NoiseSynth().toDestination();
   * // hold the note for 0.5 seconds
   * noiseSynth.triggerAttackRelease(0.5);
   */
  triggerAttackRelease(duration, time, velocity = 1) {
    time = this.toSeconds(time);
    duration = this.toSeconds(duration);
    this.triggerAttack(time, velocity);
    this.triggerRelease(time + duration);
    return this;
  }
  dispose() {
    super.dispose();
    this.noise.dispose();
    this.envelope.dispose();
    return this;
  }
}
class ToneAudioWorklet extends ToneAudioNode {
  constructor(options) {
    super(options);
    this.name = "ToneAudioWorklet";
    this.workletOptions = {};
    this.onprocessorerror = noOp;
    const blobUrl = URL.createObjectURL(new Blob([getWorkletGlobalScope()], { type: "text/javascript" }));
    const name = this._audioWorkletName();
    this._dummyGain = this.context.createGain();
    this._dummyParam = this._dummyGain.gain;
    this.context.addAudioWorkletModule(blobUrl).then(() => {
      if (!this.disposed) {
        this._worklet = this.context.createAudioWorkletNode(name, this.workletOptions);
        this._worklet.onprocessorerror = this.onprocessorerror.bind(this);
        this.onReady(this._worklet);
      }
    });
  }
  dispose() {
    super.dispose();
    this._dummyGain.disconnect();
    if (this._worklet) {
      this._worklet.port.postMessage("dispose");
      this._worklet.disconnect();
    }
    return this;
  }
}
class PolySynth extends Instrument {
  constructor() {
    super(optionsFromArguments(PolySynth.getDefaults(), arguments, ["voice", "options"]));
    this.name = "PolySynth";
    this._availableVoices = [];
    this._activeVoices = [];
    this._voices = [];
    this._gcTimeout = -1;
    this._averageActiveVoices = 0;
    this._syncedRelease = (time) => this.releaseAll(time);
    const options = optionsFromArguments(PolySynth.getDefaults(), arguments, ["voice", "options"]);
    assert(!isNumber(options.voice), "DEPRECATED: The polyphony count is no longer the first argument.");
    const defaults = options.voice.getDefaults();
    this.options = Object.assign(defaults, options.options);
    this.voice = options.voice;
    this.maxPolyphony = options.maxPolyphony;
    this._dummyVoice = this._getNextAvailableVoice();
    const index = this._voices.indexOf(this._dummyVoice);
    this._voices.splice(index, 1);
    this._gcTimeout = this.context.setInterval(this._collectGarbage.bind(this), 1);
  }
  static getDefaults() {
    return Object.assign(Instrument.getDefaults(), {
      maxPolyphony: 32,
      options: {},
      voice: Synth
    });
  }
  /**
   * The number of active voices.
   */
  get activeVoices() {
    return this._activeVoices.length;
  }
  /**
   * Invoked when the source is done making sound, so that it can be
   * readded to the pool of available voices
   */
  _makeVoiceAvailable(voice) {
    this._availableVoices.push(voice);
    const activeVoiceIndex = this._activeVoices.findIndex((e) => e.voice === voice);
    this._activeVoices.splice(activeVoiceIndex, 1);
  }
  /**
   * Get an available voice from the pool of available voices.
   * If one is not available and the maxPolyphony limit is reached,
   * steal a voice, otherwise return null.
   */
  _getNextAvailableVoice() {
    if (this._availableVoices.length) {
      return this._availableVoices.shift();
    } else if (this._voices.length < this.maxPolyphony) {
      const voice = new this.voice(Object.assign(this.options, {
        context: this.context,
        onsilence: this._makeVoiceAvailable.bind(this)
      }));
      assert(voice instanceof Monophonic, "Voice must extend Monophonic class");
      voice.connect(this.output);
      this._voices.push(voice);
      return voice;
    } else {
      warn("Max polyphony exceeded. Note dropped.");
    }
  }
  /**
   * Occasionally check if there are any allocated voices which can be cleaned up.
   */
  _collectGarbage() {
    this._averageActiveVoices = Math.max(this._averageActiveVoices * 0.95, this.activeVoices);
    if (this._availableVoices.length && this._voices.length > Math.ceil(this._averageActiveVoices + 1)) {
      const firstAvail = this._availableVoices.shift();
      const index = this._voices.indexOf(firstAvail);
      this._voices.splice(index, 1);
      if (!this.context.isOffline) {
        firstAvail.dispose();
      }
    }
  }
  /**
   * Internal method which triggers the attack
   */
  _triggerAttack(notes, time, velocity) {
    notes.forEach((note) => {
      const midiNote = new MidiClass(this.context, note).toMidi();
      const voice = this._getNextAvailableVoice();
      if (voice) {
        voice.triggerAttack(note, time, velocity);
        this._activeVoices.push({
          midi: midiNote,
          voice,
          released: false
        });
        this.log("triggerAttack", note, time);
      }
    });
  }
  /**
   * Internal method which triggers the release
   */
  _triggerRelease(notes, time) {
    notes.forEach((note) => {
      const midiNote = new MidiClass(this.context, note).toMidi();
      const event = this._activeVoices.find(({ midi, released }) => midi === midiNote && !released);
      if (event) {
        event.voice.triggerRelease(time);
        event.released = true;
        this.log("triggerRelease", note, time);
      }
    });
  }
  /**
   * Schedule the attack/release events. If the time is in the future, then it should set a timeout
   * to wait for just-in-time scheduling
   */
  _scheduleEvent(type, notes, time, velocity) {
    assert(!this.disposed, "Synth was already disposed");
    if (time <= this.now()) {
      if (type === "attack") {
        this._triggerAttack(notes, time, velocity);
      } else {
        this._triggerRelease(notes, time);
      }
    } else {
      this.context.setTimeout(() => {
        if (!this.disposed) {
          this._scheduleEvent(type, notes, time, velocity);
        }
      }, time - this.now());
    }
  }
  /**
   * Trigger the attack portion of the note
   * @param  notes The notes to play. Accepts a single Frequency or an array of frequencies.
   * @param  time  The start time of the note.
   * @param velocity The velocity of the note.
   * @example
   * const synth = new Tone.PolySynth(Tone.FMSynth).toDestination();
   * // trigger a chord immediately with a velocity of 0.2
   * synth.triggerAttack(["Ab3", "C4", "F5"], Tone.now(), 0.2);
   */
  triggerAttack(notes, time, velocity) {
    if (!Array.isArray(notes)) {
      notes = [notes];
    }
    const computedTime = this.toSeconds(time);
    this._scheduleEvent("attack", notes, computedTime, velocity);
    return this;
  }
  /**
   * Trigger the release of the note. Unlike monophonic instruments,
   * a note (or array of notes) needs to be passed in as the first argument.
   * @param  notes The notes to play. Accepts a single Frequency or an array of frequencies.
   * @param  time  When the release will be triggered.
   * @example
   * const poly = new Tone.PolySynth(Tone.AMSynth).toDestination();
   * poly.triggerAttack(["Ab3", "C4", "F5"]);
   * // trigger the release of the given notes.
   * poly.triggerRelease(["Ab3", "C4"], "+1");
   * poly.triggerRelease("F5", "+3");
   */
  triggerRelease(notes, time) {
    if (!Array.isArray(notes)) {
      notes = [notes];
    }
    const computedTime = this.toSeconds(time);
    this._scheduleEvent("release", notes, computedTime);
    return this;
  }
  /**
   * Trigger the attack and release after the specified duration
   * @param  notes The notes to play. Accepts a single  Frequency or an array of frequencies.
   * @param  duration the duration of the note
   * @param  time  if no time is given, defaults to now
   * @param  velocity the velocity of the attack (0-1)
   * @example
   * const poly = new Tone.PolySynth(Tone.AMSynth).toDestination();
   * // can pass in an array of durations as well
   * poly.triggerAttackRelease(["Eb3", "G4", "Bb4", "D5"], [4, 3, 2, 1]);
   */
  triggerAttackRelease(notes, duration, time, velocity) {
    const computedTime = this.toSeconds(time);
    this.triggerAttack(notes, computedTime, velocity);
    if (isArray$1(duration)) {
      assert(isArray$1(notes), "If the duration is an array, the notes must also be an array");
      notes = notes;
      for (let i = 0; i < notes.length; i++) {
        const d = duration[Math.min(i, duration.length - 1)];
        const durationSeconds = this.toSeconds(d);
        assert(durationSeconds > 0, "The duration must be greater than 0");
        this.triggerRelease(notes[i], computedTime + durationSeconds);
      }
    } else {
      const durationSeconds = this.toSeconds(duration);
      assert(durationSeconds > 0, "The duration must be greater than 0");
      this.triggerRelease(notes, computedTime + durationSeconds);
    }
    return this;
  }
  sync() {
    if (this._syncState()) {
      this._syncMethod("triggerAttack", 1);
      this._syncMethod("triggerRelease", 1);
      this.context.transport.on("stop", this._syncedRelease);
      this.context.transport.on("pause", this._syncedRelease);
      this.context.transport.on("loopEnd", this._syncedRelease);
    }
    return this;
  }
  /**
   * Set a member/attribute of the voices
   * @example
   * const poly = new Tone.PolySynth().toDestination();
   * // set all of the voices using an options object for the synth type
   * poly.set({
   * 	envelope: {
   * 		attack: 0.25
   * 	}
   * });
   * poly.triggerAttackRelease("Bb3", 0.2);
   */
  set(options) {
    const sanitizedOptions = omitFromObject(options, ["onsilence", "context"]);
    this.options = deepMerge(this.options, sanitizedOptions);
    this._voices.forEach((voice) => voice.set(sanitizedOptions));
    this._dummyVoice.set(sanitizedOptions);
    return this;
  }
  get() {
    return this._dummyVoice.get();
  }
  /**
   * Trigger the release portion of all the currently active voices immediately.
   * Useful for silencing the synth.
   */
  releaseAll(time) {
    const computedTime = this.toSeconds(time);
    this._activeVoices.forEach(({ voice }) => {
      voice.triggerRelease(computedTime);
    });
    return this;
  }
  dispose() {
    super.dispose();
    this._dummyVoice.dispose();
    this._voices.forEach((v) => v.dispose());
    this._activeVoices = [];
    this._availableVoices = [];
    this.context.clearInterval(this._gcTimeout);
    return this;
  }
}
class ToneEvent extends ToneWithContext {
  constructor() {
    super(optionsFromArguments(ToneEvent.getDefaults(), arguments, ["callback", "value"]));
    this.name = "ToneEvent";
    this._state = new StateTimeline("stopped");
    this._startOffset = 0;
    const options = optionsFromArguments(ToneEvent.getDefaults(), arguments, ["callback", "value"]);
    this._loop = options.loop;
    this.callback = options.callback;
    this.value = options.value;
    this._loopStart = this.toTicks(options.loopStart);
    this._loopEnd = this.toTicks(options.loopEnd);
    this._playbackRate = options.playbackRate;
    this._probability = options.probability;
    this._humanize = options.humanize;
    this.mute = options.mute;
    this._playbackRate = options.playbackRate;
    this._state.increasing = true;
    this._rescheduleEvents();
  }
  static getDefaults() {
    return Object.assign(ToneWithContext.getDefaults(), {
      callback: noOp,
      humanize: false,
      loop: false,
      loopEnd: "1m",
      loopStart: 0,
      mute: false,
      playbackRate: 1,
      probability: 1,
      value: null
    });
  }
  /**
   * Reschedule all of the events along the timeline
   * with the updated values.
   * @param after Only reschedules events after the given time.
   */
  _rescheduleEvents(after = -1) {
    this._state.forEachFrom(after, (event) => {
      let duration;
      if (event.state === "started") {
        if (event.id !== -1) {
          this.context.transport.clear(event.id);
        }
        const startTick = event.time + Math.round(this.startOffset / this._playbackRate);
        if (this._loop === true || isNumber(this._loop) && this._loop > 1) {
          duration = Infinity;
          if (isNumber(this._loop)) {
            duration = this._loop * this._getLoopDuration();
          }
          const nextEvent = this._state.getAfter(startTick);
          if (nextEvent !== null) {
            duration = Math.min(duration, nextEvent.time - startTick);
          }
          if (duration !== Infinity) {
            duration = new TicksClass(this.context, duration);
          }
          const interval = new TicksClass(this.context, this._getLoopDuration());
          event.id = this.context.transport.scheduleRepeat(this._tick.bind(this), interval, new TicksClass(this.context, startTick), duration);
        } else {
          event.id = this.context.transport.schedule(this._tick.bind(this), new TicksClass(this.context, startTick));
        }
      }
    });
  }
  /**
   * Returns the playback state of the note, either "started" or "stopped".
   */
  get state() {
    return this._state.getValueAtTime(this.context.transport.ticks);
  }
  /**
   * The start from the scheduled start time.
   */
  get startOffset() {
    return this._startOffset;
  }
  set startOffset(offset) {
    this._startOffset = offset;
  }
  /**
   * The probability of the notes being triggered.
   */
  get probability() {
    return this._probability;
  }
  set probability(prob) {
    this._probability = prob;
  }
  /**
   * If set to true, will apply small random variation
   * to the callback time. If the value is given as a time, it will randomize
   * by that amount.
   * @example
   * const event = new Tone.ToneEvent();
   * event.humanize = true;
   */
  get humanize() {
    return this._humanize;
  }
  set humanize(variation) {
    this._humanize = variation;
  }
  /**
   * Start the note at the given time.
   * @param  time  When the event should start.
   */
  start(time) {
    const ticks = this.toTicks(time);
    if (this._state.getValueAtTime(ticks) === "stopped") {
      this._state.add({
        id: -1,
        state: "started",
        time: ticks
      });
      this._rescheduleEvents(ticks);
    }
    return this;
  }
  /**
   * Stop the Event at the given time.
   * @param  time  When the event should stop.
   */
  stop(time) {
    this.cancel(time);
    const ticks = this.toTicks(time);
    if (this._state.getValueAtTime(ticks) === "started") {
      this._state.setStateAtTime("stopped", ticks, { id: -1 });
      const previousEvent = this._state.getBefore(ticks);
      let rescheduleTime = ticks;
      if (previousEvent !== null) {
        rescheduleTime = previousEvent.time;
      }
      this._rescheduleEvents(rescheduleTime);
    }
    return this;
  }
  /**
   * Cancel all scheduled events greater than or equal to the given time
   * @param  time  The time after which events will be cancel.
   */
  cancel(time) {
    time = defaultArg(time, -Infinity);
    const ticks = this.toTicks(time);
    this._state.forEachFrom(ticks, (event) => {
      this.context.transport.clear(event.id);
    });
    this._state.cancel(ticks);
    return this;
  }
  /**
   * The callback function invoker. Also
   * checks if the Event is done playing
   * @param  time  The time of the event in seconds
   */
  _tick(time) {
    const ticks = this.context.transport.getTicksAtTime(time);
    if (!this.mute && this._state.getValueAtTime(ticks) === "started") {
      if (this.probability < 1 && Math.random() > this.probability) {
        return;
      }
      if (this.humanize) {
        let variation = 0.02;
        if (!isBoolean(this.humanize)) {
          variation = this.toSeconds(this.humanize);
        }
        time += (Math.random() * 2 - 1) * variation;
      }
      this.callback(time, this.value);
    }
  }
  /**
   * Get the duration of the loop.
   */
  _getLoopDuration() {
    return (this._loopEnd - this._loopStart) / this._playbackRate;
  }
  /**
   * If the note should loop or not
   * between ToneEvent.loopStart and
   * ToneEvent.loopEnd. If set to true,
   * the event will loop indefinitely,
   * if set to a number greater than 1
   * it will play a specific number of
   * times, if set to false, 0 or 1, the
   * part will only play once.
   */
  get loop() {
    return this._loop;
  }
  set loop(loop) {
    this._loop = loop;
    this._rescheduleEvents();
  }
  /**
   * The playback rate of the event. Defaults to 1.
   * @example
   * const note = new Tone.ToneEvent();
   * note.loop = true;
   * // repeat the note twice as fast
   * note.playbackRate = 2;
   */
  get playbackRate() {
    return this._playbackRate;
  }
  set playbackRate(rate) {
    this._playbackRate = rate;
    this._rescheduleEvents();
  }
  /**
   * The loopEnd point is the time the event will loop
   * if ToneEvent.loop is true.
   */
  get loopEnd() {
    return new TicksClass(this.context, this._loopEnd).toSeconds();
  }
  set loopEnd(loopEnd) {
    this._loopEnd = this.toTicks(loopEnd);
    if (this._loop) {
      this._rescheduleEvents();
    }
  }
  /**
   * The time when the loop should start.
   */
  get loopStart() {
    return new TicksClass(this.context, this._loopStart).toSeconds();
  }
  set loopStart(loopStart) {
    this._loopStart = this.toTicks(loopStart);
    if (this._loop) {
      this._rescheduleEvents();
    }
  }
  /**
   * The current progress of the loop interval.
   * Returns 0 if the event is not started yet or
   * it is not set to loop.
   */
  get progress() {
    if (this._loop) {
      const ticks = this.context.transport.ticks;
      const lastEvent = this._state.get(ticks);
      if (lastEvent !== null && lastEvent.state === "started") {
        const loopDuration = this._getLoopDuration();
        const progress = (ticks - lastEvent.time) % loopDuration;
        return progress / loopDuration;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }
  dispose() {
    super.dispose();
    this.cancel();
    this._state.dispose();
    return this;
  }
}
class Part extends ToneEvent {
  constructor() {
    super(optionsFromArguments(Part.getDefaults(), arguments, ["callback", "events"]));
    this.name = "Part";
    this._state = new StateTimeline("stopped");
    this._events = /* @__PURE__ */ new Set();
    const options = optionsFromArguments(Part.getDefaults(), arguments, ["callback", "events"]);
    this._state.increasing = true;
    options.events.forEach((event) => {
      if (isArray$1(event)) {
        this.add(event[0], event[1]);
      } else {
        this.add(event);
      }
    });
  }
  static getDefaults() {
    return Object.assign(ToneEvent.getDefaults(), {
      events: []
    });
  }
  /**
   * Start the part at the given time.
   * @param  time    When to start the part.
   * @param  offset  The offset from the start of the part to begin playing at.
   */
  start(time, offset) {
    const ticks = this.toTicks(time);
    if (this._state.getValueAtTime(ticks) !== "started") {
      offset = defaultArg(offset, this._loop ? this._loopStart : 0);
      if (this._loop) {
        offset = defaultArg(offset, this._loopStart);
      } else {
        offset = defaultArg(offset, 0);
      }
      const computedOffset = this.toTicks(offset);
      this._state.add({
        id: -1,
        offset: computedOffset,
        state: "started",
        time: ticks
      });
      this._forEach((event) => {
        this._startNote(event, ticks, computedOffset);
      });
    }
    return this;
  }
  /**
   * Start the event in the given event at the correct time given
   * the ticks and offset and looping.
   * @param  event
   * @param  ticks
   * @param  offset
   */
  _startNote(event, ticks, offset) {
    ticks -= offset;
    if (this._loop) {
      if (event.startOffset >= this._loopStart && event.startOffset < this._loopEnd) {
        if (event.startOffset < offset) {
          ticks += this._getLoopDuration();
        }
        event.start(new TicksClass(this.context, ticks));
      } else if (event.startOffset < this._loopStart && event.startOffset >= offset) {
        event.loop = false;
        event.start(new TicksClass(this.context, ticks));
      }
    } else if (event.startOffset >= offset) {
      event.start(new TicksClass(this.context, ticks));
    }
  }
  get startOffset() {
    return this._startOffset;
  }
  set startOffset(offset) {
    this._startOffset = offset;
    this._forEach((event) => {
      event.startOffset += this._startOffset;
    });
  }
  /**
   * Stop the part at the given time.
   * @param  time  When to stop the part.
   */
  stop(time) {
    const ticks = this.toTicks(time);
    this._state.cancel(ticks);
    this._state.setStateAtTime("stopped", ticks);
    this._forEach((event) => {
      event.stop(time);
    });
    return this;
  }
  /**
   * Get/Set an Event's value at the given time.
   * If a value is passed in and no event exists at
   * the given time, one will be created with that value.
   * If two events are at the same time, the first one will
   * be returned.
   * @example
   * const part = new Tone.Part();
   * part.at("1m"); // returns the part at the first measure
   * part.at("2m", "C2"); // set the value at "2m" to C2.
   * // if an event didn't exist at that time, it will be created.
   * @param time The time of the event to get or set.
   * @param value If a value is passed in, the value of the event at the given time will be set to it.
   */
  at(time, value) {
    const timeInTicks = new TransportTimeClass(this.context, time).toTicks();
    const tickTime = new TicksClass(this.context, 1).toSeconds();
    const iterator = this._events.values();
    let result = iterator.next();
    while (!result.done) {
      const event = result.value;
      if (Math.abs(timeInTicks - event.startOffset) < tickTime) {
        if (isDefined(value)) {
          event.value = value;
        }
        return event;
      }
      result = iterator.next();
    }
    if (isDefined(value)) {
      this.add(time, value);
      return this.at(time);
    } else {
      return null;
    }
  }
  add(time, value) {
    if (time instanceof Object && Reflect.has(time, "time")) {
      value = time;
      time = value.time;
    }
    const ticks = this.toTicks(time);
    let event;
    if (value instanceof ToneEvent) {
      event = value;
      event.callback = this._tick.bind(this);
    } else {
      event = new ToneEvent({
        callback: this._tick.bind(this),
        context: this.context,
        value
      });
    }
    event.startOffset = ticks;
    event.set({
      humanize: this.humanize,
      loop: this.loop,
      loopEnd: this.loopEnd,
      loopStart: this.loopStart,
      playbackRate: this.playbackRate,
      probability: this.probability
    });
    this._events.add(event);
    this._restartEvent(event);
    return this;
  }
  /**
   * Restart the given event
   */
  _restartEvent(event) {
    this._state.forEach((stateEvent) => {
      if (stateEvent.state === "started") {
        this._startNote(event, stateEvent.time, stateEvent.offset);
      } else {
        event.stop(new TicksClass(this.context, stateEvent.time));
      }
    });
  }
  remove(time, value) {
    if (isObject(time) && time.hasOwnProperty("time")) {
      value = time;
      time = value.time;
    }
    time = this.toTicks(time);
    this._events.forEach((event) => {
      if (event.startOffset === time) {
        if (isUndef(value) || isDefined(value) && event.value === value) {
          this._events.delete(event);
          event.dispose();
        }
      }
    });
    return this;
  }
  /**
   * Remove all of the notes from the group.
   */
  clear() {
    this._forEach((event) => event.dispose());
    this._events.clear();
    return this;
  }
  /**
   * Cancel scheduled state change events: i.e. "start" and "stop".
   * @param after The time after which to cancel the scheduled events.
   */
  cancel(after) {
    this._forEach((event) => event.cancel(after));
    this._state.cancel(this.toTicks(after));
    return this;
  }
  /**
   * Iterate over all of the events
   */
  _forEach(callback) {
    if (this._events) {
      this._events.forEach((event) => {
        if (event instanceof Part) {
          event._forEach(callback);
        } else {
          callback(event);
        }
      });
    }
    return this;
  }
  /**
   * Set the attribute of all of the events
   * @param  attr  the attribute to set
   * @param  value      The value to set it to
   */
  _setAll(attr, value) {
    this._forEach((event) => {
      event[attr] = value;
    });
  }
  /**
   * Internal tick method
   * @param  time  The time of the event in seconds
   */
  _tick(time, value) {
    if (!this.mute) {
      this.callback(time, value);
    }
  }
  /**
   * Determine if the event should be currently looping
   * given the loop boundries of this Part.
   * @param  event  The event to test
   */
  _testLoopBoundries(event) {
    if (this._loop && (event.startOffset < this._loopStart || event.startOffset >= this._loopEnd)) {
      event.cancel(0);
    } else if (event.state === "stopped") {
      this._restartEvent(event);
    }
  }
  get probability() {
    return this._probability;
  }
  set probability(prob) {
    this._probability = prob;
    this._setAll("probability", prob);
  }
  get humanize() {
    return this._humanize;
  }
  set humanize(variation) {
    this._humanize = variation;
    this._setAll("humanize", variation);
  }
  /**
   * If the part should loop or not
   * between Part.loopStart and
   * Part.loopEnd. If set to true,
   * the part will loop indefinitely,
   * if set to a number greater than 1
   * it will play a specific number of
   * times, if set to false, 0 or 1, the
   * part will only play once.
   * @example
   * const part = new Tone.Part();
   * // loop the part 8 times
   * part.loop = 8;
   */
  get loop() {
    return this._loop;
  }
  set loop(loop) {
    this._loop = loop;
    this._forEach((event) => {
      event.loopStart = this.loopStart;
      event.loopEnd = this.loopEnd;
      event.loop = loop;
      this._testLoopBoundries(event);
    });
  }
  /**
   * The loopEnd point determines when it will
   * loop if Part.loop is true.
   */
  get loopEnd() {
    return new TicksClass(this.context, this._loopEnd).toSeconds();
  }
  set loopEnd(loopEnd) {
    this._loopEnd = this.toTicks(loopEnd);
    if (this._loop) {
      this._forEach((event) => {
        event.loopEnd = loopEnd;
        this._testLoopBoundries(event);
      });
    }
  }
  /**
   * The loopStart point determines when it will
   * loop if Part.loop is true.
   */
  get loopStart() {
    return new TicksClass(this.context, this._loopStart).toSeconds();
  }
  set loopStart(loopStart) {
    this._loopStart = this.toTicks(loopStart);
    if (this._loop) {
      this._forEach((event) => {
        event.loopStart = this.loopStart;
        this._testLoopBoundries(event);
      });
    }
  }
  /**
   * The playback rate of the part
   */
  get playbackRate() {
    return this._playbackRate;
  }
  set playbackRate(rate) {
    this._playbackRate = rate;
    this._setAll("playbackRate", rate);
  }
  /**
   * The number of scheduled notes in the part.
   */
  get length() {
    return this._events.size;
  }
  dispose() {
    super.dispose();
    this.clear();
    return this;
  }
}
class Sequence extends ToneEvent {
  constructor() {
    super(optionsFromArguments(Sequence.getDefaults(), arguments, ["callback", "events", "subdivision"]));
    this.name = "Sequence";
    this._part = new Part({
      callback: this._seqCallback.bind(this),
      context: this.context
    });
    this._events = [];
    this._eventsArray = [];
    const options = optionsFromArguments(Sequence.getDefaults(), arguments, ["callback", "events", "subdivision"]);
    this._subdivision = this.toTicks(options.subdivision);
    this.events = options.events;
    this.loop = options.loop;
    this.loopStart = options.loopStart;
    this.loopEnd = options.loopEnd;
    this.playbackRate = options.playbackRate;
    this.probability = options.probability;
    this.humanize = options.humanize;
    this.mute = options.mute;
    this.playbackRate = options.playbackRate;
  }
  static getDefaults() {
    return Object.assign(omitFromObject(ToneEvent.getDefaults(), ["value"]), {
      events: [],
      loop: true,
      loopEnd: 0,
      loopStart: 0,
      subdivision: "8n"
    });
  }
  /**
   * The internal callback for when an event is invoked
   */
  _seqCallback(time, value) {
    if (value !== null && !this.mute) {
      this.callback(time, value);
    }
  }
  /**
   * The sequence
   */
  get events() {
    return this._events;
  }
  set events(s) {
    this.clear();
    this._eventsArray = s;
    this._events = this._createSequence(this._eventsArray);
    this._eventsUpdated();
  }
  /**
   * Start the part at the given time.
   * @param  time    When to start the part.
   * @param  offset  The offset index to start at
   */
  start(time, offset) {
    this._part.start(time, offset ? this._indexTime(offset) : offset);
    return this;
  }
  /**
   * Stop the part at the given time.
   * @param  time  When to stop the part.
   */
  stop(time) {
    this._part.stop(time);
    return this;
  }
  /**
   * The subdivision of the sequence. This can only be
   * set in the constructor. The subdivision is the
   * interval between successive steps.
   */
  get subdivision() {
    return new TicksClass(this.context, this._subdivision).toSeconds();
  }
  /**
   * Create a sequence proxy which can be monitored to create subsequences
   */
  _createSequence(array) {
    return new Proxy(array, {
      get: (target, property) => {
        return target[property];
      },
      set: (target, property, value) => {
        if (isString(property) && isFinite(parseInt(property, 10))) {
          if (isArray$1(value)) {
            target[property] = this._createSequence(value);
          } else {
            target[property] = value;
          }
        } else {
          target[property] = value;
        }
        this._eventsUpdated();
        return true;
      }
    });
  }
  /**
   * When the sequence has changed, all of the events need to be recreated
   */
  _eventsUpdated() {
    this._part.clear();
    this._rescheduleSequence(this._eventsArray, this._subdivision, this.startOffset);
    this.loopEnd = this.loopEnd;
  }
  /**
   * reschedule all of the events that need to be rescheduled
   */
  _rescheduleSequence(sequence, subdivision, startOffset) {
    sequence.forEach((value, index) => {
      const eventOffset = index * subdivision + startOffset;
      if (isArray$1(value)) {
        this._rescheduleSequence(value, subdivision / value.length, eventOffset);
      } else {
        const startTime = new TicksClass(this.context, eventOffset, "i").toSeconds();
        this._part.add(startTime, value);
      }
    });
  }
  /**
   * Get the time of the index given the Sequence's subdivision
   * @param  index
   * @return The time of that index
   */
  _indexTime(index) {
    return new TicksClass(this.context, index * this._subdivision + this.startOffset).toSeconds();
  }
  /**
   * Clear all of the events
   */
  clear() {
    this._part.clear();
    return this;
  }
  dispose() {
    super.dispose();
    this._part.dispose();
    return this;
  }
  //-------------------------------------
  // PROXY CALLS
  //-------------------------------------
  get loop() {
    return this._part.loop;
  }
  set loop(l) {
    this._part.loop = l;
  }
  /**
   * The index at which the sequence should start looping
   */
  get loopStart() {
    return this._loopStart;
  }
  set loopStart(index) {
    this._loopStart = index;
    this._part.loopStart = this._indexTime(index);
  }
  /**
   * The index at which the sequence should end looping
   */
  get loopEnd() {
    return this._loopEnd;
  }
  set loopEnd(index) {
    this._loopEnd = index;
    if (index === 0) {
      this._part.loopEnd = this._indexTime(this._eventsArray.length);
    } else {
      this._part.loopEnd = this._indexTime(index);
    }
  }
  get startOffset() {
    return this._part.startOffset;
  }
  set startOffset(start2) {
    this._part.startOffset = start2;
  }
  get playbackRate() {
    return this._part.playbackRate;
  }
  set playbackRate(rate) {
    this._part.playbackRate = rate;
  }
  get probability() {
    return this._part.probability;
  }
  set probability(prob) {
    this._part.probability = prob;
  }
  get progress() {
    return this._part.progress;
  }
  get humanize() {
    return this._part.humanize;
  }
  set humanize(variation) {
    this._part.humanize = variation;
  }
  /**
   * The number of scheduled events
   */
  get length() {
    return this._part.length;
  }
}
class CrossFade extends ToneAudioNode {
  constructor() {
    super(Object.assign(optionsFromArguments(CrossFade.getDefaults(), arguments, ["fade"])));
    this.name = "CrossFade";
    this._panner = this.context.createStereoPanner();
    this._split = this.context.createChannelSplitter(2);
    this._g2a = new GainToAudio({ context: this.context });
    this.a = new Gain({
      context: this.context,
      gain: 0
    });
    this.b = new Gain({
      context: this.context,
      gain: 0
    });
    this.output = new Gain({ context: this.context });
    this._internalChannels = [this.a, this.b];
    const options = optionsFromArguments(CrossFade.getDefaults(), arguments, ["fade"]);
    this.fade = new Signal({
      context: this.context,
      units: "normalRange",
      value: options.fade
    });
    readOnly(this, "fade");
    this.context.getConstant(1).connect(this._panner);
    this._panner.connect(this._split);
    this._panner.channelCount = 1;
    this._panner.channelCountMode = "explicit";
    connect(this._split, this.a.gain, 0);
    connect(this._split, this.b.gain, 1);
    this.fade.chain(this._g2a, this._panner.pan);
    this.a.connect(this.output);
    this.b.connect(this.output);
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      fade: 0.5
    });
  }
  dispose() {
    super.dispose();
    this.a.dispose();
    this.b.dispose();
    this.output.dispose();
    this.fade.dispose();
    this._g2a.dispose();
    this._panner.disconnect();
    this._split.disconnect();
    return this;
  }
}
class Effect extends ToneAudioNode {
  constructor(options) {
    super(options);
    this.name = "Effect";
    this._dryWet = new CrossFade({ context: this.context });
    this.wet = this._dryWet.fade;
    this.effectSend = new Gain({ context: this.context });
    this.effectReturn = new Gain({ context: this.context });
    this.input = new Gain({ context: this.context });
    this.output = this._dryWet;
    this.input.fan(this._dryWet.a, this.effectSend);
    this.effectReturn.connect(this._dryWet.b);
    this.wet.setValueAtTime(options.wet, 0);
    this._internalChannels = [this.effectReturn, this.effectSend];
    readOnly(this, "wet");
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      wet: 1
    });
  }
  /**
   * chains the effect in between the effectSend and effectReturn
   */
  connectEffect(effect) {
    this._internalChannels.push(effect);
    this.effectSend.chain(effect, this.effectReturn);
    return this;
  }
  dispose() {
    super.dispose();
    this._dryWet.dispose();
    this.effectSend.dispose();
    this.effectReturn.dispose();
    this.wet.dispose();
    return this;
  }
}
class BitCrusher extends Effect {
  constructor() {
    super(optionsFromArguments(BitCrusher.getDefaults(), arguments, ["bits"]));
    this.name = "BitCrusher";
    const options = optionsFromArguments(BitCrusher.getDefaults(), arguments, ["bits"]);
    this._bitCrusherWorklet = new BitCrusherWorklet({
      context: this.context,
      bits: options.bits
    });
    this.connectEffect(this._bitCrusherWorklet);
    this.bits = this._bitCrusherWorklet.bits;
  }
  static getDefaults() {
    return Object.assign(Effect.getDefaults(), {
      bits: 4
    });
  }
  dispose() {
    super.dispose();
    this._bitCrusherWorklet.dispose();
    return this;
  }
}
class BitCrusherWorklet extends ToneAudioWorklet {
  constructor() {
    super(optionsFromArguments(BitCrusherWorklet.getDefaults(), arguments));
    this.name = "BitCrusherWorklet";
    const options = optionsFromArguments(BitCrusherWorklet.getDefaults(), arguments);
    this.input = new Gain({ context: this.context });
    this.output = new Gain({ context: this.context });
    this.bits = new Param({
      context: this.context,
      value: options.bits,
      units: "positive",
      minValue: 1,
      maxValue: 16,
      param: this._dummyParam,
      swappable: true
    });
  }
  static getDefaults() {
    return Object.assign(ToneAudioWorklet.getDefaults(), {
      bits: 12
    });
  }
  _audioWorkletName() {
    return workletName;
  }
  onReady(node) {
    connectSeries(this.input, node, this.output);
    const bits2 = node.parameters.get("bits");
    this.bits.setParam(bits2);
  }
  dispose() {
    super.dispose();
    this.input.dispose();
    this.output.dispose();
    this.bits.dispose();
    return this;
  }
}
class Split extends ToneAudioNode {
  constructor() {
    super(optionsFromArguments(Split.getDefaults(), arguments, ["channels"]));
    this.name = "Split";
    const options = optionsFromArguments(Split.getDefaults(), arguments, ["channels"]);
    this._splitter = this.input = this.output = this.context.createChannelSplitter(options.channels);
    this._internalChannels = [this._splitter];
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      channels: 2
    });
  }
  dispose() {
    super.dispose();
    this._splitter.disconnect();
    return this;
  }
}
class Merge extends ToneAudioNode {
  constructor() {
    super(optionsFromArguments(Merge.getDefaults(), arguments, ["channels"]));
    this.name = "Merge";
    const options = optionsFromArguments(Merge.getDefaults(), arguments, ["channels"]);
    this._merger = this.output = this.input = this.context.createChannelMerger(options.channels);
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      channels: 2
    });
  }
  dispose() {
    super.dispose();
    this._merger.disconnect();
    return this;
  }
}
class StereoEffect extends ToneAudioNode {
  constructor(options) {
    super(options);
    this.name = "StereoEffect";
    this.input = new Gain({ context: this.context });
    this.input.channelCount = 2;
    this.input.channelCountMode = "explicit";
    this._dryWet = this.output = new CrossFade({
      context: this.context,
      fade: options.wet
    });
    this.wet = this._dryWet.fade;
    this._split = new Split({ context: this.context, channels: 2 });
    this._merge = new Merge({ context: this.context, channels: 2 });
    this.input.connect(this._split);
    this.input.connect(this._dryWet.a);
    this._merge.connect(this._dryWet.b);
    readOnly(this, ["wet"]);
  }
  /**
   * Connect the left part of the effect
   */
  connectEffectLeft(...nodes) {
    this._split.connect(nodes[0], 0, 0);
    connectSeries(...nodes);
    connect(nodes[nodes.length - 1], this._merge, 0, 0);
  }
  /**
   * Connect the right part of the effect
   */
  connectEffectRight(...nodes) {
    this._split.connect(nodes[0], 1, 0);
    connectSeries(...nodes);
    connect(nodes[nodes.length - 1], this._merge, 0, 1);
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      wet: 1
    });
  }
  dispose() {
    super.dispose();
    this._dryWet.dispose();
    this._split.dispose();
    this._merge.dispose();
    return this;
  }
}
class StereoFeedbackEffect extends StereoEffect {
  constructor(options) {
    super(options);
    this.feedback = new Signal({
      context: this.context,
      value: options.feedback,
      units: "normalRange"
    });
    this._feedbackL = new Gain({ context: this.context });
    this._feedbackR = new Gain({ context: this.context });
    this._feedbackSplit = new Split({ context: this.context, channels: 2 });
    this._feedbackMerge = new Merge({ context: this.context, channels: 2 });
    this._merge.connect(this._feedbackSplit);
    this._feedbackMerge.connect(this._split);
    this._feedbackSplit.connect(this._feedbackL, 0, 0);
    this._feedbackL.connect(this._feedbackMerge, 0, 0);
    this._feedbackSplit.connect(this._feedbackR, 1, 0);
    this._feedbackR.connect(this._feedbackMerge, 0, 1);
    this.feedback.fan(this._feedbackL.gain, this._feedbackR.gain);
    readOnly(this, ["feedback"]);
  }
  static getDefaults() {
    return Object.assign(StereoEffect.getDefaults(), {
      feedback: 0.5
    });
  }
  dispose() {
    super.dispose();
    this.feedback.dispose();
    this._feedbackL.dispose();
    this._feedbackR.dispose();
    this._feedbackSplit.dispose();
    this._feedbackMerge.dispose();
    return this;
  }
}
class Chorus extends StereoFeedbackEffect {
  constructor() {
    super(optionsFromArguments(Chorus.getDefaults(), arguments, ["frequency", "delayTime", "depth"]));
    this.name = "Chorus";
    const options = optionsFromArguments(Chorus.getDefaults(), arguments, ["frequency", "delayTime", "depth"]);
    this._depth = options.depth;
    this._delayTime = options.delayTime / 1e3;
    this._lfoL = new LFO({
      context: this.context,
      frequency: options.frequency,
      min: 0,
      max: 1
    });
    this._lfoR = new LFO({
      context: this.context,
      frequency: options.frequency,
      min: 0,
      max: 1,
      phase: 180
    });
    this._delayNodeL = new Delay({ context: this.context });
    this._delayNodeR = new Delay({ context: this.context });
    this.frequency = this._lfoL.frequency;
    readOnly(this, ["frequency"]);
    this._lfoL.frequency.connect(this._lfoR.frequency);
    this.connectEffectLeft(this._delayNodeL);
    this.connectEffectRight(this._delayNodeR);
    this._lfoL.connect(this._delayNodeL.delayTime);
    this._lfoR.connect(this._delayNodeR.delayTime);
    this.depth = this._depth;
    this.type = options.type;
    this.spread = options.spread;
  }
  static getDefaults() {
    return Object.assign(StereoFeedbackEffect.getDefaults(), {
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7,
      type: "sine",
      spread: 180,
      feedback: 0,
      wet: 0.5
    });
  }
  /**
   * The depth of the effect. A depth of 1 makes the delayTime
   * modulate between 0 and 2*delayTime (centered around the delayTime).
   */
  get depth() {
    return this._depth;
  }
  set depth(depth) {
    this._depth = depth;
    const deviation = this._delayTime * depth;
    this._lfoL.min = Math.max(this._delayTime - deviation, 0);
    this._lfoL.max = this._delayTime + deviation;
    this._lfoR.min = Math.max(this._delayTime - deviation, 0);
    this._lfoR.max = this._delayTime + deviation;
  }
  /**
   * The delayTime in milliseconds of the chorus. A larger delayTime
   * will give a more pronounced effect. Nominal range a delayTime
   * is between 2 and 20ms.
   */
  get delayTime() {
    return this._delayTime * 1e3;
  }
  set delayTime(delayTime) {
    this._delayTime = delayTime / 1e3;
    this.depth = this._depth;
  }
  /**
   * The oscillator type of the LFO.
   */
  get type() {
    return this._lfoL.type;
  }
  set type(type) {
    this._lfoL.type = type;
    this._lfoR.type = type;
  }
  /**
   * Amount of stereo spread. When set to 0, both LFO's will be panned centrally.
   * When set to 180, LFO's will be panned hard left and right respectively.
   */
  get spread() {
    return this._lfoR.phase - this._lfoL.phase;
  }
  set spread(spread) {
    this._lfoL.phase = 90 - spread / 2;
    this._lfoR.phase = spread / 2 + 90;
  }
  /**
   * Start the effect.
   */
  start(time) {
    this._lfoL.start(time);
    this._lfoR.start(time);
    return this;
  }
  /**
   * Stop the lfo
   */
  stop(time) {
    this._lfoL.stop(time);
    this._lfoR.stop(time);
    return this;
  }
  /**
   * Sync the filter to the transport.
   * @see {@link LFO.sync}
   */
  sync() {
    this._lfoL.sync();
    this._lfoR.sync();
    return this;
  }
  /**
   * Unsync the filter from the transport.
   */
  unsync() {
    this._lfoL.unsync();
    this._lfoR.unsync();
    return this;
  }
  dispose() {
    super.dispose();
    this._lfoL.dispose();
    this._lfoR.dispose();
    this._delayNodeL.dispose();
    this._delayNodeR.dispose();
    this.frequency.dispose();
    return this;
  }
}
class Distortion extends Effect {
  constructor() {
    super(optionsFromArguments(Distortion.getDefaults(), arguments, ["distortion"]));
    this.name = "Distortion";
    const options = optionsFromArguments(Distortion.getDefaults(), arguments, ["distortion"]);
    this._shaper = new WaveShaper({
      context: this.context,
      length: 4096
    });
    this._distortion = options.distortion;
    this.connectEffect(this._shaper);
    this.distortion = options.distortion;
    this.oversample = options.oversample;
  }
  static getDefaults() {
    return Object.assign(Effect.getDefaults(), {
      distortion: 0.4,
      oversample: "none"
    });
  }
  /**
   * The amount of distortion. Nominal range is between 0 and 1.
   */
  get distortion() {
    return this._distortion;
  }
  set distortion(amount) {
    this._distortion = amount;
    const k = amount * 100;
    const deg = Math.PI / 180;
    this._shaper.setMap((x) => {
      if (Math.abs(x) < 1e-3) {
        return 0;
      } else {
        return (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
      }
    });
  }
  /**
   * The oversampling of the effect. Can either be "none", "2x" or "4x".
   */
  get oversample() {
    return this._shaper.oversample;
  }
  set oversample(oversampling) {
    this._shaper.oversample = oversampling;
  }
  dispose() {
    super.dispose();
    this._shaper.dispose();
    return this;
  }
}
class FeedbackEffect extends Effect {
  constructor(options) {
    super(options);
    this.name = "FeedbackEffect";
    this._feedbackGain = new Gain({
      context: this.context,
      gain: options.feedback,
      units: "normalRange"
    });
    this.feedback = this._feedbackGain.gain;
    readOnly(this, "feedback");
    this.effectReturn.chain(this._feedbackGain, this.effectSend);
  }
  static getDefaults() {
    return Object.assign(Effect.getDefaults(), {
      feedback: 0.125
    });
  }
  dispose() {
    super.dispose();
    this._feedbackGain.dispose();
    this.feedback.dispose();
    return this;
  }
}
class FeedbackDelay extends FeedbackEffect {
  constructor() {
    super(optionsFromArguments(FeedbackDelay.getDefaults(), arguments, ["delayTime", "feedback"]));
    this.name = "FeedbackDelay";
    const options = optionsFromArguments(FeedbackDelay.getDefaults(), arguments, ["delayTime", "feedback"]);
    this._delayNode = new Delay({
      context: this.context,
      delayTime: options.delayTime,
      maxDelay: options.maxDelay
    });
    this.delayTime = this._delayNode.delayTime;
    this.connectEffect(this._delayNode);
    readOnly(this, "delayTime");
  }
  static getDefaults() {
    return Object.assign(FeedbackEffect.getDefaults(), {
      delayTime: 0.25,
      maxDelay: 1
    });
  }
  dispose() {
    super.dispose();
    this._delayNode.dispose();
    this.delayTime.dispose();
    return this;
  }
}
class StereoXFeedbackEffect extends StereoFeedbackEffect {
  constructor(options) {
    super(options);
    this._feedbackL.disconnect();
    this._feedbackL.connect(this._feedbackMerge, 0, 1);
    this._feedbackR.disconnect();
    this._feedbackR.connect(this._feedbackMerge, 0, 0);
    readOnly(this, ["feedback"]);
  }
}
class PingPongDelay extends StereoXFeedbackEffect {
  constructor() {
    super(optionsFromArguments(PingPongDelay.getDefaults(), arguments, ["delayTime", "feedback"]));
    this.name = "PingPongDelay";
    const options = optionsFromArguments(PingPongDelay.getDefaults(), arguments, ["delayTime", "feedback"]);
    this._leftDelay = new Delay({
      context: this.context,
      maxDelay: options.maxDelay
    });
    this._rightDelay = new Delay({
      context: this.context,
      maxDelay: options.maxDelay
    });
    this._rightPreDelay = new Delay({
      context: this.context,
      maxDelay: options.maxDelay
    });
    this.delayTime = new Signal({
      context: this.context,
      units: "time",
      value: options.delayTime
    });
    this.connectEffectLeft(this._leftDelay);
    this.connectEffectRight(this._rightPreDelay, this._rightDelay);
    this.delayTime.fan(this._leftDelay.delayTime, this._rightDelay.delayTime, this._rightPreDelay.delayTime);
    this._feedbackL.disconnect();
    this._feedbackL.connect(this._rightDelay);
    readOnly(this, ["delayTime"]);
  }
  static getDefaults() {
    return Object.assign(StereoXFeedbackEffect.getDefaults(), {
      delayTime: 0.25,
      maxDelay: 1
    });
  }
  dispose() {
    super.dispose();
    this._leftDelay.dispose();
    this._rightDelay.dispose();
    this._rightPreDelay.dispose();
    this.delayTime.dispose();
    return this;
  }
}
class Reverb extends Effect {
  constructor() {
    super(optionsFromArguments(Reverb.getDefaults(), arguments, ["decay"]));
    this.name = "Reverb";
    this._convolver = this.context.createConvolver();
    this.ready = Promise.resolve();
    const options = optionsFromArguments(Reverb.getDefaults(), arguments, ["decay"]);
    this._decay = options.decay;
    this._preDelay = options.preDelay;
    this.generate();
    this.connectEffect(this._convolver);
  }
  static getDefaults() {
    return Object.assign(Effect.getDefaults(), {
      decay: 1.5,
      preDelay: 0.01
    });
  }
  /**
   * The duration of the reverb.
   */
  get decay() {
    return this._decay;
  }
  set decay(time) {
    time = this.toSeconds(time);
    assertRange(time, 1e-3);
    this._decay = time;
    this.generate();
  }
  /**
   * The amount of time before the reverb is fully ramped in.
   */
  get preDelay() {
    return this._preDelay;
  }
  set preDelay(time) {
    time = this.toSeconds(time);
    assertRange(time, 0);
    this._preDelay = time;
    this.generate();
  }
  /**
   * Generate the Impulse Response. Returns a promise while the IR is being generated.
   * @return Promise which returns this object.
   */
  generate() {
    return __awaiter(this, void 0, void 0, function* () {
      const previousReady = this.ready;
      const context = new OfflineContext(2, this._decay + this._preDelay, this.context.sampleRate);
      const noiseL = new Noise({ context });
      const noiseR = new Noise({ context });
      const merge = new Merge({ context });
      noiseL.connect(merge, 0, 0);
      noiseR.connect(merge, 0, 1);
      const gainNode = new Gain({ context }).toDestination();
      merge.connect(gainNode);
      noiseL.start(0);
      noiseR.start(0);
      gainNode.gain.setValueAtTime(0, 0);
      gainNode.gain.setValueAtTime(1, this._preDelay);
      gainNode.gain.exponentialApproachValueAtTime(0, this._preDelay, this.decay);
      const renderPromise = context.render();
      this.ready = renderPromise.then(noOp);
      yield previousReady;
      this._convolver.buffer = (yield renderPromise).get();
      return this;
    });
  }
  dispose() {
    super.dispose();
    this._convolver.disconnect();
    return this;
  }
}
class Analyser extends ToneAudioNode {
  constructor() {
    super(optionsFromArguments(Analyser.getDefaults(), arguments, ["type", "size"]));
    this.name = "Analyser";
    this._analysers = [];
    this._buffers = [];
    const options = optionsFromArguments(Analyser.getDefaults(), arguments, ["type", "size"]);
    this.input = this.output = this._gain = new Gain({ context: this.context });
    this._split = new Split({
      context: this.context,
      channels: options.channels
    });
    this.input.connect(this._split);
    assertRange(options.channels, 1);
    for (let channel = 0; channel < options.channels; channel++) {
      this._analysers[channel] = this.context.createAnalyser();
      this._split.connect(this._analysers[channel], channel, 0);
    }
    this.size = options.size;
    this.type = options.type;
    this.smoothing = options.smoothing;
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      size: 1024,
      smoothing: 0.8,
      type: "fft",
      channels: 1
    });
  }
  /**
   * Run the analysis given the current settings. If {@link channels} = 1,
   * it will return a Float32Array. If {@link channels} > 1, it will
   * return an array of Float32Arrays where each index in the array
   * represents the analysis done on a channel.
   */
  getValue() {
    this._analysers.forEach((analyser, index) => {
      const buffer = this._buffers[index];
      if (this._type === "fft") {
        analyser.getFloatFrequencyData(buffer);
      } else if (this._type === "waveform") {
        analyser.getFloatTimeDomainData(buffer);
      }
    });
    if (this.channels === 1) {
      return this._buffers[0];
    } else {
      return this._buffers;
    }
  }
  /**
   * The size of analysis. This must be a power of two in the range 16 to 16384.
   */
  get size() {
    return this._analysers[0].frequencyBinCount;
  }
  set size(size) {
    this._analysers.forEach((analyser, index) => {
      analyser.fftSize = size * 2;
      this._buffers[index] = new Float32Array(size);
    });
  }
  /**
   * The number of channels the analyser does the analysis on. Channel
   * separation is done using {@link Split}
   */
  get channels() {
    return this._analysers.length;
  }
  /**
   * The analysis function returned by analyser.getValue(), either "fft" or "waveform".
   */
  get type() {
    return this._type;
  }
  set type(type) {
    assert(type === "waveform" || type === "fft", `Analyser: invalid type: ${type}`);
    this._type = type;
  }
  /**
   * 0 represents no time averaging with the last analysis frame.
   */
  get smoothing() {
    return this._analysers[0].smoothingTimeConstant;
  }
  set smoothing(val) {
    this._analysers.forEach((a) => a.smoothingTimeConstant = val);
  }
  /**
   * Clean up.
   */
  dispose() {
    super.dispose();
    this._analysers.forEach((a) => a.disconnect());
    this._split.dispose();
    this._gain.dispose();
    return this;
  }
}
class MeterBase extends ToneAudioNode {
  constructor() {
    super(optionsFromArguments(MeterBase.getDefaults(), arguments));
    this.name = "MeterBase";
    this.input = this.output = this._analyser = new Analyser({
      context: this.context,
      size: 256,
      type: "waveform"
    });
  }
  dispose() {
    super.dispose();
    this._analyser.dispose();
    return this;
  }
}
class Meter extends MeterBase {
  constructor() {
    super(optionsFromArguments(Meter.getDefaults(), arguments, ["smoothing"]));
    this.name = "Meter";
    const options = optionsFromArguments(Meter.getDefaults(), arguments, ["smoothing"]);
    this.input = this.output = this._analyser = new Analyser({
      context: this.context,
      size: 256,
      type: "waveform",
      channels: options.channelCount
    });
    this.smoothing = options.smoothing, this.normalRange = options.normalRange;
    this._rms = new Array(options.channelCount);
    this._rms.fill(0);
  }
  static getDefaults() {
    return Object.assign(MeterBase.getDefaults(), {
      smoothing: 0.8,
      normalRange: false,
      channelCount: 1
    });
  }
  /**
   * Use {@link getValue} instead. For the previous getValue behavior, use DCMeter.
   * @deprecated
   */
  getLevel() {
    warn("'getLevel' has been changed to 'getValue'");
    return this.getValue();
  }
  /**
   * Get the current value of the incoming signal.
   * Output is in decibels when {@link normalRange} is `false`.
   * If {@link channels} = 1, then the output is a single number
   * representing the value of the input signal. When {@link channels} > 1,
   * then each channel is returned as a value in a number array.
   */
  getValue() {
    const aValues = this._analyser.getValue();
    const channelValues = this.channels === 1 ? [aValues] : aValues;
    const vals = channelValues.map((values, index) => {
      const totalSquared = values.reduce((total, current) => total + current * current, 0);
      const rms = Math.sqrt(totalSquared / values.length);
      this._rms[index] = Math.max(rms, this._rms[index] * this.smoothing);
      return this.normalRange ? this._rms[index] : gainToDb(this._rms[index]);
    });
    if (this.channels === 1) {
      return vals[0];
    } else {
      return vals;
    }
  }
  /**
   * The number of channels of analysis.
   */
  get channels() {
    return this._analyser.channels;
  }
  dispose() {
    super.dispose();
    this._analyser.dispose();
    return this;
  }
}
class FFT extends MeterBase {
  constructor() {
    super(optionsFromArguments(FFT.getDefaults(), arguments, ["size"]));
    this.name = "FFT";
    const options = optionsFromArguments(FFT.getDefaults(), arguments, ["size"]);
    this.normalRange = options.normalRange;
    this._analyser.type = "fft";
    this.size = options.size;
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      normalRange: false,
      size: 1024,
      smoothing: 0.8
    });
  }
  /**
   * Gets the current frequency data from the connected audio source.
   * Returns the frequency data of length {@link size} as a Float32Array of decibel values.
   */
  getValue() {
    const values = this._analyser.getValue();
    return values.map((v) => this.normalRange ? dbToGain(v) : v);
  }
  /**
   * The size of analysis. This must be a power of two in the range 16 to 16384.
   * Determines the size of the array returned by {@link getValue} (i.e. the number of
   * frequency bins). Large FFT sizes may be costly to compute.
   */
  get size() {
    return this._analyser.size;
  }
  set size(size) {
    this._analyser.size = size;
  }
  /**
   * 0 represents no time averaging with the last analysis frame.
   */
  get smoothing() {
    return this._analyser.smoothing;
  }
  set smoothing(val) {
    this._analyser.smoothing = val;
  }
  /**
   * Returns the frequency value in hertz of each of the indices of the FFT's {@link getValue} response.
   * @example
   * const fft = new Tone.FFT(32);
   * console.log([0, 1, 2, 3, 4].map(index => fft.getFrequencyOfIndex(index)));
   */
  getFrequencyOfIndex(index) {
    assert(0 <= index && index < this.size, `index must be greater than or equal to 0 and less than ${this.size}`);
    return index * this.context.sampleRate / (this.size * 2);
  }
}
class Waveform extends MeterBase {
  constructor() {
    super(optionsFromArguments(Waveform.getDefaults(), arguments, ["size"]));
    this.name = "Waveform";
    const options = optionsFromArguments(Waveform.getDefaults(), arguments, ["size"]);
    this._analyser.type = "waveform";
    this.size = options.size;
  }
  static getDefaults() {
    return Object.assign(MeterBase.getDefaults(), {
      size: 1024
    });
  }
  /**
   * Return the waveform for the current time as a Float32Array where each value in the array
   * represents a sample in the waveform.
   */
  getValue() {
    return this._analyser.getValue();
  }
  /**
   * The size of analysis. This must be a power of two in the range 16 to 16384.
   * Determines the size of the array returned by {@link getValue}.
   */
  get size() {
    return this._analyser.size;
  }
  set size(size) {
    this._analyser.size = size;
  }
}
class Compressor extends ToneAudioNode {
  constructor() {
    super(optionsFromArguments(Compressor.getDefaults(), arguments, ["threshold", "ratio"]));
    this.name = "Compressor";
    this._compressor = this.context.createDynamicsCompressor();
    this.input = this._compressor;
    this.output = this._compressor;
    const options = optionsFromArguments(Compressor.getDefaults(), arguments, ["threshold", "ratio"]);
    this.threshold = new Param({
      minValue: this._compressor.threshold.minValue,
      maxValue: this._compressor.threshold.maxValue,
      context: this.context,
      convert: false,
      param: this._compressor.threshold,
      units: "decibels",
      value: options.threshold
    });
    this.attack = new Param({
      minValue: this._compressor.attack.minValue,
      maxValue: this._compressor.attack.maxValue,
      context: this.context,
      param: this._compressor.attack,
      units: "time",
      value: options.attack
    });
    this.release = new Param({
      minValue: this._compressor.release.minValue,
      maxValue: this._compressor.release.maxValue,
      context: this.context,
      param: this._compressor.release,
      units: "time",
      value: options.release
    });
    this.knee = new Param({
      minValue: this._compressor.knee.minValue,
      maxValue: this._compressor.knee.maxValue,
      context: this.context,
      convert: false,
      param: this._compressor.knee,
      units: "decibels",
      value: options.knee
    });
    this.ratio = new Param({
      minValue: this._compressor.ratio.minValue,
      maxValue: this._compressor.ratio.maxValue,
      context: this.context,
      convert: false,
      param: this._compressor.ratio,
      units: "positive",
      value: options.ratio
    });
    readOnly(this, ["knee", "release", "attack", "ratio", "threshold"]);
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      attack: 3e-3,
      knee: 30,
      ratio: 12,
      release: 0.25,
      threshold: -24
    });
  }
  /**
   * A read-only decibel value for metering purposes, representing the current amount of gain
   * reduction that the compressor is applying to the signal. If fed no signal the value will be 0 (no gain reduction).
   */
  get reduction() {
    return this._compressor.reduction;
  }
  dispose() {
    super.dispose();
    this._compressor.disconnect();
    this.attack.dispose();
    this.release.dispose();
    this.threshold.dispose();
    this.ratio.dispose();
    this.knee.dispose();
    return this;
  }
}
class Limiter extends ToneAudioNode {
  constructor() {
    super(Object.assign(optionsFromArguments(Limiter.getDefaults(), arguments, ["threshold"])));
    this.name = "Limiter";
    const options = optionsFromArguments(Limiter.getDefaults(), arguments, ["threshold"]);
    this._compressor = this.input = this.output = new Compressor({
      context: this.context,
      ratio: 20,
      attack: 3e-3,
      release: 0.01,
      threshold: options.threshold
    });
    this.threshold = this._compressor.threshold;
    readOnly(this, "threshold");
  }
  static getDefaults() {
    return Object.assign(ToneAudioNode.getDefaults(), {
      threshold: -12
    });
  }
  /**
   * A read-only decibel value for metering purposes, representing the current amount of gain
   * reduction that the compressor is applying to the signal.
   */
  get reduction() {
    return this._compressor.reduction;
  }
  dispose() {
    super.dispose();
    this._compressor.dispose();
    this.threshold.dispose();
    return this;
  }
}
const v1 = /* @__PURE__ */ new Vector3();
const v2 = /* @__PURE__ */ new Vector3();
const v3 = /* @__PURE__ */ new Vector3();
const v4 = /* @__PURE__ */ new Vector2();
function defaultCalculatePosition(el, camera, size) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
  objectPos.project(camera);
  const widthHalf = size.width / 2;
  const heightHalf = size.height / 2;
  return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf];
}
function isObjectBehindCamera(el, camera) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
  const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
  const deltaCamObj = objectPos.sub(cameraPos);
  const camDir = camera.getWorldDirection(v3);
  return deltaCamObj.angleTo(camDir) > Math.PI / 2;
}
function isObjectVisible(el, camera, raycaster, occlude) {
  const elPos = v1.setFromMatrixPosition(el.matrixWorld);
  const screenPos = elPos.clone();
  screenPos.project(camera);
  v4.set(screenPos.x, screenPos.y);
  raycaster.setFromCamera(v4, camera);
  const intersects = raycaster.intersectObjects(occlude, true);
  if (intersects.length) {
    const intersectionDistance = intersects[0].distance;
    const pointDistance = elPos.distanceTo(raycaster.ray.origin);
    return pointDistance < intersectionDistance;
  }
  return true;
}
function objectScale(el, camera) {
  if (camera instanceof OrthographicCamera) {
    return camera.zoom;
  } else if (camera instanceof PerspectiveCamera$1) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
    const vFOV = camera.fov * Math.PI / 180;
    const dist = objectPos.distanceTo(cameraPos);
    const scaleFOV = 2 * Math.tan(vFOV / 2) * dist;
    return 1 / scaleFOV;
  } else {
    return 1;
  }
}
function objectZIndex(el, camera, zIndexRange) {
  if (camera instanceof PerspectiveCamera$1 || camera instanceof OrthographicCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
    const dist = objectPos.distanceTo(cameraPos);
    const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near);
    const B = zIndexRange[1] - A * camera.far;
    return Math.round(A * dist + B);
  }
  return void 0;
}
const epsilon = (value) => Math.abs(value) < 1e-10 ? 0 : value;
function getCSSMatrix(matrix, multipliers, prepend = "") {
  let matrix3d = "matrix3d(";
  for (let i = 0; i !== 16; i++) {
    matrix3d += epsilon(multipliers[i] * matrix.elements[i]) + (i !== 15 ? "," : ")");
  }
  return prepend + matrix3d;
}
const getCameraCSSMatrix = /* @__PURE__ */ ((multipliers) => {
  return (matrix) => getCSSMatrix(matrix, multipliers);
})([1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1]);
const getObjectCSSMatrix = /* @__PURE__ */ ((scaleMultipliers) => {
  return (matrix, factor) => getCSSMatrix(matrix, scaleMultipliers(factor), "translate(-50%,-50%)");
})((f) => [1 / f, 1 / f, 1 / f, 1, -1 / f, -1 / f, -1 / f, -1, 1 / f, 1 / f, 1 / f, 1, 1, 1, 1, 1]);
function isRefObject(ref) {
  return ref && typeof ref === "object" && "current" in ref;
}
const Html = /* @__PURE__ */ reactExports.forwardRef(({
  children,
  eps = 1e-3,
  style,
  className,
  prepend,
  center,
  fullscreen,
  portal,
  distanceFactor,
  sprite = false,
  transform = false,
  occlude,
  onOcclude,
  castShadow,
  receiveShadow,
  material,
  geometry,
  zIndexRange = [16777271, 0],
  calculatePosition = defaultCalculatePosition,
  as = "div",
  wrapperClass,
  pointerEvents = "auto",
  ...props
}, ref) => {
  const {
    gl,
    camera,
    scene,
    size,
    raycaster,
    events,
    viewport
  } = useThree();
  const [el] = reactExports.useState(() => document.createElement(as));
  const root = reactExports.useRef();
  const group = reactExports.useRef(null);
  const oldZoom = reactExports.useRef(0);
  const oldPosition = reactExports.useRef([0, 0]);
  const transformOuterRef = reactExports.useRef(null);
  const transformInnerRef = reactExports.useRef(null);
  const target = (portal == null ? void 0 : portal.current) || events.connected || gl.domElement.parentNode;
  const occlusionMeshRef = reactExports.useRef(null);
  const isMeshSizeSet = reactExports.useRef(false);
  const isRayCastOcclusion = reactExports.useMemo(() => {
    return occlude && occlude !== "blending" || Array.isArray(occlude) && occlude.length && isRefObject(occlude[0]);
  }, [occlude]);
  reactExports.useLayoutEffect(() => {
    const el2 = gl.domElement;
    if (occlude && occlude === "blending") {
      el2.style.zIndex = `${Math.floor(zIndexRange[0] / 2)}`;
      el2.style.position = "absolute";
      el2.style.pointerEvents = "none";
    } else {
      el2.style.zIndex = null;
      el2.style.position = null;
      el2.style.pointerEvents = null;
    }
  }, [occlude]);
  reactExports.useLayoutEffect(() => {
    if (group.current) {
      const currentRoot = root.current = createRoot(el);
      scene.updateMatrixWorld();
      if (transform) {
        el.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`;
      } else {
        const vec = calculatePosition(group.current, camera, size);
        el.style.cssText = `position:absolute;top:0;left:0;transform:translate3d(${vec[0]}px,${vec[1]}px,0);transform-origin:0 0;`;
      }
      if (target) {
        if (prepend) target.prepend(el);
        else target.appendChild(el);
      }
      return () => {
        if (target) target.removeChild(el);
        currentRoot.unmount();
      };
    }
  }, [target, transform]);
  reactExports.useLayoutEffect(() => {
    if (wrapperClass) el.className = wrapperClass;
  }, [wrapperClass]);
  const styles = reactExports.useMemo(() => {
    if (transform) {
      return {
        position: "absolute",
        top: 0,
        left: 0,
        width: size.width,
        height: size.height,
        transformStyle: "preserve-3d",
        pointerEvents: "none"
      };
    } else {
      return {
        position: "absolute",
        transform: center ? "translate3d(-50%,-50%,0)" : "none",
        ...fullscreen && {
          top: -size.height / 2,
          left: -size.width / 2,
          width: size.width,
          height: size.height
        },
        ...style
      };
    }
  }, [style, center, fullscreen, size, transform]);
  const transformInnerStyles = reactExports.useMemo(() => ({
    position: "absolute",
    pointerEvents
  }), [pointerEvents]);
  reactExports.useLayoutEffect(() => {
    isMeshSizeSet.current = false;
    if (transform) {
      var _root$current;
      (_root$current = root.current) == null || _root$current.render(/* @__PURE__ */ reactExports.createElement("div", {
        ref: transformOuterRef,
        style: styles
      }, /* @__PURE__ */ reactExports.createElement("div", {
        ref: transformInnerRef,
        style: transformInnerStyles
      }, /* @__PURE__ */ reactExports.createElement("div", {
        ref,
        className,
        style,
        children
      }))));
    } else {
      var _root$current2;
      (_root$current2 = root.current) == null || _root$current2.render(/* @__PURE__ */ reactExports.createElement("div", {
        ref,
        style: styles,
        className,
        children
      }));
    }
  });
  const visible = reactExports.useRef(true);
  useFrame((gl2) => {
    if (group.current) {
      camera.updateMatrixWorld();
      group.current.updateWorldMatrix(true, false);
      const vec = transform ? oldPosition.current : calculatePosition(group.current, camera, size);
      if (transform || Math.abs(oldZoom.current - camera.zoom) > eps || Math.abs(oldPosition.current[0] - vec[0]) > eps || Math.abs(oldPosition.current[1] - vec[1]) > eps) {
        const isBehindCamera = isObjectBehindCamera(group.current, camera);
        let raytraceTarget = false;
        if (isRayCastOcclusion) {
          if (Array.isArray(occlude)) {
            raytraceTarget = occlude.map((item) => item.current);
          } else if (occlude !== "blending") {
            raytraceTarget = [scene];
          }
        }
        const previouslyVisible = visible.current;
        if (raytraceTarget) {
          const isvisible = isObjectVisible(group.current, camera, raycaster, raytraceTarget);
          visible.current = isvisible && !isBehindCamera;
        } else {
          visible.current = !isBehindCamera;
        }
        if (previouslyVisible !== visible.current) {
          if (onOcclude) onOcclude(!visible.current);
          else el.style.display = visible.current ? "block" : "none";
        }
        const halfRange = Math.floor(zIndexRange[0] / 2);
        const zRange = occlude ? isRayCastOcclusion ? [zIndexRange[0], halfRange] : [halfRange - 1, 0] : zIndexRange;
        el.style.zIndex = `${objectZIndex(group.current, camera, zRange)}`;
        if (transform) {
          const [widthHalf, heightHalf] = [size.width / 2, size.height / 2];
          const fov = camera.projectionMatrix.elements[5] * heightHalf;
          const {
            isOrthographicCamera,
            top,
            left,
            bottom,
            right
          } = camera;
          const cameraMatrix = getCameraCSSMatrix(camera.matrixWorldInverse);
          const cameraTransform = isOrthographicCamera ? `scale(${fov})translate(${epsilon(-(right + left) / 2)}px,${epsilon((top + bottom) / 2)}px)` : `translateZ(${fov}px)`;
          let matrix = group.current.matrixWorld;
          if (sprite) {
            matrix = camera.matrixWorldInverse.clone().transpose().copyPosition(matrix).scale(group.current.scale);
            matrix.elements[3] = matrix.elements[7] = matrix.elements[11] = 0;
            matrix.elements[15] = 1;
          }
          el.style.width = size.width + "px";
          el.style.height = size.height + "px";
          el.style.perspective = isOrthographicCamera ? "" : `${fov}px`;
          if (transformOuterRef.current && transformInnerRef.current) {
            transformOuterRef.current.style.transform = `${cameraTransform}${cameraMatrix}translate(${widthHalf}px,${heightHalf}px)`;
            transformInnerRef.current.style.transform = getObjectCSSMatrix(matrix, 1 / ((distanceFactor || 10) / 400));
          }
        } else {
          const scale = distanceFactor === void 0 ? 1 : objectScale(group.current, camera) * distanceFactor;
          el.style.transform = `translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale})`;
        }
        oldPosition.current = vec;
        oldZoom.current = camera.zoom;
      }
    }
    if (!isRayCastOcclusion && occlusionMeshRef.current && !isMeshSizeSet.current) {
      if (transform) {
        if (transformOuterRef.current) {
          const el2 = transformOuterRef.current.children[0];
          if (el2 != null && el2.clientWidth && el2 != null && el2.clientHeight) {
            const {
              isOrthographicCamera
            } = camera;
            if (isOrthographicCamera || geometry) {
              if (props.scale) {
                if (!Array.isArray(props.scale)) {
                  occlusionMeshRef.current.scale.setScalar(1 / props.scale);
                } else if (props.scale instanceof Vector3) {
                  occlusionMeshRef.current.scale.copy(props.scale.clone().divideScalar(1));
                } else {
                  occlusionMeshRef.current.scale.set(1 / props.scale[0], 1 / props.scale[1], 1 / props.scale[2]);
                }
              }
            } else {
              const ratio = (distanceFactor || 10) / 400;
              const w = el2.clientWidth * ratio;
              const h = el2.clientHeight * ratio;
              occlusionMeshRef.current.scale.set(w, h, 1);
            }
            isMeshSizeSet.current = true;
          }
        }
      } else {
        const ele = el.children[0];
        if (ele != null && ele.clientWidth && ele != null && ele.clientHeight) {
          const ratio = 1 / viewport.factor;
          const w = ele.clientWidth * ratio;
          const h = ele.clientHeight * ratio;
          occlusionMeshRef.current.scale.set(w, h, 1);
          isMeshSizeSet.current = true;
        }
        occlusionMeshRef.current.lookAt(gl2.camera.position);
      }
    }
  });
  const shaders = reactExports.useMemo(() => ({
    vertexShader: !transform ? (
      /* glsl */
      `
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `
    ) : void 0,
    fragmentShader: (
      /* glsl */
      `
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `
    )
  }), [transform]);
  return /* @__PURE__ */ reactExports.createElement("group", _extends({}, props, {
    ref: group
  }), occlude && !isRayCastOcclusion && /* @__PURE__ */ reactExports.createElement("mesh", {
    castShadow,
    receiveShadow,
    ref: occlusionMeshRef
  }, geometry || /* @__PURE__ */ reactExports.createElement("planeGeometry", null), material || /* @__PURE__ */ reactExports.createElement("shaderMaterial", {
    side: DoubleSide,
    vertexShader: shaders.vertexShader,
    fragmentShader: shaders.fragmentShader
  })));
});
function shaderMaterial(uniforms, vertexShader2, fragmentShader2, onInit) {
  const material = class material extends ShaderMaterial {
    constructor(parameters = {}) {
      const entries = Object.entries(uniforms);
      super({
        uniforms: entries.reduce((acc, [name, value]) => {
          const uniform = UniformsUtils.clone({
            [name]: {
              value
            }
          });
          return {
            ...acc,
            ...uniform
          };
        }, {}),
        vertexShader: vertexShader2,
        fragmentShader: fragmentShader2
      });
      this.key = "";
      entries.forEach(([name]) => Object.defineProperty(this, name, {
        get: () => this.uniforms[name].value,
        set: (v) => this.uniforms[name].value = v
      }));
      Object.assign(this, parameters);
    }
  };
  material.key = MathUtils.generateUUID();
  return material;
}
function useFBO(width, height, settings) {
  const size = useThree((state) => state.size);
  const viewport = useThree((state) => state.viewport);
  const _width = typeof width === "number" ? width : size.width * viewport.dpr;
  const _height = typeof height === "number" ? height : size.height * viewport.dpr;
  const _settings = (typeof width === "number" ? settings : width) || {};
  const {
    samples = 0,
    depth,
    ...targetSettings
  } = _settings;
  const target = reactExports.useMemo(() => {
    const target2 = new WebGLRenderTarget(_width, _height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      type: HalfFloatType,
      ...targetSettings
    });
    if (depth) {
      target2.depthTexture = new DepthTexture(_width, _height, FloatType);
    }
    target2.samples = samples;
    return target2;
  }, []);
  reactExports.useLayoutEffect(() => {
    target.setSize(_width, _height);
    if (samples) target.samples = samples;
  }, [samples, target, _width, _height]);
  reactExports.useEffect(() => {
    return () => target.dispose();
  }, []);
  return target;
}
const isFunction = (node) => typeof node === "function";
const PerspectiveCamera = /* @__PURE__ */ reactExports.forwardRef(({
  envMap,
  resolution = 256,
  frames = Infinity,
  makeDefault,
  children,
  ...props
}, ref) => {
  const set = useThree(({
    set: set2
  }) => set2);
  const camera = useThree(({
    camera: camera2
  }) => camera2);
  const size = useThree(({
    size: size2
  }) => size2);
  const cameraRef = reactExports.useRef(null);
  reactExports.useImperativeHandle(ref, () => cameraRef.current, []);
  const groupRef = reactExports.useRef(null);
  const fbo = useFBO(resolution);
  reactExports.useLayoutEffect(() => {
    if (!props.manual) {
      cameraRef.current.aspect = size.width / size.height;
    }
  }, [size, props]);
  reactExports.useLayoutEffect(() => {
    cameraRef.current.updateProjectionMatrix();
  });
  let count = 0;
  let oldEnvMap = null;
  const functional = isFunction(children);
  useFrame((state) => {
    if (functional && (frames === Infinity || count < frames)) {
      groupRef.current.visible = false;
      state.gl.setRenderTarget(fbo);
      oldEnvMap = state.scene.background;
      if (envMap) state.scene.background = envMap;
      state.gl.render(state.scene, cameraRef.current);
      state.scene.background = oldEnvMap;
      state.gl.setRenderTarget(null);
      groupRef.current.visible = true;
      count++;
    }
  });
  reactExports.useLayoutEffect(() => {
    if (makeDefault) {
      const oldCam = camera;
      set(() => ({
        camera: cameraRef.current
      }));
      return () => set(() => ({
        camera: oldCam
      }));
    }
  }, [cameraRef, makeDefault, set]);
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement("perspectiveCamera", _extends({
    ref: cameraRef
  }, props), !functional && children), /* @__PURE__ */ reactExports.createElement("group", {
    ref: groupRef
  }, functional && children(fbo.texture)));
});
const OrbitControls2 = /* @__PURE__ */ reactExports.forwardRef(({
  makeDefault,
  camera,
  regress,
  domElement,
  enableDamping = true,
  keyEvents = false,
  onChange,
  onStart,
  onEnd,
  ...restProps
}, ref) => {
  const invalidate = useThree((state) => state.invalidate);
  const defaultCamera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const events = useThree((state) => state.events);
  const setEvents = useThree((state) => state.setEvents);
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  const performance = useThree((state) => state.performance);
  const explCamera = camera || defaultCamera;
  const explDomElement = domElement || events.connected || gl.domElement;
  const controls = reactExports.useMemo(() => new OrbitControls$1(explCamera), [explCamera]);
  useFrame(() => {
    if (controls.enabled) controls.update();
  }, -1);
  reactExports.useEffect(() => {
    if (keyEvents) {
      controls.connect(keyEvents === true ? explDomElement : keyEvents);
    }
    controls.connect(explDomElement);
    return () => void controls.dispose();
  }, [keyEvents, explDomElement, regress, controls, invalidate]);
  reactExports.useEffect(() => {
    const callback = (e) => {
      invalidate();
      if (regress) performance.regress();
      if (onChange) onChange(e);
    };
    const onStartCb = (e) => {
      if (onStart) onStart(e);
    };
    const onEndCb = (e) => {
      if (onEnd) onEnd(e);
    };
    controls.addEventListener("change", callback);
    controls.addEventListener("start", onStartCb);
    controls.addEventListener("end", onEndCb);
    return () => {
      controls.removeEventListener("start", onStartCb);
      controls.removeEventListener("end", onEndCb);
      controls.removeEventListener("change", callback);
    };
  }, [onChange, onStart, onEnd, controls, invalidate, setEvents]);
  reactExports.useEffect(() => {
    if (makeDefault) {
      const old = get().controls;
      set({
        controls
      });
      return () => set({
        controls: old
      });
    }
  }, [makeDefault, controls]);
  return /* @__PURE__ */ reactExports.createElement("primitive", _extends({
    ref,
    object: controls,
    enableDamping
  }, restProps));
});
const LinearEncoding = 3e3;
const sRGBEncoding = 3001;
function create(type, effect) {
  const El = type + "Geometry";
  return /* @__PURE__ */ reactExports.forwardRef(({
    args,
    children,
    ...props
  }, fref) => {
    const ref = reactExports.useRef(null);
    reactExports.useImperativeHandle(fref, () => ref.current);
    reactExports.useLayoutEffect(() => void (effect == null ? void 0 : effect(ref.current)));
    return /* @__PURE__ */ reactExports.createElement("mesh", _extends({
      ref
    }, props), /* @__PURE__ */ reactExports.createElement(El, {
      attach: "geometry",
      args
    }), children);
  });
}
const Box = /* @__PURE__ */ create("box");
const Cylinder = /* @__PURE__ */ create("cylinder");
const Sphere = /* @__PURE__ */ create("sphere");
const Plane = /* @__PURE__ */ create("plane");
const getBufferForType = (type, width, height) => {
  let out;
  switch (type) {
    case UnsignedByteType:
      out = new Uint8ClampedArray(width * height * 4);
      break;
    case HalfFloatType:
      out = new Uint16Array(width * height * 4);
      break;
    case UnsignedIntType:
      out = new Uint32Array(width * height * 4);
      break;
    case ByteType:
      out = new Int8Array(width * height * 4);
      break;
    case ShortType:
      out = new Int16Array(width * height * 4);
      break;
    case IntType:
      out = new Int32Array(width * height * 4);
      break;
    case FloatType:
      out = new Float32Array(width * height * 4);
      break;
    default:
      throw new Error("Unsupported data type");
  }
  return out;
};
let _canReadPixelsResult;
const canReadPixels = (type, renderer, camera, renderTargetOptions) => {
  if (_canReadPixelsResult !== void 0)
    return _canReadPixelsResult;
  const testRT = new WebGLRenderTarget(1, 1, renderTargetOptions);
  renderer.setRenderTarget(testRT);
  const mesh = new Mesh(new PlaneGeometry(), new MeshBasicMaterial({ color: 16777215 }));
  renderer.render(mesh, camera);
  renderer.setRenderTarget(null);
  const out = getBufferForType(type, testRT.width, testRT.height);
  renderer.readRenderTargetPixels(testRT, 0, 0, testRT.width, testRT.height, out);
  testRT.dispose();
  mesh.geometry.dispose();
  mesh.material.dispose();
  _canReadPixelsResult = out[0] !== 0;
  return _canReadPixelsResult;
};
class QuadRenderer {
  /**
   * Constructs a new QuadRenderer
   *
   * @param options Parameters for this QuadRenderer
   */
  constructor(options) {
    __publicField(this, "_renderer");
    __publicField(this, "_rendererIsDisposable", false);
    __publicField(this, "_material");
    __publicField(this, "_scene");
    __publicField(this, "_camera");
    __publicField(this, "_quad");
    __publicField(this, "_renderTarget");
    __publicField(this, "_width");
    __publicField(this, "_height");
    __publicField(this, "_type");
    __publicField(this, "_colorSpace");
    __publicField(this, "_supportsReadPixels", true);
    /**
     * Renders the input texture using the specified material
     */
    __publicField(this, "render", () => {
      this._renderer.setRenderTarget(this._renderTarget);
      try {
        this._renderer.render(this._scene, this._camera);
      } catch (e) {
        this._renderer.setRenderTarget(null);
        throw e;
      }
      this._renderer.setRenderTarget(null);
    });
    var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    this._width = options.width;
    this._height = options.height;
    this._type = options.type;
    this._colorSpace = options.colorSpace;
    const rtOptions = {
      // fixed options
      format: RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
      // user options
      type: this._type,
      // set in class property
      colorSpace: this._colorSpace,
      // set in class property
      anisotropy: ((_a2 = options.renderTargetOptions) == null ? void 0 : _a2.anisotropy) !== void 0 ? (_b2 = options.renderTargetOptions) == null ? void 0 : _b2.anisotropy : 1,
      generateMipmaps: ((_c = options.renderTargetOptions) == null ? void 0 : _c.generateMipmaps) !== void 0 ? (_d = options.renderTargetOptions) == null ? void 0 : _d.generateMipmaps : false,
      magFilter: ((_e = options.renderTargetOptions) == null ? void 0 : _e.magFilter) !== void 0 ? (_f = options.renderTargetOptions) == null ? void 0 : _f.magFilter : LinearFilter,
      minFilter: ((_g = options.renderTargetOptions) == null ? void 0 : _g.minFilter) !== void 0 ? (_h = options.renderTargetOptions) == null ? void 0 : _h.minFilter : LinearFilter,
      samples: ((_i = options.renderTargetOptions) == null ? void 0 : _i.samples) !== void 0 ? (_j = options.renderTargetOptions) == null ? void 0 : _j.samples : void 0,
      wrapS: ((_k = options.renderTargetOptions) == null ? void 0 : _k.wrapS) !== void 0 ? (_l = options.renderTargetOptions) == null ? void 0 : _l.wrapS : ClampToEdgeWrapping,
      wrapT: ((_m = options.renderTargetOptions) == null ? void 0 : _m.wrapT) !== void 0 ? (_n = options.renderTargetOptions) == null ? void 0 : _n.wrapT : ClampToEdgeWrapping
    };
    this._material = options.material;
    if (options.renderer) {
      this._renderer = options.renderer;
    } else {
      this._renderer = QuadRenderer.instantiateRenderer();
      this._rendererIsDisposable = true;
    }
    this._scene = new Scene();
    this._camera = new OrthographicCamera();
    this._camera.position.set(0, 0, 10);
    this._camera.left = -0.5;
    this._camera.right = 0.5;
    this._camera.top = 0.5;
    this._camera.bottom = -0.5;
    this._camera.updateProjectionMatrix();
    if (!canReadPixels(this._type, this._renderer, this._camera, rtOptions)) {
      let alternativeType;
      switch (this._type) {
        case HalfFloatType:
          alternativeType = this._renderer.extensions.has("EXT_color_buffer_float") ? FloatType : void 0;
          break;
      }
      if (alternativeType !== void 0) {
        console.warn(`This browser does not support reading pixels from ${this._type} RenderTargets, switching to ${FloatType}`);
        this._type = alternativeType;
      } else {
        this._supportsReadPixels = false;
        console.warn("This browser dos not support toArray or toDataTexture, calls to those methods will result in an error thrown");
      }
    }
    this._quad = new Mesh(new PlaneGeometry(), this._material);
    this._quad.geometry.computeBoundingBox();
    this._scene.add(this._quad);
    this._renderTarget = new WebGLRenderTarget(this.width, this.height, rtOptions);
    this._renderTarget.texture.mapping = ((_o = options.renderTargetOptions) == null ? void 0 : _o.mapping) !== void 0 ? (_p = options.renderTargetOptions) == null ? void 0 : _p.mapping : UVMapping;
  }
  /**
   * Instantiates a temporary renderer
   *
   * @returns
   */
  static instantiateRenderer() {
    const renderer = new WebGLRenderer();
    renderer.setSize(128, 128);
    return renderer;
  }
  /**
   * Obtains a Buffer containing the rendered texture.
   *
   * @throws Error if the browser cannot read pixels from this RenderTarget type.
   * @returns a TypedArray containing RGBA values from this renderer
   */
  toArray() {
    if (!this._supportsReadPixels)
      throw new Error("Can't read pixels in this browser");
    const out = getBufferForType(this._type, this._width, this._height);
    this._renderer.readRenderTargetPixels(this._renderTarget, 0, 0, this._width, this._height, out);
    return out;
  }
  /**
   * Performs a readPixel operation in the renderTarget
   * and returns a DataTexture containing the read data
   *
   * @param options options
   * @returns
   */
  toDataTexture(options) {
    const returnValue = new DataTexture(
      // fixed values
      this.toArray(),
      this.width,
      this.height,
      RGBAFormat,
      this._type,
      // user values
      (options == null ? void 0 : options.mapping) || UVMapping,
      (options == null ? void 0 : options.wrapS) || ClampToEdgeWrapping,
      (options == null ? void 0 : options.wrapT) || ClampToEdgeWrapping,
      (options == null ? void 0 : options.magFilter) || LinearFilter,
      (options == null ? void 0 : options.minFilter) || LinearFilter,
      (options == null ? void 0 : options.anisotropy) || 1,
      // fixed value
      LinearSRGBColorSpace
    );
    returnValue.generateMipmaps = (options == null ? void 0 : options.generateMipmaps) !== void 0 ? options == null ? void 0 : options.generateMipmaps : false;
    return returnValue;
  }
  /**
   * If using a disposable renderer, it will dispose it.
   */
  disposeOnDemandRenderer() {
    this._renderer.setRenderTarget(null);
    if (this._rendererIsDisposable) {
      this._renderer.dispose();
      this._renderer.forceContextLoss();
    }
  }
  /**
   * Will dispose of **all** assets used by this renderer.
   *
   *
   * @param disposeRenderTarget will dispose of the renderTarget which will not be usable later
   * set this to true if you passed the `renderTarget.texture` to a `PMREMGenerator`
   * or are otherwise done with it.
   *
   * @example
   * ```js
   * const loader = new HDRJPGLoader(renderer)
   * const result = await loader.loadAsync('gainmap.jpeg')
   * const mesh = new Mesh(geometry, new MeshBasicMaterial({ map: result.renderTarget.texture }) )
   * // DO NOT dispose the renderTarget here,
   * // it is used directly in the material
   * result.dispose()
   * ```
   *
   * @example
   * ```js
   * const loader = new HDRJPGLoader(renderer)
   * const pmremGenerator = new PMREMGenerator( renderer );
   * const result = await loader.loadAsync('gainmap.jpeg')
   * const envMap = pmremGenerator.fromEquirectangular(result.renderTarget.texture)
   * const mesh = new Mesh(geometry, new MeshStandardMaterial({ envMap }) )
   * // renderTarget can be disposed here
   * // because it was used to generate a PMREM texture
   * result.dispose(true)
   * ```
   */
  dispose(disposeRenderTarget) {
    this.disposeOnDemandRenderer();
    if (disposeRenderTarget) {
      this.renderTarget.dispose();
    }
    if (this.material instanceof ShaderMaterial) {
      Object.values(this.material.uniforms).forEach((v) => {
        if (v.value instanceof Texture)
          v.value.dispose();
      });
    }
    Object.values(this.material).forEach((value) => {
      if (value instanceof Texture)
        value.dispose();
    });
    this.material.dispose();
    this._quad.geometry.dispose();
  }
  /**
   * Width of the texture
   */
  get width() {
    return this._width;
  }
  set width(value) {
    this._width = value;
    this._renderTarget.setSize(this._width, this._height);
  }
  /**
   * Height of the texture
   */
  get height() {
    return this._height;
  }
  set height(value) {
    this._height = value;
    this._renderTarget.setSize(this._width, this._height);
  }
  /**
   * The renderer used
   */
  get renderer() {
    return this._renderer;
  }
  /**
   * The `WebGLRenderTarget` used.
   */
  get renderTarget() {
    return this._renderTarget;
  }
  set renderTarget(value) {
    this._renderTarget = value;
    this._width = value.width;
    this._height = value.height;
  }
  /**
   * The `Material` used.
   */
  get material() {
    return this._material;
  }
  /**
   *
   */
  get type() {
    return this._type;
  }
  get colorSpace() {
    return this._colorSpace;
  }
}
class GainMapNotFoundError extends Error {
}
class XMPMetadataNotFoundError extends Error {
}
const getXMLValue = (xml, tag, defaultValue) => {
  const attributeMatch = new RegExp(`${tag}="([^"]*)"`, "i").exec(xml);
  if (attributeMatch)
    return attributeMatch[1];
  const tagMatch = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml);
  if (tagMatch) {
    const liValues = tagMatch[1].match(/<rdf:li>([^<]*)<\/rdf:li>/g);
    if (liValues && liValues.length === 3) {
      return liValues.map((v) => v.replace(/<\/?rdf:li>/g, ""));
    }
    return tagMatch[1].trim();
  }
  if (defaultValue !== void 0)
    return defaultValue;
  throw new Error(`Can't find ${tag} in gainmap metadata`);
};
const extractXMP = (input) => {
  let str;
  if (typeof TextDecoder !== "undefined")
    str = new TextDecoder().decode(input);
  else
    str = input.toString();
  let start2 = str.indexOf("<x:xmpmeta");
  while (start2 !== -1) {
    const end = str.indexOf("x:xmpmeta>", start2);
    const xmpBlock = str.slice(start2, end + 10);
    try {
      const gainMapMin = getXMLValue(xmpBlock, "hdrgm:GainMapMin", "0");
      const gainMapMax = getXMLValue(xmpBlock, "hdrgm:GainMapMax");
      const gamma = getXMLValue(xmpBlock, "hdrgm:Gamma", "1");
      const offsetSDR = getXMLValue(xmpBlock, "hdrgm:OffsetSDR", "0.015625");
      const offsetHDR = getXMLValue(xmpBlock, "hdrgm:OffsetHDR", "0.015625");
      const hdrCapacityMinMatch = /hdrgm:HDRCapacityMin="([^"]*)"/.exec(xmpBlock);
      const hdrCapacityMin = hdrCapacityMinMatch ? hdrCapacityMinMatch[1] : "0";
      const hdrCapacityMaxMatch = /hdrgm:HDRCapacityMax="([^"]*)"/.exec(xmpBlock);
      if (!hdrCapacityMaxMatch)
        throw new Error("Incomplete gainmap metadata");
      const hdrCapacityMax = hdrCapacityMaxMatch[1];
      return {
        gainMapMin: Array.isArray(gainMapMin) ? gainMapMin.map((v) => parseFloat(v)) : [parseFloat(gainMapMin), parseFloat(gainMapMin), parseFloat(gainMapMin)],
        gainMapMax: Array.isArray(gainMapMax) ? gainMapMax.map((v) => parseFloat(v)) : [parseFloat(gainMapMax), parseFloat(gainMapMax), parseFloat(gainMapMax)],
        gamma: Array.isArray(gamma) ? gamma.map((v) => parseFloat(v)) : [parseFloat(gamma), parseFloat(gamma), parseFloat(gamma)],
        offsetSdr: Array.isArray(offsetSDR) ? offsetSDR.map((v) => parseFloat(v)) : [parseFloat(offsetSDR), parseFloat(offsetSDR), parseFloat(offsetSDR)],
        offsetHdr: Array.isArray(offsetHDR) ? offsetHDR.map((v) => parseFloat(v)) : [parseFloat(offsetHDR), parseFloat(offsetHDR), parseFloat(offsetHDR)],
        hdrCapacityMin: parseFloat(hdrCapacityMin),
        hdrCapacityMax: parseFloat(hdrCapacityMax)
      };
    } catch (e) {
    }
    start2 = str.indexOf("<x:xmpmeta", end);
  }
};
class MPFExtractor {
  constructor(options) {
    __publicField(this, "options");
    this.options = {
      debug: options && options.debug !== void 0 ? options.debug : false,
      extractFII: options && options.extractFII !== void 0 ? options.extractFII : true,
      extractNonFII: options && options.extractNonFII !== void 0 ? options.extractNonFII : true
    };
  }
  extract(imageArrayBuffer) {
    return new Promise((resolve, reject) => {
      const debug = this.options.debug;
      const dataView = new DataView(imageArrayBuffer.buffer);
      if (dataView.getUint16(0) !== 65496) {
        reject(new Error("Not a valid jpeg"));
        return;
      }
      const length = dataView.byteLength;
      let offset = 2;
      let loops = 0;
      let marker;
      while (offset < length) {
        if (++loops > 250) {
          reject(new Error(`Found no marker after ${loops} loops 😵`));
          return;
        }
        if (dataView.getUint8(offset) !== 255) {
          reject(new Error(`Not a valid marker at offset 0x${offset.toString(16)}, found: 0x${dataView.getUint8(offset).toString(16)}`));
          return;
        }
        marker = dataView.getUint8(offset + 1);
        if (debug)
          console.log(`Marker: ${marker.toString(16)}`);
        if (marker === 226) {
          if (debug)
            console.log("Found APP2 marker (0xffe2)");
          const formatPt = offset + 4;
          if (dataView.getUint32(formatPt) === 1297106432) {
            const tiffOffset = formatPt + 4;
            let bigEnd;
            if (dataView.getUint16(tiffOffset) === 18761) {
              bigEnd = false;
            } else if (dataView.getUint16(tiffOffset) === 19789) {
              bigEnd = true;
            } else {
              reject(new Error("No valid endianness marker found in TIFF header"));
              return;
            }
            if (dataView.getUint16(tiffOffset + 2, !bigEnd) !== 42) {
              reject(new Error("Not valid TIFF data! (no 0x002A marker)"));
              return;
            }
            const firstIFDOffset = dataView.getUint32(tiffOffset + 4, !bigEnd);
            if (firstIFDOffset < 8) {
              reject(new Error("Not valid TIFF data! (First offset less than 8)"));
              return;
            }
            const dirStart = tiffOffset + firstIFDOffset;
            const count = dataView.getUint16(dirStart, !bigEnd);
            const entriesStart = dirStart + 2;
            let numberOfImages = 0;
            for (let i = entriesStart; i < entriesStart + 12 * count; i += 12) {
              if (dataView.getUint16(i, !bigEnd) === 45057) {
                numberOfImages = dataView.getUint32(i + 8, !bigEnd);
              }
            }
            const nextIFDOffsetLen = 4;
            const MPImageListValPt = dirStart + 2 + count * 12 + nextIFDOffsetLen;
            const images = [];
            for (let i = MPImageListValPt; i < MPImageListValPt + numberOfImages * 16; i += 16) {
              const image = {
                MPType: dataView.getUint32(i, !bigEnd),
                size: dataView.getUint32(i + 4, !bigEnd),
                // This offset is specified relative to the address of the MP Endian
                // field in the MP Header, unless the image is a First Individual Image,
                // in which case the value of the offset shall be NULL (0x00000000).
                dataOffset: dataView.getUint32(i + 8, !bigEnd),
                dependantImages: dataView.getUint32(i + 12, !bigEnd),
                start: -1,
                end: -1,
                isFII: false
              };
              if (!image.dataOffset) {
                image.start = 0;
                image.isFII = true;
              } else {
                image.start = tiffOffset + image.dataOffset;
                image.isFII = false;
              }
              image.end = image.start + image.size;
              images.push(image);
            }
            if (this.options.extractNonFII && images.length) {
              const bufferBlob = new Blob([dataView]);
              const imgs = [];
              for (const image of images) {
                if (image.isFII && !this.options.extractFII) {
                  continue;
                }
                const imageBlob = bufferBlob.slice(image.start, image.end + 1, "image/jpeg");
                imgs.push(imageBlob);
              }
              resolve(imgs);
            }
          }
        }
        offset += 2 + dataView.getUint16(offset + 2);
      }
    });
  }
}
const extractGainmapFromJPEG = async (jpegFile) => {
  const metadata = extractXMP(jpegFile);
  if (!metadata)
    throw new XMPMetadataNotFoundError("Gain map XMP metadata not found");
  const mpfExtractor = new MPFExtractor({ extractFII: true, extractNonFII: true });
  const images = await mpfExtractor.extract(jpegFile);
  if (images.length !== 2)
    throw new GainMapNotFoundError("Gain map recovery image not found");
  return {
    sdr: new Uint8Array(await images[0].arrayBuffer()),
    gainMap: new Uint8Array(await images[1].arrayBuffer()),
    metadata
  };
};
const getHTMLImageFromBlob = (blob) => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      reject(e);
    };
    img.src = URL.createObjectURL(blob);
  });
};
class LoaderBaseShared extends Loader {
  constructor(config, manager) {
    super(manager);
    __publicField(this, "_renderer");
    __publicField(this, "_renderTargetOptions");
    __publicField(this, "_internalLoadingManager");
    __publicField(this, "_config");
    this._config = config;
    if (config.renderer)
      this._renderer = config.renderer;
    this._internalLoadingManager = new LoadingManager();
  }
  setRenderer(renderer) {
    this._renderer = renderer;
    return this;
  }
  setRenderTargetOptions(options) {
    this._renderTargetOptions = options;
    return this;
  }
  prepareQuadRenderer() {
    if (!this._renderer) {
      console.warn("WARNING: A Renderer was not passed to this Loader constructor or in setRenderer, the result of this Loader will need to be converted to a Data Texture with toDataTexture() before you can use it in your renderer.");
    }
    const material = this._config.createMaterial({
      gainMapMax: [1, 1, 1],
      gainMapMin: [0, 0, 0],
      gamma: [1, 1, 1],
      offsetHdr: [1, 1, 1],
      offsetSdr: [1, 1, 1],
      hdrCapacityMax: 1,
      hdrCapacityMin: 0,
      maxDisplayBoost: 1,
      gainMap: new Texture(),
      sdr: new Texture()
    });
    return this._config.createQuadRenderer({
      width: 16,
      height: 16,
      type: HalfFloatType,
      colorSpace: LinearSRGBColorSpace,
      material,
      renderer: this._renderer,
      renderTargetOptions: this._renderTargetOptions
    });
  }
  async processImages(sdrBuffer, gainMapBuffer, imageOrientation) {
    const gainMapBlob = gainMapBuffer ? new Blob([gainMapBuffer], { type: "image/jpeg" }) : void 0;
    const sdrBlob = new Blob([sdrBuffer], { type: "image/jpeg" });
    let sdrImage;
    let gainMapImage;
    let needsFlip = false;
    if (typeof createImageBitmap === "undefined") {
      const res = await Promise.all([
        gainMapBlob ? getHTMLImageFromBlob(gainMapBlob) : Promise.resolve(void 0),
        getHTMLImageFromBlob(sdrBlob)
      ]);
      gainMapImage = res[0];
      sdrImage = res[1];
      needsFlip = imageOrientation === "flipY";
    } else {
      const res = await Promise.all([
        gainMapBlob ? createImageBitmap(gainMapBlob, { imageOrientation: imageOrientation || "flipY" }) : Promise.resolve(void 0),
        createImageBitmap(sdrBlob, { imageOrientation: imageOrientation || "flipY" })
      ]);
      gainMapImage = res[0];
      sdrImage = res[1];
    }
    return { sdrImage, gainMapImage, needsFlip };
  }
  createTextures(sdrImage, gainMapImage, needsFlip) {
    const gainMap = new Texture(gainMapImage || new ImageData(2, 2), UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearMipMapLinearFilter, RGBAFormat, UnsignedByteType, 1, LinearSRGBColorSpace);
    gainMap.flipY = needsFlip;
    gainMap.needsUpdate = true;
    const sdr = new Texture(sdrImage, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearMipMapLinearFilter, RGBAFormat, UnsignedByteType, 1, SRGBColorSpace);
    sdr.flipY = needsFlip;
    sdr.needsUpdate = true;
    return { gainMap, sdr };
  }
  updateQuadRenderer(quadRenderer, sdrImage, gainMap, sdr, metadata) {
    quadRenderer.width = sdrImage.width;
    quadRenderer.height = sdrImage.height;
    quadRenderer.material.gainMap = gainMap;
    quadRenderer.material.sdr = sdr;
    quadRenderer.material.gainMapMin = metadata.gainMapMin;
    quadRenderer.material.gainMapMax = metadata.gainMapMax;
    quadRenderer.material.offsetHdr = metadata.offsetHdr;
    quadRenderer.material.offsetSdr = metadata.offsetSdr;
    quadRenderer.material.gamma = metadata.gamma;
    quadRenderer.material.hdrCapacityMin = metadata.hdrCapacityMin;
    quadRenderer.material.hdrCapacityMax = metadata.hdrCapacityMax;
    quadRenderer.material.maxDisplayBoost = Math.pow(2, metadata.hdrCapacityMax);
    quadRenderer.material.needsUpdate = true;
  }
}
const vertexShader = (
  /* glsl */
  `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
);
const fragmentShader = (
  /* glsl */
  `
// min half float value
#define HALF_FLOAT_MIN vec3( -65504, -65504, -65504 )
// max half float value
#define HALF_FLOAT_MAX vec3( 65504, 65504, 65504 )

uniform sampler2D sdr;
uniform sampler2D gainMap;
uniform vec3 gamma;
uniform vec3 offsetHdr;
uniform vec3 offsetSdr;
uniform vec3 gainMapMin;
uniform vec3 gainMapMax;
uniform float weightFactor;

varying vec2 vUv;

void main() {
  vec3 rgb = texture2D( sdr, vUv ).rgb;
  vec3 recovery = texture2D( gainMap, vUv ).rgb;
  vec3 logRecovery = pow( recovery, gamma );
  vec3 logBoost = gainMapMin * ( 1.0 - logRecovery ) + gainMapMax * logRecovery;
  vec3 hdrColor = (rgb + offsetSdr) * exp2( logBoost * weightFactor ) - offsetHdr;
  vec3 clampedHdrColor = max( HALF_FLOAT_MIN, min( HALF_FLOAT_MAX, hdrColor ));
  gl_FragColor = vec4( clampedHdrColor , 1.0 );
}
`
);
class GainMapDecoderMaterial extends ShaderMaterial {
  /**
   *
   * @param params
   */
  constructor({ gamma, offsetHdr, offsetSdr, gainMapMin, gainMapMax, maxDisplayBoost, hdrCapacityMin, hdrCapacityMax, sdr, gainMap }) {
    super({
      name: "GainMapDecoderMaterial",
      vertexShader,
      fragmentShader,
      uniforms: {
        sdr: { value: sdr },
        gainMap: { value: gainMap },
        gamma: { value: new Vector3(1 / gamma[0], 1 / gamma[1], 1 / gamma[2]) },
        offsetHdr: { value: new Vector3().fromArray(offsetHdr) },
        offsetSdr: { value: new Vector3().fromArray(offsetSdr) },
        gainMapMin: { value: new Vector3().fromArray(gainMapMin) },
        gainMapMax: { value: new Vector3().fromArray(gainMapMax) },
        weightFactor: {
          value: (Math.log2(maxDisplayBoost) - hdrCapacityMin) / (hdrCapacityMax - hdrCapacityMin)
        }
      },
      blending: NoBlending,
      depthTest: false,
      depthWrite: false
    });
    __publicField(this, "_maxDisplayBoost");
    __publicField(this, "_hdrCapacityMin");
    __publicField(this, "_hdrCapacityMax");
    this._maxDisplayBoost = maxDisplayBoost;
    this._hdrCapacityMin = hdrCapacityMin;
    this._hdrCapacityMax = hdrCapacityMax;
    this.needsUpdate = true;
    this.uniformsNeedUpdate = true;
  }
  get sdr() {
    return this.uniforms.sdr.value;
  }
  set sdr(value) {
    this.uniforms.sdr.value = value;
  }
  get gainMap() {
    return this.uniforms.gainMap.value;
  }
  set gainMap(value) {
    this.uniforms.gainMap.value = value;
  }
  /**
   * @see {@link GainMapMetadata.offsetHdr}
   */
  get offsetHdr() {
    return this.uniforms.offsetHdr.value.toArray();
  }
  set offsetHdr(value) {
    this.uniforms.offsetHdr.value.fromArray(value);
  }
  /**
   * @see {@link GainMapMetadata.offsetSdr}
   */
  get offsetSdr() {
    return this.uniforms.offsetSdr.value.toArray();
  }
  set offsetSdr(value) {
    this.uniforms.offsetSdr.value.fromArray(value);
  }
  /**
   * @see {@link GainMapMetadata.gainMapMin}
   */
  get gainMapMin() {
    return this.uniforms.gainMapMin.value.toArray();
  }
  set gainMapMin(value) {
    this.uniforms.gainMapMin.value.fromArray(value);
  }
  /**
   * @see {@link GainMapMetadata.gainMapMax}
   */
  get gainMapMax() {
    return this.uniforms.gainMapMax.value.toArray();
  }
  set gainMapMax(value) {
    this.uniforms.gainMapMax.value.fromArray(value);
  }
  /**
   * @see {@link GainMapMetadata.gamma}
   */
  get gamma() {
    const g = this.uniforms.gamma.value;
    return [1 / g.x, 1 / g.y, 1 / g.z];
  }
  set gamma(value) {
    const g = this.uniforms.gamma.value;
    g.x = 1 / value[0];
    g.y = 1 / value[1];
    g.z = 1 / value[2];
  }
  /**
   * @see {@link GainMapMetadata.hdrCapacityMin}
   * @remarks Logarithmic space
   */
  get hdrCapacityMin() {
    return this._hdrCapacityMin;
  }
  set hdrCapacityMin(value) {
    this._hdrCapacityMin = value;
    this.calculateWeight();
  }
  /**
   * @see {@link GainMapMetadata.hdrCapacityMin}
   * @remarks Logarithmic space
   */
  get hdrCapacityMax() {
    return this._hdrCapacityMax;
  }
  set hdrCapacityMax(value) {
    this._hdrCapacityMax = value;
    this.calculateWeight();
  }
  /**
   * @see {@link GainmapDecodingParameters.maxDisplayBoost}
   * @remarks Non Logarithmic space
   */
  get maxDisplayBoost() {
    return this._maxDisplayBoost;
  }
  set maxDisplayBoost(value) {
    this._maxDisplayBoost = Math.max(1, Math.min(65504, value));
    this.calculateWeight();
  }
  calculateWeight() {
    const val = (Math.log2(this._maxDisplayBoost) - this._hdrCapacityMin) / (this._hdrCapacityMax - this._hdrCapacityMin);
    this.uniforms.weightFactor.value = Math.max(0, Math.min(1, val));
  }
}
class LoaderBaseWebGL extends LoaderBaseShared {
  constructor(renderer, manager) {
    super({
      renderer,
      createMaterial: (params) => new GainMapDecoderMaterial(params),
      createQuadRenderer: (params) => new QuadRenderer(params)
    }, manager);
  }
  /**
   * @private
   * @param quadRenderer
   * @param metadata
   * @param sdrBuffer
   * @param gainMapBuffer
   */
  async render(quadRenderer, metadata, sdrBuffer, gainMapBuffer) {
    const { sdrImage, gainMapImage, needsFlip } = await this.processImages(sdrBuffer, gainMapBuffer, "flipY");
    const { gainMap, sdr } = this.createTextures(sdrImage, gainMapImage, needsFlip);
    this.updateQuadRenderer(quadRenderer, sdrImage, gainMap, sdr, metadata);
    quadRenderer.render();
  }
}
class GainMapLoader extends LoaderBaseWebGL {
  /**
   * Loads a gainmap using separate data
   * * sdr image
   * * gain map image
   * * metadata json
   *
   * useful for webp gain maps
   *
   * @param urls An array in the form of [sdr.jpg, gainmap.jpg, metadata.json]
   * @param onLoad Load complete callback, will receive the result
   * @param onProgress Progress callback, will receive a `ProgressEvent`
   * @param onError Error callback
   * @returns
   */
  load([sdrUrl, gainMapUrl, metadataUrl], onLoad, onProgress, onError) {
    const quadRenderer = this.prepareQuadRenderer();
    let sdr;
    let gainMap;
    let metadata;
    const loadCheck = async () => {
      if (sdr && gainMap && metadata) {
        try {
          await this.render(quadRenderer, metadata, sdr, gainMap);
        } catch (error) {
          this.manager.itemError(sdrUrl);
          this.manager.itemError(gainMapUrl);
          this.manager.itemError(metadataUrl);
          if (typeof onError === "function")
            onError(error);
          quadRenderer.disposeOnDemandRenderer();
          return;
        }
        if (typeof onLoad === "function")
          onLoad(quadRenderer);
        this.manager.itemEnd(sdrUrl);
        this.manager.itemEnd(gainMapUrl);
        this.manager.itemEnd(metadataUrl);
        quadRenderer.disposeOnDemandRenderer();
      }
    };
    let sdrLengthComputable = true;
    let sdrTotal = 0;
    let sdrLoaded = 0;
    let gainMapLengthComputable = true;
    let gainMapTotal = 0;
    let gainMapLoaded = 0;
    let metadataLengthComputable = true;
    let metadataTotal = 0;
    let metadataLoaded = 0;
    const progressHandler = () => {
      if (typeof onProgress === "function") {
        const total = sdrTotal + gainMapTotal + metadataTotal;
        const loaded = sdrLoaded + gainMapLoaded + metadataLoaded;
        const lengthComputable = sdrLengthComputable && gainMapLengthComputable && metadataLengthComputable;
        onProgress(new ProgressEvent("progress", { lengthComputable, loaded, total }));
      }
    };
    this.manager.itemStart(sdrUrl);
    this.manager.itemStart(gainMapUrl);
    this.manager.itemStart(metadataUrl);
    const sdrLoader = new FileLoader(this._internalLoadingManager);
    sdrLoader.setResponseType("arraybuffer");
    sdrLoader.setRequestHeader(this.requestHeader);
    sdrLoader.setPath(this.path);
    sdrLoader.setWithCredentials(this.withCredentials);
    sdrLoader.load(sdrUrl, async (buffer) => {
      if (typeof buffer === "string")
        throw new Error("Invalid sdr buffer");
      sdr = buffer;
      await loadCheck();
    }, (e) => {
      sdrLengthComputable = e.lengthComputable;
      sdrLoaded = e.loaded;
      sdrTotal = e.total;
      progressHandler();
    }, (error) => {
      this.manager.itemError(sdrUrl);
      if (typeof onError === "function")
        onError(error);
    });
    const gainMapLoader = new FileLoader(this._internalLoadingManager);
    gainMapLoader.setResponseType("arraybuffer");
    gainMapLoader.setRequestHeader(this.requestHeader);
    gainMapLoader.setPath(this.path);
    gainMapLoader.setWithCredentials(this.withCredentials);
    gainMapLoader.load(gainMapUrl, async (buffer) => {
      if (typeof buffer === "string")
        throw new Error("Invalid gainmap buffer");
      gainMap = buffer;
      await loadCheck();
    }, (e) => {
      gainMapLengthComputable = e.lengthComputable;
      gainMapLoaded = e.loaded;
      gainMapTotal = e.total;
      progressHandler();
    }, (error) => {
      this.manager.itemError(gainMapUrl);
      if (typeof onError === "function")
        onError(error);
    });
    const metadataLoader = new FileLoader(this._internalLoadingManager);
    metadataLoader.setRequestHeader(this.requestHeader);
    metadataLoader.setPath(this.path);
    metadataLoader.setWithCredentials(this.withCredentials);
    metadataLoader.load(metadataUrl, async (json) => {
      if (typeof json !== "string")
        throw new Error("Invalid metadata string");
      metadata = JSON.parse(json);
      await loadCheck();
    }, (e) => {
      metadataLengthComputable = e.lengthComputable;
      metadataLoaded = e.loaded;
      metadataTotal = e.total;
      progressHandler();
    }, (error) => {
      this.manager.itemError(metadataUrl);
      if (typeof onError === "function")
        onError(error);
    });
    return quadRenderer;
  }
}
class HDRJPGLoader extends LoaderBaseWebGL {
  /**
   * Loads a JPEG containing gain map metadata
   * Renders a normal SDR image if gainmap data is not found
   *
   * @param url Path to a JPEG file containing embedded gain map metadata
   * @param onLoad Load complete callback, will receive the result
   * @param onProgress Progress callback, will receive a `ProgressEvent`
   * @param onError Error callback
   * @returns
   */
  load(url, onLoad, onProgress, onError) {
    const quadRenderer = this.prepareQuadRenderer();
    const loader = new FileLoader(this._internalLoadingManager);
    loader.setResponseType("arraybuffer");
    loader.setRequestHeader(this.requestHeader);
    loader.setPath(this.path);
    loader.setWithCredentials(this.withCredentials);
    this.manager.itemStart(url);
    loader.load(url, async (jpeg) => {
      if (typeof jpeg === "string")
        throw new Error("Invalid buffer, received [string], was expecting [ArrayBuffer]");
      const jpegBuffer = new Uint8Array(jpeg);
      let sdrJPEG;
      let gainMapJPEG;
      let metadata;
      try {
        const extractionResult = await extractGainmapFromJPEG(jpegBuffer);
        sdrJPEG = extractionResult.sdr;
        gainMapJPEG = extractionResult.gainMap;
        metadata = extractionResult.metadata;
      } catch (e) {
        if (e instanceof XMPMetadataNotFoundError || e instanceof GainMapNotFoundError) {
          console.warn(`Failure to reconstruct an HDR image from ${url}: Gain map metadata not found in the file, HDRJPGLoader will render the SDR jpeg`);
          metadata = {
            gainMapMin: [0, 0, 0],
            gainMapMax: [1, 1, 1],
            gamma: [1, 1, 1],
            hdrCapacityMin: 0,
            hdrCapacityMax: 1,
            offsetHdr: [0, 0, 0],
            offsetSdr: [0, 0, 0]
          };
          sdrJPEG = jpegBuffer;
        } else {
          throw e;
        }
      }
      try {
        await this.render(quadRenderer, metadata, sdrJPEG.buffer, gainMapJPEG == null ? void 0 : gainMapJPEG.buffer);
      } catch (error) {
        this.manager.itemError(url);
        if (typeof onError === "function")
          onError(error);
        quadRenderer.disposeOnDemandRenderer();
        return;
      }
      if (typeof onLoad === "function")
        onLoad(quadRenderer);
      this.manager.itemEnd(url);
      quadRenderer.disposeOnDemandRenderer();
    }, onProgress, (error) => {
      this.manager.itemError(url);
      if (typeof onError === "function")
        onError(error);
    });
    return quadRenderer;
  }
}
const presetsObj = {
  apartment: "lebombo_1k.hdr",
  city: "potsdamer_platz_1k.hdr",
  dawn: "kiara_1_dawn_1k.hdr",
  forest: "forest_slope_1k.hdr",
  lobby: "st_fagans_interior_1k.hdr",
  night: "dikhololo_night_1k.hdr",
  park: "rooitou_park_1k.hdr",
  studio: "studio_small_03_1k.hdr",
  sunset: "venice_sunset_1k.hdr",
  warehouse: "empty_warehouse_01_1k.hdr"
};
const CUBEMAP_ROOT = "https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/";
const isArray = (arr) => Array.isArray(arr);
const defaultFiles = ["/px.png", "/nx.png", "/py.png", "/ny.png", "/pz.png", "/nz.png"];
function useEnvironment({
  files = defaultFiles,
  path = "",
  preset = void 0,
  encoding = void 0,
  extensions
} = {}) {
  let loader = null;
  let multiFile = false;
  if (preset) {
    validatePreset(preset);
    files = presetsObj[preset];
    path = CUBEMAP_ROOT;
  }
  multiFile = isArray(files);
  const {
    extension,
    isCubemap
  } = getExtension(files);
  loader = getLoader(extension);
  if (!loader) throw new Error("useEnvironment: Unrecognized file extension: " + files);
  const gl = useThree((state) => state.gl);
  reactExports.useLayoutEffect(() => {
    if (extension !== "webp" && extension !== "jpg" && extension !== "jpeg") return;
    function clearGainmapTexture() {
      useLoader.clear(
        // @ts-expect-error
        loader,
        multiFile ? [files] : files
      );
    }
    gl.domElement.addEventListener("webglcontextlost", clearGainmapTexture, {
      once: true
    });
  }, [files, gl.domElement]);
  const loaderResult = useLoader(
    // @ts-expect-error
    loader,
    multiFile ? [files] : files,
    (loader2) => {
      if (extension === "webp" || extension === "jpg" || extension === "jpeg") {
        loader2.setRenderer(gl);
      }
      loader2.setPath == null || loader2.setPath(path);
      if (extensions) extensions(loader2);
    }
  );
  let texture = multiFile ? (
    // @ts-ignore
    loaderResult[0]
  ) : loaderResult;
  if (extension === "jpg" || extension === "jpeg" || extension === "webp") {
    var _renderTarget;
    texture = (_renderTarget = texture.renderTarget) == null ? void 0 : _renderTarget.texture;
  }
  texture.mapping = isCubemap ? CubeReflectionMapping : EquirectangularReflectionMapping;
  if ("colorSpace" in texture) texture.colorSpace = (encoding !== null && encoding !== void 0 ? encoding : isCubemap) ? "srgb" : "srgb-linear";
  else texture.encoding = (encoding !== null && encoding !== void 0 ? encoding : isCubemap) ? sRGBEncoding : LinearEncoding;
  return texture;
}
const preloadDefaultOptions = {
  files: defaultFiles,
  path: "",
  preset: void 0,
  extensions: void 0
};
useEnvironment.preload = (preloadOptions) => {
  const options = {
    ...preloadDefaultOptions,
    ...preloadOptions
  };
  let {
    files,
    path = ""
  } = options;
  const {
    preset,
    extensions
  } = options;
  if (preset) {
    validatePreset(preset);
    files = presetsObj[preset];
    path = CUBEMAP_ROOT;
  }
  const {
    extension
  } = getExtension(files);
  if (extension === "webp" || extension === "jpg" || extension === "jpeg") {
    throw new Error("useEnvironment: Preloading gainmaps is not supported");
  }
  const loader = getLoader(extension);
  if (!loader) throw new Error("useEnvironment: Unrecognized file extension: " + files);
  useLoader.preload(
    // @ts-expect-error
    loader,
    isArray(files) ? [files] : files,
    (loader2) => {
      loader2.setPath == null || loader2.setPath(path);
      if (extensions) extensions(loader2);
    }
  );
};
const clearDefaultOptins = {
  files: defaultFiles,
  preset: void 0
};
useEnvironment.clear = (clearOptions) => {
  const options = {
    ...clearDefaultOptins,
    ...clearOptions
  };
  let {
    files
  } = options;
  const {
    preset
  } = options;
  if (preset) {
    validatePreset(preset);
    files = presetsObj[preset];
  }
  const {
    extension
  } = getExtension(files);
  const loader = getLoader(extension);
  if (!loader) throw new Error("useEnvironment: Unrecognized file extension: " + files);
  useLoader.clear(
    // @ts-expect-error
    loader,
    isArray(files) ? [files] : files
  );
};
function validatePreset(preset) {
  if (!(preset in presetsObj)) throw new Error("Preset must be one of: " + Object.keys(presetsObj).join(", "));
}
function getExtension(files) {
  var _firstEntry$split$pop;
  const isCubemap = isArray(files) && files.length === 6;
  const isGainmap = isArray(files) && files.length === 3 && files.some((file) => file.endsWith("json"));
  const firstEntry = isArray(files) ? files[0] : files;
  const extension = isCubemap ? "cube" : isGainmap ? "webp" : firstEntry.startsWith("data:application/exr") ? "exr" : firstEntry.startsWith("data:application/hdr") ? "hdr" : firstEntry.startsWith("data:image/jpeg") ? "jpg" : (_firstEntry$split$pop = firstEntry.split(".").pop()) == null || (_firstEntry$split$pop = _firstEntry$split$pop.split("?")) == null || (_firstEntry$split$pop = _firstEntry$split$pop.shift()) == null ? void 0 : _firstEntry$split$pop.toLowerCase();
  return {
    extension,
    isCubemap,
    isGainmap
  };
}
function getLoader(extension) {
  const loader = extension === "cube" ? CubeTextureLoader : extension === "hdr" ? RGBELoader : extension === "exr" ? EXRLoader : extension === "jpg" || extension === "jpeg" ? HDRJPGLoader : extension === "webp" ? GainMapLoader : null;
  return loader;
}
const isRef = (obj) => obj.current && obj.current.isScene;
const resolveScene = (scene) => isRef(scene) ? scene.current : scene;
function setEnvProps(background, scene, defaultScene, texture, sceneProps = {}) {
  var _target$backgroundRot, _target$backgroundRot2, _target$environmentRo, _target$environmentRo2;
  sceneProps = {
    backgroundBlurriness: 0,
    backgroundIntensity: 1,
    backgroundRotation: [0, 0, 0],
    environmentIntensity: 1,
    environmentRotation: [0, 0, 0],
    ...sceneProps
  };
  const target = resolveScene(scene || defaultScene);
  const oldbg = target.background;
  const oldenv = target.environment;
  const oldSceneProps = {
    // @ts-ignore
    backgroundBlurriness: target.backgroundBlurriness,
    // @ts-ignore
    backgroundIntensity: target.backgroundIntensity,
    // @ts-ignore
    backgroundRotation: (_target$backgroundRot = (_target$backgroundRot2 = target.backgroundRotation) == null || _target$backgroundRot2.clone == null ? void 0 : _target$backgroundRot2.clone()) !== null && _target$backgroundRot !== void 0 ? _target$backgroundRot : [0, 0, 0],
    // @ts-ignore
    environmentIntensity: target.environmentIntensity,
    // @ts-ignore
    environmentRotation: (_target$environmentRo = (_target$environmentRo2 = target.environmentRotation) == null || _target$environmentRo2.clone == null ? void 0 : _target$environmentRo2.clone()) !== null && _target$environmentRo !== void 0 ? _target$environmentRo : [0, 0, 0]
  };
  if (background !== "only") target.environment = texture;
  if (background) target.background = texture;
  applyProps(target, sceneProps);
  return () => {
    if (background !== "only") target.environment = oldenv;
    if (background) target.background = oldbg;
    applyProps(target, oldSceneProps);
  };
}
function EnvironmentMap({
  scene,
  background = false,
  map,
  ...config
}) {
  const defaultScene = useThree((state) => state.scene);
  reactExports.useLayoutEffect(() => {
    if (map) return setEnvProps(background, scene, defaultScene, map, config);
  });
  return null;
}
function EnvironmentCube({
  background = false,
  scene,
  blur,
  backgroundBlurriness,
  backgroundIntensity,
  backgroundRotation,
  environmentIntensity,
  environmentRotation,
  ...rest
}) {
  const texture = useEnvironment(rest);
  const defaultScene = useThree((state) => state.scene);
  reactExports.useLayoutEffect(() => {
    return setEnvProps(background, scene, defaultScene, texture, {
      backgroundBlurriness: blur !== null && blur !== void 0 ? blur : backgroundBlurriness,
      backgroundIntensity,
      backgroundRotation,
      environmentIntensity,
      environmentRotation
    });
  });
  reactExports.useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);
  return null;
}
function EnvironmentPortal({
  children,
  near = 0.1,
  far = 1e3,
  resolution = 256,
  frames = 1,
  map,
  background = false,
  blur,
  backgroundBlurriness,
  backgroundIntensity,
  backgroundRotation,
  environmentIntensity,
  environmentRotation,
  scene,
  files,
  path,
  preset = void 0,
  extensions
}) {
  const gl = useThree((state) => state.gl);
  const defaultScene = useThree((state) => state.scene);
  const camera = reactExports.useRef(null);
  const [virtualScene] = reactExports.useState(() => new Scene());
  const fbo = reactExports.useMemo(() => {
    const fbo2 = new WebGLCubeRenderTarget(resolution);
    fbo2.texture.type = HalfFloatType;
    return fbo2;
  }, [resolution]);
  reactExports.useEffect(() => {
    return () => {
      fbo.dispose();
    };
  }, [fbo]);
  reactExports.useLayoutEffect(() => {
    if (frames === 1) {
      const autoClear = gl.autoClear;
      gl.autoClear = true;
      camera.current.update(gl, virtualScene);
      gl.autoClear = autoClear;
    }
    return setEnvProps(background, scene, defaultScene, fbo.texture, {
      backgroundBlurriness: blur !== null && blur !== void 0 ? blur : backgroundBlurriness,
      backgroundIntensity,
      backgroundRotation,
      environmentIntensity,
      environmentRotation
    });
  }, [children, virtualScene, fbo.texture, scene, defaultScene, background, frames, gl]);
  let count = 1;
  useFrame(() => {
    if (frames === Infinity || count < frames) {
      const autoClear = gl.autoClear;
      gl.autoClear = true;
      camera.current.update(gl, virtualScene);
      gl.autoClear = autoClear;
      count++;
    }
  });
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, createPortal(/* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, children, /* @__PURE__ */ reactExports.createElement("cubeCamera", {
    ref: camera,
    args: [near, far, fbo]
  }), files || preset ? /* @__PURE__ */ reactExports.createElement(EnvironmentCube, {
    background: true,
    files,
    preset,
    path,
    extensions
  }) : map ? /* @__PURE__ */ reactExports.createElement(EnvironmentMap, {
    background: true,
    map,
    extensions
  }) : null), virtualScene));
}
function EnvironmentGround(props) {
  var _props$ground, _props$ground2, _scale, _props$ground3;
  const textureDefault = useEnvironment(props);
  const texture = props.map || textureDefault;
  reactExports.useMemo(() => extend({
    GroundProjectedEnvImpl: GroundProjectedEnv
  }), []);
  reactExports.useEffect(() => {
    return () => {
      textureDefault.dispose();
    };
  }, [textureDefault]);
  const args = reactExports.useMemo(() => [texture], [texture]);
  const height = (_props$ground = props.ground) == null ? void 0 : _props$ground.height;
  const radius = (_props$ground2 = props.ground) == null ? void 0 : _props$ground2.radius;
  const scale = (_scale = (_props$ground3 = props.ground) == null ? void 0 : _props$ground3.scale) !== null && _scale !== void 0 ? _scale : 1e3;
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(EnvironmentMap, _extends({}, props, {
    map: texture
  })), /* @__PURE__ */ reactExports.createElement("groundProjectedEnvImpl", {
    args,
    scale,
    height,
    radius
  }));
}
function Environment(props) {
  return props.ground ? /* @__PURE__ */ reactExports.createElement(EnvironmentGround, props) : props.map ? /* @__PURE__ */ reactExports.createElement(EnvironmentMap, props) : props.children ? /* @__PURE__ */ reactExports.createElement(EnvironmentPortal, props) : /* @__PURE__ */ reactExports.createElement(EnvironmentCube, props);
}
const RenderTexture = /* @__PURE__ */ reactExports.forwardRef(({
  children,
  compute,
  width,
  height,
  samples = 8,
  renderPriority = 0,
  eventPriority = 0,
  frames = Infinity,
  stencilBuffer = false,
  depthBuffer = true,
  generateMipmaps = false,
  ...props
}, forwardRef) => {
  const {
    size,
    viewport
  } = useThree();
  const fbo = useFBO((width || size.width) * viewport.dpr, (height || size.height) * viewport.dpr, {
    samples,
    stencilBuffer,
    depthBuffer,
    generateMipmaps
  });
  const [vScene] = reactExports.useState(() => new Scene());
  const uvCompute = reactExports.useCallback((event, state, previous) => {
    var _fbo$texture, _previous$previousRoo;
    let parent = (_fbo$texture = fbo.texture) == null ? void 0 : _fbo$texture.__r3f.parent;
    while (parent && !(parent instanceof Object3D)) {
      parent = parent.__r3f.parent;
    }
    if (!parent) return false;
    if (!previous.raycaster.camera) previous.events.compute(event, previous, (_previous$previousRoo = previous.previousRoot) == null ? void 0 : _previous$previousRoo.getState());
    const [intersection] = previous.raycaster.intersectObject(parent);
    if (!intersection) return false;
    const uv = intersection.uv;
    if (!uv) return false;
    state.raycaster.setFromCamera(state.pointer.set(uv.x * 2 - 1, uv.y * 2 - 1), state.camera);
  }, []);
  reactExports.useImperativeHandle(forwardRef, () => fbo.texture, [fbo]);
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, createPortal(/* @__PURE__ */ reactExports.createElement(Container, {
    renderPriority,
    frames,
    fbo
  }, children, /* @__PURE__ */ reactExports.createElement("group", {
    onPointerOver: () => null
  })), vScene, {
    events: {
      compute: compute || uvCompute,
      priority: eventPriority
    }
  }), /* @__PURE__ */ reactExports.createElement("primitive", _extends({
    object: fbo.texture
  }, props)));
});
function Container({
  frames,
  renderPriority,
  children,
  fbo
}) {
  let count = 0;
  let oldAutoClear;
  let oldXrEnabled;
  let oldRenderTarget;
  let oldIsPresenting;
  useFrame((state) => {
    if (frames === Infinity || count < frames) {
      oldAutoClear = state.gl.autoClear;
      oldXrEnabled = state.gl.xr.enabled;
      oldRenderTarget = state.gl.getRenderTarget();
      oldIsPresenting = state.gl.xr.isPresenting;
      state.gl.autoClear = true;
      state.gl.xr.enabled = false;
      state.gl.xr.isPresenting = false;
      state.gl.setRenderTarget(fbo);
      state.gl.render(state.scene, state.camera);
      state.gl.setRenderTarget(oldRenderTarget);
      state.gl.autoClear = oldAutoClear;
      state.gl.xr.enabled = oldXrEnabled;
      state.gl.xr.isPresenting = oldIsPresenting;
      count++;
    }
  }, renderPriority);
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, children);
}
class MusicSystem {
  constructor() {
    __publicField(this, "transports", /* @__PURE__ */ new Map());
    __publicField(this, "synths", /* @__PURE__ */ new Map());
    // Multiple synths per ship
    __publicField(this, "effects", /* @__PURE__ */ new Map());
    // Effects chains
    __publicField(this, "lyrics", /* @__PURE__ */ new Map());
    __publicField(this, "bandNames", /* @__PURE__ */ new Map());
    __publicField(this, "currentLyricIndex", /* @__PURE__ */ new Map());
    __publicField(this, "isInitialized", false);
    this.initializeBandNames();
    this.initializeLyrics();
  }
  // =========================================================================
  // BAND NAMES - Revealed during upgrade cinematic
  // =========================================================================
  initializeBandNames() {
    this.bandNames.set("cruise", {
      name: "The Deck Dancers",
      genre: "Orchestral Pop Symphony"
    });
    this.bandNames.set("container", {
      name: "Neon Freight Crew",
      genre: "Future Bass / Techno"
    });
    this.bandNames.set("tanker", {
      name: "Industrial Flames",
      genre: "Dubstep / Industrial"
    });
    this.bandNames.set("bulk", {
      name: "Iron Ore Orchestra",
      genre: "Industrial Metal / Hard Rock"
    });
    this.bandNames.set("lng", {
      name: "Cryogenic Pulse",
      genre: "Ambient / Cryogenic Techno"
    });
    this.bandNames.set("roro", {
      name: "Highway Star",
      genre: "Synthwave / Driving Rock"
    });
    this.bandNames.set("research", {
      name: "Sonar Collective",
      genre: "Ambient / Scientific"
    });
    this.bandNames.set("droneship", {
      name: "Orbital Mechanics",
      genre: "Space Ambient / Electronic"
    });
  }
  getBandInfo(shipType) {
    return this.bandNames.get(shipType) || { name: "Unknown Band", genre: "Unknown" };
  }
  // =========================================================================
  // LYRICS - Synced to beat
  // =========================================================================
  initializeLyrics() {
    this.lyrics.set("cruise", [
      { time: "0:0", text: "We sail through the night…" },
      { time: "0:2", text: "stars shining bright…" },
      { time: "1:0", text: "lights ignite…" },
      { time: "1:2", text: "HarborGlow!" },
      { time: "2:0", text: "Ocean Symphony!" },
      { time: "2:2", text: "Dancing on the waves!" },
      { time: "3:0", text: "We are the light…" },
      { time: "3:2", text: "through the night…" },
      { time: "4:0", text: "HarborGlow!" }
    ]);
    this.lyrics.set("container", [
      { time: "0:0", text: "Stack it high…" },
      { time: "0:1", text: "touch the sky…" },
      { time: "0:2", text: "light the sky…" },
      { time: "0:3", text: "NEON STACK!" },
      { time: "1:0", text: "Move that freight all night!" },
      { time: "1:2", text: "Beat so tight!" },
      { time: "2:0", text: "Containers glowing bright!" },
      { time: "2:2", text: "HarborGlow!" },
      { time: "3:0", text: "Stack it higher!" },
      { time: "3:2", text: "Set it on fire!" }
    ]);
    this.lyrics.set("tanker", [
      { time: "0:0", text: "Black gold flows…" },
      { time: "0:2", text: "fire glows…" },
      { time: "1:0", text: "we own these glowing seas!" },
      { time: "1:2", text: "FLAME RUNNER!" },
      { time: "2:0", text: "Industrial might!" },
      { time: "2:2", text: "Burning through the night!" },
      { time: "3:0", text: "We are the fire!" },
      { time: "3:2", text: "HarborGlow!" },
      { time: "4:0", text: "Oil and flame!" },
      { time: "4:2", text: "Know our name!" }
    ]);
    this.currentLyricIndex.set("cruise", 0);
    this.currentLyricIndex.set("container", 0);
    this.currentLyricIndex.set("tanker", 0);
    this.currentLyricIndex.set("bulk", 0);
    this.currentLyricIndex.set("lng", 0);
    this.currentLyricIndex.set("roro", 0);
    this.currentLyricIndex.set("research", 0);
    this.currentLyricIndex.set("droneship", 0);
  }
  // =========================================================================
  // SYNTHS & EFFECTS - Initialize on first interaction
  // =========================================================================
  async initializeAudio() {
    if (this.isInitialized) return;
    await start();
    this.initializeCruiseSynths();
    this.initializeContainerSynths();
    this.initializeTankerSynths();
    this.initializeBulkSynths();
    this.initializeLngSynths();
    this.initializeRoroSynths();
    this.initializeResearchSynths();
    this.initializeDroneshipSynths();
    this.initializeTransports();
    this.isInitialized = true;
  }
  // -------------------------------------------------------------------------
  // CRUISE SHIP - "Ocean Symphony"
  // Orchestral + choir synth with lush reverb
  // -------------------------------------------------------------------------
  initializeCruiseSynths() {
    const effects = [];
    const synths = [];
    const reverb = new Reverb({
      decay: 4,
      preDelay: 0.2,
      wet: 0.4
    }).toDestination();
    effects.push(reverb);
    const chorus = new Chorus({
      frequency: 2,
      delayTime: 3.5,
      depth: 0.5,
      wet: 0.3
    }).connect(reverb);
    effects.push(chorus);
    const leadSynth = new PolySynth(Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.6, release: 1.5 }
    }).connect(chorus);
    leadSynth.volume.value = -8;
    synths.push(leadSynth);
    const padSynth = new PolySynth(Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.8, decay: 0.5, sustain: 0.7, release: 2 }
    }).connect(reverb);
    padSynth.volume.value = -12;
    synths.push(padSynth);
    const bassSynth = new MonoSynth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.8 }
    }).connect(reverb);
    bassSynth.volume.value = -6;
    synths.push(bassSynth);
    this.synths.set("cruise", synths);
    this.effects.set("cruise", effects);
  }
  // -------------------------------------------------------------------------
  // CONTAINER SHIP - "Neon Stack"
  // Heavy techno / future bass with FM synth + membrane
  // -------------------------------------------------------------------------
  initializeContainerSynths() {
    const effects = [];
    const synths = [];
    const limiter = new Limiter(-2).toDestination();
    const pingPong = new PingPongDelay({
      delayTime: "8n",
      feedback: 0.4,
      wet: 0.2
    }).connect(limiter);
    effects.push(pingPong);
    const fmSynth = new PolySynth(FMSynth, {
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 }
    }).connect(pingPong);
    fmSynth.volume.value = -10;
    synths.push(fmSynth);
    const membrane = new MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 1e-3, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).connect(limiter);
    membrane.volume.value = -4;
    synths.push(membrane);
    const metalSynth = new MetalSynth({
      envelope: { attack: 1e-3, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4e3,
      octaves: 1.5
    }).connect(pingPong);
    metalSynth.volume.value = -15;
    synths.push(metalSynth);
    this.synths.set("container", synths);
    this.effects.set("container", effects);
  }
  // -------------------------------------------------------------------------
  // TANKER SHIP - "Flame Runner"
  // Gritty industrial / dubstep with Metal synth + noise
  // -------------------------------------------------------------------------
  initializeTankerSynths() {
    const effects = [];
    const synths = [];
    const reverb = new Reverb({
      decay: 3,
      preDelay: 0.1,
      wet: 0.25
    }).toDestination();
    effects.push(reverb);
    const bitcrusher = new BitCrusher(8).connect(reverb);
    effects.push(bitcrusher);
    const filter = new Filter({
      frequency: 800,
      type: "lowpass",
      rolloff: -24
    }).connect(bitcrusher);
    effects.push(filter);
    const metalSynth = new MetalSynth({
      envelope: { attack: 1e-3, decay: 0.3, release: 0.2 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4e3,
      octaves: 1.5
    }).connect(filter);
    metalSynth.volume.value = -8;
    synths.push(metalSynth);
    const noiseSynth = new NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.2 }
    }).connect(reverb);
    noiseSynth.volume.value = -18;
    synths.push(noiseSynth);
    const subSynth = new MonoSynth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 },
      filter: { Q: 2, type: "lowpass", rolloff: -24 }
    }).connect(filter);
    subSynth.volume.value = -2;
    synths.push(subSynth);
    const lfo = new LFO("4n", 200, 1e3);
    lfo.connect(filter.frequency);
    effects.push(lfo);
    this.synths.set("tanker", synths);
    this.effects.set("tanker", effects);
  }
  // -------------------------------------------------------------------------
  // BULK CARRIER - "Iron Mountain" - 135 BPM Industrial Metal / Hard Rock
  // -------------------------------------------------------------------------
  initializeBulkSynths() {
    const effects = [];
    const synths = [];
    const distortion = new Distortion({ distortion: 0.4, wet: 0.3 }).toDestination();
    effects.push(distortion);
    const reverb = new Reverb({ decay: 3, preDelay: 0.1, wet: 0.25 }).connect(distortion);
    effects.push(reverb);
    const guitarSynth = new PolySynth(Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 }
    }).connect(distortion);
    guitarSynth.volume.value = -10;
    synths.push(guitarSynth);
    const bassSynth = new MonoSynth({
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.4 },
      filter: { Q: 4, type: "lowpass", rolloff: -24 }
    }).connect(reverb);
    bassSynth.volume.value = -6;
    synths.push(bassSynth);
    const metalSynth = new MetalSynth({
      envelope: { attack: 1e-3, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4e3,
      octaves: 1.5
    }).connect(distortion);
    metalSynth.volume.value = -12;
    synths.push(metalSynth);
    this.synths.set("bulk", synths);
    this.effects.set("bulk", effects);
  }
  // -------------------------------------------------------------------------
  // LNG CARRIER - "Cryo Titan" - 118 BPM Ambient / Cryogenic Techno
  // -------------------------------------------------------------------------
  initializeLngSynths() {
    const effects = [];
    const synths = [];
    const reverb = new Reverb({ decay: 8, preDelay: 0.5, wet: 0.6 }).toDestination();
    effects.push(reverb);
    const chorus = new Chorus({ frequency: 0.5, delayTime: 3, depth: 0.7, wet: 0.4 }).connect(reverb);
    effects.push(chorus);
    const padSynth = new PolySynth(Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 }
    }).connect(chorus);
    padSynth.volume.value = -14;
    synths.push(padSynth);
    const fmSynth = new PolySynth(FMSynth, {
      harmonicity: 4,
      modulationIndex: 10,
      oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 2 },
      modulation: { type: "triangle" }
    }).connect(reverb);
    fmSynth.volume.value = -16;
    synths.push(fmSynth);
    const subSynth = new MonoSynth({
      oscillator: { type: "sine" },
      envelope: { attack: 1, decay: 0.5, sustain: 0.9, release: 3 }
    }).connect(reverb);
    subSynth.volume.value = -8;
    synths.push(subSynth);
    this.synths.set("lng", synths);
    this.effects.set("lng", effects);
  }
  // -------------------------------------------------------------------------
  // RO-RO FERRY - "Vehicle Voyager" - 125 BPM Synthwave / Driving Rock
  // -------------------------------------------------------------------------
  initializeRoroSynths() {
    const effects = [];
    const synths = [];
    const chorus = new Chorus({ frequency: 2, delayTime: 3.5, depth: 0.5, wet: 0.3 }).toDestination();
    effects.push(chorus);
    const feedbackDelay = new FeedbackDelay("8n", 0.3).connect(chorus);
    effects.push(feedbackDelay);
    const leadSynth = new PolySynth(Synth, {
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 }
    }).connect(feedbackDelay);
    leadSynth.volume.value = -10;
    synths.push(leadSynth);
    const bassSynth = new MonoSynth({
      oscillator: { type: "pulse" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
      filter: { Q: 2, type: "lowpass", rolloff: -24 }
    }).connect(chorus);
    bassSynth.volume.value = -8;
    synths.push(bassSynth);
    const membrane = new MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "sine" },
      envelope: { attack: 1e-3, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).connect(chorus);
    membrane.volume.value = -10;
    synths.push(membrane);
    this.synths.set("roro", synths);
    this.effects.set("roro", effects);
  }
  // -------------------------------------------------------------------------
  // RESEARCH VESSEL - "Deep Discoverer" - 110 BPM Ambient / Scientific
  // -------------------------------------------------------------------------
  initializeResearchSynths() {
    const effects = [];
    const synths = [];
    const reverb = new Reverb({ decay: 10, preDelay: 0.3, wet: 0.5 }).toDestination();
    effects.push(reverb);
    const pingPong = new PingPongDelay("4n", 0.2).connect(reverb);
    effects.push(pingPong);
    const sonarSynth = new PolySynth(Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 1e-3, decay: 0.5, sustain: 0, release: 1 }
    }).connect(pingPong);
    sonarSynth.volume.value = -12;
    synths.push(sonarSynth);
    const padSynth = new PolySynth(Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 1, decay: 1, sustain: 0.7, release: 5 }
    }).connect(reverb);
    padSynth.volume.value = -18;
    synths.push(padSynth);
    const bassSynth = new MonoSynth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 3 }
    }).connect(reverb);
    bassSynth.volume.value = -14;
    synths.push(bassSynth);
    this.synths.set("research", synths);
    this.effects.set("research", effects);
  }
  // -------------------------------------------------------------------------
  // DRONE SHIP - "Of Course I Still Love You" - 105 BPM Space Ambient
  // -------------------------------------------------------------------------
  initializeDroneshipSynths() {
    const effects = [];
    const synths = [];
    const reverb = new Reverb({ decay: 12, preDelay: 0.8, wet: 0.7 }).toDestination();
    effects.push(reverb);
    const feedbackDelay = new FeedbackDelay("2n", 0.5).connect(reverb);
    effects.push(feedbackDelay);
    const padSynth = new PolySynth(Synth, {
      oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
      envelope: { attack: 2, decay: 1, sustain: 0.8, release: 8 }
    }).connect(feedbackDelay);
    padSynth.volume.value = -16;
    synths.push(padSynth);
    const blipSynth = new PolySynth(Synth, {
      oscillator: { type: "square" },
      envelope: { attack: 1e-3, decay: 0.1, sustain: 0, release: 0.2 }
    }).connect(reverb);
    blipSynth.volume.value = -20;
    synths.push(blipSynth);
    const droneSynth = new MonoSynth({
      oscillator: { type: "fmsine" },
      envelope: { attack: 3, decay: 1, sustain: 1, release: 10 }
    }).connect(reverb);
    droneSynth.volume.value = -20;
    synths.push(droneSynth);
    this.synths.set("droneship", synths);
    this.effects.set("droneship", effects);
  }
  // =========================================================================
  // TRANSPORTS - Music sequences for each ship type
  // =========================================================================
  initializeTransports() {
    const cruiseTransport = getTransport();
    cruiseTransport.bpm.value = 120;
    const cruiseSynths = this.synths.get("cruise") || [];
    const [lead, pad, bass] = cruiseSynths;
    const chordPart = new Part((time, value) => {
      lead == null ? void 0 : lead.triggerAttackRelease(value.notes, value.duration, time);
      pad == null ? void 0 : pad.triggerAttackRelease(value.notes, "2n", time, 0.6);
    }, [
      { time: "0:0", notes: ["C4", "E4", "G4", "B4"], duration: "1n" },
      { time: "1:0", notes: ["F4", "A4", "C5", "E5"], duration: "1n" },
      { time: "2:0", notes: ["G4", "B4", "D5", "F5"], duration: "1n" },
      { time: "3:0", notes: ["C4", "E4", "G4", "C5"], duration: "1n" }
    ]);
    chordPart.loop = true;
    chordPart.loopEnd = "4:0";
    const bassPart = new Sequence((time, note) => {
      bass == null ? void 0 : bass.triggerAttackRelease(note, "2n", time);
    }, ["C2", "C2", "F2", "G2"]);
    bassPart.loop = true;
    this.transports.set("cruise", cruiseTransport);
    const containerTransport = getTransport();
    containerTransport.bpm.value = 128;
    const containerSynths = this.synths.get("container") || [];
    const [containerFm, membrane, metal] = containerSynths;
    const kickPart = new Sequence(() => {
      membrane == null ? void 0 : membrane.triggerAttackRelease("C1", "8n");
    }, ["C1", null, "C1", null, "C1", null, "C1", null]);
    kickPart.loop = true;
    const hatPart = new Sequence((time) => {
      metal == null ? void 0 : metal.triggerAttackRelease("32n", time);
    }, [null, "C5", null, "C5", null, "C5", null, "C5"]);
    hatPart.loop = true;
    const containerFmPart = new Sequence((time, note) => {
      if (note) containerFm == null ? void 0 : containerFm.triggerAttackRelease(note, "16n", time);
    }, ["C3", "E3", "G3", null, "A3", "G3", "E3", null]);
    containerFmPart.loop = true;
    this.transports.set("container", containerTransport);
    const tankerTransport = getTransport();
    tankerTransport.bpm.value = 140;
    const tankerSynths = this.synths.get("tanker") || [];
    const [tankerMetal, noise, sub] = tankerSynths;
    const industrialPart = new Sequence((time) => {
      tankerMetal == null ? void 0 : tankerMetal.triggerAttackRelease("16n", time);
      sub == null ? void 0 : sub.triggerAttackRelease("C1", "8n", time);
    }, ["C2", "C2", null, "C2", null, "C2", "C2", null]);
    industrialPart.loop = true;
    const noisePart = new Part((time) => {
      noise == null ? void 0 : noise.triggerAttackRelease("16n", time);
    }, [
      { time: "0:2" },
      { time: "1:2" },
      { time: "2:0" },
      { time: "3:0" }
    ]);
    noisePart.loop = true;
    noisePart.loopEnd = "4:0";
    this.transports.set("tanker", tankerTransport);
    const bulkTransport = getTransport();
    bulkTransport.bpm.value = 135;
    const bulkSynths = this.synths.get("bulk") || [];
    const [guitar, bulkBass, bulkMetal] = bulkSynths;
    const riffPart = new Sequence((time, chord) => {
      if (chord) guitar == null ? void 0 : guitar.triggerAttackRelease(chord, "4n", time);
    }, [["E3", "G3", "B3"], null, ["E3", "G3", "B3"], ["D3", "F3", "A3"], null, ["D3", "F3", "A3"], ["C3", "E3", "G3"], null]);
    riffPart.loop = true;
    const bulkDrumPart = new Sequence((time) => {
      bulkMetal == null ? void 0 : bulkMetal.triggerAttackRelease("16n", time);
      bulkBass == null ? void 0 : bulkBass.triggerAttackRelease("E2", "8n", time);
    }, ["E2", null, "E2", "E2", null, "E2", null, "E2"]);
    bulkDrumPart.loop = true;
    this.transports.set("bulk", bulkTransport);
    const lngTransport = getTransport();
    lngTransport.bpm.value = 118;
    const lngSynths = this.synths.get("lng") || [];
    const [coldPad, lngFm] = lngSynths;
    const coldPadPart = new Part((time, value) => {
      coldPad == null ? void 0 : coldPad.triggerAttackRelease(value.notes, value.duration, time, 0.5);
    }, [
      { time: "0:0", notes: ["C3", "E3", "G3"], duration: "2m" },
      { time: "2:0", notes: ["A2", "C3", "E3"], duration: "2m" }
    ]);
    coldPadPart.loop = true;
    coldPadPart.loopEnd = "4:0";
    const lngFmPart = new Sequence((time, note) => {
      if (note) lngFm == null ? void 0 : lngFm.triggerAttackRelease(note, "2n", time);
    }, ["C4", null, "E4", null, "G4", null, "B4", null]);
    lngFmPart.loop = true;
    this.transports.set("lng", lngTransport);
    const roroTransport = getTransport();
    roroTransport.bpm.value = 125;
    const roroSynths = this.synths.get("roro") || [];
    const [, roroBass, roroDrum] = roroSynths;
    const roroBassPart = new Sequence((time, note) => {
      roroBass == null ? void 0 : roroBass.triggerAttackRelease(note, "8n", time);
    }, ["C2", "C2", "G2", "C2", "F2", "F2", "G2", "F2"]);
    roroBassPart.loop = true;
    const roroBeatPart = new Sequence(() => {
      roroDrum == null ? void 0 : roroDrum.triggerAttackRelease("C1", "8n");
    }, ["C1", "C1", null, "C1", null, "C1", "C1", null]);
    roroBeatPart.loop = true;
    this.transports.set("roro", roroTransport);
    const researchTransport = getTransport();
    researchTransport.bpm.value = 110;
    const researchSynths = this.synths.get("research") || [];
    const [sonar, researchPad] = researchSynths;
    const sonarPart = new Sequence((time, note) => {
      if (note) sonar == null ? void 0 : sonar.triggerAttackRelease(note, "8n", time);
    }, ["C5", null, null, null, "C5", null, null, null, "E5", null, null, null, "C5", null, null, null]);
    sonarPart.loop = true;
    const researchPadPart = new Part((time, value) => {
      researchPad == null ? void 0 : researchPad.triggerAttackRelease(value.notes, value.duration, time, 0.4);
    }, [
      { time: "0:0", notes: ["C2", "G2", "C3"], duration: "4m" },
      { time: "4:0", notes: ["F2", "C3", "F3"], duration: "4m" }
    ]);
    researchPadPart.loop = true;
    researchPadPart.loopEnd = "8:0";
    this.transports.set("research", researchTransport);
    const droneshipTransport = getTransport();
    droneshipTransport.bpm.value = 105;
    const droneshipSynths = this.synths.get("droneship") || [];
    const [spacePad, blip, drone] = droneshipSynths;
    const spacePadPart = new Part((time, value) => {
      spacePad == null ? void 0 : spacePad.triggerAttackRelease(value.notes, value.duration, time, 0.3);
    }, [
      { time: "0:0", notes: ["C3", "E3", "G3", "B3"], duration: "4m" },
      { time: "4:0", notes: ["A2", "C3", "E3", "G3"], duration: "4m" }
    ]);
    spacePadPart.loop = true;
    spacePadPart.loopEnd = "8:0";
    const blipPart = new Sequence((time, note) => {
      if (note) blip == null ? void 0 : blip.triggerAttackRelease(note, "16n", time);
    }, [null, null, "C6", null, null, null, "E6", null, null, "G6", null, null, null, null, "C6", null]);
    blipPart.loop = true;
    const dronePart = new Sequence((time, note) => {
      drone == null ? void 0 : drone.triggerAttackRelease(note, "1m", time);
    }, ["C2", "G1", "C2", "F1"]);
    dronePart.loop = true;
    this.transports.set("droneship", droneshipTransport);
  }
  // =========================================================================
  // PUBLIC API
  // =========================================================================
  async startMusic(shipType) {
    await this.initializeAudio();
    const transport = this.transports.get(shipType);
    if (transport) {
      transport.start();
    }
  }
  stopMusic(shipType) {
    const transport = this.transports.get(shipType);
    if (transport) {
      transport.stop();
    }
  }
  stopAllMusic() {
    this.transports.forEach((transport) => transport.stop());
  }
  setBPM(bpm) {
    this.transports.forEach((transport) => {
      transport.bpm.value = bpm;
    });
  }
  getCurrentLyric(shipType) {
    const transport = this.transports.get(shipType);
    if (!transport || transport.state !== "started") return "";
    const lyrics = this.lyrics.get(shipType) || [];
    if (lyrics.length === 0) return "";
    const position = transport.position;
    const currentSeconds = Time(position).toSeconds();
    for (let i = lyrics.length - 1; i >= 0; i--) {
      const lyricTime = Time(lyrics[i].time).toSeconds();
      if (currentSeconds >= lyricTime) {
        this.currentLyricIndex.set(shipType, i);
        return lyrics[i].text;
      }
    }
    return "";
  }
  getLyrics(shipType) {
    return this.lyrics.get(shipType) || [];
  }
  getTransportPosition(shipType) {
    const transport = this.transports.get(shipType);
    return transport ? transport.position : "0:0";
  }
  isPlaying(shipType) {
    const transport = this.transports.get(shipType);
    return transport ? transport.state === "started" : false;
  }
  // =========================================================================
  // CLIMAX - Triggered on v2.0 structural overhaul
  // =========================================================================
  triggerClimax(shipType) {
    console.log(`🎵 MUSIC CLIMAX for ${shipType}!`);
    const transport = this.transports.get(shipType);
    if (!transport) return;
    const originalBPM = transport.bpm.value;
    transport.bpm.value = originalBPM * 1.2;
    const synths = this.synths.get(shipType) || [];
    synths.forEach((synth) => {
      if (synth.volume) {
        synth.volume.rampTo(synth.volume.value + 3, 0.1);
      }
    });
    setTimeout(() => {
      transport.bpm.value = originalBPM;
      synths.forEach((synth) => {
        if (synth.volume) {
          synth.volume.rampTo(synth.volume.value - 3, 1);
        }
      });
    }, 5e3);
  }
  // Cleanup
  dispose() {
    this.stopAllMusic();
    this.synths.forEach((synths) => synths.forEach((s) => s.dispose()));
    this.effects.forEach((effects) => effects.forEach((e) => e.dispose()));
    this.transports.forEach((t) => t.dispose());
  }
}
const musicSystem = new MusicSystem();
class LightingSystem {
  constructor() {
    __publicField(this, "currentShow", {
      isActive: false,
      shipId: null,
      shipType: null,
      startTime: 0,
      duration: 3e4
      // 30 seconds
    });
    __publicField(this, "intensityMultiplier", 1);
    __publicField(this, "beatPulse", 0);
  }
  // ============================================================================
  // HARBOR LIGHT SHOW - Triggered on v2.0 upgrade
  // ============================================================================
  startHarborShow(shipId, shipType) {
    this.currentShow = {
      isActive: true,
      shipId,
      shipType,
      startTime: Date.now(),
      duration: 3e4
    };
    console.log("🎆 HARBOR LIGHT SHOW ACTIVATED!");
    console.log(`   Ship: ${shipId} (${shipType})`);
    console.log("   Duration: 30 seconds");
    console.log("   All LEDs, funnels, deck lights PULSING to beat!");
    setTimeout(() => {
      this.endHarborShow();
    }, this.currentShow.duration);
  }
  endHarborShow() {
    if (this.currentShow.isActive) {
      console.log("🎆 Harbor light show complete!");
      this.currentShow.isActive = false;
      this.currentShow.shipId = null;
      this.currentShow.shipType = null;
    }
  }
  // ============================================================================
  // UPDATE - Call in useFrame
  // ============================================================================
  update(time, bpm) {
    if (this.currentShow.isActive) {
      const elapsed = Date.now() - this.currentShow.startTime;
      const progress = elapsed / this.currentShow.duration;
      const beatDuration = 60 / bpm;
      this.beatPulse = (Math.sin(time * (Math.PI * 2 / beatDuration)) + 1) / 2;
      if (progress < 0.2) {
        this.intensityMultiplier = 1 + progress * 5;
      } else if (progress > 0.8) {
        this.intensityMultiplier = 1 + (1 - progress) * 5;
      } else {
        this.intensityMultiplier = 2;
      }
    } else {
      this.intensityMultiplier = 1;
      this.beatPulse = 0;
    }
  }
  // ============================================================================
  // GETTERS for ship components
  // ============================================================================
  getLightIntensity(baseIntensity) {
    if (!this.currentShow.isActive) return baseIntensity;
    return baseIntensity * this.intensityMultiplier * (1 + this.beatPulse * 0.5);
  }
  getEmissiveColor(baseColor, shipId) {
    if (!this.currentShow.isActive || this.currentShow.shipId !== shipId) {
      return baseColor;
    }
    const hue = Date.now() / 1e3 * 60 % 360;
    return `hsl(${hue}, 100%, 60%)`;
  }
  isShowActive() {
    return this.currentShow.isActive;
  }
  getCurrentShow() {
    return this.currentShow;
  }
  getBeatPulse() {
    return this.beatPulse;
  }
  // ============================================================================
  // CLIMAX TRIGGER - Called from musicSystem
  // ============================================================================
  triggerClimax(shipType) {
    console.log(`🎵 CLIMAX SEQUENCE for ${shipType}!`);
    const originalMultiplier = this.intensityMultiplier;
    this.intensityMultiplier = 3;
    setTimeout(() => {
      this.intensityMultiplier = originalMultiplier;
    }, 500);
  }
  // ============================================================================
  // WEATHER LIGHTING - Get lighting config based on weather
  // ============================================================================
  getWeatherLighting(weather) {
    switch (weather) {
      case "storm":
        return {
          sunIntensity: 0.2,
          sunColor: "#444466",
          ambientIntensity: 0.15,
          ambientColor: "#1a1a2e",
          sideLightIntensity: 1.5,
          dramatic: true
        };
      case "rain":
        return {
          sunIntensity: 0.4,
          sunColor: "#666688",
          ambientIntensity: 0.3,
          ambientColor: "#2a2a3e",
          sideLightIntensity: 0.8,
          dramatic: false
        };
      case "fog":
        return {
          sunIntensity: 0.6,
          sunColor: "#8888aa",
          ambientIntensity: 0.4,
          ambientColor: "#3a3a4e",
          sideLightIntensity: 0.5,
          dramatic: false
        };
      default:
        return {
          sunIntensity: 1.2,
          sunColor: "#fff8e7",
          ambientIntensity: 0.6,
          ambientColor: "#ffffff",
          sideLightIntensity: 0.5,
          dramatic: false
        };
    }
  }
}
const lightingSystem = new LightingSystem();
const WEATHER_CONFIGS = {
  clear: {
    particleCount: 0,
    fogDensity: 0.02,
    skyColor: "#87CEEB",
    ambientLight: 0.6,
    waveHeight: 0.5,
    emissiveReduction: 0,
    departureDelay: 0,
    returnSpeedModifier: 1,
    musicTempoModifier: 1,
    lightningChance: 0
  },
  rain: {
    particleCount: 1e3,
    fogDensity: 0.04,
    skyColor: "#4a5568",
    ambientLight: 0.4,
    waveHeight: 0.8,
    emissiveReduction: 0.2,
    // -20% LED intensity
    departureDelay: 0,
    returnSpeedModifier: 1,
    musicTempoModifier: 0.95,
    lightningChance: 0.1
  },
  fog: {
    particleCount: 200,
    fogDensity: 0.12,
    skyColor: "#718096",
    ambientLight: 0.25,
    waveHeight: 0.3,
    emissiveReduction: 0.3,
    departureDelay: 5e3,
    // 5 second delay
    returnSpeedModifier: 0.7,
    // 30% slower
    musicTempoModifier: 0.9,
    lightningChance: 0
  },
  storm: {
    particleCount: 3e3,
    fogDensity: 0.08,
    skyColor: "#1a202c",
    ambientLight: 0.15,
    waveHeight: 1.5,
    emissiveReduction: 0.1,
    departureDelay: -1,
    // Special: 50% cancel chance
    returnSpeedModifier: 0.5,
    musicTempoModifier: 1.15,
    // Faster beat!
    lightningChance: 0.3
  }
};
class WeatherSystem {
  constructor() {
    __publicField(this, "current", {
      state: "clear",
      intensity: 0,
      startedAt: Date.now(),
      nextChange: Date.now() + this.getRandomInterval()
    });
    __publicField(this, "lightningActive", false);
    __publicField(this, "lastLightning", 0);
    this.scheduleWeatherChange();
  }
  // ============================================================================
  // WEATHER STATE MANAGEMENT
  // ============================================================================
  setWeather(state, intensity = 0.5) {
    const oldState = this.current.state;
    this.current = {
      state,
      intensity,
      startedAt: Date.now(),
      nextChange: Date.now() + this.getRandomInterval()
    };
    console.log(`🌤️ Weather changed: ${oldState} → ${state}`);
    console.log(`   Effects: ${this.getEffectDescription(state)}`);
    const store = useGameStore.getState();
    store.setWeather(state);
    this.updateMusicTempo(state);
  }
  getWeather() {
    return this.current;
  }
  getWeatherEffects() {
    return WEATHER_CONFIGS[this.current.state];
  }
  // ============================================================================
  // RANDOM WEATHER CHANGES (every 3-5 minutes)
  // ============================================================================
  getRandomInterval() {
    return Math.floor(Math.random() * 12e4) + 18e4;
  }
  scheduleWeatherChange() {
    setInterval(() => {
      const now = Date.now();
      if (now >= this.current.nextChange) {
        this.changeToRandomWeather();
      }
    }, 1e4);
  }
  changeToRandomWeather() {
    const states = ["clear", "rain", "fog", "storm"];
    const weights = [0.4, 0.3, 0.2, 0.1];
    const random = Math.random();
    let cumulative = 0;
    let newState = "clear";
    for (let i = 0; i < states.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        newState = states[i];
        break;
      }
    }
    if (newState !== this.current.state) {
      this.setWeather(newState, Math.random() * 0.5 + 0.3);
    } else {
      this.current.nextChange = Date.now() + this.getRandomInterval();
    }
  }
  // ============================================================================
  // FLEET EFFECTS
  // ============================================================================
  shouldCancelDeparture() {
    if (this.current.state !== "storm") return false;
    return Math.random() < 0.5;
  }
  getReturnSpeedModifier() {
    return WEATHER_CONFIGS[this.current.state].returnSpeedModifier;
  }
  getEmissiveReduction() {
    return WEATHER_CONFIGS[this.current.state].emissiveReduction;
  }
  // ============================================================================
  // LIGHTNING (storm only)
  // ============================================================================
  updateLightning() {
    if (this.current.state !== "storm") {
      this.lightningActive = false;
      return;
    }
    const now = Date.now();
    const config = WEATHER_CONFIGS.storm;
    if (!this.lightningActive && Math.random() < config.lightningChance / 60) {
      this.triggerLightning();
    }
    if (this.lightningActive && now - this.lastLightning > 200) {
      this.lightningActive = false;
    }
  }
  triggerLightning() {
    this.lightningActive = true;
    this.lastLightning = Date.now();
    console.log("⚡ LIGHTNING FLASH!");
  }
  isLightningActive() {
    return this.lightningActive;
  }
  // ============================================================================
  // VISUAL GETTERS
  // ============================================================================
  getSkyColor() {
    return WEATHER_CONFIGS[this.current.state].skyColor;
  }
  getFogDensity() {
    return WEATHER_CONFIGS[this.current.state].fogDensity;
  }
  getAmbientLight() {
    return WEATHER_CONFIGS[this.current.state].ambientLight;
  }
  getWaveHeight() {
    return WEATHER_CONFIGS[this.current.state].waveHeight;
  }
  // ============================================================================
  // MUSIC INTEGRATION
  // ============================================================================
  updateMusicTempo(weather) {
    const modifier = WEATHER_CONFIGS[weather].musicTempoModifier;
    console.log(`🎵 Music tempo adjusted: ${Math.round(modifier * 100)}%`);
    const store = useGameStore.getState();
    const baseBPM = store.bpm;
    store.setBPM(Math.round(baseBPM * modifier));
  }
  // ============================================================================
  // HELPERS
  // ============================================================================
  getEffectDescription(state) {
    const descriptions = {
      clear: "Perfect visibility, normal operations",
      rain: "LEDs -20% intensity, wave boost",
      fog: "Reduced visibility, 30% slower returns",
      storm: "50% departure cancel, lightning, faster music!"
    };
    return descriptions[state];
  }
  // Manual control
  forceWeather(state) {
    console.log(`🌤️ Manual weather override: ${state}`);
    this.setWeather(state, 0.7);
  }
}
const weatherSystem = new WeatherSystem();
function createOrbitPath(center, radius, height, variations) {
  const points = [];
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const angle = i / segments * Math.PI * 2;
    const r = radius + Math.sin(i * variations) * 5;
    const h = height + Math.cos(i * variations * 0.5) * 8;
    points.push(new Vector3(
      center.x + Math.cos(angle) * r,
      center.y + h,
      center.z + Math.sin(angle) * r
    ));
  }
  points.push(points[0].clone());
  return new CatmullRomCurve3(points, true);
}
function useCinematicCamera() {
  const { camera } = useThree();
  const ships2 = useGameStore((state) => state.ships);
  const currentShipId = useGameStore((state) => state.currentShipId);
  const spectatorState = useGameStore((state) => state.spectatorState);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const bpm = useGameStore((state) => state.bpm);
  const currentShip = ships2.find((s) => s.id === currentShipId);
  const currentPosRef = reactExports.useRef(new Vector3());
  const currentLookRef = reactExports.useRef(new Vector3());
  const targetPosRef = reactExports.useRef(new Vector3());
  const targetLookRef = reactExports.useRef(new Vector3());
  const pathProgressRef = reactExports.useRef(0);
  const pathCurveRef = reactExports.useRef(null);
  const transitionProgressRef = reactExports.useRef(1);
  const lastModeRef = reactExports.useRef("orbit");
  const shakeRef = reactExports.useRef({ x: 0, y: 0, intensity: 0 });
  const getCameraTarget = reactExports.useCallback((mode, ship) => {
    if (!ship) {
      return {
        position: new Vector3(30, 20, 30),
        lookAt: new Vector3(0, 0, 0),
        fov: 50
      };
    }
    const shipPos = new Vector3(...ship.position);
    const shipLength = ship.length || 50;
    const shipWidth = shipLength * 0.15;
    switch (mode) {
      case "crane-cockpit":
        return {
          position: new Vector3(
            Math.sin(0.2) * 18,
            24,
            Math.cos(0.2) * 8
          ),
          lookAt: new Vector3(
            shipPos.x + Math.sin(Date.now() * 1e-3) * 5,
            shipPos.y + 10,
            shipPos.z
          ),
          fov: 60
        };
      case "crane-shoulder":
        return {
          position: new Vector3(
            Math.sin(0.2) * 22,
            20,
            Math.cos(0.2) * 12
          ),
          lookAt: new Vector3(
            shipPos.x,
            shipPos.y + 5,
            shipPos.z
          ),
          fov: 55
        };
      case "crane-top":
        return {
          position: new Vector3(
            Math.sin(0.2) * 15,
            30,
            Math.cos(0.2) * 5
          ),
          lookAt: shipPos,
          fov: 50
        };
      case "ship-low":
        return {
          position: new Vector3(
            shipPos.x - shipLength * 0.6,
            shipPos.y + 3,
            shipPos.z + shipWidth * 2
          ),
          lookAt: new Vector3(
            shipPos.x,
            shipPos.y + 15,
            shipPos.z
          ),
          fov: 45
        };
      case "ship-aerial":
        return {
          position: new Vector3(
            shipPos.x,
            shipPos.y + 40,
            shipPos.z + 50
          ),
          lookAt: shipPos,
          fov: 40
        };
      case "ship-water":
        return {
          position: new Vector3(
            shipPos.x - shipLength * 0.4,
            -1,
            shipPos.z + shipWidth * 1.5
          ),
          lookAt: new Vector3(
            shipPos.x + shipLength * 0.3,
            shipPos.y + 8,
            shipPos.z
          ),
          fov: 55
        };
      case "ship-rig":
        return {
          position: new Vector3(
            shipPos.x,
            shipPos.y + 20,
            shipPos.z + shipWidth * 0.8
          ),
          lookAt: new Vector3(
            shipPos.x,
            shipPos.y + 8,
            shipPos.z
          ),
          fov: 50
        };
      default:
        return {
          position: new Vector3(30, 20, 30),
          lookAt: shipPos,
          fov: 50
        };
    }
  }, []);
  reactExports.useEffect(() => {
    if (spectatorState.isActive && spectatorState.targetShipId) {
      const ship = ships2.find((s) => s.id === spectatorState.targetShipId);
      if (ship) {
        const shipPos = new Vector3(...ship.position);
        const radius = ship.type === "tanker" ? 50 : ship.type === "container" ? 40 : 35;
        const height = 15;
        pathCurveRef.current = createOrbitPath(shipPos, radius, height, 2);
        pathProgressRef.current = 0;
      }
    }
  }, [spectatorState.isActive, spectatorState.targetShipId, ships2]);
  reactExports.useEffect(() => {
    if (cameraMode !== lastModeRef.current) {
      transitionProgressRef.current = 0;
      lastModeRef.current = cameraMode;
    }
  }, [cameraMode]);
  useFrame((state, delta) => {
    if (!currentShip) return;
    const time = state.clock.elapsedTime;
    const beatDuration = 60 / bpm;
    const beatPhase = time % beatDuration / beatDuration;
    if (beatPhase < 0.15) {
      shakeRef.current.intensity = 0.3;
    } else {
      shakeRef.current.intensity = MathUtils.lerp(shakeRef.current.intensity, 0, 0.1);
    }
    shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity;
    shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity;
    let target;
    if (spectatorState.isActive && pathCurveRef.current) {
      pathProgressRef.current += delta * 0.08;
      if (pathProgressRef.current > 1) pathProgressRef.current = 0;
      const point = pathCurveRef.current.getPoint(pathProgressRef.current);
      const tangent = pathCurveRef.current.getTangent(pathProgressRef.current);
      target = {
        position: point,
        lookAt: new Vector3(...currentShip.position).add(
          new Vector3(0, 5, 0).add(tangent.multiplyScalar(-10))
        ),
        fov: 45
      };
      const pausePoint = Math.floor(pathProgressRef.current * 4) / 4;
      if (Math.abs(pathProgressRef.current - pausePoint) < 0.05) {
        pathProgressRef.current -= delta * 0.04;
      }
    } else if (cameraMode.startsWith("crane-") || cameraMode.startsWith("ship-")) {
      target = getCameraTarget(cameraMode, currentShip);
      if (beatPhase < 0.1) {
        target.fov *= 0.98;
      }
    } else {
      return;
    }
    if (transitionProgressRef.current < 1) {
      transitionProgressRef.current += delta * 2;
      transitionProgressRef.current = Math.min(1, transitionProgressRef.current);
      const t = transitionProgressRef.current;
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      targetPosRef.current.lerpVectors(currentPosRef.current, target.position, eased);
      targetLookRef.current.lerpVectors(currentLookRef.current, target.lookAt, eased);
    } else {
      targetPosRef.current.copy(target.position);
      targetLookRef.current.copy(target.lookAt);
    }
    const shakeX = shakeRef.current.x;
    const shakeY = shakeRef.current.y;
    const lerpFactor = spectatorState.isActive ? 0.03 : 0.08;
    camera.position.lerp(
      new Vector3(
        targetPosRef.current.x + shakeX,
        targetPosRef.current.y + shakeY,
        targetPosRef.current.z
      ),
      lerpFactor
    );
    const currentLook = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
    currentLook.lerp(targetLookRef.current, lerpFactor);
    camera.lookAt(currentLook);
    const targetFOV = target.fov + (beatPhase < 0.1 ? -2 : 0);
    if (camera.fov !== void 0) {
      const perspCam = camera;
      perspCam.fov = MathUtils.lerp(perspCam.fov, targetFOV, 0.05);
      perspCam.updateProjectionMatrix();
    }
    currentPosRef.current.copy(camera.position);
    currentLookRef.current.copy(currentLook);
  });
  return {
    getCameraTarget,
    shakeIntensity: shakeRef.current.intensity,
    isTransitioning: transitionProgressRef.current < 1
  };
}
let globalAudioData = {
  bass: 0,
  lowMid: 0,
  mid: 0,
  highMid: 0,
  treble: 0,
  waveform: new Float32Array(256),
  envelope: 0,
  beat: false,
  beatIntensity: 0,
  beatPhase: 0,
  rms: 0,
  peak: 0,
  energy: 0,
  spectralCentroid: 0.5
};
class AudioVisualSync {
  constructor() {
    __publicField(this, "fft", null);
    __publicField(this, "waveform", null);
    __publicField(this, "meter", null);
    __publicField(this, "filterBass", null);
    __publicField(this, "filterLowMid", null);
    __publicField(this, "filterMid", null);
    __publicField(this, "filterHighMid", null);
    __publicField(this, "filterTreble", null);
    __publicField(this, "meters", /* @__PURE__ */ new Map());
    // Beat detection
    __publicField(this, "lastBeatTime", 0);
    __publicField(this, "beatThreshold", 0.6);
    __publicField(this, "beatDecay", 0.95);
    __publicField(this, "beatEnergy", 0);
    __publicField(this, "bpm", 128);
    __publicField(this, "isInitialized", false);
    // Callbacks for reactive systems
    __publicField(this, "onBeatCallbacks", /* @__PURE__ */ new Set());
    __publicField(this, "onFrameCallbacks", /* @__PURE__ */ new Set());
  }
  // Initialize audio analysis chain
  async initialize() {
    if (this.isInitialized) return;
    await start();
    this.fft = new FFT(2048);
    this.waveform = new Waveform(256);
    this.meter = new Meter();
    this.filterBass = new Filter(80, "lowpass", -24);
    this.filterLowMid = new Filter(270, "peaking", -12);
    this.filterLowMid.Q.value = 2;
    this.filterMid = new Filter(1500, "peaking", -12);
    this.filterMid.Q.value = 2;
    this.filterHighMid = new Filter(3900, "peaking", -12);
    this.filterHighMid.Q.value = 2;
    this.filterTreble = new Filter(1e4, "highpass", -24);
    this.meters.set("bass", new Meter());
    this.meters.set("lowMid", new Meter());
    this.meters.set("mid", new Meter());
    this.meters.set("highMid", new Meter());
    this.meters.set("treble", new Meter());
    const bassMeter = this.meters.get("bass");
    const lowMidMeter = this.meters.get("lowMid");
    const midMeter = this.meters.get("mid");
    const highMidMeter = this.meters.get("highMid");
    const trebleMeter = this.meters.get("treble");
    if (bassMeter && this.filterBass) this.filterBass.connect(bassMeter);
    if (lowMidMeter && this.filterLowMid) this.filterLowMid.connect(lowMidMeter);
    if (midMeter && this.filterMid) this.filterMid.connect(midMeter);
    if (highMidMeter && this.filterHighMid) this.filterHighMid.connect(highMidMeter);
    if (trebleMeter && this.filterTreble) this.filterTreble.connect(trebleMeter);
    Destination.connect(this.fft);
    if (this.waveform) Destination.connect(this.waveform);
    if (this.meter) Destination.connect(this.meter);
    if (this.filterBass) Destination.connect(this.filterBass);
    if (this.filterLowMid) Destination.connect(this.filterLowMid);
    if (this.filterMid) Destination.connect(this.filterMid);
    if (this.filterHighMid) Destination.connect(this.filterHighMid);
    if (this.filterTreble) Destination.connect(this.filterTreble);
    this.isInitialized = true;
    console.log("🎵 AudioVisualSync initialized");
  }
  // Analyze audio and update global state
  analyze(time) {
    var _a2, _b2, _c, _d, _e;
    if (!this.isInitialized || !this.fft || !this.waveform || !this.meter) {
      return globalAudioData;
    }
    const fftValues = this.fft.getValue();
    const waveValues = this.waveform.getValue();
    const rms = this.meter.getValue();
    const binSize = 44100 / 2048;
    const bassBins = fftValues.slice(1, 7);
    const bass = this.calculateBandEnergy(bassBins);
    const lowMidBins = fftValues.slice(7, 19);
    const lowMid = this.calculateBandEnergy(lowMidBins);
    const midBins = fftValues.slice(19, 121);
    const mid = this.calculateBandEnergy(midBins);
    const highMidBins = fftValues.slice(121, 242);
    const highMid = this.calculateBandEnergy(highMidBins);
    const trebleBins = fftValues.slice(242, 930);
    const treble = this.calculateBandEnergy(trebleBins);
    const bassMeter = ((_a2 = this.meters.get("bass")) == null ? void 0 : _a2.getValue()) || 0;
    const lowMidMeter = ((_b2 = this.meters.get("lowMid")) == null ? void 0 : _b2.getValue()) || 0;
    const midMeter = ((_c = this.meters.get("mid")) == null ? void 0 : _c.getValue()) || 0;
    const highMidMeter = ((_d = this.meters.get("highMid")) == null ? void 0 : _d.getValue()) || 0;
    const trebleMeter = ((_e = this.meters.get("treble")) == null ? void 0 : _e.getValue()) || 0;
    const bassFinal = Math.max(bass, Math.abs(bassMeter));
    const lowMidFinal = Math.max(lowMid, Math.abs(lowMidMeter));
    const midFinal = Math.max(mid, Math.abs(midMeter));
    const highMidFinal = Math.max(highMid, Math.abs(highMidMeter));
    const trebleFinal = Math.max(treble, Math.abs(trebleMeter));
    const envelope = Math.min(1, rms * 2);
    const peak = Math.max(...waveValues.map((v) => Math.abs(v)));
    let centroidSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < fftValues.length; i++) {
      const freq = i * binSize;
      const mag = Math.pow(10, fftValues[i] / 20);
      centroidSum += freq * mag;
      magnitudeSum += mag;
    }
    const spectralCentroid = magnitudeSum > 0 ? centroidSum / magnitudeSum / 1e4 : 0.5;
    const energy = (bassFinal + lowMidFinal + midFinal + highMidFinal + trebleFinal) / 5;
    this.beatEnergy = this.beatEnergy * this.beatDecay + bassFinal * (1 - this.beatDecay);
    const beatDiff = bassFinal - this.beatEnergy;
    const isBeat = beatDiff > this.beatThreshold && bassFinal > 0.3;
    const now = time;
    let beatPhase = 0;
    if (isBeat && now - this.lastBeatTime > 0.2) {
      this.lastBeatTime = now;
      this.onBeatCallbacks.forEach((cb) => cb(bassFinal));
      beatPhase = 0;
    } else {
      const timeSinceBeat = now - this.lastBeatTime;
      const beatDuration = 60 / this.bpm;
      beatPhase = Math.min(1, timeSinceBeat / beatDuration);
    }
    globalAudioData = {
      bass: Math.min(1, bassFinal * 2),
      // Scale up for better visibility
      lowMid: Math.min(1, lowMidFinal * 2),
      mid: Math.min(1, midFinal * 2),
      highMid: Math.min(1, highMidFinal * 2),
      treble: Math.min(1, trebleFinal * 3),
      waveform: waveValues,
      envelope: Math.max(0, envelope),
      beat: isBeat,
      beatIntensity: bassFinal,
      beatPhase,
      rms: Math.max(0, rms),
      peak: Math.min(1, peak),
      energy: Math.min(1, energy * 1.5),
      spectralCentroid: Math.min(1, spectralCentroid)
    };
    this.onFrameCallbacks.forEach((cb) => cb(globalAudioData));
    return globalAudioData;
  }
  calculateBandEnergy(bins) {
    if (bins.length === 0) return 0;
    const linearValues = Array.from(bins).map((v) => Math.pow(10, v / 20));
    const average = linearValues.reduce((a, b) => a + b, 0) / linearValues.length;
    return 20 * Math.log10(average + 1e-4) + 100;
  }
  // Set BPM for beat detection
  setBPM(bpm) {
    this.bpm = bpm;
  }
  // Subscribe to beat events
  onBeat(callback) {
    this.onBeatCallbacks.add(callback);
    return () => {
      this.onBeatCallbacks.delete(callback);
    };
  }
  // Subscribe to frame updates
  onFrame(callback) {
    this.onFrameCallbacks.add(callback);
    return () => {
      this.onFrameCallbacks.delete(callback);
    };
  }
  // Cleanup
  dispose() {
    var _a2, _b2, _c, _d, _e, _f, _g, _h;
    (_a2 = this.fft) == null ? void 0 : _a2.dispose();
    (_b2 = this.waveform) == null ? void 0 : _b2.dispose();
    (_c = this.meter) == null ? void 0 : _c.dispose();
    (_d = this.filterBass) == null ? void 0 : _d.dispose();
    (_e = this.filterLowMid) == null ? void 0 : _e.dispose();
    (_f = this.filterMid) == null ? void 0 : _f.dispose();
    (_g = this.filterHighMid) == null ? void 0 : _g.dispose();
    (_h = this.filterTreble) == null ? void 0 : _h.dispose();
    this.meters.forEach((m) => m.dispose());
    this.onBeatCallbacks.clear();
    this.onFrameCallbacks.clear();
  }
}
const audioVisualSync = new AudioVisualSync();
function useAudioVisualSync() {
  const [audioData, setAudioData] = reactExports.useState(globalAudioData);
  const [isInitialized, setIsInitialized] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let mounted = true;
    const init = async () => {
      await audioVisualSync.initialize();
      if (mounted) setIsInitialized(true);
    };
    init();
    const unsubscribe = audioVisualSync.onFrame((data) => {
      if (mounted) setAudioData(data);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);
  const bpm = useGameStore((state) => state.bpm);
  reactExports.useEffect(() => {
    audioVisualSync.setBPM(bpm);
  }, [bpm]);
  useFrame((state) => {
    if (isInitialized) {
      audioVisualSync.analyze(state.clock.elapsedTime);
    }
  });
  return { audioData, isInitialized };
}
const ships = [
  {
    id: "cruise",
    version: "1.0",
    name: 'Cruise Liner "Aurora Glow" v1.0',
    scale: 1.8,
    baseColor: "#0a2540",
    parts: [
      {
        id: "hull",
        type: "box",
        position: [
          0,
          -2,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          18,
          6,
          80
        ],
        material: {
          emissive: "#112244"
        }
      },
      {
        id: "deck1",
        type: "box",
        position: [
          0,
          2,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          16,
          3,
          70
        ]
      },
      {
        id: "deck2",
        type: "box",
        position: [
          0,
          5,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          14,
          3,
          60
        ]
      },
      {
        id: "deck3",
        type: "box",
        position: [
          0,
          8,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          12,
          3,
          50
        ]
      },
      {
        id: "bridge",
        type: "box",
        position: [
          0,
          11,
          -18
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          10,
          6,
          12
        ]
      },
      {
        id: "funnel1",
        type: "cylinder",
        position: [
          -5,
          13,
          -10
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          2,
          8,
          2
        ],
        material: {
          emissive: "#ffaa00"
        }
      },
      {
        id: "funnel2",
        type: "cylinder",
        position: [
          5,
          13,
          -10
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          2,
          8,
          2
        ],
        material: {
          emissive: "#ffaa00"
        }
      },
      {
        id: "bow",
        type: "cone",
        position: [
          0,
          -1,
          38
        ],
        rotation: [
          1.57,
          0,
          0
        ],
        size: [
          8,
          12,
          8
        ]
      }
    ],
    attachmentPoints: [
      "balcony0",
      "balcony1",
      "balcony5",
      "balcony6",
      "funnel1",
      "funnel2"
    ],
    contributor: "Grok + Kimi",
    added: "2026-03-08",
    notes: "Multi-deck with glowing balconies — perfect for LED light shows"
  },
  {
    id: "container",
    version: "1.0",
    name: 'Container Vessel "StackMaster 4000" v1.0',
    scale: 1.6,
    baseColor: "#1a1a2e",
    parts: [
      {
        id: "hull",
        type: "box",
        position: [
          0,
          -1,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          24,
          5,
          110
        ],
        material: {
          emissive: "#0a0a1a"
        }
      },
      {
        id: "deck",
        type: "box",
        position: [
          0,
          2,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          23,
          0.5,
          108
        ]
      },
      {
        id: "bridge",
        type: "box",
        position: [
          -8,
          8,
          30
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          10,
          10,
          14
        ],
        material: {
          emissive: "#2a2a3e"
        }
      },
      {
        id: "mast",
        type: "cylinder",
        position: [
          -8,
          15,
          30
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.5,
          6,
          0.5
        ],
        material: {
          emissive: "#ff0000"
        }
      },
      {
        id: "crane1",
        type: "box",
        position: [
          -10,
          6,
          -25
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          1.5,
          12,
          1.5
        ],
        material: {
          emissive: "#ff8800"
        }
      },
      {
        id: "crane1arm",
        type: "box",
        position: [
          -5,
          11,
          -25
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          10,
          0.8,
          0.8
        ],
        material: {
          emissive: "#ffaa00"
        }
      },
      {
        id: "crane2",
        type: "box",
        position: [
          10,
          6,
          -15
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          1.5,
          12,
          1.5
        ],
        material: {
          emissive: "#ff8800"
        }
      },
      {
        id: "crane2arm",
        type: "box",
        position: [
          5,
          11,
          -15
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          10,
          0.8,
          0.8
        ],
        material: {
          emissive: "#ffaa00"
        }
      },
      {
        id: "ledStripL",
        type: "box",
        position: [
          -11,
          3,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.3,
          0.3,
          100
        ],
        material: {
          emissive: "#00ffff"
        }
      },
      {
        id: "ledStripR",
        type: "box",
        position: [
          11,
          3,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.3,
          0.3,
          100
        ],
        material: {
          emissive: "#00ffff"
        }
      },
      {
        id: "stack1",
        type: "box",
        position: [
          -7,
          5,
          -35
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          7,
          7,
          9
        ],
        material: {
          emissive: "#00ff88"
        }
      },
      {
        id: "stack2",
        type: "box",
        position: [
          7,
          4,
          -20
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          7,
          5,
          9
        ],
        material: {
          emissive: "#ff6b6b"
        }
      },
      {
        id: "stack3",
        type: "box",
        position: [
          -7,
          6,
          -5
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          7,
          9,
          9
        ],
        material: {
          emissive: "#4ecdc4"
        }
      },
      {
        id: "stack4",
        type: "box",
        position: [
          7,
          5,
          10
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          7,
          7,
          9
        ],
        material: {
          emissive: "#ffe66d"
        }
      },
      {
        id: "stack5",
        type: "box",
        position: [
          -7,
          4,
          25
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          7,
          5,
          9
        ],
        material: {
          emissive: "#ff00ff"
        }
      },
      {
        id: "stack6",
        type: "box",
        position: [
          7,
          6,
          40
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          7,
          8,
          9
        ],
        material: {
          emissive: "#00aaff"
        }
      }
    ],
    attachmentPoints: [
      "stack1",
      "stack2",
      "stack3",
      "stack4",
      "stack5",
      "stack6",
      "crane1",
      "crane2",
      "mast"
    ],
    contributor: "Agent Swarm - Ship Designer",
    added: "2026-03-08",
    notes: "Mega container ship with LED deck strips and 6 colorful container stacks"
  },
  {
    id: "tanker",
    version: "1.0",
    name: 'Oil Tanker "Black Pearl" v1.0',
    scale: 1.4,
    baseColor: "#0f0f1a",
    parts: [
      {
        id: "hull",
        type: "box",
        position: [
          0,
          -3,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          22,
          10,
          130
        ],
        material: {
          emissive: "#0a0a12"
        }
      },
      {
        id: "bulbousBow",
        type: "cone",
        position: [
          0,
          -2,
          65
        ],
        rotation: [
          1.57,
          0,
          0
        ],
        size: [
          12,
          20,
          12
        ]
      },
      {
        id: "deck",
        type: "box",
        position: [
          0,
          2.5,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          21,
          0.5,
          128
        ]
      },
      {
        id: "superstructure",
        type: "box",
        position: [
          0,
          10,
          40
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          16,
          12,
          24
        ],
        material: {
          emissive: "#1a1a2e"
        }
      },
      {
        id: "bridge",
        type: "box",
        position: [
          0,
          16,
          42
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          12,
          8,
          10
        ]
      },
      {
        id: "flareStack",
        type: "cylinder",
        position: [
          -7,
          20,
          35
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          2,
          16,
          2
        ],
        material: {
          emissive: "#ff2200"
        }
      },
      {
        id: "flareTip",
        type: "cone",
        position: [
          -7,
          28,
          35
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          3,
          6,
          3
        ],
        material: {
          emissive: "#ff8800"
        }
      },
      {
        id: "pipe1",
        type: "cylinder",
        position: [
          5,
          5,
          -10
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.8,
          8,
          0.8
        ],
        material: {
          emissive: "#444455"
        }
      },
      {
        id: "pipe2",
        type: "cylinder",
        position: [
          5,
          5,
          10
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.8,
          8,
          0.8
        ],
        material: {
          emissive: "#444455"
        }
      },
      {
        id: "pipe3",
        type: "cylinder",
        position: [
          -5,
          5,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.8,
          8,
          0.8
        ],
        material: {
          emissive: "#444455"
        }
      },
      {
        id: "hatch1",
        type: "box",
        position: [
          0,
          3,
          -30
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          14,
          0.8,
          18
        ]
      },
      {
        id: "hatch2",
        type: "box",
        position: [
          0,
          3,
          -5
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          14,
          0.8,
          18
        ]
      },
      {
        id: "hatch3",
        type: "box",
        position: [
          0,
          3,
          20
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          14,
          0.8,
          18
        ]
      },
      {
        id: "hatch4",
        type: "box",
        position: [
          0,
          3,
          45
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          14,
          0.8,
          18
        ]
      },
      {
        id: "railingL",
        type: "box",
        position: [
          -10,
          4,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.3,
          1,
          120
        ],
        material: {
          emissive: "#666677"
        }
      },
      {
        id: "railingR",
        type: "box",
        position: [
          10,
          4,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.3,
          1,
          120
        ],
        material: {
          emissive: "#666677"
        }
      }
    ],
    attachmentPoints: [
      "flareStack",
      "flareTip",
      "hatch1",
      "hatch2",
      "hatch3",
      "hatch4",
      "bridge",
      "railingL",
      "railingR"
    ],
    contributor: "Agent Swarm - Ship Designer",
    added: "2026-03-08",
    notes: "VLCC supertanker with bulbous bow, flare stack, pipe arrays and deck railings"
  },
  {
    id: "bulk",
    version: "1.0",
    name: 'Capesize Bulk Carrier "Iron Mountain" v1.0',
    scale: 1.9,
    baseColor: "#2d3436",
    parts: [
      {
        id: "hull",
        type: "box",
        position: [
          0,
          -4,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          46,
          14,
          145
        ],
        material: {
          emissive: "#1a1f21",
          roughness: 0.8
        }
      },
      {
        id: "bulbousBow",
        type: "cone",
        position: [
          0,
          -2,
          72
        ],
        rotation: [
          1.57,
          0,
          0
        ],
        size: [
          16,
          25,
          16
        ],
        material: {
          roughness: 0.7
        }
      },
      {
        id: "forecastle",
        type: "box",
        position: [
          0,
          4,
          -60
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          40,
          6,
          20
        ],
        material: {
          emissive: "#252b2d"
        }
      },
      {
        id: "deck",
        type: "box",
        position: [
          0,
          3.5,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          44,
          0.5,
          140
        ],
        material: {
          roughness: 0.9
        }
      },
      {
        id: "hatch1",
        type: "box",
        position: [
          0,
          4.5,
          -40
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          36,
          2,
          20
        ],
        material: {
          emissive: "#3d4446"
        }
      },
      {
        id: "hatch2",
        type: "box",
        position: [
          0,
          4.5,
          -12
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          36,
          2,
          20
        ],
        material: {
          emissive: "#3d4446"
        }
      },
      {
        id: "hatch3",
        type: "box",
        position: [
          0,
          4.5,
          16
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          36,
          2,
          20
        ],
        material: {
          emissive: "#3d4446"
        }
      },
      {
        id: "hatch4",
        type: "box",
        position: [
          0,
          4.5,
          44
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          36,
          2,
          20
        ],
        material: {
          emissive: "#3d4446"
        }
      },
      {
        id: "superstructure",
        type: "box",
        position: [
          0,
          12,
          -55
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          38,
          14,
          16
        ],
        material: {
          emissive: "#2a3032"
        }
      },
      {
        id: "bridge",
        type: "box",
        position: [
          0,
          20,
          -58
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          30,
          8,
          10
        ]
      },
      {
        id: "funnel",
        type: "cylinder",
        position: [
          -12,
          22,
          -52
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          3,
          10,
          3
        ],
        material: {
          emissive: "#ff4400"
        }
      },
      {
        id: "crane1",
        type: "box",
        position: [
          -20,
          10,
          -35
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          2,
          16,
          2
        ],
        material: {
          emissive: "#ffaa00"
        }
      },
      {
        id: "crane2",
        type: "box",
        position: [
          20,
          10,
          -7
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          2,
          16,
          2
        ],
        material: {
          emissive: "#ffaa00"
        }
      },
      {
        id: "crane3",
        type: "box",
        position: [
          -20,
          10,
          21
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          2,
          16,
          2
        ],
        material: {
          emissive: "#ffaa00"
        }
      },
      {
        id: "crane4",
        type: "box",
        position: [
          20,
          10,
          49
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          2,
          16,
          2
        ],
        material: {
          emissive: "#ffaa00"
        }
      }
    ],
    attachmentPoints: [
      "hatch1",
      "hatch2",
      "hatch3",
      "hatch4",
      "crane1",
      "crane2",
      "crane3",
      "crane4",
      "funnel"
    ],
    contributor: "Scientific Research Team",
    added: "2026-03-15",
    notes: "Capesize bulk carrier (170,000 DWT, 290m LOA) with 9 cargo holds, 4 deck cranes. Transports iron ore, coal, grain. Too large for Panama Canal - routes via Cape Horn or Cape of Good Hope."
  },
  {
    id: "lng",
    version: "1.0",
    name: 'Q-Max LNG Carrier "Cryo Titan" v1.0',
    scale: 2,
    baseColor: "#1e3a5f",
    parts: [
      {
        id: "hull",
        type: "box",
        position: [
          0,
          -3,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          55,
          12,
          172
        ],
        material: {
          emissive: "#0f1d2f",
          metalness: 0.6
        }
      },
      {
        id: "membraneTank1",
        type: "box",
        position: [
          0,
          6,
          -55
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          48,
          14,
          45
        ],
        material: {
          emissive: "#00aaff",
          roughness: 0.3
        }
      },
      {
        id: "membraneTank2",
        type: "box",
        position: [
          0,
          6,
          -5
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          48,
          14,
          45
        ],
        material: {
          emissive: "#0088cc",
          roughness: 0.3
        }
      },
      {
        id: "membraneTank3",
        type: "box",
        position: [
          0,
          6,
          45
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          48,
          14,
          45
        ],
        material: {
          emissive: "#006699",
          roughness: 0.3
        }
      },
      {
        id: "membraneTank4",
        type: "box",
        position: [
          0,
          6,
          95
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          48,
          14,
          35
        ],
        material: {
          emissive: "#004466",
          roughness: 0.3
        }
      },
      {
        id: "tankBarrier1",
        type: "box",
        position: [
          0,
          6,
          -30
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          50,
          14,
          2
        ],
        material: {
          emissive: "#ff6600"
        }
      },
      {
        id: "tankBarrier2",
        type: "box",
        position: [
          0,
          6,
          20
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          50,
          14,
          2
        ],
        material: {
          emissive: "#ff6600"
        }
      },
      {
        id: "tankBarrier3",
        type: "box",
        position: [
          0,
          6,
          70
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          50,
          14,
          2
        ],
        material: {
          emissive: "#ff6600"
        }
      },
      {
        id: "superstructure",
        type: "box",
        position: [
          -18,
          14,
          65
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          20,
          16,
          24
        ],
        material: {
          emissive: "#2a4060"
        }
      },
      {
        id: "bridge",
        type: "box",
        position: [
          -18,
          24,
          70
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          18,
          10,
          14
        ]
      },
      {
        id: "mast",
        type: "cylinder",
        position: [
          -18,
          30,
          60
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.8,
          8,
          0.8
        ],
        material: {
          emissive: "#ff0000"
        }
      },
      {
        id: "loadingArm1",
        type: "cylinder",
        position: [
          28,
          10,
          85
        ],
        rotation: [
          0,
          0,
          1.57
        ],
        size: [
          1,
          12,
          1
        ],
        material: {
          emissive: "#silver"
        }
      },
      {
        id: "loadingArm2",
        type: "cylinder",
        position: [
          -28,
          10,
          85
        ],
        rotation: [
          0,
          0,
          1.57
        ],
        size: [
          1,
          12,
          1
        ],
        material: {
          emissive: "#silver"
        }
      },
      {
        id: "reliquefaction",
        type: "box",
        position: [
          15,
          8,
          65
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          8,
          6,
          10
        ],
        material: {
          emissive: "#4488ff"
        }
      }
    ],
    attachmentPoints: [
      "membraneTank1",
      "membraneTank2",
      "membraneTank3",
      "membraneTank4",
      "superstructure",
      "mast",
      "loadingArm1",
      "loadingArm2",
      "reliquefaction",
      "tankBarrier1"
    ],
    contributor: "Scientific Research Team",
    added: "2026-03-15",
    notes: "Q-Max LNG carrier (266,000 m³, 345m LOA) with GTT membrane tanks. Carries liquefied natural gas at -163°C. Features reliquefaction plant and cryogenic loading arms."
  },
  {
    id: "roro",
    version: "1.0",
    name: 'Ro-Ro Ferry "Vehicle Voyager" v1.0',
    scale: 1.5,
    baseColor: "#2980b9",
    parts: [
      {
        id: "hull",
        type: "box",
        position: [
          0,
          -2,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          32,
          8,
          95
        ],
        material: {
          emissive: "#1a5276"
        }
      },
      {
        id: "vehicleDeck1",
        type: "box",
        position: [
          0,
          3,
          5
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          30,
          0.5,
          80
        ],
        material: {
          emissive: "#2874a6"
        }
      },
      {
        id: "vehicleDeck2",
        type: "box",
        position: [
          0,
          7,
          5
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          30,
          0.5,
          70
        ],
        material: {
          emissive: "#2874a6"
        }
      },
      {
        id: "superstructure",
        type: "box",
        position: [
          0,
          14,
          -25
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          28,
          14,
          22
        ],
        material: {
          emissive: "#3498db"
        }
      },
      {
        id: "bridge",
        type: "box",
        position: [
          0,
          22,
          -32
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          24,
          8,
          8
        ]
      },
      {
        id: "sternRamp",
        type: "box",
        position: [
          0,
          1,
          47
        ],
        rotation: [
          0.3,
          0,
          0
        ],
        size: [
          20,
          0.8,
          12
        ],
        material: {
          emissive: "#f1c40f"
        }
      },
      {
        id: "bowVisor",
        type: "box",
        position: [
          0,
          4,
          -47
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          18,
          6,
          2
        ],
        material: {
          emissive: "#e67e22"
        }
      },
      {
        id: "funnel",
        type: "cylinder",
        position: [
          -10,
          22,
          -20
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          2.5,
          10,
          2.5
        ],
        material: {
          emissive: "#e74c3c"
        }
      },
      {
        id: "lifeboat1",
        type: "box",
        position: [
          -14,
          12,
          -10
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          3,
          2,
          8
        ],
        material: {
          emissive: "#ff6b6b"
        }
      },
      {
        id: "lifeboat2",
        type: "box",
        position: [
          14,
          12,
          -10
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          3,
          2,
          8
        ],
        material: {
          emissive: "#ff6b6b"
        }
      },
      {
        id: "sideDoorL",
        type: "box",
        position: [
          -16,
          5,
          15
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          1,
          6,
          10
        ],
        material: {
          emissive: "#f39c12"
        }
      },
      {
        id: "sideDoorR",
        type: "box",
        position: [
          16,
          5,
          15
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          1,
          6,
          10
        ],
        material: {
          emissive: "#f39c12"
        }
      },
      {
        id: "mast",
        type: "cylinder",
        position: [
          10,
          24,
          -30
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.6,
          6,
          0.6
        ],
        material: {
          emissive: "#ffffff"
        }
      }
    ],
    attachmentPoints: [
      "sternRamp",
      "bowVisor",
      "superstructure",
      "lifeboat1",
      "lifeboat2",
      "sideDoorL",
      "sideDoorR",
      "mast"
    ],
    contributor: "Scientific Research Team",
    added: "2026-03-15",
    notes: "Roll-on/Roll-off ferry with vehicle decks, stern ramp, and bow visor. Designed for rapid loading/unloading of trucks, cars, and trailers. Multiple entry points including side doors."
  },
  {
    id: "research",
    version: "1.0",
    name: 'Research Vessel "Deep Discoverer" v1.0',
    scale: 1.3,
    baseColor: "#8e44ad",
    parts: [
      {
        id: "hull",
        type: "box",
        position: [
          0,
          -1,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          18,
          6,
          75
        ],
        material: {
          emissive: "#6c3483",
          metalness: 0.4
        }
      },
      {
        id: "iceBelt",
        type: "box",
        position: [
          0,
          -1,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          19,
          3,
          76
        ],
        material: {
          emissive: "#5d6d7e",
          roughness: 0.5
        }
      },
      {
        id: "mainDeck",
        type: "box",
        position: [
          0,
          3,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          17,
          0.5,
          72
        ],
        material: {
          roughness: 0.8
        }
      },
      {
        id: "superstructure",
        type: "box",
        position: [
          0,
          9,
          -20
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          16,
          10,
          18
        ],
        material: {
          emissive: "#7d3c98"
        }
      },
      {
        id: "bridge",
        type: "box",
        position: [
          0,
          15,
          -24
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          14,
          6,
          8
        ]
      },
      {
        id: "aFrame",
        type: "box",
        position: [
          0,
          12,
          25
        ],
        rotation: [
          0.4,
          0,
          0
        ],
        size: [
          14,
          1,
          12
        ],
        material: {
          emissive: "#f1c40f"
        }
      },
      {
        id: "aFrameSupport1",
        type: "cylinder",
        position: [
          -6,
          8,
          20
        ],
        rotation: [
          0.4,
          0,
          0
        ],
        size: [
          0.5,
          10,
          0.5
        ],
        material: {
          emissive: "#f39c12"
        }
      },
      {
        id: "aFrameSupport2",
        type: "cylinder",
        position: [
          6,
          8,
          20
        ],
        rotation: [
          0.4,
          0,
          0
        ],
        size: [
          0.5,
          10,
          0.5
        ],
        material: {
          emissive: "#f39c12"
        }
      },
      {
        id: "sonarDome",
        type: "box",
        position: [
          0,
          -4,
          30
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          8,
          2,
          6
        ],
        material: {
          emissive: "#00ff88"
        }
      },
      {
        id: "radarMast",
        type: "cylinder",
        position: [
          0,
          18,
          -20
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          0.8,
          12,
          0.8
        ],
        material: {
          emissive: "#ecf0f1"
        }
      },
      {
        id: "radarDish",
        type: "cone",
        position: [
          0,
          24,
          -20
        ],
        rotation: [
          3.14,
          0,
          0
        ],
        size: [
          4,
          3,
          4
        ],
        material: {
          emissive: "#3498db"
        }
      },
      {
        id: "crane",
        type: "cylinder",
        position: [
          -7,
          10,
          10
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          1,
          14,
          1
        ],
        material: {
          emissive: "#e67e22"
        }
      },
      {
        id: "laboratory",
        type: "box",
        position: [
          6,
          7,
          5
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          6,
          6,
          10
        ],
        material: {
          emissive: "#9b59b6"
        }
      },
      {
        id: "heliDeck",
        type: "box",
        position: [
          0,
          14,
          -5
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          12,
          0.5,
          12
        ],
        material: {
          emissive: "#2ecc71",
          roughness: 0.7
        }
      },
      {
        id: "moonPool",
        type: "box",
        position: [
          0,
          2,
          35
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          4,
          1,
          6
        ],
        material: {
          emissive: "#1abc9c"
        }
      }
    ],
    attachmentPoints: [
      "aFrame",
      "sonarDome",
      "radarDish",
      "crane",
      "laboratory",
      "heliDeck",
      "moonPool"
    ],
    contributor: "Scientific Research Team",
    added: "2026-03-15",
    notes: "Ice-strengthened research vessel with A-frame crane, multibeam sonar dome, moon pool for submersibles, laboratory spaces, and helicopter deck. PC6 ice class notation."
  },
  {
    id: "droneship",
    version: "1.0",
    name: 'Autonomous Spaceport Drone Ship "Of Course I Still Love You" v1.0',
    scale: 1,
    baseColor: "#2c3e50",
    parts: [
      {
        id: "bargeHull",
        type: "box",
        position: [
          0,
          -3,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          46,
          6,
          90
        ],
        material: {
          emissive: "#1c2833",
          roughness: 0.9
        }
      },
      {
        id: "landingDeck",
        type: "box",
        position: [
          0,
          0.3,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          46,
          0.5,
          90
        ],
        material: {
          emissive: "#34495e",
          roughness: 0.8
        }
      },
      {
        id: "landingCircle",
        type: "cylinder",
        position: [
          0,
          0.4,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          15,
          0.1,
          15
        ],
        material: {
          emissive: "#ffffff"
        }
      },
      {
        id: "xMark",
        type: "box",
        position: [
          0,
          0.5,
          0
        ],
        rotation: [
          0,
          0.785,
          0
        ],
        size: [
          20,
          0.1,
          4
        ],
        material: {
          emissive: "#e74c3c"
        }
      },
      {
        id: "xMark2",
        type: "box",
        position: [
          0,
          0.5,
          0
        ],
        rotation: [
          0,
          -0.785,
          0
        ],
        size: [
          20,
          0.1,
          4
        ],
        material: {
          emissive: "#e74c3c"
        }
      },
      {
        id: "thruster1",
        type: "cylinder",
        position: [
          -20,
          -4,
          -40
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          3,
          8,
          3
        ],
        material: {
          emissive: "#7f8c8d"
        }
      },
      {
        id: "thruster2",
        type: "cylinder",
        position: [
          20,
          -4,
          -40
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          3,
          8,
          3
        ],
        material: {
          emissive: "#7f8c8d"
        }
      },
      {
        id: "thruster3",
        type: "cylinder",
        position: [
          -20,
          -4,
          40
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          3,
          8,
          3
        ],
        material: {
          emissive: "#7f8c8d"
        }
      },
      {
        id: "thruster4",
        type: "cylinder",
        position: [
          20,
          -4,
          40
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          3,
          8,
          3
        ],
        material: {
          emissive: "#7f8c8d"
        }
      },
      {
        id: "equipmentContainer",
        type: "box",
        position: [
          0,
          4,
          -35
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          20,
          6,
          10
        ],
        material: {
          emissive: "#5d6d7e"
        }
      },
      {
        id: "blastWall",
        type: "box",
        position: [
          0,
          5,
          -28
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          20,
          8,
          1
        ],
        material: {
          emissive: "#95a5a6"
        }
      },
      {
        id: "starlinkDish",
        type: "cone",
        position: [
          -8,
          8,
          -35
        ],
        rotation: [
          3.14,
          0,
          0
        ],
        size: [
          2,
          1.5,
          2
        ],
        material: {
          emissive: "#3498db"
        }
      },
      {
        id: "cameras",
        type: "box",
        position: [
          8,
          8,
          -35
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          2,
          1,
          2
        ],
        material: {
          emissive: "#e74c3c"
        }
      },
      {
        id: "octagrabber",
        type: "box",
        position: [
          0,
          0.8,
          0
        ],
        rotation: [
          0,
          0,
          0
        ],
        size: [
          8,
          1,
          8
        ],
        material: {
          emissive: "#f39c12"
        }
      }
    ],
    attachmentPoints: [
      "thruster1",
      "thruster2",
      "thruster3",
      "thruster4",
      "equipmentContainer",
      "starlinkDish",
      "cameras",
      "octagrabber"
    ],
    contributor: "Scientific Research Team",
    added: "2026-03-15",
    notes: "SpaceX Autonomous Spaceport Drone Ship (ASDS) based on Marmac 304 barge. 90m x 46m with 4 azimuth thrusters for station-keeping within 3m accuracy. Used for Falcon 9 booster landings at sea. Features Octagrabber robot for securing boosters."
  }
];
const shipsJson = {
  ships
};
const BLUEPRINT_REGISTRY = shipsJson;
const SHIP_BLUEPRINTS = BLUEPRINT_REGISTRY.ships;
const getBlueprint = (id) => SHIP_BLUEPRINTS.find((b) => b.id === id);
const getShipCount = () => SHIP_BLUEPRINTS.length;
console.log(`📋 Loaded ${getShipCount()} ships from standardized Vessel Blueprint Protocol v1.0`);
const PBRPart = ({ part, shipDefaults, shipType }) => {
  const materialProps = part.material || {};
  const weather = useGameStore((state) => state.weather);
  const geometry = reactExports.useMemo(() => {
    switch (part.type) {
      case "cylinder":
        return new CylinderGeometry(part.size[0] / 2, part.size[1] / 2, part.size[2], 32);
      case "cone":
        return new ConeGeometry(part.size[0] / 2, part.size[2], 32);
      case "box":
      default:
        return new BoxGeometry(part.size[0], part.size[1], part.size[2], 1, 1, 1);
    }
  }, [part.type, part.size]);
  const metalness = materialProps.metalness ?? shipDefaults.metalness;
  const roughness = materialProps.roughness ?? shipDefaults.roughness;
  const envMapIntensity = materialProps.envMapIntensity ?? shipDefaults.envMapIntensity;
  const wetness = weather === "rain" ? 0.7 : weather === "storm" ? 0.9 : 0;
  const isWindow = part.id.toLowerCase().includes("window") || part.id.toLowerCase().includes("glass");
  const isDeck = part.id.toLowerCase().includes("deck") || part.id.toLowerCase().includes("floor");
  const isHull = part.id.toLowerCase().includes("hull") || part.id.toLowerCase().includes("bow");
  const isMetal = part.id.toLowerCase().includes("crane") || part.id.toLowerCase().includes("pipe");
  const weatheringLevel = shipType === "container" ? 0.5 : shipType === "tanker" ? 0.6 : 0.3;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "mesh",
    {
      geometry,
      position: part.position,
      rotation: part.rotation,
      castShadow: part.castShadow !== false,
      receiveShadow: part.receiveShadow !== false,
      children: isWindow ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: materialProps.color || "#223344",
          emissive: materialProps.emissive || "#000000",
          emissiveIntensity: materialProps.emissive ? 1.5 : 0,
          metalness: 0.9,
          roughness: 0.05,
          envMapIntensity: 1.5,
          transparent: true,
          opacity: 0.9
        }
      ) : isDeck ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: materialProps.color || "#444444",
          roughness: 0.7 - wetness * 0.3,
          metalness: 0.2,
          envMapIntensity
        }
      ) : isMetal ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: materialProps.color || "#888888",
          roughness: 0.5 + weatheringLevel * 0.3,
          metalness: 0.7,
          envMapIntensity
        }
      ) : isHull ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: materialProps.color || "#0a2540",
          roughness: 0.3 + weatheringLevel * 0.3 - wetness * 0.2,
          metalness: 0.4,
          envMapIntensity
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: materialProps.color || "#ffffff",
          emissive: materialProps.emissive || "#000000",
          emissiveIntensity: materialProps.emissive ? 1.5 : 0,
          metalness,
          roughness,
          envMapIntensity,
          dithering: true
        }
      )
    }
  );
};
const CruiseLinerDetails = ({ shipLength, shipWidth }) => {
  const [lightsOn, setLightsOn] = reactExports.useState(0);
  const smokeRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const interval = setInterval(() => {
      setLightsOn((prev) => (prev + 1) % 4);
    }, 2e3);
    return () => clearInterval(interval);
  }, []);
  useFrame((state) => {
    if (smokeRef.current) {
      const positions = smokeRef.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.02;
        positions[i] += Math.sin(state.clock.elapsedTime + i) * 0.01;
        if (positions[i + 1] > 15) positions[i + 1] = 8;
      }
      smokeRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  const numDecks = 6;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    Array.from({ length: numDecks }, (_, i) => {
      const y = 3 + i * 2.5;
      const width = shipWidth * (1 - i * 0.05);
      const length = shipLength * (1 - i * 0.03);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, y, 0], children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [length, 0.3, width] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: i === numDecks - 1 ? "#8B4513" : "#f5f5f5", roughness: 0.6 })
        ] }),
        Array.from({ length: Math.floor(length / 2) }, (_2, j) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-length / 2 + j * 2 + 1, y + 0.8, width / 2 + 0.1], children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.1, 1.2, 0.05] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#c0c0c0", metalness: 0.8, roughness: 0.2 })
        ] }, `rail-${i}-${j}`)),
        i < lightsOn + 2 && Array.from({ length: Math.floor(length / 3) }, (_2, j) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-length / 2 + j * 3 + 1.5, y + 0.5, width / 2 + 0.05], children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.8, 0.6, 0.05] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffee88", emissive: "#ffaa44", emissiveIntensity: 0.8 + Math.random() * 0.4 })
        ] }, `window-${i}-${j}`))
      ] }, `deck-${i}`);
    }),
    Array.from({ length: 8 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-shipLength / 2 + i * shipLength / 7 + 3, 5, shipWidth / 2 + 0.5], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("capsuleGeometry", { args: [0.6, 2, 4, 8] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ff6600", roughness: 0.4 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.8, -0.5], rotation: [0, 0, Math.PI / 4], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.05, 0.05, 1.5] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffffff", metalness: 0.8 })
      ] })
    ] }, `lifeboat-${i}`)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [shipLength / 4, 12, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [1.5, 2, 6, 32] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#cc0000", roughness: 0.5 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 3.5, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [1.8, 1.5, 1, 32] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [2.05, 2.05, 0.8, 32] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#111111" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("points", { ref: smokeRef, position: [0, 4, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("bufferGeometry", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "bufferAttribute",
          {
            attach: "attributes-position",
            count: 30,
            array: new Float32Array(Array.from({ length: 90 }, (_, i) => {
              if (i % 3 === 0) return (Math.random() - 0.5) * 2;
              if (i % 3 === 1) return Math.random() * 7;
              return (Math.random() - 0.5) * 2;
            })),
            itemSize: 3
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("pointsMaterial", { size: 0.8, color: "#666666", transparent: true, opacity: 0.4 })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 16.5, 0], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [8, 12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#44aaff", roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 16.55, 0], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [7.5, 11.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#88ccff", emissive: "#00aaff", emissiveIntensity: 0.3, transparent: true, opacity: 0.3 })
    ] })
  ] });
};
const ContainerVesselDetails = ({ shipLength, shipWidth }) => {
  const containerColors = ["#c41e3a", "#1e488f", "#f4d03f", "#27ae60", "#e67e22", "#8e44ad"];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    Array.from(
      { length: 12 },
      (_, row) => Array.from({ length: 6 }, (_2, stack) => {
        const stackHeight = 3 + Math.floor(Math.random() * 5);
        return Array.from({ length: stackHeight }, (_3, level) => {
          const color = containerColors[Math.floor(Math.random() * containerColors.length)];
          const weathering = Math.random() > 0.7 ? "#666666" : color;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "mesh",
            {
              position: [
                -shipLength / 2 + row * (shipLength / 11) + 2,
                3 + level * 2.6,
                -shipWidth / 3 + stack * (shipWidth / 6)
              ],
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [6, 2.5, 2.5] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: weathering, roughness: 0.7, metalness: 0.2 })
              ]
            },
            `container-${row}-${stack}-${level}`
          );
        });
      })
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 8, shipWidth / 2 + 1], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [shipLength * 0.8, 0.5, 0.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ff6600", metalness: 0.6, roughness: 0.4 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 8, -shipWidth / 2 - 1], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [shipLength * 0.8, 0.5, 0.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ff6600", metalness: 0.6, roughness: 0.4 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-shipLength / 3, 12, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [10, 8, shipWidth * 0.6] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffffff", roughness: 0.5 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 2, shipWidth * 0.31], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [8, 2, 0.1] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#223344", metalness: 0.9, roughness: 0.1 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 6, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.3, 0.3, 4] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#cccccc", metalness: 0.8 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 8, 0], rotation: [Math.PI / 4, 0, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [1.5, 1.5, 0.3, 32] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffffff" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [shipLength / 2 - 5, 2, shipWidth / 4], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("torusGeometry", { args: [0.3, 0.1, 8, 16] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#444444", metalness: 0.9, roughness: 0.6 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [shipLength / 2 - 5, 1, shipWidth / 4], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("torusGeometry", { args: [0.3, 0.1, 8, 16] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#444444", metalness: 0.9, roughness: 0.6 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [shipLength / 2 - 2, 4, 0], rotation: [0, 0, -Math.PI / 2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [3, 6, 32] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#cc3333", roughness: 0.6 })
    ] }),
    Array.from({ length: 15 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [(Math.random() - 0.5) * shipLength * 0.8, 2 + Math.random() * 4, (Math.random() > 0.5 ? 1 : -1) * (shipWidth / 2 + 0.1)], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [2 + Math.random() * 3, 1 + Math.random() * 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#8b4513", transparent: true, opacity: 0.4 + Math.random() * 0.3, roughness: 0.9 })
    ] }, `rust-${i}`))
  ] });
};
const OilTankerDetails = ({ shipLength, shipWidth }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    Array.from({ length: 6 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-shipLength / 2 + i * shipLength / 5 + 8, 5, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [shipWidth / 2.5, shipWidth / 2.5, shipLength / 6, 32] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#e74c3c", roughness: 0.5, metalness: 0.3 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-shipLength / 12, 0, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [shipWidth / 2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#c0392b", roughness: 0.5, metalness: 0.3 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [shipLength / 12, 0, 0], rotation: [0, Math.PI, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [shipWidth / 2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#c0392b", roughness: 0.5, metalness: 0.3 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, shipWidth / 2.5 + 0.3, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [shipLength / 6, 0.2, 1] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#f39c12", metalness: 0.7 })
      ] }),
      Array.from({ length: 5 }, (_2, j) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-shipLength / 12 + j * shipLength / 30, shipWidth / 2.5 + 1, shipWidth / 2.5 - 0.5], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.05, 0.05, 1] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffffff" })
      ] }, `rail-${i}-${j}`))
    ] }, `tank-${i}`)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 3, shipWidth / 3], rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.4, 0.4, shipLength * 0.8, 16] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#95a5a6", metalness: 0.8, roughness: 0.3 })
      ] }),
      Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-shipLength / 3 + i * shipLength / 6, 3, 0], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.3, 0.3, shipWidth * 0.6, 16] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#7f8c8d", metalness: 0.8 })
      ] }, `pipe-${i}`)),
      Array.from({ length: 8 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-shipLength / 3 + i * shipLength / 7, 4, shipWidth / 3], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("torusGeometry", { args: [0.6, 0.1, 8, 16] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#e74c3c" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [Math.PI / 2, 0, 0], children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.08, 0.08, 1.2] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#c0392b" })
        ] })
      ] }, `valve-${i}`))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-shipLength / 3, 14, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [8, 8, 0.5, 32] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#34495e", roughness: 0.8 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.26, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("ringGeometry", { args: [6, 6.5, 32] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#f1c40f", emissive: "#f39c12", emissiveIntensity: 0.2 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.26, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [4, 0.8, 0.1] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#f1c40f" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-1.5, 0.26, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.8, 3, 0.1] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#f1c40f" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [1.5, 0.26, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.8, 3, 0.1] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#f1c40f" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [shipLength / 2 - 5, 3, 0], rotation: [0, 0, -Math.PI / 6], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [8, 4, shipWidth * 0.8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2c3e50", roughness: 0.6 })
    ] }),
    Array.from({ length: 8 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-shipLength / 2 + 10 + i * shipLength / 8, 4, shipWidth / 2.5 + 0.1], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2, 1, 0.05] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#f1c40f" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0, 0.03], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.5, 0.15, 0.05] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#000000" })
      ] })
    ] }, `warning-${i}`)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-shipLength / 3, 10, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [12, 6, shipWidth * 0.5] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ecf0f1" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1, shipWidth * 0.26], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [10, 2, 0.1] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2c3e50", metalness: 0.9, roughness: 0.1 })
      ] })
    ] })
  ] });
};
const ProceduralShip = ({
  blueprintId,
  version: version2,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  children
}) => {
  var _a2, _b2;
  const groupRef = reactExports.useRef(null);
  const blueprint = reactExports.useMemo(() => getBlueprint(blueprintId), [blueprintId, version2]);
  if (!blueprint) {
    console.error(`❌ Blueprint not found: ${blueprintId}`);
    return null;
  }
  const shipDefaults = {
    metalness: blueprint.metalness ?? 0.6,
    roughness: blueprint.roughness ?? 0.4,
    envMapIntensity: 1
  };
  const shipLength = ((_a2 = blueprint.parts.find((p) => p.type === "box")) == null ? void 0 : _a2.size[0]) || 50;
  const shipWidth = ((_b2 = blueprint.parts.find((p) => p.type === "box")) == null ? void 0 : _b2.size[2]) || 10;
  console.log(`🚢 Enhanced PBR ship loaded: ${blueprint.name}`);
  console.log(`   ID: ${blueprint.id}, Metalness: ${shipDefaults.metalness}, Roughness: ${shipDefaults.roughness}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "group",
    {
      ref: groupRef,
      position,
      rotation,
      scale: [blueprint.scale, blueprint.scale, blueprint.scale],
      children: [
        (blueprint == null ? void 0 : blueprint.envMap) ? /* @__PURE__ */ jsxRuntimeExports.jsx(Environment, { files: `/envmaps/${blueprint.envMap}.hdr` }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Environment, { preset: "studio" }),
        blueprint.parts.map((part) => /* @__PURE__ */ jsxRuntimeExports.jsx(PBRPart, { part, shipDefaults, shipType: blueprint.id }, part.id)),
        blueprint.id === "cruise" && /* @__PURE__ */ jsxRuntimeExports.jsx(CruiseLinerDetails, { shipLength, shipWidth }),
        blueprint.id === "container" && /* @__PURE__ */ jsxRuntimeExports.jsx(ContainerVesselDetails, { shipLength, shipWidth }),
        blueprint.id === "tanker" && /* @__PURE__ */ jsxRuntimeExports.jsx(OilTankerDetails, { shipLength, shipWidth }),
        children
      ]
    }
  );
};
const DEFAULT_LOD_CONFIG = {
  distances: [50, 150, 300],
  // meters
  particleReduction: [1, 0.5, 0.25, 0],
  shaderComplexity: ["full", "medium", "low", "unlit"]
};
function useLOD(position, config = DEFAULT_LOD_CONFIG) {
  const { camera } = useThree();
  const [lod, setLod] = reactExports.useState(0);
  const pos = reactExports.useMemo(
    () => Array.isArray(position) ? new Vector3(...position) : position,
    [position]
  );
  useFrame(() => {
    const distance = camera.position.distanceTo(pos);
    if (distance < config.distances[0]) {
      if (lod !== 0) setLod(0);
    } else if (distance < config.distances[1]) {
      if (lod !== 1) setLod(1);
    } else if (distance < config.distances[2]) {
      if (lod !== 2) setLod(2);
    } else {
      if (lod !== 3) setLod(3);
    }
  });
  return lod;
}
function ShipImpostor({ type }) {
  const colors = {
    cruise: "#ff6b9d",
    container: "#00d4aa",
    tanker: "#ff9500",
    bulk: "#8b4513",
    lng: "#00bfff",
    roro: "#9b59b6",
    research: "#2ecc71",
    droneship: "#34495e"
  };
  const color = colors[type];
  const size = reactExports.useMemo(() => {
    switch (type) {
      case "cruise":
        return [6, 2, 1.5];
      case "container":
        return [10, 1.5, 2];
      case "tanker":
        return [8, 2, 2.5];
      case "bulk":
        return [12, 3, 2];
      case "lng":
        return [14, 3.5, 2.2];
      case "roro":
        return [7, 2.5, 1.8];
      case "research":
        return [5, 2, 1.5];
      case "droneship":
        return [4.6, 1, 3];
    }
  }, [type]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: size }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color })
  ] });
}
function ShipComponent({ ship }) {
  var _a2;
  const groupRef = reactExports.useRef(null);
  const installedUpgrades = useGameStore((state) => state.installedUpgrades);
  const lightIntensity = useGameStore((state) => state.lightIntensity);
  const musicPlaying = useGameStore((state) => state.musicPlaying);
  const bpm = useGameStore((state) => state.bpm);
  const lod = useLOD(ship.position);
  const shipUpgrades = reactExports.useMemo(
    () => installedUpgrades.filter((u) => u.shipId === ship.id),
    [installedUpgrades, ship.id]
  );
  const isUpgraded = (partName) => shipUpgrades.some((u) => u.partName === partName);
  useFrame((state) => {
    if (!groupRef.current) return;
    const bobOffsets = {
      cruise: 0.08,
      container: 0.05,
      tanker: 0.03,
      bulk: 0.04,
      lng: 0.035,
      roro: 0.06,
      research: 0.05,
      droneship: 0.1
      // Barge is more stable
    };
    const bobOffset = bobOffsets[ship.type];
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + ship.position[0]) * bobOffset;
    if (lod >= 2) return;
    if (musicPlaying.get(ship.id)) {
      const beatDuration = 60 / bpm;
      const pulse = (Math.sin(state.clock.elapsedTime * (Math.PI * 2 / beatDuration)) + 1) / 2;
      groupRef.current.traverse((child) => {
        if (child.type === "PointLight" || child.type === "SpotLight") {
          const light = child;
          light.intensity = 1.5 + pulse * lightIntensity;
        }
      });
    }
  });
  if (lod === 3) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RigidBody, { type: "fixed", position: ship.position, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShipImpostor, { type: ship.type }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RigidBody, { type: "fixed", position: ship.position, children: /* @__PURE__ */ jsxRuntimeExports.jsx("group", { ref: groupRef, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProceduralShip, { blueprintId: ship.type, version: ship.version, children: lod < 2 && ((_a2 = ship.attachmentPoints) == null ? void 0 : _a2.map((point) => {
    const isInstalled = isUpgraded(point.partName);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
      !isInstalled && lod < 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [point.position[0], point.position[1] + 0.5, point.position[2]], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.12] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#ffff00", transparent: true, opacity: 0.4 })
      ] }),
      isInstalled && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        lod < 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "pointLight",
          {
            position: [point.position[0], point.position[1] + 0.8, point.position[2]],
            intensity: 2 * lightIntensity,
            color: getLightColor(ship.type, point.partName),
            distance: 15,
            decay: 2
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [point.position[0], point.position[1] + 0.8, point.position[2]], children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.15] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: getLightColor(ship.type, point.partName) })
        ] })
      ] })
    ] }, point.partName);
  })) }) }) });
}
function getLightColor(type, partName) {
  switch (type) {
    case "cruise":
      return partName.includes("funnel") ? "#ff6600" : "#ffffff";
    case "container":
      return partName.includes("mast") ? "#ff00ff" : "#00ff88";
    case "tanker":
      return partName.includes("flare") ? "#ff4400" : "#ff6600";
    case "bulk":
      return partName.includes("crane") ? "#ffaa00" : "#ffdd88";
    case "lng":
      return partName.includes("membrane") ? "#00ccff" : partName.includes("loading") ? "#silver" : "#ffffff";
    case "roro":
      return partName.includes("lifeboat") ? "#ff4444" : "#ffdd00";
    case "research":
      return partName.includes("sonar") ? "#00ff88" : partName.includes("radar") ? "#4488ff" : "#ffffff";
    case "droneship":
      return partName.includes("thruster") ? "#ff6600" : partName.includes("octagrabber") ? "#ffaa00" : "#00ccff";
    default:
      return "#ffffff";
  }
}
function MonitorFeed({
  label,
  camNumber,
  active,
  weather,
  tier,
  isOverhead = false,
  children
}) {
  const isStormy = weather === "storm" || weather === "rain";
  const isArctic = tier === 3;
  const loadTension = useGameStore((state) => state.loadTension);
  const [shake, setShake] = reactExports.useState({ x: 0, y: 0 });
  reactExports.useEffect(() => {
    if (!isArctic || loadTension <= 30) {
      setShake({ x: 0, y: 0 });
      return;
    }
    const interval = setInterval(() => {
      const intensity = (loadTension - 30) / 20;
      setShake({
        x: (Math.random() - 0.5) * intensity * 3,
        y: (Math.random() - 0.5) * intensity * 3
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isArctic, loadTension]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `crane-monitor tier-${tier} ${active ? "active" : ""} ${isStormy ? "weather-distortion" : ""} ${isOverhead ? "overhead" : ""} ${isArctic ? "arctic-mode" : ""}`,
      style: { transform: `translate(${shake.x}px, ${shake.y}px)` },
      children: [
        isArctic && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "frost-edge" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "monitor-bezel", children: [
          isArctic && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "arctic-led-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "monitor-screen",
              style: {
                animation: isArctic && loadTension > 35 ? "screen-flicker 0.1s infinite" : void 0
              },
              children: [
                children,
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scanlines" }),
                isStormy && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rain-streaks" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "static-noise" })
                ] }),
                isArctic && weather === "storm" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "snow-particles" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ice-static" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "crt-flicker" }),
                isArctic && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "screen-reflection" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "monitor-label", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cam-id", children: camNumber }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cam-desc", children: label })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `status-led ${active ? "on" : "off"} ${isArctic ? "arctic" : ""}` })
        ] })
      ]
    }
  );
}
function TwistlockCam({
  side,
  twistlockEngaged,
  height,
  iceBuildup,
  isMoving
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `cam-feed ${side}-twistlock arctic`,
      style: {
        filter: iceBuildup > 0.3 ? `contrast(${1 - iceBuildup * 0.2}) brightness(${0.9 - iceBuildup * 0.1})` : void 0
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feed-grid", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `spreader-side${side === "right" ? " mirror" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `spreader-beam frosted ${isMoving ? "moving" : ""}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `twistlock ${side} engaged arctic ${twistlockEngaged ? "locked" : "unlocked"}`,
                style: {
                  boxShadow: twistlockEngaged ? "0 0 20px #00ff44, inset 0 0 10px #00ff44" : "0 0 20px #ff4444, inset 0 0 10px #ff4444"
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lock-icon", children: twistlockEngaged ? "🔒" : "🔓" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "corner-casting", style: { transform: `translateY(${height * 2}px)` }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-corner ice-coated" }) }),
            iceBuildup > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ice-overlay", style: { opacity: iceBuildup }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "frost-pattern" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "height-ruler", children: Array.from({ length: 10 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ruler-mark", style: { top: `${i * 10}%` }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            (10 - i) * 2,
            "m"
          ] }) }, i)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-overlay arctic", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "LOCK" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `data-value ${twistlockEngaged ? "arctic-green" : "arctic-red"}`, children: twistlockEngaged ? "ENGAGED" : "DISENGAGED" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "HGT" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-value arctic-cyan", children: [
              height.toFixed(1),
              "m"
            ] })
          ] }),
          iceBuildup > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "ICE" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-value arctic-white", children: [
              (iceBuildup * 100).toFixed(0),
              "%"
            ] })
          ] })
        ] })
      ]
    }
  );
}
function DownwardSpreaderCam({
  twistlockEngaged,
  spreaderPos,
  iceBuildup,
  isMoving
}) {
  const alignmentX = spreaderPos.x / 20;
  const alignmentZ = spreaderPos.z / 20;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cam-feed downward-spreader arctic", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "top-down-view", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `spreader-top ${isMoving ? "moving" : ""}`,
          style: {
            transform: `translate(${alignmentX * 40}px, ${alignmentZ * 30}px)`,
            transition: isMoving ? "none" : "transform 0.3s ease"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "spreader-frame arctic", children: [
              ["tl", "tr", "bl", "br"].map((corner) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `tl-corner ${corner} ${twistlockEngaged ? "engaged" : ""} arctic`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "tl-indicator" })
                },
                corner
              )),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "center-crosshair arctic", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "crosshair-h" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "crosshair-v" })
              ] })
            ] }),
            iceBuildup > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ice-frost", style: { opacity: iceBuildup } })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "target-container", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container-outline ice-glow" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "target-crosshair arctic" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "alignment-target",
            style: {
              transform: `translate(${-alignmentX * 40}px, ${-alignmentZ * 30}px)`
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "guide-h arctic" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "guide-v arctic" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "depth-ring",
          style: { opacity: 0.3 + spreaderPos.y / 50 * 0.7 },
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "depth-marker",
              style: { transform: `rotate(${spreaderPos.y / 50 * 360}deg)` }
            }
          )
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-overlay center arctic", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "POS" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-value arctic-cyan", children: [
          "X:",
          spreaderPos.x.toFixed(1),
          " Z:",
          spreaderPos.z.toFixed(1)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "ALT" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-value arctic-cyan", children: [
          spreaderPos.y.toFixed(1),
          "m"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "LOCK" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `data-value ${twistlockEngaged ? "arctic-green" : "arctic-red"}`, children: twistlockEngaged ? "ALL 4 ENGAGED" : "UNLOCKED" })
      ] })
    ] })
  ] });
}
function WinchCam({ cableLength, tension, isMoving }) {
  const tensionColor = tension > 30 ? "#ff4444" : tension > 20 ? "#ffcc00" : "#00ccff";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cam-feed winch-cam arctic", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "winch-view", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `cable-drum arctic ${isMoving ? "spinning" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "drum-body" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "cable-wind",
            style: {
              height: `${cableLength / 50 * 100}%`,
              background: `linear-gradient(90deg, ${tensionColor} 0%, #666 100%)`
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tension-gauge", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "gauge-bg" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "gauge-fill",
            style: {
              height: `${tension / 50 * 100}%`,
              background: `linear-gradient(0deg, ${tensionColor} 0%, ${tensionColor}88 100%)`,
              boxShadow: tension > 30 ? `0 0 20px ${tensionColor}` : "none"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "gauge-labels", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "0t" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "25t" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "50t" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cable-animation", children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "cable-strand arctic",
          style: {
            animationDelay: `${i * 0.1}s`,
            opacity: isMoving ? 1 : 0.5,
            background: tension > 30 ? "linear-gradient(180deg, #ff4444 0%, #ff8844 100%)" : "linear-gradient(180deg, #00ccff 0%, #0088ff 100%)"
          }
        },
        i
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-overlay arctic", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "CABLE" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-value arctic-cyan", children: [
          cableLength.toFixed(1),
          "m"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "TENSION" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: "data-value",
            style: {
              color: tensionColor,
              textShadow: tension > 30 ? `0 0 10px ${tensionColor}` : "none"
            },
            children: [
              tension.toFixed(1),
              "t"
            ]
          }
        )
      ] })
    ] })
  ] });
}
function ThermalCam({ hullTemp, hotspots, weather, iceBuildup }) {
  const ambientTemp = weather === "storm" ? -35 : weather === "rain" ? -10 : -20;
  const adjustedHullTemp = hullTemp + (ambientTemp + 20) * 0.3;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "cam-feed thermal-cam",
      style: {
        filter: iceBuildup > 0 ? `hue-rotate(${iceBuildup * 30}deg) contrast(${1 - iceBuildup * 0.2})` : void 0
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thermal-view", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thermal-bg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "ship-thermal-silhouette",
                style: {
                  background: `linear-gradient(180deg,
                rgba(${adjustedHullTemp < -10 ? "0,100,150" : adjustedHullTemp < 0 ? "50,150,200" : "100,200,255"},0.4) 0%,
                rgba(0,60,100,0.6) 100%)`
                }
              }
            ),
            hotspots.map((spot, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "thermal-hotspot",
                style: {
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  opacity: spot.intensity * (1 - iceBuildup * 0.5),
                  boxShadow: `0 0 ${20 * spot.intensity}px ${10 * spot.intensity}px rgba(255, ${100 + spot.intensity * 100}, 0, ${spot.intensity})`
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hotspot-pulse" })
              },
              i
            )),
            weather === "storm" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: [20, 50, 80].map((xPct, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "thermal-coldspot",
                style: { left: `${xPct}%`, top: "65%" },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "coldspot-indicator" })
              },
              `cold-${i}`
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "thermal-scale", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scale-gradient" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "scale-labels", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "-40°C" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "-20°C" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "0°C" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "+20°C" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-overlay arctic", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "HULL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: "data-value",
                style: {
                  color: adjustedHullTemp < -15 ? "#0088ff" : adjustedHullTemp < 0 ? "#00ccff" : "#ff8844"
                },
                children: [
                  adjustedHullTemp.toFixed(0),
                  "°C"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "HOTSPOTS" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-value arctic-cyan", children: [
              hotspots.length,
              " DETECTED"
            ] })
          ] }),
          iceBuildup > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "ICE" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-value arctic-white", children: "THERMAL MASK" })
          ] })
        ] })
      ]
    }
  );
}
const COMPASS_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function Arctic360Cam({ snowIntensity, windSpeed, isMoving }) {
  const icebergs = reactExports.useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({
      left: 10 + i * 20,
      scale: 0.5 + i * 0.13 % 0.5,
      opacity: 0.4 + i * 0.11 % 0.4,
      delay: i * 0.5
    })),
    []
  );
  const snowParticles = reactExports.useMemo(
    () => Array.from({ length: 30 }, (_, i) => ({
      left: i * 3.7 % 100,
      delay: i * 0.07 % 2,
      duration: 0.5 + i * 0.04 % 1,
      scale: 0.5 + i * 0.05 % 1
    })),
    []
  );
  const windStreaks = reactExports.useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({
      top: i * 11.3 % 100,
      delay: i * 0.05 % 0.5,
      duration: 0.3 + i * 0.03 % 0.3
    })),
    []
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cam-feed arctic-360", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "arctic-view-360", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "arctic-horizon" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "arctic-ice-field" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "wind-indicator", style: { opacity: windSpeed / 30 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "wind-arrow",
            style: { animationDuration: `${1 / (windSpeed / 10)}s` }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "wind-speed", children: [
          windSpeed.toFixed(0),
          " m/s"
        ] })
      ] }),
      icebergs.map((berg, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "iceberg",
          style: {
            left: `${berg.left}%`,
            transform: `scale(${berg.scale})`,
            opacity: berg.opacity,
            animationDelay: `${berg.delay}s`
          }
        },
        i
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "snow-overlay", style: { opacity: snowIntensity }, children: snowParticles.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "snow-particle",
          style: {
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `scale(${p.scale})`
          }
        },
        i
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wind-streaks", style: { opacity: windSpeed / 30 }, children: windStreaks.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "wind-streak",
          style: {
            top: `${s.top}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`
          }
        },
        i
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "arctic-compass", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "compass-ring", children: COMPASS_DIRS.map((dir, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "compass-dir",
            style: { transform: `rotate(${i * 45}deg) translateY(-35px)` },
            children: dir
          },
          dir
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "compass-needle",
            style: { animationDuration: isMoving ? "2s" : "10s" }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-overlay arctic", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "SNOW" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-value arctic-cyan", children: [
          (snowIntensity * 100).toFixed(0),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "WIND" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-value arctic-cyan", children: [
          windSpeed.toFixed(1),
          " m/s"
        ] })
      ] }),
      isMoving && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "data-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-label", children: "OPS" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-value arctic-green", children: "ACTIVE" })
      ] })
    ] })
  ] });
}
function TelemetryGraph({
  label,
  value,
  max: max2,
  unit,
  color,
  history = []
}) {
  const percentage = Math.min(value / max2 * 100, 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "telemetry-panel", style: { borderLeft: `2px solid ${color}` }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "telemetry-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "telemetry-label", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "telemetry-value", style: { color }, children: [
        value.toFixed(1),
        unit
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "telemetry-graph", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "graph-bars", children: history.length > 0 ? history.slice(-20).map((val, i) => {
        const h = Math.min(val / max2 * 100, 100);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "graph-bar",
            style: {
              height: `${h}%`,
              backgroundColor: color,
              opacity: 0.4 + i / 20 * 0.6
            }
          },
          i
        );
      }) : (
        // Static placeholder bars when no history is available
        Array.from({ length: 20 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "graph-bar",
            style: {
              height: `${Math.max(10, percentage * 0.9)}%`,
              backgroundColor: color,
              opacity: i < percentage / 5 ? 1 : 0.2
            }
          },
          i
        ))
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "graph-line",
          style: {
            background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
            width: `${percentage}%`,
            boxShadow: `0 0 10px ${color}`
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "telemetry-scale", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "0",
        unit
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        max2 / 2,
        unit
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        max2,
        unit
      ] })
    ] })
  ] });
}
function SystemStatusMonitor({ systems }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "system-status-panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "status-header", children: "SYSTEM STATUS" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "status-grid", children: systems.map((sys) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `status-item ${sys.status}`,
        style: {
          animation: sys.status === "error" ? "status-blink 0.5s infinite" : void 0
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "status-icon", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `status-dot ${sys.status}` }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "status-name", children: sys.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "status-temp",
              style: {
                color: sys.temp > 50 ? "#ff4444" : sys.temp > 40 ? "#ffcc00" : "#00ff44"
              },
              children: [
                sys.temp,
                "°C"
              ]
            }
          )
        ]
      },
      sys.name
    )) })
  ] });
}
function WeatherMonitor({ temp, wind, visibility, iceBuildup }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "weather-monitor-panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "weather-header", children: "ARCTIC WX" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "weather-data", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "weather-item",
          style: {
            borderLeft: `3px solid ${temp < -20 ? "#0088ff" : temp < 0 ? "#00ccff" : "#ff8800"}`
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "weather-icon", children: "🌡️" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "weather-details", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "weather-value", children: [
                temp,
                "°C"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "weather-label", children: "TEMP" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "weather-item", style: { borderLeft: "3px solid #00ff88" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "weather-icon", children: "💨" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "weather-details", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "weather-value", children: [
            wind.toFixed(1),
            " m/s"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "weather-label", children: "WIND" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "weather-item", style: { borderLeft: "3px solid #ffcc00" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "weather-icon", children: "👁️" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "weather-details", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "weather-value", children: visibility }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "weather-label", children: "VIS" })
        ] })
      ] }),
      iceBuildup > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "weather-item", style: { borderLeft: "3px solid #ffffff" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "weather-icon", children: "❄️" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "weather-details", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "weather-value", children: [
            (iceBuildup * 100).toFixed(0),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "weather-label", children: "ICE" })
        ] })
      ] })
    ] })
  ] });
}
function HeatedWindow({ heaterActive, frostLevel }) {
  const [currentFrost, setCurrentFrost] = reactExports.useState(frostLevel);
  reactExports.useEffect(() => {
    const targetFrost = heaterActive ? 0 : frostLevel;
    const interval = setInterval(() => {
      setCurrentFrost((prev) => {
        const diff = targetFrost - prev;
        const speed = heaterActive ? 0.05 : 0.01;
        if (Math.abs(diff) < 0.01) return targetFrost;
        return prev + diff * speed;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [heaterActive, frostLevel]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `heated-window ${heaterActive ? "heater-on" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "window-glass" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "frost-layer", style: { opacity: currentFrost }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "frost-texture" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `defrost-grid ${heaterActive ? "active" : ""}`, children: [
      Array.from({ length: 8 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "grid-line horizontal",
          style: {
            top: `${(i + 1) * 12}%`,
            opacity: heaterActive ? 1 : 0.3
          }
        },
        i
      )),
      Array.from({ length: 10 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "grid-line vertical",
          style: {
            left: `${(i + 1) * 10}%`,
            opacity: heaterActive ? 1 : 0.3
          }
        },
        `v-${i}`
      ))
    ] }),
    heaterActive && currentFrost > 0.1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "heater-indicator", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "heat-icon", children: "🔥" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "heat-text", children: "DEFROSTING" })
    ] })
  ] });
}
function CraneDashboard({ position = [0, 0, 0] }) {
  const [fourthMonitorMode, setFourthMonitorMode] = reactExports.useState("winch");
  const {
    weather,
    boothTier,
    twistlockEngaged,
    spreaderPos,
    cableDepth,
    loadTension,
    heaterActive,
    iceBuildup,
    isMoving,
    joystickLeft,
    joystickRight
  } = useGameStore((state) => ({
    weather: state.weather,
    boothTier: state.boothTier,
    twistlockEngaged: state.twistlockEngaged,
    spreaderPos: state.spreaderPos,
    cableDepth: state.cableDepth,
    loadTension: state.loadTension,
    heaterActive: state.heaterActive,
    iceBuildup: state.iceBuildup,
    isMoving: state.isMoving,
    joystickLeft: state.joystickLeft,
    joystickRight: state.joystickRight
  }));
  const isArctic = boothTier === 3;
  const systems = [
    { name: "HYDRAULICS", status: loadTension > 40 ? "warn" : "ok", temp: 40 + loadTension * 0.5 },
    { name: "ELECTRICAL", status: "ok", temp: 35 + (joystickLeft.x !== 0 || joystickRight.x !== 0 ? 5 : 0) },
    { name: "HEATING", status: heaterActive ? "ok" : "warn", temp: heaterActive ? 42 : 20 },
    { name: "COMMS", status: weather === "storm" ? "warn" : "ok", temp: 32 },
    { name: "SENSORS", status: iceBuildup > 0.4 ? "warn" : "ok", temp: -10 - iceBuildup * 20 },
    { name: "WINCH", status: loadTension > 45 ? "error" : loadTension > 35 ? "warn" : "ok", temp: 28 + loadTension * 0.8 }
  ];
  const arcticData = {
    hullTemp: -15,
    hotspots: [
      { x: 30, y: 40, intensity: 0.8 },
      { x: 60, y: 35, intensity: 0.6 },
      { x: 45, y: 60, intensity: 0.4 }
    ],
    snowIntensity: weather === "storm" ? 0.8 : 0.2,
    windSpeed: weather === "storm" ? 25 : 12,
    outsideTemp: heaterActive ? -20 : -28,
    visibility: weather === "storm" ? "500m" : "2km"
  };
  const [tensionHistory, setTensionHistory] = reactExports.useState([]);
  const [cableHistory, setCableHistory] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const interval = setInterval(() => {
      setTensionHistory((prev) => [...prev.slice(-19), loadTension]);
      setCableHistory((prev) => [...prev.slice(-19), cableDepth]);
    }, 100);
    return () => clearInterval(interval);
  }, [loadTension, cableDepth]);
  reactExports.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setFourthMonitorMode((prev) => prev === "winch" ? "landside" : "winch");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
  const toggleFourthMonitor = () => setFourthMonitorMode((prev) => prev === "winch" ? "landside" : "winch");
  if (!isArctic) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Html,
      {
        transform: true,
        position,
        rotation: [0, 0, 0],
        distanceFactor: 10,
        style: { width: "800px", height: "500px", pointerEvents: "none" },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "crane-dashboard-container tier-standard", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dashboard-frame", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "monitor-grid", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "monitor-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "LEFT TWISTLOCK", camNumber: "CAM 01", active: true, weather, tier: boothTier, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TwistlockCam, { side: "left", twistlockEngaged, height: spreaderPos.y, iceBuildup: 0, isMoving }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "RIGHT TWISTLOCK", camNumber: "CAM 02", active: true, weather, tier: boothTier, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TwistlockCam, { side: "right", twistlockEngaged, height: spreaderPos.y, iceBuildup: 0, isMoving }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "monitor-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "DOWNWARD SPREADER", camNumber: "CAM 03", active: true, weather, tier: boothTier, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DownwardSpreaderCam, { twistlockEngaged, spreaderPos, iceBuildup: 0, isMoving }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MonitorFeed,
                {
                  label: fourthMonitorMode === "winch" ? "WINCH CABLES" : "LANDSIDE QUAY",
                  camNumber: "CAM 04",
                  active: true,
                  weather,
                  tier: boothTier,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(WinchCam, { cableLength: cableDepth, tension: loadTension, isMoving })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "dashboard-controls", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "monitor-toggle-btn", onClick: toggleFourthMonitor, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-icon", children: "🔄" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-label", children: fourthMonitorMode === "winch" ? "SWITCH TO QUAY" : "SWITCH TO WINCH" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-hint", children: "[TAB]" })
          ] }) })
        ] }) })
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Html,
    {
      transform: true,
      position,
      rotation: [0, 0, 0],
      distanceFactor: 10,
      style: { width: "1200px", height: "900px", pointerEvents: "none" },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "crane-dashboard-container tier-arctic", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "arctic-windows", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(HeatedWindow, { heaterActive, frostLevel: iceBuildup }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(HeatedWindow, { heaterActive, frostLevel: iceBuildup * 0.8 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overhead-monitor-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overhead-monitors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "TENSION LOAD", camNumber: "TLM 01", active: true, weather, tier: boothTier, isOverhead: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TelemetryGraph, { label: "TENSION", value: loadTension, max: 50, unit: "t", color: loadTension > 30 ? "#ff4444" : "#00ccff", history: tensionHistory }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "CABLE DEPTH", camNumber: "TLM 02", active: true, weather, tier: boothTier, isOverhead: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TelemetryGraph, { label: "DEPTH", value: cableDepth, max: 50, unit: "m", color: "#0088ff", history: cableHistory }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "SYSTEMS", camNumber: "SYS 03", active: true, weather, tier: boothTier, isOverhead: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SystemStatusMonitor, { systems }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "ARCTIC WX", camNumber: "WX 04", active: true, weather, tier: boothTier, isOverhead: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(WeatherMonitor, { temp: arcticData.outsideTemp, wind: arcticData.windSpeed, visibility: arcticData.visibility, iceBuildup }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "THERMAL SCAN", camNumber: "CAM 05", active: true, weather, tier: boothTier, isOverhead: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ThermalCam, { hullTemp: arcticData.hullTemp, hotspots: arcticData.hotspots, weather, iceBuildup }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "360° ARCTIC", camNumber: "CAM 06", active: true, weather, tier: boothTier, isOverhead: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Arctic360Cam, { snowIntensity: arcticData.snowIntensity, windSpeed: arcticData.windSpeed, isMoving }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "arctic-console curved", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "console-led-glow" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "main-monitors-curved", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "curved-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "LEFT TWISTLOCK", camNumber: "CAM 01", active: true, weather, tier: boothTier, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TwistlockCam, { side: "left", twistlockEngaged, height: spreaderPos.y, iceBuildup, isMoving }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "RIGHT TWISTLOCK", camNumber: "CAM 02", active: true, weather, tier: boothTier, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TwistlockCam, { side: "right", twistlockEngaged, height: spreaderPos.y, iceBuildup, isMoving }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "curved-row lower", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorFeed, { label: "DOWNWARD SPREADER", camNumber: "CAM 03", active: true, weather, tier: boothTier, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DownwardSpreaderCam, { twistlockEngaged, spreaderPos, iceBuildup, isMoving }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                MonitorFeed,
                {
                  label: fourthMonitorMode === "winch" ? "WINCH CABLES" : "LANDSIDE QUAY",
                  camNumber: "CAM 04",
                  active: true,
                  weather,
                  tier: boothTier,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(WinchCam, { cableLength: cableDepth, tension: loadTension, isMoving })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "arctic-controls", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "arctic-btn heater",
                onClick: () => useGameStore.getState().setHeaterActive(!heaterActive),
                style: { boxShadow: heaterActive ? "0 0 20px rgba(255,100,0,0.5)" : "none" },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-glow" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-icon", children: "🔥" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-label", children: heaterActive ? "HEATER ON" : "HEATER OFF" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "arctic-btn toggle", onClick: toggleFourthMonitor, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-glow" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-icon", children: "🔄" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-label", children: "CAM 04" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-hint", children: "[TAB]" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "arctic-walls", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wall-padding left" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "wall-padding right" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ceiling-padding" })
        ] })
      ] })
    }
  );
}
function Crane() {
  const craneRef = reactExports.useRef(null);
  const trolleyRef = reactExports.useRef(null);
  const hookRef = reactExports.useRef(null);
  useFrame((state) => {
    var _a2;
    const time = state.clock.elapsedTime;
    const newTrolleyPos = Math.sin(time * 0.3) * 10;
    const newHookHeight = Math.sin(time * 0.5) * 0.5 - 2;
    if (trolleyRef.current) {
      trolleyRef.current.position.x = newTrolleyPos;
    }
    if (hookRef.current) {
      hookRef.current.position.y = newHookHeight;
      const cable = (_a2 = hookRef.current.parent) == null ? void 0 : _a2.children.find((c) => c.name === "cable");
      if (cable) {
        cable.scale.y = Math.abs(newHookHeight) + 2;
        cable.position.y = (newHookHeight - 2) / 2;
      }
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RigidBody, { type: "fixed", position: [0, 4, 5], children: /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: craneRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CraneDashboard, { position: [1.5, 8.5, 0] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -2, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [4, 4, 4] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#444444", metalness: 0.5, roughness: 0.6 })
    ] }),
    [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]].map(([x, z], i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [x, -3.8, z], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.15, 0.15, 0.3] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
    ] }, `bolt-${i}`)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 4, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2, 12, 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#555555", metalness: 0.4 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 4, 1], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.5, 10, 0.1] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#666666", transparent: true, opacity: 0.5 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 4, -1], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.5, 10, 0.1] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#666666", transparent: true, opacity: 0.5 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 10, 1.1], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.15] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#ff0000" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [0, 10, 1.5],
        intensity: 2,
        color: "#ff0000",
        distance: 10
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [1.5, 8, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2, 2.5, 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffaa00" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [2.5, 8.5, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.1, 1, 1.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#1a1a2e", metalness: 0.9, roughness: 0.1 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [12, 10, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [24, 1.5, 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#666666", metalness: 0.5 })
    ] }),
    Array.from({ length: 10 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [2 + i * 2, 10, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.1, 1.3, 2.1] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#777777", transparent: true, opacity: 0.4 })
    ] }, `jib-lattice-${i}`)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-8, 10, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [12, 1.5, 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#666666", metalness: 0.5 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-12, 9, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [3, 3, 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#444444" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 10.5, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [1, 2, 4] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffaa00" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [20, 10.5, 0], rotation: [0, 0, -Math.PI / 6], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.05, 0.05, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 12, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.08, 0.08, 3] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: trolleyRef, position: [5, 9.2, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { castShadow: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.5, 0.8, 2.2] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ff6600" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.5, -0.5, 1], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.2, 0.3] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.5, -0.5, 1], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.2, 0.3] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.5, -0.5, -1], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.2, 0.3] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.5, -0.5, -1], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.2, 0.3] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { name: "cable", position: [0, -2, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.03, 0.03, 4] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#222222" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: hookRef, position: [0, -4, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { castShadow: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.6, 0.8, 0.6] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ff6600" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -0.8, 0], children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("torusGeometry", { args: [0.3, 0.08, 8, 16, Math.PI] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333", metalness: 0.8 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "pointLight",
          {
            position: [0, 0, 0],
            intensity: 1,
            color: "#ffffaa",
            distance: 5
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0, 0], children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.1] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#ffffaa" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [24, 11, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#ff0000" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [24, 11.5, 0],
        intensity: 3,
        color: "#ff0000",
        distance: 20
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "spotLight",
      {
        position: [2, 8, 2],
        "target-position": [5, 0, 5],
        intensity: 2,
        angle: Math.PI / 4,
        penumbra: 0.5,
        distance: 30
      }
    )
  ] }) });
}
function Dock({ isNight = true }) {
  const woodColor = isNight ? "#3d2817" : "#8B4513";
  const pierColor = isNight ? "#2a1b0f" : "#654321";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(RigidBody, { type: "fixed", position: [0, -2, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0, 0], receiveShadow: true, castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [80, 1, 15] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: woodColor,
          roughness: 0.9,
          metalness: 0.1
        }
      )
    ] }),
    Array.from({ length: 40 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [-39 + i * 2, 0.55, 0],
        receiveShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.9, 0.05, 14.5] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshStandardMaterial",
            {
              color: i % 2 === 0 ? woodColor : adjustColor(woodColor, -10),
              roughness: 0.95
            }
          )
        ]
      },
      `plank-${i}`
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1, -7], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [80, 2, 1] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: pierColor,
          roughness: 0.9
        }
      )
    ] }),
    [-30, -10, 10, 30].map((x, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [x, 1.5, -6], castShadow: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.3, 0.4, 1, 8] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#444444", metalness: 0.7, roughness: 0.4 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [x, 2, -6], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("torusGeometry", { args: [0.35, 0.1, 6, 12] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333", metalness: 0.8, roughness: 0.3 })
      ] })
    ] }, `bollard-${i}`)),
    isNight && /* @__PURE__ */ jsxRuntimeExports.jsx(DockLights, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pilings, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.3, 5], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [70, 0.2, 0.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#666666", metalness: 0.6, roughness: 0.4 })
    ] })
  ] }) });
}
function DockLights() {
  const lightPositions = reactExports.useMemo(() => [
    { x: -35, z: -4, color: "#ffaa44", intensity: 3 },
    { x: -15, z: -4, color: "#ffaa44", intensity: 3 },
    { x: 0, z: -4, color: "#ffaa44", intensity: 3 },
    { x: 15, z: -4, color: "#ffaa44", intensity: 3 },
    { x: 35, z: -4, color: "#ffaa44", intensity: 3 }
  ], []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: lightPositions.map((light, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [light.x, 3, light.z], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.3, 0.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [light.x, 1.5, light.z], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.1, 0.1, 3] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#444444", metalness: 0.5 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [light.x, 2.5, light.z],
        intensity: light.intensity,
        color: light.color,
        distance: 25,
        decay: 2,
        castShadow: true
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [light.x, 0.5, light.z], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [3, 4, 16, 1, true] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshBasicMaterial",
        {
          color: light.color,
          transparent: true,
          opacity: 0.05,
          side: DoubleSide,
          depthWrite: false
        }
      )
    ] })
  ] }, `light-${i}`)) });
}
function Pilings() {
  const pilingPositions = reactExports.useMemo(() => [
    -38,
    -30,
    -20,
    -10,
    0,
    10,
    20,
    30,
    38
  ], []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: pilingPositions.map((x, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [x, -2, 6], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.4, 0.3, 6, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#4a3728", roughness: 0.95 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [x, -2, -6], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.4, 0.3, 6, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#4a3728", roughness: 0.95 })
    ] })
  ] }, `piling-${i}`)) });
}
function adjustColor(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, (num >> 8 & 255) + amount));
  const b = Math.min(255, Math.max(0, (num & 255) + amount));
  return `#${(16777216 + r * 65536 + g * 256 + b).toString(16).slice(1)}`;
}
function InteractiveWater({ isNight = true }) {
  const meshRef = reactExports.useRef(null);
  const materialRef = reactExports.useRef(null);
  const { camera } = useThree();
  const ships2 = useGameStore((state) => state.ships);
  const craneState = useGameStore((state) => ({
    height: state.craneHeight ?? 15.5,
    rotation: state.craneRotation ?? 0.2,
    twistlockEngaged: state.twistlockEngaged ?? false
  }));
  const weather = useGameStore((state) => state.weather);
  const { audioData } = useAudioVisualSync();
  const audioReactiveRef = reactExports.useRef({ waveBoost: 0, foamBoost: 0 });
  const buoyancyPoints = reactExports.useRef([]);
  const wakeTrails = reactExports.useRef(/* @__PURE__ */ new Map());
  const ripples = reactExports.useRef([]);
  const splashes = reactExports.useRef([]);
  const timeRef = reactExports.useRef(0);
  const MAX_RIPPLES = 50;
  const MAX_SPLASHES = 200;
  const getWaterHeight = reactExports.useCallback((x, z, time) => {
    let height = 0;
    height += Math.sin(x * 0.05 + time * 0.5) * Math.cos(z * 0.03 + time * 0.3) * 0.5;
    height += Math.sin(x * 0.1 + time * 0.8) * Math.sin(z * 0.08 + time * 0.6) * 0.3;
    height += Math.sin(x * 0.2 + time * 1.2) * 0.1;
    buoyancyPoints.current.forEach((point) => {
      const dx = x - point.position.x;
      const dz = z - point.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 10) {
        const influence = Math.max(0, 1 - dist / 10);
        height -= point.displacement * influence * Math.cos(dist * 0.5 - time * 2);
      }
    });
    wakeTrails.current.forEach((trail) => {
      trail.points.forEach((point, i) => {
        const age = trail.ages[i];
        if (age > 5) return;
        const dx = x - point.x;
        const dz = z - point.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const wakeWidth = 3 + age * 0.5;
        if (dist < wakeWidth) {
          const influence = (1 - age / 5) * (1 - dist / wakeWidth);
          height += Math.sin(dist * 2 - time * 3) * influence * 0.3;
        }
      });
    });
    ripples.current.forEach((ripple) => {
      const dx = x - ripple.center.x;
      const dz = z - ripple.center.y;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < ripple.radius) {
        const wave = Math.sin(dist * ripple.frequency - ripple.phase);
        const envelope = Math.exp(-ripple.decay * dist) * (1 - dist / ripple.radius);
        height += wave * envelope * ripple.amplitude;
      }
    });
    const craneX = Math.sin(craneState.rotation) * 20;
    const craneZ = 5;
    const craneDist = Math.sqrt((x - craneX) ** 2 + (z - craneZ) ** 2);
    if (craneDist < 15) {
      const turbulence = Math.sin(time * 5 + craneDist) * (1 - craneDist / 15) * 0.2;
      height += turbulence;
    }
    return height * (weather === "storm" ? 2 : 1);
  }, [craneState.rotation, weather]);
  const createSplash = reactExports.useCallback((position, intensity) => {
    if (splashes.current.length >= MAX_SPLASHES) return;
    for (let i = 0; i < 10 * intensity; i++) {
      splashes.current.push({
        position: position.clone(),
        velocity: new Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * 3
        ),
        life: 0,
        maxLife: 1 + Math.random(),
        size: 0.1 + Math.random() * 0.3
      });
    }
    if (ripples.current.length < MAX_RIPPLES) {
      ripples.current.push({
        center: new Vector2(position.x, position.z),
        radius: 20,
        amplitude: 0.5 * intensity,
        frequency: 0.5,
        phase: 0,
        decay: 0.1
      });
    }
  }, []);
  useFrame(() => {
    const delta = 0.016;
    timeRef.current += delta;
    buoyancyPoints.current = ships2.flatMap((ship) => {
      const points = [];
      const shipLength = ship.length;
      const shipWidth = shipLength * 0.15;
      for (let i = -2; i <= 2; i++) {
        for (let j = -1; j <= 1; j++) {
          const x = ship.position[0] + i * shipLength * 0.2;
          const z = ship.position[2] + j * shipWidth * 0.3;
          const waterH = getWaterHeight(x, z, timeRef.current - delta);
          const draft = 2;
          const hullBottom = -2.5 - draft;
          if (waterH > hullBottom) {
            points.push({
              position: new Vector3(x, waterH, z),
              displacement: Math.min(waterH - hullBottom, 1.5),
              velocity: new Vector3(0, 0, 0)
            });
          }
        }
      }
      return points;
    });
    ships2.forEach((ship) => {
      const trail = wakeTrails.current.get(ship.id) ?? {
        id: ship.id,
        points: [],
        ages: [],
        intensity: 1
      };
      trail.points.unshift(new Vector3(
        ship.position[0] - ship.length * 0.45,
        -2.5,
        ship.position[2]
      ));
      trail.ages.unshift(0);
      if (trail.points.length > 50) {
        trail.points.pop();
        trail.ages.pop();
      }
      trail.ages = trail.ages.map((age) => age + delta);
      wakeTrails.current.set(ship.id, trail);
    });
    ripples.current = ripples.current.map((ripple) => ({
      ...ripple,
      phase: ripple.phase + delta * 5,
      amplitude: ripple.amplitude * 0.995
    })).filter((ripple) => ripple.amplitude > 0.01);
    splashes.current = splashes.current.map((splash) => {
      splash.velocity.y -= 9.8 * delta;
      splash.position.add(splash.velocity.clone().multiplyScalar(delta));
      splash.life += delta;
      return splash;
    }).filter((splash) => splash.life < splash.maxLife && splash.position.y > -3);
    if (craneState.height < 5 && Math.random() < 0.1) {
      const craneX = Math.sin(craneState.rotation) * 15;
      const craneZ = 5 + (Math.random() - 0.5) * 5;
      createSplash(new Vector3(craneX, -2.5, craneZ), 0.5);
    }
  });
  const splashGeometry = reactExports.useMemo(() => {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(MAX_SPLASHES * 3);
    const sizes = new Float32Array(MAX_SPLASHES);
    const opacities = new Float32Array(MAX_SPLASHES);
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("size", new BufferAttribute(sizes, 1));
    geometry.setAttribute("opacity", new BufferAttribute(opacities, 1));
    return geometry;
  }, []);
  useFrame(() => {
    var _a2, _b2, _c;
    if (!((_a2 = splashGeometry.attributes) == null ? void 0 : _a2.position) || !((_b2 = splashGeometry.attributes) == null ? void 0 : _b2.size) || !((_c = splashGeometry.attributes) == null ? void 0 : _c.opacity)) return;
    const positions = splashGeometry.attributes.position.array;
    const sizes = splashGeometry.attributes.size.array;
    const opacities = splashGeometry.attributes.opacity.array;
    splashes.current.forEach((splash, i) => {
      positions[i * 3] = splash.position.x;
      positions[i * 3 + 1] = splash.position.y;
      positions[i * 3 + 2] = splash.position.z;
      sizes[i] = splash.size * (1 - splash.life / splash.maxLife);
      opacities[i] = 1 - splash.life / splash.maxLife;
    });
    for (let i = splashes.current.length; i < MAX_SPLASHES; i++) {
      positions[i * 3 + 1] = -1e3;
      sizes[i] = 0;
      opacities[i] = 0;
    }
    splashGeometry.attributes.position.needsUpdate = true;
    splashGeometry.attributes.size.needsUpdate = true;
    splashGeometry.attributes.opacity.needsUpdate = true;
  });
  const vertexShader2 = `
    uniform float uTime;
    uniform float uWaveHeight;
    uniform float uAudioBass;
    uniform float uAudioEnvelope;
    uniform float uAudioBeat;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vDisplacement;

    // Simplex noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vUv = uv;

      vec2 worldPos = (modelMatrix * vec4(position, 1.0)).xz;

      // PHASE 8: Audio-reactive wave amplitude
      float audioBoost = 1.0 + uAudioBass * 2.0 + uAudioBeat * 0.5;
      float timeScale = 1.0 + uAudioEnvelope * 0.3;

      // Base waves with audio reactivity
      float height = snoise(worldPos * 0.02 + uTime * 0.1 * timeScale) * 2.0;
      height += snoise(worldPos * 0.05 + uTime * 0.2 * timeScale) * 1.0;
      height += snoise(worldPos * 0.1 + uTime * 0.3 * timeScale) * 0.5;
      height *= uWaveHeight * audioBoost;

      // Beat-induced wave pulse
      height += sin(length(worldPos) * 0.1 - uTime * 2.0) * uAudioBass * 0.5;

      // Calculate normal
      float delta = 0.5;
      float hL = snoise((worldPos + vec2(-delta, 0.0)) * 0.02 + uTime * 0.1) * 2.0 * audioBoost;
      float hR = snoise((worldPos + vec2(delta, 0.0)) * 0.02 + uTime * 0.1) * 2.0 * audioBoost;
      float hD = snoise((worldPos + vec2(0.0, -delta)) * 0.02 + uTime * 0.1) * 2.0 * audioBoost;
      float hU = snoise((worldPos + vec2(0.0, delta)) * 0.02 + uTime * 0.1) * 2.0 * audioBoost;

      vNormal = normalize(vec3(hL - hR, 2.0 * delta, hD - hU));
      vDisplacement = height;

      vec3 newPos = position + vec3(0.0, height, 0.0);
      vWorldPos = (modelMatrix * vec4(newPos, 1.0)).xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `;
  const fragmentShader2 = `
    uniform vec3 uCameraPos;
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    uniform vec3 uWaterColor;
    uniform vec3 uDeepColor;
    uniform float uFoamStrength;
    uniform float uAudioBass;
    uniform float uAudioEnvelope;
    uniform float uAudioBeat;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vDisplacement;

    void main() {
      vec3 viewDir = normalize(uCameraPos - vWorldPos);

      // Fresnel
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

      // PHASE 8: Audio-reactive specular highlights
      vec3 halfDir = normalize(uSunDir + viewDir);
      float specular = pow(max(0.0, dot(vNormal, halfDir)), 128.0);
      specular *= (1.0 + uAudioEnvelope * 0.5); // Boost specular with audio

      // PHASE 8: Audio-reactive foam
      float foamThreshold = 0.8 - uAudioBass * 0.3; // Lower threshold with bass
      float foam = smoothstep(foamThreshold, foamThreshold + 0.4, vDisplacement / 2.0) * uFoamStrength;
      
      // Add beat-driven sparkle
      if (uAudioBeat > 0.5) {
        foam += uAudioBeat * 0.3 * smoothstep(0.9, 1.0, fresnel);
      }

      // Color mixing
      vec3 color = mix(uDeepColor, uWaterColor, fresnel);
      color += uSunColor * specular * 0.5;
      color = mix(color, vec3(1.0), foam * 0.8);

      // PHASE 8: Subtle color shift with bass
      vec3 bassTint = vec3(0.0, 0.1, 0.2) * uAudioBass;
      color += bassTint;

      gl_FragColor = vec4(color, 0.9 + foam * 0.1);
    }
  `;
  const uniforms = reactExports.useMemo(() => ({
    uTime: { value: 0 },
    uCameraPos: { value: new Vector3() },
    uSunDir: { value: new Vector3(0.5, 0.8, 0.3).normalize() },
    uSunColor: { value: new Color(isNight ? "#4488ff" : "#ffffee") },
    uWaterColor: { value: new Color(isNight ? "#001a33" : "#006994") },
    uDeepColor: { value: new Color(isNight ? "#000814" : "#003d5c") },
    uWaveHeight: { value: weather === "storm" ? 2 : 1 },
    uFoamStrength: { value: weather === "storm" ? 1 : 0.3 },
    // PHASE 8: Audio uniforms
    uAudioBass: { value: 0 },
    uAudioEnvelope: { value: 0 },
    uAudioBeat: { value: 0 }
  }), [isNight, weather]);
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = timeRef.current;
      materialRef.current.uniforms.uCameraPos.value.copy(camera.position);
      const targetWaveBoost = audioData.bass * 0.8 + audioData.envelope * 0.3;
      audioReactiveRef.current.waveBoost = MathUtils.lerp(
        audioReactiveRef.current.waveBoost,
        targetWaveBoost,
        0.1
      );
      const targetFoamBoost = audioData.beat ? audioData.beatIntensity * 0.5 : 0;
      audioReactiveRef.current.foamBoost = MathUtils.lerp(
        audioReactiveRef.current.foamBoost,
        targetFoamBoost,
        0.2
      );
      materialRef.current.uniforms.uAudioBass.value = audioReactiveRef.current.waveBoost;
      materialRef.current.uniforms.uAudioEnvelope.value = audioData.envelope;
      materialRef.current.uniforms.uAudioBeat.value = audioData.beat ? audioData.beatIntensity : 0;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        ref: meshRef,
        position: [0, -2.5, 0],
        rotation: [-Math.PI / 2, 0, 0],
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [1e3, 1e3, 256, 256] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "shaderMaterial",
            {
              ref: materialRef,
              uniforms,
              vertexShader: vertexShader2,
              fragmentShader: fragmentShader2,
              transparent: true,
              side: DoubleSide,
              depthWrite: false
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("points", { geometry: splashGeometry, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "shaderMaterial",
      {
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: `
            attribute float size;
            attribute float opacity;
            varying float vOpacity;
            void main() {
              vOpacity = opacity;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
        fragmentShader: `
            varying float vOpacity;
            void main() {
              vec2 coord = gl_PointCoord - vec2(0.5);
              float dist = length(coord);
              if (dist > 0.5) discard;
              float alpha = (1.0 - dist * 2.0) * vOpacity;
              gl_FragColor = vec4(0.8, 0.9, 1.0, alpha);
            }
          `
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WakeTrailsRenderer, { trails: wakeTrails })
  ] });
}
function WakeTrailsRenderer({ trails }) {
  const groupRef = reactExports.useRef(null);
  const lineGeometries = reactExports.useRef(/* @__PURE__ */ new Map());
  useFrame(() => {
    trails.current.forEach((trail, id) => {
      let geometry = lineGeometries.current.get(id);
      if (!geometry) {
        geometry = new BufferGeometry();
        lineGeometries.current.set(id, geometry);
      }
      const positions = new Float32Array(trail.points.length * 3);
      trail.points.forEach((point, i) => {
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y + 0.1;
        positions[i * 3 + 2] = point.z;
      });
      geometry.setAttribute("position", new BufferAttribute(positions, 3));
    });
  });
  const trailEntries = Array.from(trails.current.entries()).filter(
    ([id]) => lineGeometries.current.has(id)
  );
  if (trailEntries.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("group", { ref: groupRef, children: trailEntries.map(([id]) => {
    const geometry = lineGeometries.current.get(id);
    if (!geometry) return null;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("line", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: geometry, attach: "geometry" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("lineBasicMaterial", { attach: "material", color: "#ffffff", transparent: true, opacity: 0.3 })
    ] }, id);
  }) });
}
function Water({ isNight = true }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(InteractiveWater, { isNight });
}
const MAX_PROBES = 32;
const MAX_EMISSIVE = 16;
const _ZERO_VEC3 = new Vector3(0, 0, 0);
const _ZERO_COLOR = new Color(0, 0, 0);
function padVec3(arr, size) {
  const padded = arr.slice(0, size);
  while (padded.length < size) padded.push(_ZERO_VEC3);
  return padded;
}
function padColor(arr, size) {
  const padded = arr.slice(0, size);
  while (padded.length < size) padded.push(_ZERO_COLOR);
  return padded;
}
const ssgiFunctions = `
  // Hash function for random sampling
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // Screen-space ray marching for bounce lighting
  vec3 ssgiTrace(vec3 worldPos, vec3 worldNormal, vec3 viewDir, sampler2D depthTexture, sampler2D colorTexture, mat4 projectionMatrix, mat4 viewMatrix, vec2 resolution) {
    vec3 accumulatedLight = vec3(0.0);
    float totalWeight = 0.0;
    
    // Sample directions in hemisphere
    for (int i = 0; i < 4; i++) {
      // Generate random direction in hemisphere
      float angle = hash(worldPos.xy + vec2(float(i), uTime)) * 6.28318;
      float radius = hash(worldPos.yz + vec2(float(i), uTime * 0.5));
      
      vec3 sampleDir = normalize(vec3(
        cos(angle) * radius,
        sin(angle) * radius,
        sqrt(1.0 - radius * radius)
      ));
      
      // Transform to world space
      vec3 tangent = normalize(cross(worldNormal, vec3(0.0, 1.0, 0.0)));
      if (length(tangent) < 0.001) tangent = normalize(cross(worldNormal, vec3(1.0, 0.0, 0.0)));
      vec3 bitangent = cross(worldNormal, tangent);
      
      sampleDir = tangent * sampleDir.x + bitangent * sampleDir.y + worldNormal * sampleDir.z;
      
      // Ray march in screen space
      vec3 rayPos = worldPos + sampleDir * 0.1;
      float stepSize = 0.5;
      
      for (int step = 0; step < 32; step++) {
        rayPos += sampleDir * stepSize;
        
        // Project to screen space
        vec4 clipPos = projectionMatrix * viewMatrix * vec4(rayPos, 1.0);
        vec2 screenPos = clipPos.xy / clipPos.w * 0.5 + 0.5;
        
        // Check bounds
        if (screenPos.x < 0.0 || screenPos.x > 1.0 || screenPos.y < 0.0 || screenPos.y > 1.0) break;
        
        // Sample depth
        float sceneDepth = texture2D(depthTexture, screenPos).r;
        float rayDepth = clipPos.w;
        
        // Hit detection
        if (rayDepth > sceneDepth * 1.1) {
          // We hit something, accumulate color
          vec3 hitColor = texture2D(colorTexture, screenPos).rgb;
          float weight = max(0.0, dot(sampleDir, worldNormal));
          accumulatedLight += hitColor * weight;
          totalWeight += weight;
          break;
        }
        
        stepSize *= 1.1; // Exponential step size
      }
    }
    
    return totalWeight > 0.0 ? accumulatedLight / totalWeight * 0.3 : vec3(0.0);
  }
`;
const irradianceFunctions = `
  // Sample irradiance from probe grid
  vec3 sampleIrradiance(vec3 worldPos, vec3 normal) {
    vec3 irradiance = vec3(0.0);
    float totalWeight = 0.0;
    
    // Sample nearby probes (simplified - would use actual probe grid)
    for (int i = 0; i < uNumProbes; i++) {
      vec3 probePos = uProbePositions[i];
      vec3 probeIrradiance = uProbeIrradiance[i];
      float probeRadius = uProbeRadii[i];
      
      float dist = length(worldPos - probePos);
      if (dist > probeRadius) continue;
      
      float weight = 1.0 - dist / probeRadius;
      weight *= max(0.0, dot(normal, normalize(probePos - worldPos)));
      
      irradiance += probeIrradiance * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0.0 ? irradiance / totalWeight : vec3(0.0);
  }
`;
function GlobalIllumination({
  enabled = true,
  quality = "high"
}) {
  const meshRef = reactExports.useRef(null);
  const materialRef = reactExports.useRef(null);
  const { camera, size } = useThree();
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const ships2 = useGameStore((state) => state.ships);
  const lightIntensity = useGameStore((state) => state.lightIntensity);
  const emissiveSources = reactExports.useMemo(() => {
    const sources = [];
    ships2.forEach((ship) => {
      if (ship.version === "2.0") {
        sources.push({
          position: new Vector3(...ship.position),
          color: new Color("#ff00aa"),
          intensity: 2,
          radius: 30,
          type: "ship"
        });
      } else if (ship.version === "1.5") {
        sources.push({
          position: new Vector3(...ship.position),
          color: new Color("#00aaff"),
          intensity: 1,
          radius: 20,
          type: "ship"
        });
      }
      sources.push({
        position: new Vector3(ship.position[0], ship.position[1] + 10, ship.position[2]),
        color: new Color("#ff0000"),
        intensity: 0.5,
        radius: 15,
        type: "ship"
      });
    });
    sources.push({
      position: new Vector3(1.5, 8, 0),
      color: new Color("#ffaa44"),
      intensity: 1.5,
      radius: 25,
      type: "crane"
    });
    for (let i = 0; i < 5; i++) {
      sources.push({
        position: new Vector3(-40 + i * 20, 5, -10),
        color: new Color("#ffdd88"),
        intensity: 1,
        radius: 20,
        type: "dock"
      });
    }
    return sources;
  }, [ships2]);
  const probes = reactExports.useMemo(() => {
    const probeList = [];
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        probeList.push({
          position: new Vector3(x * 15, 0, z * 15),
          irradiance: new Color(0.1, 0.15, 0.2),
          influence: 20,
          lastUpdate: 0
        });
      }
    }
    ships2.forEach((ship) => {
      probeList.push({
        position: new Vector3(ship.position[0], 0, ship.position[2]),
        irradiance: new Color(0.2, 0.1, 0.15),
        influence: 25,
        lastUpdate: 0
      });
    });
    return probeList;
  }, [ships2]);
  const updateProbes = reactExports.useCallback(() => {
    probes.forEach((probe) => {
      const totalIrradiance = new Color(0, 0, 0);
      emissiveSources.forEach((source) => {
        const dist = probe.position.distanceTo(source.position);
        if (dist < source.radius) {
          const attenuation = 1 - dist / source.radius;
          const contribution = source.color.clone().multiplyScalar(source.intensity * attenuation * 0.1);
          totalIrradiance.add(contribution);
        }
      });
      if (timeOfDay < 6 || timeOfDay > 18) {
        totalIrradiance.add(new Color(0.02, 0.05, 0.1));
      } else {
        totalIrradiance.add(new Color(0.1, 0.1, 0.08));
      }
      probe.irradiance.lerp(totalIrradiance, 0.1);
    });
  }, [probes, emissiveSources, timeOfDay]);
  const uniforms = reactExports.useMemo(() => ({
    uTime: { value: 0 },
    uCameraPos: { value: new Vector3() },
    uResolution: { value: new Vector2(size.width, size.height) },
    uGIOffset: { value: new Vector3(0, 0, 0) },
    uGIStrength: { value: enabled ? 1 : 0 },
    uProbePositions: { value: padVec3(probes.map((p) => p.position), MAX_PROBES) },
    uProbeIrradiance: { value: padColor(probes.map((p) => p.irradiance), MAX_PROBES) },
    uProbeRadii: { value: probes.map((p) => p.influence) },
    uNumProbes: { value: probes.length },
    uEmissivePositions: { value: padVec3(emissiveSources.map((s) => s.position), MAX_EMISSIVE) },
    uEmissiveColors: { value: padColor(emissiveSources.map((s) => s.color), MAX_EMISSIVE) },
    uEmissiveIntensities: { value: emissiveSources.map((s) => s.intensity) },
    uEmissiveRadii: { value: emissiveSources.map((s) => s.radius) },
    uNumEmissive: { value: emissiveSources.length },
    uTimeOfDay: { value: timeOfDay },
    uLightIntensity: { value: lightIntensity }
  }), [probes, emissiveSources, enabled, size, timeOfDay, lightIntensity]);
  const vertexShader2 = `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader2 = `
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform vec2 uResolution;
    uniform float uGIStrength;
    uniform vec3 uProbePositions[32];
    uniform vec3 uProbeIrradiance[32];
    uniform float uProbeRadii[32];
    uniform int uNumProbes;
    uniform vec3 uEmissivePositions[16];
    uniform vec3 uEmissiveColors[16];
    uniform float uEmissiveIntensities[16];
    uniform float uEmissiveRadii[16];
    uniform int uNumEmissive;
    uniform float uTimeOfDay;
    uniform float uLightIntensity;
    
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    
    ${ssgiFunctions}
    ${irradianceFunctions}
    
    // Sample emissive lighting
    vec3 sampleEmissive(vec3 worldPos, vec3 normal) {
      vec3 emissive = vec3(0.0);
      
      for (int i = 0; i < 16; i++) {
        if (i >= uNumEmissive) break;
        
        vec3 toLight = uEmissivePositions[i] - worldPos;
        float dist = length(toLight);
        
        if (dist > uEmissiveRadii[i]) continue;
        
        toLight = normalize(toLight);
        float NdotL = max(0.0, dot(normal, toLight));
        
        float attenuation = 1.0 - dist / uEmissiveRadii[i];
        attenuation *= attenuation;
        
        emissive += uEmissiveColors[i] * uEmissiveIntensities[i] * NdotL * attenuation;
      }
      
      return emissive;
    }
    
    // Color bleeding approximation
    vec3 colorBleed(vec3 worldPos, vec3 normal) {
      vec3 bleed = vec3(0.0);
      
      // Sample nearby emissive sources for color bleeding
      for (int i = 0; i < 16; i++) {
        if (i >= uNumEmissive) break;
        
        vec3 toSource = uEmissivePositions[i] - worldPos;
        float dist = length(toSource);
        
        if (dist > uEmissiveRadii[i] * 0.5) continue;
        
        // Color bleeding is stronger on grazing angles
        float fresnel = 1.0 - abs(dot(normalize(toSource), normal));
        fresnel = pow(fresnel, 2.0);
        
        float attenuation = 1.0 - dist / (uEmissiveRadii[i] * 0.5);
        
        bleed += uEmissiveColors[i] * fresnel * attenuation * 0.5;
      }
      
      return bleed;
    }
    
    void main() {
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      
      // Base indirect lighting from probes
      vec3 indirectLight = sampleIrradiance(vWorldPos, vNormal) * uLightIntensity;
      
      // Emissive light propagation
      vec3 emissiveLight = sampleEmissive(vWorldPos, vNormal);
      
      // Color bleeding effect
      vec3 bleed = colorBleed(vWorldPos, vNormal);
      
      // Combine
      vec3 gi = (indirectLight + emissiveLight + bleed) * uGIStrength;
      
      // Output as additive light
      gl_FragColor = vec4(gi, 1.0);
    }
  `;
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uCameraPos.value.copy(camera.position);
    }
    updateProbes();
  });
  if (!enabled) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, frustumCulled: false, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [200, 200, 64, 64] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "shaderMaterial",
        {
          ref: materialRef,
          uniforms,
          vertexShader: vertexShader2,
          fragmentShader: fragmentShader2,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          side: DoubleSide
        }
      )
    ] }),
    emissiveSources.map((source, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      EmissiveGlow,
      {
        position: source.position,
        color: source.color,
        intensity: source.intensity,
        radius: source.radius
      },
      i
    )),
    quality === "high" && probes.map((probe, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      ProbeVisualizer,
      {
        position: probe.position,
        irradiance: probe.irradiance
      },
      i
    ))
  ] });
}
function EmissiveGlow({
  position,
  color,
  intensity,
  radius
}) {
  const meshRef = reactExports.useRef(null);
  const uniforms = reactExports.useMemo(() => ({
    uColor: { value: color },
    uIntensity: { value: intensity },
    uTime: { value: 0 }
  }), [color, intensity]);
  const vertexShader2 = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader2 = `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uTime;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
      
      // Pulsing effect
      float pulse = 0.9 + sin(uTime * 3.0) * 0.1;
      
      vec3 glow = uColor * uIntensity * fresnel * pulse;
      
      gl_FragColor = vec4(glow, fresnel * 0.5);
    }
  `;
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [radius * 0.3, 16, 16] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "shaderMaterial",
      {
        uniforms,
        vertexShader: vertexShader2,
        fragmentShader: fragmentShader2,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: BackSide
      }
    )
  ] });
}
function ProbeVisualizer({
  position,
  irradiance
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.5, 0.5, 0.5] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshBasicMaterial",
      {
        color: irradiance,
        transparent: true,
        opacity: 0.3
      }
    )
  ] });
}
function AudioReactiveLight({ position, type, color = "#ffffff", shipType }) {
  const meshRef = reactExports.useRef(null);
  const lightRef = reactExports.useRef(null);
  const { audioData } = useAudioVisualSync();
  const getFrequencyResponse = reactExports.useCallback(() => {
    switch (type) {
      case "led-strip":
        return {
          intensity: audioData.bass * 2 + 0.2,
          saturation: 1,
          hueShift: audioData.beat ? 0.1 : 0
        };
      case "spotlight":
        return {
          intensity: audioData.mid * 2.5 + 0.1,
          saturation: 0.8,
          hueShift: audioData.spectralCentroid * 0.2
        };
      case "laser":
        return {
          intensity: audioData.treble * 3,
          saturation: 1,
          hueShift: 0
        };
      case "strobe":
        return {
          intensity: audioData.beat ? audioData.beatIntensity * 5 : 0,
          saturation: 1,
          hueShift: 0
        };
      case "neon":
        return {
          intensity: audioData.envelope * 1.5 + 0.5,
          saturation: 0.9,
          hueShift: audioData.beatPhase * 0.1
        };
    }
  }, [audioData, type]);
  const getShipColor = reactExports.useCallback((baseHue) => {
    const palettes = {
      cruise: { h: 340, s: 0.8, l: 0.6 },
      // Pink
      container: { h: 160, s: 0.9, l: 0.5 },
      // Cyan/Green
      tanker: { h: 25, s: 1, l: 0.5 },
      // Orange
      bulk: { h: 30, s: 0.6, l: 0.4 },
      // Brown
      lng: { h: 195, s: 0.9, l: 0.6 },
      // Light Blue
      roro: { h: 280, s: 0.7, l: 0.5 },
      // Purple
      research: { h: 145, s: 0.8, l: 0.5 },
      // Green
      droneship: { h: 0, s: 0, l: 0.8 }
      // White/Gray
    };
    const palette = palettes[shipType];
    const hue = (palette.h / 360 + baseHue) % 1;
    return new Color().setHSL(hue, palette.s, palette.l);
  }, [shipType]);
  useFrame(() => {
    if (!meshRef.current || !lightRef.current) return;
    const response = getFrequencyResponse();
    const baseColor = getShipColor(response.hueShift);
    const material = meshRef.current.material;
    material.emissiveIntensity = response.intensity;
    material.emissive.copy(baseColor);
    lightRef.current.intensity = response.intensity * 2;
    lightRef.current.color.copy(baseColor);
    const scale = 1 + audioData.bass * 0.1;
    meshRef.current.scale.setScalar(scale);
  });
  const geometry = reactExports.useMemo(() => {
    switch (type) {
      case "led-strip":
        return new BoxGeometry(4, 0.2, 0.2);
      case "spotlight":
        return new ConeGeometry(0.5, 1, 16);
      case "laser":
        return new CylinderGeometry(0.05, 0.05, 10);
      case "strobe":
        return new SphereGeometry(0.3);
      case "neon":
        return new TubeGeometry(
          new LineCurve3(new Vector3(-2, 0, 0), new Vector3(2, 0, 0)),
          20,
          0.1,
          8,
          false
        );
    }
  }, [type]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { ref: meshRef, geometry, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: 1118481,
        emissive: color,
        emissiveIntensity: 0.5,
        toneMapped: false
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        ref: lightRef,
        intensity: 1,
        distance: type === "laser" ? 50 : 20,
        color
      }
    )
  ] });
}
function AudioReactiveGodRay({ position, color }) {
  const materialRef = reactExports.useRef(null);
  const { audioData } = useAudioVisualSync();
  const uniforms = reactExports.useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color(color) },
    uBaseIntensity: { value: 0.5 },
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioEnvelope: { value: 0 },
    uAudioBeat: { value: 0 }
  }), [color]);
  useFrame((state) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uAudioBass.value = audioData.bass;
    mat.uniforms.uAudioMid.value = audioData.mid;
    mat.uniforms.uAudioEnvelope.value = audioData.envelope;
    mat.uniforms.uAudioBeat.value = audioData.beat ? audioData.beatIntensity : 0;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position, rotation: [-Math.PI / 2, 0, 0], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [2, 20, 32, 1, true] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "shaderMaterial",
      {
        ref: materialRef,
        uniforms,
        vertexShader: `
          varying vec2 vUv;
          varying float vHeight;
          void main() {
            vUv = uv;
            vHeight = position.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uBaseIntensity;
          uniform float uAudioBass;
          uniform float uAudioMid;
          uniform float uAudioEnvelope;
          uniform float uAudioBeat;
          
          varying vec2 vUv;
          varying float vHeight;
          
          void main() {
            // Base fade from bottom to top
            float alpha = (1.0 - vUv.y) * uBaseIntensity;
            
            // Audio-reactive intensity
            float audioBoost = uAudioBass * 0.5 + uAudioMid * 0.3;
            alpha *= (1.0 + audioBoost);
            
            // Beat flash
            if (uAudioBeat > 0.5) {
              alpha *= 1.5;
            }
            
            // Animated shimmer synced to envelope
            float shimmer = 0.8 + 0.2 * sin(uTime * 3.0 + vUv.y * 8.0 + uAudioEnvelope * 5.0);
            alpha *= shimmer;
            
            // Color temperature shift based on mid frequencies
            vec3 finalColor = uColor;
            if (uAudioMid > 0.5) {
              finalColor = mix(finalColor, vec3(1.0, 0.9, 0.7), uAudioMid * 0.3);
            }
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide
      }
    )
  ] });
}
function AudioReactiveLightShow({ enabled = true }) {
  const ships2 = useGameStore((state) => state.ships);
  const { audioData } = useAudioVisualSync();
  const upgradedShips = ships2.filter((s) => s.version === "2.0");
  if (!enabled || upgradedShips.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("group", { children: upgradedShips.map((ship) => {
    const basePos = ship.position;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AudioReactiveLight,
        {
          position: [basePos[0] - 10, basePos[1] + 8, basePos[2] + 5],
          type: "led-strip",
          shipType: ship.type
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AudioReactiveLight,
        {
          position: [basePos[0] + 10, basePos[1] + 8, basePos[2] - 5],
          type: "led-strip",
          shipType: ship.type
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AudioReactiveLight,
        {
          position: [basePos[0] - 12, basePos[1] + 12, basePos[2] + 8],
          type: "spotlight",
          shipType: ship.type
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AudioReactiveLight,
        {
          position: [basePos[0] + 12, basePos[1] + 12, basePos[2] - 8],
          type: "spotlight",
          shipType: ship.type
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AudioReactiveLight,
        {
          position: [basePos[0], basePos[1] + 15, basePos[2]],
          type: "laser",
          shipType: ship.type
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AudioReactiveLight,
        {
          position: [basePos[0] + 5, basePos[1] + 10, basePos[2]],
          type: "strobe",
          shipType: ship.type
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AudioReactiveLight,
        {
          position: [basePos[0] - 5, basePos[1] + 6, basePos[2] + 3],
          type: "neon",
          shipType: ship.type
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AudioReactiveGodRay,
        {
          position: [basePos[0], basePos[1] + 20, basePos[2]],
          color: ship.type === "cruise" ? "#ff6b9d" : ship.type === "container" ? "#00d4aa" : "#ff9500"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AudioReactiveAmbientLight, { shipPosition: basePos, audioData })
    ] }, ship.id);
  }) });
}
function AudioReactiveAmbientLight({
  shipPosition,
  audioData
}) {
  const lightRef = reactExports.useRef(null);
  useFrame(() => {
    if (!lightRef.current) return;
    const baseIntensity = 0.5;
    const audioBoost = audioData.energy * 2;
    const beatFlash = audioData.beat ? audioData.beatIntensity : 0;
    lightRef.current.intensity = baseIntensity + audioBoost + beatFlash;
    const warmth = audioData.spectralCentroid;
    const color = new Color();
    color.setHSL(0.1 + warmth * 0.1, 0.8, 0.5);
    lightRef.current.color.copy(color);
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "pointLight",
    {
      ref: lightRef,
      position: [shipPosition[0], shipPosition[1] + 10, shipPosition[2]],
      intensity: 0.5,
      distance: 60,
      decay: 2
    }
  );
}
function HolographicShipStatus({ shipId, position }) {
  var _a2;
  const groupRef = reactExports.useRef(null);
  const wireframeRef = reactExports.useRef(null);
  const { audioData } = useAudioVisualSync();
  const ships2 = useGameStore((state) => state.ships);
  const installedUpgrades = useGameStore((state) => state.installedUpgrades);
  const ship = ships2.find((s) => s.id === shipId);
  if (!ship) return null;
  const shipUpgrades = installedUpgrades.filter((u) => u.shipId === shipId);
  const progress = shipUpgrades.length / (((_a2 = ship.attachmentPoints) == null ? void 0 : _a2.length) || 1);
  const shipColor = ship.type === "cruise" ? "#ff6b9d" : ship.type === "container" ? "#00d4aa" : "#ff9500";
  useFrame((state) => {
    if (!groupRef.current || !wireframeRef.current) return;
    const time = state.clock.elapsedTime;
    groupRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.2;
    groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
    const flicker = 0.9 + Math.sin(time * 10) * 0.05 + Math.random() * 0.05;
    const material = wireframeRef.current.material;
    material.opacity = flicker;
    if (audioData.beat) {
      const scale = 1 + audioData.bass * 0.1;
      groupRef.current.scale.setScalar(scale);
    } else {
      groupRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1);
    }
  });
  const wireframeGeometry = reactExports.useMemo(() => {
    const shape = new Shape();
    if (ship.type === "cruise") {
      shape.moveTo(-2, 0);
      shape.lineTo(2, 0);
      shape.lineTo(1.8, 0.8);
      shape.lineTo(-1.5, 1);
      shape.lineTo(-2, 0);
    } else if (ship.type === "container") {
      shape.moveTo(-2.5, 0);
      shape.lineTo(2.5, 0);
      shape.lineTo(2.5, 0.6);
      shape.lineTo(-2.5, 0.6);
      shape.lineTo(-2.5, 0);
    } else {
      shape.absarc(0, 0.3, 1.5, 0, Math.PI * 2);
    }
    const extrudeSettings = { depth: 0.5, bevelEnabled: false };
    const geometry = new ExtrudeGeometry(shape, extrudeSettings);
    return new WireframeGeometry(geometry);
  }, [ship.type]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("lineSegments", { ref: wireframeRef, geometry: wireframeGeometry, children: /* @__PURE__ */ jsxRuntimeExports.jsx("lineBasicMaterial", { color: shipColor, transparent: true, opacity: 0.8 }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -0.1, 0], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("ringGeometry", { args: [1.5, 1.8, 32] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: shipColor, transparent: true, opacity: 0.3 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -0.09, 0], rotation: [-Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("ringGeometry", { args: [1.5, 1.8, 32, 1, 0, progress * Math.PI * 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: shipColor, transparent: true, opacity: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AudioVizBars, { position: [0, 2, 0], color: shipColor }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      StatusLabel,
      {
        position: [0, 2.5, 0],
        text: `${Math.round(progress * 100)}%`,
        color: shipColor
      }
    )
  ] });
}
function AudioVizBars({ position, color }) {
  const barsRef = reactExports.useRef(null);
  const { audioData } = useAudioVisualSync();
  const barCount = 8;
  useFrame(() => {
    if (!barsRef.current) return;
    barsRef.current.children.forEach((bar, i) => {
      const freqValue = i < 2 ? audioData.bass : i < 4 ? audioData.mid : i < 6 ? audioData.highMid : audioData.treble;
      const targetHeight = 0.2 + freqValue * 0.8;
      bar.scale.y = MathUtils.lerp(bar.scale.y, targetHeight, 0.2);
      bar.position.y = position[1] + bar.scale.y * 0.5;
    });
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("group", { ref: barsRef, children: Array.from({ length: barCount }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "mesh",
    {
      position: [position[0] + (i - barCount / 2) * 0.3, position[1], position[2]],
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.15, 1, 0.15] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "meshBasicMaterial",
          {
            color,
            transparent: true,
            opacity: 0.6 + i / barCount * 0.4
          }
        )
      ]
    },
    i
  )) });
}
function StatusLabel({ position, text, color }) {
  const canvas = reactExports.useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, 128, 64);
    ctx.font = "bold 32px monospace";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 64, 32);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    for (let i = 0; i < 64; i += 4) {
      ctx.fillRect(0, i, 128, 1);
    }
    return c;
  }, [text, color]);
  const texture = reactExports.useMemo(() => new CanvasTexture(canvas), [canvas]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [1.5, 0.75] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshBasicMaterial",
      {
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: DoubleSide
      }
    )
  ] });
}
function HolographicElements() {
  const ships2 = useGameStore((state) => state.ships);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("group", { children: ships2.map((ship) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    HolographicShipStatus,
    {
      shipId: ship.id,
      position: [ship.position[0], ship.position[1] + 8, ship.position[2]]
    },
    ship.id
  )) });
}
function CameraLensRain({ intensity = 0.5 }) {
  const meshRef = reactExports.useRef(null);
  const { camera } = useThree();
  const rainTexture = reactExports.useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);
    const dropCount = Math.floor(50 * intensity);
    for (let i = 0; i < dropCount; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = 5 + Math.random() * 20;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, "rgba(200, 220, 255, 0.9)");
      gradient.addColorStop(0.3, "rgba(150, 180, 220, 0.5)");
      gradient.addColorStop(0.7, "rgba(100, 140, 200, 0.2)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return texture;
  }, [intensity]);
  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.copy(camera.position);
    meshRef.current.quaternion.copy(camera.quaternion);
    meshRef.current.translateZ(-0.5);
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [2, 2] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshBasicMaterial",
      {
        map: rainTexture,
        transparent: true,
        opacity: 0.6,
        depthTest: false,
        depthWrite: false,
        blending: NormalBlending
      }
    )
  ] });
}
function LightningFlash({ active, intensity = 1 }) {
  const lightRef = reactExports.useRef(null);
  const ambientRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (active && lightRef.current) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      lightRef.current.position.set(
        Math.cos(angle) * distance,
        100 + Math.random() * 50,
        Math.sin(angle) * distance
      );
    }
  }, [active]);
  useFrame(() => {
    if (!lightRef.current || !ambientRef.current) return;
    if (active) {
      const flashIntensity = intensity * (0.5 + Math.random() * 0.5);
      lightRef.current.intensity = flashIntensity * 5;
      ambientRef.current.intensity = flashIntensity * 0.5;
    } else {
      lightRef.current.intensity *= 0.3;
      ambientRef.current.intensity *= 0.3;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "directionalLight",
      {
        ref: lightRef,
        intensity: 0,
        color: "#ffffff",
        castShadow: true,
        "shadow-mapSize": [2048, 2048],
        "shadow-camera-far": 200,
        "shadow-camera-left": -50,
        "shadow-camera-right": 50,
        "shadow-camera-top": 50,
        "shadow-camera-bottom": -50
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ambientLight", { ref: ambientRef, intensity: 0, color: "#e0f0ff" })
  ] });
}
function WindSweptRain({ intensity = 1, windAngle = 0 }) {
  const pointsRef = reactExports.useRef(null);
  const count = Math.floor(2e3 * intensity);
  const { positions, velocities } = reactExports.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = Math.random() * 100;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
      const windStrength = 0.5 + Math.random() * 0.5;
      vel[i * 3] = Math.cos(windAngle) * windStrength;
      vel[i * 3 + 1] = -2 - Math.random() * 3;
      vel[i * 3 + 2] = Math.sin(windAngle) * windStrength;
    }
    return { positions: pos, velocities: vel };
  }, [count, windAngle]);
  useFrame((_, delta) => {
    var _a2, _b2, _c;
    if (!((_c = (_b2 = (_a2 = pointsRef.current) == null ? void 0 : _a2.geometry) == null ? void 0 : _b2.attributes) == null ? void 0 : _c.position)) return;
    const positions2 = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      positions2[i * 3] += velocities[i * 3] * delta * 10;
      positions2[i * 3 + 1] += velocities[i * 3 + 1] * delta * 10;
      positions2[i * 3 + 2] += velocities[i * 3 + 2] * delta * 10;
      if (positions2[i * 3 + 1] < -5) {
        positions2[i * 3] = (Math.random() - 0.5) * 200;
        positions2[i * 3 + 1] = 100;
        positions2[i * 3 + 2] = (Math.random() - 0.5) * 200;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("points", { ref: pointsRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("bufferGeometry", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "bufferAttribute",
      {
        attach: "attributes-position",
        count,
        array: positions,
        itemSize: 3
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointsMaterial",
      {
        color: "#a0c0e0",
        size: 0.3,
        transparent: true,
        opacity: 0.6,
        blending: AdditiveBlending
      }
    )
  ] });
}
function MistBanks({ intensity: _intensity = 0.5 }) {
  const mistRef = reactExports.useRef(null);
  useFrame((state) => {
    if (!mistRef.current) return;
    mistRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    const material = mistRef.current.material;
    material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: mistRef, position: [0, 5, 0], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [150, 10, 150] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "shaderMaterial",
      {
        transparent: true,
        depthWrite: false,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          void main() {
            float n = noise(vUv * 10.0);
            float alpha = n * 0.15 * (1.0 - abs(vUv.y - 0.5) * 2.0);
            gl_FragColor = vec4(0.9, 0.95, 1.0, alpha);
          }
        `
      }
    )
  ] });
}
function EnhancedWeather({ enabled = true }) {
  const weather = useGameStore((state) => state.weather);
  const { audioData } = useAudioVisualSync();
  const [lightningActive, setLightningActive] = reactExports.useState(false);
  const lastLightningRef = reactExports.useRef(0);
  useFrame((state) => {
    if (weather !== "storm") return;
    const now = state.clock.elapsedTime;
    const baseChance = 0.01;
    const beatBoost = audioData.beat ? 0.05 : 0;
    const lightningChance = baseChance + beatBoost;
    if (now - lastLightningRef.current > 2 && Math.random() < lightningChance) {
      setLightningActive(true);
      lastLightningRef.current = now;
      setTimeout(() => setLightningActive(false), 150);
    }
  });
  if (!enabled) return null;
  const weatherConfig = {
    clear: { rain: 0, mist: 0, wind: 0, lensDrops: 0 },
    rain: { rain: 0.5, mist: 0.3, wind: 0.2, lensDrops: 0.4 },
    fog: { rain: 0, mist: 0.8, wind: 0.1, lensDrops: 0.2 },
    storm: { rain: 1, mist: 0.5, wind: 0.8, lensDrops: 0.8 }
  };
  const config = weatherConfig[weather] || weatherConfig.clear;
  if (weather === "clear") return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    config.rain > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
      WindSweptRain,
      {
        intensity: config.rain,
        windAngle: weather === "storm" ? 0.5 : 0.1
      }
    ),
    config.mist > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(MistBanks, { intensity: config.mist }),
    config.lensDrops > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(CameraLensRain, { intensity: config.lensDrops }),
    weather === "storm" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      LightningFlash,
      {
        active: lightningActive,
        intensity: audioData.beat ? audioData.beatIntensity : 1
      }
    )
  ] });
}
const QUALITY_CONFIGS = {
  low: {
    bloom: { intensity: 1.2, threshold: 0.5, radius: 0.5 },
    vignette: 0.35,
    chromaticAberration: 0,
    filmGrain: 0.015,
    contrast: 1.05,
    dof: false,
    ssao: false
  },
  medium: {
    bloom: { intensity: 1.8, threshold: 0.4, radius: 0.6 },
    vignette: 0.45,
    chromaticAberration: 8e-4,
    filmGrain: 0.025,
    contrast: 1.1,
    dof: true,
    ssao: false
  },
  high: {
    bloom: { intensity: 2.4, threshold: 0.35, radius: 0.75 },
    vignette: 0.55,
    chromaticAberration: 15e-4,
    filmGrain: 0.035,
    contrast: 1.15,
    dof: true,
    ssao: true
  },
  cinema: {
    bloom: { intensity: 3, threshold: 0.28, radius: 0.9 },
    vignette: 0.65,
    chromaticAberration: 25e-4,
    filmGrain: 0.045,
    contrast: 1.2,
    dof: true,
    ssao: true
  }
};
const COLOR_LUTS = {
  dawn: {
    brightness: 0.92,
    contrast: 1.08,
    saturation: 0.85,
    warmth: 0.25,
    tint: [0.05, 0.03, 0],
    shadows: [0.04, 0.04, 0.08],
    highlights: [1, 0.92, 0.75],
    bloomTint: "#ffcc80"
  },
  day: {
    brightness: 1.02,
    contrast: 1.02,
    saturation: 0.95,
    warmth: 0.08,
    tint: [0, 0, 0],
    shadows: [0.08, 0.09, 0.12],
    highlights: [1, 0.98, 0.95],
    bloomTint: "#ffffff"
  },
  golden: {
    brightness: 0.97,
    contrast: 1.12,
    saturation: 1.05,
    warmth: 0.42,
    tint: [0.15, 0.08, 0],
    shadows: [0.12, 0.08, 0.04],
    highlights: [1, 0.88, 0.65],
    bloomTint: "#ffaa60"
  },
  blueHour: {
    brightness: 0.88,
    contrast: 1.15,
    saturation: 0.88,
    warmth: -0.15,
    tint: [0, 0.03, 0.12],
    shadows: [0.02, 0.03, 0.06],
    highlights: [0.72, 0.82, 1],
    bloomTint: "#80c0ff"
  },
  night: {
    brightness: 0.85,
    contrast: 1.18,
    saturation: 0.82,
    warmth: -0.25,
    tint: [0, 0.02, 0.06],
    shadows: [0.01, 0.02, 0.04],
    highlights: [0.65, 0.75, 0.92],
    bloomTint: "#60a0ff"
  }
};
function PostProcessing({ enabled = true, audioData }) {
  const { scene, camera, gl, size } = useThree();
  const qualityPreset = useGameStore((state) => state.qualityPreset);
  const isNight = useGameStore((state) => state.isNight);
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  const bpm = useGameStore((state) => state.bpm);
  const ships2 = useGameStore((state) => state.ships);
  const currentShipId = useGameStore((state) => state.currentShipId);
  const config = QUALITY_CONFIGS[qualityPreset];
  const currentShip = ships2.find((s) => s.id === currentShipId);
  const lightShowActive = reactExports.useMemo(() => ships2.some((s) => s.version === "2.0"), [ships2]);
  const getTimeLUT = reactExports.useCallback(() => {
    if (timeOfDay >= 5 && timeOfDay < 8) return COLOR_LUTS.dawn;
    if (timeOfDay >= 8 && timeOfDay < 17) return COLOR_LUTS.day;
    if (timeOfDay >= 17 && timeOfDay < 20) return COLOR_LUTS.golden;
    if (timeOfDay >= 20 && timeOfDay < 22) return COLOR_LUTS.blueHour;
    return COLOR_LUTS.night;
  }, [timeOfDay]);
  const composerRef = reactExports.useRef(null);
  const bloomPassRef = reactExports.useRef(null);
  const colorPassRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!enabled) return;
    let isMounted = true;
    let composer = null;
    const init = async () => {
      try {
        const [
          { EffectComposer },
          { RenderPass },
          { UnrealBloomPass },
          { ShaderPass }
        ] = await Promise.all([
          __vitePreload(() => import("./EffectComposer-CeHmhoIr.js"), true ? __vite__mapDeps([0,1,2,3,4,5]) : void 0, import.meta.url),
          __vitePreload(() => import("./RenderPass-DGRu1HwP.js"), true ? __vite__mapDeps([6,1,2,5]) : void 0, import.meta.url),
          __vitePreload(() => import("./UnrealBloomPass-DFiFqqNJ.js"), true ? __vite__mapDeps([7,1,2,5,3]) : void 0, import.meta.url),
          __vitePreload(() => import("./ShaderPass-B-A7CtId.js"), true ? __vite__mapDeps([4,1,2,5]) : void 0, import.meta.url)
        ]);
        if (!isMounted) return;
        composer = new EffectComposer(gl);
        composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        composer.addPass(new RenderPass(scene, camera));
        const bloomPass = new UnrealBloomPass(
          new Vector2(size.width, size.height),
          config.bloom.intensity,
          0.5,
          config.bloom.threshold
        );
        composer.addPass(bloomPass);
        bloomPassRef.current = bloomPass;
        const colorGradingShader = createColorGradingShader(getTimeLUT(), config);
        const colorPass = new ShaderPass(colorGradingShader);
        composer.addPass(colorPass);
        colorPassRef.current = colorPass;
        if (config.ssao) {
          const ssaoPass = createSSAOPass(scene, camera, size);
          if (ssaoPass) ;
        }
        composerRef.current = composer;
      } catch (error) {
        console.warn("Post-processing init failed:", error);
      }
    };
    init();
    return () => {
      isMounted = false;
      composer == null ? void 0 : composer.dispose();
    };
  }, [enabled, gl, scene, camera, size, config.bloom.intensity, config.bloom.threshold, config.ssao]);
  reactExports.useEffect(() => {
    if (colorPassRef.current) {
      const lut = getTimeLUT();
      colorPassRef.current.uniforms.uBrightness.value = lut.brightness;
      colorPassRef.current.uniforms.uContrast.value = lut.contrast;
      colorPassRef.current.uniforms.uSaturation.value = lut.saturation;
      colorPassRef.current.uniforms.uWarmth.value = lut.warmth;
      colorPassRef.current.uniforms.uTint.value.set(...lut.tint);
      colorPassRef.current.uniforms.uShadows.value.set(...lut.shadows);
      colorPassRef.current.uniforms.uHighlights.value.set(...lut.highlights);
    }
  }, [getTimeLUT, timeOfDay]);
  const beatRef = reactExports.useRef({ intensity: 1, lastBeat: 0, pulse: 0 });
  useFrame((state) => {
    if (!composerRef.current || !enabled) return;
    const time = state.clock.elapsedTime;
    const beatDuration = 60 / bpm;
    const beatNum = Math.floor(time / beatDuration);
    if (beatNum !== beatRef.current.lastBeat && lightShowActive) {
      beatRef.current.intensity = 1.4;
      beatRef.current.pulse = 1;
      beatRef.current.lastBeat = beatNum;
    } else {
      beatRef.current.intensity = MathUtils.lerp(beatRef.current.intensity, 1, 0.08);
      beatRef.current.pulse = MathUtils.lerp(beatRef.current.pulse, 0, 0.15);
    }
    if (bloomPassRef.current) {
      const baseIntensity = config.bloom.intensity * (isNight ? 1.3 : 0.9);
      const audioBoost = audioData ? audioData.bass * 0.5 + audioData.envelope * 0.3 : 0;
      bloomPassRef.current.strength = baseIntensity * beatRef.current.intensity * (1 + audioBoost);
      if (audioData) {
        const baseThreshold = config.bloom.threshold;
        bloomPassRef.current.threshold = baseThreshold - audioData.energy * 0.1;
      }
    }
    if (colorPassRef.current) {
      colorPassRef.current.uniforms.uTime.value = time;
      colorPassRef.current.uniforms.uBeatPulse.value = beatRef.current.pulse;
      if (currentShip && config.dof) {
        const shipPos = new Vector3(...currentShip.position);
        const distance = camera.position.distanceTo(shipPos);
        colorPassRef.current.uniforms.uFocusDistance.value = distance;
      }
    }
    try {
      composerRef.current.render();
    } catch (e) {
    }
  });
  return null;
}
function createColorGradingShader(lut, config) {
  return {
    uniforms: {
      tDiffuse: { value: null },
      uBrightness: { value: lut.brightness },
      uContrast: { value: lut.contrast },
      uSaturation: { value: lut.saturation },
      uWarmth: { value: lut.warmth },
      uTint: { value: new Vector3(...lut.tint) },
      uShadows: { value: new Vector3(...lut.shadows) },
      uHighlights: { value: new Vector3(...lut.highlights) },
      uVignette: { value: config.vignette },
      uChromaticAberration: { value: config.chromaticAberration },
      uFilmGrain: { value: config.filmGrain },
      uTime: { value: 0 },
      uBeatPulse: { value: 0 },
      uFocusDistance: { value: 10 },
      uDofEnabled: { value: config.dof ? 1 : 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uBrightness;
      uniform float uContrast;
      uniform float uSaturation;
      uniform float uWarmth;
      uniform vec3 uTint;
      uniform vec3 uShadows;
      uniform vec3 uHighlights;
      uniform float uVignette;
      uniform float uChromaticAberration;
      uniform float uFilmGrain;
      uniform float uTime;
      uniform float uBeatPulse;
      uniform float uFocusDistance;
      uniform float uDofEnabled;
      varying vec2 vUv;
      
      // ACES Filmic Tone Mapping
      vec3 acesFilmic(vec3 x) {
        float a = 2.51;
        float b = 0.03;
        float c = 2.43;
        float d = 0.59;
        float e = 0.14;
        return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
      }
      
      // Contrast adjustment
      vec3 adjustContrast(vec3 color, float contrast) {
        return (color - 0.5) * contrast + 0.5;
      }
      
      // Saturation adjustment
      vec3 adjustSaturation(vec3 color, float saturation) {
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        return mix(vec3(gray), color, saturation);
      }
      
      // Warmth adjustment
      vec3 adjustWarmth(vec3 color, float warmth) {
        vec3 warm = vec3(1.0, 0.9, 0.8);
        vec3 cool = vec3(0.9, 0.95, 1.0);
        vec3 tint = mix(cool, warm, warmth * 0.5 + 0.5);
        return color * tint;
      }
      
      // Shadow/Highlight adjustment
      vec3 adjustShadowsHighlights(vec3 color, vec3 shadows, vec3 highlights) {
        float luma = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 shadowTint = mix(vec3(1.0), shadows, 1.0 - smoothstep(0.0, 0.3, luma));
        vec3 highlightTint = mix(vec3(1.0), highlights, smoothstep(0.7, 1.0, luma));
        return color * shadowTint * highlightTint;
      }
      
      // Film grain
      float random(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec2 uv = vUv;
        
        // 5.3 Chromatic Aberration
        vec2 center = uv - 0.5;
        float dist = length(center);
        vec2 direction = normalize(center);
        vec2 caOffset = direction * uChromaticAberration * dist * (1.0 + uBeatPulse * 0.5);
        
        float r = texture2D(tDiffuse, uv + caOffset).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv - caOffset).b;
        vec3 color = vec3(r, g, b);
        
        // Apply color grading
        color = adjustShadowsHighlights(color, uShadows, uHighlights);
        color = adjustWarmth(color, uWarmth);
        color = adjustSaturation(color, uSaturation);
        color = adjustContrast(color, uContrast);
        color *= uBrightness;
        
        // ACES tone mapping
        color = acesFilmic(color);
        
        // 5.1 Vignette
        float vignette = 1.0 - dist * uVignette * (0.8 + uBeatPulse * 0.3);
        color *= vignette;
        
        // 5.1 Film Grain
        float grain = random(uv + uTime * 0.01);
        color += (grain - 0.5) * uFilmGrain * (1.0 + uBeatPulse * 0.5);
        
        // Color tint
        color += uTint * 0.1;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  };
}
function createSSAOPass(_scene, _camera, _size) {
  return null;
}
function MultiviewSystem({ enabled, underwaterIntensity = 1 }) {
  const ships2 = useGameStore((state) => state.ships);
  const currentShipId = useGameStore((state) => state.currentShipId);
  const craneState = useGameStore((state) => ({
    rotation: state.craneRotation ?? 0.2,
    height: state.craneHeight ?? 15.5,
    spreaderPos: state.spreaderPos ?? { x: 0, y: 10, z: 0 }
  }));
  const bpm = useGameStore((state) => state.bpm);
  const spectatorState = useGameStore((state) => state.spectatorState);
  const { audioData } = useAudioVisualSync();
  const currentShip = ships2.find((s) => s.id === currentShipId);
  const virtualCameras = reactExports.useMemo(() => ({
    crane: new PerspectiveCamera$1(60, 1, 0.1, 1e3),
    hook: new PerspectiveCamera$1(75, 1, 0.1, 1e3),
    drone: new PerspectiveCamera$1(50, 1, 0.1, 1e3),
    underwater: new PerspectiveCamera$1(70, 1, 0.1, 500)
  }), []);
  const dronePath = reactExports.useMemo(() => {
    if (!currentShip) return null;
    const shipPos = new Vector3(...currentShip.position);
    const points = [];
    const segments = 12;
    const radius = currentShip.type === "tanker" ? 50 : currentShip.type === "container" ? 40 : 35;
    const height = 20;
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const variation = Math.sin(i * 0.5) * 5;
      points.push(new Vector3(
        shipPos.x + Math.cos(angle) * (radius + variation),
        shipPos.y + height + Math.cos(i * 0.3) * 8,
        shipPos.z + Math.sin(angle) * (radius + variation)
      ));
    }
    points.push(points[0].clone());
    return new CatmullRomCurve3(points, true);
  }, [currentShip]);
  const droneProgressRef = reactExports.useRef(0);
  const craneShakeRef = reactExports.useRef({ x: 0, y: 0, intensity: 0 });
  const hookShakeRef = reactExports.useRef({ x: 0, y: 0, intensity: 0 });
  const updateCameras = reactExports.useCallback((time, beatPhase) => {
    if (!currentShip) return;
    const shipPos = new Vector3(...currentShip.position);
    const craneBaseX = Math.sin(craneState.rotation) * 18;
    const craneBaseZ = Math.cos(craneState.rotation) * 8;
    if (beatPhase < 0.15) {
      craneShakeRef.current.intensity = 0.2;
    } else {
      craneShakeRef.current.intensity *= 0.9;
    }
    craneShakeRef.current.x = (Math.random() - 0.5) * craneShakeRef.current.intensity;
    craneShakeRef.current.y = (Math.random() - 0.5) * craneShakeRef.current.intensity;
    virtualCameras.crane.position.set(
      craneBaseX + craneShakeRef.current.x,
      24 + craneShakeRef.current.y,
      craneBaseZ
    );
    virtualCameras.crane.lookAt(shipPos.x, shipPos.y + 5, shipPos.z);
    virtualCameras.crane.fov = 60 + audioData.bass * 3;
    virtualCameras.crane.updateProjectionMatrix();
    const hookPos = new Vector3(
      craneState.spreaderPos.x,
      craneState.spreaderPos.y - 5,
      craneState.spreaderPos.z
    );
    if (beatPhase < 0.15) {
      hookShakeRef.current.intensity = 0.15;
    } else {
      hookShakeRef.current.intensity *= 0.9;
    }
    hookShakeRef.current.x = (Math.random() - 0.5) * hookShakeRef.current.intensity;
    hookShakeRef.current.y = (Math.random() - 0.5) * hookShakeRef.current.intensity;
    virtualCameras.hook.position.set(
      hookPos.x + hookShakeRef.current.x,
      hookPos.y + hookShakeRef.current.y,
      hookPos.z
    );
    virtualCameras.hook.lookAt(hookPos.x, hookPos.y - 10, hookPos.z);
    virtualCameras.hook.fov = 75 + audioData.bass * 5;
    virtualCameras.hook.updateProjectionMatrix();
    if (dronePath) {
      droneProgressRef.current += 1e-3 + audioData.treble * 5e-3;
      if (droneProgressRef.current > 1) droneProgressRef.current = 0;
      const dronePos = dronePath.getPoint(droneProgressRef.current);
      const droneTarget = dronePath.getPoint((droneProgressRef.current + 0.1) % 1);
      virtualCameras.drone.position.copy(dronePos);
      virtualCameras.drone.lookAt(droneTarget);
      virtualCameras.drone.updateProjectionMatrix();
    }
    virtualCameras.underwater.position.set(
      shipPos.x + Math.sin(time * 0.1) * 10,
      -8,
      shipPos.z + 20 + Math.cos(time * 0.08) * 5
    );
    virtualCameras.underwater.lookAt(shipPos.x, -2, shipPos.z);
    virtualCameras.underwater.updateProjectionMatrix();
  }, [currentShip, craneState, dronePath, virtualCameras, audioData]);
  useFrame((state) => {
    if (!enabled || spectatorState.isActive) return;
    const time = state.clock.elapsedTime;
    const beatDuration = 60 / bpm;
    const beatPhase = time % beatDuration / beatDuration;
    updateCameras(time, beatPhase);
  });
  if (!enabled || spectatorState.isActive) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    MultiviewUI,
    {
      enabled,
      currentShip
    }
  );
}
function MultiviewUI({ enabled, currentShip }) {
  if (!enabled) return null;
  const shipColors = {
    cruise: "#ff6b9d",
    container: "#00d4aa",
    tanker: "#ff9500",
    bulk: "#8b4513",
    lng: "#00bfff",
    roro: "#9b59b6",
    research: "#2ecc71",
    droneship: "#34495e"
  };
  const accentColor = currentShip ? shipColors[currentShip.type] || "#00d4aa" : "#00d4aa";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "12px",
            width: "min(90vw, 1200px)",
            height: "min(80vh, 700px)",
            aspectRatio: "16/9"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ViewPanel,
              {
                title: "CRANE CAB",
                subtitle: "POV",
                accentColor,
                style: { gridRow: "span 2" },
                icon: "🎮"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ViewPanel,
              {
                title: "HOOK",
                subtitle: "CAM",
                accentColor,
                icon: "🏗️"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ViewPanel,
              {
                title: "DRONE",
                subtitle: "OVERVIEW",
                accentColor,
                icon: "🚁"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ViewPanel,
              {
                title: "UNDERWATER",
                subtitle: "DEEP",
                accentColor: "#00aaff",
                icon: "🌊"
              }
            )
          ]
        }
      )
    }
  );
}
function ViewPanel({ title, subtitle, accentColor, style, icon }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${accentColor}40`,
        boxShadow: `inset 0 0 20px ${accentColor}20, 0 4px 20px rgba(0,0,0,0.5)`,
        display: "flex",
        flexDirection: "column",
        ...style
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              background: `linear-gradient(90deg, ${accentColor}30, transparent)`,
              borderBottom: `1px solid ${accentColor}30`
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "14px" }, children: icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { flex: 1 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "11px", fontWeight: 700, color: "#fff", letterSpacing: "1px" }, children: title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "9px", color: accentColor, letterSpacing: "0.5px" }, children: subtitle })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#ff4444",
                    boxShadow: "0 0 4px #ff4444",
                    animation: "pulse 1s ease-in-out infinite"
                  }
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${accentColor}10, transparent)`,
              color: accentColor,
              fontSize: "48px",
              opacity: 0.3
            },
            children: icon
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "20px",
              height: "2px",
              background: accentColor
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "2px",
              height: "20px",
              background: accentColor
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "20px",
              height: "2px",
              background: accentColor
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "2px",
              height: "20px",
              background: accentColor
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      ` })
      ]
    }
  );
}
function HumpbackWhale({ entity }) {
  const groupRef = reactExports.useRef(null);
  const bodyMaterial = reactExports.useMemo(() => new MeshStandardMaterial({
    color: "#2c3e50",
    roughness: 0.7,
    metalness: 0.1
  }), []);
  const bellyMaterial = reactExports.useMemo(() => new MeshStandardMaterial({
    color: "#95a5a6",
    roughness: 0.8
  }), []);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...entity.position);
    if (entity.velocity[0] !== 0 || entity.velocity[2] !== 0) {
      const angle = Math.atan2(entity.velocity[2], entity.velocity[0]);
      groupRef.current.rotation.y = -angle + Math.PI / 2;
    }
    if (entity.behaviorState === "breaching") {
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.x = -Math.PI / 4 * Math.sin(time * 2);
    } else {
      groupRef.current.rotation.x = 0;
    }
    const undulation = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    groupRef.current.rotation.z = undulation;
  });
  const scale = 0.1;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, scale: [scale, scale, scale], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("capsuleGeometry", { args: [3.5, 10, 8, 16] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, -1, 0], material: bellyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("capsuleGeometry", { args: [3.3, 9.5, 8, 16] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, 0.5, 7], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [3.2, 16, 16] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, 0, 9], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [2, 3, 16] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [-4, -1, 2], rotation: [0, 0, 0.5], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [5, 0.5, 2] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [4, -1, 2], rotation: [0, 0, -0.5], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [5, 0.5, 2] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, 4, -2], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [1, 2, 4] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [0, 0, -6], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [-2, 0, 0], rotation: [0, 0, 0.3], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [4, 0.3, 3] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [2, 0, 0], rotation: [0, 0, -0.3], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [4, 0.3, 3] }) })
    ] }),
    entity.position[1] > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 5, 6], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.5, 8, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "white", transparent: true, opacity: 0.6 })
    ] })
  ] });
}
function GreatWhiteShark({ entity }) {
  const groupRef = reactExports.useRef(null);
  const bodyMaterial = reactExports.useMemo(() => new MeshStandardMaterial({
    color: "#5d6d7e",
    // Gray dorsal
    roughness: 0.6,
    metalness: 0.2
  }), []);
  const bellyMaterial = reactExports.useMemo(() => new MeshStandardMaterial({
    color: "#ecf0f1",
    // White ventral (countershading)
    roughness: 0.7
  }), []);
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...entity.position);
    if (entity.velocity[0] !== 0 || entity.velocity[2] !== 0) {
      const angle = Math.atan2(entity.velocity[2], entity.velocity[0]);
      groupRef.current.rotation.y = -angle + Math.PI / 2;
    }
  });
  const scale = 0.08;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, scale: [scale, scale, scale], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("capsuleGeometry", { args: [1.2, 4, 8, 12] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, -0.5, 0], material: bellyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("capsuleGeometry", { args: [1, 3.5, 8, 12] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, 0, 2.5], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [1, 2, 12] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, 2, -0.5], rotation: [0, 0, 0], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [1.2, 2.5, 3] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [-1.5, -0.5, 0.5], rotation: [0, 0, 0.8], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2, 0.2, 1] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [1.5, -0.5, 0.5], rotation: [0, 0, -0.8], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2, 0.2, 1] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [0, 0, -2.5], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, 0.8, -1], rotation: [0.5, 0, 0], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.3, 2.5, 1.5] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, -0.5, -0.5], rotation: [-0.3, 0, 0], material: bellyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.3, 1.5, 1] }) })
    ] }),
    [-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-1.22, 0, x], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.05, 0.8, 0.1] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#2c3e50" })
    ] }, i))
  ] });
}
function BottlenoseDolphin({ entity }) {
  const groupRef = reactExports.useRef(null);
  const bodyMaterial = reactExports.useMemo(() => new MeshStandardMaterial({
    color: "#3498db",
    // Blue-gray
    roughness: 0.4,
    metalness: 0.3
  }), []);
  const bellyMaterial = reactExports.useMemo(() => new MeshStandardMaterial({
    color: "#ecf0f1",
    roughness: 0.5
  }), []);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...entity.position);
    if (entity.velocity[0] !== 0 || entity.velocity[2] !== 0) {
      const angle = Math.atan2(entity.velocity[2], entity.velocity[0]);
      groupRef.current.rotation.y = -angle + Math.PI / 2;
    }
    if (entity.position[1] > 0) {
      groupRef.current.rotation.x = -0.3;
    } else {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 8) * 0.1;
    }
  });
  const scale = 0.06;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, scale: [scale, scale, scale], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("capsuleGeometry", { args: [0.9, 3, 8, 12] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, -0.4, 0], material: bellyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("capsuleGeometry", { args: [0.8, 2.8, 8, 12] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, 0.1, 2], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [0.6, 1.5, 12] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, 0.5, 1.2], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.7, 12, 12] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [0, 1.5, -0.3], rotation: [0, 0, 0], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [0.6, 1.5, 8] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [-1.2, -0.3, 0.3], rotation: [0.3, 0, 0.6], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.2, 0.15, 0.7] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [1.2, -0.3, 0.3], rotation: [0.3, 0, -0.6], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.2, 0.15, 0.7] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [0, 0, -2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [-1, 0, -0.3], rotation: [0, 0.2, 0], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.5, 0.1, 0.8] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { position: [1, 0, -0.3], rotation: [0, -0.2, 0], material: bodyMaterial, children: /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.5, 0.1, 0.8] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.95, 0.5], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.1, 0.1, 0.05] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#2c3e50" })
    ] })
  ] });
}
function BioluminescentPlankton({ entity }) {
  const groupRef = reactExports.useRef(null);
  const flashIntensity = entity.velocity[0] || 0;
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(...entity.position);
    const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.3 + 0.7;
    const intensity = flashIntensity > 0 ? flashIntensity : pulse * 0.3;
    const material = groupRef.current.children[0];
    if (material && material.material) {
      const mat = material.material;
      mat.opacity = intensity;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [8, 16, 16] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshBasicMaterial",
        {
          color: "#00ffff",
          transparent: true,
          opacity: 0.3,
          blending: AdditiveBlending
        }
      )
    ] }),
    Array.from({ length: 20 }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 10
        ],
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.1 + Math.random() * 0.2, 4, 4] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshBasicMaterial",
            {
              color: "#88ffff",
              transparent: true,
              opacity: 0.5,
              blending: AdditiveBlending
            }
          )
        ]
      },
      i
    ))
  ] });
}
function WildlifeRenderer() {
  const wildlife = useGameStore((state) => state.wildlife);
  const renderWildlife = (entity) => {
    switch (entity.type) {
      case "humpback_whale":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(HumpbackWhale, { entity }, entity.id);
      case "great_white_shark":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(GreatWhiteShark, { entity }, entity.id);
      case "bottlenose_dolphin":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(BottlenoseDolphin, { entity }, entity.id);
      case "bioluminescent_plankton":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(BioluminescentPlankton, { entity }, entity.id);
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: wildlife.map(renderWildlife) });
}
const WILDLIFE_SPECS = {
  humpback_whale: {
    // Megaptera novaeangliae
    // Length: 12-16m, Weight: 25-30 tonnes
    // Migration: up to 25,000 km annually
    // Breaching: spectacular aerial behavior
    length: 14,
    maxSpeed: 7.5,
    // 27 km/h burst speed
    diveDepth: 200,
    // Typical feeding dives
    socialBehavior: "solitary",
    typicalGroupSize: 1,
    activityPattern: "diurnal",
    surfaceTime: 4,
    // 3-5 minutes
    breathHold: 45
    // Up to 45 minutes possible
  },
  great_white_shark: {
    // Carcharodon carcharias
    // Length: 4.5-6m (females larger)
    // Depth range: surface to 1,200m
    length: 5,
    maxSpeed: 11,
    // 40 km/h burst
    diveDepth: 300,
    // Regular dives
    socialBehavior: "solitary",
    typicalGroupSize: 1,
    activityPattern: "crepuscular",
    surfaceTime: 30,
    // Must keep moving
    breathHold: 60
    // Ram ventilation
  },
  bottlenose_dolphin: {
    // Tursiops truncatus
    // Length: 2.5-4m
    // Pod sizes: 2-30 individuals
    // Bow-riding: energy-efficient travel
    length: 3,
    maxSpeed: 11,
    // 40 km/h sustained
    diveDepth: 300,
    // Can dive deeper
    socialBehavior: "pod",
    typicalGroupSize: 12,
    activityPattern: "diurnal",
    surfaceTime: 10,
    breathHold: 7
    // Typically surface every 1-2 min
  },
  bioluminescent_plankton: {
    // Dinoflagellates (Lingulodinium polyedrum)
    // Individual: 0.02-0.5mm
    // Bloom densities: millions per liter
    // Flash response to mechanical disturbance
    length: 1e-3,
    maxSpeed: 0.01,
    // Passive drift
    diveDepth: 10,
    // Surface waters
    socialBehavior: "school",
    typicalGroupSize: 1e6,
    activityPattern: "nocturnal",
    surfaceTime: 3600,
    // Continuous
    breathHold: Infinity
  }
};
class WildlifeSystem {
  constructor() {
    __publicField(this, "spawnTimer", 0);
    __publicField(this, "SPAWN_INTERVAL", 30);
    // seconds
    __publicField(this, "behaviors", {});
    this.initializeBehaviors();
  }
  initializeBehaviors() {
    this.behaviors.humpback_whale = {
      update: (entity) => {
        const time = Date.now() / 1e3;
        const specs = WILDLIFE_SPECS.humpback_whale;
        if (entity.behaviorState === "breaching") {
          const breachProgress = (time - entity.createdAt) % 8;
          if (breachProgress < 2) {
            return {
              position: [
                entity.position[0],
                Math.sin(breachProgress * Math.PI / 2) * specs.length * 0.6,
                entity.position[2]
              ]
            };
          } else if (breachProgress < 4) {
            return {
              position: [
                entity.position[0],
                Math.max(-2, specs.length * 0.6 - (breachProgress - 2) * 3),
                entity.position[2]
              ],
              behaviorState: breachProgress > 3.5 ? "idle" : "breaching"
            };
          }
        }
        if (Math.random() < 1e-3 && entity.position[1] <= 0) {
          return { behaviorState: "breaching" };
        }
        const swimRadius = 100;
        const swimSpeed = 0.02;
        const angle = time * swimSpeed + entity.createdAt;
        return {
          position: [
            Math.cos(angle) * swimRadius,
            -1,
            // Just below surface
            Math.sin(angle) * swimRadius
          ]
        };
      }
    };
    this.behaviors.great_white_shark = {
      update: (entity) => {
        const time = Date.now() / 1e3;
        const specs = WILDLIFE_SPECS.great_white_shark;
        const patrolSpeed = 0.03;
        const x = Math.sin(time * patrolSpeed) * 80;
        const z = Math.cos(time * patrolSpeed * 0.7) * 60;
        const depth = entity.behaviorState === "hunting" ? -specs.diveDepth * 0.3 : -2 - Math.sin(time * 0.5) * 3;
        return {
          position: [x, depth, z],
          velocity: [
            Math.cos(time * patrolSpeed) * specs.maxSpeed * 0.1,
            0,
            -Math.sin(time * patrolSpeed * 0.7) * specs.maxSpeed * 0.1
          ]
        };
      }
    };
    this.behaviors.bottlenose_dolphin = {
      update: (entity, _delta, ships2) => {
        const time = Date.now() / 1e3;
        const specs = WILDLIFE_SPECS.bottlenose_dolphin;
        let targetShip = ships2.find((s) => s.id === entity.targetShipId);
        if (!targetShip && ships2.length > 0) {
          let minDist = Infinity;
          for (const ship of ships2) {
            const dist = Math.sqrt(
              Math.pow(ship.position[0] - entity.position[0], 2) + Math.pow(ship.position[2] - entity.position[2], 2)
            );
            if (dist < minDist && dist < 50) {
              minDist = dist;
              targetShip = ship;
            }
          }
          if (targetShip) {
            return { targetShipId: targetShip.id, behaviorState: "playing" };
          }
        }
        if (targetShip) {
          const bowOffset = 15;
          const lateralOffset = 5 + Math.sin(time * 2) * 3;
          return {
            position: [
              targetShip.position[0] + bowOffset,
              0.5,
              // Riding the pressure wave
              targetShip.position[2] + lateralOffset
            ],
            velocity: [specs.maxSpeed * 0.3, 0, 0]
          };
        }
        const podAngle = time * 0.05 + entity.createdAt;
        return {
          position: [
            Math.cos(podAngle) * 60 + Math.sin(time * 3) * 5,
            -0.5 + Math.sin(time * 4) * 0.3,
            // Porpoising
            Math.sin(podAngle) * 60 + Math.cos(time * 2.5) * 5
          ],
          behaviorState: "migrating"
        };
      }
    };
    this.behaviors.bioluminescent_plankton = {
      update: (entity, delta, ships2) => {
        const time = Date.now() / 1e3;
        let flashIntensity = 0;
        for (const ship of ships2) {
          const dist = Math.sqrt(
            Math.pow(ship.position[0] - entity.position[0], 2) + Math.pow(ship.position[2] - entity.position[2], 2)
          );
          if (dist < 20) {
            flashIntensity = Math.max(flashIntensity, 1 - dist / 20);
          }
        }
        const driftSpeed = 0.5;
        return {
          position: [
            entity.position[0] + Math.sin(time * 0.1) * driftSpeed * delta,
            -1 + Math.sin(time * 0.3) * 0.5,
            // Gentle vertical movement
            entity.position[2] + Math.cos(time * 0.08) * driftSpeed * delta
          ],
          // Intensity stored in velocity magnitude for rendering
          velocity: [flashIntensity, 0, 0]
        };
      }
    };
  }
  // Spawn new wildlife entity
  spawnWildlife(type) {
    const id = `wildlife-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    const entity = {
      id,
      type,
      position: [
        Math.cos(angle) * distance,
        type === "humpback_whale" ? -2 : type === "bioluminescent_plankton" ? -1 : -3,
        Math.sin(angle) * distance
      ],
      velocity: [0, 0, 0],
      behaviorState: type === "bottlenose_dolphin" ? "migrating" : "idle",
      createdAt: Date.now()
    };
    if (type === "bottlenose_dolphin" && Math.random() < 0.7) {
      useGameStore.getState().addWildlife(entity);
      const podSize = Math.floor(Math.random() * 8) + 3;
      for (let i = 0; i < podSize; i++) {
        const podMember = {
          ...entity,
          id: `wildlife-${type}-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
          position: [
            entity.position[0] + (Math.random() - 0.5) * 20,
            entity.position[1] + (Math.random() - 0.5) * 2,
            entity.position[2] + (Math.random() - 0.5) * 20
          ]
        };
        useGameStore.getState().addWildlife(podMember);
      }
    } else {
      useGameStore.getState().addWildlife(entity);
    }
    console.log(`🐋 Wildlife spawned: ${type} (${entity.id})`);
    return entity;
  }
  // Main update loop - called every frame
  update(delta) {
    const state = useGameStore.getState();
    const { wildlife, ships: ships2 } = state;
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.attemptSpawn();
    }
    wildlife.forEach((entity) => {
      const behavior = this.behaviors[entity.type];
      if (behavior) {
        const updates = behavior.update(entity, delta, ships2);
        if (updates) {
          useGameStore.getState().updateWildlife(entity.id, updates);
        }
      }
    });
  }
  attemptSpawn() {
    const state = useGameStore.getState();
    const { wildlife, timeOfDay } = state;
    if (wildlife.length >= 20) return;
    const isNight = timeOfDay < 6 || timeOfDay > 18;
    const spawnChances = [
      { type: "bottlenose_dolphin", chance: 0.4 },
      { type: "humpback_whale", chance: 0.2 },
      { type: "great_white_shark", chance: 0.2 },
      { type: "bioluminescent_plankton", chance: isNight ? 0.6 : 0.1 }
    ];
    for (const { type, chance } of spawnChances) {
      if (Math.random() < chance) {
        this.spawnWildlife(type);
        break;
      }
    }
  }
  // Get wildlife specifications for rendering
  getSpecs(type) {
    return WILDLIFE_SPECS[type];
  }
  // Clean up old wildlife
  cleanup(maxAge = 300) {
    const state = useGameStore.getState();
    const now = Date.now();
    state.wildlife.forEach((entity) => {
      if ((now - entity.createdAt) / 1e3 > maxAge) {
        state.removeWildlife(entity.id);
      }
    });
  }
}
const wildlifeSystem = new WildlifeSystem();
const EVENT_SPECS = {
  none: {
    name: "None",
    description: "No special event",
    minDuration: 0,
    maxDuration: 0,
    minIntensity: 0,
    maxIntensity: 0,
    affectedRadius: 0,
    scientificCause: "N/A"
  },
  milky_seas: {
    name: "Milky Seas",
    description: "Massive bioluminescent glow from bacterial quorum sensing",
    minDuration: 600,
    // 10 minutes minimum
    maxDuration: 3600,
    // Up to 1 hour
    minIntensity: 0.3,
    maxIntensity: 1,
    seasonality: [6, 7, 8, 9, 10, 11],
    // Summer/fall peak
    timeOfDay: "night",
    affectedRadius: 500,
    scientificCause: "Vibrio harveyi bacteria reaching quorum sensing threshold (10^8 cells/ml)"
  },
  whale_migration: {
    name: "Humpback Whale Migration",
    description: "Seasonal north-south migration of Megaptera novaeangliae",
    minDuration: 900,
    // 15 minutes
    maxDuration: 1800,
    // 30 minutes
    minIntensity: 0.5,
    maxIntensity: 1,
    seasonality: [1, 2, 3, 10, 11, 12],
    // Winter months
    timeOfDay: "any",
    affectedRadius: 300,
    scientificCause: "Megaptera novaeangliae traveling between feeding (polar) and breeding (tropical) grounds"
  },
  shark_patrol: {
    name: "Great White Shark Patrol",
    description: "Coastal hunting patterns of Carcharodon carcharias",
    minDuration: 300,
    // 5 minutes
    maxDuration: 900,
    // 15 minutes
    minIntensity: 0.4,
    maxIntensity: 0.9,
    seasonality: [5, 6, 7, 8, 9],
    // Summer months
    timeOfDay: "any",
    affectedRadius: 200,
    scientificCause: "Carcharodon carcharias utilizing coastal upwelling zones for hunting pinnipeds"
  },
  meteor_shower: {
    name: "Meteor Shower",
    description: "Celestial debris entering atmosphere",
    minDuration: 600,
    // 10 minutes
    maxDuration: 1200,
    // 20 minutes
    minIntensity: 0.3,
    maxIntensity: 1,
    timeOfDay: "night",
    affectedRadius: 1e3,
    // Visible across entire scene
    scientificCause: "Earth passing through comet debris trail"
  },
  bioluminescent_bloom: {
    name: "Bioluminescent Plankton Bloom",
    description: "Dinoflagellate flashing display when disturbed",
    minDuration: 300,
    // 5 minutes
    maxDuration: 600,
    // 10 minutes
    minIntensity: 0.4,
    maxIntensity: 1,
    seasonality: [5, 6, 7, 8],
    // Summer
    timeOfDay: "night",
    affectedRadius: 150,
    scientificCause: "Lingulodinium polyedrum mechanical stimulation causing scintillon-mediated flash"
  }
};
class SeaEventsSystem {
  constructor() {
    __publicField(this, "eventTimer", 0);
    __publicField(this, "CHECK_INTERVAL", 60);
    // Check for new events every minute
    __publicField(this, "states", {});
    __publicField(this, "currentEvent", null);
    this.initializeStates();
  }
  initializeStates() {
    this.states.milky_seas = {
      update: (event, delta, ships2) => {
        const variation = Math.sin(Date.now() / 1e4) * 0.1;
        return { intensity: Math.max(0, Math.min(1, event.intensity + variation)) };
      },
      onStart: (event) => {
        console.log(`🌊 MILKY SEAS EVENT STARTED`);
        console.log(`   Cause: ${EVENT_SPECS.milky_seas.scientificCause}`);
        console.log(`   Area: ${event.affectedArea.radius}m radius`);
      },
      onEnd: (event) => {
        console.log(`🌊 Milky seas dissipated (bacterial population below quorum threshold)`);
      }
    };
    this.states.whale_migration = {
      update: (event, delta, ships2) => {
        const progress = (Date.now() - event.startTime) / 1e3 / event.duration;
        if (Math.random() < 0.01) {
          wildlifeSystem.spawnWildlife("humpback_whale");
        }
        return { intensity: Math.sin(progress * Math.PI) };
      },
      onStart: (event) => {
        console.log(`🐋 WHALE MIGRATION EVENT STARTED`);
        console.log(`   Species: Megaptera novaeangliae`);
        console.log(`   Distance: Up to 25,000 km annually`);
      }
    };
    this.states.shark_patrol = {
      update: (event, delta, ships2) => {
        if (Math.random() < 0.02) {
          wildlifeSystem.spawnWildlife("great_white_shark");
        }
        return null;
      },
      onStart: (event) => {
        console.log(`🦈 SHARK PATROL EVENT STARTED`);
        console.log(`   Species: Carcharodon carcharias`);
        console.log(`   Behavior: Coastal hunting pattern`);
      }
    };
    this.states.meteor_shower = {
      update: (event, delta, ships2) => {
        return null;
      },
      onStart: (event) => {
        console.log(`☄️ METEOR SHOWER EVENT STARTED`);
        console.log(`   Cause: Earth passing through comet debris`);
        console.log(`   Best viewing: Away from harbor lights`);
      }
    };
    this.states.bioluminescent_bloom = {
      update: (event, delta, ships2) => {
        if (Math.random() < 0.05) {
          wildlifeSystem.spawnWildlife("bioluminescent_plankton");
        }
        return null;
      },
      onStart: (event) => {
        console.log(`✨ BIOLUMINESCENT BLOOM STARTED`);
        console.log(`   Species: Lingulodinium polyedrum (dinoflagellates)`);
        console.log(`   Mechanism: Scintillon-mediated flash response`);
      }
    };
  }
  // Start a new event
  startEvent(type) {
    if (type === "none") return null;
    const spec = EVENT_SPECS[type];
    const duration = spec.minDuration + Math.random() * (spec.maxDuration - spec.minDuration);
    const intensity = spec.minIntensity + Math.random() * (spec.maxIntensity - spec.minIntensity);
    const event = {
      id: `event-${type}-${Date.now()}`,
      type,
      startTime: Date.now(),
      duration,
      intensity,
      affectedArea: {
        center: [0, 0, 0],
        radius: spec.affectedRadius
      }
    };
    this.currentEvent = event;
    useGameStore.getState().setActiveSeaEvent(event);
    const state = this.states[type];
    if (state == null ? void 0 : state.onStart) {
      state.onStart(event);
    }
    return event;
  }
  // End current event
  endEvent() {
    if (!this.currentEvent) return;
    const state = this.states[this.currentEvent.type];
    if (state == null ? void 0 : state.onEnd) {
      state.onEnd(this.currentEvent);
    }
    this.currentEvent = null;
    useGameStore.getState().setActiveSeaEvent(null);
  }
  // Main update loop
  update(delta) {
    const state = useGameStore.getState();
    const { timeOfDay, ships: ships2 } = state;
    const currentEvent = state.activeSeaEvent;
    if (currentEvent) {
      const elapsed = (Date.now() - currentEvent.startTime) / 1e3;
      if (elapsed >= currentEvent.duration) {
        this.endEvent();
      } else {
        const eventState = this.states[currentEvent.type];
        if (eventState) {
          const updates = eventState.update(currentEvent, delta, ships2);
          if (updates) {
            useGameStore.getState().setActiveSeaEvent({
              ...currentEvent,
              ...updates
            });
          }
        }
      }
    }
    this.eventTimer += delta;
    if (this.eventTimer >= this.CHECK_INTERVAL) {
      this.eventTimer = 0;
      this.attemptStartEvent(timeOfDay);
    }
  }
  attemptStartEvent(timeOfDay) {
    var _a2;
    if (this.currentEvent) return;
    const isNight = timeOfDay < 6 || timeOfDay > 18;
    const month = (/* @__PURE__ */ new Date()).getMonth() + 1;
    const candidates = [];
    for (const [type, spec] of Object.entries(EVENT_SPECS)) {
      if (type === "none") continue;
      if (spec.timeOfDay === "night" && !isNight) continue;
      if (spec.timeOfDay === "day" && isNight) continue;
      let weight = 0.1;
      if ((_a2 = spec.seasonality) == null ? void 0 : _a2.includes(month)) {
        weight = 0.3;
      }
      candidates.push({ type, weight });
    }
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    let random = Math.random() * totalWeight;
    for (const candidate of candidates) {
      random -= candidate.weight;
      if (random <= 0) {
        this.startEvent(candidate.type);
        break;
      }
    }
  }
  // Force start an event (for debugging/manual control)
  forceEvent(type) {
    this.endEvent();
    return this.startEvent(type);
  }
  // Get current event info
  getCurrentEvent() {
    return this.currentEvent;
  }
  // Get event specifications
  getSpec(type) {
    return EVENT_SPECS[type];
  }
  // Get event progress (0-1)
  getEventProgress() {
    if (!this.currentEvent) return 0;
    const elapsed = (Date.now() - this.currentEvent.startTime) / 1e3;
    return Math.min(1, elapsed / this.currentEvent.duration);
  }
  // Get remaining time
  getRemainingTime() {
    if (!this.currentEvent) return 0;
    const elapsed = (Date.now() - this.currentEvent.startTime) / 1e3;
    return Math.max(0, this.currentEvent.duration - elapsed);
  }
}
const seaEventsSystem = new SeaEventsSystem();
function MilkySeasEffect() {
  const meshRef = reactExports.useRef(null);
  const event = useGameStore((state) => state.activeSeaEvent);
  const material = reactExports.useMemo(() => {
    return new MeshBasicMaterial({
      color: "#aaffcc",
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
      side: DoubleSide
    });
  }, []);
  useFrame((state) => {
    if (!meshRef.current || !event) return;
    const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 0.9;
    const opacity = event.intensity * 0.4 * pulse;
    material.opacity = opacity;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.02;
  });
  if (!event || event.type !== "milky_seas") return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, position: [0, -2, 0], rotation: [-Math.PI / 2, 0, 0], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [800, 800, 32, 32] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: material, attach: "material" })
  ] });
}
function MeteorShowerEffect() {
  const groupRef = reactExports.useRef(null);
  const event = useGameStore((state) => state.activeSeaEvent);
  const meteors = reactExports.useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * 400,
      startY: 100 + Math.random() * 50,
      startZ: -200 - Math.random() * 200,
      speed: 50 + Math.random() * 100,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      delay: Math.random() * 5,
      duration: 0.5 + Math.random() * 0.5
    }));
  }, []);
  useFrame((state) => {
    if (!groupRef.current || !event) return;
    const time = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const meteor = meteors[i];
      const localTime = (time + meteor.delay) % 6;
      if (localTime < meteor.duration) {
        const progress = localTime / meteor.duration;
        child.position.x = meteor.startX - Math.cos(meteor.angle) * progress * meteor.speed;
        child.position.y = meteor.startY - Math.sin(meteor.angle) * progress * meteor.speed;
        child.position.z = meteor.startZ;
        child.visible = true;
        const material = child.material;
        material.opacity = (1 - progress) * event.intensity;
      } else {
        child.visible = false;
      }
    });
  });
  if (!event || event.type !== "meteor_shower") return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("group", { ref: groupRef, children: meteors.map((meteor) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { visible: false, rotation: [0, 0, meteor.angle], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.5, 0.1, 20, 8] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshBasicMaterial",
      {
        color: "#ffffff",
        transparent: true,
        opacity: 1,
        blending: AdditiveBlending
      }
    )
  ] }, meteor.id)) });
}
function BioluminescentBloomEffect() {
  const groupRef = reactExports.useRef(null);
  const event = useGameStore((state) => state.activeSeaEvent);
  const ships2 = useGameStore((state) => state.ships);
  const sparkles = reactExports.useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      baseX: (Math.random() - 0.5) * 200,
      baseZ: (Math.random() - 0.5) * 200,
      phase: Math.random() * Math.PI * 2,
      flashDuration: 0.1 + Math.random() * 0.2
    }));
  }, []);
  useFrame((state) => {
    if (!groupRef.current || !event) return;
    const time = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const sparkle = sparkles[i];
      const mesh = child;
      let triggerFlash = false;
      for (const ship of ships2) {
        const dist = Math.sqrt(
          Math.pow(ship.position[0] - sparkle.baseX, 2) + Math.pow(ship.position[2] - sparkle.baseZ, 2)
        );
        if (dist < 30) {
          triggerFlash = true;
          break;
        }
      }
      const flashTrigger = triggerFlash || Math.sin(time * 3 + sparkle.phase) > 0.98;
      const material = mesh.material;
      if (flashTrigger) {
        material.opacity = event.intensity * (0.5 + Math.random() * 0.5);
        mesh.scale.setScalar(1.5);
      } else {
        material.opacity *= 0.95;
        mesh.scale.lerp(new Vector3(1, 1, 1), 0.1);
      }
      mesh.position.x = sparkle.baseX + Math.sin(time * 0.2 + sparkle.phase) * 5;
      mesh.position.z = sparkle.baseZ + Math.cos(time * 0.15 + sparkle.phase) * 5;
    });
  });
  if (!event || event.type !== "bioluminescent_bloom") return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("group", { ref: groupRef, children: sparkles.map((sparkle) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [sparkle.baseX, -1, sparkle.baseZ], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.3, 6, 6] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshBasicMaterial",
      {
        color: "#00ffff",
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending
      }
    )
  ] }, sparkle.id)) });
}
function EventNotification() {
  const event = useGameStore((state) => state.activeSeaEvent);
  if (!event || event.type === "none") return null;
  const spec = EVENT_SPECS[event.type];
  const progress = seaEventsSystem.getEventProgress();
  const remaining = seaEventsSystem.getRemainingTime();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    position: "absolute",
    top: "100px",
    right: "20px",
    background: "rgba(0,20,40,0.9)",
    padding: "16px 20px",
    borderRadius: "12px",
    border: "1px solid #00aaff",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    zIndex: 100,
    maxWidth: "280px",
    backdropFilter: "blur(10px)"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "2px",
      color: "#00aaff",
      marginBottom: "8px"
    }, children: "🌊 Sea Event Active" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }, children: spec.name }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "12px", color: "#aaa", marginBottom: "12px" }, children: spec.description }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      fontSize: "10px",
      color: "#888",
      fontStyle: "italic",
      marginBottom: "12px",
      padding: "8px",
      background: "rgba(0,0,0,0.3)",
      borderRadius: "4px"
    }, children: [
      "🔬 ",
      spec.scientificCause
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      height: "4px",
      background: "#333",
      borderRadius: "2px",
      overflow: "hidden"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      height: "100%",
      width: `${(1 - progress) * 100}%`,
      background: "linear-gradient(90deg, #00aaff, #00ffaa)",
      transition: "width 1s linear"
    } }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      fontSize: "11px",
      color: "#888",
      marginTop: "4px",
      textAlign: "right"
    }, children: [
      Math.floor(remaining / 60),
      "m ",
      Math.floor(remaining % 60),
      "s remaining"
    ] })
  ] });
}
function SeaEvents() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(MilkySeasEffect, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MeteorShowerEffect, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BioluminescentBloomEffect, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(EventNotification, {})
  ] });
}
const CRTShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: null,
    uFlickerIntensity: 0.02,
    uScanlineIntensity: 0.15,
    uVignetteIntensity: 0.3,
    uRgbShift: 2e-3
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform sampler2D uTexture;
    uniform float uFlickerIntensity;
    uniform float uScanlineIntensity;
    uniform float uVignetteIntensity;
    uniform float uRgbShift;
    
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      
      // Subtle screen flicker (power fluctuation)
      float flicker = 1.0 + sin(uTime * 10.0) * uFlickerIntensity * 0.5;
      flicker += sin(uTime * 23.7) * uFlickerIntensity * 0.3;
      
      // RGB Channel shift (chromatic aberration)
      float r = texture2D(uTexture, uv + vec2(uRgbShift, 0.0)).r;
      float g = texture2D(uTexture, uv).g;
      float b = texture2D(uTexture, uv - vec2(uRgbShift, 0.0)).b;
      
      vec3 color = vec3(r, g, b) * flicker;
      
      // Scanlines
      float scanline = sin(uv.y * 800.0) * 0.5 + 0.5;
      scanline = pow(scanline, 2.0) * uScanlineIntensity;
      color -= scanline;
      
      // Vignette (darker edges)
      float vignette = distance(uv, vec2(0.5));
      vignette = smoothstep(0.3, 0.9, vignette) * uVignetteIntensity;
      color *= (1.0 - vignette);
      
      // Slight color grading (warmer industrial monitors)
      color.r *= 1.05;
      color.b *= 0.95;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
);
extend({ CRTShaderMaterial });
const FoggedGlassMaterial = shaderMaterial(
  {
    uTime: 0,
    uFogDensity: 0.3,
    uOpacity: 0.15
  },
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uFogDensity;
    uniform float uOpacity;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      // Subtle fog pattern on glass
      float fog = sin(vUv.x * 20.0 + uTime * 0.1) * cos(vUv.y * 15.0 + uTime * 0.15);
      fog = fog * 0.5 + 0.5;
      fog = pow(fog, 3.0) * uFogDensity;
      
      // Industrial tint
      vec3 color = vec3(0.85, 0.9, 0.95) * (0.9 + fog * 0.2);
      
      gl_FragColor = vec4(color, uOpacity + fog * 0.1);
    }
  `
);
extend({ FoggedGlassMaterial });
function ControlBooth({
  children,
  harborTheme = "industrial",
  debug = false,
  quality = "high"
}) {
  const { camera, scene } = useThree();
  const boothRef = reactExports.useRef(null);
  const [isInitialized, setIsInitialized] = reactExports.useState(false);
  const craneState = useGameStore((state) => ({
    rotation: state.craneRotation ?? 0.2,
    height: state.craneHeight ?? 15.5,
    spreaderPos: state.spreaderPos ?? { x: 0, y: 10, z: 0 }
  }));
  const ships2 = useGameStore((state) => state.ships);
  const currentShipId = useGameStore((state) => state.currentShipId);
  const bpm = useGameStore((state) => state.bpm);
  const { audioData } = useAudioVisualSync();
  const currentShip = ships2.find((s) => s.id === currentShipId);
  reactExports.useEffect(() => {
    camera.position.set(0, 2.2, 3.2);
    camera.lookAt(0, 2.5, -20);
    camera.fov = 65;
    camera.updateProjectionMatrix();
    setIsInitialized(true);
    return () => {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      camera.fov = 50;
      camera.updateProjectionMatrix();
    };
  }, [camera]);
  const materials = reactExports.useMemo(() => {
    const theme = harborTheme === "arctic" ? { wall: 12965344, accent: 43775, metal: 4871528 } : harborTheme === "tropical" ? { wall: 13943976, accent: 16749824, metal: 5921370 } : { wall: 2763317, accent: 16737792, metal: 3816005 };
    return {
      wall: new MeshStandardMaterial({
        color: theme.wall,
        metalness: 0.7,
        roughness: 0.6,
        side: DoubleSide
      }),
      floor: new MeshStandardMaterial({
        color: 1710624,
        metalness: 0.5,
        roughness: 0.8,
        side: DoubleSide
      }),
      metalFrame: new MeshStandardMaterial({
        color: theme.metal,
        metalness: 0.9,
        roughness: 0.3
      }),
      darkMetal: new MeshStandardMaterial({
        color: 1710618,
        metalness: 0.8,
        roughness: 0.4
      }),
      glass: new MeshPhysicalMaterial({
        color: 16777215,
        metalness: 0,
        roughness: 0.05,
        transmission: 0.95,
        thickness: 0.1,
        transparent: true,
        opacity: 0.1,
        envMapIntensity: 1
      }),
      foggedGlass: new MeshPhysicalMaterial({
        color: 15267064,
        metalness: 0.1,
        roughness: 0.2,
        transmission: 0.7,
        thickness: 0.05,
        transparent: true,
        opacity: 0.3
      }),
      accent: new MeshStandardMaterial({
        color: theme.accent,
        emissive: theme.accent,
        emissiveIntensity: 0.2,
        metalness: 0.6,
        roughness: 0.4
      }),
      buttonActive: new MeshStandardMaterial({
        color: 65280,
        emissive: 65280,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.3
      }),
      buttonInactive: new MeshStandardMaterial({
        color: 3355443,
        metalness: 0.5,
        roughness: 0.5
      })
    };
  }, [harborTheme]);
  reactExports.useMemo(() => {
    const leftWallX = -3.8;
    const rearWallZ = 3.8;
    return [
      // Left Wall - Hook Cam (upper)
      {
        position: [leftWallX, 3, -0.5],
        rotation: [0, Math.PI / 2 + 0.15, 0],
        // Tilted toward player
        size: [2, 1.25],
        curveRadius: 5,
        label: "HOOK CAM",
        cameraPosition: [0, 10, 0],
        cameraTarget: [0, 0, 0],
        cameraFov: 75,
        type: "hook"
      },
      // Left Wall - Drone Cam (lower)
      {
        position: [leftWallX, 1.2, -0.5],
        rotation: [0, Math.PI / 2 + 0.15, 0],
        size: [2, 1.25],
        curveRadius: 5,
        label: "DRONE",
        cameraPosition: [30, 20, 30],
        cameraTarget: [0, 0, 0],
        cameraFov: 50,
        type: "drone"
      },
      // Rear Wall - Underwater Cam (large center)
      {
        position: [0, 2.5, rearWallZ],
        rotation: [0, Math.PI, 0],
        size: [2.8, 1.8],
        curveRadius: 8,
        label: "UNDERWATER",
        cameraPosition: [0, -8, 20],
        cameraTarget: [0, 0, 0],
        cameraFov: 70,
        type: "underwater"
      }
    ];
  }, []);
  const craneCamRef = reactExports.useRef(null);
  const hookCamRef = reactExports.useRef(null);
  const droneCamRef = reactExports.useRef(null);
  const underwaterCamRef = reactExports.useRef(null);
  const droneProgressRef = reactExports.useRef(0);
  const hookShakeRef = reactExports.useRef({ x: 0, y: 0, intensity: 0 });
  const craneShakeRef = reactExports.useRef({ x: 0, y: 0, intensity: 0 });
  const dronePath = reactExports.useMemo(() => {
    if (!currentShip) return null;
    const shipPos = new Vector3(...currentShip.position);
    const points = [];
    const segments = 12;
    const radius = currentShip.type === "tanker" ? 50 : currentShip.type === "container" ? 40 : 35;
    const height = 20;
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const variation = Math.sin(i * 0.5) * 5;
      points.push(new Vector3(
        shipPos.x + Math.cos(angle) * (radius + variation),
        shipPos.y + height + Math.cos(i * 0.3) * 8,
        shipPos.z + Math.sin(angle) * (radius + variation)
      ));
    }
    points.push(points[0].clone());
    return new CatmullRomCurve3(points, true);
  }, [currentShip]);
  useFrame((state) => {
    if (!currentShip) return;
    const time = state.clock.elapsedTime;
    const beatDuration = 60 / bpm;
    const beatPhase = time % beatDuration / beatDuration;
    const shipPos = new Vector3(...currentShip.position);
    if (craneCamRef.current) {
      const craneBaseX = Math.sin(craneState.rotation) * 18;
      const craneBaseZ = Math.cos(craneState.rotation) * 8;
      if (beatPhase < 0.15) craneShakeRef.current.intensity = 0.2;
      else craneShakeRef.current.intensity *= 0.9;
      craneShakeRef.current.x = (Math.random() - 0.5) * craneShakeRef.current.intensity;
      craneShakeRef.current.y = (Math.random() - 0.5) * craneShakeRef.current.intensity;
      craneCamRef.current.position.set(
        craneBaseX + craneShakeRef.current.x,
        24 + craneShakeRef.current.y,
        craneBaseZ
      );
      craneCamRef.current.lookAt(shipPos.x, shipPos.y + 5, shipPos.z);
      craneCamRef.current.fov = 60 + audioData.bass * 3;
      craneCamRef.current.updateProjectionMatrix();
    }
    if (hookCamRef.current) {
      const hookPos = new Vector3(
        craneState.spreaderPos.x,
        craneState.spreaderPos.y - 5,
        craneState.spreaderPos.z
      );
      if (beatPhase < 0.15) hookShakeRef.current.intensity = 0.15;
      else hookShakeRef.current.intensity *= 0.9;
      hookShakeRef.current.x = (Math.random() - 0.5) * hookShakeRef.current.intensity;
      hookShakeRef.current.y = (Math.random() - 0.5) * hookShakeRef.current.intensity;
      hookCamRef.current.position.set(
        hookPos.x + hookShakeRef.current.x,
        hookPos.y + hookShakeRef.current.y,
        hookPos.z
      );
      hookCamRef.current.lookAt(hookPos.x, hookPos.y - 10, hookPos.z);
      hookCamRef.current.fov = 75 + audioData.bass * 5;
      hookCamRef.current.updateProjectionMatrix();
    }
    if (droneCamRef.current && dronePath) {
      droneProgressRef.current += 1e-3 + audioData.treble * 5e-3;
      if (droneProgressRef.current > 1) droneProgressRef.current = 0;
      const dronePos = dronePath.getPoint(droneProgressRef.current);
      const droneTarget = dronePath.getPoint((droneProgressRef.current + 0.1) % 1);
      droneCamRef.current.position.copy(dronePos);
      droneCamRef.current.lookAt(droneTarget);
      droneCamRef.current.updateProjectionMatrix();
    }
    if (underwaterCamRef.current) {
      underwaterCamRef.current.position.set(
        shipPos.x + Math.sin(time * 0.1) * 10,
        -8,
        shipPos.z + 20 + Math.cos(time * 0.08) * 5
      );
      underwaterCamRef.current.lookAt(shipPos.x, -2, shipPos.z);
      underwaterCamRef.current.updateProjectionMatrix();
    }
  });
  const crtRef = reactExports.useRef(null);
  const glassRef = reactExports.useRef(null);
  useFrame((state) => {
    if (crtRef.current) {
      crtRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (glassRef.current) {
      glassRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: boothRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [8, 0.1, 8], position: [0, 0.05, 0], receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: 1710624,
        metalness: 0.6,
        roughness: 0.7
      }
    ) }),
    Array.from({ length: 7 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        args: [8, 0.02, 0.05],
        position: [0, 0.11, -3.5 + i],
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 3355443, metalness: 0.8, roughness: 0.4 })
      },
      `floor-strip-${i}`
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [8, 0.2, 8], position: [0, 4.1, 0], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: 2763317,
        metalness: 0.7,
        roughness: 0.6
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("group", { position: [0, 3.95, 0], children: [[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([x, z], i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [x, 0, z], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [0.8, 0.05, 0.8], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: 16777198,
          emissive: 16777198,
          emissiveIntensity: 0.3
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "pointLight",
        {
          position: [0, -0.5, 0],
          intensity: 0.8,
          color: "#ffffee",
          distance: 6,
          decay: 2
        }
      )
    ] }, `ceiling-light-${i}`)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [0.3, 4, 8], position: [-3.85, 2, 0], castShadow: true, receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: materials.wall, attach: "material" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [0.3, 4, 8], position: [3.85, 2, 0], castShadow: true, receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: materials.wall, attach: "material" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [8, 4, 0.3], position: [0, 2, 3.85], castShadow: true, receiveShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: materials.wall, attach: "material" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [1.5, 3.5, 0.2], position: [-3.25, 2.25, -3.9], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: materials.metalFrame, attach: "material" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [1.5, 3.5, 0.2], position: [3.25, 2.25, -3.9], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: materials.metalFrame, attach: "material" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [5, 0.75, 0.2], position: [0, 4.125, -3.9], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: materials.metalFrame, attach: "material" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [5, 0.25, 0.2], position: [0, 0.875, -3.9], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: materials.metalFrame, attach: "material" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Plane, { args: [5, 3.5], position: [0, 2.5, -3.85], children: /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: materials.foggedGlass, attach: "material" }) }),
    [[-2.9, 4], [2.9, 4], [-2.9, 1], [2.9, 1]].map(([x, y], i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Cylinder,
      {
        args: [0.04, 0.04, 0.1],
        position: [x, y, -3.8],
        rotation: [Math.PI / 2, 0, 0],
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 4473924, metalness: 0.9, roughness: 0.2 })
      },
      `bolt-${i}`
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [0, 0, 1.5], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [3.5, 0.08, 1.2], position: [0, 1.1, 0], castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 2763317, metalness: 0.7, roughness: 0.5 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [3.5, 0.02, 0.05], position: [0, 1.16, -0.58], children: /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: materials.accent, attach: "material" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [0.8, 0.05, 0.6], position: [-1.2, 1.18, -0.2], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 1710618, metalness: 0.5, roughness: 0.6 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [0.8, 0.05, 0.6], position: [1.2, 1.18, -0.2], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 1710618, metalness: 0.5, roughness: 0.6 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MusicReactiveButtons, { audioData }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Joystick, { position: [-0.8, 1.2, 0.1], audioData }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Joystick, { position: [0.8, 1.2, 0.1], audioData }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [1.2, 0.4, 0.05], position: [0, 1.4, -0.55], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: 657930,
          emissive: 54442,
          emissiveIntensity: 0.1 + audioData.bass * 0.3,
          metalness: 0.8,
          roughness: 0.2
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [0.15, 1.1, 1], position: [-1.5, 0.55, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 3355443, metalness: 0.7, roughness: 0.5 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [0.15, 1.1, 1], position: [1.5, 0.55, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 3355443, metalness: 0.7, roughness: 0.5 }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Monitor,
      {
        position: [-3.6, 3, -0.5],
        rotation: [0, Math.PI / 2 + 0.2, 0],
        size: [1.8, 1.1],
        curveRadius: 4,
        label: "HOOK CAM",
        materials,
        quality,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PerspectiveCamera,
            {
              ref: hookCamRef,
              makeDefault: false,
              position: [0, 10, 0],
              fov: 75,
              near: 0.1,
              far: 1e3
            }
          ),
          children,
          /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorHUD, { label: "HOOK CAM", type: "hook" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Monitor,
      {
        position: [-3.6, 1.3, -0.5],
        rotation: [0, Math.PI / 2 + 0.2, 0],
        size: [1.8, 1.1],
        curveRadius: 4,
        label: "DRONE",
        materials,
        quality,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PerspectiveCamera,
            {
              ref: droneCamRef,
              makeDefault: false,
              position: [30, 20, 30],
              fov: 50,
              near: 0.1,
              far: 1e3
            }
          ),
          children,
          /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorHUD, { label: "DRONE CAM", type: "drone" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Monitor,
      {
        position: [0, 2.5, 3.6],
        rotation: [0, Math.PI, 0],
        size: [2.4, 1.5],
        curveRadius: 6,
        label: "UNDERWATER",
        materials,
        quality,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PerspectiveCamera,
            {
              ref: underwaterCamRef,
              makeDefault: false,
              position: [0, -8, 20],
              fov: 70,
              near: 0.1,
              far: 500
            }
          ),
          children,
          /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorHUD, { label: "DEEP CAM", type: "underwater" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("group", { position: [0, 0, -15], children }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [0, 3.5, 1],
        intensity: 0.4,
        color: 8965375,
        distance: 8,
        decay: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [-3.3, 3, -0.5],
        intensity: 0.5,
        color: 54442,
        distance: 4,
        decay: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [-3.3, 1.3, -0.5],
        intensity: 0.5,
        color: 54442,
        distance: 4,
        decay: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [0, 2.5, 3.3],
        intensity: 0.4,
        color: 43775,
        distance: 5,
        decay: 2
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "rectAreaLight",
      {
        position: [0, 2.5, -3.5],
        width: 5,
        height: 3.5,
        intensity: 0.3,
        color: 16777215
      }
    ),
    debug && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("axesHelper", { args: [2], position: [0, 2, 0] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("gridHelper", { args: [10, 10], position: [0, 0.01, 0] })
    ] })
  ] });
}
function Monitor({
  position,
  rotation,
  size,
  curveRadius = 5,
  label,
  materials,
  quality,
  children
}) {
  const groupRef = reactExports.useRef(null);
  const [width, height] = size;
  const segments = quality === "high" ? 32 : quality === "medium" ? 16 : 8;
  const textureSize = quality === "high" ? 2048 : quality === "medium" ? 1024 : 512;
  const curvedGeometry = reactExports.useMemo(() => {
    const geometry = new PlaneGeometry(width, height, segments, 1);
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const angle = x / curveRadius;
      positions[i] = Math.sin(angle) * curveRadius;
      positions[i + 2] = Math.cos(angle) * curveRadius - curveRadius;
    }
    geometry.computeVertexNormals();
    return geometry;
  }, [width, height, curveRadius, segments]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, position, rotation, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { geometry: curvedGeometry, position: [0, 0, -0.05], children: /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [width + 0.15, height + 0.15, 0.1], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: 1710618,
        metalness: 0.8,
        roughness: 0.3
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { geometry: curvedGeometry, castShadow: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshPhysicalMaterial",
      {
        metalness: 0.2,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          RenderTexture,
          {
            attach: "map",
            width: textureSize,
            height: textureSize * (height / width),
            frames: 1,
            stencilBuffer: false,
            depthBuffer: true,
            children
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("mesh", { geometry: curvedGeometry, position: [0, 0, 5e-3], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshPhysicalMaterial",
      {
        color: 16777215,
        metalness: 0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.01,
        transparent: true,
        opacity: 0.05,
        envMapIntensity: 2
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [0, -height / 2 - 0.12, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { args: [width * 0.5, 0.08, 0.02], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 2763306, metalness: 0.6, roughness: 0.5 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plane, { args: [width * 0.4, 0.03], position: [0, 0, 0.015], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshBasicMaterial",
        {
          color: 54442,
          transparent: true,
          opacity: 0.8
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sphere, { args: [0.03], position: [width / 2 - 0.1, height / 2 - 0.1, 0.05], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: 65280,
        emissive: 65280,
        emissiveIntensity: 0.8
      }
    ) })
  ] });
}
function MonitorHUD({ label, type }) {
  const color = type === "underwater" ? "#00aaff" : type === "drone" ? "#ff9500" : "#00d4aa";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-3.5, 2.5, -10], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.3, 0.03] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.15, 0], rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.3, 0.03] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [3.5, 2.5, -10], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.3, 0.03] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.15, 0], rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.3, 0.03] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [-3.5, -2.5, -10], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.3, 0.03] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -0.15, 0], rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.3, 0.03] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [3.5, -2.5, -10], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.3, 0.03] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -0.15, 0], rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.3, 0.03] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [3.2, 2.8, -10], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circleGeometry", { args: [0.08] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color: "#ff0000" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [0, 0, -10], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.4, 0.02] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color, transparent: true, opacity: 0.5 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.4, 0.02] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color, transparent: true, opacity: 0.5 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("ringGeometry", { args: [0.15, 0.17, 32] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshBasicMaterial", { color, transparent: true, opacity: 0.3 })
      ] })
    ] })
  ] });
}
function MusicReactiveButtons({ audioData }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    Array.from({ length: 4 }, (_, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const isActive = audioData.bass > 0.3 + i * 0.1;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Cylinder,
        {
          args: [0.04, 0.04, 0.02],
          position: [-1.4 + col * 0.15, 1.22, -0.35 + row * 0.15],
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshStandardMaterial",
            {
              color: isActive ? 65280 : 3355443,
              emissive: isActive ? 65280 : 0,
              emissiveIntensity: isActive ? 0.8 : 0,
              metalness: 0.5,
              roughness: 0.4
            }
          )
        },
        `btn-left-${i}`
      );
    }),
    Array.from({ length: 4 }, (_, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const isActive = audioData.treble > 0.2 + i * 0.15;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        Cylinder,
        {
          args: [0.04, 0.04, 0.02],
          position: [1.25 + col * 0.15, 1.22, -0.35 + row * 0.15],
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshStandardMaterial",
            {
              color: isActive ? 16737792 : 3355443,
              emissive: isActive ? 16737792 : 0,
              emissiveIntensity: isActive ? 0.8 : 0,
              metalness: 0.5,
              roughness: 0.4
            }
          )
        },
        `btn-right-${i}`
      );
    })
  ] });
}
function Joystick({ position, audioData }) {
  const stickRef = reactExports.useRef(null);
  useFrame((state) => {
    if (stickRef.current) {
      const time = state.clock.elapsedTime;
      stickRef.current.rotation.x = Math.sin(time * 0.5) * 0.05 + audioData.bass * 0.02;
      stickRef.current.rotation.z = Math.cos(time * 0.3) * 0.05;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Cylinder, { args: [0.12, 0.15, 0.08], position: [0, -0.04, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 3355443, metalness: 0.7, roughness: 0.4 }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: stickRef, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Cylinder, { args: [0.04, 0.04, 0.25], position: [0, 0.125, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: 5592405, metalness: 0.6, roughness: 0.5 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sphere, { args: [0.08], position: [0, 0.28, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: 2763317,
          metalness: 0.5,
          roughness: 0.6
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Cylinder, { args: [0.082, 0.082, 0.1], position: [0, 0.28, 0], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: 1710618,
          metalness: 0.3,
          roughness: 0.9
        }
      ) })
    ] })
  ] });
}
const CAMERA_MODES = [
  "orbit",
  "crane-cockpit",
  "crane-shoulder",
  "crane-top",
  "ship-low",
  "ship-aerial",
  "ship-water",
  "ship-rig",
  "spectator",
  "crane",
  "booth"
  // NEW: Immersive control booth view
];
function MainScene({ useBooth = false, harborTheme = "industrial" } = {}) {
  const ships2 = useGameStore((s) => s.ships);
  const currentShipId = useGameStore((s) => s.currentShipId);
  const spectatorState = useGameStore((s) => s.spectatorState);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const isNight = useGameStore((s) => s.isNight);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const weather = useGameStore((s) => s.weather);
  const multiviewMode = useGameStore((s) => s.multiviewMode);
  const underwaterIntensity = useGameStore((s) => s.underwaterIntensity);
  const setBPM = useGameStore((s) => s.setBPM);
  const setLyricsSize = useGameStore((s) => s.setLyricsSize);
  const setLightIntensity = useGameStore((s) => s.setLightIntensity);
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay);
  const setCameraMode = useGameStore((s) => s.setCameraMode);
  const setWeather = useGameStore((s) => s.setWeather);
  const setCurrentShip = useGameStore((s) => s.setCurrentShip);
  const scheduleDeparture = useGameStore((s) => s.scheduleDeparture);
  const returnToDock = useGameStore((s) => s.returnToDock);
  const setMultiviewMode = useGameStore((s) => s.setMultiviewMode);
  const setUnderwaterIntensity = useGameStore((s) => s.setUnderwaterIntensity);
  const [departingShips, setDepartingShips] = reactExports.useState(/* @__PURE__ */ new Set());
  const orbitControlsRef = reactExports.useRef(null);
  const spectatorAngleRef = reactExports.useRef(0);
  const atSeaShipsRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const shipPositionsRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const currentShip = reactExports.useMemo(
    () => ships2.find((s) => s.id === currentShipId),
    [ships2, currentShipId]
  );
  useCinematicCamera();
  const { audioData } = useAudioVisualSync();
  useLevaControls({
    currentShip,
    ships: ships2,
    timeOfDay,
    setBPM,
    setLyricsSize,
    setLightIntensity,
    setTimeOfDay,
    setCameraMode,
    weather,
    setWeather,
    setCurrentShip,
    multiviewMode,
    setMultiviewMode,
    underwaterIntensity,
    setUnderwaterIntensity,
    useBooth
  });
  const { sunPosition, ambientIntensity, directionalIntensity, fogColor, fogDensity } = reactExports.useMemo(() => {
    const sunPos = getSunPosition(timeOfDay);
    const weatherEffects = weatherSystem.getWeatherEffects();
    return {
      sunPosition: sunPos,
      ambientIntensity: (isNight ? 0.15 : 0.6) * weatherEffects.ambientLight,
      directionalIntensity: (isNight ? 0.3 : 1.2) * weatherEffects.ambientLight,
      fogColor: weather === "storm" ? "#1a202c" : isNight ? "#0a0a15" : "#87CEEB",
      fogDensity: weatherEffects.fogDensity
    };
  }, [timeOfDay, isNight, weather]);
  const sceneFog = reactExports.useMemo(
    () => new FogExp2(fogColor, fogDensity),
    [fogColor, fogDensity]
  );
  useShipScheduling({
    ships: ships2,
    departingShips,
    setDepartingShips,
    atSeaShipsRef,
    shipPositionsRef,
    scheduleDeparture,
    returnToDock
  });
  useFrame((state, delta) => {
    const bpm = useGameStore.getState().bpm;
    lightingSystem.update(state.clock.elapsedTime, bpm);
    weatherSystem.updateLightning();
    wildlifeSystem.update(delta);
    seaEventsSystem.update(delta);
    updateSpectatorCamera({
      spectatorState,
      ships: ships2,
      delta,
      spectatorAngleRef,
      cameraMode,
      orbitControlsRef
    });
    animateDepartingShips({
      departingShips,
      shipPositionsRef,
      delta,
      setDepartingShips,
      atSeaShipsRef,
      returnToDock
    });
  });
  const sceneContent = /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("scene", { fog: sceneFog }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Environment, { preset: isNight ? "night" : "sunset" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "ambientLight",
      {
        intensity: ambientIntensity,
        color: isNight ? "#1a1a2e" : "#ffffff"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "directionalLight",
      {
        position: sunPosition,
        intensity: directionalIntensity,
        castShadow: true,
        "shadow-mapSize": [2048, 2048],
        "shadow-camera-far": 100,
        "shadow-camera-left": -50,
        "shadow-camera-right": 50,
        "shadow-camera-top": 50,
        "shadow-camera-bottom": -50,
        color: isNight ? "#8888ff" : "#fff8e7"
      }
    ),
    weather === "storm" && weatherSystem.isLightningActive() && /* @__PURE__ */ jsxRuntimeExports.jsx("ambientLight", { intensity: 2, color: "#ffffff" }),
    isNight && /* @__PURE__ */ jsxRuntimeExports.jsx(NightDockLights, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Water, { isNight }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dock, { isNight }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Crane, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WildlifeRenderer, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SeaEvents, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GlobalIllumination, { enabled: true, quality: "high" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AudioReactiveLightShow, { enabled: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(HolographicElements, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(EnhancedWeather, { enabled: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PostProcessing, { enabled: true, audioData }),
    ships2.map((ship) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      ShipWrapper,
      {
        ship,
        departingShips,
        shipPositionsRef,
        atSeaShipsRef
      },
      ship.id
    ))
  ] });
  if (useBooth) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ControlBooth, { harborTheme, debug: false, children: sceneContent }),
      spectatorState.isActive && /* @__PURE__ */ jsxRuntimeExports.jsx(
        SpectatorOverlay,
        {
          ship: ships2.find((s) => s.id === spectatorState.targetShipId),
          remainingTime: Math.max(0, spectatorState.duration - (Date.now() - spectatorState.startTime) / 1e3)
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    !spectatorState.isActive && cameraMode === "orbit" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      OrbitControls2,
      {
        ref: orbitControlsRef,
        target: (currentShip == null ? void 0 : currentShip.position) || [0, 0, 0],
        enableDamping: true,
        dampingFactor: 0.05
      }
    ),
    sceneContent,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      MultiviewSystem,
      {
        enabled: multiviewMode === "quad",
        underwaterIntensity
      }
    ),
    spectatorState.isActive && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SpectatorOverlay,
      {
        ship: ships2.find((s) => s.id === spectatorState.targetShipId),
        remainingTime: Math.max(0, spectatorState.duration - (Date.now() - spectatorState.startTime) / 1e3)
      }
    )
  ] });
}
function NightDockLights() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    [[-20, 8, -8], [0, 8, -8], [20, 8, -8]].map((pos, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: pos,
        intensity: 2,
        color: "#ffaa00",
        distance: 30,
        decay: 2
      },
      i
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pointLight", { position: [-30, -3, 10], intensity: 1.5, color: "#00aaff", distance: 40, decay: 2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pointLight", { position: [30, -3, 10], intensity: 1.5, color: "#00aaff", distance: 40, decay: 2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pointLight", { position: [-25, 15, 0], intensity: 1, color: "#ff0000", distance: 20 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("pointLight", { position: [25, 15, 0], intensity: 1, color: "#ff0000", distance: 20 })
  ] });
}
function ShipWrapper({
  ship,
  departingShips,
  shipPositionsRef,
  atSeaShipsRef
}) {
  if (atSeaShipsRef.current.has(ship.id)) return null;
  const animatedPos = departingShips.has(ship.id) ? shipPositionsRef.current.get(`${ship.id}_current`) : null;
  const displayShip = animatedPos ? { ...ship, position: [animatedPos.x, animatedPos.y, animatedPos.z] } : ship;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ShipComponent, { ship: displayShip });
}
function SpectatorOverlay({ ship, remainingTime }) {
  if (!ship) return null;
  const labels = {
    cruise: "Ocean Symphony",
    container: "Neon Stack",
    tanker: "Flame Runner",
    bulk: "Iron Mountain",
    lng: "Cryo Titan",
    roro: "Vehicle Voyager",
    research: "Deep Discoverer",
    droneship: "Of Course I Still Love You"
  };
  const colors = {
    cruise: "#ff6b9d",
    container: "#00d4aa",
    tanker: "#ff9500",
    bulk: "#8b4513",
    lng: "#00ffff",
    roro: "#ff6b35",
    research: "#4169e1",
    droneship: "#ffffff"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
      position: "absolute",
      top: "80px",
      left: "20px",
      background: "rgba(0,0,0,0.7)",
      padding: "12px 20px",
      borderRadius: "8px",
      border: `2px solid ${colors[ship.type]}`,
      pointerEvents: "none",
      zIndex: 100
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "2px" }, children: "Spectator Drone" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "18px", fontWeight: "bold", color: colors[ship.type], marginTop: "4px" }, children: labels[ship.type] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: "12px", color: "#aaa", marginTop: "4px" }, children: [
        "Auto-return in ",
        remainingTime.toFixed(1),
        "s"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "100px",
      height: "100px",
      border: "2px solid rgba(255,255,255,0.2)",
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: 50
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "4px",
      height: "4px",
      backgroundColor: colors[ship.type],
      borderRadius: "50%"
    } }) })
  ] });
}
function useLevaControls(config) {
  const {
    currentShip,
    ships: ships2,
    timeOfDay,
    setBPM,
    setLyricsSize,
    setLightIntensity,
    setTimeOfDay,
    setCameraMode,
    weather,
    setWeather,
    setCurrentShip,
    multiviewMode,
    setMultiviewMode,
    underwaterIntensity,
    setUnderwaterIntensity,
    useBooth
  } = config;
  useControls({
    "Current Ship": {
      value: (currentShip == null ? void 0 : currentShip.type) || "cruise",
      options: ["cruise", "container", "tanker"],
      onChange: (value) => {
        const ship = ships2.find((s) => s.type === value);
        if (ship) setCurrentShip(ship.id);
      }
    },
    "Music BPM": {
      value: 128,
      min: 60,
      max: 200,
      onChange: (value) => {
        setBPM(value);
        musicSystem.setBPM(value);
      }
    },
    "Lyrics Size": {
      value: 28,
      min: 12,
      max: 72,
      onChange: setLyricsSize
    },
    "Light Intensity": {
      value: 1.5,
      min: 0.1,
      max: 5,
      onChange: setLightIntensity
    },
    "Time of Day": {
      value: timeOfDay,
      min: 0,
      max: 24,
      step: 0.5,
      onChange: setTimeOfDay
    },
    "Fog Density": {
      value: 0.02,
      min: 0,
      max: 0.1,
      step: 1e-3
    },
    "Camera Mode": {
      value: useBooth ? "booth" : "orbit",
      options: CAMERA_MODES,
      onChange: (mode) => {
        setCameraMode(mode);
      }
    },
    "Weather": {
      value: weather,
      options: ["clear", "rain", "fog", "storm"],
      onChange: (w) => {
        setWeather(w);
        weatherSystem.forceWeather(w);
      }
    },
    ...!useBooth && {
      "Multiview Layout": {
        value: multiviewMode,
        options: ["single", "quad"],
        onChange: (mode) => setMultiviewMode(mode)
      }
    },
    "Underwater Intensity": {
      value: underwaterIntensity,
      min: 0,
      max: 2,
      step: 0.1,
      onChange: setUnderwaterIntensity
    }
  });
}
function useShipScheduling(config) {
  const {
    ships: ships2,
    departingShips,
    setDepartingShips,
    atSeaShipsRef,
    shipPositionsRef,
    scheduleDeparture,
    returnToDock
  } = config;
  reactExports.useEffect(() => {
    ships2.forEach((ship) => {
      if (ship.isDocked !== false && !ship.sailTime && !departingShips.has(ship.id) && !atSeaShipsRef.current.has(ship.id)) {
        scheduleDeparture(ship.id);
      }
    });
    const interval = setInterval(() => {
      const now = Date.now();
      ships2.forEach((ship) => {
        if (ship.sailTime && now >= ship.sailTime && !departingShips.has(ship.id) && !atSeaShipsRef.current.has(ship.id)) {
          shipPositionsRef.current.set(ship.id, new Vector3(...ship.position));
          setDepartingShips(/* @__PURE__ */ new Set([...departingShips, ship.id]));
        }
      });
      atSeaShipsRef.current.forEach((atSeaShip, shipId) => {
        if (now >= atSeaShip.returnTime) {
          atSeaShipsRef.current.delete(shipId);
          returnToDock(shipId);
          setTimeout(() => scheduleDeparture(shipId), 5e3);
        }
      });
    }, 1e3);
    return () => clearInterval(interval);
  }, [ships2, departingShips, scheduleDeparture, returnToDock, atSeaShipsRef, shipPositionsRef, setDepartingShips]);
}
function getSunPosition(hour) {
  const angle = (hour - 12) / 12 * Math.PI;
  return [
    Math.sin(angle) * 50,
    Math.cos(angle) * 50,
    20
  ];
}
function updateSpectatorCamera(config) {
  const { spectatorState, ships: ships2, delta, spectatorAngleRef, cameraMode, orbitControlsRef } = config;
  if (spectatorState.isActive && spectatorState.targetShipId) {
    const targetShip = ships2.find((s) => s.id === spectatorState.targetShipId);
    if (targetShip) {
      spectatorAngleRef.current += delta * 0.3;
    }
  } else if (cameraMode === "orbit" && orbitControlsRef.current) {
    orbitControlsRef.current.update();
  }
}
function animateDepartingShips(config) {
  const { departingShips, shipPositionsRef, delta, setDepartingShips, atSeaShipsRef, returnToDock } = config;
  departingShips.forEach((shipId) => {
    const originalPos = shipPositionsRef.current.get(shipId);
    if (!originalPos) return;
    let currentPos = shipPositionsRef.current.get(`${shipId}_current`);
    if (!currentPos) {
      currentPos = originalPos.clone();
      shipPositionsRef.current.set(`${shipId}_current`, currentPos);
    }
    currentPos.z += delta * 20;
    if (currentPos.z > originalPos.z + 100) {
      setDepartingShips(new Set([...departingShips].filter((id) => id !== shipId)));
      atSeaShipsRef.current.set(shipId, {
        shipId,
        returnTime: Date.now() + 1e4,
        originalPosition: [originalPos.x, originalPos.y, originalPos.z]
      });
      shipPositionsRef.current.delete(`${shipId}_current`);
      returnToDock(shipId);
    }
  });
}
export {
  MainScene as default
};
//# sourceMappingURL=MainScene-p9kwfiyl.js.map
