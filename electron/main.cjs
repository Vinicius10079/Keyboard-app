const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn, exec } = require("child_process");

const configPath = path.join(app.getPath("userData"), "links-config.json");

// PIDs de todos os processos lançados pelo app na sessão atual
let launchedPids = new Set();

function loadConfig() {
    try {
        const raw = fs.readFileSync(configPath, "utf-8");
        return JSON.parse(raw);
    } catch (err) {
        return {}; // ainda não existe config salva
    }
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

// Mata um processo (e toda a árvore de filhos) pelo PID.
// No Windows, spawn() sozinho não mata subprocessos que o .exe possa ter criado,
// por isso usamos taskkill /T para derrubar a árvore inteira.
function killPid(pid) {
    return new Promise((resolve) => {
        if (process.platform === "win32") {
            exec(`taskkill /PID ${pid} /T /F`, (error) => {
                // Ignora erro "processo não encontrado" (pode já ter sido fechado manualmente)
                resolve();
            });
        } else {
            try {
                process.kill(-pid, "SIGKILL"); // grupo do processo (detached)
            } catch (err) {
                // processo já não existe
            }
            resolve();
        }
    });
}

// Fecha todos os programas atualmente rastreados como abertos pelo app
async function closeAllLaunched() {
    const pids = Array.from(launchedPids);
    launchedPids.clear();
    await Promise.all(pids.map((pid) => killPid(pid)));
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,

        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(
        path.join(__dirname, "../dist/index.html")
    );
}

// Recebe o caminho do .exe enviado pelo React.
// Antes de abrir, fecha qualquer programa já aberto por este app.
ipcMain.handle("launch-exe", async (event, exePath) => {
    try {
        await closeAllLaunched();

        const child = spawn(exePath, [], {
            detached: true,
            stdio: "ignore"
        });

        child.unref();
        launchedPids.add(child.pid);

        return {
            success: true
        };
    } catch (error) {
        console.error("Erro ao executar o programa:", error);

        return {
            success: false,
            error: error.message
        };
    }
});

// Retorna os overrides de caminho salvos, ex: { analogico: "C:\\novo\\caminho.exe" }
ipcMain.handle("get-config", async () => {
    return loadConfig();
});

// Abre o diálogo nativo do sistema para escolher um novo .exe
ipcMain.handle("select-exe", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Executáveis", extensions: ["exe"] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
    }

    return { canceled: false, filePath: result.filePaths[0] };
});

// Salva o novo caminho de um card específico
ipcMain.handle("save-link", async (event, id, newPath) => {
    try {
        const config = loadConfig();
        config[id] = newPath;
        saveConfig(config);
        return { success: true };
    } catch (error) {
        console.error("Erro ao salvar o caminho:", error);
        return { success: false, error: error.message };
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Fecha tudo que o app abriu ao sair, evitando processos órfãos
app.on("before-quit", async (event) => {
    if (launchedPids.size > 0) {
        event.preventDefault();
        await closeAllLaunched();
        app.exit();
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
