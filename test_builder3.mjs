import WebGLNodeBuilder from 'three/examples/jsm/renderers/webgl-legacy/nodes/WebGLNodeBuilder.js'
import * as THREE from 'three'
import {
  MeshStandardNodeMaterial,
  color,
  float
} from 'three/examples/jsm/nodes/Nodes.js'

const mat = new MeshStandardNodeMaterial();
mat.colorNode = color(0x111111);

try {
  const dummyRenderer = new THREE.WebGLRenderer();
  const builder = new WebGLNodeBuilder(dummyRenderer, dummyRenderer, mat, null, null);
  builder.build();
  console.log("VERTEX", builder.vertexShader.slice(0, 50));
} catch (e) {
  console.log("ERROR", e.message);
}
