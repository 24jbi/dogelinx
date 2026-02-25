/**
 * DogeLinx Studio Features
 * Track available and planned features
 */

export const STUDIO_FEATURES = {
  // Core Features
  core: {
    sceneEditor: {
      name: "Scene Editor",
      description: "Visual scene building with drag-and-drop hierarchy",
      status: "active",
    },
    assetManager: {
      name: "Asset Manager",
      description: "Organize and manage game assets (models, textures, sounds)",
      status: "active",
    },
    inspector: {
      name: "Inspector",
      description: "Edit object properties and components",
      status: "active",
    },
    scriptEditor: {
      name: "Script Editor",
      description: "Write and debug Lua scripts",
      status: "active",
    },
  },

  // Planned Big Features
  planned: {
    animationEditor: {
      name: "Animation Editor",
      description: "Create and edit animations with keyframe timeline",
      category: "Content Creation",
      priority: "high",
      estimatedComplexity: "high",
    },
    terrainEditor: {
      name: "Terrain Editor",
      description: "Heightmap-based terrain painting and sculpting tools",
      category: "World Building",
      priority: "high",
      estimatedComplexity: "high",
    },
    pluginSystem: {
      name: "Plugin System",
      description: "Extensible architecture for third-party plugins and custom tools",
      category: "Extensibility",
      priority: "medium",
      estimatedComplexity: "medium",
    },
    collaborationTeamCreate: {
      name: "Multiplayer Collaboration (Team Create-like)",
      description: "Real-time collaborative editing with multiple team members",
      category: "Collaboration",
      priority: "high",
      estimatedComplexity: "very-high",
      relatedTechnologies: ["websockets", "operational-transform", "conflict-resolution"],
    },
    profiler: {
      name: "Profiler",
      description: "Performance monitoring and analysis (FPS, draw calls, script time)",
      metrics: ["fps", "drawCalls", "scriptTime", "memoryUsage"],
      category: "Development Tools",
      priority: "medium",
      estimatedComplexity: "medium",
    },
    publishFlow: {
      name: "Publish Flow",
      description: "Upload game versions and manage releases",
      features: ["versionManagement", "releaseNotes", "buildGeneration", "distribution"],
      category: "Publishing",
      priority: "high",
      estimatedComplexity: "medium",
    },
  },
};

/**
 * Feature availability by tier
 */
export const FEATURE_TIERS = {
  free: [
    "sceneEditor",
    "assetManager",
    "inspector",
    "scriptEditor",
  ],
  pro: [
    "sceneEditor",
    "assetManager",
    "inspector",
    "scriptEditor",
    "animationEditor",
    "terrainEditor",
    "profiler",
  ],
  studio: [
    "sceneEditor",
    "assetManager",
    "inspector",
    "scriptEditor",
    "animationEditor",
    "terrainEditor",
    "pluginSystem",
    "collaborationTeamCreate",
    "profiler",
    "publishFlow",
  ],
};

/**
 * Check if a feature is available for a given tier
 */
export function isFeatureAvailable(featureKey, tier = "free") {
  const tierFeatures = FEATURE_TIERS[tier] || [];
  return tierFeatures.includes(featureKey);
}

/**
 * Get all planned features
 */
export function getPlannedFeatures() {
  return Object.entries(STUDIO_FEATURES.planned).map(([key, feature]) => ({
    key,
    ...feature,
  }));
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category) {
  return Object.entries(STUDIO_FEATURES.planned)
    .filter(([_, feature]) => feature.category === category)
    .map(([key, feature]) => ({
      key,
      ...feature,
    }));
}
