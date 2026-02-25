export function createR6Rig() {
  const group = new THREE.Group();
  group.name = "R6Rig";

  const makeMat = () =>
    new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.FrontSide,
    });

  const mkBox = (name, size) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      makeMat()
    );
    mesh.name = name;
    mesh.matrixAutoUpdate = true;
    mesh.userData.isR6Part = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // ✅ Smooth capsule head that looks like the reference image
  const mkCapsuleHead = (name, w = 2, h = 1, d = 1) => {
    let geo;

    if (THREE.CapsuleGeometry) {
      // Create capsule with high segment count for smooth appearance
      geo = new THREE.CapsuleGeometry(0.5, 0.2, 16, 32);
      const mesh = new THREE.Mesh(geo, makeMat());
      mesh.scale.set(1.8, 2, 1.8); // Smooth round proportions
      mesh.name = name;
      mesh.matrixAutoUpdate = true;
      mesh.userData.isR6Part = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    // Fallback if CapsuleGeometry isn't available
    geo = new THREE.IcosahedronGeometry(0.55, 5);
    const mesh = new THREE.Mesh(geo, makeMat());
    mesh.scale.set(1.8, 2, 1.8);
    mesh.name = name;
    mesh.matrixAutoUpdate = true;
    mesh.userData.isR6Part = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // R6 sizes
  const Torso = mkBox("Torso", new THREE.Vector3(2, 2, 1));
  const Head  = mkCapsuleHead("Head", 2, 1, 1);
  const LA    = mkBox("LeftArm",  new THREE.Vector3(1, 2, 1));
  const RA    = mkBox("RightArm", new THREE.Vector3(1, 2, 1));
  const LL    = mkBox("LeftLeg",  new THREE.Vector3(1, 2, 1));
  const RL    = mkBox("RightLeg", new THREE.Vector3(1, 2, 1));

  // ✅ Roblox-like hierarchy: Torso is root
  group.add(Torso);
  Torso.add(Head, LA, RA, LL, RL);

  // root position
  Torso.position.set(0, 3, 0);

  // zero locals (motors will place them)
  Head.position.set(0, 0, 0);
  LA.position.set(0, 0, 0);
  RA.position.set(0, 0, 0);
  LL.position.set(0, 0, 0);
  RL.position.set(0, 0, 0);

  const CFrame = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);

  // half sizes
  const torsoHalfY = 1.0; // torso height 2
  const headHalfY  = 0.5; // head height 1

  const motors = [
    // ✅ FIX: top of torso is y=+1, NOT 1.5
    new Motor6D("Neck", Torso, Head,
      CFrame(0, torsoHalfY, 0),
      CFrame(0, -headHalfY, 0)
    ),

    new Motor6D("LeftShoulder", Torso, LA,
      CFrame(-1.5, 0.5, 0),
      CFrame(0.5, 1.0, 0)
    ),
    new Motor6D("RightShoulder", Torso, RA,
      CFrame(1.5, 0.5, 0),
      CFrame(-0.5, 1.0, 0)
    ),

    // ✅ FIX: bottom of torso is y=-1, NOT -1.5
    new Motor6D("LeftHip", Torso, LL,
      CFrame(-0.5, -torsoHalfY, 0),
      CFrame(0, 1.0, 0)
    ),
    new Motor6D("RightHip", Torso, RL,
      CFrame(0.5, -torsoHalfY, 0),
      CFrame(0, 1.0, 0)
    ),
  ];

  motors.forEach((m) => m.apply());

  return { group, parts: { Torso, Head, LA, RA, LL, RL }, motors };
}