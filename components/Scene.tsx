
import React, { useMemo, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useLoader, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Decal, Environment, Center, useTexture, Html, useProgress, Text, Line, useGLTF, RenderTexture, OrthographicCamera } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import { TSHIRT_GLB_MODELS, TOTEBAG_OBJ_URL } from '../constants';
import { TShirtConfig as ConfigType, Position, DesignLayer } from '../types';
import { getAppearanceSettings, DEFAULT_APPEARANCE } from '../services/settingsService';

// Fix for JSX.IntrinsicElements missing Three.js elements in some environments
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const AmbientLight = 'ambientLight' as any;
const SpotLight = 'spotLight' as any;
const MeshBasicMaterial = 'meshBasicMaterial' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;

const UNIT_TO_CM = 50;

interface SceneProps {
  config: ConfigType;
  captureRef?: React.MutableRefObject<(() => string) | null>;
  activeLayerSide?: 'front' | 'back'; 
  lockView?: boolean; 
  showMeasurements?: boolean;
  onPositionChange?: (x: number, y: number) => void;
  onScaleChange?: (scale: number) => void;
  onLayerSelect?: (index: number) => void;
  cameraOffset?: { x: number; y: number; zoom: number };
  hideHelpText?: boolean;
  activeLayerIndex?: number;
}

function Loader() {
  const { progress } = useProgress();
  return <Html center><div className="text-gray-500 font-mono text-sm">{progress.toFixed(0)}%</div></Html>;
}

const SnapshotHandler = ({ 
  captureRef, 
  controlsRef 
}: { 
  captureRef: React.MutableRefObject<(() => string) | null>;
  controlsRef: React.MutableRefObject<any>;
}) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const handleContextLost = (event: Event) => {
        event.preventDefault();
        console.warn('WebGL Context Lost');
    };

    const handleContextRestored = () => {
        console.log('WebGL Context Restored');
        gl.render(scene, camera);
    };

    const canvasElement = gl.domElement;
    canvasElement.addEventListener('webglcontextlost', handleContextLost, false);
    canvasElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    return () => {
        canvasElement.removeEventListener('webglcontextlost', handleContextLost);
        canvasElement.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    if (captureRef) {
      captureRef.current = () => {
        const context = gl.getContext();
        if (context && context.isContextLost()) {
            console.error("Cannot take snapshot: WebGL Context Lost");
            return "";
        }

        if (controlsRef.current) {
          controlsRef.current.reset();
        }
        
        // Force a square aspect ratio for a standard snapshot
        const originalAspect = camera.aspect;
        const originalWidth = gl.domElement.width;
        const originalHeight = gl.domElement.height;
        const pixelRatio = gl.getPixelRatio();

        // Set to 500x500 logical size
        camera.aspect = 1;
        camera.updateProjectionMatrix();
        gl.setSize(EXPORT_SIZE, EXPORT_SIZE, false);

        gl.render(scene, camera);

        let dataUrl = "";
        try {
            dataUrl = gl.domElement.toDataURL('image/webp', 1);
        } catch (e) {
            console.warn("Snapshot optimization failed", e);
        }

        // Revert to original dimensions
        camera.aspect = originalAspect;
        camera.updateProjectionMatrix();
        gl.setSize(originalWidth / pixelRatio, originalHeight / pixelRatio, false);
        gl.render(scene, camera);

        return dataUrl;
      };
    }
  }, [gl, scene, camera, captureRef, controlsRef]);

  useEffect(() => {
    return () => {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
             if (Array.isArray(object.material)) {
                object.material.forEach((m: any) => m.dispose());
             } else {
                object.material.dispose();
             }
          }
        }
      });
    };
  }, [gl, scene]);

  return null;
};

// Component to draw measurement lines
const MeasurementGuides: React.FC<{ width: number; height: number; position: [number, number, number]; rotation: [number, number, number] }> = ({ width, height, position, rotation }) => {
    const widthCm = Math.round(width * UNIT_TO_CM);
    const heightCm = Math.round(height * UNIT_TO_CM);
    
    // Offset for the lines so they don't touch the image
    const margin = 0.04;
    const color = "#ec4899"; 
    
    return (
        <Group position={position} rotation={rotation}>
             {/* Horizontal Line (Bottom) */}
            <Group position={[0, -height/2 - margin, 0]}>
                <Line points={[[-width/2, 0, 0], [width/2, 0, 0]]} color={color} lineWidth={1.5} />
                <Line points={[[-width/2, 0.02, 0], [-width/2, -0.02, 0]]} color={color} lineWidth={1.5} />
                <Line points={[[width/2, 0.02, 0], [width/2, -0.02, 0]]} color={color} lineWidth={1.5} />
                <Text 
                    position={[0, -0.08, 0]} 
                    fontSize={0.07} 
                    color={color} 
                    anchorX="center" 
                    anchorY="middle"
                    outlineWidth={0.005}
                    outlineColor="#ffffff"
                >
                    {widthCm} cm
                </Text>
            </Group>

            {/* Vertical Line (Right side) */}
            <Group position={[width/2 + margin, 0, 0]}>
                <Line points={[[0, -height/2, 0], [0, height/2, 0]]} color={color} lineWidth={1.5} />
                <Line points={[[-0.02, -height/2, 0], [0.02, -height/2, 0]]} color={color} lineWidth={1.5} /> 
                <Line points={[[-0.02, height/2, 0], [0.02, height/2, 0]]} color={color} lineWidth={1.5} />
                <Text 
                    position={[0.08, 0, 0]} 
                    rotation={[0, 0, -Math.PI / 2]} 
                    fontSize={0.07} 
                    color={color} 
                    anchorX="center" 
                    anchorY="middle"
                    outlineWidth={0.005}
                    outlineColor="#ffffff"
                >
                    {heightCm} cm
                </Text>
            </Group>
        </Group>
    );
};

const DecalImage: React.FC<{ 
    textureUrl: string; 
    position: Position; 
    zPos: number; 
    side: 'front' | 'back'; 
    showMeasurements?: boolean; 
    index: number;
    lockView: boolean;
    isDraggingRef: React.MutableRefObject<boolean>;
    onLayerSelect?: (index: number) => void;
    isToteBag?: boolean;
    customDepth?: number;
    opacity?: number;
}> = ({ textureUrl, position, zPos, side, showMeasurements, index, lockView, isDraggingRef, onLayerSelect, isToteBag, customDepth, opacity = 1 }) => {
  const texture = useTexture(textureUrl);
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {

    texture.colorSpace = THREE.SRGBColorSpace;

    texture.generateMipmaps = true;

    texture.minFilter = THREE.LinearMipmapLinearFilter;

    texture.magFilter = THREE.LinearFilter;

    texture.anisotropy = 16;

    texture.needsUpdate = true;

}, [texture]);
  
  const img = texture.image as HTMLImageElement;
  const ratio = img ? img.width / img.height : 1;
  
  let scaleX = position.scale;
  let scaleY = position.scale;

  if (ratio > 1) {
    scaleY = position.scale / ratio;
  } else {
    scaleX = position.scale * ratio;
  }

  // Use zPos directly, since ToteBagMesh passes the correct center sign automatically
  // For TShirt it passes zFront/zBack values, so we still invert for back if customDepth is missing
  const finalZ = customDepth !== undefined ? zPos : (side === 'back' ? -zPos : zPos);
  
  const rotation: [number, number, number] = side === 'back' ? [0, Math.PI, 0] : [0, 0, 0];
  const finalX = side === 'back' ? -position.x : position.x;
  
  const renderPriority = 10 + index; 
  const polyOffset = -10 - index; 

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (lockView) {
          e.stopPropagation();
          // Vital: Select this layer when clicking to start drag
          if (onLayerSelect) onLayerSelect(index);
          
          isDraggingRef.current = true;
          document.body.style.cursor = 'grabbing';
      }
  };

  const handlePointerOver = () => {
      if (lockView) {
          setHovered(true);
          document.body.style.cursor = 'grab';
      }
  }

  const handlePointerOut = () => {
      setHovered(false);
      if (!isDraggingRef.current) {
          document.body.style.cursor = 'default';
      }
  }

  const decalDepth = customDepth !== undefined ? customDepth : (isToteBag ? 0.3 : 6);

  // The true surface level where measurement guides should be drawn
  let guideZ = finalZ;
  if (customDepth !== undefined) {
      guideZ = side === 'back' ? finalZ - (customDepth / 2) : finalZ + (customDepth / 2);
  }

  return (
    <>
        <Decal 
            position={[finalX, position.y, finalZ]} 
            rotation={rotation} 
            scale={[scaleX, scaleY, decalDepth]} 
            debug={false}
            renderOrder={renderPriority}
            onPointerDown={handlePointerDown}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
        >
        <MeshBasicMaterial 
            map={texture} 
            transparent 
            opacity={opacity}
            polygonOffset 
            polygonOffsetFactor={polyOffset} 
            depthTest={true}
            depthWrite={false}
            color={hovered && lockView ? '#ffeeee' : '#ffffff'} // Slight tint on hover when editable
        />
        </Decal>
        
        {showMeasurements && (
            <MeasurementGuides 
                width={scaleX}
                height={scaleY}
                position={[finalX, position.y, guideZ + (side === 'back' ? -0.05 : 0.05)]}
                rotation={rotation}
            />
        )}
    </>
  );
};

const BasicaLayerItem: React.FC<{
  layer: DesignLayer;
  uvBounds: any;
  physicalBounds: any;
  renderer: THREE.WebGLRenderer;
}> = ({ layer, uvBounds, physicalBounds, renderer }) => {
  const texture = useTexture(layer.textureUrl);

  useEffect(() => {
    if (texture) {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.center.set(0.5, 0.5);
      texture.rotation = 0;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    }
  }, [texture, renderer]);

  const ratio = useMemo(() => {
    if (!texture || !texture.image) return 1;
    const img = texture.image as HTMLImageElement;
    return img.width / img.height;
  }, [texture]);

  const scale = layer.position?.scale || 0.25;
  let scaleX = scale;
  let scaleY = scale;

  if (ratio > 1) {
    scaleY = scale / ratio;
  } else {
    scaleX = scale * ratio;
  }

  // Adjust scale uniformly using the X-axis UV-to-physical ratio to keep physical aspect ratio perfectly consistent and uncompressed
  const uniformScaleFactor = uvBounds.width / physicalBounds.width;
  const finalScaleX = scaleX * uniformScaleFactor;
  const finalScaleY = scaleY * uniformScaleFactor;

  const offsetX = layer.position?.x || 0;
  const offsetY = layer.position?.y || 0;
  const rotDeg = layer.rotation || 0;
  const rotationRad = rotDeg * (Math.PI / 180);

  // Position the plane exactly at the center of the submesh's UV bounds, translating 3D coordinates to UV space correctly
  const planePositionX = (uvBounds.centerX - 0.5) + offsetX * (uvBounds.width / physicalBounds.width);
  const planePositionY = (uvBounds.centerY - 0.5) + offsetY * (uvBounds.height / physicalBounds.height);

  return (
    <mesh 
      position={[planePositionX, planePositionY, 0.01]} 
      rotation={[0, 0, rotationRad]}
      scale={[finalScaleX, finalScaleY, 1]}
    >
      <planeGeometry />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        depthWrite={false}
      />
    </mesh>
  );
};

const BasicaSubmeshWithTexture: React.FC<{
  meshData: any;
  matchingLayers: DesignLayer[];
  materialColor: string;
  normalMap: THREE.Texture;
  onPointerMove: (e: any) => void;
  onPointerDown?: (e: any) => void;
}> = ({ meshData, matchingLayers, materialColor, normalMap, onPointerMove, onPointerDown }) => {
  const renderer = useThree(state => state.gl);

  // Compute the UV bounds of the submesh geometry to automatically center and scale the texture correctly
  const uvBounds = useMemo(() => {
    const uvAttr = meshData.geometry.attributes.uv;
    if (!uvAttr) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1, centerX: 0.5, centerY: 0.5, width: 1.0, height: 1.0 };
    }
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (let i = 0; i < uvAttr.count; i++) {
      const u = uvAttr.getX(i);
      const v = uvAttr.getY(i);
      if (u < minX) minX = u;
      if (u > maxX) maxX = u;
      if (v < minY) minY = v;
      if (v > maxY) maxY = v;
    }
    
    const width = (maxX - minX) || 1.0;
    const height = (maxY - minY) || 1.0;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;
    
    return { minX, maxX, minY, maxY, centerX, centerY, width, height };
  }, [meshData.geometry]);

  // Compute physical 3D bounding box dimensions of the submesh geometry
  const physicalBounds = useMemo(() => {
    const posAttr = meshData.geometry.attributes.position;
    if (!posAttr) {
      return { width: 1.0, height: 1.0, depth: 1.0 };
    }
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    
    const width = (maxX - minX) || 1.0;
    const height = (maxY - minY) || 1.0;
    const depth = (maxZ - minZ) || 1.0;
    
    return { width, height, depth };
  }, [meshData.geometry]);

  const normalScaleVec = useMemo(() => new THREE.Vector2(0.18, 0.18), []);

  return (
    <Mesh 
      geometry={meshData.geometry}
      castShadow
      receiveShadow
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
    >
      <meshStandardMaterial
        color="#ffffff"
        normalMap={normalMap}
        normalScale={normalScaleVec}
        roughness={0.9}
        metalness={0.0}
      >
        <RenderTexture attach="map" width={4096} height={4096}>
          <color attach="background" args={[materialColor]} />
          <OrthographicCamera 
            makeDefault 
            left={-0.5} 
            right={0.5} 
            top={0.5} 
            bottom={-0.5} 
            near={0.1} 
            far={10} 
            position={[0, 0, 5]} 
          />
          {matchingLayers.map((layer) => (
            <BasicaLayerItem 
              key={layer.id}
              layer={layer}
              uvBounds={uvBounds}
              physicalBounds={physicalBounds}
              renderer={renderer}
            />
          ))}
        </RenderTexture>
      </meshStandardMaterial>
    </Mesh>
  );
};

const BasicaSubmeshPlain: React.FC<{
  meshData: any;
  materialColor: string;
  normalMap: THREE.Texture;
  onPointerMove: (e: any) => void;
  onPointerDown?: (e: any) => void;
}> = ({ meshData, materialColor, normalMap, onPointerMove, onPointerDown }) => {
  const material = useMemo(() => {
    let mat: THREE.MeshStandardMaterial;
    if (Array.isArray(meshData.material)) {
      mat = (meshData.material[0] || new THREE.MeshStandardMaterial()).clone() as THREE.MeshStandardMaterial;
    } else if (meshData.material) {
      mat = meshData.material.clone() as THREE.MeshStandardMaterial;
    } else {
      mat = new THREE.MeshStandardMaterial();
    }

    mat.color.set(new THREE.Color(materialColor));
    mat.normalMap = normalMap;
    mat.normalScale.set(0.18, 0.18);
    mat.roughness = 0.9;
    mat.metalness = 0.0;
    mat.map = null;
    
    return mat;
  }, [meshData.material, materialColor, normalMap]);

  return (
    <Mesh 
      geometry={meshData.geometry}
      material={material}
      castShadow
      receiveShadow
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
    />
  );
};

const BasicaSubmesh: React.FC<{
  meshData: any;
  matchingLayers: DesignLayer[];
  materialColor: string;
  normalMap: THREE.Texture;
  onPointerMove: (e: any) => void;
  onPointerDown?: (e: any) => void;
}> = ({ meshData, matchingLayers, materialColor, normalMap, onPointerMove, onPointerDown }) => {
  if (matchingLayers && matchingLayers.length > 0) {
    return (
      <BasicaSubmeshWithTexture
        meshData={meshData}
        matchingLayers={matchingLayers}
        materialColor={materialColor}
        normalMap={normalMap}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
      />
    );
  }

  return (
    <BasicaSubmeshPlain
      meshData={meshData}
      materialColor={materialColor}
      normalMap={normalMap}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
    />
  );
};

const TransformGuides: React.FC<{
  width: number;
  height: number;
  position: [number, number, number];
  rotation: [number, number, number];
  isDraggingRef: React.MutableRefObject<boolean>;
  onPositionChange?: (x: number, y: number) => void;
  onScaleChange?: (scale: number) => void;
  layer: DesignLayer;
  disableScaleIn3D?: boolean;
}> = ({ width, height, position, rotation, isDraggingRef, onPositionChange, onScaleChange, layer, disableScaleIn3D }) => {
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const dragInfo = useRef<{
    mode: 'move' | 'scale' | null;
    initialPointerX: number;
    initialPointerY: number;
    initialScale: number;
    initialX: number;
    initialY: number;
    initialPointerDist: number;
  }>({
    mode: null,
    initialPointerX: 0,
    initialPointerY: 0,
    initialScale: 1,
    initialX: 0,
    initialY: 0,
    initialPointerDist: 1,
  });

  const scale = layer.position.scale;
  const margin = Math.max(0.04, scale * 0.12);
  const handleSize = 0.02 + scale * 0.045;

  const borderWidth = width + margin * 2;
  const borderHeight = height + margin * 2;

  const halfW = borderWidth / 2;
  const halfH = borderHeight / 2;

  const color = "#ec4899"; // Word-style pink/fuchsia borders
  const handleColor = "#3b82f6"; // Electric blue handles

  const centerPos = useMemo(() => new THREE.Vector3(...position), [position]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>, mode: 'move' | 'scale') => {
    e.stopPropagation();
    isDraggingRef.current = true;
    
    dragInfo.current = {
      mode,
      initialPointerX: e.point.x,
      initialPointerY: e.point.y,
      initialScale: layer.position.scale,
      initialX: layer.position.x || 0,
      initialY: layer.position.y || 0,
      initialPointerDist: e.point.distanceTo(centerPos),
    };

    document.body.style.cursor = mode === 'move' ? 'move' : 'nwse-resize';
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDraggingRef.current || !dragInfo.current.mode) return;
    e.stopPropagation();

    const info = dragInfo.current;
    if (info.mode === 'move') {
      let deltaX = e.point.x - info.initialPointerX;
      let deltaY = e.point.y - info.initialPointerY;

      if (layer.side === 'back') {
        deltaX = -deltaX;
      }

      if (onPositionChange) {
        onPositionChange(info.initialX + deltaX, info.initialY + deltaY);
      }
    } else if (info.mode === 'scale') {
      const currentDist = e.point.distanceTo(centerPos);
      const ratio = currentDist / (info.initialPointerDist || 1);
      const newScale = info.initialScale * ratio;

      if (onScaleChange) {
        onScaleChange(newScale);
      }
    }
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    isDraggingRef.current = false;
    dragInfo.current.mode = null;
    document.body.style.cursor = 'default';
  };

  const linePoints = useMemo(() => [
    [-halfW, -halfH, 0.005],
    [halfW, -halfH, 0.005],
    [halfW, halfH, 0.005],
    [-halfW, halfH, 0.005],
    [-halfW, -halfH, 0.005]
  ] as [number, number, number][], [halfW, halfH]);

  return (
    <Group 
      position={position} 
      rotation={rotation}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Rectangular Border Outline */}
      <Line 
        points={linePoints} 
        color={color} 
        lineWidth={2.5} 
      />

      {/* Center Handle for Moving */}
      <mesh
        position={[0, 0, 0.015]}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onPointerOver={() => setHoveredHandle('center')}
        onPointerOut={() => setHoveredHandle(null)}
      >
        <sphereGeometry args={[handleSize * 1.1, 16, 16]} />
        <meshBasicMaterial 
          color={hoveredHandle === 'center' ? "#10b981" : "#f43f5e"} 
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      
      {/* Central Mover label */}
      <Text
        position={[0, handleSize * 1.6, 0.02]}
        fontSize={0.06 + scale * 0.04}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#f43f5e"
      >
        Mover
      </Text>

      {!disableScaleIn3D && (
        <Group>
          {/* Top-Right Scale Handle */}
          <mesh
            position={[halfW, halfH, 0.015]}
            onPointerDown={(e) => handlePointerDown(e, 'scale')}
            onPointerOver={() => setHoveredHandle('tr')}
            onPointerOut={() => setHoveredHandle(null)}
          >
            <boxGeometry args={[handleSize, handleSize, handleSize]} />
            <meshBasicMaterial 
              color={hoveredHandle === 'tr' ? "#ec4899" : handleColor} 
              depthWrite={false}
              depthTest={false}
            />
          </mesh>

          {/* Top-Left Scale Handle */}
          <mesh
            position={[-halfW, halfH, 0.015]}
            onPointerDown={(e) => handlePointerDown(e, 'scale')}
            onPointerOver={() => setHoveredHandle('tl')}
            onPointerOut={() => setHoveredHandle(null)}
          >
            <boxGeometry args={[handleSize, handleSize, handleSize]} />
            <meshBasicMaterial 
              color={hoveredHandle === 'tl' ? "#ec4899" : handleColor} 
              depthWrite={false}
              depthTest={false}
            />
          </mesh>

          {/* Bottom-Right Scale Handle */}
          <mesh
            position={[halfW, -halfH, 0.015]}
            onPointerDown={(e) => handlePointerDown(e, 'scale')}
            onPointerOver={() => setHoveredHandle('br')}
            onPointerOut={() => setHoveredHandle(null)}
          >
            <boxGeometry args={[handleSize, handleSize, handleSize]} />
            <meshBasicMaterial 
              color={hoveredHandle === 'br' ? "#ec4899" : handleColor} 
              depthWrite={false}
              depthTest={false}
            />
          </mesh>

          {/* Bottom-Left Scale Handle */}
          <mesh
            position={[-halfW, -halfH, 0.015]}
            onPointerDown={(e) => handlePointerDown(e, 'scale')}
            onPointerOver={() => setHoveredHandle('bl')}
            onPointerOut={() => setHoveredHandle(null)}
          >
            <boxGeometry args={[handleSize, handleSize, handleSize]} />
            <meshBasicMaterial 
              color={hoveredHandle === 'bl' ? "#ec4899" : handleColor} 
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        </Group>
      )}
    </Group>
  );
};

const BasicaTransformGuides: React.FC<{
  layer: DesignLayer;
  meshes: any[];
  isDraggingRef: React.MutableRefObject<boolean>;
  onPositionChange?: (x: number, y: number) => void;
  onScaleChange?: (scale: number) => void;
}> = ({ layer, meshes, isDraggingRef, onPositionChange, onScaleChange }) => {
  const texture = useTexture(layer.textureUrl);
  const img = texture ? texture.image as HTMLImageElement : null;
  const ratio = img ? img.width / img.height : 1;

  let scaleX = layer.position.scale;
  let scaleY = layer.position.scale;

  if (ratio > 1) {
    scaleY = layer.position.scale / ratio;
  } else {
    scaleX = layer.position.scale * ratio;
  }

  const targetMesh = layer.targetMesh || 'basica_pecho';
  
  const center = useMemo(() => {
    const found = meshes.find(m => m.name.toLowerCase() === targetMesh.toLowerCase());
    if (!found) return new THREE.Vector3(0, 0, 0.2);
    
    found.geometry.computeBoundingBox();
    const c = new THREE.Vector3();
    found.geometry.boundingBox?.getCenter(c);
    
    if (targetMesh.toLowerCase().includes('espalda')) {
      c.z -= 0.061;
    } else if (targetMesh.toLowerCase().includes('pecho')) {
      c.z += 0.061;
    } else if (targetMesh.toLowerCase().includes('mangiz')) {
      c.x -= 0.061;
      c.z += 0.061;
    } else if (targetMesh.toLowerCase().includes('mangder')) {
      c.x += 0.061;
      c.z += 0.061;
    }
    return c;
  }, [targetMesh, meshes]);

  const finalPos = new THREE.Vector3(
    center.x + (layer.position.x || 0),
    center.y + (layer.position.y || 0),
    center.z
  );

  const rotation: [number, number, number] = targetMesh.toLowerCase().includes('espalda') ? [0, Math.PI, 0] : [0, 0, 0];

  return (
    <TransformGuides 
      width={scaleX}
      height={scaleY}
      position={[finalPos.x, finalPos.y, finalPos.z]}
      rotation={rotation}
      isDraggingRef={isDraggingRef}
      onPositionChange={onPositionChange}
      onScaleChange={onScaleChange}
      layer={layer}
      disableScaleIn3D={true}
    />
  );
};

const BasicaMeasurementGuides: React.FC<{
  layer: DesignLayer;
  meshes: any[];
}> = ({ layer, meshes }) => {
  const texture = useTexture(layer.textureUrl);
  const img = texture ? texture.image as HTMLImageElement : null;
  const ratio = img ? img.width / img.height : 1;

  let scaleX = layer.position.scale;
  let scaleY = layer.position.scale;

  if (ratio > 1) {
    scaleY = layer.position.scale / ratio;
  } else {
    scaleX = layer.position.scale * ratio;
  }

  const targetMesh = layer.targetMesh || 'basica_pecho';
  
  const center = useMemo(() => {
    const found = meshes.find(m => m.name.toLowerCase() === targetMesh.toLowerCase());
    if (!found) return new THREE.Vector3(0, 0, 0.2);
    
    found.geometry.computeBoundingBox();
    const c = new THREE.Vector3();
    found.geometry.boundingBox?.getCenter(c);
    
    if (targetMesh.toLowerCase().includes('espalda')) {
      c.z -= 0.06;
    } else if (targetMesh.toLowerCase().includes('pecho')) {
      c.z += 0.06;
    } else if (targetMesh.toLowerCase().includes('mangiz')) {
      c.x -= 0.06;
      c.z += 0.06;
    } else if (targetMesh.toLowerCase().includes('mangder')) {
      c.x += 0.06;
      c.z += 0.06;
    }
    return c;
  }, [targetMesh, meshes]);

  const finalPos = new THREE.Vector3(
    center.x + (layer.position.x || 0),
    center.y + (layer.position.y || 0),
    center.z
  );

  const rotation: [number, number, number] = targetMesh.toLowerCase().includes('espalda') ? [0, Math.PI, 0] : [0, 0, 0];

  return (
    <MeasurementGuides 
      width={scaleX}
      height={scaleY}
      position={[finalPos.x, finalPos.y, finalPos.z]}
      rotation={rotation}
    />
  );
};

interface ProductMeshProps {
    config: ConfigType;
    showMeasurements?: boolean;
    customBlackColor?: string;
    lockView?: boolean;
    onPositionChange?: (x: number, y: number) => void;
    onScaleChange?: (scale: number) => void;
    onLayerSelect?: (index: number) => void;
    activeLayerSide: 'front' | 'back';
    isDraggingRef: React.MutableRefObject<boolean>;
    designOpacity?: number;
    activeLayerIndex?: number;
}

const TShirtMesh: React.FC<ProductMeshProps> = ({ config, showMeasurements, customBlackColor, lockView, onPositionChange, onScaleChange, onLayerSelect, activeLayerSide, isDraggingRef, designOpacity = 1, activeLayerIndex }) => {
  const objUrl = config.productType === 'oversize'
    ? '/Oversize.glb'
    : (config.productType === 'basica' ? '/Basica2.glb' : (TSHIRT_GLB_MODELS[config.tshirtModelIndex || 0] || '/Basica2.glb'));
  const { scene } = useGLTF(objUrl);
  
  // Load fabric normal map texture
  const normalMap = useTexture('/NormalFabric.jpg');
  useEffect(() => {
    if (normalMap) {
      normalMap.wrapS = THREE.RepeatWrapping;
      normalMap.wrapT = THREE.RepeatWrapping;
      normalMap.repeat.set(32, 32); // Highly detailed repeat tiling for realistic micro-threads
      normalMap.anisotropy = 16;
normalMap.generateMipmaps = true;
      normalMap.needsUpdate = true;
    }
  }, [normalMap]);
  
  const { meshes, zFront, zBack } = useMemo(() => {
    scene.updateMatrixWorld(true);

    const tempMeshes: { name: string; geo: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }[] = [];
    
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.visible) {
         const m = child as THREE.Mesh;
         
         // Ignore helpers/cameras
         if (m.name.toLowerCase().includes('helper') || m.name.toLowerCase().includes('camera')) {
           return;
         }

         const geo = m.geometry.clone();
         geo.applyMatrix4(m.matrixWorld);

         // Corrective rotation for tshirt-2.glb (it is rotated 90 deg sideways on Y axis)
         if (objUrl.toLowerCase().includes('tshirt-2') || objUrl.toLowerCase().includes('tshirt_2')) {
           geo.rotateY(-Math.PI / 2);
         }

         tempMeshes.push({
            name: m.name || '',
            geo,
            material: m.material as THREE.Material | THREE.Material[]
         });
      }
    });

    // Fallback if no meshes detected
    if (tempMeshes.length === 0) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          const geo = m.geometry.clone();
          geo.applyMatrix4(m.matrixWorld);
          tempMeshes.push({
            name: m.name || '',
            geo,
            material: m.material as THREE.Material | THREE.Material[]
          });
        }
      });
    }

    // Calculate precision bounding box strictly based on valid clothes meshes
    const tightBox = new THREE.Box3();
    tempMeshes.forEach(({ geo }, idx) => {
      geo.computeBoundingBox();
      if (geo.boundingBox) {
        if (idx === 0) {
          tightBox.copy(geo.boundingBox);
        } else {
          tightBox.union(geo.boundingBox);
        }
      }
    });

    const size = new THREE.Vector3();
    tightBox.getSize(size);
    const center = new THREE.Vector3();
    tightBox.getCenter(center);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = maxDim > 0 ? (4 / maxDim) : 1;

    let overallZFront = -Infinity;
    let overallZBack = Infinity;

    const meshesList = tempMeshes.map(({ name, geo, material }) => {
       geo.translate(-center.x, -center.y, -center.z);
       geo.scale(scaleFactor, scaleFactor, scaleFactor);

       geo.computeBoundingBox();
       if (geo.boundingBox) {
          overallZFront = Math.max(overallZFront, geo.boundingBox.max.z);
          overallZBack = Math.min(overallZBack, geo.boundingBox.min.z);
       }

       return {
          name,
          geometry: geo,
          material
       };
    });

    return { 
        meshes: meshesList, 
        zFront: overallZFront === -Infinity ? 0 : overallZFront, 
        zBack: overallZBack === Infinity ? 0 : Math.abs(overallZBack) 
    };
  }, [scene, objUrl]);

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
      if (!lockView || !onPositionChange || !isDraggingRef.current) return;
      
      e.stopPropagation();
      const point = e.point;
      
      let x = point.x;
      let y = point.y;

      const isBasica = config.productType === 'basica';
      if (isBasica) {
          const currentLayer = config.layers[activeLayerIndex];
          if (currentLayer) {
              const targetMesh = currentLayer.targetMesh || 'basica_pecho';
              const found = meshes.find(m => m.name.toLowerCase() === targetMesh.toLowerCase());
              if (found) {
                  found.geometry.computeBoundingBox();
                  const c = new THREE.Vector3();
                  found.geometry.boundingBox?.getCenter(c);
                  
                  // In Basica, the layer position is relative to the submesh center
                  x = point.x - c.x;
                  y = point.y - c.y;
              }
          }
      }

      if (activeLayerSide === 'back') {
          x = -x;
      }

      onPositionChange(x, y);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (lockView) {
          e.stopPropagation();
          isDraggingRef.current = true;
          document.body.style.cursor = 'grabbing';
      }
  };

  if (meshes.length === 0) return null;

  let materialColor = config.color === 'white' ? '#ffffff' : (customBlackColor || '#050505');
  const isBasica = config.productType === 'basica';

  if (isBasica) {
    return (
      <group>
        {meshes.map((meshData, i) => {
          const meshNameLower = (meshData.name || '').toLowerCase();
          const matchingLayers = config.layers.filter(layer => {
            const target = (layer.targetMesh || '').toLowerCase();
            return target === meshNameLower || (target === '' && meshNameLower === 'basica_pecho' && layer.side !== 'back');
          });

          return (
            <BasicaSubmesh
              key={i}
              meshData={meshData}
              matchingLayers={matchingLayers}
              materialColor={materialColor}
              normalMap={normalMap}
              onPointerMove={handlePointerMove}
              onPointerDown={handlePointerDown}
            />
          );
        })}
        {showMeasurements && config.layers.map((layer) => {
          const isLayerBack = layer.side === 'back';
          // Only show measurements on active screen side
          if (activeLayerSide === 'back' && !isLayerBack) return null;
          if (activeLayerSide === 'front' && isLayerBack) return null;
          return (
            <BasicaMeasurementGuides
              key={layer.id}
              layer={layer}
              meshes={meshes}
            />
          );
        })}
      </group>
    );
  }
  
  return (
    <group>
      {meshes.map((meshData, i) => (
        <Mesh 
            key={i}
            castShadow 
            receiveShadow 
            geometry={meshData.geometry} 
            dispose={null}
            onPointerMove={handlePointerMove}
        >
          {(() => {
            if (Array.isArray(meshData.material)) {
              return meshData.material.map((mat, idx) => {
                const cloned = mat.clone();
                if ('color' in cloned && (cloned as any).color) {
                  (cloned as any).color.set(materialColor);
                }
                if ('normalMap' in cloned) {
                  (cloned as any).normalMap = normalMap;
                  if ('normalScale' in cloned) {
                    (cloned as any).normalScale.set(0.18, 0.18);
                  }
                  if ('roughness' in cloned) {
                    (cloned as any).roughness = 0.9;
                  }
                  if ('metalness' in cloned) {
                    (cloned as any).metalness = 0.0;
                  }
                }
                return <primitive key={idx} object={cloned} attach={`material-${idx}`} />;
              });
            } else if (meshData.material) {
              const cloned = meshData.material.clone();
              if ('color' in cloned && (cloned as any).color) {
                (cloned as any).color.set(materialColor);
              }
              if ('normalMap' in cloned) {
                (cloned as any).normalMap = normalMap;
                if ('normalScale' in cloned) {
                  (cloned as any).normalScale.set(0.18, 0.18);
                }
                if ('roughness' in cloned) {
                  (cloned as any).roughness = 0.9;
                }
                if ('metalness' in cloned) {
                  (cloned as any).metalness = 0.0;
                }
              }
              return <primitive object={cloned} attach="material" />;
            } else {
              return (
                <MeshStandardMaterial 
                  color={materialColor} 
                  roughness={0.9}
                  metalness={0.0}
                  normalMap={normalMap}
                  normalScale={[0.18, 0.18]}
                />
              );
            }
          })()}
          {config.layers.map((layer, index) => {
            const isLayerBack = layer.side === 'back';
            const meshNameLower = (meshData.name || '').toLowerCase();
            
            // Skip inner / lining / inside meshes entirely for decals, preventing inside projection
            if (
              meshNameLower.includes('inner') || 
              meshNameLower.includes('inside') || 
              meshNameLower.includes('interior') || 
              meshNameLower.includes('lining') || 
              meshNameLower.includes('under') ||
              meshNameLower.includes('internal') ||
              meshNameLower.includes('reverse') ||
              meshNameLower.includes('double')
            ) {
              return null;
            }
            
            // If the mesh is explicitly front but the layer is back, skip it!
            if (isLayerBack && (meshNameLower.includes('front') || meshNameLower.includes('frente') || meshNameLower.includes('delante') || meshNameLower.includes('pecho'))) {
              return null;
            }
            
            // If the mesh is explicitly back but the layer is front, skip it!
            if (!isLayerBack && (meshNameLower.includes('back') || meshNameLower.includes('rear') || meshNameLower.includes('espalda') || meshNameLower.includes('trasero'))) {
              return null;
            }

            // Calculate precise safe projection bounds to avoid bleed-through
            const T = zFront + zBack;
            const zDepthOffset = index * 0.001;
            
            // Midpoint of shirt is (zFront - zBack) / 2
            // Front half center: (3*zFront - zBack)/4 + zDepthOffset
            // Back half center: (zFront - 3*zBack)/4 - zDepthOffset
            const projZCenter = isLayerBack 
               ? ((zFront - 3 * zBack) / 4) - zDepthOffset 
               : ((3 * zFront - zBack) / 4) + zDepthOffset;
            
            // We set depth to half of the shirt depth plus a small safety margin of 0.15 
            // to make sure it wraps around the chest beautifully without hitting the back mesh
            const projDepth = (T / 2) + 0.15;

            return (
              <DecalImage 
                  key={layer.id} 
                  index={index} 
                  textureUrl={layer.textureUrl} 
                  position={layer.position} 
                  side={layer.side || 'front'} 
                  zPos={projZCenter} 
                  showMeasurements={showMeasurements}
                  lockView={!!lockView}
                  isDraggingRef={isDraggingRef}
                  onLayerSelect={onLayerSelect}
                  isToteBag={false}
                  customDepth={projDepth}
                  opacity={designOpacity}
              />
            );
          })}
        </Mesh>
      ))}
    </group>
  );
};

const ToteBagMesh: React.FC<ProductMeshProps> = ({ config, showMeasurements, customBlackColor, lockView, onPositionChange, onLayerSelect, activeLayerSide, isDraggingRef, designOpacity = 1 }) => {
  const objUrl = TOTEBAG_OBJ_URL;
  const obj = useLoader(OBJLoader, objUrl);
  
  // Load fabric normal map texture
  const normalMap = useTexture('/NormalFabric.jpg');
  useEffect(() => {
    if (normalMap) {
      normalMap.wrapS = THREE.RepeatWrapping;
      normalMap.wrapT = THREE.RepeatWrapping;
      normalMap.repeat.set(12, 12); // Slightly larger canvas-style weave for tote bag
      normalMap.anisotropy = 16;
normalMap.generateMipmaps = true;
      normalMap.needsUpdate = true;
    }
  }, [normalMap]);
  
  const { geometry, zFront, zBack } = useMemo(() => {
    let foundGeom: THREE.BufferGeometry | null = null;
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !foundGeom) {
        foundGeom = (child as THREE.Mesh).geometry;
      }
    });

    if (!foundGeom) return { geometry: null, zFront: 0, zBack: 0 };

    const geo = foundGeom.clone();
    geo.computeVertexNormals(); // Ensure smooth normals for wavy surface
    geo.center(); 
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Scale totebag appropriately
    const scaleFactor = 4 / maxDim;
    geo.scale(scaleFactor, scaleFactor, scaleFactor);
    
    geo.computeBoundingBox();
    const zFront = geo.boundingBox!.max.z;
    const zBack = Math.abs(geo.boundingBox!.min.z);

    return { geometry: geo, zFront, zBack };
  }, [obj]);

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
      if (!lockView || !onPositionChange || !isDraggingRef.current) return;
      
      e.stopPropagation();
      const point = e.point;
      
      let x = point.x;
      let y = point.y;

      if (activeLayerSide === 'back') {
          x = -x;
      }

      onPositionChange(x, y);
  };

  if (!geometry) return null;

  const materialColor = '#f3eddf'; // Bone/Natural color
  
  return (
    <Mesh 
        castShadow 
        receiveShadow 
        geometry={geometry} 
        dispose={null}
        onPointerMove={handlePointerMove}
    >
      <MeshStandardMaterial 
        color={materialColor} 
        roughness={0.95}
        metalness={0.0}
        side={THREE.DoubleSide} 
        normalMap={normalMap}
        normalScale={[0.25, 0.25]} // Slightly higher strength for coarse tote bag fabric
      />
      {config.layers.map((layer, index) => {
          // For the front side, z moves from 0 to zFront. So the center is zFront / 2, depth is zFront + 0.1
          // For the back side, z moves from -zBack to 0. So the center is -zBack / 2, depth is zBack + 0.1
          const isBack = layer.side === 'back';
          const zDepthOffset = index * 0.001; 
          const projZCenter = isBack ? -(zBack / 2) - zDepthOffset : (zFront / 2) + zDepthOffset;
          const projDepth = (isBack ? zBack : zFront) + 0.1;
          
          return (
            <DecalImage 
                key={layer.id} 
                index={index} 
                textureUrl={layer.textureUrl} 
                position={layer.position} 
                side={layer.side || 'front'} 
                zPos={projZCenter} 
                showMeasurements={showMeasurements}
                lockView={!!lockView}
                isDraggingRef={isDraggingRef}
                onLayerSelect={onLayerSelect}
                isToteBag={true}
                customDepth={projDepth}
                opacity={designOpacity}
            />
          );
      })}
    </Mesh>
  );
};

TSHIRT_GLB_MODELS.forEach(url => {
  useGLTF.preload(url);
});
useTexture.preload('/NormalFabric.jpg');

const ProductMesh: React.FC<ProductMeshProps> = (props) => {
    return props.config.productType === 'totebag' ? <ToteBagMesh {...props} /> : <TShirtMesh {...props} />;
};

export const Scene: React.FC<SceneProps> = ({ config, captureRef, activeLayerSide = 'front', lockView = false, showMeasurements = false, onPositionChange, onScaleChange, onLayerSelect, cameraOffset, hideHelpText = false, activeLayerIndex }) => {
  const controlsRef = useRef<any>(null);
  const isDraggingRef = useRef(false); // Global dragging state for this scene
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [blackColor, setBlackColor] = useState(DEFAULT_APPEARANCE.blackShirtHex);
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
        const settings = await getAppearanceSettings();
        setAppearance(settings);
        setBlackColor(settings.blackShirtHex);
    };
    loadSettings();
  }, []);

  // Global Pointer Up Listener to handle "Drop" anywhere
  useEffect(() => {
    const handleGlobalPointerUp = () => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            document.body.style.cursor = 'default';
        }
    };
    
    // Listen on window to catch release even if mouse left the canvas
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    
    return () => {
        window.removeEventListener('pointerup', handleGlobalPointerUp);
        window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, []);

  const isToteBag = config.productType === 'totebag';

  const initialCameraPosition: [number, number, number] = useMemo(() => {
      // Minimum zoom corresponds to the maximum distance permitted by orbit controls (e.g. 11.0)
      const zBase = 11.0;
      return activeLayerSide === 'back' ? [0, 0, -zBase] : [0, 0, zBase];
  }, [activeLayerSide]);

  // Handle View Locking and Camera Reset
  useEffect(() => {
    if (controlsRef.current) {
        if (lockView) {
            controlsRef.current.reset();
            const zBase = 11.0; // Always start/restore to minimum zoom (distance 11.0)
            
            // Apply offset if any
            const offX = cameraOffset?.x || 0;
            const offY = cameraOffset?.y || 0;
            const offZ = cameraOffset?.zoom || 0;
            
            const targetZ = activeLayerSide === 'back' ? -(zBase + offZ) : (zBase + offZ);
            
            const camera = controlsRef.current.object;
            camera.position.set(offX, offY, targetZ);
            camera.lookAt(offX, offY, 0);
            controlsRef.current.target.set(offX, offY, 0);
            controlsRef.current.update();
        }
    }
  }, [activeLayerSide, lockView, isToteBag, cameraOffset]);

  return (
    <div className="w-full h-full min-h-[250px] md:min-h-[400px] relative rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
      <div className="absolute inset-0 bg-[url('/light.jpeg')] dark:bg-[url('/dark.jpeg')] bg-cover bg-center blur-sm opacity-80 z-0 pointer-events-none" />
      <div className="absolute inset-0 z-10">
        <Canvas 
          shadows
          dpr={[1, 2]} 
          camera={{ position: initialCameraPosition, fov: 35 }}
          gl={{ 
              preserveDrawingBuffer: true,
              powerPreference: "high-performance",
              antialias: true
          }} 
        >
          <AmbientLight intensity={0.5} />
          <SpotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow />
          <SpotLight position={[-10, 5, 10]} intensity={0.5} />
          <SpotLight position={[0, 5, -10]} intensity={0.5} />
          
          {captureRef && <SnapshotHandler captureRef={captureRef} controlsRef={controlsRef} />}

          <Suspense fallback={<Loader />}>
              <Center>
                  <ProductMesh 
                      config={config} 
                      showMeasurements={showMeasurements} 
                      customBlackColor={blackColor} 
                      lockView={lockView}
                      onPositionChange={onPositionChange}
                      onScaleChange={onScaleChange}
                      onLayerSelect={onLayerSelect}
                      activeLayerSide={activeLayerSide}
                      isDraggingRef={isDraggingRef}
                      designOpacity={config.designOpacity ?? appearance.designOpacity}
                      activeLayerIndex={activeLayerIndex}
                  />
              </Center>
              <Environment preset="city" />
          </Suspense>
          <OrbitControls 
            ref={controlsRef}
            enablePan={false} 
            enableRotate={!lockView} // Disable rotation when locked to allow drag
            enableZoom={!lockView} // Disable zoom when locked to avoid messing up precision
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.8}
            minDistance={1.2}
            maxDistance={22}
            onChange={() => {
              if (!interacted) setInteracted(true);
            }}
          />
        </Canvas>
      </div>
      {!lockView && !hideHelpText && !interacted && (
        <div className="hidden md:block absolute bottom-4 right-4 text-xs text-black/50 dark:text-white/50 pointer-events-none z-20 font-medium animate-fade-out">
            Arrastra para rotar • Rueda para zoom
        </div>
      )}
    </div>
  );
};
