import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStudio } from "../store.js";
import { useUI } from "../uiStore.js";

// Focus on all objects
function focusOnObjects(scene, camera) {
  const targets = scene.children.filter((c) => c instanceof THREE.Object3D);
  if (!targets.length) return;

  const box = new THREE.Box3();
  for (const obj of targets) box.expandByObject(obj);
  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const distance = Math.max(size.x, size.y, size.z) * 1.5 + 5;

  const dir = new THREE.Vector3().subVectors(camera.position, center).normalize();
  if (dir.lengthSq() === 0) dir.set(1, 1, 1).normalize();

  camera.position.copy(center.clone().add(dir.multiplyScalar(distance)));
  camera.lookAt(center);
}

// Focus on selected (rough bounds)
function focusOnSelected(camera, selectedIds, objects) {
  if (!selectedIds.length) return;

  const byId = new Map(objects.map((o) => [o.id, o]));
  const box = new THREE.Box3();

  for (const id of selectedIds) {
    const obj = byId.get(id);
    if (!obj?.position || !obj?.scale) continue;

    const pos = new THREE.Vector3(...obj.position);
    const scl = new THREE.Vector3(...obj.scale);
    const ext = new THREE.Vector3(0.5 * scl.x, 0.5 * scl.y, 0.5 * scl.z);

    box.expandByPoint(pos.clone().add(ext));
    box.expandByPoint(pos.clone().sub(ext));
  }

  if (box.isEmpty()) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const distance = Math.max(size.x, size.y, size.z) * 1.2 + 3;

  const dir = new THREE.Vector3().subVectors(camera.position, center).normalize();
  if (dir.lengthSq() === 0) dir.set(1, 1, 1).normalize();

  camera.position.copy(center.clone().add(dir.multiplyScalar(distance)));
  camera.lookAt(center);
}

/**
 * Roblox-ish fly cam:
 * - Hold RMB: look + WASD move
 * - Q/E down/up, Shift faster
 * - Wheel dolly
 * - W/E/R switch gizmo mode ONLY when NOT holding RMB
 * - F focuses selection (Shift+F frames all) ONLY when NOT holding RMB
 */
export default function StudioCameraControls({
  enabled = true,
  baseSpeed = 10,
  boost = 3,
  lookSpeed = 0.002,
}) {
  const { camera, gl, scene } = useThree();
  const objects = useStudio((s) => s.objects);
  const selectedIds = useStudio((s) => s.selectedIds);

  const rmbDown = useRef(false);
  const keys = useRef({ w:false,a:false,s:false,d:false,q:false,e:false,shift:false });

  const yaw = useRef(0);
  const pitch = useRef(0);

  const isTyping = () => {
    const el = document.activeElement;
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  };

  useEffect(() => {
    const eul = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
    pitch.current = eul.x;
    yaw.current = eul.y;
  }, [camera]);

  useEffect(() => {
    const dom = gl.domElement;

    const onContextMenu = (e) => e.preventDefault();

    const onMouseDown = (e) => {
      if (!enabled) return;
      if (e.button === 2) {
        rmbDown.current = true;
        dom.style.cursor = "none";
        // Request pointer lock for mouse lock
        if (dom.requestPointerLock) {
          dom.requestPointerLock();
        }
        e.preventDefault();
      }
    };

    const onMouseUp = (e) => {
      if (e.button === 2) {
        rmbDown.current = false;
        dom.style.cursor = "default";
        // Exit pointer lock
        if (document.pointerLockElement && document.exitPointerLock) {
          document.exitPointerLock();
        }
      }
    };

    const onMouseMove = (e) => {
      if (!enabled) return;
      if (!rmbDown.current) return;

      yaw.current -= e.movementX * lookSpeed;
      pitch.current -= e.movementY * lookSpeed;

      const limit = Math.PI / 2 - 0.01;
      pitch.current = Math.max(-limit, Math.min(limit, pitch.current));
    };

    const onWheel = (e) => {
      if (!enabled) return;
      e.preventDefault();
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      // Scroll up = deltaY negative = move forward (zoom in)
      // Scroll down = deltaY positive = move backward (zoom out)
      const amt = -Math.sign(e.deltaY) * 2.0;
      camera.position.add(dir.multiplyScalar(amt));
    };

    const onKeyDown = (e) => {
      if (!enabled || isTyping()) return;
      const k = e.key.toLowerCase();

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && k === "z" && !e.shiftKey) {
        e.preventDefault();
        useStudio.getState().undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (k === "y" || (k === "z" && e.shiftKey))) {
        e.preventDefault();
        useStudio.getState().redo();
        return;
      }

      // Tool shortcuts ONLY if NOT RMB camera mode
      if (!rmbDown.current) {
        if (k === "w") { e.preventDefault(); useStudio.getState().setTransformMode("translate"); return; }
        if (k === "e") { e.preventDefault(); useStudio.getState().setTransformMode("rotate"); return; }
        if (k === "r") { e.preventDefault(); useStudio.getState().setTransformMode("scale"); return; }

        if (k === "f") {
          e.preventDefault();
          if (e.shiftKey) focusOnObjects(scene, camera);
          else focusOnSelected(camera, selectedIds, objects);
          return;
        }

        if (k === "g") {
          e.preventDefault();
          const isGridVisible = useUI.getState().gridVisible;
          useUI.getState().setGridVisible(!isGridVisible);
          return;
        }
      }

      // Camera keys (used only while RMB is held; we still track them here)
      if (k === "w") keys.current.w = true;
      if (k === "a") keys.current.a = true;
      if (k === "s") keys.current.s = true;
      if (k === "d") keys.current.d = true;
      if (k === "q") keys.current.q = true;
      if (k === "e") keys.current.e = true;
      if (k === "shift") keys.current.shift = true;
    };

    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === "w") keys.current.w = false;
      if (k === "a") keys.current.a = false;
      if (k === "s") keys.current.s = false;
      if (k === "d") keys.current.d = false;
      if (k === "q") keys.current.q = false;
      if (k === "e") keys.current.e = false;
      if (k === "shift") keys.current.shift = false;
    };

    dom.addEventListener("contextmenu", onContextMenu);
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    dom.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      dom.removeEventListener("contextmenu", onContextMenu);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      dom.style.cursor = "default";
    };
  }, [camera, enabled, gl, lookSpeed, objects, scene, selectedIds]);

  useFrame((_, dt) => {
    if (!enabled) return;
    if (!rmbDown.current) return;

    camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, "YXZ"));

    const v = new THREE.Vector3(
      (keys.current.d ? 1 : 0) - (keys.current.a ? 1 : 0),
      (keys.current.e ? 1 : 0) - (keys.current.q ? 1 : 0),
      (keys.current.s ? 1 : 0) - (keys.current.w ? 1 : 0)
    );

    if (v.lengthSq() === 0) return;
    v.normalize();

    const speed = baseSpeed * (keys.current.shift ? boost : 1) * dt;
    v.applyQuaternion(camera.quaternion);
    camera.position.add(v.multiplyScalar(speed));
  });

  return null;
}
