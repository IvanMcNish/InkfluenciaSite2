
import React, { useMemo, Suspense, useEffect, useRef } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Decal, Environment, Center, useTexture, Html, useProgress, Text, Line } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import { TSHIRT_OBJ_URL } from '../constants';
import { TShirtConfig as ConfigType, Position } from '../types';

// Conversion factor: 1 Three.js unit ~= 50 cm of physical width (Approximation for T-shirt scaling)
const UNIT_TO_CM = 50;

interface SceneProps {
  config: ConfigType;
  captureRef?: React.MutableRefObject<(() => string) | null>;
  activeLayerSide?: 'front' | 'back'; 
  lockView?: boolean; 
  showMeasurements?: boolean; // New prop for toggling rulers
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
        
        camera.updateMatrixWorld();
        gl.render(scene, camera);

        try {
            const screenshotCanvas = document.createElement('canvas');
            const targetWidth = 500; 
            const aspect = gl.domElement.width / gl.domElement.height;
            const targetHeight = targetWidth / aspect;

            screenshotCanvas.width = targetWidth;
            screenshotCanvas.height = targetHeight;
            
            const ctx = screenshotCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(gl.domElement, 0, 0, targetWidth, targetHeight);
                return screenshotCanvas.toDataURL('image/webp', 0.7);
            }
        } catch (e) {
            console.warn("Snapshot optimization failed", e);
        }

        return gl.domElement.toDataURL('image/jpeg', 0.5);
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
                object.material.forEach(m => m.dispose());
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
    
    // Bright pink color for visibility
    const color = "#ec4899"; 
    
    return (
        <group position={position} rotation={rotation}>
             {/* Horizontal Line (Bottom) */}
            <group position={[0, -height/2 - margin, 0]}>
                {/* Main horizontal line */}
                <Line points={[[-width/2, 0, 0], [width/2, 0, 0]]} color={color} lineWidth={1.5} />
                {/* Ticks */}
                <Line points={[[-width/2, 0.02, 0], [-width/2, -0.02, 0]]} color={color} lineWidth={1.5} />
                <Line points={[[width/2, 0.02, 0], [width/2, -0.02, 0]]} color={color} lineWidth={1.5} />
                {/* Text Label */}
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
            </group>

            {/* Vertical Line (Right side) */}
            <group position={[width/2 + margin, 0, 0]}>
                {/* Main vertical line */}
                <Line points={[[0, -height/2, 0], [0, height/2, 0]]} color={color} lineWidth={1.5} />
                {/* Ticks */}
                <Line points={[[-0.02, -height/2, 0], [0.02, -height/2, 0]]} color={color} lineWidth={1.5} /> 
                <Line points={[[-0.02, height/2, 0], [0.02, height/2, 0]]} color={color} lineWidth={1.5} />
                {/* Text Label (Rotated) */}
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
            </group>
        </group>
    );
};

const DecalImage: React.FC<{ textureUrl: string; position: Position; zPos: number; side: 'front' | 'back'; showMeasurements?: boolean; index: number }> = ({ textureUrl, position, zPos, side, showMeasurements, index }) => {
  const texture = useTexture(textureUrl);
  
  useEffect(() => {
    return () => {
        texture.dispose();
    };
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

  const finalZ = side === 'back' ? -zPos : zPos;
  const rotation: [number, number, number] = side === 'back' ? [0, Math.PI, 0] : [0, 0, 0];
  const finalX = side === 'back' ? -position.x : position.x;
  
  // Priority Logic:
  // renderOrder: Forces Three.js to sort these objects. Higher number = drawn last (on top).
  // polygonOffsetFactor: pushes the depth. More negative = visually closer to camera (on top).
  const renderPriority = 10 + index; 
  const polyOffset = -10 - index; 

  return (
    <>
        <Decal 
        position={[finalX, position.y, finalZ]} 
        rotation={rotation} 
        scale={[scaleX, scaleY, 2]} 
        debug={false}
        renderOrder={renderPriority} // Fix for stacking order
        >
        <meshBasicMaterial 
            map={texture} 
            transparent 
            polygonOffset 
            polygonOffsetFactor={polyOffset} // Fix for z-fighting
            depthTest={true}
            depthWrite={false}
        />
        </Decal>
        
        {showMeasurements && (
            <MeasurementGuides 
                width={scaleX}
                height={scaleY}
                // Float slightly above the decal (z + 0.05) to ensure visibility over the shirt
                position={[finalX, position.y, finalZ + (side === 'back' ? -0.05 : 0.05)]}
                rotation={rotation}
            />
        )}
    </>
  );
};

const TShirtMesh: React.FC<{ config: ConfigType; showMeasurements?: boolean }> = ({ config, showMeasurements }) => {
  const obj = useLoader(OBJLoader, TSHIRT_OBJ_URL);
  
  const { geometry, zFront, zBack } = useMemo(() => {
    let foundGeom: THREE.BufferGeometry | null = null;
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !foundGeom) {
        foundGeom = (child as THREE.Mesh).geometry;
      }
    });

    if (!foundGeom) return { geometry: null, zFront: 0, zBack: 0 };

    const geo = foundGeom.clone();
    geo.center(); 
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 4 / maxDim;
    geo.scale(scaleFactor, scaleFactor, scaleFactor);
    
    geo.computeBoundingBox();
    const zFront = geo.boundingBox!.max.z;
    const zBack = Math.abs(geo.boundingBox!.min.z);

    return { geometry: geo, zFront, zBack };
  }, [obj]);

  if (!geometry) return null;

  const materialColor = config.color === 'white' ? '#ffffff' : '#1a1a1a';
  
  return (
    <mesh castShadow receiveShadow geometry={geometry} dispose={null}>
      <meshStandardMaterial 
        color={materialColor} 
        roughness={0.8}
        metalness={0.1}
      />
      {config.layers.map((layer, index) => (
        <DecalImage 
            key={layer.id} 
            index={index} // Pass index for priority handling
            textureUrl={layer.textureUrl} 
            position={layer.position} 
            side={layer.side || 'front'} 
            zPos={(layer.side === 'back' ? zBack : zFront) + (index * 0.001)} // Still keep physical offset for safety
            showMeasurements={showMeasurements}
        />
      ))}
    </mesh>
  );
};

export const Scene: React.FC<SceneProps> = ({ config, captureRef, activeLayerSide = 'front', lockView = false, showMeasurements = false }) => {
  const controlsRef = useRef<any>(null);

  // Adjusted Distance: 5.8 to balance view between full shirt visibility and closeness
  const initialCameraPosition: [number, number, number] = activeLayerSide === 'back' ? [0, 0, -5.8] : [0, 0, 5.8];

  useEffect(() => {
    if (controlsRef.current && !lockView) {
        const targetAzimuth = activeLayerSide === 'front' ? 0 : Math.PI;
        controlsRef.current.setAzimuthalAngle(targetAzimuth);
        controlsRef.current.update();
    }
  }, [activeLayerSide, lockView]);

  return (
    <div className="w-full h-full min-h-[250px] md:min-h-[400px] relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-inner">
      <Canvas 
        shadows 
        camera={{ position: initialCameraPosition, fov: 35 }}
        gl={{ 
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            antialias: true
        }} 
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow />
        <spotLight position={[-10, 5, 10]} intensity={0.5} />
        <spotLight position={[0, 5, -10]} intensity={0.5} />
        
        {captureRef && <SnapshotHandler captureRef={captureRef} controlsRef={controlsRef} />}

        <Suspense fallback={<Loader />}>
            <Center>
                <TShirtMesh config={config} showMeasurements={showMeasurements} />
            </Center>
            <Environment preset="city" />
        </Suspense>
        <OrbitControls 
          ref={controlsRef}
          enablePan={false} 
          enableRotate={!lockView}
          enableZoom={!lockView}
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.8}
          minDistance={3}
          maxDistance={9} // Increased max distance to allow zooming out more
        />
      </Canvas>
      {!lockView && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-400 pointer-events-none">
            Arrastra para rotar • Rueda para zoom
        </div>
      )}
    </div>
  );
};
