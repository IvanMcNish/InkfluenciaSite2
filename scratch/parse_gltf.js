import fs from 'fs';

const glbPath = './public/Basica2.glb';
const buffer = fs.readFileSync(glbPath);

const chunkLength = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

// Binary chunk starts right after the JSON chunk
const binChunkOffset = 20 + chunkLength;
const binChunkLength = buffer.readUInt32LE(binChunkOffset);
const binChunkType = buffer.readUInt32LE(binChunkOffset + 4);
const binData = buffer.subarray(binChunkOffset + 8, binChunkOffset + 8 + binChunkLength);

function getAccessorData(accessorIdx) {
  const accessor = gltf.accessors[accessorIdx];
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const start = bufferView.byteOffset + (accessor.byteOffset || 0);
  const data = binData.subarray(start, start + bufferView.byteLength);

  let numComponents = 1;
  if (accessor.type === 'VEC2') numComponents = 2;
  else if (accessor.type === 'VEC3') numComponents = 3;

  const count = accessor.count;
  const result = [];
  
  if (accessor.componentType === 5126) { // FLOAT
    for (let i = 0; i < count; i++) {
      const idx = i * numComponents * 4;
      const comps = [];
      for (let c = 0; c < numComponents; c++) {
        comps.push(data.readFloatLE(idx + c * 4));
      }
      result.push(comps);
    }
  }
  return result;
}

// Node mappings
gltf.nodes.forEach((node) => {
  if (node.mesh !== undefined) {
    const mesh = gltf.meshes[node.mesh];
    const primitive = mesh.primitives[0];
    const uvAccessorIdx = primitive.attributes.TEXCOORD_0;
    const posAccessorIdx = primitive.attributes.POSITION;

    const uvs = getAccessorData(uvAccessorIdx);
    const positions = getAccessorData(posAccessorIdx);

    // Compute min/max of UVs
    let minU = Infinity, maxU = -Infinity;
    let minV = Infinity, maxV = -Infinity;
    uvs.forEach(([u, v]) => {
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    });

    // Compute min/max of positions
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    positions.forEach(([x, y, z]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });

    console.log(`\nNode: "${node.name}"`);
    console.log(`  UV Bounds: U [${minU.toFixed(4)}, ${maxU.toFixed(4)}], V [${minV.toFixed(4)}, ${maxV.toFixed(4)}]`);
    console.log(`  UV Center: U: ${((minU + maxU)/2).toFixed(4)}, V: ${((minV + maxV)/2).toFixed(4)}`);
    console.log(`  Physical Bounds: X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}], Z [${minZ.toFixed(4)}, ${maxZ.toFixed(4)}]`);
    console.log(`  Physical Center: X: ${((minX + maxX)/2).toFixed(4)}, Y: ${((minY + maxY)/2).toFixed(4)}`);
  }
});
