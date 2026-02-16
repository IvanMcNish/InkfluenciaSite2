
import React, { useMemo, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useLoader, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Decal, Environment, Center, useTexture, Html, useProgress, Text, Line } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import { TSHIRT_OBJ_URL } from '../constants';
import { TShirtConfig as ConfigType, Position } from '../types';
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
}> = ({ textureUrl, position, zPos, side, showMeasurements, index, lockView, isDraggingRef }) => {
  const texture = useTexture(textureUrl);
  const [hovered, setHovered] = useState(false);
  
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
  
  const renderPriority = 10 + index; 
  const polyOffset = -10 - index; 

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (lockView) {
          e.stopPropagation(); 
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

  return (
    <>
        <Decal 
            position={[finalX, position.y, finalZ]} 
            rotation={rotation} 
            scale={[scaleX, scaleY, 2]} 
            debug={false}
            renderOrder={renderPriority}
            onPointerDown={handlePointerDown}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
        >
        <MeshBasicMaterial 
            map={texture} 
            transparent 
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
                position={[finalX, position.y, finalZ + (side === 'back' ? -0.05 : 0.05)]}
                rotation={rotation}
            />
        )}
    </>
  );
};

interface TShirtMeshProps {
    config: ConfigType;
    showMeasurements?: boolean;
    customBlackColor?: string;
    lockView?: boolean;
    onPositionChange?: (x: number, y: number) => void;
    activeLayerSide: 'front' | 'back';
    isDraggingRef: React.MutableRefObject<boolean>;
}

const TShirtMesh: React.FC<TShirtMeshProps> = ({ config, showMeasurements, customBlackColor, lockView, onPositionChange, activeLayerSide, isDraggingRef }) => {
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

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
      // Logic: If locked AND user has initiated a drag on the decal (isDraggingRef),
      // then dragging anywhere on the mesh updates the position.
      if (!lockView || !onPositionChange || !isDraggingRef.current) return;
      
      e.stopPropagation();
      const point = e.point;
      
      let x = point.x;
      let y = point.y;

      // Invert X for back view logic to match decal coordinate system
      if (activeLayerSide === 'back') {
          x = -x;
      }

      onPositionChange(x, y);
  };

  const handlePointerUp = () => {
      // Releasing mouse anywhere on the mesh stops the drag
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = 'default';
      }
  };

  if (!geometry) return null;

  const materialColor = config.color === 'white' ? '#ffffff' : (customBlackColor || '#050505');
  
  return (
    <Mesh 
        castShadow 
        receiveShadow 
        geometry={geometry} 
        dispose={null}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp} // Safety: stops drag if mouse leaves the shirt mesh
    >
      <MeshStandardMaterial 
        color={materialColor} 
        roughness={0.8}
        metalness={0.1}
      />
      {config.layers.map((layer, index) => (
        <DecalImage 
            key={layer.id} 
            index={index} 
            textureUrl={layer.textureUrl} 
            position={layer.position} 
            side={layer.side || 'front'} 
            zPos={(layer.side === 'back' ? zBack : zFront) + (index * 0.001)} 
            showMeasurements={showMeasurements}
            lockView={!!lockView}
            isDraggingRef={isDraggingRef}
        />
      ))}
    </Mesh>
  );
};

export const Scene: React.FC<SceneProps> = ({ config, captureRef, activeLayerSide = 'front', lockView = false, showMeasurements = false, onPositionChange }) => {
  const controlsRef = useRef<any>(null);
  const isDraggingRef = useRef(false); // Global dragging state for this scene
  const [blackColor, setBlackColor] = useState(DEFAULT_APPEARANCE.blackShirtHex);

  useEffect(() => {
    const loadSettings = async () => {
        const settings = await getAppearanceSettings();
        setBlackColor(settings.blackShirtHex);
    };
    loadSettings();
  }, []);

  const initialCameraPosition: [number, number, number] = useMemo(() => {
      return activeLayerSide === 'back' ? [0, 0, -5.8] : [0, 0, 5.8];
  }, [activeLayerSide]);

  // Handle View Locking and Camera Reset
  useEffect(() => {
    if (controlsRef.current) {
        if (lockView) {
            // Force reset to clear any rotated state
            controlsRef.current.reset();

            // Set precise geometric position based on side
            const zPos = activeLayerSide === 'back' ? -5.8 : 5.8;
            
            // Manually set camera matrix
            const camera = controlsRef.current.object;
            camera.position.set(0, 0, zPos);
            camera.lookAt(0, 0, 0);
            
            // Lock controls strictly
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
        } else {
            // Unlock does not auto-rotate, just enables interaction
            // No action needed, OrbitControls prop enableRotate={true} handles it
        }
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
        // Global pointer up listener on canvas to catch releases outside the mesh
        onPointerUp={() => { isDraggingRef.current = false; document.body.style.cursor = 'default'; }}
      >
        <AmbientLight intensity={0.5} />
        <SpotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow />
        <SpotLight position={[-10, 5, 10]} intensity={0.5} />
        <SpotLight position={[0, 5, -10]} intensity={0.5} />
        
        {captureRef && <SnapshotHandler captureRef={captureRef} controlsRef={controlsRef} />}

        <Suspense fallback={<Loader />}>
            <Center>
                <TShirtMesh 
                    config={config} 
                    showMeasurements={showMeasurements} 
                    customBlackColor={blackColor} 
                    lockView={lockView}
                    onPositionChange={onPositionChange}
                    activeLayerSide={activeLayerSide}
                    isDraggingRef={isDraggingRef}
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
          minDistance={3}
          maxDistance={9}
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
