'use strict'
// Depends on: state.js, preview.js

// ── Entity editor ─────────────────────────────────────────────
function openEntity(id) {
    state.activeEntityId = id
    const entity = getEntityById(id)
    if (!entity) return

    document.getElementById('entity-icon').textContent = entity.icon || '🖼'
    document.getElementById('entity-name').textContent = entity.name
    document.getElementById('entity-type').textContent = id === 'background' ? 'Background' : 'Sprite'

    document.getElementById('canvas-empty').style.display  = 'none'
    document.getElementById('entity-editor').style.display = 'flex'
    switchEntityTab(state.activeEntityTab)
}

function switchEntityTab(tab) {
    state.activeEntityTab = tab
    document.querySelectorAll('.entity-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab))

    document.getElementById('tab-code').style.display     = 'none'
    document.getElementById('tab-textures').style.display  = 'none'
    document.getElementById('tab-sounds').style.display    = 'none'

    if (tab === 'code') {
        document.getElementById('tab-code').style.display = 'block'
        const bc = document.getElementById('block-canvas')
        bc.innerHTML = ''
        if (state.activeEntityId) bc.appendChild(getEntityContainer(state.activeEntityId))
    } else if (tab === 'textures') {
        document.getElementById('tab-textures').style.display = 'flex'
    } else if (tab === 'sounds') {
        document.getElementById('tab-sounds').style.display = 'flex'
    }
}

function initEntityTabs() {
    document.querySelectorAll('.entity-tab').forEach(t => t.addEventListener('click', () => switchEntityTab(t.dataset.tab)))
}

// ── Right panel tab switching ─────────────────────────────────
function initRightPanelTabs() {
    document.querySelectorAll('.rpanel-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.rpanel-tab').forEach(t => t.classList.remove('active'))
            tab.classList.add('active')
            document.getElementById('sprite-section').style.display     = tab.dataset.tab === 'sprites'    ? 'flex' : 'none'
            document.getElementById('bg-section').style.display         = tab.dataset.tab === 'background' ? 'flex' : 'none'
            // Auto-open background entity when switching to that tab
            if (tab.dataset.tab === 'background') openEntity('background')
        })
    })
}

// ── Background (single, always exists) ───────────────────────
function initBackground() {
    renderBgPanel()
}

function renderBgPanel() {
    const bgSection = document.getElementById('bg-section')
    bgSection.innerHTML = ''

    const card = document.createElement('div')
    card.className = 'sprite-entry selected'
    card.style.cursor = 'pointer'
    card.innerHTML = `
        <span style="font-size:20px;">${state.background.icon}</span>
        <span style="flex:1;font-weight:bold;">${state.background.name}</span>
        <div class="bg-swatch" style="background:${state.background.color};width:20px;height:20px;border-radius:3px;border:1px solid #45475a;"></div>
    `
    card.addEventListener('click', () => openEntity('background'))

    // Color picker
    const colorRow = document.createElement('div')
    colorRow.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;background:#252535;border-radius:8px;'
    colorRow.innerHTML = `<span style="font-size:12px;color:#a6adc8;">Base Color</span>`
    const colorPick = document.createElement('input')
    colorPick.type  = 'color'
    colorPick.value = state.background.color
    colorPick.style.cssText = 'width:32px;height:24px;border:none;border-radius:4px;cursor:pointer;background:none;'
    colorPick.addEventListener('input', () => {
        state.background.color = colorPick.value
        renderPreview()
    })
    colorRow.appendChild(colorPick)

    bgSection.appendChild(card)
    bgSection.appendChild(colorRow)
}

// ── Sprites ───────────────────────────────────────────────────
const SPRITE_OPTIONS = [
    { name:'Hero',  icon:'🧑' }, { name:'Enemy', icon:'👾' },
    { name:'Coin',  icon:'🪙' }, { name:'Star',  icon:'⭐' },
    { name:'Bomb',  icon:'💣' }, { name:'Heart', icon:'❤️' },
    { name:'Sword', icon:'⚔️' }, { name:'Block', icon:'🟦' },
]
let spritePickIndex = 0

function initSprites() {
    document.getElementById('add-sprite-btn').addEventListener('click', () => {
        const o = SPRITE_OPTIONS[spritePickIndex++ % SPRITE_OPTIONS.length]
        const s = { id: Date.now(), name: o.name, icon: o.icon, x: 80, y: 40 }
        state.sprites.push(s)
        renderSpriteList(); renderPreview(); openEntity(s.id)
    })
}

function renderSpriteList() {
    const spriteList = document.getElementById('sprite-list')
    spriteList.innerHTML = ''
    state.sprites.forEach((sprite, index) => {
        const el = document.createElement('div')
        el.className     = 'sprite-entry' + (state.activeEntityId === sprite.id ? ' selected' : '')
        el.draggable     = true
        el.dataset.index = index
        el.innerHTML     = `
            <span style="font-size:11px;color:#585b70;cursor:grab;padding-right:4px;">⠿</span>
            <span class="icon">${sprite.icon}</span>
            <span style="flex:1">${sprite.name}</span>
            <span style="font-size:11px;color:#a6adc8">x:${Math.round(sprite.x)} y:${Math.round(sprite.y)}</span>
        `
        el.addEventListener('click', () => { openEntity(sprite.id); renderSpriteList() })
        el.addEventListener('contextmenu', e => { e.preventDefault(); showSpriteContextMenu(e.clientX, e.clientY, sprite) })
        el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', index); el.style.opacity = '0.5' })
        el.addEventListener('dragend',   () => { el.style.opacity = '1'; document.querySelectorAll('.sprite-entry').forEach(e => e.style.borderColor = '') })
        el.addEventListener('dragover',  e => { e.preventDefault(); el.style.borderColor = '#89b4fa' })
        el.addEventListener('dragleave', () => { el.style.borderColor = '' })
        el.addEventListener('drop', e => {
            e.preventDefault(); el.style.borderColor = ''
            const f = parseInt(e.dataTransfer.getData('text/plain')), t = parseInt(el.dataset.index)
            if (f === t) return
            state.sprites.splice(t, 0, state.sprites.splice(f, 1)[0])
            renderSpriteList(); renderPreview()
        })
        spriteList.appendChild(el)
    })
}

function showSpriteContextMenu(mx, my, sprite) {
    const ex = document.getElementById('sprite-context-menu'); if (ex) ex.remove()
    const menu = document.createElement('div')
    menu.id = 'sprite-context-menu'
    menu.style.cssText = menuStyle(mx, my)
    nudgeMenu(menu, mx, my)

    const rb = mkMenuItem('✏️ Rename', false, () => { menu.remove(); showRenameDialog(sprite) })

    const xy = document.createElement('div')
    xy.innerHTML = `📍 Set X: <input id="ctx-x" type="number" value="${Math.round(sprite.x)}" style="width:45px;background:#1e1e2e;border:1px solid #89b4fa;border-radius:4px;color:white;padding:2px 4px;"> Y: <input id="ctx-y" type="number" value="${Math.round(sprite.y)}" style="width:45px;background:#1e1e2e;border:1px solid #89b4fa;border-radius:4px;color:white;padding:2px 4px;"> <button id="ctx-xy-ok" style="background:#89b4fa;border:none;border-radius:4px;padding:2px 6px;cursor:pointer;font-weight:bold;color:#1e1e2e;">✓</button>`
    xy.style.cssText = 'padding:8px 16px;cursor:default;display:flex;align-items:center;gap:4px;'
    xy.querySelector('#ctx-xy-ok').addEventListener('click', () => {
        const nx = parseFloat(document.getElementById('ctx-x').value)
        const ny = parseFloat(document.getElementById('ctx-y').value)
        if (!isNaN(nx)) sprite.x = nx
        if (!isNaN(ny)) sprite.y = ny
        menu.remove(); renderSpriteList(); renderPreview()
    })

    const dv = divider()
    const dl = mkMenuItem('🗑️ Delete', true, () => {
        menu.remove()
        delete state.entityBlockContainers[sprite.id]
        state.sprites = state.sprites.filter(s => s.id !== sprite.id)
        if (state.activeEntityId === sprite.id) closeEntity()
        renderSpriteList(); renderPreview()
    })

    menu.appendChild(rb); menu.appendChild(xy); menu.appendChild(dv); menu.appendChild(dl)
    document.body.appendChild(menu)
    autoCloseMenu(menu)
}

function showRenameDialog(sprite) {
    const ov = document.createElement('div')
    ov.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;`
    const bx = document.createElement('div')
    bx.style.cssText = `background:#313244;border:2px solid #89b4fa;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:12px;min-width:260px;color:white;font-family:Arial,sans-serif;`
    const lb = document.createElement('div'); lb.textContent = 'Rename Sprite'; lb.style.cssText = 'font-weight:bold;font-size:15px;color:#89b4fa;'
    const ip = document.createElement('input'); ip.type = 'text'; ip.value = sprite.name
    ip.style.cssText = `background:#1e1e2e;border:1px solid #45475a;border-radius:6px;color:white;padding:8px 10px;font-size:14px;outline:none;`
    const rw = document.createElement('div'); rw.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;'
    const cb = document.createElement('button'); cb.textContent = 'Cancel'; cb.style.cssText = `padding:6px 14px;background:#45475a;border:none;border-radius:6px;color:white;cursor:pointer;font-size:13px;`
    const cf = document.createElement('button'); cf.textContent = 'Rename'; cf.style.cssText = `padding:6px 14px;background:#89b4fa;border:none;border-radius:6px;color:#1e1e2e;cursor:pointer;font-size:13px;font-weight:bold;`
    function doRename() {
        const v = ip.value.trim()
        if (v) {
            sprite.name = v
            renderSpriteList(); renderPreview()
            if (state.activeEntityId === sprite.id) document.getElementById('entity-name').textContent = v
        }
        ov.remove()
    }
    cb.addEventListener('click', () => ov.remove())
    cf.addEventListener('click', doRename)
    ip.addEventListener('keydown', e => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') ov.remove() })
    rw.appendChild(cb); rw.appendChild(cf)
    bx.appendChild(lb); bx.appendChild(ip); bx.appendChild(rw)
    ov.appendChild(bx); document.body.appendChild(ov)
    ip.focus(); ip.select()
}

// ── Shared helpers ────────────────────────────────────────────
function closeEntity() {
    state.activeEntityId = null
    document.getElementById('canvas-empty').style.display  = 'flex'
    document.getElementById('entity-editor').style.display = 'none'
}

function menuStyle(mx, my) {
    return `position:fixed;left:${mx}px;top:${my}px;background:#313244;border:2px solid #45475a;border-radius:8px;padding:6px 0;z-index:9999;min-width:180px;box-shadow:0 4px 16px rgba(0,0,0,0.5);font-size:13px;color:white;font-family:Arial,sans-serif;`
}

function nudgeMenu(menu, mx, my) {
    requestAnimationFrame(() => {
        const r = menu.getBoundingClientRect()
        if (r.right  > window.innerWidth)  menu.style.left = (mx - r.width)  + 'px'
        if (r.bottom > window.innerHeight) menu.style.top  = (my - r.height) + 'px'
    })
}

function autoCloseMenu(menu) {
    setTimeout(() => {
        document.addEventListener('mousedown', function c(e) {
            if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('mousedown', c) }
        })
    }, 0)
}

function divider() {
    const d = document.createElement('div')
    d.style.cssText = 'height:1px;background:#45475a;margin:4px 0;'
    return d
}

function mkMenuItem(label, danger, onClick) {
    const el = document.createElement('div')
    el.textContent   = label
    el.style.cssText = `padding:8px 16px;cursor:pointer;${danger ? 'color:#f38ba8;' : ''}`
    el.addEventListener('mouseenter', () => el.style.background = '#45475a')
    el.addEventListener('mouseleave', () => el.style.background = '')
    el.addEventListener('click', onClick)
    return el
}
