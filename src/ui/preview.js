'use strict'
// Depends on: state.js

function renderPreview() {
    const topScreen = document.getElementById('ds-top-screen')
    topScreen.innerHTML = ''
    const activeBg = state.background
    topScreen.style.background = activeBg ? activeBg.color : '#0a0a1a'

    state.sprites.slice().reverse().forEach((sprite, i) => {
        const el = document.createElement('div')
        el.className  = 'sprite-thumb'
        el.style.left   = sprite.x + 'px'
        el.style.top    = sprite.y + 'px'
        el.style.zIndex = i
        el.innerHTML    = `<span class="sprite-icon">${sprite.icon}</span>`
        makeSpriteMovable(el, sprite)
        topScreen.appendChild(el)
    })
}

function makeSpriteMovable(el, sprite) {
    el.addEventListener('mousedown', e => {
        const rect = document.getElementById('ds-top-screen').getBoundingClientRect()
        const ox   = e.clientX - el.getBoundingClientRect().left
        const oy   = e.clientY - el.getBoundingClientRect().top

        function onMove(e) {
            sprite.x = e.clientX - rect.left - ox
            sprite.y = e.clientY - rect.top  - oy
            el.style.left = sprite.x + 'px'
            el.style.top  = sprite.y + 'px'
            renderSpriteList()
        }
        function onUp() {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        e.preventDefault()
    })
}

function renderFullscreenPreview() {
    const fsTop    = document.getElementById('ds-fs-top-screen')
    const topScreen = document.getElementById('ds-top-screen')
    fsTop.innerHTML = ''

    const activeBg = state.background
    fsTop.style.background = activeBg ? activeBg.color : '#0a0a1a'

    const sw = topScreen.offsetWidth  || 228
    const sh = topScreen.offsetHeight || 120

    state.sprites.slice().reverse().forEach((sprite, i) => {
        const el = document.createElement('div')
        el.style.cssText = `position:absolute;left:${sprite.x*(400/sw)}px;top:${sprite.y*(240/sh)}px;font-size:38px;z-index:${i};user-select:none;`
        el.textContent = sprite.icon
        fsTop.appendChild(el)
    })
}

// Fullscreen overlay toggle
function initFullscreenToggle() {
    const overlay = document.getElementById('ds-fullscreen-overlay')
    document.getElementById('tab-fullscreen-btn').addEventListener('click', () => {
        document.getElementById('tab-fullscreen-btn').classList.add('active')
        document.getElementById('tab-preview-btn').classList.remove('active')
        overlay.classList.add('open')
        renderFullscreenPreview()
    })
    document.getElementById('tab-preview-btn').addEventListener('click', () => {
        document.getElementById('tab-preview-btn').classList.add('active')
        document.getElementById('tab-fullscreen-btn').classList.remove('active')
        overlay.classList.remove('open')
    })
    document.getElementById('ds-close-btn').addEventListener('click', () => {
        overlay.classList.remove('open')
        document.getElementById('tab-preview-btn').classList.add('active')
        document.getElementById('tab-fullscreen-btn').classList.remove('active')
    })
}
