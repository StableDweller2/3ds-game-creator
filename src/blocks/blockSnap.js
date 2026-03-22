'use strict'
// Depends on: state.js, blockRender.js (renderBlockEl)

const SNAP_DISTANCE = 24
const BLOCK_HEIGHT  = 36

// ── Snap helpers ──────────────────────────────────────────────
function getPlacedBlocks(container) {
    return Array.from(container.querySelectorAll('.placed-block'))
}

function getBlockSnappedBelow(el, container) {
    const x = parseFloat(el.style.left)
    const y = parseFloat(el.style.top)
    const h = el.offsetHeight || BLOCK_HEIGHT
    for (const o of getPlacedBlocks(container)) {
        if (o === el) continue
        const ox = parseFloat(o.style.left)
        const oy = parseFloat(o.style.top)
        if (Math.abs(ox - x) < 6 && Math.abs(oy - (y + h)) < 6) return o
    }
    return null
}

function getChainBelow(el, container) {
    const chain = []; let current = el
    while (true) {
        const next = getBlockSnappedBelow(current, container)
        if (!next) break
        chain.push(next); current = next
    }
    return chain
}

function hasBlockBelow(el, container) {
    return getBlockSnappedBelow(el, container) !== null
}

function hasBlockAbove(el, container) {
    const x = parseFloat(el.style.left)
    const y = parseFloat(el.style.top)
    for (const o of getPlacedBlocks(container)) {
        if (o === el) continue
        const ox = parseFloat(o.style.left)
        const oy = parseFloat(o.style.top)
        const oh = o.offsetHeight || BLOCK_HEIGHT
        if (Math.abs(ox - x) < 6 && Math.abs(oy + oh - y) < 6) return true
    }
    return false
}

function findSnapTarget(movingEl, x, y, container) {
    const mh      = movingEl.offsetHeight || BLOCK_HEIGHT
    const mvShape = movingEl.dataset.shape
    for (const o of getPlacedBlocks(container)) {
        if (o === movingEl || getChainBelow(movingEl, container).includes(o)) continue
        const ox     = parseFloat(o.style.left)
        const oy     = parseFloat(o.style.top)
        const oh     = o.offsetHeight || BLOCK_HEIGHT
        const oShape = o.dataset.shape
        // Reporters, booleans and cap blocks can't be snapped to
        if (oShape === 'reporter' || oShape === 'boolean' || oShape === 'cap') continue
        // Hat blocks can never snap above another block
        if (mvShape === 'hat') continue
        // Snap below
        if (!hasBlockBelow(o, container) && Math.abs(x - ox) < 60 && Math.abs(y - (oy + oh)) < SNAP_DISTANCE)
            return { target: o, snapX: ox, snapY: oy + oh }
        // Snap above
        if (!hasBlockAbove(o, container) && oShape !== 'hat' && Math.abs(x - ox) < 60 && Math.abs((y + mh) - oy) < SNAP_DISTANCE)
            return { target: o, snapX: ox, snapY: oy - mh }
    }
    return null
}

function clearSnapStyles(container) {
    getPlacedBlocks(container).forEach(b => b.style.outline = '')
}

// ── Drag from panel → canvas ──────────────────────────────────
function setupBlockDrag(el) {
    el.addEventListener('mousedown', e => {
        if (!state.activeEntityId || state.activeEntityTab !== 'code') return
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
        e.preventDefault()

        const def = BLOCKS.find(b => b.id === el.dataset.blockId)
        if (!def) return

        const container = getEntityContainer(state.activeEntityId)
        const rect      = document.getElementById('block-canvas').getBoundingClientRect()
        const bRect     = el.getBoundingClientRect()

        const clone = renderBlockEl(def, false)
        clone.classList.add('placed-block')
        clone.style.position = 'absolute'
        clone.style.left     = (bRect.left - rect.left) + 'px'
        clone.style.top      = (bRect.top  - rect.top)  + 'px'
        clone.style.zIndex   = 1000
        clone.style.opacity  = '0.88'
        container.appendChild(clone)

        const ox = e.clientX - bRect.left
        const oy = e.clientY - bRect.top

        function onMove(e) {
            const x = e.clientX - rect.left - ox
            const y = e.clientY - rect.top  - oy
            clone.style.left = x + 'px'; clone.style.top = y + 'px'
            clearSnapStyles(container)
            const snap = findSnapTarget(clone, x, y, container)
            if (snap) snap.target.style.outline = '2px solid white'
        }
        function onUp(e) {
            clone.style.zIndex = ''; clone.style.opacity = '1'
            clearSnapStyles(container)
            const x = parseFloat(clone.style.left), y = parseFloat(clone.style.top)
            const snap = findSnapTarget(clone, x, y, container)
            if (snap) { clone.style.left = snap.snapX + 'px'; clone.style.top = snap.snapY + 'px' }
            const pr = document.getElementById('block-panel').getBoundingClientRect()
            if (e.clientX >= pr.left && e.clientX <= pr.right && e.clientY >= pr.top && e.clientY <= pr.bottom) clone.remove()
            makePlacedDraggable(clone, container)
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    })
}

// ── Drag already-placed block ─────────────────────────────────
function makePlacedDraggable(el, container) {
    el.addEventListener('mousedown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
        e.preventDefault()

        const blockCanvas = document.getElementById('block-canvas')
        const rect  = blockCanvas.getBoundingClientRect()
        const ox    = e.clientX - el.getBoundingClientRect().left
        const oy    = e.clientY - el.getBoundingClientRect().top

        const chain = getChainBelow(el, container)
        const co    = chain.map(c => ({
            el: c,
            dx: parseFloat(c.style.left) - parseFloat(el.style.left),
            dy: parseFloat(c.style.top)  - parseFloat(el.style.top),
        }))

        el.style.zIndex = 1000; el.style.opacity = '0.9'
        chain.forEach(c => { c.style.zIndex = 999; c.style.opacity = '0.9' })

        function onMove(e) {
            const x = e.clientX - rect.left - ox
            const y = e.clientY - rect.top  - oy
            el.style.left = x + 'px'; el.style.top = y + 'px'
            co.forEach(({el:c, dx, dy}) => { c.style.left = (x+dx)+'px'; c.style.top = (y+dy)+'px' })
            clearSnapStyles(container)
            const snap = findSnapTarget(el, x, y, container)
            if (snap) snap.target.style.outline = '2px solid white'
        }
        function onUp(e) {
            el.style.zIndex = ''; el.style.opacity = '1'
            chain.forEach(c => { c.style.zIndex = ''; c.style.opacity = '1' })
            clearSnapStyles(container)
            const x = parseFloat(el.style.left), y = parseFloat(el.style.top)
            const snap = findSnapTarget(el, x, y, container)
            if (snap) {
                el.style.left = snap.snapX + 'px'; el.style.top = snap.snapY + 'px'
                co.forEach(({el:c, dx, dy}) => { c.style.left = (snap.snapX+dx)+'px'; c.style.top = (snap.snapY+dy)+'px' })
            }
            const pr = document.getElementById('block-panel').getBoundingClientRect()
            if (e.clientX >= pr.left && e.clientX <= pr.right && e.clientY >= pr.top && e.clientY <= pr.bottom) {
                chain.forEach(c => c.remove()); el.remove()
            }
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    })
}
