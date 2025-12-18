import React, { useMemo, Suspense, useEffect, useRef } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Decal, Environment, Center, useTexture, Html, useProgress } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import { TSHIRT_OBJ_URL } from '../constants';
import { TShirtConfig as ConfigType, Position } from '../types';

interface SceneProps {
  config: ConfigType;
  captureRef?: React.MutableRefObject<(() => string) | null>;
}

function Loader() {
  const { progress } = useProgress();
  return <Html center><div className="text-gray-500 font-mono text-sm">{progress.toFixed(0)}%</div></Html>;
}

// Component to handle canvas snapshot
const SnapshotHandler = ({ 
  captureRef, 
  controlsRef 
}: { 
  captureRef: React.MutableRefObject<(() => string) | null>;
  controlsRef: React.MutableRefObject<any>;
}) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if (captureRef) {
      captureRef.current = () => {
        // Reset controls to initial position (Front view)
        if (controlsRef.current) {
          controlsRef.current.reset();
        }
        
        // Ensure camera matrix is updated
        camera.updateMatrixWorld();

        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      };
    }
  }, [gl, scene, camera, captureRef, controlsRef]);

  return null;
};

// Separate component for the decal
const DecalImage: React.FC<{ textureUrl: string; position: Position; zPos: number }> = ({ textureUrl, position, zPos }) => {
  const texture = useTexture(textureUrl);
  
  // Calculate aspect ratio to prevent distortion
  // Cast to any or HTMLImageElement because texture.image might be typed as unknown in some three versions
  const img = texture.image as HTMLImageElement;
  const ratio = img ? img.width / img.height : 1;
  
  // Determine scale based on aspect ratio while respecting the user's scale setting as the max dimension
  let scaleX = position.scale;
  let scaleY = position.scale;

  if (ratio > 1) {
    // Landscape image: Width is max (scale), Height is reduced
    scaleY = position.scale / ratio;
  } else {
    // Portrait image: Height is max (scale), Width is reduced
    scaleX = position.scale * ratio;
  }
  
  return (
    <Decal 
      position={[position.x, position.y, zPos]} 
      rotation={[0, 0, 0]} // Rotated 180 degrees to fix inverted image
      scale={[scaleX, scaleY, 1]} 
      debug={false}
    >
      <meshBasicMaterial 
        map={texture} 
        transparent 
        polygonOffset 
        polygonOffsetFactor={-4}
        depthTest={true}
      />
    </Decal>
  );
};

const TShirtMesh: React.FC<{ config: ConfigType }> = ({ config }) => {
  const obj = useLoader(OBJLoader, TSHIRT_OBJ_URL);
  
  // Process geometry: clone, center, normalize size
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
      {config.textureUrl && (
        <DecalImage 
            key={config.textureUrl} 
            textureUrl={config.textureUrl} 
            position={config.position} 
            zPos={zFront}
        />
      )}
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
        gl={{ preserveDrawingBuffer: true }} // Important for taking snapshots
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