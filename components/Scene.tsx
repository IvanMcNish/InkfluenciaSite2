import React, { useMemo, Suspense, useEffect, useRef } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Decal, Environment, Center, useTexture, Html, useProgress } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import { TSHIRT_OBJ_URL } from '../constants';
import { TShirtConfig as ConfigType, Position } from '../types';

// Add type definitions for R3F elements to satisfy TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      ambientLight: any;
      spotLight: any;
    }
  }
}

interface SceneProps {
  config: ConfigType;
  captureRef?: React.MutableRefObject<(() => string) | null>;
}

function Loader() {
  const { progress } = useProgress();
  return <Html center><div className="text-gray-500 font-mono text-sm">{progress.toFixed(0)}%</div></Html>;
}

// Component to handle canvas snapshot and context cleanup
const SnapshotHandler = ({ 
  captureRef, 
  controlsRef 
}: { 
  captureRef: React.MutableRefObject<(() => string) | null>;
  controlsRef: React.MutableRefObject<any>;
}) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    // Context Lost Handling
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

        // Reset controls to initial position (Front view)
        if (controlsRef.current) {
          controlsRef.current.reset();
        }
        
        // Ensure camera matrix is updated
        camera.updateMatrixWorld();
        
        // Force a render to ensure the scene is ready for capture
        gl.render(scene, camera);

        // Optimize: Create a smaller canvas for the snapshot to avoid huge Base64 strings
        try {
            const screenshotCanvas = document.createElement('canvas');
            // Reduce resolution for snapshots to save memory/storage
            // 500px is enough for gallery cards
            const targetWidth = 500; 
            const aspect = gl.domElement.width / gl.domElement.height;
            const targetHeight = targetWidth / aspect;

            screenshotCanvas.width = targetWidth;
            screenshotCanvas.height = targetHeight;
            
            const ctx = screenshotCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(gl.domElement, 0, 0, targetWidth, targetHeight);
                // Use WebP with moderate compression for thumbnails
                return screenshotCanvas.toDataURL('image/webp', 0.7);
            }
        } catch (e) {
            console.warn("Snapshot optimization failed", e);
        }

        // Fallback
        return gl.domElement.toDataURL('image/jpeg', 0.5);
      };
    }
  }, [gl, scene, camera, captureRef, controlsRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Force cleanup of textures and geometries when component unmounts
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

// Separate component for the decal
const DecalImage: React.FC<{ textureUrl: string; position: Position; zPos: number }> = ({ textureUrl, position, zPos }) => {
  const texture = useTexture(textureUrl);
  
  useEffect(() => {
    return () => {
        texture.dispose();
    };
  }, [texture]);
  
  // Cast to any or HTMLImageElement
  const img = texture.image as HTMLImageElement;
  const ratio = img ? img.width / img.height : 1;
  
  let scaleX = position.scale;
  let scaleY = position.scale;

  if (ratio > 1) {
    scaleY = position.scale / ratio;
  } else {
    scaleX = position.scale * ratio;
  }
  
  return (
    <Decal 
      position={[position.x, position.y, zPos]} 
      rotation={[0, 0, 0]} 
      scale={[scaleX, scaleY, 2]} // Deep Z projection to avoid clipping
      debug={false}
    >
      <meshBasicMaterial 
        map={texture} 
        transparent 
        polygonOffset 
        polygonOffsetFactor={-4}
        depthTest={true}
        depthWrite={false}
      />
    </Decal>
  );
};

const TShirtMesh: React.FC<{ config: ConfigType }> = ({ config }) => {
  const obj = useLoader(OBJLoader, TSHIRT_OBJ_URL);
  
  const { geometry, zFront } = useMemo(() => {
    let foundGeom: THREE.BufferGeometry | null = null;
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !foundGeom) {
        foundGeom = (child as THREE.Mesh).geometry;
      }
    });

    if (!foundGeom) return { geometry: null, zFront: 0 };

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

    return { geometry: geo, zFront };
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
            textureUrl={layer.textureUrl} 
            position={layer.position} 
            // Add a tiny Z offset based on index to handle overlapping properly
            zPos={zFront + (index * 0.001)}
        />
      ))}
    </mesh>
  );
};

export const Scene: React.FC<SceneProps> = ({ config, captureRef }) => {
  const controlsRef = useRef<any>(null);

  return (
    <div className="w-full h-full min-h-[400px] relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-inner">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ 
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            antialias: true
        }} 
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow />
        <spotLight position={[-10, 5, 10]} intensity={0.5} />
        
        {captureRef && <SnapshotHandler captureRef={captureRef} controlsRef={controlsRef} />}

        <Suspense fallback={<Loader />}>
            <Center>
                <TShirtMesh config={config} />
            </Center>
            <Environment preset="city" />
        </Suspense>
        <OrbitControls 
          ref={controlsRef}
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.8}
          minDistance={3}
          maxDistance={8}
        />
      </Canvas>
      <div className="absolute bottom-4 right-4 text-xs text-gray-400 pointer-events-none">
        Arrastra para rotar • Rueda para zoom
      </div>
    </div>
  );
};