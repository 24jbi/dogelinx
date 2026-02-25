import React, { useEffect, useMemo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { loadGLBModel, HumanoidController, CharacterAppearance, HealthSystem } from "../R6Rig.js";
import SpawnLocationManager from "../utils/SpawnLocationManager.js";

export default function PlaytestR6Character({ isPlaying }) {
  const { scene, camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const rigRef = useRef(null);
  const humanoidRef = useRef(null);
  const appearanceRef = useRef(null);
  const healthRef = useRef(null);
  const spawnManagerRef = useRef(null);
  const isInitializingRef = useRef(false);
  
  // Camera controls state
  const cameraStateRef = useRef({
    distance: 5,
    minDistance: 2,
    maxDistance: 15,
    pitch: 0.4,
    yaw: 0,
    targetDistance: 5,
  });

  useEffect(() => {
    if (!isPlaying) return;
    
    // Guard: prevent double initialization
    if (rigRef.current || isInitializingRef.current) {
      console.log("⚠️ Character already spawned or initializing, skipping");
      return;
    }
    
    isInitializingRef.current = true;

    const initCharacter = async () => {
      try {
        console.log("🎮 PlaytestR6Character: Starting character creation...");

        // ✅ Load GLB model
        console.log("Loading GLB model...");
        const rig = await loadGLBModel("/dogelinx_r6_rigged.glb");
        console.log("✅ Character model loaded:", rig);
        console.log("   Parts:", Object.keys(rig.parts));
        console.log("   Motors:", rig.motors.length, "joints");

        rig.group.name = "R6Rig";
        scene.add(rig.group);
        console.log("✅ Rig added to scene");

        // Initialize spawn location manager
        spawnManagerRef.current = new SpawnLocationManager(scene);
        const spawnPos = spawnManagerRef.current.getNextSpawnLocation();
        
        // spawn position
        if (rig.parts.Torso) {
          rig.parts.Torso.position.copy(spawnPos);
          console.log(`✅ Character spawned at (${spawnPos.x.toFixed(1)}, ${spawnPos.y.toFixed(1)}, ${spawnPos.z.toFixed(1)})`);
        }

        // ✅ Controllers
        console.log("Creating HumanoidController...");
        const humanoid = new HumanoidController(rig);
        console.log("✅ HumanoidController created");

        console.log("Creating CharacterAppearance...");
        const appearance = new CharacterAppearance(rig);
        console.log("✅ CharacterAppearance created, preset:", appearance.presetName);

        // Load and equip items from localStorage
        try {
          const savedEquipped = JSON.parse(localStorage.getItem("dogelinx_equipped_items") || "[]");
          if (Array.isArray(savedEquipped) && savedEquipped.length > 0) {
            console.log("Loading equipped items from localStorage:", savedEquipped);
            savedEquipped.forEach((item, idx) => {
              appearance.equipItem(`playtest_item_${idx}`, item);
            });
            console.log("✅ Equipped items loaded:", savedEquipped.length);
          }
        } catch (err) {
          console.warn("Could not load equipped items:", err);
        }

        console.log("Creating HealthSystem...");
        const health = new HealthSystem(humanoid, 100);
        console.log("✅ HealthSystem created");

        // ✅ Set globals so your UI works
        window.__r6Rig = rig;
        window.__humanoid = humanoid;
        window.__characterAppearance = appearance;
        window.__healthSystem = health;
        console.log("✅ Globals set");

        rigRef.current = rig;
        humanoidRef.current = humanoid;
        appearanceRef.current = appearance;
        healthRef.current = health;

        // Reset humanoid state before gameplay
        humanoid.reset();

        console.log("✅ PlaytestR6Character: Setup complete!");
      } catch (err) {
        console.error("❌ PlaytestR6Character error:", err);
        console.error(err.stack);
      }
    };

    initCharacter();

    return () => {
      console.log("🧹 PlaytestR6Character: Cleanup");
      const humanoid = humanoidRef.current;
      const rig = rigRef.current;
      if (humanoid) humanoid.dispose?.();
      if (rig && scene) scene.remove(rig.group);

      if (window.__r6Rig === rig) delete window.__r6Rig;
      if (window.__humanoid === humanoid) delete window.__humanoid;
      if (window.__characterAppearance === appearanceRef.current) delete window.__characterAppearance;
      if (window.__healthSystem === healthRef.current) delete window.__healthSystem;
      
      // Reset refs
      rigRef.current = null;
      humanoidRef.current = null;
      appearanceRef.current = null;
      healthRef.current = null;
      isInitializingRef.current = false;
    };
  }, [isPlaying, scene]);

  // Mouse wheel zoom
  useEffect(() => {
    if (!isPlaying) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      const zoomSpeed = 0.5;
      cameraStateRef.current.targetDistance = Math.max(
        cameraStateRef.current.minDistance,
        Math.min(
          cameraStateRef.current.maxDistance,
          cameraStateRef.current.targetDistance + direction * zoomSpeed
        )
      );
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isPlaying]);

  // Right-click drag for camera rotation (Studio-like)
  useEffect(() => {
    if (!isPlaying) return;

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseDown = (e) => {
      if (e.button === 2) { // Right mouse button
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const state = cameraStateRef.current;
      if (!state) return;
      
      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      
      // Update yaw and pitch based on mouse movement
      state.yaw += (deltaX / window.innerWidth) * Math.PI * 1.2; // Horizontal rotation
      state.pitch += (deltaY / window.innerHeight) * Math.PI * 0.6; // Vertical rotation
      
      // Clamp pitch to avoid flipping camera
      state.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 2, state.pitch));
      
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handleMouseUp = (e) => {
      if (e.button === 2) {
        isDragging = false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault(); // Prevent right-click context menu
    };

    // Attach to document for global event capture
    document.addEventListener("mousedown", handleMouseDown, false);
    document.addEventListener("mousemove", handleMouseMove, false);
    document.addEventListener("mouseup", handleMouseUp, false);
    document.addEventListener("contextmenu", handleContextMenu, false);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, false);
      document.removeEventListener("mousemove", handleMouseMove, false);
      document.removeEventListener("mouseup", handleMouseUp, false);
      document.removeEventListener("contextmenu", handleContextMenu, false);
    };
  }, [isPlaying]);

  useFrame((state, dt) => {
    if (!isPlaying) return;
    const humanoid = humanoidRef.current;
    const rig = rigRef.current;
    if (!humanoid || !rig) return;

    try {
      // 🎥 Camera system - follow character head with smooth zoom and rotation
      const camState = cameraStateRef.current;
      
      // Smooth distance transition
      camState.distance += (camState.targetDistance - camState.distance) * 0.1;
      
      // ✅ MUST sync rotation BEFORE humanoid.update so movement is in correct direction
      if (rig.parts.Torso) {
        rig.parts.Torso.rotation.y = camState.yaw;
      }

      // NOW update humanoid with correct rotation
      humanoid.update(dt, raycaster, scene);
      
      if (rig.parts.Head) {
        // Get world position of head
        const headWorldPos = new THREE.Vector3();
        rig.parts.Head.getWorldPosition(headWorldPos);
        
        // Add offset above head for better view
        const targetPos = new THREE.Vector3(
          headWorldPos.x,
          headWorldPos.y + 0.5,
          headWorldPos.z
        );
        
        // Calculate camera position based on yaw, pitch, and distance
        const cosYaw = Math.cos(camState.yaw);
        const sinYaw = Math.sin(camState.yaw);
        const cosPitch = Math.cos(camState.pitch);
        const sinPitch = Math.sin(camState.pitch);
        
        const cameraPos = new THREE.Vector3(
          sinYaw * cosPitch * camState.distance,
          sinPitch * camState.distance,
          cosYaw * cosPitch * camState.distance
        ).add(targetPos);
        
        // Update camera position and rotation
        state.camera.position.copy(cameraPos);
        state.camera.lookAt(targetPos);
      }
    } catch (err) {
      console.error("❌ Error in humanoid.update:", err);
    }
  });

  return null; // this is pure scene logic
}
