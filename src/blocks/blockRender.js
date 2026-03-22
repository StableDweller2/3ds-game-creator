'use strict'
// Depends on: blockDefs.js (BLOCKS, COLORS, CATEGORIES), state.js (sprites, backgrounds)
// Depends on: blockSnap.js (setupBlockDrag, makePlacedDraggable)

let activeCat = 'motion'

function renderBlockEl(def, isDraggable = true) {
    const col = COLORS[def.cat] || COLORS.motion
    const el  = document.createElement('div')
    el.className       = 'sb-block'
    el.dataset.blockId = def.id
    el.dataset.cat     = def.cat
    el.dataset.shape   = def.shape
    el.style.background   = col.bg
    el.style.borderBottom = `3px solid ${col.dark}`

    if (def.shape === 'hat')      el.classList.add('sb-hat')
    if (def.shape === 'reporter') el.classList.add('sb-reporter')
    if (def.shape === 'boolean')  el.classList.add('sb-boolean')
    if (def.shape === 'cblock')   el.classList.add('sb-cblock')
    if (def.shape === 'cap')      el.classList.add('sb-cap')

    for (const part of def.parts) {
        if (part.t === 'label') {
            const span = document.createElement('span')
            span.textContent = part.v
            el.appendChild(span)

        } else if (part.t === 'input') {
            const inp = document.createElement('input')
            inp.type      = part.k === 'num' ? 'number' : 'text'
            inp.value     = part.v
            inp.className = 'sb-input' + (part.k === 'text' ? ' sb-input-text' : '')
            inp.addEventListener('mousedown', e => e.stopPropagation())
            el.appendChild(inp)

        } else if (part.t === 'dropdown') {
            const sel  = document.createElement('select')
            sel.className  = 'sb-dropdown'
            sel.style.background = col.dark

            // Resolve dynamic option lists
            let opts = part.opts
            if (opts.includes('__sprites__')) {
                opts = [...opts.filter(o => !o.startsWith('__')), ...state.sprites.map(s => s.name)]
                // Re-populate on open so new sprites always appear
                sel.addEventListener('mousedown', () => {
                    const current = sel.value
                    const staticOpts = part.opts.filter(o => !o.startsWith('__'))
                    const spriteOpts = state.sprites.map(s => s.name)
                    const fresh = [...staticOpts, ...spriteOpts]
                    sel.innerHTML = ''
                    fresh.forEach(o => {
                        const opt = document.createElement('option')
                        opt.value = o; opt.textContent = o
                        sel.appendChild(opt)
                    })
                    sel.value = fresh.includes(current) ? current : fresh[0]
                })
            }
            if (opts.includes('__messages__')) {
                const msgs = state.messages && state.messages.length ? state.messages : []
                opts = ['new message', ...msgs]
                sel.addEventListener('mousedown', () => {
                    const current = sel.value
                    const fresh = ['new message', ...(state.messages || [])]
                    sel.innerHTML = ''
                    fresh.forEach(o => {
                        const opt = document.createElement('option')
                        opt.value = o; opt.textContent = o
                        sel.appendChild(opt)
                    })
                    sel.value = fresh.includes(current) ? current : fresh[0]
                })
            }
            if (opts.includes('__vars__')) {
                opts = state.variables && state.variables.length ? state.variables : ['(no variables)']
                sel.addEventListener('mousedown', () => {
                    const current = sel.value
                    const fresh = state.variables && state.variables.length ? state.variables : ['(no variables)']
                    sel.innerHTML = ''
                    fresh.forEach(o => {
                        const opt = document.createElement('option')
                        opt.value = o; opt.textContent = o
                        sel.appendChild(opt)
                    })
                    sel.value = fresh.includes(current) ? current : fresh[0]
                })
            }
            if (opts.includes('__lists__')) {
                opts = state.lists && state.lists.length ? state.lists : ['(no lists)']
                sel.addEventListener('mousedown', () => {
                    const current = sel.value
                    const fresh = state.lists && state.lists.length ? state.lists : ['(no lists)']
                    sel.innerHTML = ''
                    fresh.forEach(o => {
                        const opt = document.createElement('option')
                        opt.value = o; opt.textContent = o
                        sel.appendChild(opt)
                    })
                    sel.value = fresh.includes(current) ? current : fresh[0]
                })
            }

            opts.forEach(o => {
                const opt = document.createElement('option')
                opt.value = o; opt.textContent = o
                sel.appendChild(opt)
            })
            sel.value = opts[0] || part.v
            sel.addEventListener('mousedown', e => e.stopPropagation())
            // Handle 'new message' selection
            if (part.opts.includes('__messages__')) {
                sel.addEventListener('change', () => {
                    if (sel.value === 'new message') {
                        const name = prompt('Enter message name:')
                        if (name && name.trim()) {
                            if (!state.messages) state.messages = []
                            if (!state.messages.includes(name.trim())) state.messages.push(name.trim())
                            const opt = document.createElement('option')
                            opt.value = name.trim(); opt.textContent = name.trim()
                            sel.appendChild(opt)
                            sel.value = name.trim()
                            // Refresh events block list if open
                            if (activeCat === 'events') buildBlockList()
                        } else {
                            sel.value = state.messages && state.messages.length ? state.messages[0] : 'new message'
                        }
                    }
                })
            }
            el.appendChild(sel)

        } else if (part.t === 'color') {
            const swatch = document.createElement('input')
            swatch.type      = 'color'
            swatch.value     = part.v
            swatch.className = 'sb-colorpick'
            swatch.addEventListener('mousedown', e => e.stopPropagation())
            el.appendChild(swatch)

        } else if (part.t === 'slot') {
            const slot = document.createElement('span')
            slot.className = 'sb-slot' + (part.k === 'bool' ? ' sb-slot-bool' : '')
            el.appendChild(slot)
        }
    }

    // C-block inner container
    if (def.shape === 'cblock') {
        const inner = document.createElement('div')
        inner.className = 'sb-cinner'
        el.appendChild(inner)
    }

    if (isDraggable) setupBlockDrag(el)
    return el
}

function buildCategoryTabs() {
    const tabs = document.getElementById('cat-tabs')
    tabs.innerHTML = ''
    CATEGORIES.forEach(cat => {
        const col = COLORS[cat.id] || COLORS.motion
        const btn = document.createElement('button')
        btn.className  = 'cat-tab' + (cat.id === activeCat ? ' active' : '')
        btn.textContent = cat.label
        btn.style.background = col.bg
        btn.addEventListener('click', () => {
            activeCat = cat.id
            document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'))
            btn.classList.add('active')
            buildBlockList()
        })
        tabs.appendChild(btn)
    })
}

function buildBlockList() {
    const list = document.getElementById('block-list')
    list.innerHTML = ''
    BLOCKS
        .filter(b => b.cat === activeCat)
        .forEach(def => {
            const el = renderBlockEl(def, true)
            list.appendChild(el)
        })

    // Variable creator
    if (activeCat === 'variable') appendCreator(list, 'variable', state.variables, () => buildBlockList())
    // List creator
    if (activeCat === 'list')     appendCreator(list, 'list',     state.lists,      () => buildBlockList())
    // Message creator (shown in events)
    if (activeCat === 'events')   appendMessageCreator(list, () => buildBlockList())
}

function appendCreator(list, label, arr, refresh) {
    const divider = document.createElement('div')
    divider.style.cssText = 'height:1px;background:#313244;margin:8px 0;'
    list.appendChild(divider)

    // Existing items
    arr.forEach((name, i) => {
        const row = document.createElement('div')
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 6px;background:#252535;border-radius:6px;font-size:12px;color:#cdd6f4;'
        row.innerHTML = `<span style="flex:1">${name}</span>`
        const del = document.createElement('button')
        del.textContent = '✕'
        del.style.cssText = 'background:none;border:none;color:#f38ba8;cursor:pointer;font-size:12px;padding:0 4px;'
        del.addEventListener('click', () => { arr.splice(i, 1); refresh() })
        row.appendChild(del)
        list.appendChild(row)
    })

    // Create new
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:4px;'
    const inp = document.createElement('input')
    inp.type = 'text'
    inp.placeholder = `New ${label}...`
    inp.style.cssText = 'flex:1;background:#1e1e2e;border:1px solid #45475a;border-radius:6px;color:white;padding:4px 8px;font-size:11px;outline:none;'
    const btn = document.createElement('button')
    btn.textContent = '+'
    btn.style.cssText = 'background:#89b4fa;border:none;border-radius:6px;color:#1e1e2e;font-weight:bold;padding:4px 10px;cursor:pointer;font-size:13px;'
    btn.addEventListener('click', () => {
        const v = inp.value.trim()
        if (v && !arr.includes(v)) { arr.push(v); refresh() }
        inp.value = ''
    })
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click() })
    row.appendChild(inp); row.appendChild(btn)
    list.appendChild(row)
}

function appendMessageCreator(list, refresh) {
    if (!state.messages) state.messages = []
    const divider = document.createElement('div')
    divider.style.cssText = 'height:1px;background:#313244;margin:8px 0;'
    list.appendChild(divider)

    const header = document.createElement('div')
    header.style.cssText = 'font-size:10px;color:#a6adc8;text-transform:uppercase;padding:2px 4px;'
    header.textContent = 'Messages'
    list.appendChild(header)

    state.messages.forEach((msg, i) => {
        const row = document.createElement('div')
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 6px;background:#252535;border-radius:6px;font-size:12px;color:#cdd6f4;'
        row.innerHTML = `<span style="flex:1">${msg}</span>`
        const del = document.createElement('button')
        del.textContent = '✕'
        del.style.cssText = 'background:none;border:none;color:#f38ba8;cursor:pointer;font-size:12px;padding:0 4px;'
        del.addEventListener('click', () => { state.messages.splice(i, 1); refresh() })
        row.appendChild(del)
        list.appendChild(row)
    })

    const row = document.createElement('div')
    row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:4px;'
    const inp = document.createElement('input')
    inp.type = 'text'; inp.placeholder = 'New message...'
    inp.style.cssText = 'flex:1;background:#1e1e2e;border:1px solid #45475a;border-radius:6px;color:white;padding:4px 8px;font-size:11px;outline:none;'
    const btn = document.createElement('button')
    btn.textContent = '+'
    btn.style.cssText = 'background:#FFAB19;border:none;border-radius:6px;color:#1e1e2e;font-weight:bold;padding:4px 10px;cursor:pointer;font-size:13px;'
    btn.addEventListener('click', () => {
        const v = inp.value.trim()
        if (v && !state.messages.includes(v)) { state.messages.push(v); refresh() }
        inp.value = ''
    })
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click() })
    row.appendChild(inp); row.appendChild(btn)
    list.appendChild(row)
}
