import { analyzeCode } from './analysis/analyzer.js';
import { composeMusic, genreNames, trackNames, getGenreTempoRange } from './music/composer.js';
import { AudioEngine, renderWav } from './audio/engine.js';
import { drawPiano, drawVisualizer } from './ui/visuals.js';
import { applyPixelTypography, pixelText } from './ui/pixel.js';
import { examples } from './data/examples.js';
const el = (id) => document.getElementById(id);
const code = el('code');
const highlight = el('highlight-layer');
const lineNumbers = el('line-numbers');
const langSel = el('language'), exampleSel = el('example'), genreSel = el('genre');
const bpmInput = el('bpm'), barsSel = el('bars'), moodSel = el('mood');
const generateBtn = el('generate'), regenerateBtn = el('regenerate');
const playBtn = el('play'), exportBtn = el('export');
const visualizer = el('visualizer'), piano = el('piano');
const progress = el('progress');
const player = new AudioEngine();
applyPixelTypography();
let analysis = null, composition = null, variation = 0, changed = false, sampleLoaded = true, isExporting = false;
let animationId = 0, visualActive = false, debounceTimer = 0;
const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
const keywords = new Set('def return class if elif else for while in is not and or True False None try except finally with as pass yield import from lambda async await break continue match case function const let var do switch default new catch true false null undefined interface type public private protected static final void int char float double bool boolean String long short auto namespace template typename struct include'.split(' '));
function syntaxHighlight(source) {
    const token = /#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b[A-Za-z_$][\w$]*\b|\b\d+(?:\.\d+)?\b/g;
    let html = '', start = 0;
    let m;
    while ((m = token.exec(source)) !== null) {
        html += escapeHtml(source.slice(start, m.index));
        const t = m[0];
        let cls = '';
        if (t.startsWith('#') || t.startsWith('//') || t.startsWith('/*'))
            cls = 'tok-comment';
        else if ('"\'`'.includes(t[0]))
            cls = 'tok-string';
        else if (/^\d/.test(t))
            cls = 'tok-number';
        else if (keywords.has(t))
            cls = 'tok-key';
        html += cls ? `<span class="${cls}">${escapeHtml(t)}</span>` : escapeHtml(t);
        start = token.lastIndex;
    }
    return html + escapeHtml(source.slice(start)) + '\n';
}
function refreshEditor() {
    const text = code.value;
    const file = document.querySelector('.editor-file');
    if (file)
        file.textContent = { python: 'main.py', javascript: 'main.js', typescript: 'main.ts', c: 'main.c', cpp: 'main.cpp', java: 'Main.java' }[langSel.value] || 'main.txt';
    highlight.innerHTML = syntaxHighlight(text);
    lineNumbers.textContent = Array.from({ length: text.split('\n').length }, (_, i) => String(i + 1)).join('\n');
    el('editor-stats').textContent = `${text.split('\n').length} LINES · ${text.length} CHARS`;
}
function syncScroll() { highlight.scrollTop = code.scrollTop; highlight.scrollLeft = code.scrollLeft; lineNumbers.scrollTop = code.scrollTop; }
function insertAtCursor(text, replaceChars = 0, offset = 0) {
    const start = code.selectionStart, end = code.selectionEnd;
    code.setRangeText(text, start, end + replaceChars, 'end');
    code.selectionStart = code.selectionEnd = start + text.length + offset;
    code.dispatchEvent(new Event('input', { bubbles: true }));
}
code.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
        event.preventDefault();
        const selected = code.value.slice(code.selectionStart, code.selectionEnd);
        if (selected.includes('\n')) {
            const replacement = selected.split('\n').map(line => '    ' + line).join('\n');
            code.setRangeText(replacement, code.selectionStart, code.selectionEnd, 'select');
            code.dispatchEvent(new Event('input'));
        }
        else
            insertAtCursor('    ');
    }
    if (event.key === 'Enter' && !event.shiftKey) {
        const start = code.selectionStart;
        const current = code.value.slice(0, start).split('\n').pop() || '';
        const indent = current.match(/^\s*/)?.[0] || '';
        const extra = langSel.value === 'python' && /:\s*$/.test(current) ? '    ' : '';
        event.preventDefault();
        insertAtCursor('\n' + indent + extra);
    }
    if (['(', '[', '{'].includes(event.key) && code.selectionStart === code.selectionEnd) {
        const close = { '(': ')', '[': ']', '{': '}' };
        const pos = code.selectionStart;
        event.preventDefault();
        insertAtCursor(event.key + close[event.key], 0, -1);
        code.selectionStart = code.selectionEnd = pos + 1;
    }
});
code.addEventListener('input', () => { sampleLoaded = false; changed = true; refreshEditor(); syncScroll(); clearTimeout(debounceTimer); debounceTimer = window.setTimeout(() => { if (composition)
    setStatus('Source code changed. Compose again to hear the updated track.'); }, 350); });
code.addEventListener('scroll', syncScroll);
function loadExample() { code.value = examples[langSel.value][exampleSel.value]; sampleLoaded = true; changed = true; refreshEditor(); syncScroll(); setStatus('Example loaded. Press Compose music to generate a track.'); }
exampleSel.addEventListener('change', loadExample);
langSel.addEventListener('change', () => { if (sampleLoaded)
    loadExample();
else {
    refreshEditor();
    changed = true;
} });
el('clear-code').addEventListener('click', () => { code.value = ''; sampleLoaded = false; changed = true; refreshEditor(); code.focus(); setStatus('Enter source code to compose a track.'); });
function setStatus(text, tone = 'normal') { const node = el('status'); node.textContent = text; node.className = 'inline-status ' + (tone === 'normal' ? '' : tone); }
function options() { return { genre: genreSel.value, mood: moodSel.value, bpm: Number(bpmInput.value), bars: barsSel.value === 'auto' ? 'auto' : Number(barsSel.value), variation }; }
function saveSettings() { try {
    localStorage.setItem('codeharmony-settings', JSON.stringify({ genre: genreSel.value, bpm: bpmInput.value, bars: barsSel.value, mood: moodSel.value, language: langSel.value }));
}
catch { } }
function restoreSettings() { try {
    const p = JSON.parse(localStorage.getItem('codeharmony-settings') || 'null');
    if (!p)
        return;
    const selects = [['genre', genreSel], ['bars', barsSel], ['mood', moodSel], ['language', langSel]];
    for (const [key, node] of selects) {
        if ([...node.options].some(o => o.value === p[key]))
            node.value = p[key];
    }
    if (Number(p.bpm) >= 0 && Number(p.bpm) <= 160)
        bpmInput.value = String(p.bpm);
}
catch { } }
function refreshTempoLabel() { el('bpm-label').textContent = Number(bpmInput.value) === 0 ? 'AUTO' : bpmInput.value + ' BPM'; }
for (const node of [genreSel, barsSel, moodSel, bpmInput])
    node.addEventListener('change', () => { refreshTempoLabel(); saveSettings(); if (composition) {
        changed = true;
        setStatus('Settings changed. Compose again to apply the new arrangement.');
    } });
bpmInput.addEventListener('input', refreshTempoLabel);
langSel.addEventListener('change', saveSettings);
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
function setNow(t) { const total = composition?.durationSeconds || 0; const progressValue = total ? Math.max(0, Math.min(100, t / total * 100)) : 0; el('current-time').textContent = fmt(t); el('total-time').textContent = fmt(total); el('progress-fill').style.width = progressValue + '%'; el('progress-thumb').style.left = progressValue + '%'; progress.setAttribute('aria-valuenow', String(Math.round(progressValue))); if (composition) {
    drawPiano(piano, composition, t * composition.bpm / 60);
} }
function updateTransport(state) { playBtn.textContent = state === 'playing' ? 'Pause' : 'Play'; playBtn.setAttribute('aria-label', state === 'playing' ? 'Pause playback' : 'Play audio'); el('render-badge').textContent = state === 'playing' ? 'PLAYING' : composition ? 'COMPOSED' : 'READY'; if (state === 'playing')
    startVisualizer();
else
    stopVisualizer(); }
player.onStateChange = updateTransport;
player.onTick = setNow;
player.onEnded = () => setStatus('Playback finished. Play again or create a new variation.');
function startVisualizer() { if (visualActive)
    return; visualActive = true; const loop = () => { if (!visualActive)
    return; drawVisualizer(visualizer, player.getAnalyser(), composition?.seed); animationId = requestAnimationFrame(loop); }; loop(); }
function stopVisualizer() { visualActive = false; cancelAnimationFrame(animationId); drawVisualizer(visualizer, null, composition?.seed); }
function renderAnalysis(a, c) {
    const metrics = [['Rhythm Density', c.dna.rhythmDensity], ['Harmonic Richness', c.dna.harmonicComplexity], ['Melodic Variation', c.dna.melodicVariation], ['Energy', c.dna.energy], ['Structural Complexity', c.dna.structuralComplexity]];
    el('dna-list').replaceChildren();
    for (const [name, n] of metrics) {
        const item = document.createElement('div');
        item.className = 'dna-item';
        const row = document.createElement('div');
        row.className = 'dna-row';
        const title = document.createElement('span');
        title.textContent = name;
        const score = document.createElement('strong');
        score.textContent = n + ' / 100';
        row.append(title, score);
        const rail = document.createElement('div');
        rail.className = 'dna-rail';
        const bar = document.createElement('div');
        bar.className = 'dna-bar';
        bar.style.width = n + '%';
        rail.append(bar);
        item.append(row, rail);
        el('dna-list').append(item);
    }
    el('analysis-details').replaceChildren();
    for (const text of [`${a.functionCount} FUNCTIONS`, `${a.loopCount} LOOPS`, `${a.conditionalCount} BRANCHES`, `${a.maxNestingDepth} NESTING`, `${a.effectiveLines} CODE LINES`, a.recursionDetected ? 'RECURSIVE' : 'NON-RECURSIVE']) {
        const chip = document.createElement('span');
        chip.textContent = text;
        el('analysis-details').append(chip);
    }
    el('mapping').replaceChildren();
    for (const s of c.explanations) {
        const entry = document.createElement('div');
        entry.className = 'mapping-entry';
        const dot = document.createElement('span');
        dot.className = 'mapping-dot';
        const p = document.createElement('p');
        p.textContent = s;
        entry.append(dot, p);
        el('mapping').append(entry);
    }
    el('fingerprint').textContent = a.fingerprint;
}
function renderMixer() {
    el('mixer').replaceChildren();
    const mix = player.getMixer();
    if (!composition)
        return;
    for (const track of composition.tracks) {
        const row = document.createElement('div');
        row.className = 'mixer-row';
        const mute = document.createElement('button');
        mute.className = 'mute-track' + (mix[track.id].enabled ? '' : ' off');
        mute.textContent = mix[track.id].enabled ? 'ON' : 'OFF';
        mute.title = 'Toggle mute';
        mute.setAttribute('aria-label', track.name + ' Mute');
        mute.setAttribute('aria-pressed', String(!mix[track.id].enabled));
        const name = document.createElement('span');
        name.className = 'mixer-name';
        name.textContent = trackNames[track.id];
        const volume = document.createElement('input');
        volume.type = 'range';
        volume.className = 'mixer-volume';
        volume.min = '0';
        volume.max = '100';
        volume.value = String(Math.round(mix[track.id].volume * 100));
        volume.setAttribute('aria-label', track.name + ' volume');
        const value = document.createElement('span');
        value.className = 'mixer-value';
        value.textContent = volume.value + '%';
        mute.addEventListener('click', () => { const state = !player.getMixer()[track.id].enabled; player.setTrack(track.id, { enabled: state }); mute.classList.toggle('off', !state); mute.textContent = state ? 'ON' : 'OFF'; mute.setAttribute('aria-pressed', String(!state)); });
        volume.addEventListener('input', () => { player.setTrack(track.id, { volume: Number(volume.value) / 100 }); value.textContent = volume.value + '%'; });
        row.append(mute, name, volume, value);
        el('mixer').append(row);
    }
}
function updateMusic(c) {
    pixelText(el('song-title'), c.title, 2.85);
    el('song-subtitle').textContent = `${genreNames[c.genre]} · ${c.bpm} BPM · ${c.bars} bars · Variation ${c.variation}`;
    el('track-key').textContent = 'KEY ' + c.key;
    el('track-scale').textContent = 'SCALE ' + c.scale.toUpperCase();
    el('piano-label').textContent = `${c.tracks.reduce((n, t) => n + t.notes.length, 0)} NOTE EVENTS / ${c.bars} BARS`;
    playBtn.disabled = false;
    exportBtn.disabled = false;
    regenerateBtn.disabled = false;
    setNow(0);
    renderMixer();
    renderAnalysis(analysis, c);
    drawVisualizer(visualizer, null, c.seed);
}
async function generate(regen = false) {
    if (!code.value.trim()) {
        setStatus('No code found. Enter code or load an example.', 'error');
        return;
    }
    if (code.value.length > 250000) {
        setStatus('Source is too large. Please keep it under 250,000 characters.', 'error');
        return;
    }
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;
    setStatus('Analyzing code and composing your track...');
    try {
        await new Promise(resolve => requestAnimationFrame(() => resolve()));
        variation = regen ? variation + 1 : 0;
        const language = langSel.value;
        analysis = analyzeCode(code.value, language);
        composition = composeMusic(analysis, options());
        player.setComposition(composition);
        changed = false;
        document.documentElement.classList.add('has-composition');
        updateMusic(composition);
        const range = getGenreTempoRange(composition.genre);
        setStatus(`${composition.bars}-bar ${genreNames[composition.genre]} track composed · ${composition.bpm} BPM (${range[0]}–${range[1]} genre range)`, 'success');
    }
    catch (err) {
        console.error(err);
        setStatus('Could not compose music: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
    finally {
        generateBtn.disabled = false;
        regenerateBtn.disabled = composition === null;
    }
}
generateBtn.addEventListener('click', () => void generate(false));
regenerateBtn.addEventListener('click', () => void generate(true));
playBtn.addEventListener('click', async () => { try {
    if (player.getState() === 'playing')
        player.pause();
    else
        await player.play();
}
catch (err) {
    setStatus('Could not start browser audio: ' + (err instanceof Error ? err.message : String(err)), 'error');
} });
el('stop').addEventListener('click', () => player.stop());
el('back-to-start').addEventListener('click', () => { if (composition)
    player.seek(0); });
el('forward').addEventListener('click', () => { if (composition)
    player.seek(player.getCurrentSeconds() + 15); });
el('volume').addEventListener('input', event => { player.setMasterVolume(Number(event.target.value) / 100); });
function seekRatio(ratio) { if (composition)
    player.seek(Math.max(0, Math.min(1, ratio)) * composition.durationSeconds); }
progress.addEventListener('click', event => { const rect = progress.getBoundingClientRect(); seekRatio((event.clientX - rect.left) / rect.width); });
progress.addEventListener('keydown', event => { if (!composition)
    return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    const advance = event.key === 'ArrowRight' ? 5 : -5;
    player.seek(player.getCurrentSeconds() + advance);
}
else if (event.key === 'Home') {
    event.preventDefault();
    player.seek(0);
}
else if (event.key === 'End') {
    event.preventDefault();
    player.seek(composition.durationSeconds);
} });
exportBtn.addEventListener('click', async () => {
    if (!composition || isExporting)
        return;
    isExporting = true;
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting WAV...';
    setStatus('Rendering WAV audio in your browser...');
    try {
        const result = await renderWav(composition, player.getMixer(), player.getVolume());
        if (result.rms < .00006 || result.peak < .0005)
            throw new Error('Rendered audio is nearly silent. Please try again.');
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CodeHarmony_${langSel.value}_${composition.genre}_${composition.fingerprint}_v${composition.variation}.wav`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        setStatus(`WAV download ready · ${(result.blob.size / 1048576).toFixed(1)}MB · Peak ${result.peak.toFixed(2)} · RMS ${result.rms.toFixed(3)}`, 'success');
    }
    catch (err) {
        setStatus('WAV export failed: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
    finally {
        isExporting = false;
        exportBtn.disabled = false;
        exportBtn.textContent = 'Export WAV';
    }
});
const about = el('about-dialog');
for (const id of ['nav-about', 'footer-about'])
    el(id).addEventListener('click', () => about.showModal());
el('nav-examples').addEventListener('click', () => { exampleSel.focus(); document.querySelector('.workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    void generate(false);
} if (event.key === 'Escape' && !about.open) {
    player.stop();
} if (event.code === 'Space' && !event.repeat && !event.ctrlKey && !event.metaKey && !(event.target instanceof HTMLElement && (['TEXTAREA', 'INPUT', 'SELECT', 'BUTTON'].includes(event.target.tagName) || event.target.isContentEditable))) {
    event.preventDefault();
    if (player.getState() === 'playing')
        player.pause();
    else
        void player.play().catch(() => setStatus('Could not start audio playback.', 'error'));
} });
document.addEventListener('visibilitychange', () => { if (document.hidden)
    stopVisualizer();
else if (player.getState() === 'playing')
    startVisualizer(); });
window.addEventListener('resize', () => { drawVisualizer(visualizer, player.getAnalyser(), composition?.seed); drawPiano(piano, composition, player.getCurrentSeconds() * (composition?.bpm || 120) / 60); });
window.addEventListener('pagehide', () => player.destroy());
restoreSettings();
refreshTempoLabel();
loadExample();
changed = false;
refreshEditor();
drawVisualizer(visualizer, null);
drawPiano(piano, null);
