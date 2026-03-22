'use strict'

function initJoysticks() {
    makeJoystick(
        document.getElementById('circle-pad-stick'),
        document.getElementById('circle-pad-wrap')
    )
    makeJoystick(
        document.getElementById('cstick-stick'),
        document.getElementById('cstick-wrap')
    )
}

function makeJoystick(stick, wrap) {
    const max = wrap.classList.contains('cstick-wrap') ? 8 : 12
    stick.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation()
        const cr = wrap.getBoundingClientRect()
        const cx = cr.left + cr.width  / 2
        const cy = cr.top  + cr.height / 2

        function onMove(e) {
            let dx = e.clientX - cx, dy = e.clientY - cy
            const d = Math.sqrt(dx*dx + dy*dy)
            if (d > max) { dx = dx/d * max; dy = dy/d * max }
            stick.style.transform = `translate(${dx}px, ${dy}px)`
        }
        function onUp() {
            stick.style.transform = 'translate(0,0)'
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    })
}

function initSliders() {
    makeSlider(
        document.getElementById('slider-3d-knob'),
        document.getElementById('label-3d'),
        0
    )
    makeSlider(
        document.getElementById('slider-vol-knob'),
        document.getElementById('label-vol'),
        50
    )
}

function makeSlider(knob, labelEl, startPct) {
    const travel = 56
    knob.style.top = (2 + (1 - startPct / 100) * travel) + 'px'
    if (labelEl) labelEl.textContent = startPct === 0 ? 'off' : startPct + '%'

    knob.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation()
        const startY   = e.clientY
        const startTop = parseInt(knob.style.top) || 6

        function onMove(e) {
            let t = Math.max(2, Math.min(travel + 2, startTop + (e.clientY - startY)))
            knob.style.top = t + 'px'
            if (labelEl) {
                const p = Math.round((1 - (t - 2) / travel) * 100)
                labelEl.textContent = p <= 0 ? 'off' : p + '%'
            }
        }
        function onUp() {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    })
}
