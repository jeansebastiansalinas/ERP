'use client';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

/* ===================== */
/* 🌐 ESFERA WIREFRAME MEJORADA */
/* ===================== */
function WireGlobe({
  radius,
  speed,
  opacity,
}: {
  radius: number;
  speed: number;
  opacity: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null!);
  
  useFrame(({ clock }) => {
    ref.current.rotation.y += speed;
    ref.current.rotation.x += speed * 0.3;
    
    const pulse = Math.sin(clock.getElapsedTime() * 0.5) * 0.1 + 0.9;
    if (materialRef.current) {
      materialRef.current.opacity = opacity * pulse;
    }
  });
  
  return (
    <mesh ref={ref} position={[-2, 0, 0]}> {/* ⬅️ MOVIDA A LA IZQUIERDA */}
      <sphereGeometry args={[radius, 32, 32]} />
      <meshBasicMaterial
        ref={materialRef}
        wireframe
        color="#ff2a2a"
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

/* ===================== */
/* 🌌 CAMPO DE ESTRELLAS DINÁMICO */
/* ===================== */
function StarField() {
  const starsRef = useRef<THREE.Points>(null!);
  
  const { positions, colors, sizes } = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const radius = 8 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const intensity = 0.5 + Math.random() * 0.5;
      colors[i * 3] = intensity;
      colors[i * 3 + 1] = intensity * 0.3;
      colors[i * 3 + 2] = intensity * 0.3;
      
      sizes[i] = Math.random() * 2;
    }
    
    return { positions, colors, sizes };
  }, []);
  
  useFrame(({ clock }) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });
  
  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ===================== */
/* 💫 PARTÍCULAS DE ENERGÍA AVANZADAS */
/* ===================== */
function EnergyParticles() {
  const particlesRef = useRef<THREE.Points>(null!);
  const velocities = useRef<Float32Array>(null!);
  
  const { positions, colors } = useMemo(() => {
    const count = 150;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const distance = 1.2 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = distance * Math.sin(phi) * Math.cos(theta) - 2; // ⬅️ -2 en X
      positions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = distance * Math.cos(phi);
      
      vels[i * 3] = (Math.random() - 0.5) * 0.01;
      vels[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.2;
    }
    
    velocities.current = vels;
    return { positions, colors };
  }, []);
  
  useFrame(() => {
    if (particlesRef.current && velocities.current) {
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += velocities.current[i];
        pos[i + 1] += velocities.current[i + 1];
        pos[i + 2] += velocities.current[i + 2];
        
        const distance = Math.sqrt((pos[i] + 2) ** 2 + pos[i + 1] ** 2 + pos[i + 2] ** 2);
        
        if (distance > 4 || distance < 1) {
          velocities.current[i] *= -1;
          velocities.current[i + 1] *= -1;
          velocities.current[i + 2] *= -1;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ===================== */
/* 🎯 ANILLOS ORBITALES MÚLTIPLES */
/* ===================== */
function AdvancedOrbitalRings() {
  const rings = useMemo(() => 
    Array.from({ length: 5 }, (_, i) => ({
      radius: 1.6 + i * 0.25,
      thickness: 0.008 - i * 0.001,
      speed: 0.1 + i * 0.03,
      axis: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize(),
    }))
  , []);
  
  const ringsRef = useRef<THREE.Group>(null!);
  
  useFrame(() => {
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        const data = rings[i];
        ring.rotateOnAxis(data.axis, data.speed * 0.01);
      });
    }
  });
  
  return (
    <group ref={ringsRef} position={[-2, 0, 0]}> {/* ⬅️ MOVIDO A LA IZQUIERDA */}
      {rings.map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 4, 0, Math.PI / 6]}>
          <torusGeometry args={[ring.radius, ring.thickness, 16, 100]} />
          <meshBasicMaterial
            color="#ff3333"
            transparent
            opacity={0.4 - i * 0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ===================== */
/* 🌊 ONDAS DE ENERGÍA EXPANSIVAS */
/* ===================== */
function EnergyWaves() {
  const wavesRef = useRef<THREE.Group>(null!);
  const [waves] = useState(() => 
    Array.from({ length: 3 }, (_, i) => ({
      startTime: -i * 2,
      speed: 1.5,
      maxScale: 3,
    }))
  );
  
  return (
    <group ref={wavesRef} position={[-2, 0, 0]}> {/* ⬅️ MOVIDO A LA IZQUIERDA */}
      {waves.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#ff2a2a"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
}

/* ===================== */
/* 📊 DATA NODES INTELIGENTES */
/* ===================== */
function IntelligentDataNodes() {
  const groupRef = useRef<THREE.Group>(null!);
  const nodes = useMemo(() => 
    Array.from({ length: 16 }, (_, i) => ({
      angle: (i / 16) * Math.PI * 2,
      radius: 2.8,
      height: Math.random() * 0.5,
      speed: 0.08 + Math.random() * 0.06,
      offset: Math.random() * Math.PI * 2,
      size: 0.06 + Math.random() * 0.04,
    }))
  , []);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((node, i) => {
        const data = nodes[i];
        const time = clock.getElapsedTime();
        const angle = data.angle + time * data.speed + data.offset;
        
        node.position.x = Math.cos(angle) * data.radius - 2; // ⬅️ -2 en X
        node.position.y = Math.sin(angle) * data.radius + Math.sin(time * 2 + i) * data.height;
        node.position.z = Math.sin(time * 0.5 + i) * 0.4;
        
        const scale = 1 + Math.sin(time * 3 + i) * 0.3;
        node.scale.set(scale, scale, scale);
        
        node.rotation.x += 0.01;
        node.rotation.y += 0.015;
      });
    }
  });
  
  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[node.size, 0]} />
          <meshBasicMaterial
            color="#ff3333"
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ===================== */
/* 🌐 RED NEURAL DINÁMICA */
/* ===================== */
function NeuralNetwork() {
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const groupRef = useRef<THREE.Group>(null!);
  
  const networkNodes = useMemo(() => 
    Array.from({ length: 20 }, () => ({
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 3,
      vx: (Math.random() - 0.5) * 0.015,
      vy: (Math.random() - 0.5) * 0.015,
      vz: (Math.random() - 0.5) * 0.01,
    }))
  , []);
  
  useFrame(() => {
    networkNodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;
      node.z += node.vz;
      
      if (Math.abs(node.x) > 3) node.vx *= -1;
      if (Math.abs(node.y) > 3) node.vy *= -1;
      if (Math.abs(node.z) > 2) node.vz *= -1;
    });
    
    const points: THREE.Vector3[] = [];
    
    for (let i = 0; i < networkNodes.length; i++) {
      for (let j = i + 1; j < networkNodes.length; j++) {
        const node1 = networkNodes[i];
        const node2 = networkNodes[j];
        
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const dz = node2.z - node1.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < 1.8) {
          points.push(new THREE.Vector3(node1.x, node1.y, node1.z));
          points.push(new THREE.Vector3(node2.x, node2.y, node2.z));
        }
      }
    }
    
    if (points.length > 0 && linesRef.current) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      linesRef.current.geometry.dispose();
      linesRef.current.geometry = geometry;
    }
  });
  
  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: 0xff2a2a,
      transparent: true,
      opacity: 0.15,
    });
    
    linesRef.current = new THREE.LineSegments(geometry, material);
    groupRef.current.add(linesRef.current);
    
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, []);
  
  return <group ref={groupRef} />;
}

/* ===================== */
/* 🛡️ SHAPE DEL ESCUDO   */
/* ===================== */
function useShieldShape() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.6, 0.75);
    s.lineTo(0.6, 0.75);
    s.lineTo(0.6, -0.15);
    s.quadraticCurveTo(0, -1.0, -0.6, -0.15);
    s.closePath();
    return s;
  }, []);
}

/* ===================== */
/* 🚚 IMAGEN DEL CAMIÓN ULTRA MEJORADA */
/* ===================== */
function TruckImageOverlay() {
  const { gl, camera } = useThree();
  const truckSceneRef = useRef<THREE.Scene>(null!);
  const glowMaterialsRef = useRef<THREE.MeshBasicMaterial[]>([]);
  
  const texture = useLoader(THREE.TextureLoader, '/truck-icon.png');
  
  useEffect(() => {
    const truckScene = new THREE.Scene();
    truckSceneRef.current = truckScene;
    
    const truckGroup = new THREE.Group();
    truckGroup.position.set(-1.5, 0.02, 1.5); // ⬅️ CAMBIO: Z = 1.5 (MÁS ADELANTE, hacia la cámara)
    truckGroup.scale.set(0.12, 0.12, 0.12);
    
    const glowLayers = [
      { radius: 0.75, opacity: 0.15 },
      { radius: 0.6, opacity: 0.25 },
      { radius: 0.44, opacity: 0.35 },
      { radius: 0.32, opacity: 0.45 },
    ];
    
    glowLayers.forEach((layer, i) => {
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.DoubleSide
      });
      
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(layer.radius, 32),
        glowMaterial
      );
      glow.position.set(0, 0, -0.06 + i * 0.01);
      truckGroup.add(glow);
      glowMaterialsRef.current.push(glowMaterial);
    });
    
    const truckImage = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
      })
    );
    truckImage.position.set(0, 0, 0);
    truckGroup.add(truckImage);
    
    truckScene.add(truckGroup);
    
    return () => {
      truckGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      texture.dispose();
    };
  }, [texture]);
  
  useFrame(({ clock }) => {
    if (truckSceneRef.current && camera) {
      const time = clock.getElapsedTime();
      const pulse = Math.sin(time * 1.5) * 0.2 + 0.8;
      
      glowMaterialsRef.current.forEach((material, i) => {
        const baseOpacity = [0.15, 0.25, 0.35, 0.45][i];
        material.opacity = baseOpacity * pulse;
      });
      
      gl.autoClear = false;
      gl.render(truckSceneRef.current, camera);
      gl.autoClear = true;
    }
  }, 1);
  
  return null;
}

/* ===================== */
/* 🛡️ LOGO MEJORADO CON ANIMACIÓN */
/* ===================== */
function ShieldLogo() {
  const shape = useShieldShape();
  const groupRef = useRef<THREE.Group>(null!);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const pulse = Math.sin(clock.getElapsedTime() * 2) * 0.02 + 1;
      groupRef.current.scale.set(0.20 * pulse, 0.20 * pulse, 0.20 * pulse);
    }
  });
  
  return (
    <group ref={groupRef} scale={0.20} position={[-2.15, 0, 0]}> {/* ⬅️ MOVIDO A LA IZQUIERDA */}
      <mesh position={[0, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={6}
          roughness={0}
          metalness={0}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial
          color="#ff2a2a"
          wireframe
        />
      </mesh>
    </group>
  );
}

/* ===================== */
/* 🚀 ESCENA FINAL */
/* ===================== */
export default function FuturisticGlobe() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ background: '#000000' }}
      gl={{ 
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      <color attach="background" args={['#000000']} />
      
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={2.5} color="#ff3333" />
      <pointLight position={[-5, -5, 5]} intensity={1.5} color="#ff4444" />
      <pointLight position={[0, 0, -5]} intensity={1} color="#ff2a2a" />
      
      <StarField />
      <EnergyWaves />
      <NeuralNetwork />
      <EnergyParticles />
      <AdvancedOrbitalRings />
      <IntelligentDataNodes />
      
      <ShieldLogo />
      <WireGlobe radius={1.0} speed={0.004} opacity={0.95} />
      
      <EffectComposer>
        <Bloom
          intensity={2.5}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
      
      <TruckImageOverlay />
    </Canvas>
  );
}