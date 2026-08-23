const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    launchExe: (exePath) => ipcRenderer.invoke("launch-exe", exePath),
    selectExe: () => ipcRenderer.invoke("select-exe"),
    getConfig: () => ipcRenderer.invoke("get-config"),
    saveLink: (id, newPath) => ipcRenderer.invoke("save-link", id, newPath)
});
