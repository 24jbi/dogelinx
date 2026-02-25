const { app, BrowserWindow, Menu, protocol, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;
let mainWindow = null;
let openFilePath = null; // Track file opened at startup

// Must run BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "dogelinx", privileges: { standard: true, secure: true } },
  { scheme: "dlxplace", privileges: { standard: true, secure: true } },
]);

// Auto-update setup (skeleton for later implementation)
if (!isDev) {
  // electron-updater will be added later
  // const { autoUpdater } = require("electron-updater");
  // autoUpdater.checkForUpdatesAndNotify();
}

// Helper: Get projects directory
function getProjectsDir() {
  return path.join(app.getPath("documents"), "DogeLinx", "Projects");
}

// Helper: Ensure projects directory exists
function ensureProjectsDir() {
  const dir = getProjectsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// IPC Handlers
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("check-updates", async () => {
  // Placeholder for electron-updater integration
  return {
    available: false,
    currentVersion: app.getVersion(),
    downloadUrl: null,
    releaseNotes: null,
  };
});

ipcMain.handle("save-project", async (event, projectData) => {
  try {
    ensureProjectsDir();
    const projectsDir = getProjectsDir();
    
    // Generate filename from project name
    const sanitized = (projectData.projectName || "Untitled")
      .replace(/[^a-z0-9-_]/gi, "_")
      .toLowerCase();
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${sanitized}_${timestamp}.dlxplace`;
    const filePath = path.join(projectsDir, filename);

    // Write project data as JSON
    const fileContent = JSON.stringify(projectData, null, 2);
    fs.writeFileSync(filePath, fileContent, "utf8");

    return {
      success: true,
      filePath,
      message: `Project saved to ${filePath}`,
    };
  } catch (error) {
    console.error("Save project error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("load-project", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: "File not found",
      };
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const projectData = JSON.parse(fileContent);

    // Validate structure
    if (!projectData.version || !projectData.projectName || !Array.isArray(projectData.objects)) {
      return {
        success: false,
        error: "Invalid project file format",
      };
    }

    return {
      success: true,
      data: projectData,
      filePath,
    };
  } catch (error) {
    console.error("Load project error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("export-project", async (event, { projectData, defaultName }) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Export Project",
      defaultPath: defaultName || "project.dlxplace",
      filters: [
        { name: "DogeLinx Place Files", extensions: ["dlxplace"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!filePath) {
      return { success: false, message: "Export cancelled" };
    }

    const fileContent = JSON.stringify(projectData, null, 2);
    fs.writeFileSync(filePath, fileContent, "utf8");

    return {
      success: true,
      filePath,
      message: `Project exported to ${filePath}`,
    };
  } catch (error) {
    console.error("Export project error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("list-recent-projects", async (event) => {
  try {
    ensureProjectsDir();
    const projectsDir = getProjectsDir();
    
    const files = fs.readdirSync(projectsDir)
      .filter((f) => f.endsWith(".dlxplace"))
      .map((f) => {
        const filePath = path.join(projectsDir, f);
        const stat = fs.statSync(filePath);
        return {
          name: f.replace(".dlxplace", ""),
          filePath,
          modified: stat.mtime.getTime(),
          size: stat.size,
        };
      })
      .sort((a, b) => b.modified - a.modified)
      .slice(0, 10); // Return last 10 projects

    return {
      success: true,
      projects: files,
    };
  } catch (error) {
    console.error("List projects error:", error);
    return {
      success: false,
      error: error.message,
      projects: [],
    };
  }
});

ipcMain.handle("open-project-dialog", async (event) => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Open Project",
      properties: ["openFile"],
      filters: [
        { name: "DogeLinx Place Files", extensions: ["dlxplace"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    return {
      success: true,
      filePath: filePaths?.[0] || null,
    };
  } catch (error) {
    console.error("Open dialog error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("delete-project", async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return {
      success: true,
      message: "Project deleted",
    };
  } catch (error) {
    console.error("Delete project error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: "#0b1220",
    autoHideMenuBar: true,
    icon: isDev ? null : path.join(__dirname, "assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"), // use ONE preload
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Roblox Studio vibe: use in-app UI, not OS menu
  Menu.setApplicationMenu(null);

  if (isDev) {
    // In dev mode, load the studio route directly (not the landing page)
    mainWindow.loadURL("http://localhost:5173/studio");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // IMPORTANT: dist is in the SAME folder as electron-main.js (root/dist)
    // Load the studio route from the built app
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"), {
      hash: "/studio",
    });
  }

  // Send file path to renderer if one was opened at startup
  mainWindow.webContents.on("did-finish-load", () => {
    if (openFilePath) {
      mainWindow.webContents.send("file-opened", { filePath: openFilePath });
      openFilePath = null;
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Single instance lock (feels more “app”)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (event, args) => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    
    // Handle file opened from second instance
    if (args.length > 0) {
      const filePath = args[args.length - 1];
      if (filePath.endsWith(".dlxplace")) {
        openFilePath = filePath;
        mainWindow.webContents.send("file-opened", { filePath });
      }
    }
  });

  app.whenReady().then(() => {
    // Deep links like dogelinx://...
    try {
      app.setAsDefaultProtocolClient("dogelinx");
    } catch {}

    // Register file association for .dlxplace files
    try {
      app.setAsDefaultProtocolClient("dlxplace");
    } catch {}

    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  // Handle deep links (dogelinx://...)
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.webContents.send("deep-link", { url });
    }
  });

  // Handle file associations on Windows/Linux
  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.webContents.send("file-opened", { filePath });
    } else {
      openFilePath = filePath;
    }
  });

  // Handle files from command line arguments
  const args = process.argv;
  for (let i = 0; i < args.length; i++) {
    if (args[i].endsWith(".dlxplace")) {
      openFilePath = args[i];
      break;
    }
  }
}