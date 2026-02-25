// Simple Perlin-like noise function using math functions
class PerlinNoise {
  constructor(seed = 0) {
    this.seed = seed;
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = Math.floor(Math.sin(i + seed) * 10000) % 256;
    }
    this.permutation = this.permutation.concat(this.permutation);
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 8 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const a = this.permutation[xi] + yi;
    const aa = this.permutation[a];
    const ab = this.permutation[a + 1];
    const b = this.permutation[xi + 1] + yi;
    const ba = this.permutation[b];
    const bb = this.permutation[b + 1];

    const g00 = this.grad(this.permutation[aa], xf, yf);
    const g10 = this.grad(this.permutation[ba], xf - 1, yf);
    const g01 = this.grad(this.permutation[ab], xf, yf - 1);
    const g11 = this.grad(this.permutation[bb], xf - 1, yf - 1);

    const x1 = this.lerp(u, g00, g10);
    const x2 = this.lerp(u, g01, g11);
    const result = this.lerp(v, x1, x2);

    return (result + 1) / 2; // Normalize to [0, 1]
  }
}

const noise = new PerlinNoise(12345);

// Terrain type definitions based on height
const TerrainTypes = {
  WATER: { name: "water", color: 0x1e90ff, range: [0, 0.25] },
  SAND: { name: "sand", color: 0xeddc5f, range: [0.25, 0.35] },
  GRASS: { name: "grass", color: 0x4a7c59, range: [0.35, 0.65] },
  ROCK: { name: "rock", color: 0x8b7765, range: [0.65, 0.85] },
  SNOW: { name: "snow", color: 0xffffff, range: [0.85, 1.0] },
};

/**
 * Generate procedural terrain heightmap using Perlin noise
 * @param {number} width - Grid width in cells
 * @param {number} depth - Grid depth in cells
 * @param {number} cellSize - Size of each cell
 * @param {number} scale - Noise scale (frequency)
 * @param {number} frequency - Base frequency
 * @param {number} maxHeight - Maximum terrain height
 * @param {number} seed - Random seed for Perlin noise
 * @returns {Array} Heightmap array
 */
export function generateHeightmap(width, depth, cellSize = 1, scale = 30, frequency = 0.05, maxHeight = 10, seed = 0) {
  const heights = new Array(width * depth);

  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      let height = 0;
      let amplitude = 1;
      let freq = frequency;
      let maxAmp = 0;

      // fBm (fractional Brownian motion) with multiple octaves
      for (let octave = 0; octave < 4; octave++) {
        const noiseVal = noise.noise2D(x * freq + seed, z * freq + seed);
        height += noiseVal * amplitude;
        maxAmp += amplitude;

        amplitude *= 0.5; // Decrease amplitude
        freq *= 2; // Increase frequency
      }

      // Normalize height
      height = height / maxAmp;
      height = (height + 1) / 2; // Range [0, 1]

      // Add some variation and ensure heights aren't flat
      height = Math.pow(height, 0.9); // Slightly bias towards higher terrain

      heights[z * width + x] = Math.max(0, height * maxHeight);
    }
  }

  return heights;
}

/**
 * Get terrain color based on height type
 * @param {number} height - Normalized height (0-1)
 * @returns {number} Hex color value
 */
export function getTerrainColor(height) {
  for (const terrain of Object.values(TerrainTypes)) {
    const [min, max] = terrain.range;
    if (height >= min && height <= max) {
      return terrain.color;
    }
  }
  return TerrainTypes.SNOW.color;
}

/**
 * Generate terrain object with heightmap and metadata
 * @param {Object} bounds - { x: number, y: number, z: number } - box size
 * @param {Object} options - Configuration options
 * @returns {Object} Terrain object with heightmap and metadata
 */
export function generateTerrain(bounds, options = {}) {
  const defaultOptions = {
    cellSize: 1,
    scale: 20,
    frequency: 0.08,
    maxHeight: bounds.y || 10,
    seed: Math.random() * 1000,
  };

  const opts = { ...defaultOptions, ...options };

  // Calculate grid dimensions based on bounds
  const width = Math.max(8, Math.ceil((bounds.x || 100) / opts.cellSize));
  const depth = Math.max(8, Math.ceil((bounds.z || 100) / opts.cellSize));

  const heights = generateHeightmap(width, depth, opts.cellSize, opts.scale, opts.frequency, opts.maxHeight, opts.seed);

  // Generate vertex colors for terrain types
  const colors = new Array(width * depth);
  const colorRange = [];

  for (let i = 0; i < heights.length; i++) {
    const normalizedHeight = heights[i] / opts.maxHeight;
    colors[i] = getTerrainColor(normalizedHeight);
  }

  return {
    width,
    depth,
    cellSize: opts.cellSize,
    heights,
    colors,
    maxHeight: opts.maxHeight,
    bounds: { x: bounds.x || 100, y: bounds.y || 10, z: bounds.z || 100 },
  };
}

/**
 * Blend terrain smoothly when regenerating at boundaries
 * @param {Array} heights - Current heightmap
 * @param {number} width - Width of heightmap
 * @param {number} margin - Margin from edge
 */
export function smoothTerrainEdges(heights, width, margin = 2) {
  const depth = heights.length / width;

  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const distFromEdge = Math.min(x, width - 1 - x, z, depth - 1 - z);

      if (distFromEdge < margin) {
        const falloff = distFromEdge / margin;
        const idx = z * width + x;
        heights[idx] *= falloff;
      }
    }
  }

  return heights;
}
