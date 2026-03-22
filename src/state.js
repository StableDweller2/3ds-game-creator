'use strict'
// Central app state — all modules read/write this object

// The single project background — always exists, cannot be deleted
const DEFAULT_BACKGROUND = {
    id:    'background',
    name:  'Background',
    icon:  '🖼',
    color: '#0a0a1a',
}

const state = {
    sprites:               [],
    background:            { ...DEFAULT_BACKGROUND },  // single background
    activeEntityId:        null,
    activeEntityTab:       'code',
    entityBlockContainers: {},  // { [entityId]: HTMLDivElement }
    messages:              [],  // broadcast/receive message names
    variables:             [],  // variable names
    lists:                 [],  // list names
}

// ── Entity helpers ────────────────────────────────────────────
function getEntityById(id) {
    if (id === 'background') return state.background
    return state.sprites.find(s => s.id === id)
}

function getEntityContainer(id) {
    if (!state.entityBlockContainers[id]) {
        const div = document.createElement('div')
        div.style.cssText = 'position:absolute;inset:0;'
        state.entityBlockContainers[id] = div
    }
    return state.entityBlockContainers[id]
}
