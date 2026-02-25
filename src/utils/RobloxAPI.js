/**
 * Roblox API stubs and autocomplete definitions
 * Provides type information and autocompletion for Roblox-like APIs
 */

// ===============================
// Global Functions & Objects
// ===============================
export const ROBLOX_GLOBALS = {
  // Luau mode directive
  "--!strict": { type: "pragma", description: "Enable strict type mode" },
  "--!nocheck": { type: "pragma", description: "Disable type checking" },
  
  // Service accessors
  game: {
    type: "Roblox service container",
    methods: ["GetService", "WaitForChild", "FindFirstChild", "FindFirstChildOfClass"],
  },
  workspace: {
    type: "Roblox Workspace service",
    methods: ["FindPartInRay", "WaitForChild", "FindFirstChild", "MoveTo"],
  },
  script: {
    type: "Roblox Script",
    methods: ["WaitForChild", "FindFirstChild", "Clone", "Destroy"],
  },
  
  // Module system
  require: { type: "function", description: "Load a ModuleScript" },
  
  // Instance creation
  Instance: {
    type: "Class factory",
    methods: ["new"],
    staticMethods: {
      new: (className) => `Creates new ${className}`,
    },
  },
  
  // Math utilities
  Vector3: {
    type: "3D vector",
    methods: ["new"],
    staticMethods: {
      new: "(x: number, y: number, z: number) => Vector3",
    },
  },
  CFrame: {
    type: "Position and rotation",
    methods: ["new", "fromMatrix"],
    staticMethods: {
      new: "(x: number, y: number, z: number, ...) => CFrame",
    },
  },
  Color3: {
    type: "Color (0-1 range)",
    methods: ["new", "fromRGB"],
    staticMethods: {
      new: "(r: number, g: number, b: number) => Color3",
      fromRGB: "(r: number, g: number, b: number) => Color3",
    },
  },
  UDim2: {
    type: "2D dimension",
    methods: ["new"],
    staticMethods: {
      new: "(scaleX: number, offsetX: number, scaleY: number, offsetY: number) => UDim2",
    },
  },
  Rect: {
    type: "2D rectangle",
    methods: ["new"],
  },
  
  // Standard library
  print: { type: "function", description: "Print to output" },
  warn: { type: "function", description: "Print warning (yellow)" },
  error: { type: "function", description: "Print error and halt" },
  assert: { type: "function", description: "Assert condition is true" },
  type: { type: "function", description: "Get runtime type of value" },
  typeof: { type: "function", description: "Get detailed Roblox type (Luau)" },
  tostring: { type: "function", description: "Convert value to string" },
  tonumber: { type: "function", description: "Convert value to number" },
  ipairs: { type: "function", description: "Iterate indexed table" },
  pairs: { type: "function", description: "Iterate entire table" },
  next: { type: "function", description: "Get next key-value pair" },
  pcall: { type: "function", description: "Protected call (catch errors)" },
  xpcall: { type: "function", description: "Protected call with traceback" },
  
  // Luau table library with types
  table: {
    type: "Table utilities",
    methods: ["insert", "remove", "concat", "sort", "clear", "freeze", "create"],
  },
  string: {
    type: "String utilities",
    methods: ["sub", "len", "upper", "lower", "format", "split", "char", "byte", "pack", "unpack"],
  },
  math: {
    type: "Math utilities",
    methods: ["abs", "ceil", "floor", "round", "sqrt", "sin", "cos", "tan", "random", "min", "max"],
  },
  
  // Events (common)
  UserInputService: {
    type: "Input handling",
    methods: ["IsKeyDown", "InputBegan", "InputEnded", "InputChanged"],
  },
  RunService: {
    type: "Game loop",
    methods: ["RenderStepped", "Heartbeat", "BindToHeartbeat", "Stepped"],
  },
  TweenService: {
    type: "Animation",
    methods: ["Create"],
  },
  
  // Luau async task library
  task: {
    type: "Async utilities",
    methods: ["wait", "spawn", "delay", "defer"],
  },
  
  // Roblox enumerations
  Enum: {
    type: "Enumeration namespace",
    description: "Access Roblox enums: Enum.Material, Enum.NormalId, etc.",
  },
};

// ===============================
// Type Info for Methods
// ===============================
export const TYPE_DATABASE = {
  Part: {
    methods: ["Clone", "Destroy", "FindFirstChild", "WaitForChild", "GetChildren"],
    properties: ["Position", "Rotation", "Size", "Color", "Material", "CanCollide", "Anchored"],
  },
  Model: {
    methods: ["Clone", "Destroy", "FindFirstChild", "WaitForChild", "GetChildren", "MoveTo"],
    properties: ["PrimaryPart", "Name"],
  },
  Instance: {
    methods: ["Clone", "Destroy", "FindFirstChild", "WaitForChild", "GetChildren", "IsA"],
    properties: ["Name", "Parent"],
  },
  BasePart: {
    methods: ["FindFirstChild", "WaitForChild"],
    properties: ["Position", "Rotation", "Size", "CFrame", "Anchored", "CanCollide"],
  },
  GuiObject: {
    methods: ["GetPropertyChangedSignal", "Clone"],
    properties: ["Size", "Position", "BackgroundColor3", "TextColor3", "Visible", "ZIndex"],
  },
};

// ===============================
// Keyword Snippets
// ===============================
export const LUA_SNIPPETS = [
  {
    label: "if",
    kind: "Snippet",
    insertText: "if ${1:condition} then\n\t$0\nend",
    documentation: "If statement",
  },
  {
    label: "for",
    kind: "Snippet",
    insertText: "for ${1:i} = ${2:1}, ${3:10} do\n\t$0\nend",
    documentation: "Numeric for loop",
  },
  {
    label: "foreach",
    kind: "Snippet",
    insertText: "for ${1:key}, ${2:value} in pairs(${3:table}) do\n\t$0\nend",
    documentation: "Table iteration",
  },
  {
    label: "while",
    kind: "Snippet",
    insertText: "while ${1:condition} do\n\t$0\nend",
    documentation: "While loop",
  },
  {
    label: "repeat",
    kind: "Snippet",
    insertText: "repeat\n\t$0\nuntil ${1:condition}",
    documentation: "Repeat until loop",
  },
  {
    label: "function",
    kind: "Snippet",
    insertText: "function ${1:name}(${2:args})\n\t$0\nend",
    documentation: "Function definition",
  },
  {
    label: "local",
    kind: "Snippet",
    insertText: "local ${1:name} = ${2:value}",
    documentation: "Local variable",
  },
  
  // Luau type annotations
  {
    label: "local-typed",
    kind: "Snippet",
    insertText: "local ${1:name}: ${2:number} = ${3:0}",
    documentation: "Local variable with type annotation",
  },
  {
    label: "function-typed",
    kind: "Snippet",
    insertText: "local function ${1:name}(${2:x}: ${3:number}): ${4:number}\n\t$0\nend",
    documentation: "Typed function definition",
  },
  {
    label: "--!strict",
    kind: "Snippet",
    insertText: "--!strict\n$0",
    documentation: "Enable strict mode for type checking",
  },
  {
    label: "type",
    kind: "Snippet",
    insertText: "type ${1:TypeName} = ${2:value}",
    documentation: "Luau type alias definition",
  },
  {
    label: "interface",
    kind: "Snippet",
    insertText: "interface ${1:InterfaceName}\n\t${2:field}: ${3:type}\nend",
    documentation: "Luau interface definition",
  },
  {
    label: "export-type",
    kind: "Snippet",
    insertText: "export type ${1:TypeName} = ${2:value}",
    documentation: "Export type definition",
  },
];

// ===============================
// Roblox API Completions
// ===============================
export const ROBLOX_COMPLETIONS = [
  // game:GetService
  {
    label: "game:GetService",
    kind: "Method",
    insertText: 'game:GetService("${1|Workspace,Players,RunService,UserInputService,TweenService,ReplicatedStorage|}")',
    documentation: "Get a Roblox service by name",
  },
  // Instance.new
  {
    label: "Instance.new",
    kind: "Method",
    insertText: 'Instance.new("${1|Part,Model,Script,LocalScript,ModuleScript,Folder|}"${2:, parent})',
    documentation: "Create a new instance",
  },
  // Part
  {
    label: "Part",
    kind: "Class",
    insertText: 'Instance.new("Part")',
    documentation: "Create a new 3D part",
  },
  // Vector3
  {
    label: "Vector3.new",
    kind: "Method",
    insertText: "Vector3.new(${1:0}, ${2:0}, ${3:0})",
    documentation: "Create a 3D vector",
  },
  // CFrame
  {
    label: "CFrame.new",
    kind: "Method",
    insertText: "CFrame.new(${1:0}, ${2:0}, ${3:0})",
    documentation: "Create a position and rotation",
  },
  // Color3
  {
    label: "Color3.fromRGB",
    kind: "Method",
    insertText: "Color3.fromRGB(${1:255}, ${2:0}, ${3:0})",
    documentation: "Create color from RGB (0-255)",
  },
  {
    label: "Color3.new",
    kind: "Method",
    insertText: "Color3.new(${1:1}, ${2:0}, ${3:0})",
    documentation: "Create color from 0-1 values",
  },
  // WaitForChild
  {
    label: "WaitForChild",
    kind: "Method",
    insertText: ":WaitForChild(${1:'Name'})",
    documentation: "Wait for child to exist",
  },
  // FindFirstChild
  {
    label: "FindFirstChild",
    kind: "Method",
    insertText: ":FindFirstChild(${1:'Name'})",
    documentation: "Find first child with name",
  },
  // Clone
  {
    label: "Clone",
    kind: "Method",
    insertText: ":Clone()",
    documentation: "Deep clone an instance",
  },
  // Destroy
  {
    label: "Destroy",
    kind: "Method",
    insertText: ":Destroy()",
    documentation: "Destroy an instance",
  },
  
  // Luau type system
  {
    label: "typeof",
    kind: "Function",
    insertText: "typeof(${1:value})",
    documentation: "Get Roblox type (Luau)",
  },
  
  // Task library (Luau async)
  {
    label: "task.wait",
    kind: "Function",
    insertText: "task.wait(${1:0.5})",
    documentation: "Yield thread for seconds",
  },
  {
    label: "task.spawn",
    kind: "Function",
    insertText: "task.spawn(${1:fn}})",
    documentation: "Spawn async task",
  },
  {
    label: "task.delay",
    kind: "Function",
    insertText: "task.delay(${1:1}, ${2:fn}})",
    documentation: "Delay task execution",
  },
  
  // Enum
  {
    label: "Enum",
    kind: "Class",
    insertText: "Enum.${1:Material}.${2:Plastic}",
    documentation: "Roblox enumerations",
  },
];

// ===============================
// Basic Lua Syntax Validator
// ===============================
export const validateLuaSyntax = (code) => {
  const diagnostics = [];
  const lines = code.split("\n");
  
  // Track open blocks (if, for, while, function, do)
  const stack = [];
  const keywords = {
    if: "end",
    for: "end",
    while: "end",
    repeat: "until",
    function: "end",
    do: "end",
  };
  
  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("--")) return;
    
    // Check for unmatched brackets
    const openBrackets = (line.match(/\(/g) || []).length;
    const closeBrackets = (line.match(/\)/g) || []).length;
    if (openBrackets !== closeBrackets && !trimmed.endsWith(",")) {
      // Not necessarily an error but worth noting
    }
    
    // Check for keywords without proper closure
    for (const [keyword, closer] of Object.entries(keywords)) {
      const regex = new RegExp(`\\b${keyword}\\b`);
      if (regex.test(trimmed) && !trimmed.includes("--")) {
        stack.push({ keyword, line: lineIdx });
      }
    }
    
    // Check for 'end' / 'until'
    if (trimmed === "end" || trimmed.startsWith("end ")) {
      if (stack.length > 0) {
        stack.pop();
      } else {
        diagnostics.push({
          range: {
            startLineNumber: lineIdx + 1,
            startColumn: line.indexOf("end") + 1,
            endLineNumber: lineIdx + 1,
            endColumn: line.indexOf("end") + 4,
          },
          message: "Unexpected 'end' - no matching block start",
          severity: 8, // Error
        });
      }
    }
  });
  
  // Check for unclosed blocks
  stack.forEach(({ keyword, line }) => {
    diagnostics.push({
      range: {
        startLineNumber: line + 1,
        startColumn: 1,
        endLineNumber: line + 1,
        endColumn: 10,
      },
      message: `Unclosed '${keyword}' block`,
      severity: 8, // Error
    });
  });
  
  return diagnostics;
};

// ===============================
// Unknown Global Detector
// ===============================
export const KNOWN_GLOBALS = new Set([
  // Roblox services & classes
  "game", "workspace", "script", "Instance", "Vector3", "CFrame", "Color3", "UDim2", "Rect", "Enum",
  "UserInputService", "RunService", "TweenService", "Players", "Debris", "ReplicatedStorage", "ServerStorage",
  
  // Luau standard library
  "print", "warn", "error", "type", "typeof", "tostring", "tonumber", "assert", "require",
  "next", "pairs", "ipairs", "unpack", "table", "string", "math", "unicode", "bit32", "utf8",
  "pcall", "xpcall", "rawget", "rawset", "getmetatable", "setmetatable", "rawlen", "rawequal",
  "os", "debug", "coroutine", "_G", "_VERSION",
  
  // Luau async & threading
  "task", "coroutine",
  
  // DogeLinx specific
  "dogelinx", "studioAPI",
]);

export const findUnknownGlobals = (code) => {
  const diagnostics = [];
  const usedGlobals = new Set();
  
  // Simple regex to find identifiers
  const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  const lines = code.split("\n");
  
  lines.forEach((line, lineIdx) => {
    // Skip comments
    const commentIdx = line.indexOf("--");
    const codePart = commentIdx !== -1 ? line.substring(0, commentIdx) : line;
    
    let match;
    const lineRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    while ((match = lineRegex.exec(codePart)) !== null) {
      const name = match[1];
      
      // Skip keywords
      if (["local", "if", "then", "else", "end", "for", "do", "while", "function", "return", "and", "or", "not", "in", "until", "repeat", "elseif"].includes(name)) {
        continue;
      }
      
      // Skip if assigned (e.g., "x = ...")
      const beforeMatch = codePart.substring(0, match.index);
      if (/\w+\s*=\s*$/.test(beforeMatch)) {
        continue;
      }
      
      usedGlobals.add(name);
    }
  });
  
  // Check against known globals
  usedGlobals.forEach((name) => {
    if (!KNOWN_GLOBALS.has(name)) {
      // Find the line and column
      lines.forEach((line, lineIdx) => {
        const regex = new RegExp(`\\b${name}\\b`, "g");
        let match;
        while ((match = regex.exec(line)) !== null) {
          diagnostics.push({
            range: {
              startLineNumber: lineIdx + 1,
              startColumn: match.index + 1,
              endLineNumber: lineIdx + 1,
              endColumn: match.index + name.length + 1,
            },
            message: `Unknown global '${name}'`,
            severity: 4, // Warning
          });
        }
      });
    }
  });
  
  return diagnostics;
};
