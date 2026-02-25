/**
 * DogeLinx .dlxplace File Format
 * File extension: .dlxplace (DogeLinx Place)
 * 
 * This is the project save format for DogeLinx Studio.
 * It contains all game data, assets, scripts, and configuration.
 */

// File Structure
const DLXPLACE_FORMAT = {
  // Metadata
  version: "1.0.0",
  format: "dlxplace",
  created: "2025-02-20T12:00:00Z",
  modified: "2025-02-20T14:30:00Z",

  // Project Info
  project: {
    id: "place_abc123xyz789",
    name: "My Awesome Game",
    description: "A fun game made in DogeLinx",
    owner: "user_id_here",
  },

  // Scene Hierarchy
  scenes: [
    {
      id: "scene_1",
      name: "Main Level",
      rootInstances: [
        {
          id: "obj_1",
          name: "Player",
          class: "Character",
          parent: null,
          properties: {
            position: [0, 2, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            health: 100,
          },
          children: [
            {
              id: "obj_2",
              name: "Head",
              class: "Part",
              parent: "obj_1",
              properties: {
                position: [0, 1.5, 0],
                material: "brick",
              },
              children: [],
            },
          ],
        },
        {
          id: "obj_3",
          name: "Terrain",
          class: "Terrain",
          properties: {
            heightmap: "asset_terrain_001",
            size: [100, 50, 100],
          },
          children: [],
        },
      ],
    },
  ],

  // Assets (references and embedded)
  assets: {
    meshes: [
      {
        id: "mesh_player",
        name: "player_model",
        type: "gltf",
        url: "asset:///meshes/player.glb",
      },
    ],
    textures: [
      {
        id: "tex_brick",
        name: "brick_texture",
        type: "png",
        url: "asset:///textures/brick.png",
      },
    ],
    sounds: [
      {
        id: "snd_jump",
        name: "jump_sound",
        type: "mp3",
        url: "asset:///sounds/jump.mp3",
      },
    ],
    animations: [
      {
        id: "anim_walk",
        name: "walk_animation",
        type: "fbx",
        url: "asset:///animations/walk.fbx",
      },
    ],
  },

  // Scripts
  scripts: [
    {
      id: "script_player",
      name: "PlayerController",
      language: "lua",
      source: "local Player = {}...",
      instances: ["obj_1"],
    },
  ],

  // Settings
  settings: {
    gravity: [0, -9.81, 0],
    skyColor: [0.5, 0.8, 1.0],
    ambientLight: 0.5,
    renderDistance: 100,
    targetFPS: 60,
  },

  // Save Metadata
  savedBy: "username",
  saveHost: "app_version_0.1.0",
};

// File Format Versions
export const DLXPLACE_VERSIONS = {
  "1.0.0": {
    features: [
      "Basic scene hierarchy",
      "Asset references",
      "Lua scripting",
      "Physics enabled",
    ],
    breaking_changes: [],
  },
};

/**
 * How .dlxplace files are saved:
 * 1. All data combined into single JSON object
 * 2. Compressed with gzip
 * 3. Wrapped in ZIP container
 * 4. Embedded assets stored inside ZIP
 * 5. Saved with .dlxplace extension
 *
 * File structure:
 * .dlxplace (ZIP archive)
 * ├── manifest.json (metadata + structure)
 * ├── scenes/
 * │   ├── scene_1.json
 * │   └── scene_2.json
 * ├── assets/
 * │   ├── meshes/
 * │   ├── textures/
 * │   ├── sounds/
 * │   └── animations/
 * └── scripts/
 *     ├── PlayerController.lua
 *     └── EnemyAI.lua
 */

/**
 * Usage in React Component
 */
export function PlaceFileExample() {
  return (
    <div>
      <h2>Loading .dlxplace file</h2>
      <code>{`
// Listen for file open
window.dogelinx.onFileOpened((filePath) => {
  // Load and parse the place file
  const place = await loadPlaceFile(filePath);
  
  // Extract scene data
  const scenes = place.scenes;
  const assets = place.assets;
  const scripts = place.scripts;
  
  // Render scenes, load assets, run scripts
  renderScene(scenes[0]);
});
      `}</code>
    </div>
  );
}

// Export utility functions for place file handling
export const PlaceFile = {
  /**
   * Create a new empty place
   */
  createNew: (name) => ({
    version: "1.0.0",
    format: "dlxplace",
    project: {
      name,
      id: generateId("place_"),
    },
    scenes: [
      {
        id: generateId("scene_"),
        name: "Main Scene",
        rootInstances: [],
      },
    ],
    assets: {
      meshes: [],
      textures: [],
      sounds: [],
      animations: [],
    },
    scripts: [],
    settings: {},
  }),

  /**
   * Save place to file (.dlxplace)
   */
  save: async (place, filePath) => {
    const data = JSON.stringify(place, null, 2);
    return window.dogelinx.saveProject({
      data,
      filePath,
      format: "dlxplace",
    });
  },

  /**
   * Load place from .dlxplace file
   */
  load: async (filePath) => {
    const result = await window.dogelinx.loadProject(filePath);
    return JSON.parse(result.data);
  },

  /**
   * Export place to other formats
   */
  export: async (place, format) => {
    // format: "gltf", "fbx", "usdz", etc.
    return window.dogelinx.exportProject(place.project.id, format);
  },
};

function generateId(prefix = "") {
  return prefix + Math.random().toString(36).substr(2, 9);
}
