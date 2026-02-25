# DogeLinx Playtesting System

A **Roblox-like playtesting system** that allows you to test your game in real-time with a full player character, physics, and interactive UI.

## Features

### 🎮 Player Control
- **WASD** - Move your character
- **SPACE** - Jump
- **Mouse** - Look around (in first-person mode)
- **F5** - Stop playtesting

### 📊 Real-time UI
The playtesting HUD (Heads-Up Display) shows:
- **Health Bar** - Visual health indicator with color coding
  - Green (>50%): Healthy
  - Yellow (25-50%): Injured
  - Red (<25%): Critical
- **Player Status** - Shows "Alive" or "Dead"
- **Control Guide** - Quick reference for controls
- **Output Console** - Real-time logs from your game
  - Shows console.log messages
  - Displays warnings and errors
  - Scrollable history

### 🎯 Spawn Locations
The system automatically detects **SpawnLocation** parts in your game:
- Place parts named "SpawnLocation" or "Spawn" in your game
- Players will spawn at these locations when playtesting starts
- Multiple spawn points rotate through each playtest
- Falls back to (0, 3, 0) if no spawn locations found

### 💪 Character System
- **R6 Humanoid** - Full rigged character model
- **Joint Animation** - Motor6D joints for movement
- **Appearance Customization** - Skin, shirt, and pants colors
- **Equipment System** - Wear hats and tools
- **Health System** - Take damage, heal, and respawn

### 🎨 Advanced Features
- Crosshair in center of screen
- Glow effects on UI elements
- Real-time health monitoring
- Respawn system (auto-respawn after 5 seconds when dead)

## How to Use

### Starting a Playtest
1. Click the **Play** button in the toolbar (or press **F5**)
2. The playtesting UI will appear in the top-left and bottom-left corners
3. Your character will spawn at a designated spawn location

### Stopping a Playtest
1. Click the **⏹ STOP** button
2. Or press **F5**
3. Return to edit mode

### Setting Up Spawn Locations
1. Create a **Part** in your game
2. Name it **"SpawnLocation"** or **"Spawn"**
3. Position it where you want players to spawn
4. When you playtest, players will spawn there

### Monitoring Your Game
- Watch the **Output** console for logs from your scripts
- Check the **Health** bar to see damage effects
- Read error messages to debug issues

## Global Variables (During Playtest)

When a playtest is running, these globals are available:

```javascript
window.__r6Rig           // The character rig
window.__humanoid        // The HumanoidController instance
window.__characterAppearance  // CharacterAppearance instance
window.__healthSystem    // HealthSystem instance
```

You can access these from your game scripts to modify the character during playtest.

## Example Script

```javascript
// Damage the player
if (window.__healthSystem) {
  window.__healthSystem.takeDamage(25);
}

// Change character colors
if (window.__characterAppearance) {
  window.__characterAppearance.setColors({
    skin: "#ff0000",
    shirt: "#00ff00",
    pants: "#0000ff"
  });
}

// Get player position
if (window.__humanoid && window.__humanoid.rig.parts.Torso) {
  const pos = window.__humanoid.rig.parts.Torso.position;
  console.log(`Player at (${pos.x}, ${pos.y}, ${pos.z})`);
}
```

## Tips & Tricks

✅ **Do:**
- Use SpawnLocation parts for multiple test scenarios
- Monitor the console for debug messages
- Take advantage of the health system to test damage mechanics
- Use equipment items to test accessories

❌ **Don't:**
- Modify the rig directly during testing (use the provided APIs)
- Close the browser console while testing (you might miss errors)
- Expect real-time code reloading (stop and restart playtest)

## Architecture

### Components
- **PlaytestingSystem.jsx** - Main UI component
- **PlaytestR6Character.jsx** - Character spawning and setup
- **SpawnLocationManager.js** - Spawn location detection and management

### Systems
- **HumanoidController** - Player input and movement
- **CharacterAppearance** - Customization and cosmetics
- **HealthSystem** - Damage, death, and respawn
- **Motor6D** - Joint animation system

## Camera Controls

During playtesting, the camera is in **third-person mode** with the player centered. The camera follows the player's movement and rotation.

Press **ESC** to exit pointer lock and regain cursor control.
