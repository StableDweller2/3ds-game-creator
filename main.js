const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs   = require('fs')

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// ── Save dialog ───────────────────────────────────────────────
ipcMain.handle('save-dialog', async (e, data) => {
    const result = await dialog.showSaveDialog({
        title: 'Save Project',
        defaultPath: 'my-game.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, data, 'utf-8')
        return { success: true, filePath: result.filePath }
    }
    return { success: false }
})

// ── Open dialog ───────────────────────────────────────────────
ipcMain.handle('open-dialog', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Load Project',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    })
    if (!result.canceled && result.filePaths.length > 0) {
        const data = fs.readFileSync(result.filePaths[0], 'utf-8')
        return { success: true, data }
    }
    return { success: false }
})

// ── Auto-save ─────────────────────────────────────────────────
ipcMain.handle('auto-save', async (e, data) => {
    const savePath = path.join(app.getPath('userData'), 'autosave.json')
    fs.writeFileSync(savePath, data, 'utf-8')
    return { success: true, path: savePath }
})