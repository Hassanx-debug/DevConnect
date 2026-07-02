import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
// @ts-ignore
import * as THREE from "three";

// --- Beautiful R3F Node network ---
function ParticleNetwork() {
  const ref = useRef<any>(null);
  
  // Generate half red and half white particles for the "red vs white" story theme
  const [sphere] = useState(() => {
    const arr = new Float32Array(350 * 3);
    for (let i = 0; i < 350; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8;     // X
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8; // Y
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8; // Z
    }
    return arr;
  });

  const [colors] = useState(() => {
    const colorArr = new Float32Array(350 * 3);
    for (let i = 0; i < 350; i++) {
      if (i < 175) {
        colorArr[i * 3] = 0.93;     // R
        colorArr[i * 3 + 1] = 0.16; // G
        colorArr[i * 3 + 2] = 0.16; // B
      } else {
        colorArr[i * 3] = 1.0;     // R
        colorArr[i * 3 + 1] = 1.0; // G
        colorArr[i * 3 + 2] = 1.0; // B
      }
    }
    return colorArr;
  });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.04;
      ref.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} colors={colors} frustumCulled={false}>
        <PointMaterial
          transparent
          vertexColors
          size={0.075}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.85}
        />
      </Points>
    </group>
  );
}

// --- Dynamic Floating Mesh for card icons ---
function FloatingIconMesh({ shapeType = "cube" }: { shapeType?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4;
      meshRef.current.rotation.y += delta * 0.6;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.2;
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={hovered ? 1.4 : 1.1}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      {shapeType === "sphere" ? (
        <sphereGeometry args={[0.7, 32, 32]} />
      ) : shapeType === "torus" ? (
        <torusGeometry args={[0.5, 0.2, 16, 100]} />
      ) : shapeType === "cone" ? (
        <coneGeometry args={[0.6, 1.2, 4]} />
      ) : shapeType === "octahedron" ? (
        <octahedronGeometry args={[0.7]} />
      ) : (
        <boxGeometry args={[0.8, 0.8, 0.8]} />
      )}
      <meshStandardMaterial
        color={hovered ? "#ffffff" : "#ef4444"}
        wireframe
        emissive={hovered ? "#ffffff" : "#991b1b"}
        emissiveIntensity={hovered ? 1.2 : 0.9}
      />
    </mesh>
  );
}

// ==========================================
// RENDERERS WITH OPTIMIZED CSS/SVG FALLBACKS
// ==========================================

export function HeroScene() {
  const [hasError, setHasError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    // Return high-fidelity animated CSS gradient for mobile performance
    return (
      <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#140b0f] to-[#040408]">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 rounded-full bg-red-600/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full bg-white/5 blur-[120px] animate-pulse" />
      </div>
    );
  }

  if (hasError) {
    // Beautiful interactive SVG background in case WebGL fails
    return (
      <div className="absolute inset-0 z-0 opacity-40 bg-grid overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-25 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_80s_linear_infinite]">
            <circle cx="50" cy="50" r="40" stroke="#ef4444" strokeWidth="0.1" fill="none" strokeDasharray="1 3" />
            <circle cx="50" cy="50" r="30" stroke="#ffffff" strokeWidth="0.1" fill="none" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="20" stroke="#b91c1c" strokeWidth="0.1" fill="none" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 bg-[#0a0a0f]/75">
      <div className="absolute inset-0 bg-grid opacity-25" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0a0a0f]/60 to-[#0a0a0f]" />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ pointerEvents: "none" }}
        onError={() => setHasError(true)}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <ParticleNetwork />
      </Canvas>
    </div>
  );
}

export function FeatureIcon3D({ shapeType = "cube" }: { shapeType?: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-16 h-16 rounded-xl border border-violet-500/20 bg-violet-500/5 flex items-center justify-center animate-pulse">
        <div className="w-6 h-6 border border-cyan-400 rotate-45 rounded" />
      </div>
    );
  }

  return (
    <div className="w-16 h-16">
      <Canvas camera={{ position: [0, 0, 2], fov: 50 }} onError={() => setHasError(true)}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[1, 2, 3]} intensity={1.5} />
        <FloatingIconMesh shapeType={shapeType} />
      </Canvas>
    </div>
  );
}
