'use strict'
// Depends on: state.js, blockRender.js (renderBlockEl), blockSnap.js (makePlacedDraggable)
// Depends on: rightPanel.js (renderSpriteList, renderBgList, openEntity, closeEntity)
// Depends on: preview.js (renderPreview)

const { ipcRenderer } = require('electron')

let lastSaveTime  = null
let autoSaveTimer = null

// ── Build save payload ────────────────────────────────────────
function buildSaveData() {
    const blockData = {}
    for (const [id, container] of Object.entries(state.entityBlockContainers)) {
        blockData[id] = Array.from(container.querySelectorAll('.placed-block')).map(el => ({
            blockId: el.dataset.blockId,
            x:       parseFloat(el.style.left),
            y:       parseFloat(el.style.top),
        }))
    }
    return JSON.stringify({
        version:        2,
        gameName:       document.getElementById('game-name').value || 'My Game',
        sprites:        state.sprites,
        messages:       state.messages   || [],
        variables:      state.variables  || [],
        lists:          state.lists       || [],
        background:     state.background,
        
        activeEntityId: state.activeEntityId,
        blocks:         blockData,
    }, null, 2)
}

// ── Load from payload ─────────────────────────────────────────
function loadSaveData(json) {
    try {
        const data = JSON.parse(json)

        if (data.gameName) document.getElementById('game-name').value = data.gameName

        state.sprites    = data.sprites    || []
        state.messages   = data.messages   || []
        state.variables  = data.variables  || []
        state.lists      = data.lists      || []
        if (data.background) state.background = data.background

        // Rebuild block containers
        for (const [id, blocks] of Object.entries(data.blocks || {})) {
            const container = getEntityContainer(id)
            container.innerHTML = ''
            blocks.forEach(b => {
                const def = BLOCKS.find(d => d.id === b.blockId)
                if (!def) return
                const el = renderBlockEl(def, false)
                el.classList.add('placed-block')
                el.style.position = 'absolute'
                el.style.left     = b.x + 'px'
                el.style.top      = b.y + 'px'
                makePlacedDraggable(el, container)
                container.appendChild(el)
            })
        }

        renderSpriteList()
        renderBgList()
        renderPreview()

        if (data.activeEntityId && getEntityById(data.activeEntityId)) {
            openEntity(data.activeEntityId)
        } else {
            closeEntity()
        }

        setSaveStatus('Project loaded!')
    } catch (err) {
        setSaveStatus('⚠️ Failed to load project')
        console.error(err)
    }
}

// ── Status display ────────────────────────────────────────────
function setSaveStatus(msg) {
    const el = document.getElementById('save-status')
    el.textContent = msg
    clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => {
        el.textContent = lastSaveTime
            ? `Saved ${Math.round((Date.now() - lastSaveTime) / 1000)}s ago`
            : ''
    }, 3000)
}

// ── Save / Load actions ───────────────────────────────────────
async function manualSave() {
    const result = await ipcRenderer.invoke('save-dialog', buildSaveData())
    if (result.success) { lastSaveTime = Date.now(); setSaveStatus('✅ Saved!') }
}

async function autoSave() {
    await ipcRenderer.invoke('auto-save', buildSaveData())
    lastSaveTime = Date.now()
    setSaveStatus('🔄 Auto-saved')
}

async function loadProject() {
    const result = await ipcRenderer.invoke('open-dialog')
    if (result.success) loadSaveData(result.data)
}

// ── Init ──────────────────────────────────────────────────────
function initSaveLoad() {
    document.getElementById('btn-save').addEventListener('click', manualSave)
    document.getElementById('btn-load').addEventListener('click', loadProject)
    document.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 's') { e.preventDefault(); manualSave() } })
    setInterval(autoSave, 300000)
    window.addEventListener('beforeunload', () => autoSave())
}
