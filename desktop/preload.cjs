const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dogelinx", {
  // File association: .dlxplace files
  onFileOpened: (callback) => {
    ipcRenderer.on("file-opened", (event, { filePath }) => callback(filePath));
  },

  // Deep links: dogelinx://...
  onDeepLink: (callback) => {
    ipcRenderer.on("deep-link", (event, { url }) => callback(url));
  },

  // File operations (to be implemented)
  saveProject: (projectData) => ipcRenderer.invoke("save-project", projectData),
  loadProject: (filePath) => ipcRenderer.invoke("load-project", filePath),
  exportProject: (projectData, defaultName) => ipcRenderer.invoke("export-project", { projectData, defaultName }),
  listRecentProjects: () => ipcRenderer.invoke("list-recent-projects"),
  openProjectDialog: () => ipcRenderer.invoke("open-project-dialog"),
  deleteProject: (filePath) => ipcRenderer.invoke("delete-project", filePath),

  // App info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  checkForUpdates: () => ipcRenderer.invoke("check-updates"),

  // Legacy
  ping: () => "pong",
});