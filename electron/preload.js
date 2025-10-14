const { contextBridge } = require("electron");

// Expose any required APIs to the renderer process here
contextBridge.exposeInMainWorld("electronAPI", {
  // Add any required API methods here
  versions: {
    node: () => process.versions.node,
    electron: () => process.versions.electron,
  },
});
