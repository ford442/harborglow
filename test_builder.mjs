import * as THREE from 'three'
import { MeshStandardNodeMaterial, color, float } from 'three/examples/jsm/nodes/Nodes.js'

const mat = new MeshStandardNodeMaterial();
mat.colorNode = color(0xff0000);

try {
  // Try to find a node builder
  const GLSLNodeBuilder = (await import('three/examples/jsm/renderers/webgl/nodes/GLSLNodeBuilder.js')).default;
  const builder = new GLSLNodeBuilder(null, mat, null, null);
  builder.build();
  console.log("SUCCESS GLSLNodeBuilder", builder.vertexShader.slice(0, 100));
} catch(e) { console.log(e.message) }

