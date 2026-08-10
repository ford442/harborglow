import { WebGLNodeBuilder } from 'three/examples/jsm/renderers/webgl-legacy/nodes/WebGLNodes.js'
import * as THREE from 'three'
import {
  MeshStandardNodeMaterial,
  color,
  float
} from 'three/examples/jsm/nodes/Nodes.js'

const mat = new MeshStandardNodeMaterial();
mat.colorNode = color(0x111111);
mat.emissiveNode = color(0x00ff88);
mat.roughnessNode = float(0.4);
mat.metalnessNode = float(0.6);

try {
  const dummyRenderer = new THREE.WebGLRenderer();
  const builder = new WebGLNodeBuilder(dummyRenderer.getContext(), dummyRenderer, mat, null, null);
  builder.build();
  console.log("VERTEX", builder.vertexShader.slice(0, 50));
  console.log("FRAGMENT", builder.fragmentShader.slice(0, 50));
} catch (e) {
  console.log("ERROR", e.message);
}
