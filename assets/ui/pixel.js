/**
 * Original 5x7 bitmap lettering for display text.
 * Rendered as SVG paths instead of a downloadable font file, so the site
 * keeps working entirely offline and no font service receives any requests.
 */
const glyphs = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    '0': ['01110', '10011', '10101', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
    '6': ['01111', '10000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00001', '11110'],
    ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
    '.': ['00000', '00000', '00000', '00000', '00000', '00110', '00110'],
    ',': ['00000', '00000', '00000', '00000', '00110', '00110', '00100'],
    ':': ['00000', '00110', '00110', '00000', '00110', '00110', '00000'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
    '_': ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
    '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
    '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
    '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
    '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
    '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101']
};
const ns = 'http://www.w3.org/2000/svg';
/** Add an accessible SVG representation of short Latin display text. */
export function pixelText(target, value, pixelSize) {
    const display = value.toUpperCase();
    const width = Math.max(1, display.length * 6 - 1);
    const segments = [];
    for (let i = 0; i < display.length; i++) {
        const bits = glyphs[display[i]] ?? glyphs['?'];
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 5; c++) {
                if (bits[r][c] === '1') {
                    const x = i * 6 + c;
                    segments.push(`M${x} ${r}h1v1h-1z`);
                }
            }
        }
    }
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} 7`);
    svg.setAttribute('width', String(width * pixelSize));
    svg.setAttribute('height', String(7 * pixelSize));
    svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('pixel-svg');
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.width = `${width * pixelSize}px`;
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', segments.join(''));
    path.setAttribute('fill', 'currentColor');
    svg.append(path);
    target.setAttribute('aria-label', value);
    target.replaceChildren(svg);
    target.classList.add('pixel-type');
}
export function applyPixelTypography() {
    const hero = document.querySelector('.hero h1');
    if (hero) {
        hero.setAttribute('aria-label', 'Code, composed.');
        hero.classList.add('pixel-hero');
        hero.replaceChildren();
        const first = document.createElement('span');
        const second = document.createElement('span');
        first.className = 'pixel-line';
        second.className = 'pixel-line pixel-line-second';
        pixelText(first, 'CODE,', 10.8);
        pixelText(second, 'COMPOSED.', 10.8);
        hero.append(first, second);
    }
    const targets = [
        ['.editor-panel .panel-heading h2', 'SOURCE CODE', 3.6],
        ['.studio-panel .panel-heading h2', 'SOUND STUDIO', 3.6],
        ['.section-head h2', 'INSIDE THE COMPOSITION.', 4.25],
        ['.insight-card:nth-child(1) .insight-title h3', 'CODE DNA', 2.75],
        ['.insight-card:nth-child(2) .insight-title h3', 'INSTRUMENT MIXER', 2.75],
        ['.insight-card:nth-child(3) .insight-title h3', 'CODE TO MUSIC', 2.75],
        ['.piano-header h2', 'PIANO ROLL', 2.75],
        ['.footer-brand', 'CODEHARMONY.', 2.25],
    ];
    for (const [selector, label, size] of targets) {
        const node = document.querySelector(selector);
        if (node)
            pixelText(node, label, size);
    }
}
