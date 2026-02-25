import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export class Motor6D {
  constructor(name, parentPart, childPart, C0, C1) {
    this.name = name;
    this.parent = parentPart;
    this.child = childPart;
    this.C0 = C0.clone();
    this.C1 = C1.clone();
    this.rotation = new THREE.Quaternion();
  }

  apply() {
    this.parent.updateWorldMatrix(true, false);
    this.child.parent?.updateWorldMatrix(true, false);

    const parentWorld = this.parent.matrixWorld;
    const invC1 = this.C1.clone().invert();
    const rotM = new THREE.Matrix4().makeRotationFromQuaternion(this.rotation);

    const childWorld = new THREE.Matrix4()
      .copy(parentWorld)
      .multiply(this.C0)
      .multiply(rotM)
      .multiply(invC1);

    const parentOfChildInv = this.child.parent
      ? this.child.parent.matrixWorld.clone().invert()
      : new THREE.Matrix4().identity();

    const childLocal = new THREE.Matrix4().copy(parentOfChildInv).multiply(childWorld);

    childLocal.decompose(this.child.position, this.child.quaternion, this.child.scale);
  }

  setRotation(quat, damping = 0.1) {
    this.rotation.slerp(quat, damping);
  }
}

export class AnimationController {
  constructor(humanoid) {
    this.humanoid = humanoid;
    this.currentAnimation = "idle";
    this.animationTime = 0;
    this.animationSpeed = 1;
  }

  play(animName, speed = 1) {
    this.currentAnimation = animName;
    this.animationTime = 0;
    this.animationSpeed = speed;
  }

  update(deltaTime) {
    this.animationTime += deltaTime * this.animationSpeed;

    const motors = this.humanoid.motors;
    const anim = this.currentAnimation;

    if (anim === "idle") {
      this._playIdleAnimation(motors);
    } else if (anim === "walk") {
      this._playWalkAnimation(motors);
    } else if (anim === "jump") {
      this._playJumpAnimation(motors);
    }
  }

  _playIdleAnimation(motors) {
    const sway = Math.sin(this.animationTime * 1) * 0.05;
    
    const neck = motors.find(m => m.name === "Neck");
    if (neck) {
      neck.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sway * 0.3, 0)));
    }

    const lShoulder = motors.find(m => m.name === "LeftShoulder");
    const rShoulder = motors.find(m => m.name === "RightShoulder");
    
    if (lShoulder) {
      lShoulder.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        sway * 0.1, 0, -0.1
      )));
    }
    if (rShoulder) {
      rShoulder.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        -sway * 0.1, 0, 0.1
      )));
    }
  }

  _playWalkAnimation(motors) {
    const walkCycle = (this.animationTime * 2) % (Math.PI * 2);
    const armSwing = Math.sin(walkCycle) * 0.5;
    const legSwing = Math.sin(walkCycle + Math.PI) * 0.6;

    const lShoulder = motors.find(m => m.name === "LeftShoulder");
    const rShoulder = motors.find(m => m.name === "RightShoulder");
    const lHip = motors.find(m => m.name === "LeftHip");
    const rHip = motors.find(m => m.name === "RightHip");

    if (lShoulder) {
      lShoulder.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        armSwing, 0, -0.2
      )));
    }
    if (rShoulder) {
      rShoulder.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        -armSwing, 0, 0.2
      )));
    }
    if (lHip) {
      lHip.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        legSwing * 0.8, 0, 0
      )));
    }
    if (rHip) {
      rHip.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        -legSwing * 0.8, 0, 0
      )));
    }
  }

  _playJumpAnimation(motors) {
    const jumpTime = Math.min(this.animationTime, 0.6);
    const jumpProg = jumpTime / 0.6;

    const squat = Math.max(0, Math.sin(jumpProg * Math.PI) * 0.3);

    const lHip = motors.find(m => m.name === "LeftHip");
    const rHip = motors.find(m => m.name === "RightHip");

    if (lHip) {
      lHip.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        -squat, 0, 0
      )));
    }
    if (rHip) {
      rHip.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        -squat, 0, 0
      )));
    }

    const lShoulder = motors.find(m => m.name === "LeftShoulder");
    const rShoulder = motors.find(m => m.name === "RightShoulder");
    const armRaise = Math.sin(jumpProg * Math.PI) * 1.2;

    if (lShoulder) {
      lShoulder.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        armRaise, 0, -0.3
      )));
    }
    if (rShoulder) {
      rShoulder.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(
        armRaise, 0, 0.3
      )));
    }
  }
}

export class HumanoidController {
  constructor(rig, physicsWorld = null) {
    this.rig = rig;
    this.motors = rig.motors;
    this.physicsWorld = physicsWorld;

    this.velocity = new THREE.Vector3(0, 0, 0);
    this.moveSpeed = 16;
    this.jumpPower = 50;

    this.gravity = -9.81 * 1.6;
    this.isGrounded = false;
    this.groundCheckDistance = 2.5;

    this.animator = new AnimationController(this);

    this.inputKeys = { W: false, A: false, S: false, D: false, Space: false };
    this.spaceWasPressed = false;

    // Bind handlers with proper this context
    this._onKeyDown = (e) => {
      if (!e || !e.key) return;
      const key = e.key.toUpperCase();
      if (key === "W") this.inputKeys.W = true;
      if (key === "A") this.inputKeys.A = true;
      if (key === "S") this.inputKeys.S = true;
      if (key === "D") this.inputKeys.D = true;
      if (e.code === "Space") {
        e.preventDefault();
        this.inputKeys.Space = true;
        this.spaceWasPressed = true;
      }
    };

    this._onKeyUp = (e) => {
      if (!e || !e.key) return;
      const key = e.key.toUpperCase();
      if (key === "W") this.inputKeys.W = false;
      if (key === "A") this.inputKeys.A = false;
      if (key === "S") this.inputKeys.S = false;
      if (key === "D") this.inputKeys.D = false;
      if (e.code === "Space") this.inputKeys.Space = false;
    };

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  reset() {
    this.inputKeys = { W: false, A: false, S: false, D: false, Space: false };
    this.spaceWasPressed = false;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.isGrounded = false;
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }

  checkGrounded(raycaster, scene, ignoreRoot) {
    const torso = this.rig.parts.Torso;

    const rayOrigin = new THREE.Vector3();
    torso.getWorldPosition(rayOrigin);
    rayOrigin.y -= 1; // Cast from bottom of torso

    raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));

    const candidates = scene.children.filter((c) => c !== ignoreRoot);
    const hits = raycaster.intersectObjects(candidates, true);

    // Grounded if hit is within distance and below current position
    this.isGrounded = hits.length > 0 && hits[0].distance < this.groundCheckDistance;
  }

  update(deltaTime, raycaster = null, scene = null) {
    try {
      if (raycaster && scene) this.checkGrounded(raycaster, scene, this.rig.group);

      const inputDir = new THREE.Vector3(
        (this.inputKeys.D ? 1 : 0) - (this.inputKeys.A ? 1 : 0),
        0,
        (this.inputKeys.S ? 1 : 0) - (this.inputKeys.W ? 1 : 0)
      );

      if (inputDir.lengthSq() > 0) inputDir.normalize();

      if (!this.isGrounded) {
        this.velocity.y += this.gravity * deltaTime;
      } else {
        this.velocity.y = 0;
        if (this.inputKeys.Space && !this.spaceWasPressed) {
          this.velocity.y = this.jumpPower;
          this.spaceWasPressed = true;
          this.animator.play("jump");
        }
      }

      // Reset space flag when key is released
      if (!this.inputKeys.Space) {
        this.spaceWasPressed = false;
      }

      // Rotate input direction based on character's current yaw
      const torso = this.rig.parts.Torso;
      const yaw = torso.rotation.y;
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);
      
      // Correct Y-axis rotation for Three.js: x' = x*cos + z*sin, z' = -x*sin + z*cos
      const rotatedX = inputDir.x * cosYaw + inputDir.z * sinYaw;
      const rotatedZ = -inputDir.x * sinYaw + inputDir.z * cosYaw;
      
      this.velocity.x = rotatedX * this.moveSpeed;
      this.velocity.z = rotatedZ * this.moveSpeed;

      torso.position.add(new THREE.Vector3(
        this.velocity.x * deltaTime,
        this.velocity.y * deltaTime,
        this.velocity.z * deltaTime
      ));

      // 💀 Void detection - respawn if fallen too far below ground
      if (torso.position.y < -10) {
        torso.position.set(0, 3, 0);
        this.velocity.set(0, 0, 0);
        console.log("💀 Fell into void - respawned");
      }

      const isMoving = inputDir.length() > 0.1;
      if (isMoving && this.animator.currentAnimation !== "walk") this.animator.play("walk", 1.5);
      if (!isMoving && this.animator.currentAnimation === "walk") this.animator.play("idle");

      this.animator.update(deltaTime);

      if (this.rig.motors && Array.isArray(this.rig.motors)) {
        this.rig.motors.forEach((m) => {
          try {
            m.apply();
          } catch (err) {
            console.warn("❌ Error applying motor:", m.name, err);
          }
        });
      }
    } catch (err) {
      console.error("❌ Error in HumanoidController.update:", err);
    }
  }
}

export class CharacterAppearance {
  constructor(rig) {
    this.rig = rig;
    this.colors = { skin: "#ffa55f", shirt: "#0055ff", pants: "#000000" };
    this.layers = { face: null, shirt: null, pants: null };
    this.presetName = "default";
    this.equippedItems = {};

    try {
      this._applyColors();
    } catch (err) {
      console.error("❌ CharacterAppearance._applyColors failed:", err);
    }
  }

  _applyColors() {
    const skinColor = new THREE.Color(this.colors.skin);
    const shirtColor = new THREE.Color(this.colors.shirt);
    const pantsColor = new THREE.Color(this.colors.pants);

    if (this.rig.parts.Head?.material) {
      this.rig.parts.Head.material.color.copy(skinColor);
    }
    if (this.rig.parts.Torso?.material) {
      this.rig.parts.Torso.material.color.copy(shirtColor);
    }
    if (this.rig.parts.LA?.material) {
      this.rig.parts.LA.material.color.copy(skinColor);
    }
    if (this.rig.parts.RA?.material) {
      this.rig.parts.RA.material.color.copy(skinColor);
    }
    if (this.rig.parts.LL?.material) {
      this.rig.parts.LL.material.color.copy(pantsColor);
    }
    if (this.rig.parts.RL?.material) {
      this.rig.parts.RL.material.color.copy(pantsColor);
    }
  }

  setColors(colors) {
    Object.assign(this.colors, colors);
    this._applyColors();
  }

  setPreset(presetName) {
    if (CharacterAppearance.PRESETS[presetName]) {
      this.presetName = presetName;
      this.setColors(CharacterAppearance.PRESETS[presetName]);
      return true;
    }
    return false;
  }

  getColorConfig() {
    return { ...this.colors, preset: this.presetName };
  }

  equipItem(itemId, itemData) {
    try {
      const { name, type, color } = itemData;
      
      Object.keys(this.equippedItems).forEach(key => {
        if (this.equippedItems[key].type === type) {
          this.unequipItem(key);
        }
      });

      this.equippedItems[itemId] = itemData;

      if (type === "hat") {
        this._applyHat(itemData);
      } else if (type === "shirt") {
        this.setColors({ ...this.colors, shirt: color || this.colors.shirt });
      } else if (type === "pants") {
        this.setColors({ ...this.colors, pants: color || this.colors.pants });
      }

      return true;
    } catch (err) {
      console.error("❌ Error equipping item:", err);
      return false;
    }
  }

  _applyHat(hatData) {
    if (this.hatMesh) {
      this.rig.group.remove(this.hatMesh);
    }

    const hatGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    const hatMat = new THREE.MeshStandardMaterial({ 
      color: hatData.color || "#ff0000",
      roughness: 0.7
    });
    this.hatMesh = new THREE.Mesh(hatGeo, hatMat);
    this.hatMesh.position.copy(this.rig.parts.Head.position);
    this.hatMesh.position.y += 0.8;
    this.rig.group.add(this.hatMesh);
  }

  unequipItem(itemId) {
    if (this.equippedItems[itemId]) {
      const itemData = this.equippedItems[itemId];
      if (itemData.type === "hat" && this.hatMesh) {
        this.rig.group.remove(this.hatMesh);
        this.hatMesh = null;
      }
      delete this.equippedItems[itemId];
    }
  }

  async setFaceTexture(url) {
    const loader = new THREE.TextureLoader();
    try {
      const texture = await loader.loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.rig.parts.Head.material.map = texture;
      this.rig.parts.Head.material.needsUpdate = true;
      this.layers.face = texture;
    } catch (err) {
      console.warn("Failed to load face texture:", err);
    }
  }

  async setShirtTexture(url) {
    const loader = new THREE.TextureLoader();
    try {
      const texture = await loader.loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.rig.parts.Torso.material.map = texture;
      this.rig.parts.Torso.material.needsUpdate = true;
      this.layers.shirt = texture;
    } catch (err) {
      console.warn("Failed to load shirt texture:", err);
    }
  }

  async setPantsTexture(url) {
    const loader = new THREE.TextureLoader();
    try {
      const texture = await loader.loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.rig.parts.LL.material.map = texture;
      this.rig.parts.RL.material.map = texture;
      this.rig.parts.LL.material.needsUpdate = true;
      this.rig.parts.RL.material.needsUpdate = true;
      this.layers.pants = texture;
    } catch (err) {
      console.warn("Failed to load pants texture:", err);
    }
  }
}

export class ToolAttachment {
  constructor(humanoid, hand = "RightArm") {
    this.humanoid = humanoid;
    this.hand = hand;
    this.attachedTool = null;
    this.gripOffset = new THREE.Matrix4().makeTranslation(0, -0.5, 0);
  }

  attach(toolMesh) {
    const handPart = this.humanoid.rig.parts[this.hand];
    if (!handPart) return;

    this.attachedTool = toolMesh;
    handPart.add(toolMesh);

    const gripMatrix = this.gripOffset.clone();
    gripMatrix.decompose(toolMesh.position, toolMesh.quaternion, toolMesh.scale);
  }

  detach() {
    if (this.attachedTool) {
      this.attachedTool.parent?.remove(this.attachedTool);
      this.attachedTool = null;
    }
  }

  update() {
    // Grip position automatically updates via THREE hierarchy
  }
}

export class HealthSystem {
  constructor(humanoid, maxHealth = 100) {
    this.humanoid = humanoid;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.isDead = false;
    this.spawnPosition = humanoid.rig.parts.Torso.position.clone();
  }

  takeDamage(amount) {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.die();
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  die() {
    this.isDead = true;
    this.humanoid.rig.group.visible = false;
    setTimeout(() => this.respawn(), 5000);
  }

  respawn() {
    this.health = this.maxHealth;
    this.isDead = false;
    this.humanoid.rig.parts.Torso.position.copy(this.spawnPosition);
    this.humanoid.velocity.set(0, 0, 0);
    this.humanoid.rig.group.visible = true;
  }

  setSpawnPoint(position) {
    this.spawnPosition = position.clone();
  }
}

export function createR6Rig() {
  try {
    const group = new THREE.Group();
    group.name = "R6Rig";

    const mkPart = (name, width, height, depth, useRounded = false, addToGroup = true) => {
      let geo;
      
      if (useRounded && name === "Head") {
        if (THREE.CapsuleGeometry) {
          // Create smooth capsule head like the reference image
          geo = new THREE.CapsuleGeometry(0.5, 0.2, 16, 32);
        } else {
          // Fallback to sphere for older versions
          geo = new THREE.IcosahedronGeometry(0.55, 5);
        }
      } else {
        geo = new THREE.BoxGeometry(width, height, depth);
      }
      
      const mat = new THREE.MeshStandardMaterial({ 
        roughness: 0.7, 
        metalness: 0.1,
        side: THREE.FrontSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = name;
      mesh.matrixAutoUpdate = true;
      mesh.userData.isR6Part = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Special scale for capsule head
      if (useRounded && name === "Head") {
        mesh.scale.set(1.8, 2, 1.8); // Smooth round proportions
      }
      
      if (addToGroup) {
        group.add(mesh);
      }
      return mesh;
    };

    const Torso = mkPart("Torso", 2, 2, 1);
    const Head = mkPart("Head", 2, 1, 1, true, false);
    const LA = mkPart("LeftArm", 1, 2, 1, false, false);
    const RA = mkPart("RightArm", 1, 2, 1, false, false);
    const LL = mkPart("LeftLeg", 1, 2, 1, false, false);
    const RL = mkPart("RightLeg", 1, 2, 1, false, false);

    // ✅ Set up proper hierarchy: Torso is root, all limbs are children of Torso
    Torso.add(Head, LA, RA, LL, RL);
    
    group.add(Torso);
    Torso.position.set(0, 3, 0);
    
    // Set local positions of limbs relative to Torso (before motors apply)
    // These positions match the joint attachment points
    Head.position.set(0, 1.5, 0);     // center of head above torso
    LA.position.set(-1.5, 0, 0);      // arm touches torso side
    RA.position.set(1.5, 0, 0);
    LL.position.set(-0.5, -2, 0);     // legs under torso
    RL.position.set(0.5, -2, 0);
    
    // Ensure all matrices are updated with new hierarchy
    Torso.updateMatrix();
    Head.updateMatrix();
    LA.updateMatrix();
    RA.updateMatrix();
    LL.updateMatrix();
    RL.updateMatrix();

    const CFrame = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);

    // Motor6D joints with corrected C0/C1 offsets
    // C0 = where joint is in parent (Torso space)
    // C1 = where joint is in child (Limb space)
    const motors = [
      new Motor6D("Neck", Torso, Head,
        CFrame(0, 1.0, 0),     // joint at top of torso
        CFrame(0, -0.5, 0)     // joint at bottom of head
      ),

      // Shoulders: C1 is (0, +1, 0) for 2-high arm centered at origin
      new Motor6D("LeftShoulder", Torso, LA,
        CFrame(-1.5, 1.0, 0),  // parent joint position
        CFrame(0, 1.0, 0)      // child joint at top of arm
      ),
      new Motor6D("RightShoulder", Torso, RA,
        CFrame(1.5, 1.0, 0),
        CFrame(0, 1.0, 0)
      ),

      // Hips: joint at bottom of torso (y = -1) for 2-high torso
      new Motor6D("LeftHip", Torso, LL,
        CFrame(-0.5, -1.0, 0),
        CFrame(0, 1.0, 0)      // joint at top of leg
      ),
      new Motor6D("RightHip", Torso, RL,
        CFrame(0.5, -1.0, 0),
        CFrame(0, 1.0, 0)
      ),
    ];

    motors.forEach(m => {
      try {
        m.apply();
      } catch (err) {
        console.error("❌ Error applying motor during init:", m.name, err);
      }
    });

    return { group, parts: { Torso, Head, LA, RA, LL, RL }, motors };
  } catch (err) {
    console.error("❌ Error in createR6Rig:", err);
    throw err;
  }
}

export async function loadGLBModel(modelPath) {
  const loader = new GLTFLoader();
  try {
    console.log("🎮 Loading GLB model from:", modelPath);
    const gltf = await loader.loadAsync(modelPath);
    const scene = gltf.scene;
    
    // Clone the scene to avoid issues with multiple instances
    const clonedScene = scene.clone();
    
    // Create a new group for the rig
    const rigGroup = new THREE.Group();
    rigGroup.name = "R6Rig";
    
    // Extract all meshes
    let allMeshes = [];
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.side = THREE.FrontSide;
            });
          } else {
            child.material.side = THREE.FrontSide;
          }
        }
        allMeshes.push(child);
      }
    });
    
    console.log("🎮 Found meshes:", allMeshes.map(m => m.name).join(", "));
    
    // Try to detect and organize parts
    let parts = {};
    let detectionPatterns = {
      Torso: ["torso", "body", "chest"],
      Head: ["head"],
      LeftUpperArm: ["left.*arm", "larm", "la", "left.*shoulder"],
      LeftLowerArm: ["left.*forearm", "lforearm", "left.*hand"],
      RightUpperArm: ["right.*arm", "rarm", "ra", "right.*shoulder"],
      RightLowerArm: ["right.*forearm", "rforearm", "right.*hand"],
      LeftUpperLeg: ["left.*leg", "lleg", "left.*thigh"],
      LeftLowerLeg: ["left.*shin", "lshin", "left.*foot"],
      RightUpperLeg: ["right.*leg", "rleg", "right.*thigh"],
      RightLowerLeg: ["right.*shin", "rshin", "right.*foot"],
    };
    
    for (const [partName, patterns] of Object.entries(detectionPatterns)) {
      for (const mesh of allMeshes) {
        if (!parts[partName]) {
          const meshNameLower = mesh.name.toLowerCase();
          for (const pattern of patterns) {
            const regex = new RegExp(pattern, "i");
            if (regex.test(meshNameLower)) {
              parts[partName] = mesh;
              console.log(`✅ Found ${partName} as ${mesh.name}`);
              break;
            }
          }
        }
      }
    }
    
    // Check if we have the essential parts
    if (!parts.Torso) {
      console.log("🎮 No Torso found, falling back to procedural rig");
      return createR6Rig();
    }
    
    console.log("✅ Detected parts:", Object.keys(parts).join(", "));
    
    // Create proper hierarchy
    rigGroup.add(parts.Torso);
    parts.Torso.position.set(0, 0, 0);
    
    // Add arms as children of Torso
    if (parts.LeftUpperArm) {
      parts.Torso.add(parts.LeftUpperArm);
      parts.LeftUpperArm.position.set(-0.75, -0.5, 0);
    }
    if (parts.RightUpperArm) {
      parts.Torso.add(parts.RightUpperArm);
      parts.RightUpperArm.position.set(0.75, -0.5, 0);
    }
    
    // Add legs as children of Torso
    if (parts.LeftUpperLeg) {
      parts.Torso.add(parts.LeftUpperLeg);
      parts.LeftUpperLeg.position.set(-0.35, -1.5, 0);
    }
    if (parts.RightUpperLeg) {
      parts.Torso.add(parts.RightUpperLeg);
      parts.RightUpperLeg.position.set(0.35, -1.5, 0);
    }
    
    // Add head as child of Torso
    if (parts.Head) {
      parts.Torso.add(parts.Head);
      parts.Head.position.set(0, 1.0, 0);
      
      // Try to convert head to capsule
      try {
        // Store original material before clearing
        let headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        let originalMat = null;
        
        parts.Head.traverse((child) => {
          if (child.isMesh && !originalMat) {
            originalMat = child.material;
          }
        });
        
        if (originalMat) headMaterial = originalMat;
        
        // Get bounding box to determine size
        const headBB = new THREE.Box3().setFromObject(parts.Head);
        const headSize = headBB.getSize(new THREE.Vector3());
        const radius = Math.max(headSize.x, headSize.z) / 2;
        const height = headSize.y;
        
        // Create smooth capsule geometry - rounded pill shape like reference image
        let headGeo;
        if (THREE.CapsuleGeometry) {
          // Create capsule with more segments for smooth appearance
          // Radius determines width/depth, length determines the tapered height
          const capsuleRadius = 0.5;
          const capsuleLength = 0.2;
          headGeo = new THREE.CapsuleGeometry(capsuleRadius, capsuleLength, 16, 32); // More segments for smoothness
        } else {
          // Fallback for older Three.js versions - use sphere for smooth round shape
          headGeo = new THREE.IcosahedronGeometry(0.55, 5);
        }
        
        // Clear all children and recreate with capsule geometry
        while (parts.Head.children.length > 0) {
          const child = parts.Head.children[0];
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose?.();
          parts.Head.remove(child);
        }
        
        // Create new mesh with capsule geometry
        const headMesh = new THREE.Mesh(headGeo, headMaterial);
        headMesh.name = "HeadMesh";
        headMesh.castShadow = true;
        headMesh.receiveShadow = true;
        headMesh.scale.set(1.8, 2, 1.8); // More uniform proportions for smooth round look
        parts.Head.add(headMesh);
        
        // Do not scale the head group - let the mesh scale handle it
        
        console.log("✅ Head geometry converted to smooth capsule");
      } catch (e) {
        console.warn("⚠️ Could not convert head geometry:", e.message);
      }
    }
    
    // Connect lower limbs to upper limbs
    if (parts.LeftLowerArm && parts.LeftUpperArm) {
      parts.LeftUpperArm.add(parts.LeftLowerArm);
      parts.LeftLowerArm.position.set(0, -0.5, 0);
    }
    if (parts.RightLowerArm && parts.RightUpperArm) {
      parts.RightUpperArm.add(parts.RightLowerArm);
      parts.RightLowerArm.position.set(0, -0.5, 0);
    }
    if (parts.LeftLowerLeg && parts.LeftUpperLeg) {
      parts.LeftUpperLeg.add(parts.LeftLowerLeg);
      parts.LeftLowerLeg.position.set(0, -0.5, 0);
    }
    if (parts.RightLowerLeg && parts.RightUpperLeg) {
      parts.RightUpperLeg.add(parts.RightLowerLeg);
      parts.RightLowerLeg.position.set(0, -0.5, 0);
    }
    
    // Now create Motor6D joints for animation
    let motors = [];
    const CFrame = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
    
    if (parts.LeftUpperArm) {
      motors.push(new Motor6D("LeftShoulder", parts.Torso, parts.LeftUpperArm, CFrame(-0.75, -0.5, 0), CFrame(0, 0.5, 0)));
    }
    if (parts.RightUpperArm) {
      motors.push(new Motor6D("RightShoulder", parts.Torso, parts.RightUpperArm, CFrame(0.75, -0.5, 0), CFrame(0, 0.5, 0)));
    }
    if (parts.LeftUpperLeg) {
      motors.push(new Motor6D("LeftHip", parts.Torso, parts.LeftUpperLeg, CFrame(-0.35, -1.5, 0), CFrame(0, 0.5, 0)));
    }
    if (parts.RightUpperLeg) {
      motors.push(new Motor6D("RightHip", parts.Torso, parts.RightUpperLeg, CFrame(0.35, -1.5, 0), CFrame(0, 0.5, 0)));
    }
    if (parts.LeftLowerArm && parts.LeftUpperArm) {
      motors.push(new Motor6D("LeftElbow", parts.LeftUpperArm, parts.LeftLowerArm, CFrame(0, -0.5, 0), CFrame(0, 0.5, 0)));
    }
    if (parts.RightLowerArm && parts.RightUpperArm) {
      motors.push(new Motor6D("RightElbow", parts.RightUpperArm, parts.RightLowerArm, CFrame(0, -0.5, 0), CFrame(0, 0.5, 0)));
    }
    if (parts.LeftLowerLeg && parts.LeftUpperLeg) {
      motors.push(new Motor6D("LeftKnee", parts.LeftUpperLeg, parts.LeftLowerLeg, CFrame(0, -0.5, 0), CFrame(0, 0.5, 0)));
    }
    if (parts.RightLowerLeg && parts.RightUpperLeg) {
      motors.push(new Motor6D("RightKnee", parts.RightUpperLeg, parts.RightLowerLeg, CFrame(0, -0.5, 0), CFrame(0, 0.5, 0)));
    }
    if (parts.Head) {
      motors.push(new Motor6D("Neck", parts.Torso, parts.Head, CFrame(0, 1.0, 0), CFrame(0, -0.5, 0)));
    }
    
    console.log("✅ GLB model loaded successfully with", motors.length, "joints");
    
    return {
      group: rigGroup,
      parts: parts,
      motors: motors,
      isGLB: true,
      gltf: gltf
    };
  } catch (err) {
    console.error("❌ Failed to load GLB model:", err);
    console.log("🎮 Falling back to procedural R6 rig");
    return createR6Rig();
  }
}
