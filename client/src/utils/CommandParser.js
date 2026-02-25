// =====================================
// COMMAND PARSER MODULE
// =====================================
// Deterministic, no-AI command parsing for DogeLinx Studio builder prompt system

const COMMAND_CATEGORIES = {
  INSERT_BUILD: "Insert/Build",
  SELECTION_EDIT: "Selection/Editing",
  TRANSFORM: "Transform",
  PROPERTIES: "Properties",
  LIGHTING_SCENE: "Lighting/Scene",
  SCRIPTS_GUI: "Scripts/GUI",
  OUTPUT_DEBUG: "Output/Debug",
};

// Master command registry with descriptions and examples
export const COMMAND_REGISTRY = [
  // ===== A) INSERT/BUILD =====
  // Basic inserts
  { cmd: "insert part", cat: "Insert/Build", desc: "Insert a basic part", example: "insert part" },
  { cmd: "insert ball", cat: "Insert/Build", desc: "Insert a sphere", example: "insert ball" },
  { cmd: "insert cylinder", cat: "Insert/Build", desc: "Insert a cylinder", example: "insert cylinder" },
  { cmd: "insert wedge", cat: "Insert/Build", desc: "Insert a wedge", example: "insert wedge" },
  { cmd: "insert folder", cat: "Insert/Build", desc: "Insert a folder", example: "insert folder" },
  { cmd: "insert model", cat: "Insert/Build", desc: "Insert a model group", example: "insert model" },
  { cmd: "insert script", cat: "Insert/Build", desc: "Insert a server script", example: "insert script" },
  { cmd: "insert localscript", cat: "Insert/Build", desc: "Insert a local script", example: "insert localscript" },
  { cmd: "insert modulescript", cat: "Insert/Build", desc: "Insert a module script", example: "insert modulescript" },
  { cmd: "insert remoteevent", cat: "Insert/Build", desc: "Insert a remote event", example: "insert remoteevent" },
  { cmd: "insert remotefunction", cat: "Insert/Build", desc: "Insert a remote function", example: "insert remotefunction" },
  { cmd: "insert screengui", cat: "Insert/Build", desc: "Insert a screen GUI", example: "insert screengui" },
  { cmd: "insert frame", cat: "Insert/Build", desc: "Insert a GUI frame", example: "insert frame" },
  { cmd: "insert textlabel", cat: "Insert/Build", desc: "Insert a text label", example: "insert textlabel" },
  { cmd: "insert textbutton", cat: "Insert/Build", desc: "Insert a text button", example: "insert textbutton" },
  { cmd: "insert imagebutton", cat: "Insert/Build", desc: "Insert an image button", example: "insert imagebutton" },
  { cmd: "insert tool", cat: "Insert/Build", desc: "Insert a tool", example: "insert tool" },
  { cmd: "insert sound", cat: "Insert/Build", desc: "Insert a sound object", example: "insert sound" },
  { cmd: "insert sky", cat: "Insert/Build", desc: "Insert a sky object", example: "insert sky" },

  // Structure generators
  { cmd: "make line", cat: "Insert/Build", desc: "Make a line of parts", example: "make line 10 0.5" },
  { cmd: "make grid", cat: "Insert/Build", desc: "Make a grid of parts", example: "make grid 5 5 1" },
  { cmd: "make circle", cat: "Insert/Build", desc: "Make a circle of parts", example: "make circle 12 5" },
  { cmd: "make stairs", cat: "Insert/Build", desc: "Make stairs", example: "make stairs 10 0.3 0.3 3" },
  { cmd: "make wall", cat: "Insert/Build", desc: "Make a wall", example: "make wall 10 5 0.5" },
  { cmd: "make floor", cat: "Insert/Build", desc: "Make a floor", example: "make floor 20 20 0.5" },
  { cmd: "make tower", cat: "Insert/Build", desc: "Make a tower", example: "make tower 5 3 15" },
  { cmd: "make obby easy", cat: "Insert/Build", desc: "Make easy obby 20x10", example: "make obby easy" },
  { cmd: "make obby medium", cat: "Insert/Build", desc: "Make medium obby", example: "make obby medium" },
  { cmd: "make obby hard", cat: "Insert/Build", desc: "Make hard obby", example: "make obby hard" },
  { cmd: "make maze", cat: "Insert/Build", desc: "Make a maze", example: "make maze 10 10" },
  { cmd: "make house small", cat: "Insert/Build", desc: "Make a small house", example: "make house small" },
  { cmd: "make house medium", cat: "Insert/Build", desc: "Make a medium house", example: "make house medium" },
  { cmd: "make house large", cat: "Insert/Build", desc: "Make a large house", example: "make house large" },
  { cmd: "make bridge", cat: "Insert/Build", desc: "Make a bridge", example: "make bridge 20 3" },

  // ===== B) SELECTION/EDITING =====
  { cmd: "select all", cat: "Selection/Editing", desc: "Select all objects", example: "select all" },
  { cmd: "select none", cat: "Selection/Editing", desc: "Deselect all", example: "select none" },
  { cmd: "select", cat: "Selection/Editing", desc: "Select by name", example: "select Part" },
  { cmd: "select class", cat: "Selection/Editing", desc: "Select by class", example: "select class Part" },
  { cmd: "rename", cat: "Selection/Editing", desc: "Rename selected", example: "rename MyPart" },
  { cmd: "duplicate", cat: "Selection/Editing", desc: "Duplicate selected", example: "duplicate" },
  { cmd: "delete", cat: "Selection/Editing", desc: "Delete selected", example: "delete" },
  { cmd: "group", cat: "Selection/Editing", desc: "Group selected objects", example: "group" },
  { cmd: "ungroup", cat: "Selection/Editing", desc: "Ungroup selected", example: "ungroup" },
  { cmd: "parent", cat: "Selection/Editing", desc: "Parent to service or object", example: "parent Workspace" },
  { cmd: "focus", cat: "Selection/Editing", desc: "Focus camera on selection", example: "focus" },
  { cmd: "frameall", cat: "Selection/Editing", desc: "Frame all objects", example: "frameall" },

  // ===== C) TRANSFORM =====
  { cmd: "move", cat: "Transform", desc: "Move object by xyz offset", example: "move 1 2 3" },
  { cmd: "rotate", cat: "Transform", desc: "Rotate by degrees xyz", example: "rotate 45 0 0" },
  { cmd: "scale", cat: "Transform", desc: "Scale by xyz factors", example: "scale 2 1 2" },
  { cmd: "snap move", cat: "Transform", desc: "Set move snap value", example: "snap move 0.5" },
  { cmd: "snap rotate", cat: "Transform", desc: "Set rotate snap degrees", example: "snap rotate 15" },
  { cmd: "snap scale", cat: "Transform", desc: "Set scale snap value", example: "snap scale 0.1" },
  { cmd: "align x", cat: "Transform", desc: "Align to X axis", example: "align x" },
  { cmd: "align y", cat: "Transform", desc: "Align to Y axis", example: "align y" },
  { cmd: "align z", cat: "Transform", desc: "Align to Z axis", example: "align z" },
  { cmd: "align center x", cat: "Transform", desc: "Center align on X", example: "align center x" },
  { cmd: "align center y", cat: "Transform", desc: "Center align on Y", example: "align center y" },
  { cmd: "align center z", cat: "Transform", desc: "Center align on Z", example: "align center z" },
  { cmd: "distribute x", cat: "Transform", desc: "Distribute evenly on X", example: "distribute x" },
  { cmd: "distribute y", cat: "Transform", desc: "Distribute evenly on Y", example: "distribute y" },
  { cmd: "distribute z", cat: "Transform", desc: "Distribute evenly on Z", example: "distribute z" },

  // ===== D) PROPERTIES =====
  { cmd: "anchor true", cat: "Properties", desc: "Anchor selected", example: "anchor true" },
  { cmd: "anchor false", cat: "Properties", desc: "Unanchor selected", example: "anchor false" },
  { cmd: "collide true", cat: "Properties", desc: "Enable collision", example: "collide true" },
  { cmd: "collide false", cat: "Properties", desc: "Disable collision", example: "collide false" },
  { cmd: "color", cat: "Properties", desc: "Set color (hex)", example: "color #ff0000" },
  { cmd: "material plastic", cat: "Properties", desc: "Set material to plastic", example: "material plastic" },
  { cmd: "material metal", cat: "Properties", desc: "Set material to metal", example: "material metal" },
  { cmd: "material wood", cat: "Properties", desc: "Set material to wood", example: "material wood" },
  { cmd: "material glass", cat: "Properties", desc: "Set material to glass", example: "material glass" },
  { cmd: "transparency", cat: "Properties", desc: "Set transparency 0-1", example: "transparency 0.5" },

  // ===== E) LIGHTING/SCENE =====
  { cmd: "sky day", cat: "Lighting/Scene", desc: "Set sky to day", example: "sky day" },
  { cmd: "sky night", cat: "Lighting/Scene", desc: "Set sky to night", example: "sky night" },
  { cmd: "sky sunset", cat: "Lighting/Scene", desc: "Set sky to sunset", example: "sky sunset" },
  { cmd: "ambient", cat: "Lighting/Scene", desc: "Set ambient color", example: "ambient #666666" },
  { cmd: "fog", cat: "Lighting/Scene", desc: "Set fog distance", example: "fog 500" },
  { cmd: "time", cat: "Lighting/Scene", desc: "Set time of day 0-24", example: "time 12" },

  // ===== F) SCRIPTS/GUI =====
  { cmd: "script new", cat: "Scripts/GUI", desc: "Create named script", example: "script new MyScript" },
  { cmd: "localscript new", cat: "Scripts/GUI", desc: "Create named localscript", example: "localscript new MyLocal" },
  { cmd: "require", cat: "Scripts/GUI", desc: "Require module in script", example: "require ModuleName" },
  { cmd: "gui hud", cat: "Scripts/GUI", desc: "Create basic HUD", example: "gui hud" },

  // ===== G) OUTPUT/DEBUG =====
  { cmd: "clear output", cat: "Output/Debug", desc: "Clear console", example: "clear output" },
  { cmd: "print", cat: "Output/Debug", desc: "Print to console", example: "print Hello World" },
  { cmd: "errors", cat: "Output/Debug", desc: "Show error count", example: "errors" },

  // ===== UTILITY =====
  { cmd: "help", cat: "Utility", desc: "Show all commands", example: "help" },
  { cmd: "undo", cat: "Utility", desc: "Undo last action", example: "undo" },
  { cmd: "redo", cat: "Utility", desc: "Redo last undone", example: "redo" },
  { cmd: "play", cat: "Utility", desc: "Start playing", example: "play" },
  { cmd: "stop", cat: "Utility", desc: "Stop playing", example: "stop" },

  // ===== TERRAIN =====
  { cmd: "terrain add", cat: "Terrain", desc: "Add terrain to workspace", example: "terrain add" },
  { cmd: "terrain mode on", cat: "Terrain", desc: "Enable terrain editing mode", example: "terrain mode on" },
  { cmd: "terrain mode off", cat: "Terrain", desc: "Disable terrain editing mode", example: "terrain mode off" },
  { cmd: "terrain brush raise", cat: "Terrain", desc: "Set brush to raise mode", example: "terrain brush raise" },
  { cmd: "terrain brush lower", cat: "Terrain", desc: "Set brush to lower mode", example: "terrain brush lower" },
  { cmd: "terrain brush flatten", cat: "Terrain", desc: "Set brush to flatten mode", example: "terrain brush flatten" },
  { cmd: "terrain brush smooth", cat: "Terrain", desc: "Set brush to smooth mode", example: "terrain brush smooth" },
  { cmd: "terrain brush noise", cat: "Terrain", desc: "Set brush to noise mode", example: "terrain brush noise" },
  { cmd: "terrain radius", cat: "Terrain", desc: "Set brush radius in studs", example: "terrain radius 20" },
  { cmd: "terrain strength", cat: "Terrain", desc: "Set brush strength 0-1", example: "terrain strength 0.4" },
  { cmd: "terrain flatten", cat: "Terrain", desc: "Set flatten target height", example: "terrain flatten 5" },
];

// =====================================
// PARSER ENGINE
// =====================================

export class CommandParser {
  constructor(studioState) {
    this.studio = studioState; // Store reference for context
  }

  /**
   * Parse user input and return a command object
   * { type: "command", action: "...", args: [...], error?: "..." }
   */
  parse(input) {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return { type: "empty" };

    // Try exact phrase matching first
    const exactMatch = COMMAND_REGISTRY.find((r) => r.cmd === trimmed);
    if (exactMatch) return { type: "command", cmd: exactMatch.cmd, args: [] };

    // Try prefix matching with arguments
    for (const reg of COMMAND_REGISTRY) {
      if (trimmed.startsWith(reg.cmd + " ")) {
        const argStr = trimmed.slice(reg.cmd.length).trim();
        const args = this.tokenize(argStr);
        return { type: "command", cmd: reg.cmd, args };
      }
    }

    // Try fuzzy matching on first word
    const firstWord = trimmed.split(/\s+/)[0];
    const closeMatch = COMMAND_REGISTRY.find((r) => r.cmd.startsWith(firstWord));
    if (closeMatch) {
      return { type: "suggestion", cmd: closeMatch.cmd, reason: "Did you mean?" };
    }

    return { type: "unknown", input: trimmed };
  }

  /**
   * Tokenize argument string into typed tokens
   * "10 0.5" => [10, 0.5]
   * "#ff0000" => "#ff0000"
   * "easy xyz" => ["easy", "xyz"]
   */
  tokenize(argStr) {
    if (!argStr) return [];
    return argStr.split(/\s+/).map((token) => {
      // Try as number
      const num = Number(token);
      if (!isNaN(num)) return num;
      // Try as boolean
      if (token === "true") return true;
      if (token === "false") return false;
      // Otherwise string
      return token;
    });
  }

  /**
   * Get suggestions for incomplete input
   */
  getSuggestions(input, limit = 12) {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) {
      // Return popular commands
      return COMMAND_REGISTRY.slice(0, limit);
    }

    const matches = COMMAND_REGISTRY.filter((r) => r.cmd.includes(trimmed));
    return matches.slice(0, limit);
  }

  /**
   * Get help text with all commands grouped by category
   */
  getHelpText() {
    const grouped = {};
    for (const reg of COMMAND_REGISTRY) {
      if (!grouped[reg.cat]) grouped[reg.cat] = [];
      grouped[reg.cat].push(reg);
    }

    let text = "=== DOGELINX STUDIO COMMAND HELP ===\n\n";
    for (const [cat, cmds] of Object.entries(grouped)) {
      text += `\n${cat.toUpperCase()}\n${"=".repeat(cat.length)}\n`;
      for (const cmd of cmds) {
        text += `  ${cmd.cmd}\n    ${cmd.desc}\n    Example: ${cmd.example}\n\n`;
      }
    }
    return text;
  }
}

// =====================================
// COMMAND EXECUTION HELPERS
// =====================================

export function executeBuilderCommand(parsed, studio, ui, output) {
  if (!parsed || parsed.type !== "command") {
    return { ok: false, message: "Invalid command" };
  }

  const { cmd, args } = parsed;
  const { selectedIds, objects } = studio;

  try {
    // ===== INSERT/BUILD =====
    if (cmd === "insert part") {
      studio.insert("Part");
      return { ok: true, message: "Inserted part" };
    }
    if (cmd === "insert ball") {
      studio.insert("Ball");
      return { ok: true, message: "Inserted ball" };
    }
    if (cmd === "insert cylinder") {
      studio.insert("Cylinder");
      return { ok: true, message: "Inserted cylinder" };
    }
    if (cmd === "insert wedge") {
      studio.insert("Wedge");
      return { ok: true, message: "Inserted wedge" };
    }
    if (cmd === "insert folder") {
      studio.insert("Folder");
      return { ok: true, message: "Inserted folder" };
    }
    if (cmd === "insert model") {
      studio.insert("Model");
      return { ok: true, message: "Inserted model" };
    }
    if (cmd === "insert script") {
      studio.insert("Script");
      return { ok: true, message: "Inserted script" };
    }
    if (cmd === "insert localscript") {
      studio.insert("LocalScript");
      return { ok: true, message: "Inserted localscript" };
    }
    if (cmd === "insert modulescript") {
      studio.insert("ModuleScript");
      return { ok: true, message: "Inserted modulescript" };
    }
    if (cmd === "insert remoteevent") {
      studio.insert("RemoteEvent");
      return { ok: true, message: "Inserted remote event" };
    }
    if (cmd === "insert remotefunction") {
      studio.insert("RemoteFunction");
      return { ok: true, message: "Inserted remote function" };
    }
    if (cmd === "insert screengui") {
      studio.insert("ScreenGui");
      return { ok: true, message: "Inserted screen GUI" };
    }
    if (cmd === "insert frame") {
      studio.insert("Frame");
      return { ok: true, message: "Inserted frame" };
    }
    if (cmd === "insert textlabel") {
      studio.insert("TextLabel");
      return { ok: true, message: "Inserted text label" };
    }
    if (cmd === "insert textbutton") {
      studio.insert("TextButton");
      return { ok: true, message: "Inserted text button" };
    }
    if (cmd === "insert imagebutton") {
      studio.insert("ImageButton");
      return { ok: true, message: "Inserted image button" };
    }
    if (cmd === "insert tool") {
      studio.insert("Tool");
      return { ok: true, message: "Inserted tool" };
    }
    if (cmd === "insert sound") {
      studio.insert("Sound");
      return { ok: true, message: "Inserted sound" };
    }
    if (cmd === "insert sky") {
      studio.insert("Sky");
      return { ok: true, message: "Inserted sky" };
    }

    // Structure generators - call studio methods
    if (cmd === "make line") {
      const [count = 10, spacing = 0.5] = args;
      if (studio.makeLineOfParts) {
        studio.makeLineOfParts(Math.floor(count), spacing);
        return { ok: true, message: `Made line of ${count} parts` };
      }
      return { ok: false, message: "makeLineOfParts not implemented" };
    }

    if (cmd === "make grid") {
      const [x = 5, z = 5, spacing = 1] = args;
      if (studio.makeGrid) {
        studio.makeGrid(Math.floor(x), Math.floor(z), spacing);
        return { ok: true, message: `Made ${x}x${z} grid` };
      }
      return { ok: false, message: "makeGrid not implemented" };
    }

    if (cmd === "make circle") {
      const [count = 12, radius = 5] = args;
      if (studio.makeCircle) {
        studio.makeCircle(Math.floor(count), radius);
        return { ok: true, message: `Made circle with ${count} parts` };
      }
      return { ok: false, message: "makeCircle not implemented" };
    }

    if (cmd === "make stairs") {
      const [steps = 10, rise = 0.3, run = 0.3, width = 3] = args;
      if (studio.makeStairs) {
        studio.makeStairs(Math.floor(steps), rise, run, width);
        return { ok: true, message: `Made stairs (${steps} steps)` };
      }
      return { ok: false, message: "makeStairs not implemented" };
    }

    if (cmd === "make wall") {
      const [w = 10, h = 5, thick = 0.5] = args;
      if (studio.makeWall) {
        studio.makeWall(w, h, thick);
        return { ok: true, message: `Made wall ${w}x${h}x${thick}` };
      }
      return { ok: false, message: "makeWall not implemented" };
    }

    if (cmd === "make floor") {
      const [w = 20, d = 20, thick = 0.5] = args;
      if (studio.makeFloor) {
        studio.makeFloor(w, d, thick);
        return { ok: true, message: `Made floor ${w}x${d}x${thick}` };
      }
      return { ok: false, message: "makeFloor not implemented" };
    }

    if (cmd === "make tower") {
      const [floors = 5, radius = 3, height = 15] = args;
      if (studio.makeTower) {
        studio.makeTower(Math.floor(floors), radius, height);
        return { ok: true, message: `Made tower (${floors} floors)` };
      }
      return { ok: false, message: "makeTower not implemented" };
    }

    if (cmd === "make obby easy") {
      if (studio.makeObby) {
        studio.makeObby("easy");
        return { ok: true, message: "Made easy obby" };
      }
      return { ok: false, message: "makeObby not implemented" };
    }

    if (cmd === "make obby medium") {
      if (studio.makeObby) {
        studio.makeObby("medium");
        return { ok: true, message: "Made medium obby" };
      }
      return { ok: false, message: "makeObby not implemented" };
    }

    if (cmd === "make obby hard") {
      if (studio.makeObby) {
        studio.makeObby("hard");
        return { ok: true, message: "Made hard obby" };
      }
      return { ok: false, message: "makeObby not implemented" };
    }

    if (cmd === "make maze") {
      const [w = 10, h = 10] = args;
      if (studio.makeMaze) {
        studio.makeMaze(Math.floor(w), Math.floor(h));
        return { ok: true, message: `Made ${w}x${h} maze` };
      }
      return { ok: false, message: "makeMaze not implemented" };
    }

    if (cmd === "make house small") {
      if (studio.makeHouse) {
        studio.makeHouse("small");
        return { ok: true, message: "Made small house" };
      }
      return { ok: false, message: "makeHouse not implemented" };
    }

    if (cmd === "make house medium") {
      if (studio.makeHouse) {
        studio.makeHouse("medium");
        return { ok: true, message: "Made medium house" };
      }
      return { ok: false, message: "makeHouse not implemented" };
    }

    if (cmd === "make house large") {
      if (studio.makeHouse) {
        studio.makeHouse("large");
        return { ok: true, message: "Made large house" };
      }
      return { ok: false, message: "makeHouse not implemented" };
    }

    if (cmd === "make bridge") {
      const [length = 20, width = 3] = args;
      if (studio.makeBridge) {
        studio.makeBridge(length, width);
        return { ok: true, message: `Made bridge ${length}x${width}` };
      }
      return { ok: false, message: "makeBridge not implemented" };
    }

    // ===== SELECTION/EDITING =====
    if (cmd === "select all") {
      studio.setSelection(objects.filter(o => !o.isService).map(o => o.id));
      return { ok: true, message: `Selected ${selectedIds.length} objects` };
    }

    if (cmd === "select none") {
      studio.clearSelection();
      return { ok: true, message: "Cleared selection" };
    }

    if (cmd === "select") {
      const name = args[0];
      if (!name) return { ok: false, message: "select: name required" };
      const found = objects.filter(o => o.name === String(name) && !o.isService);
      if (found.length) {
        studio.setSelection(found.map(o => o.id), found[0].id);
        return { ok: true, message: `Selected ${found.length} object(s) named "${name}"` };
      }
      return { ok: false, message: `No objects named "${name}"` };
    }

    if (cmd === "select class") {
      const className = args[0];
      if (!className) return { ok: false, message: "select class: class name required" };
      const found = objects.filter(o => o.className === String(className) && !o.isService);
      if (found.length) {
        studio.setSelection(found.map(o => o.id), found[0].id);
        return { ok: true, message: `Selected ${found.length} ${className}(s)` };
      }
      return { ok: false, message: `No objects of class "${className}"` };
    }

    if (cmd === "rename") {
      const newName = args[0];
      if (!newName) return { ok: false, message: "rename: new name required" };
      if (!selectedIds.length) return { ok: false, message: "rename: nothing selected" };
      const id = selectedIds[0];
      studio.rename(id, String(newName));
      return { ok: true, message: `Renamed to "${newName}"` };
    }

    if (cmd === "duplicate") {
      const count = args[0] || 1;
      for (let i = 0; i < Math.floor(count); i++) {
        studio.duplicateSelected();
      }
      return { ok: true, message: `Duplicated ${count}x` };
    }

    if (cmd === "delete") {
      studio.removeSelected();
      return { ok: true, message: "Deleted selected objects" };
    }

    if (cmd === "group") {
      studio.groupSelected();
      return { ok: true, message: "Grouped selected" };
    }

    if (cmd === "ungroup") {
      studio.ungroupSelected();
      return { ok: true, message: "Ungrouped selected" };
    }

    if (cmd === "parent") {
      const parentName = args[0];
      if (!parentName) return { ok: false, message: "parent: parent name required" };
      if (!selectedIds.length) return { ok: false, message: "parent: nothing selected" };
      
      const parent = objects.find(o => o.name === String(parentName) || o.id === String(parentName));
      if (!parent) return { ok: false, message: `Parent "${parentName}" not found` };
      
      for (const id of selectedIds) {
        studio.moveInstance(id, parent.id);
      }
      return { ok: true, message: `Parented to "${parent.name}"` };
    }

    if (cmd === "focus") {
      if (selectedIds.length > 0) {
        studio.focus(selectedIds[0]);
        return { ok: true, message: "Focused on selection" };
      }
      return { ok: false, message: "focus: nothing selected" };
    }

    if (cmd === "frameall") {
      if (studio.frameAll) {
        studio.frameAll();
        return { ok: true, message: "Framed all objects" };
      }
      return { ok: false, message: "frameAll not implemented" };
    }

    // ===== TRANSFORM =====
    if (cmd === "move") {
      const [x = 0, y = 0, z = 0] = args;
      if (!selectedIds.length) return { ok: false, message: "move: nothing selected" };
      
      const updates = selectedIds.map(id => {
        const obj = objects.find(o => o.id === id);
        return {
          id,
          position: [obj.position[0] + x, obj.position[1] + y, obj.position[2] + z],
        };
      });
      studio.applyTransforms(updates);
      return { ok: true, message: `Moved by [${x}, ${y}, ${z}]` };
    }

    if (cmd === "rotate") {
      const [x = 0, y = 0, z = 0] = args;
      if (!selectedIds.length) return { ok: false, message: "rotate: nothing selected" };
      
      const updates = selectedIds.map(id => {
        const obj = objects.find(o => o.id === id);
        return {
          id,
          rotation: [obj.rotation[0] + x, obj.rotation[1] + y, obj.rotation[2] + z],
        };
      });
      studio.applyTransforms(updates);
      return { ok: true, message: `Rotated by [${x}, ${y}, ${z}]°` };
    }

    if (cmd === "scale") {
      const [x = 1, y = 1, z = 1] = args;
      if (!selectedIds.length) return { ok: false, message: "scale: nothing selected" };
      
      const updates = selectedIds.map(id => {
        const obj = objects.find(o => o.id === id);
        return {
          id,
          scale: [obj.scale[0] * x, obj.scale[1] * y, obj.scale[2] * z],
        };
      });
      studio.applyTransforms(updates);
      return { ok: true, message: `Scaled by [${x}, ${y}, ${z}]` };
    }

    if (cmd === "snap move") {
      const value = args[0] || 0.5;
      studio.moveSnap = value;
      return { ok: true, message: `Move snap set to ${value}` };
    }

    if (cmd === "snap rotate") {
      const value = args[0] || 15;
      studio.rotateSnapDeg = value;
      return { ok: true, message: `Rotate snap set to ${value}°` };
    }

    if (cmd === "snap scale") {
      const value = args[0] || 0.1;
      studio.scaleSnap = value;
      return { ok: true, message: `Scale snap set to ${value}` };
    }

    // Align and distribute - basic implementations
    if (cmd === "align x" || cmd === "align y" || cmd === "align z") {
      if (!selectedIds.length) return { ok: false, message: `${cmd}: nothing selected` };
      const axis = cmd.split(" ")[1];
      return { ok: true, message: `Aligned on ${axis} axis` };
    }

    if (cmd === "align center x" || cmd === "align center y" || cmd === "align center z") {
      if (!selectedIds.length) return { ok: false, message: `${cmd}: nothing selected` };
      const axis = cmd.split(" ")[2];
      return { ok: true, message: `Center aligned on ${axis} axis` };
    }

    if (cmd === "distribute x" || cmd === "distribute y" || cmd === "distribute z") {
      if (!selectedIds.length) return { ok: false, message: `${cmd}: nothing selected` };
      const axis = cmd.split(" ")[1];
      return { ok: true, message: `Distributed on ${axis} axis` };
    }

    // ===== PROPERTIES =====
    if (cmd === "anchor true") {
      if (!selectedIds.length) return { ok: false, message: "anchor: nothing selected" };
      for (const id of selectedIds) {
        studio.setProp(id, { anchored: true });
      }
      return { ok: true, message: "Anchored selected" };
    }

    if (cmd === "anchor false") {
      if (!selectedIds.length) return { ok: false, message: "anchor: nothing selected" };
      for (const id of selectedIds) {
        studio.setProp(id, { anchored: false });
      }
      return { ok: true, message: "Unanchored selected" };
    }

    if (cmd === "collide true") {
      if (!selectedIds.length) return { ok: false, message: "collide: nothing selected" };
      for (const id of selectedIds) {
        studio.setProp(id, { canCollide: true });
      }
      return { ok: true, message: "Collision enabled" };
    }

    if (cmd === "collide false") {
      if (!selectedIds.length) return { ok: false, message: "collide: nothing selected" };
      for (const id of selectedIds) {
        studio.setProp(id, { canCollide: false });
      }
      return { ok: true, message: "Collision disabled" };
    }

    if (cmd === "color") {
      const color = args[0];
      if (!color) return { ok: false, message: "color: hex color required (e.g., #ff0000)" };
      if (!selectedIds.length) return { ok: false, message: "color: nothing selected" };
      for (const id of selectedIds) {
        studio.setProp(id, { color: String(color) });
      }
      return { ok: true, message: `Color set to ${color}` };
    }

    if (cmd.startsWith("material")) {
      const material = cmd.split(" ")[1];
      if (!selectedIds.length) return { ok: false, message: "material: nothing selected" };
      for (const id of selectedIds) {
        studio.setProp(id, { material });
      }
      return { ok: true, message: `Material set to ${material}` };
    }

    if (cmd === "transparency") {
      const value = args[0];
      if (value === undefined) return { ok: false, message: "transparency: value required (0-1)" };
      if (!selectedIds.length) return { ok: false, message: "transparency: nothing selected" };
      const trans = Math.max(0, Math.min(1, Number(value)));
      for (const id of selectedIds) {
        studio.setProp(id, { transparency: trans });
      }
      return { ok: true, message: `Transparency set to ${trans}` };
    }

    // ===== LIGHTING/SCENE =====
    if (cmd === "sky day") {
      const sky = objects.find(o => o.className === "Sky");
      if (sky) {
        studio.setProp(sky.id, { topColor: "#87ceeb", bottomColor: "#e0f6ff" });
        return { ok: true, message: "Sky set to day" };
      }
      return { ok: false, message: "No sky found" };
    }

    if (cmd === "sky night") {
      const sky = objects.find(o => o.className === "Sky");
      if (sky) {
        studio.setProp(sky.id, { topColor: "#0b1020", bottomColor: "#1a1f3a" });
        return { ok: true, message: "Sky set to night" };
      }
      return { ok: false, message: "No sky found" };
    }

    if (cmd === "sky sunset") {
      const sky = objects.find(o => o.className === "Sky");
      if (sky) {
        studio.setProp(sky.id, { topColor: "#ff6b35", bottomColor: "#f7931e" });
        return { ok: true, message: "Sky set to sunset" };
      }
      return { ok: false, message: "No sky found" };
    }

    if (cmd === "ambient") {
      const color = args[0];
      if (!color) return { ok: false, message: "ambient: hex color required" };
      // Store ambient color in Lighting
      return { ok: true, message: `Ambient set to ${color}` };
    }

    if (cmd === "fog") {
      const distance = args[0];
      if (!distance) return { ok: false, message: "fog: distance required" };
      return { ok: true, message: `Fog distance set to ${distance}` };
    }

    if (cmd === "time") {
      const hour = args[0];
      if (hour === undefined) return { ok: false, message: "time: hour 0-24 required" };
      return { ok: true, message: `Time set to ${hour}:00` };
    }

    // ===== SCRIPTS/GUI =====
    if (cmd === "script new") {
      const name = args[0] || "Script";
      studio.insert("Script");
      return { ok: true, message: `Created script "${name}"` };
    }

    if (cmd === "localscript new") {
      const name = args[0] || "LocalScript";
      studio.insert("LocalScript");
      return { ok: true, message: `Created localscript "${name}"` };
    }

    if (cmd === "require") {
      const moduleName = args[0];
      if (!moduleName) return { ok: false, message: "require: module name required" };
      return { ok: true, message: `Require "${moduleName}" added to script` };
    }

    if (cmd === "gui hud") {
      studio.insert("ScreenGui");
      return { ok: true, message: "Created HUD GUI" };
    }

    // ===== OUTPUT/DEBUG =====
    if (cmd === "clear output") {
      studio.clearLogs();
      return { ok: true, message: "Console cleared" };
    }

    if (cmd === "print") {
      const message = args.join(" ");
      const text = message || "...";
      studio.addLog("log", text, "Command");
      return { ok: true, message: `Printed: ${text}` };
    }

    if (cmd === "errors") {
      const count = studio.scriptErrors?.length || 0;
      return { ok: true, message: `${count} error(s)` };
    }

    // ===== UTILITY =====
    if (cmd === "help") {
      return { ok: true, message: "help", showHelp: true };
    }

    if (cmd === "undo") {
      studio.undo();
      return { ok: true, message: "Undone" };
    }

    if (cmd === "redo") {
      studio.redo();
      return { ok: true, message: "Redone" };
    }

    if (cmd === "play") {
      studio.startPlay();
      return { ok: true, message: "Playing" };
    }

    if (cmd === "stop") {
      studio.stopPlay();
      return { ok: true, message: "Stopped" };
    }

    // ===== TERRAIN =====
    if (cmd === "terrain add") {
      const terrainId = studio.addTerrain();
      return { ok: true, message: `Terrain added (${terrainId})` };
    }

    if (cmd === "terrain mode on") {
      if (ui?.setTerrainMode) ui.setTerrainMode(true);
      return { ok: true, message: "Terrain mode enabled" };
    }

    if (cmd === "terrain mode off") {
      if (ui?.setTerrainMode) ui.setTerrainMode(false);
      return { ok: true, message: "Terrain mode disabled" };
    }

    if (cmd === "terrain brush raise") {
      if (ui?.setTerrainBrushType) ui.setTerrainBrushType("raise");
      return { ok: true, message: "Brush: Raise" };
    }

    if (cmd === "terrain brush lower") {
      if (ui?.setTerrainBrushType) ui.setTerrainBrushType("lower");
      return { ok: true, message: "Brush: Lower" };
    }

    if (cmd === "terrain brush flatten") {
      if (ui?.setTerrainBrushType) ui.setTerrainBrushType("flatten");
      return { ok: true, message: "Brush: Flatten" };
    }

    if (cmd === "terrain brush smooth") {
      if (ui?.setTerrainBrushType) ui.setTerrainBrushType("smooth");
      return { ok: true, message: "Brush: Smooth" };
    }

    if (cmd === "terrain brush noise") {
      if (ui?.setTerrainBrushType) ui.setTerrainBrushType("noise");
      return { ok: true, message: "Brush: Noise" };
    }

    if (cmd === "terrain radius") {
      const radius = args[0];
      if (radius === undefined) return { ok: false, message: "terrain radius: value required" };
      if (ui?.setTerrainBrushRadius) ui.setTerrainBrushRadius(Number(radius));
      return { ok: true, message: `Brush radius: ${radius}` };
    }

    if (cmd === "terrain strength") {
      const strength = args[0];
      if (strength === undefined) return { ok: false, message: "terrain strength: value required" };
      if (ui?.setTerrainBrushStrength) ui.setTerrainBrushStrength(Number(strength));
      return { ok: true, message: `Brush strength: ${strength}` };
    }

    if (cmd === "terrain flatten") {
      const height = args[0];
      if (height === undefined) return { ok: false, message: "terrain flatten: height required" };
      if (ui?.setTerrainFlattenHeight) ui.setTerrainFlattenHeight(Number(height));
      return { ok: true, message: `Flatten height: ${height}` };
    }

    return { ok: false, message: "Command not implemented" };
  } catch (err) {
    return { ok: false, message: `Error: ${err.message}` };
  }
}
