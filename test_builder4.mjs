import * as THREE from 'three'
import { MeshStandardNodeMaterial, color, float } from 'three/examples/jsm/nodes/Nodes.js'

async function test() {
  const GLSLNodeBuilder = (await import('three/examples/jsm/renderers/webgl/nodes/GLSLNodeBuilder.js')).default;
  const mat = new MeshStandardNodeMaterial();
  mat.colorNode = color(0xff0000);
  
  const dummyObject = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  const dummyRenderer = new THREE.WebGLRenderer();
  
  try {
    const builder = new GLSLNodeBuilder(dummyObject, dummyRenderer);
    builder.build();
    console.log("VERTEX", builder.vertexShader.slice(0, 100));
    console.log("FRAGMENT", builder.fragmentShader.slice(0, 100));
  } catch (e) {
    console.log("ERROR 1", e.message, e.stack);
  }
}
test();
