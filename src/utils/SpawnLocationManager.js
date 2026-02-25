/**
 * Spawn Location Manager for Roblox-like playtesting
 * 
 * Handles:
 * - Finding spawn locations in the scene
 * - Spawning characters at spawn locations
 * - Rotating through spawn points
 */

import * as THREE from "three";

class SpawnLocationManager {
  constructor(scene) {
    this.scene = scene;
    this.spawnLocations = [];
    this.currentSpawnIndex = 0;
    this.refreshSpawnLocations();
  }

  /**
   * Find all SpawnLocation parts in the scene
   */
  refreshSpawnLocations() {
    this.spawnLocations = [];
    this.currentSpawnIndex = 0;

    // Look through all objects in the scene
    this.scene.traverse((child) => {
      // Check if it's a SpawnLocation by name or by userData
      if (
        child.isMesh &&
        (child.name.includes("Spawn") ||
          child.name.includes("spawn") ||
          child.userData.className === "SpawnLocation")
      ) {
        this.spawnLocations.push({
          position: child.position.clone(),
          rotation: child.rotation.clone(),
          object: child,
        });
      }
    });

    // If no spawn locations found, use default
    if (this.spawnLocations.length === 0) {
      console.warn("No spawn locations found, using default spawn point at (0, 3, 0)");
      this.spawnLocations.push({
        position: new THREE.Vector3(0, 3, 0),
        rotation: new THREE.Euler(0, 0, 0),
        object: null,
      });
    }

    console.log(`✅ Found ${this.spawnLocations.length} spawn location(s)`);
  }

  /**
   * Get the next spawn location
   */
  getNextSpawnLocation() {
    if (this.spawnLocations.length === 0) {
      return new THREE.Vector3(0, 3, 0);
    }

    const spawn = this.spawnLocations[this.currentSpawnIndex];
    this.currentSpawnIndex = (this.currentSpawnIndex + 1) % this.spawnLocations.length;

    return spawn.position.clone().add(new THREE.Vector3(0, 2, 0)); // Offset above the spawn location
  }

  /**
   * Get a random spawn location
   */
  getRandomSpawnLocation() {
    if (this.spawnLocations.length === 0) {
      return new THREE.Vector3(0, 3, 0);
    }

    const spawn = this.spawnLocations[Math.floor(Math.random() * this.spawnLocations.length)];
    return spawn.position.clone().add(new THREE.Vector3(0, 2, 0));
  }

  /**
   * Get all spawn locations
   */
  getAllSpawnLocations() {
    return this.spawnLocations;
  }

  /**
   * Get the count of spawn locations
   */
  getSpawnLocationCount() {
    return this.spawnLocations.length;
  }
}

export default SpawnLocationManager;
